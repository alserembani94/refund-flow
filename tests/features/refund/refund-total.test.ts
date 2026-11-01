import { describe, expect, it } from "vitest";
import { calculateRefundTotal } from "../../../src/features/refund/refund";
import { addon, line, makeOrder, unit, unitIds } from "../../fixtures/order";

describe("calculateRefundTotal", () => {
  it("adds the selected units and the delivery fee", () => {
    expect(calculateRefundTotal(makeOrder(), unitIds("U1a", "U2a"), true)).toBe(35.9); // 21.40 + 9.50 + 5.00
  });

  it("leaves the delivery fee out unless it is selected", () => {
    expect(calculateRefundTotal(makeOrder(), unitIds("U2a"), false)).toBe(9.5);
  });

  it("is zero when nothing is selected", () => {
    expect(calculateRefundTotal(makeOrder(), unitIds(), false)).toBe(0);
  });

  it("ignores unit ids that are not on the order", () => {
    expect(calculateRefundTotal(makeOrder(), unitIds("U2a", "NOPE"), false)).toBe(9.5);
  });

  it("does not drift with floating-point prices", () => {
    const cheap = makeOrder({
      delivery_fee: 0.1,
      items: [line("L1", "Sugar", 0.1, [unit("a", [addon("x", 0.2)]), unit("b"), unit("c")])],
    });

    // Plain float addition gives 0.30000000000000004 + 0.1 + 0.1 + 0.1.
    expect(calculateRefundTotal(cheap, unitIds("a", "b", "c"), true)).toBe(0.6);
  });
});
