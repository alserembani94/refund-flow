import type { Addon, Line, Order, PaymentStatus, Unit } from "../../src/types";

export const addon = (
  addon_id: string,
  unit_price: number,
  status: PaymentStatus = "paid",
): Addon => ({
  addon_id,
  name: addon_id,
  unit_price,
  status,
});

export const unit = (
  unit_id: string,
  addons: Addon[] = [],
  status: PaymentStatus = "paid",
): Unit => ({
  unit_id,
  status,
  addons,
});

export const line = (
  line_id: string,
  name: string,
  unit_price: number,
  units: Unit[],
): Line => ({
  line_id,
  name,
  unit_price,
  units,
});

export function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    order_id: "ORD-1",
    status: "completed",
    staff_id: "STF-9",
    currency: "MYR",
    delivery_fee: 5,
    delivery_fee_status: "paid",
    created_at: "2026-11-01T00:00:00Z",
    items: [
      line("L1", "Latte", 15.9, [
        unit("U1a", [addon("oat", 2.5), addon("shot", 3)]),
        unit("U1b", [addon("syrup", 2, "refunded")]),
        unit("U1c", [addon("foam", 3.5, "refunded")], "refunded"),
      ]),
      line("L2", "Croissant", 9.5, [unit("U2a")]),
    ],
    ...overrides,
  };
}

export const unitIds = (...ids: string[]): ReadonlySet<string> => new Set(ids);
