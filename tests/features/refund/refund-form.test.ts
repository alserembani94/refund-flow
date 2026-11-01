import { describe, expect, it } from "vitest";
import { EMPTY_REFUND_FORM, validateRefundForm } from "../../../src/features/refund/refund";
import { validRefundForm } from "../../fixtures/refund";

describe("validateRefundForm", () => {
  it("requires a reason and a channel", () => {
    expect(validateRefundForm(EMPTY_REFUND_FORM)).toEqual({
      reason: "Select a reason.",
      channel: "Select a refund channel.",
    });
  });

  it("requires a written reason when the reason is other", () => {
    expect(validateRefundForm({ ...validRefundForm, reason: "other", otherReason: "   " })).toEqual({
      otherReason: "Describe the reason.",
    });
  });

  it("accepts a complete form", () => {
    expect(validateRefundForm(validRefundForm)).toEqual({});
    expect(validateRefundForm({ ...validRefundForm, reason: "other", otherReason: "Spilled" })).toEqual({});
  });
});
