import type { RefundDraft, RefundFormValues } from "../../src/features/refund/refund";
import type { CreateRefundResponse } from "../../src/types";

export const validRefundForm: RefundFormValues = { reason: "quality_issue", otherReason: "", channel: "in_app" };

export const refundDraft: RefundDraft = {
  order_id: "ORD-1",
  staff_id: "STF-001",
  unit_ids: ["U1a", "U2a"],
  refund_delivery_fee: true,
  reason: "quality_issue",
  other_reason: null,
  channel: "original_payment",
  expected_amount: 26.4,
};

export const refundSuccess: CreateRefundResponse = { order_id: "ORD-1", amount_refunded: 26.4 };
