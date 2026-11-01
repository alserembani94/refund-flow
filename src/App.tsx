import { useState } from "react";
import { Button } from "./components/Button";
import { Spinner } from "./components/Spinner";
import { Toasts, type Toast } from "./components/Toasts";
import { OrdersTable } from "./features/orders/OrdersTable";
import { RefundModal } from "./features/refund/RefundModal";
import { listOrders } from "./api/order";
import { formatMoney } from "./lib/money";
import { useQuery } from "./lib/useQuery";
import type { CreateRefundResponse } from "./types";

function App() {
  const orders = useQuery(listOrders);
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (toast: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { ...toast, id }]);
  };
  const dismissToast = (id: string) => setToasts((current) => current.filter((toast) => toast.id !== id));

  // A total mismatch never reaches here: the server rejects it with a 409 before refunding.
  const handleRefunded = (result: CreateRefundResponse) => {
    setOpenOrderId(null);
    orders.reload();
    showToast({
      tone: "success",
      title: `Refunded ${formatMoney(result.amount_refunded)}`,
      message: `Order ${result.order_id}`,
    });
  };

  return (
    <div className="min-h-dvh bg-slate-100 text-slate-900">
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Internal · Support</p>
            <h1 className="text-2xl font-semibold">Orders</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {orders.isLoading && orders.data && (
              <span role="status" className="flex items-center gap-1.5 text-sm text-slate-500">
                <Spinner /> Refreshing…
              </span>
            )}
            <Button onClick={orders.reload} disabled={orders.isLoading}>
              Refresh
            </Button>
          </div>
        </header>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <OrdersTable
            orders={orders.data}
            isLoading={orders.isLoading}
            error={orders.error}
            onRetry={orders.reload}
            onOpenOrder={setOpenOrderId}
          />
        </div>
      </main>

      {openOrderId && (
        <RefundModal
          key={openOrderId}
          orderId={openOrderId}
          onClose={() => setOpenOrderId(null)}
          onRefunded={handleRefunded}
        />
      )}
      <Toasts toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
