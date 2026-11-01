import { ApiError } from "../lib/errors";
import type { Refund } from "../types";
import { createSeedOrders } from "./seed";

export const orders = createSeedOrders();
export const refunds: Refund[] = [];

export function findOrder(orderId: string) {
  const order = orders.find((candidate) => candidate.order_id === orderId);
  if (!order) throw new ApiError(404, `Order ${orderId} not found.`);
  return order;
}
