import { useCallback, useId, useState } from "react";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import { Spinner } from "../../components/Spinner";
import { ErrorState, LoadingState } from "../../components/States";
import { formatMoney } from "../../lib/money";
import { useQuery } from "../../lib/useQuery";
import { getOrder } from "../../api/order";
import type { CreateRefundResponse } from "../../types";
import { ConfirmRefundDialog } from "./ConfirmRefundDialog";
import { ReviewStep } from "./ReviewStep";
import { SelectStep } from "./SelectStep";
import {
  EMPTY_REFUND_FORM,
  calculateRefundTotal,
  canRefundDeliveryFee,
  getRefundableSelection,
  toRefundDraft,
  validateRefundForm,
  type RefundFormValues,
} from "./refund";

type Step = "select" | "review";

const STEP_LABELS: Record<Step, string> = {
  select: "Step 1 of 2 · Select items",
  review: "Step 2 of 2 · Review refund",
};

type RefundModalProps = {
  orderId: string;
  onClose: () => void;
  onRefunded: (result: CreateRefundResponse) => void;
};

export function RefundModal({
  orderId,
  onClose,
  onRefunded,
}: RefundModalProps) {
  const formId = useId();
  const fetchOrder = useCallback(
    (signal: AbortSignal) => getOrder(orderId, signal),
    [orderId],
  );
  const { data: order, error, isLoading, isRefetching, reload } =
    useQuery(fetchOrder);

  const [step, setStep] = useState<Step>("select");
  const [unitIds, setUnitIds] = useState<ReadonlySet<string>>(new Set());
  const [refundDeliveryFee, setRefundDeliveryFee] = useState(false);
  const [form, setForm] = useState<RefundFormValues>(EMPTY_REFUND_FORM);
  const [showErrors, setShowErrors] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [wasReloaded, setWasReloaded] = useState(false);

  const toggleUnit = (unitId: string) =>
    setUnitIds((current) => {
      const next = new Set(current);
      if (next.has(unitId)) next.delete(unitId);
      else next.add(unitId);
      return next;
    });

  if (!order) {
    return (
      <Modal title={`Order ${orderId}`} onClose={onClose}>
        {isLoading ? (
          <LoadingState label="Loading order…" />
        ) : (
          <ErrorState
            title="Couldn't load this order."
            error={error}
            onRetry={reload}
          />
        )}
      </Modal>
    );
  }

  const selection = getRefundableSelection(order, unitIds, refundDeliveryFee);
  const total = calculateRefundTotal(
    order,
    selection.unitIds,
    selection.refundDeliveryFee,
  );
  const hasSelection =
    selection.unitIds.size > 0 || selection.refundDeliveryFee;
  const activeStep: Step = hasSelection ? step : "select";
  const errors = validateRefundForm(form);
  const draft = toRefundDraft(
    order,
    selection.unitIds,
    selection.refundDeliveryFee,
    form,
  );
  const deliveryFeeRefundable = canRefundDeliveryFee(order);

  const handleReviewSubmit = () => {
    if (isRefetching) return;
    if (!draft) {
      setShowErrors(true);
      return;
    }
    setWasReloaded(false);
    setIsConfirming(true);
  };

  const handleReloadOrder = () => {
    setIsConfirming(false);
    setWasReloaded(true);
    reload();
  };

  const footer =
    activeStep === "select" ? (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label
          className={`flex items-center gap-2 text-sm ${deliveryFeeRefundable ? "cursor-pointer" : "cursor-not-allowed text-slate-400"}`}
        >
          <input
            type="checkbox"
            checked={selection.refundDeliveryFee}
            disabled={!deliveryFeeRefundable}
            onChange={(event) => setRefundDeliveryFee(event.target.checked)}
            className="size-4 accent-slate-900"
          />
          Refund delivery fee ({formatMoney(order.delivery_fee, order.currency)}
          )
          {order.delivery_fee_status === "refunded" && (
            <span>· already refunded</span>
          )}
        </label>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">
            Total{" "}
            <strong className="text-slate-900 tabular-nums">
              {formatMoney(total, order.currency)}
            </strong>
          </span>
          <Button
            variant="primary"
            disabled={!hasSelection || isRefetching}
            onClick={() => setStep("review")}
          >
            Next
          </Button>
        </div>
      </div>
    ) : (
      <div className="flex justify-between gap-3">
        <Button onClick={() => setStep("select")}>Back</Button>
        <Button
          variant="primary"
          type="submit"
          form={formId}
          disabled={isRefetching}
        >
          Confirm
        </Button>
      </div>
    );

  return (
    <>
      <Modal
        title={`Order ${orderId}`}
        description={STEP_LABELS[activeStep]}
        onClose={onClose}
        footer={footer}
      >
        {wasReloaded && (
          <ReloadNotice
            isRefetching={isRefetching}
            error={error}
            onRetry={reload}
          />
        )}
        {activeStep === "select" ? (
          <SelectStep
            order={order}
            selectedUnitIds={selection.unitIds}
            onToggleUnit={toggleUnit}
          />
        ) : (
          <ReviewStep
            order={order}
            selectedUnitIds={selection.unitIds}
            refundDeliveryFee={selection.refundDeliveryFee}
            total={total}
            values={form}
            errors={showErrors ? errors : {}}
            onChange={(patch) =>
              setForm((current) => ({ ...current, ...patch }))
            }
            formId={formId}
            onSubmit={handleReviewSubmit}
          />
        )}
      </Modal>

      {isConfirming && draft && (
        <ConfirmRefundDialog
          draft={draft}
          currency={order.currency}
          onCancel={() => setIsConfirming(false)}
          onSuccess={onRefunded}
          onReloadOrder={handleReloadOrder}
        />
      )}
    </>
  );
}

function ReloadNotice({
  isRefetching,
  error,
  onRetry,
}: {
  isRefetching: boolean;
  error?: Error;
  onRetry: () => void;
}) {
  if (isRefetching) {
    return (
      <p
        role="status"
        className="mb-4 flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600"
      >
        <Spinner /> Reloading the latest order…
      </p>
    );
  }
  if (error) {
    return (
      <div
        role="alert"
        className="mb-4 flex items-center justify-between gap-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
      >
        <span>Couldn't reload the order. {error.message}</span>
        <button
          type="button"
          onClick={onRetry}
          className="font-medium underline"
        >
          Retry
        </button>
      </div>
    );
  }
  return (
    <p
      role="status"
      className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
    >
      Loaded the latest version of this order. Check the items and total before
      confirming again.
    </p>
  );
}
