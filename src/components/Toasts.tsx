import { useEffect } from "react";

export type Toast = {
  id: string;
  tone: "success" | "warning";
  title: string;
  message?: string;
};

const TONES = {
  success: { box: "border-emerald-200 bg-white", dot: "bg-emerald-500" },
  warning: { box: "border-amber-300 bg-amber-50", dot: "bg-amber-500" },
};

const SUCCESS_TIMEOUT_MS = 6000;

export function Toasts({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[min(24rem,calc(100%-2rem))] flex-col gap-2"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    // Warnings need a human to act on them, so they stay until dismissed.
    if (toast.tone !== "success") return;
    const timer = setTimeout(() => onDismiss(toast.id), SUCCESS_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <div
      role={toast.tone === "warning" ? "alert" : "status"}
      className={`pointer-events-auto flex gap-3 rounded-lg border p-4 shadow-lg ${TONES[toast.tone].box}`}
    >
      <span className={`mt-1.5 size-2 shrink-0 rounded-full ${TONES[toast.tone].dot}`} aria-hidden="true" />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-medium text-slate-900">{toast.title}</p>
        {toast.message && <p className="mt-0.5 text-slate-600">{toast.message}</p>}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="self-start text-sm text-slate-400 hover:text-slate-700"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
