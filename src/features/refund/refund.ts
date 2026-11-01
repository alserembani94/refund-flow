import { sumMoney } from "../../lib/money";
import type {
  Addon,
  CreateRefundRequest,
  Line,
  Order,
  RefundChannel,
  RefundReason,
  Unit,
} from "../../types";

export const CURRENT_STAFF_ID = "STF-001";

export const REASON_LABELS: Record<RefundReason, string> = {
  wrong_item: "Wrong item",
  missing_item: "Missing item",
  quality_issue: "Quality issue",
  late_delivery: "Late delivery",
  other: "Other",
};

export const CHANNEL_LABELS: Record<RefundChannel, string> = {
  original_payment: "Original payment method",
  in_app: "In-app credit",
};

export type UnitEntry = {
  line: Line;
  unit: Unit;
  label: string;
  paidAddons: Addon[];
  amount: number;
};

export function getUnitEntries(order: Order): UnitEntry[] {
  return order.items.flatMap((line) =>
    line.units.map((unit, index) => {
      const paidAddons = unit.addons.filter((addon) => addon.status === "paid");
      return {
        line,
        unit,
        label:
          line.units.length > 1
            ? `${line.name} (${index + 1} of ${line.units.length})`
            : line.name,
        paidAddons,
        amount: sumMoney([
          line.unit_price,
          ...paidAddons.map((addon) => addon.unit_price),
        ]),
      };
    }),
  );
}

export function canRefundDeliveryFee(order: Order) {
  return order.delivery_fee > 0 && order.delivery_fee_status === "paid";
}

export function hasRefundableItems(order: Order) {
  return (
    canRefundDeliveryFee(order) ||
    getUnitEntries(order).some(({ unit }) => unit.status === "paid")
  );
}

/** Drops anything no longer refundable, e.g. after a reload shows someone else refunded it. */
export function getRefundableSelection(
  order: Order,
  unitIds: ReadonlySet<string>,
  refundDeliveryFee: boolean,
) {
  const paidUnitIds = new Set(
    getUnitEntries(order)
      .filter(({ unit }) => unit.status === "paid")
      .map(({ unit }) => unit.unit_id),
  );
  return {
    unitIds: new Set([...unitIds].filter((unitId) => paidUnitIds.has(unitId))),
    refundDeliveryFee: refundDeliveryFee && canRefundDeliveryFee(order),
  };
}

export function calculateRefundTotal(
  order: Order,
  unitIds: ReadonlySet<string>,
  refundDeliveryFee: boolean,
) {
  const units = getUnitEntries(order).filter(({ unit }) =>
    unitIds.has(unit.unit_id),
  );
  return sumMoney([
    ...units.map((entry) => entry.amount),
    refundDeliveryFee ? order.delivery_fee : 0,
  ]);
}

export type RefundFormValues = {
  reason: RefundReason | "";
  otherReason: string;
  channel: RefundChannel | "";
};

export type RefundFormErrors = Partial<Record<keyof RefundFormValues, string>>;

export const EMPTY_REFUND_FORM: RefundFormValues = {
  reason: "",
  otherReason: "",
  channel: "",
};

export const OTHER_REASON_MAX_LENGTH = 500;

export function validateRefundForm(values: RefundFormValues): RefundFormErrors {
  const errors: RefundFormErrors = {};
  if (!values.reason) errors.reason = "Select a reason.";
  else if (values.reason === "other" && !values.otherReason.trim())
    errors.otherReason = "Describe the reason.";
  if (!values.channel) errors.channel = "Select a refund channel.";
  return errors;
}

export type RefundDraft = Omit<CreateRefundRequest, "refund_request_key">;

/** Returns null until the form has everything the API needs. */
export function toRefundDraft(
  order: Order,
  unitIds: ReadonlySet<string>,
  refundDeliveryFee: boolean,
  values: RefundFormValues,
): RefundDraft | null {
  if (!values.reason || !values.channel) return null;
  return {
    order_id: order.order_id,
    staff_id: CURRENT_STAFF_ID,
    unit_ids: [...unitIds],
    refund_delivery_fee: refundDeliveryFee,
    reason: values.reason,
    other_reason: values.reason === "other" ? values.otherReason.trim() : null,
    channel: values.channel,
    expected_amount: calculateRefundTotal(order, unitIds, refundDeliveryFee),
  };
}
