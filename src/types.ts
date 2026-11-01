export type Currency = "MYR";
export type PaymentStatus = "paid" | "refunded";
export type OrderStatus = "completed" | "refunded";

export const REFUND_REASONS = [
  "wrong_item",
  "missing_item",
  "quality_issue",
  "late_delivery",
  "other",
] as const;
export type RefundReason = (typeof REFUND_REASONS)[number];

export const REFUND_CHANNELS = ["original_payment", "in_app"] as const;
export type RefundChannel = (typeof REFUND_CHANNELS)[number];

export type RefundStatus = "complete" | "pending" | "failed" | "cancelled";

export type Item = {
  name: string;
  unit_price: number;
};

export type Addon = {
  addon_id: string;
  status: PaymentStatus;
} & Item;

export type Unit = {
  unit_id: string;
  status: PaymentStatus;
  addons: Addon[];
};

export type Line = {
  line_id: string;
  units: Unit[];
} & Item;

export type Order = {
  order_id: string;
  status: OrderStatus;
  staff_id: string;
  currency: Currency;
  delivery_fee: number;
  delivery_fee_status: PaymentStatus;
  created_at: string;
  items: Line[];
};

export type OrderSummary = Pick<Order, "order_id" | "status" | "created_at">;

export type Refund = {
  refund_id: string;
  staff_id: string;
  order_id: string;
  refund_delivery_fee: number;
  created_at: string;
  refund_status: RefundStatus;
  reason: RefundReason;
  channel: RefundChannel;
  amount_refunded: number;
  other_reason: string | null;
  units: {
    unit_id: string;
    unit_price: number;
    addon_total_price: number;
  }[];
};

export type CreateRefundRequest = {
  order_id: string;
  staff_id: string;
  unit_ids: string[];
  refund_delivery_fee: boolean;
  reason: RefundReason;
  other_reason: string | null;
  channel: RefundChannel;
  expected_amount: number;
  refund_request_key: string;
};

export type CreateRefundResponse = Pick<Refund, "order_id" | "amount_refunded">;
