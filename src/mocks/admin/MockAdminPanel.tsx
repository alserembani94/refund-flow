import { useState } from "react";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import {
  LATENCY_MS,
  describeMockSettings,
  resetMockSettings,
  setEndpointOutcome,
  updateMockSettings,
  useMockSettings,
  type MockEndpoint,
  type MockLatency,
  type MockOutcome,
  type MockTotalCheck,
} from "../settings";

const ENDPOINTS: { key: MockEndpoint; label: string }[] = [
  { key: "listOrders", label: "GET /orders" },
  { key: "getOrder", label: "GET /orders/:id" },
  { key: "createRefund", label: "POST /orders/:id/refunds" },
];

const OUTCOME_OPTIONS: Option<MockOutcome>[] = [
  { value: "success", label: "Success" },
  { value: "fail", label: "Fail" },
  { value: "fail_once", label: "Fail once" },
];

const TOTAL_CHECK_OPTIONS: Option<MockTotalCheck>[] = [
  { value: "match", label: "Match" },
  { value: "mismatch", label: "Mismatch" },
  { value: "mismatch_once", label: "Mismatch once" },
];

const LATENCY_OPTIONS: Option<MockLatency>[] = [
  { value: "fast", label: "Fast" },
  { value: "normal", label: "Normal" },
  { value: "slow", label: "Slow" },
];

/** Floating entry point to the panel. Rendered in its own React root, separate from the app. */
export function MockAdmin() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <div className="fixed bottom-4 left-4 z-40 shadow-sm">
        <MockApiButton onClick={() => setIsOpen(true)} />
      </div>
      {isOpen && <MockAdminPanel onClose={() => setIsOpen(false)} />}
    </>
  );
}

function MockApiButton({ onClick }: { onClick: () => void }) {
  const notes = describeMockSettings(useMockSettings());
  return (
    <Button onClick={onClick}>
      <span className={`size-2 rounded-full ${notes.length ? "bg-amber-500" : "bg-emerald-500"}`} aria-hidden="true" />
      Mock API
      {notes.length > 0 && <span className="font-normal text-slate-500">· {notes.join(" · ")}</span>}
    </Button>
  );
}

function MockAdminPanel({ onClose }: { onClose: () => void }) {
  const settings = useMockSettings();

  return (
    <Modal
      size="sm"
      title="Mock API"
      description="Simulate backend behaviour. Saved in this browser."
      onClose={onClose}
      footer={
        <div className="flex justify-between gap-2">
          <Button onClick={resetMockSettings}>Reset settings</Button>
          <Button onClick={() => window.location.reload()} title="Reloads the page with fresh seed data">
            Reset order data
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Network speed</legend>
          <Segmented
            name="latency"
            label="Network speed"
            value={settings.latency}
            options={LATENCY_OPTIONS}
            onChange={(latency) => updateMockSettings({ latency })}
          />
          <p className="mt-1 text-xs text-slate-500">{LATENCY_MS[settings.latency]} ms per request</p>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-medium">Responses</legend>
          <div className="space-y-2">
            {ENDPOINTS.map((endpoint) => (
              <div key={endpoint.key} className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs text-slate-600">{endpoint.label}</span>
                <Segmented
                  name={`outcome-${endpoint.key}`}
                  label={endpoint.label}
                  value={settings.outcomes[endpoint.key]}
                  options={OUTCOME_OPTIONS}
                  onChange={(outcome) => setEndpointOutcome(endpoint.key, outcome)}
                />
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">"Fail once" fails the next call, then switches back to success.</p>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-medium">Refund total</legend>
          <Segmented
            name="refund-total-check"
            label="Refund total check"
            value={settings.refundTotalCheck}
            options={TOTAL_CHECK_OPTIONS}
            onChange={(refundTotalCheck) => updateMockSettings({ refundTotalCheck })}
          />
          <p className="mt-1 text-xs text-slate-500">
            On mismatch, the server's total comes out RM 1.00 higher than the reviewed one, so the refund is rejected
            with a 409 before anything is refunded.
          </p>
        </fieldset>
      </div>
    </Modal>
  );
}

type Option<T extends string> = { value: T; label: string };

function Segmented<T extends string>({
  name,
  label,
  value,
  options,
  onChange,
}: {
  name: string;
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
      {options.map((option) => (
        <label
          key={option.value}
          className="cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium text-slate-600 has-checked:bg-white has-checked:text-slate-900 has-checked:shadow-sm has-focus-visible:outline-2 has-focus-visible:outline-slate-900"
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="sr-only"
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}
