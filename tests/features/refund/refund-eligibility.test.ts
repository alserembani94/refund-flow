import { describe, expect, it } from "vitest";
import {
  canRefundDeliveryFee,
  getRefundableSelection,
  hasRefundableItems,
} from "../../../src/features/refund/refund";
import { line, makeOrder, unit, unitIds } from "../../fixtures/order";

describe("canRefundDeliveryFee", () => {
  it("allows a paid, non-zero delivery fee", () => {
    expect(canRefundDeliveryFee(makeOrder())).toBe(true);
  });

  it("blocks an already refunded delivery fee", () => {
    expect(canRefundDeliveryFee(makeOrder({ delivery_fee_status: "refunded" }))).toBe(false);
  });

  it("blocks a free delivery", () => {
    expect(canRefundDeliveryFee(makeOrder({ delivery_fee: 0 }))).toBe(false);
  });
});

describe("hasRefundableItems", () => {
  it("is false once every unit and the delivery fee are refunded", () => {
    const fullyRefunded = makeOrder({
      status: "refunded",
      delivery_fee_status: "refunded",
      items: [line("L1", "Latte", 15.9, [unit("U1", [], "refunded")])],
    });

    expect(hasRefundableItems(fullyRefunded)).toBe(false);
  });

  it("is true when only the delivery fee is left", () => {
    const onlyFee = makeOrder({ items: [line("L1", "Latte", 15.9, [unit("U1", [], "refunded")])] });

    expect(hasRefundableItems(onlyFee)).toBe(true);
  });
});

describe("getRefundableSelection", () => {
  it("drops units that are refunded or not on the order", () => {
    const selection = getRefundableSelection(makeOrder(), unitIds("U1a", "U1c", "NOPE"), false);

    expect([...selection.unitIds]).toEqual(["U1a"]);
  });

  it("drops the delivery fee once it has been refunded", () => {
    const selection = getRefundableSelection(makeOrder({ delivery_fee_status: "refunded" }), unitIds("U2a"), true);

    expect(selection.refundDeliveryFee).toBe(false);
  });

  it("keeps a selection that is still valid", () => {
    const selection = getRefundableSelection(makeOrder(), unitIds("U1a", "U2a"), true);

    expect([...selection.unitIds]).toEqual(["U1a", "U2a"]);
    expect(selection.refundDeliveryFee).toBe(true);
  });
});
