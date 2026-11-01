import { Button } from "../../components/Button";
import { ErrorState, LoadingState } from "../../components/States";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDateTime } from "../../lib/date";
import type { OrderSummary } from "../../types";

type OrdersTableProps = {
  orders?: OrderSummary[];
  isLoading: boolean;
  error?: Error;
  onRetry: () => void;
  onOpenOrder: (orderId: string) => void;
};

export function OrdersTable({ orders, isLoading, error, onRetry, onOpenOrder }: OrdersTableProps) {
  if (!orders) {
    return isLoading ? (
      <LoadingState label="Loading orders…" />
    ) : (
      <ErrorState title="Couldn't load orders." error={error} onRetry={onRetry} />
    );
  }

  return (
    <>
      {error && !isLoading && (
        <div
          role="alert"
          className="flex items-center justify-between gap-4 border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700"
        >
          <span>Couldn't refresh orders — showing the last loaded list. {error.message}</span>
          <button type="button" onClick={onRetry} className="font-medium underline">
            Retry
          </button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Order ID</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => (
              <tr
                key={order.order_id}
                onClick={() => onOpenOrder(order.order_id)}
                className="cursor-pointer hover:bg-slate-50"
              >
                <td className="px-4 py-3 font-mono font-medium whitespace-nowrap">{order.order_id}</td>
                <td className="px-4 py-3 whitespace-nowrap text-slate-600">{formatDateTime(order.created_at)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenOrder(order.order_id);
                    }}
                  >
                    {order.status === "completed" ? "Refund" : "View"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="px-4 py-12 text-center text-sm text-slate-500">No orders yet.</p>}
      </div>
    </>
  );
}
