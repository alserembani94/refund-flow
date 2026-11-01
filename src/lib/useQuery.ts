import { useEffect, useState } from "react";
import { toError } from "./errors";

export type Fetcher<T> = (signal: AbortSignal) => Promise<T>;

type Settled<T> = {
  fetcher: Fetcher<T>;
  attempt: number;
  data?: T;
  error?: Error;
};

/**
 * Minimal data-fetching hook. `fetcher` must be referentially stable (a module
 * function or a useCallback); changing it or calling `reload` refetches.
 * `data` keeps the last successful result while a refetch is in flight.
 */
export function useQuery<T>(fetcher: Fetcher<T>) {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<Settled<T> | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetcher(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setSettled({ fetcher, attempt, data });
      },
      (error: unknown) => {
        if (!controller.signal.aborted) {
          setSettled((previous) => ({ fetcher, attempt, data: previous?.data, error: toError(error) }));
        }
      },
    );
    return () => controller.abort();
  }, [fetcher, attempt]);

  return {
    data: settled?.data,
    error: settled?.error,
    isLoading: settled?.fetcher !== fetcher || settled.attempt !== attempt,
    reload: () => setAttempt((current) => current + 1),
  };
}
