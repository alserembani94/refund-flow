import { describe, expect, it } from "vitest";
import { CURRENT_STAFF_ID, EMPTY_REFUND_FORM, toRefundDraft } from "../../../src/features/refund/refund";
import { makeOrder, unitIds } from "../../fixtures/order";
import { validRefundForm } from "../../fixtures/refund";

describe("toRefundDraft", () => {
  it("returns null until a reason and channel are chosen", () => {
    expect(toRefundDraft(makeOrder(), unitIds("U2a"), false, EMPTY_REFUND_FORM)).toBeNull();
    expect(toRefundDraft(makeOrder(), unitIds("U2a"), false, { ...validRefundForm, channel: "" })).toBeNull();
  });

  it("builds the request with the reviewed total as expected_amount", () => {
    expect(toRefundDraft(makeOrder(), unitIds("U1a", "U2a"), true, validRefundForm)).toEqual({
      order_id: "ORD-1",
      staff_id: CURRENT_STAFF_ID,
      unit_ids: ["U1a", "U2a"],
      refund_delivery_fee: true,
      reason: "quality_issue",
      other_reason: null,
      channel: "in_app",
      expected_amount: 35.9,
    });
  });

  it("sends a trimmed other_reason only when the reason is other", () => {
    const other = toRefundDraft(makeOrder(), unitIds("U2a"), false, {
      ...validRefundForm,
      reason: "other",
      otherReason: "  Spilled in transit  ",
    });
    const notOther = toRefundDraft(makeOrder(), unitIds("U2a"), false, {
      ...validRefundForm,
      otherReason: "leftover text",
    });

    expect(other?.other_reason).toBe("Spilled in transit");
    expect(notOther?.other_reason).toBeNull();
  });
});
