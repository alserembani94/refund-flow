import { ApiError, RefundAmountMismatchError } from "../../lib/errors";
import { sameAmount, sumMoney } from "../../lib/money";
import {
  REFUND_CHANNELS,
  REFUND_REASONS,
  type CreateRefundRequest,
  type CreateRefundResponse,
  type Order,
} from "../../types";
import { findOrder, refunds } from "../db";
import { logged, simulateNetwork } from "../network";
import { getMockSettings, updateMockSettings } from "../settings";

const SIMULATED_TOTAL_DRIFT = 1;

const responsesByRequestKey = new Map<string, CreateRefundResponse>();

function findUnit(order: Order, unitId: string) {
  for (const line of order.items) {
    const unit = line.units.find((candidate) => candidate.unit_id === unitId);
    if (unit) return { line, unit };
  }
  throw new ApiError(
    404,
    `Unit ${unitId} is not part of order ${order.order_id}.`,
  );
}

function isFullyRefunded(order: Order) {
  const deliveryFeeSettled =
    order.delivery_fee === 0 || order.delivery_fee_status === "refunded";
  return (
    deliveryFeeSettled &&
    order.items.every((line) =>
      line.units.every((unit) => unit.status === "refunded"),
    )
  );
}

/**
 * POST /orders/:orderId/refunds
 *
 * Recomputes the amount from stored prices instead of trusting the client, so the
 * returned `amount_refunded` can be tallied against what the staff member reviewed.
 */
export function createRefund(
  request: CreateRefundRequest,
): Promise<CreateRefundResponse> {
  return logged(
    "createRefund",
    `POST /orders/${request.order_id}/refunds`,
    request,
    () => processRefund(request),
  );
}

async function processRefund(
  request: CreateRefundRequest,
): Promise<CreateRefundResponse> {
  await simulateNetwork("createRefund");

  const replay = responsesByRequestKey.get(request.refund_request_key);
  if (replay) return { ...replay };

  const order = findOrder(request.order_id);

  if (!REFUND_REASONS.includes(request.reason))
    throw new ApiError(400, "Invalid refund reason.");
  if (!REFUND_CHANNELS.includes(request.channel))
    throw new ApiError(400, "Invalid refund channel.");
  const otherReason =
    request.reason === "other" ? request.other_reason?.trim() || null : null;
  if (request.reason === "other" && !otherReason) {
    throw new ApiError(400, 'other_reason is required when reason is "other".');
  }
  if (request.unit_ids.length === 0 && !request.refund_delivery_fee) {
    throw new ApiError(400, "Nothing selected to refund.");
  }
  if (new Set(request.unit_ids).size !== request.unit_ids.length) {
    throw new ApiError(400, "Duplicate unit in refund request.");
  }
  if (
    !Number.isFinite(request.expected_amount) ||
    request.expected_amount < 0
  ) {
    throw new ApiError(400, "expected_amount must be a non-negative number.");
  }

  const matches = request.unit_ids.map((unitId) => {
    const match = findUnit(order, unitId);
    if (match.unit.status !== "paid")
      throw new ApiError(
        409,
        `${match.line.name} (${unitId}) was already refunded.`,
      );
    return match;
  });
  if (request.refund_delivery_fee && order.delivery_fee_status !== "paid") {
    throw new ApiError(409, "The delivery fee was already refunded.");
  }

  const refundUnits = matches.map(({ line, unit }) => ({
    unit_id: unit.unit_id,
    unit_price: line.unit_price,
    addon_total_price: sumMoney(
      unit.addons
        .filter((addon) => addon.status === "paid")
        .map((addon) => addon.unit_price),
    ),
  }));
  const refundDeliveryFee = request.refund_delivery_fee
    ? order.delivery_fee
    : 0;
  let amount = sumMoney([
    ...refundUnits.flatMap((u) => [u.unit_price, u.addon_total_price]),
    refundDeliveryFee,
  ]);

  // Simulates the server pricing differently from the client (changed rules, stale data, a bug).
  const { refundTotalCheck } = getMockSettings();
  if (refundTotalCheck !== "match") {
    if (refundTotalCheck === "mismatch_once")
      updateMockSettings({ refundTotalCheck: "match" });
    amount = sumMoney([amount, SIMULATED_TOTAL_DRIFT]);
  }

  // Refuse before any money moves if the staff member reviewed a different total.
  if (!sameAmount(amount, request.expected_amount)) {
    throw new RefundAmountMismatchError(request.expected_amount, amount);
  }

  // Validation passed — commit.
  for (const { unit } of matches) {
    unit.status = "refunded";
    for (const addon of unit.addons) addon.status = "refunded";
  }
  if (request.refund_delivery_fee) order.delivery_fee_status = "refunded";
  if (isFullyRefunded(order)) order.status = "refunded";

  refunds.push({
    refund_id: `RF-${String(refunds.length + 1).padStart(5, "0")}`,
    staff_id: request.staff_id,
    order_id: order.order_id,
    refund_delivery_fee: refundDeliveryFee,
    created_at: new Date().toISOString(),
    refund_status: "complete",
    reason: request.reason,
    channel: request.channel,
    amount_refunded: amount,
    other_reason: otherReason,
    units: refundUnits,
  });

  const response: CreateRefundResponse = {
    order_id: order.order_id,
    amount_refunded: amount,
  };
  responsesByRequestKey.set(request.refund_request_key, response);
  return { ...response };
}
