import type { Order, OrderSummary } from "../../types";
import { findOrder, orders } from "../db";
import { logged, simulateNetwork } from "../network";

/** GET /orders */
export function listOrders(signal?: AbortSignal): Promise<OrderSummary[]> {
  return logged("listOrders", "GET /orders", undefined, async () => {
    await simulateNetwork("listOrders", signal);
    return orders
      .map(({ order_id, status, created_at }) => ({ order_id, status, created_at }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  });
}

/** GET /orders/:orderId */
export function getOrder(orderId: string, signal?: AbortSignal): Promise<Order> {
  return logged("getOrder", `GET /orders/${orderId}`, undefined, async () => {
    await simulateNetwork("getOrder", signal);
    return structuredClone(findOrder(orderId));
  });
}
