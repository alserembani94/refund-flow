import { useRef, useState } from "react";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import { Spinner } from "../../components/Spinner";
import {
  RefundAmountMismatchError,
  getErrorMessage,
  isRetryable,
} from "../../lib/errors";
import { formatMoney } from "../../lib/money";
import { createRefund } from "../../api/refund";
import type { CreateRefundResponse, Currency } from "../../types";
import { CHANNEL_LABELS, REASON_LABELS, type RefundDraft } from "./refund";

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "error"; message: string; retryable: boolean }
  | { status: "mismatch"; serverAmount: number };

type ConfirmRefundDialogProps = {
  draft: RefundDraft;
  currency: Currency;
  onCancel: () => void;
  onSuccess: (result: CreateRefundResponse) => void;
  onReloadOrder: () => void;
};

export function ConfirmRefundDialog({
  draft,
  currency,
  onCancel,
  onSuccess,
  onReloadOrder,
}: ConfirmRefundDialogProps) {
  const refundRequestKey = useRef<string | null>(null);
  const [submit, setSubmit] = useState<SubmitState>({ status: "idle" });
  const isSubmitting = submit.status === "submitting";
  const needsReload =
    submit.status === "mismatch" ||
    (submit.status === "error" && !submit.retryable);
  const money = (amount: number) => formatMoney(amount, currency);

  const handleConfirm = async () => {
    refundRequestKey.current ??= crypto.randomUUID();
    setSubmit({ status: "submitting" });

    let result: CreateRefundResponse;
    try {
      result = await createRefund({
        ...draft,
        refund_request_key: refundRequestKey.current,
      });
    } catch (error) {
      if (error instanceof RefundAmountMismatchError) {
        setSubmit({ status: "mismatch", serverAmount: error.serverAmount });
      } else {
        setSubmit({
          status: "error",
          message: getErrorMessage(error),
          retryable: isRetryable(error),
        });
      }
      return;
    }
    onSuccess(result);
  };

  const unitCount = draft.unit_ids.length;

  return (
    <Modal
      size="sm"
      role="alertdialog"
      title="Confirm refund"
      onClose={onCancel}
      dismissible={!isSubmitting}
      footer={
        <div className="flex justify-end gap-2">
          <Button data-autofocus onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          {needsReload ? (
            <Button variant="primary" onClick={onReloadOrder}>
              Reload order
            </Button>
          ) : (
            <Button
              variant="danger"
              onClick={handleConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting && <Spinner />}
              {isSubmitting
                ? "Processing…"
                : submit.status === "error"
                  ? "Try again"
                  : "Confirm refund"}
            </Button>
          )}
        </div>
      }
    >
      <p className="text-sm text-slate-600">
        Refund{" "}
        <strong className="text-slate-900">
          {money(draft.expected_amount)}
        </strong>{" "}
        on order{" "}
        <strong className="font-mono text-slate-900">{draft.order_id}</strong>{" "}
        to{" "}
        <strong className="text-slate-900">
          {CHANNEL_LABELS[draft.channel].toLowerCase()}
        </strong>
        ?
      </p>

      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-lg bg-slate-50 p-3 text-sm">
        <dt className="text-slate-500">Items</dt>
        <dd>
          {unitCount === 0
            ? "None"
            : `${unitCount} unit${unitCount === 1 ? "" : "s"}`}
        </dd>
        <dt className="text-slate-500">Delivery fee</dt>
        <dd>{draft.refund_delivery_fee ? "Included" : "Not included"}</dd>
        <dt className="text-slate-500">Reason</dt>
        <dd className="wrap-break-word">
          {REASON_LABELS[draft.reason]}
          {draft.other_reason && (
            <span className="text-slate-500"> — {draft.other_reason}</span>
          )}
        </dd>
      </dl>

      <p className="mt-3 text-xs text-slate-500">This can't be undone.</p>

      {submit.status === "mismatch" && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
        >
          <p className="font-medium">
            The total has changed. Nothing was refunded.
          </p>
          <p className="mt-0.5">
            The server calculated <strong>{money(submit.serverAmount)}</strong>,
            but you reviewed <strong>{money(draft.expected_amount)}</strong>.
            Reload the order and check the total before trying again.
          </p>
        </div>
      )}

      {submit.status === "error" && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <p className="font-medium">The refund didn't go through.</p>
          <p className="mt-0.5">
            {submit.message}{" "}
            {submit.retryable
              ? "Retrying is safe — it won't refund twice."
              : "Reload the order to see its latest state."}
          </p>
        </div>
      )}
    </Modal>
  );
}
