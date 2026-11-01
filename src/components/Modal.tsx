import {
  useEffect,
  useId,
  useRef,
  type KeyboardEvent,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import { createPortal } from "react-dom";

type ModalProps = {
  title: ReactNode;
  description?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "lg";
  dismissible?: boolean;
  role?: "dialog" | "alertdialog";
};

const SIZES = { sm: "max-w-md", lg: "max-w-2xl" };

export function Modal({
  title,
  description,
  onClose,
  children,
  footer,
  size = "lg",
  dismissible = true,
  role = "dialog",
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.showModal();
    dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    return () => dialog.close();
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    if (dismissible) onClose();
  };

  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    if (event.target === event.currentTarget && dismissible) onClose();
  };

  return createPortal(
    <dialog
      ref={ref}
      role={role}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onKeyDown={handleKeyDown}
      onCancel={handleCancel}
      className={`m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] ${SIZES[size]} flex-col overflow-hidden rounded-xl bg-white text-slate-900 shadow-2xl backdrop:bg-slate-900/50 open:flex`}
    >
      <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
        <div>
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          {description && (
            <div id={descriptionId} className="mt-0.5 text-sm text-slate-500">
              {description}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={!dismissible}
          aria-label="Close"
          className="-mr-2 rounded-md p-1.5 text-slate-400 enabled:hover:bg-slate-100 enabled:hover:text-slate-700 disabled:opacity-40"
        >
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="size-5"
            aria-hidden="true"
          >
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
      {footer && (
        <footer className="border-t border-slate-200 bg-slate-50 px-6 py-4">
          {footer}
        </footer>
      )}
    </dialog>,
    document.body,
  );
}
