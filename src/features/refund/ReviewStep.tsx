import { useId, type ReactNode } from "react";
import { formatMoney } from "../../lib/money";
import { REFUND_CHANNELS, REFUND_REASONS, type Order, type RefundChannel, type RefundReason } from "../../types";
import {
  CHANNEL_LABELS,
  OTHER_REASON_MAX_LENGTH,
  REASON_LABELS,
  getUnitEntries,
  type RefundFormErrors,
  type RefundFormValues,
} from "./refund";

const CONTROL =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none aria-invalid:border-red-500";

type ReviewStepProps = {
  order: Order;
  selectedUnitIds: ReadonlySet<string>;
  refundDeliveryFee: boolean;
  total: number;
  values: RefundFormValues;
  errors: RefundFormErrors;
  onChange: (patch: Partial<RefundFormValues>) => void;
  formId: string;
  onSubmit: () => void;
};

export function ReviewStep({
  order,
  selectedUnitIds,
  refundDeliveryFee,
  total,
  values,
  errors,
  onChange,
  formId,
  onSubmit,
}: ReviewStepProps) {
  const fieldId = useId();
  const units = getUnitEntries(order).filter(({ unit }) => selectedUnitIds.has(unit.unit_id));
  const money = (amount: number) => formatMoney(amount, order.currency);

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-2 text-sm font-semibold">Refund summary</h3>
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 text-sm">
          {units.map(({ line, unit, label, paidAddons }) => (
            <li key={unit.unit_id} className="px-4 py-3">
              <div className="flex justify-between gap-4">
                <span className="font-medium">{label}</span>
                <span className="tabular-nums">{money(line.unit_price)}</span>
              </div>
              {paidAddons.map((addon) => (
                <div key={addon.addon_id} className="mt-1 flex justify-between gap-4 pl-4 text-slate-500">
                  <span>– {addon.name}</span>
                  <span className="tabular-nums">{money(addon.unit_price)}</span>
                </div>
              ))}
            </li>
          ))}
          {refundDeliveryFee && (
            <li className="flex justify-between gap-4 px-4 py-3">
              <span className="font-medium">Delivery fee</span>
              <span className="tabular-nums">{money(order.delivery_fee)}</span>
            </li>
          )}
          <li className="flex justify-between gap-4 bg-slate-50 px-4 py-3 text-base font-semibold">
            <span>Total refund</span>
            <span className="tabular-nums">{money(total)}</span>
          </li>
        </ul>
      </section>

      <form
        id={formId}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        className="space-y-4"
      >
        <h3 className="text-sm font-semibold">Refund details</h3>

        <Field id={`${fieldId}-reason`} label="Reason" error={errors.reason}>
          {(props) => (
            <select
              {...props}
              value={values.reason}
              onChange={(event) => onChange({ reason: event.target.value as RefundReason })}
              className={CONTROL}
            >
              <option value="" disabled>
                Select a reason
              </option>
              {REFUND_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {REASON_LABELS[reason]}
                </option>
              ))}
            </select>
          )}
        </Field>

        {values.reason === "other" && (
          <Field id={`${fieldId}-other`} label="Other reason" error={errors.otherReason}>
            {(props) => (
              <textarea
                {...props}
                rows={3}
                maxLength={OTHER_REASON_MAX_LENGTH}
                value={values.otherReason}
                onChange={(event) => onChange({ otherReason: event.target.value })}
                placeholder="What went wrong?"
                className={CONTROL}
              />
            )}
          </Field>
        )}

        <Field id={`${fieldId}-channel`} label="Refund channel" error={errors.channel}>
          {(props) => (
            <select
              {...props}
              value={values.channel}
              onChange={(event) => onChange({ channel: event.target.value as RefundChannel })}
              className={CONTROL}
            >
              <option value="" disabled>
                Select a channel
              </option>
              {REFUND_CHANNELS.map((channel) => (
                <option key={channel} value={channel}>
                  {CHANNEL_LABELS[channel]}
                </option>
              ))}
            </select>
          )}
        </Field>
      </form>
    </div>
  );
}

type ControlProps = { id: string; "aria-invalid": boolean; "aria-describedby"?: string };

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: (props: ControlProps) => ReactNode;
}) {
  const errorId = `${id}-error`;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": error ? errorId : undefined })}
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
