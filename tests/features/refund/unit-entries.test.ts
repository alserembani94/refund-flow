import { describe, expect, it } from "vitest";
import { getUnitEntries } from "../../../src/features/refund/refund";
import { makeOrder } from "../../fixtures/order";

describe("getUnitEntries", () => {
  it("numbers units only when a line has more than one", () => {
    expect(getUnitEntries(makeOrder()).map((entry) => entry.label)).toEqual([
      "Latte (1 of 3)",
      "Latte (2 of 3)",
      "Latte (3 of 3)",
      "Croissant",
    ]);
  });

  it("prices a unit as its line price plus its still-paid addons", () => {
    const [withAddons, withRefundedAddon] = getUnitEntries(makeOrder());

    expect(withAddons.amount).toBe(21.4); // 15.90 + 2.50 + 3.00
    expect(withRefundedAddon.paidAddons).toEqual([]);
    expect(withRefundedAddon.amount).toBe(15.9);
  });
});
