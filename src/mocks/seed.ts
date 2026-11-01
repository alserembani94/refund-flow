import type { Addon, Line, Order, PaymentStatus, Unit } from "../types";

const addon = (
  addon_id: string,
  name: string,
  unit_price: number,
  status: PaymentStatus = "paid",
): Addon => ({
  addon_id,
  name,
  unit_price,
  status,
});

const unit = (
  unit_id: string,
  addons: Addon[] = [],
  status: PaymentStatus = "paid",
): Unit => ({
  unit_id,
  status,
  addons,
});

const line = (
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

export function createSeedOrders(): Order[] {
  return [
    {
      order_id: "ORD-10421",
      status: "completed",
      staff_id: "STF-014",
      currency: "MYR",
      delivery_fee: 5,
      delivery_fee_status: "paid",
      created_at: "2026-11-01T03:42:00Z",
      items: [
        line("L-10421-1", "Iced Caramel Latte", 15.9, [
          unit("U-10421-1a", [
            addon("A-10421-1", "Oat milk", 2.5),
            addon("A-10421-2", "Extra shot", 3),
          ]),
          unit("U-10421-1b"),
        ]),
        line("L-10421-2", "Butter Croissant", 9.5, [
          unit("U-10421-2a", [addon("A-10421-3", "Warmed", 0)]),
          unit("U-10421-2b"),
        ]),
      ],
    },
    {
      order_id: "ORD-10420",
      status: "completed",
      staff_id: "STF-014",
      currency: "MYR",
      delivery_fee: 6.5,
      delivery_fee_status: "paid",
      created_at: "2026-11-01T02:15:00Z",
      items: [
        line("L-10420-1", "Flat White", 13.9, [
          unit("U-10420-1a", [
            addon("A-10420-1", "Almond milk", 2.5),
            addon("A-10420-2", "Extra shot", 3),
          ]),
        ]),
        line("L-10420-2", "Banana Bread", 8.9, [unit("U-10420-2a")]),
      ],
    },
    {
      order_id: "ORD-10418",
      status: "completed",
      staff_id: "STF-022",
      currency: "MYR",
      delivery_fee: 4,
      delivery_fee_status: "paid",
      created_at: "2026-10-31T13:05:00Z",
      items: [
        line("L-10418-1", "Americano", 10.9, [
          unit("U-10418-1a", [addon("A-10418-1", "Extra shot", 3)]),
          unit(
            "U-10418-1b",
            [addon("A-10418-2", "Extra shot", 3, "refunded")],
            "refunded",
          ),
          unit("U-10418-1c"),
        ]),
        line("L-10418-2", "Chocolate Chip Cookie", 6.5, [unit("U-10418-2a")]),
      ],
    },
    {
      order_id: "ORD-10415",
      status: "refunded",
      staff_id: "STF-022",
      currency: "MYR",
      delivery_fee: 4.5,
      delivery_fee_status: "refunded",
      created_at: "2026-10-31T09:48:00Z",
      items: [
        line("L-10415-1", "Cappuccino", 13.9, [
          unit(
            "U-10415-1a",
            [addon("A-10415-1", "Vanilla syrup", 2, "refunded")],
            "refunded",
          ),
          unit("U-10415-1b", [], "refunded"),
        ]),
      ],
    },
    {
      order_id: "ORD-10412",
      status: "completed",
      staff_id: "STF-014",
      currency: "MYR",
      delivery_fee: 7,
      delivery_fee_status: "refunded",
      created_at: "2026-10-30T11:20:00Z",
      items: [
        line("L-10412-1", "Matcha Latte", 16.9, [
          unit("U-10412-1a", [addon("A-10412-1", "Oat milk", 2.5)]),
        ]),
        line("L-10412-2", "Blueberry Muffin", 8.5, [unit("U-10412-2a")]),
      ],
    },
    {
      order_id: "ORD-10409",
      status: "completed",
      staff_id: "STF-031",
      currency: "MYR",
      delivery_fee: 8,
      delivery_fee_status: "paid",
      created_at: "2026-10-30T07:02:00Z",
      items: [
        line("L-10409-1", "Spanish Latte", 15.9, [
          unit("U-10409-1a", [
            addon("A-10409-1", "Extra shot", 3),
            addon("A-10409-2", "Large size", 2),
          ]),
        ]),
        line("L-10409-2", "Cold Brew", 14.5, [
          unit("U-10409-2a", [addon("A-10409-3", "Sweet cream foam", 3.5)]),
          unit("U-10409-2b"),
          unit("U-10409-2c"),
        ]),
        line("L-10409-3", "Almond Croissant", 11.9, [
          unit("U-10409-3a"),
          unit("U-10409-3b"),
        ]),
      ],
    },
    {
      order_id: "ORD-10405",
      status: "completed",
      staff_id: "STF-031",
      currency: "MYR",
      delivery_fee: 3.5,
      delivery_fee_status: "paid",
      created_at: "2026-10-29T14:37:00Z",
      items: [
        line("L-10405-1", "Mocha", 14.9, [
          unit("U-10405-1a", [
            addon("A-10405-1", "Whipped cream", 1.5),
            addon("A-10405-2", "Hazelnut syrup", 2),
          ]),
          unit("U-10405-1b", [addon("A-10405-3", "Whipped cream", 1.5)]),
        ]),
      ],
    },
    {
      order_id: "ORD-10401",
      status: "completed",
      staff_id: "STF-022",
      currency: "MYR",
      delivery_fee: 6,
      delivery_fee_status: "paid",
      created_at: "2026-10-29T04:10:00Z",
      items: [
        line("L-10401-1", "Iced Long Black", 11.9, [
          unit("U-10401-1a", [
            addon("A-10401-1", "Extra shot", 3, "refunded"),
            addon("A-10401-2", "Less ice", 0),
          ]),
        ]),
        line("L-10401-2", "Tuna Melt Sandwich", 16.5, [unit("U-10401-2a")]),
      ],
    },
    {
      order_id: "ORD-10398",
      status: "completed",
      staff_id: "STF-031",
      currency: "MYR",
      delivery_fee: 9,
      delivery_fee_status: "paid",
      created_at: "2026-10-28T01:30:00Z",
      items: [
        line("L-10398-1", "Iced Latte", 13.9, [
          unit("U-10398-1a", [addon("A-10398-1", "Oat milk", 2.5)]),
          unit(
            "U-10398-1b",
            [addon("A-10398-2", "Oat milk", 2.5, "refunded")],
            "refunded",
          ),
          unit("U-10398-1c"),
          unit("U-10398-1d", [addon("A-10398-3", "Extra shot", 3)]),
        ]),
        line("L-10398-2", "Cappuccino", 13.9, [
          unit("U-10398-2a"),
          unit(
            "U-10398-2b",
            [addon("A-10398-4", "Hazelnut syrup", 2, "refunded")],
            "refunded",
          ),
        ]),
        line("L-10398-3", "Ham & Cheese Croissant", 14.9, [
          unit("U-10398-3a"),
          unit("U-10398-3b"),
        ]),
        line("L-10398-4", "Chocolate Chip Cookie", 6.5, [
          unit("U-10398-4a"),
          unit("U-10398-4b"),
          unit("U-10398-4c"),
        ]),
      ],
    },
    {
      order_id: "ORD-10395",
      status: "completed",
      staff_id: "STF-014",
      currency: "MYR",
      delivery_fee: 5.5,
      delivery_fee_status: "refunded",
      created_at: "2026-10-27T10:12:00Z",
      items: [
        line("L-10395-1", "Cold Brew", 14.5, [
          unit(
            "U-10395-1a",
            [addon("A-10395-1", "Sweet cream foam", 3.5, "refunded")],
            "refunded",
          ),
          unit("U-10395-1b", [addon("A-10395-2", "Sweet cream foam", 3.5)]),
        ]),
        line("L-10395-2", "Banana Bread", 8.9, [unit("U-10395-2a")]),
        line("L-10395-3", "Blueberry Muffin", 8.5, [unit("U-10395-3a")]),
      ],
    },
    {
      order_id: "ORD-10392",
      status: "completed",
      staff_id: "STF-022",
      currency: "MYR",
      delivery_fee: 6,
      delivery_fee_status: "paid",
      created_at: "2026-10-26T06:45:00Z",
      items: [
        line("L-10392-1", "Mocha", 14.9, [
          unit("U-10392-1a", [
            addon("A-10392-1", "Whipped cream", 1.5, "refunded"),
            addon("A-10392-2", "Extra shot", 3),
          ]),
          unit("U-10392-1b", [addon("A-10392-3", "Whipped cream", 1.5)]),
        ]),
        line("L-10392-2", "Tuna Melt Sandwich", 16.5, [
          unit("U-10392-2a", [], "refunded"),
        ]),
        line("L-10392-3", "Butter Croissant", 9.5, [
          unit(
            "U-10392-3a",
            [addon("A-10392-4", "Warmed", 0, "refunded")],
            "refunded",
          ),
          unit(
            "U-10392-3b",
            [addon("A-10392-5", "Warmed", 0, "refunded")],
            "refunded",
          ),
        ]),
        line("L-10392-4", "Matcha Latte", 16.9, [unit("U-10392-4a")]),
      ],
    },
  ];
}
