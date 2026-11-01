import { useSyncExternalStore } from "react";

export type MockEndpoint = "listOrders" | "getOrder" | "createRefund";
export type MockOutcome = "success" | "fail" | "fail_once";
export type MockLatency = "fast" | "normal" | "slow";
export type MockTotalCheck = "match" | "mismatch" | "mismatch_once";

export type MockSettings = {
  latency: MockLatency;
  outcomes: Record<MockEndpoint, MockOutcome>;
  /** Makes POST /refunds calculate a different total than the client, so it rejects with 409 before refunding. */
  refundTotalCheck: MockTotalCheck;
};

export const LATENCY_MS: Record<MockLatency, number> = { fast: 150, normal: 800, slow: 3000 };

export const DEFAULT_MOCK_SETTINGS: MockSettings = {
  latency: "normal",
  outcomes: { listOrders: "success", getOrder: "success", createRefund: "success" },
  refundTotalCheck: "match",
};

const STORAGE_KEY = "refund-flow:mock-settings";
const listeners = new Set<() => void>();
// Production has no admin panel to undo stored settings, so it always runs the happy path.
let settings = import.meta.env.DEV ? load() : DEFAULT_MOCK_SETTINGS;

function load(): MockSettings {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (!stored) return DEFAULT_MOCK_SETTINGS;
    return {
      ...DEFAULT_MOCK_SETTINGS,
      ...stored,
      outcomes: { ...DEFAULT_MOCK_SETTINGS.outcomes, ...stored.outcomes },
    };
  } catch {
    return DEFAULT_MOCK_SETTINGS;
  }
}

function save(next: MockSettings) {
  settings = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable (private mode etc.) — settings still apply for this session.
  }
  listeners.forEach((listener) => listener());
}

export const getMockSettings = () => settings;

export function updateMockSettings(patch: Partial<MockSettings>) {
  save({ ...settings, ...patch });
}

export function setEndpointOutcome(endpoint: MockEndpoint, outcome: MockOutcome) {
  save({ ...settings, outcomes: { ...settings.outcomes, [endpoint]: outcome } });
}

export function resetMockSettings() {
  save(DEFAULT_MOCK_SETTINGS);
}

/** Short labels for every setting that differs from the happy path. */
export function describeMockSettings(current: MockSettings) {
  const notes: string[] = [];
  if (current.latency !== "normal") notes.push(current.latency);
  const failing = Object.values(current.outcomes).filter((outcome) => outcome !== "success").length;
  if (failing > 0) notes.push(`${failing} failing`);
  if (current.refundTotalCheck !== "match") notes.push("total mismatch");
  return notes;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useMockSettings() {
  return useSyncExternalStore(subscribe, getMockSettings);
}
