// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { createRefund } from "../../../src/api/refund";
import { ConfirmRefundDialog } from "../../../src/features/refund/ConfirmRefundDialog";
import { ApiError, RefundAmountMismatchError } from "../../../src/lib/errors";
import { refundDraft, refundSuccess } from "../../fixtures/refund";
import { stubModalDialogs } from "../../helpers/dialog";

// Frontend only: the API module is replaced, so no mock backend code runs.
vi.mock("../../../src/api/refund", () => ({ createRefund: vi.fn() }));
const createRefundMock = vi.mocked(createRefund);

beforeAll(stubModalDialogs);

afterEach(() => {
  cleanup();
  createRefundMock.mockReset();
});

function renderDialog() {
  const props = { onCancel: vi.fn(), onSuccess: vi.fn(), onReloadOrder: vi.fn() };
  render(<ConfirmRefundDialog draft={refundDraft} currency="MYR" {...props} />);
  return props;
}

const button = (name: string | RegExp) => screen.getByRole("button", { name });

describe("ConfirmRefundDialog", () => {
  describe("confirming", () => {
    it("sends the draft with a refund_request_key and reports success", async () => {
      createRefundMock.mockResolvedValue(refundSuccess);
      const { onSuccess } = renderDialog();

      fireEvent.click(button("Confirm refund"));

      await vi.waitFor(() => expect(onSuccess).toHaveBeenCalledWith(refundSuccess));
      expect(createRefundMock).toHaveBeenCalledWith({ ...refundDraft, refund_request_key: expect.any(String) });
    });

    it("disables both actions while the request is in flight", async () => {
      createRefundMock.mockReturnValue(new Promise(() => {}));
      renderDialog();

      fireEvent.click(button("Confirm refund"));

      expect(await screen.findByRole("button", { name: /Processing/ })).toHaveProperty("disabled", true);
      expect(button("Cancel")).toHaveProperty("disabled", true);
    });
  });

  describe("when the refund fails", () => {
    it("reuses the same refund_request_key when retrying after a server error", async () => {
      createRefundMock
        .mockRejectedValueOnce(new ApiError(503, "Service unavailable."))
        .mockResolvedValueOnce(refundSuccess);
      const { onSuccess } = renderDialog();

      fireEvent.click(button("Confirm refund"));
      await screen.findByText(/Retrying is safe/);
      fireEvent.click(button("Try again"));

      await vi.waitFor(() => expect(onSuccess).toHaveBeenCalledWith(refundSuccess));
      const [first, second] = createRefundMock.mock.calls.map(([request]) => request.refund_request_key);
      expect(second).toBe(first);
    });

    it("on a total mismatch, shows both amounts and asks to reload instead of retrying", async () => {
      createRefundMock.mockRejectedValue(new RefundAmountMismatchError(26.4, 27.4));
      const { onReloadOrder, onSuccess } = renderDialog();

      fireEvent.click(button("Confirm refund"));

      await screen.findByText("The total has changed. Nothing was refunded.");
      screen.getByText(/27\.40/); // the server's amount
      expect(screen.queryByRole("button", { name: /Confirm refund|Try again/ })).toBeNull();

      fireEvent.click(button("Reload order"));

      expect(onReloadOrder).toHaveBeenCalledOnce();
      expect(createRefundMock).toHaveBeenCalledOnce();
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it("asks to reload on client errors, where resending would fail the same way", async () => {
      createRefundMock.mockRejectedValue(new ApiError(409, "Latte (U1a) was already refunded."));
      renderDialog();

      fireEvent.click(button("Confirm refund"));

      await screen.findByText(/already refunded\. Reload the order/);
      button("Reload order");
    });
  });

  describe("cancelling", () => {
    it("closes without calling the API", () => {
      const { onCancel } = renderDialog();

      fireEvent.click(button("Cancel"));

      expect(onCancel).toHaveBeenCalledOnce();
      expect(createRefundMock).not.toHaveBeenCalled();
    });
  });
});
