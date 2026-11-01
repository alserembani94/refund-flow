import { Button } from "./Button";
import { Spinner } from "./Spinner";

export function LoadingState({ label }: { label: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
      <Spinner />
      {label}
    </div>
  );
}

export function ErrorState({ title, error, onRetry }: { title: string; error?: Error; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <div>
        <p className="font-medium text-slate-900">{title}</p>
        {error && <p className="mt-1 text-sm text-slate-500">{error.message}</p>}
      </div>
      <Button onClick={onRetry}>Try again</Button>
    </div>
  );
}
