import { useEffect, useState } from "react";
import { toError } from "./errors";

export type Fetcher<T> = (signal: AbortSignal) => Promise<T>;

type Settled<T> = {
  fetcher: Fetcher<T>;
  attempt: number;
  data?: T;
  error?: Error;
};

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
          setSettled((previous) => ({
            fetcher,
            attempt,
            data: previous?.data,
            error: toError(error),
          }));
        }
      },
    );
    return () => controller.abort();
  }, [fetcher, attempt]);

  const isFetching =
    settled?.fetcher !== fetcher || settled.attempt !== attempt;
  const data = settled?.data;

  return {
    data,
    error: isFetching ? undefined : settled?.error,
    isLoading: isFetching && data === undefined,
    isRefetching: isFetching && data !== undefined,
    reload: () => setAttempt((current) => current + 1),
  };
}
