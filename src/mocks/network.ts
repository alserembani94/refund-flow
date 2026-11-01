import { ApiError } from "../lib/errors";
import {
  LATENCY_MS,
  getMockSettings,
  setEndpointOutcome,
  type MockEndpoint,
} from "./settings";

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}

export async function simulateNetwork(
  endpoint: MockEndpoint,
  signal?: AbortSignal,
) {
  const { latency, outcomes } = getMockSettings();
  await sleep(LATENCY_MS[latency], signal);

  const outcome = outcomes[endpoint];
  if (outcome === "success") return;
  if (outcome === "fail_once") setEndpointOutcome(endpoint, "success");
  throw new ApiError(503, "Service unavailable (simulated failure).");
}

const LOG_COLORS = { ok: "#059669", error: "#dc2626", aborted: "#94a3b8" };

export async function logged<T>(
  endpoint: MockEndpoint,
  label: string,
  request: unknown,
  run: () => Promise<T>,
) {
  if (!import.meta.env.DEV) return run();

  const { latency, outcomes, refundTotalCheck } = getMockSettings();
  const simulation = {
    latency: `${latency} (${LATENCY_MS[latency]}ms)`,
    outcome: outcomes[endpoint],
    ...(endpoint === "createRefund" && { refundTotalCheck }),
  };
  const startedAt = performance.now();

  const log = (
    tone: keyof typeof LOG_COLORS,
    status: string,
    detail?: [string, unknown],
  ) => {
    const elapsed = Math.round(performance.now() - startedAt);
    console.groupCollapsed(
      `%c[mock] ${label} → ${status}%c · ${elapsed}ms`,
      `color: ${LOG_COLORS[tone]}; font-weight: 600`,
      "color: #94a3b8",
    );
    if (request !== undefined) console.log("request", request);
    if (detail) console.log(...detail);
    console.log("simulation", simulation);
    console.groupEnd();
  };

  try {
    const response = await run();
    log("ok", "OK", ["response", response]);
    return response;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      log("aborted", "aborted");
    else
      log("error", error instanceof ApiError ? String(error.status) : "error", [
        "error",
        error,
      ]);
    throw error;
  }
}
