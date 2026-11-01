export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * 409 from POST /refunds: the server's total differs from the reviewed one, so nothing
 * was refunded. A real API client would build this from the response body.
 */
export class RefundAmountMismatchError extends ApiError {
  readonly expectedAmount: number;
  readonly serverAmount: number;

  constructor(expectedAmount: number, serverAmount: number) {
    super(409, `Refund total mismatch: reviewed ${expectedAmount}, server calculated ${serverAmount}.`);
    this.name = "RefundAmountMismatchError";
    this.expectedAmount = expectedAmount;
    this.serverAmount = serverAmount;
  }
}

export function toError(error: unknown) {
  return error instanceof Error ? error : new Error(String(error));
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

/** 4xx means the request itself is wrong; sending it again won't help. */
export function isRetryable(error: unknown) {
  return !(error instanceof ApiError) || error.status >= 500;
}
