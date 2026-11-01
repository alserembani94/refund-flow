import type { ReactNode } from "react";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDateTime } from "../../lib/date";
import { formatMoney } from "../../lib/money";
import type { Currency, Order } from "../../types";
import { getUnitEntries, hasRefundableItems, type UnitEntry } from "./refund";

// Shared by unit and addon rows so prices and statuses line up in columns.
const ROW_GRID = "grid grid-cols-[1.25rem_minmax(0,1fr)_5.5rem_5.5rem] items-center gap-x-3 px-4";

type SelectStepProps = {
  order: Order;
  selectedUnitIds: ReadonlySet<string>;
  onToggleUnit: (unitId: string) => void;
};

export function SelectStep({ order, selectedUnitIds, onToggleUnit }: SelectStepProps) {
  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-3">
        <Detail label="Order ID" value={<span className="font-mono">{order.order_id}</span>} />
        <Detail label="Status" value={<StatusBadge status={order.status} />} />
        <Detail label="Created at" value={formatDateTime(order.created_at)} />
        <Detail label="Delivery fee" value={formatMoney(order.delivery_fee, order.currency)} />
        <Detail label="Delivery fee status" value={<StatusBadge status={order.delivery_fee_status} />} />
      </dl>

      <section>
        <h3 className="mb-2 text-sm font-semibold">Items</h3>
        {!hasRefundableItems(order) && (
          <p className="mb-2 text-sm text-slate-500">Everything on this order has already been refunded.</p>
        )}
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {getUnitEntries(order).map((entry) => (
            <UnitRow
              key={entry.unit.unit_id}
              entry={entry}
              currency={order.currency}
              checked={selectedUnitIds.has(entry.unit.unit_id)}
              onToggle={() => onToggleUnit(entry.unit.unit_id)}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}

type UnitRowProps = {
  entry: UnitEntry;
  currency: Currency;
  checked: boolean;
  onToggle: () => void;
};

function UnitRow({ entry: { line, unit, label }, currency, checked, onToggle }: UnitRowProps) {
  const refundable = unit.status === "paid";

  return (
    <li className={refundable ? undefined : "bg-slate-50 text-slate-400"}>
      <label className={`${ROW_GRID} py-3 ${refundable ? "cursor-pointer hover:bg-slate-50" : "cursor-not-allowed"}`}>
        <input
          type="checkbox"
          checked={checked}
          disabled={!refundable}
          onChange={onToggle}
          className="size-4 accent-slate-900"
        />
        <span className="truncate text-sm font-medium">{label}</span>
        <span className="text-right text-sm tabular-nums">{formatMoney(line.unit_price, currency)}</span>
        <span className="justify-self-end">
          <StatusBadge status={unit.status} />
        </span>
      </label>
      {unit.addons.length > 0 && (
        <ul className="-mt-1 pb-3">
          {unit.addons.map((addon) => (
            <li key={addon.addon_id} className={`${ROW_GRID} py-0.5 text-sm text-slate-500`}>
              <span />
              <span className="truncate">– {addon.name}</span>
              <span className="text-right tabular-nums">{formatMoney(addon.unit_price, currency)}</span>
              <span className="justify-self-end">
                <StatusBadge status={addon.status} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
