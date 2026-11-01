# Welcome to my Refund Flow App

## Introduction

This is a part of the assignment to create a refund flow. The requirements are to develop a single-page app for simulating a refund flow.

---

## Setting up the project

The project is created using Vite. All the scripts are available in `package.json`.

### Before running any scripts

Make sure to install all dependencies after cloning this project to your local machine.

```bash
# Use any preferred package manager (npm, pnpm, bun). This project uses bun.
bun install
```

### Running the project

To run the project locally, you can run the script below:

```bash
bun run dev
```

After running the script, you can visit the project at `http://localhost:5173`. To terminate the dev server, just press `Ctrl + C`.

### Run tests

There are test suites in this project. All test suites can be found in `/tests`. To run the project, you can run the script below:

```bash
bun run test
```

You should be able to see your test runs live in the terminal. You can edit the test suites while running your tests. To terminal, simply click "q" in the terminal. `Ctrl + C` also works to terminate the tests.

### Preview app

While you can run the project locally, you can also visit the live version of the app here: [Preview Link](https://refund-flow-mu.vercel.app/)

You can also type the link into the browser: https://refund-flow-mu.vercel.app/

---

## Technical Specifications

### API Endpoints

In general, there are 3 endpoints, in which is simulated through `/src/api`:

1. `GET /orders`
Lists orders for the orders table.

| | |
| ------ | ------ |
|Method	 | `GET`  |
|Path	   |`/orders`|
|Request |none (no query parameters or body)|
|Success	|200 OK|
Response

```ts
type ListOrdersResponse = {
  order_id: string;
  status: "completed" | "refunded";
  created_at: string;
}[]; // newest first
```
Errors: `503` only.

2. `GET /orders/:orderId`
Full order details for the refund pop-up.

| | |
| -------- | ------- |
|Method	      |`GET` |
|Path	        |`/orders/:orderId`|
|Query params	|orderId, e.g. ORD-10421|
|Request body	|none|
|Success	    |200 OK|
Response

```ts
type GetOrderResponse = {
  order_id: string;
  status: "completed" | "refunded";
  staff_id: string;
  currency: "MYR";
  delivery_fee: number;
  delivery_fee_status: "paid" | "refunded";
  created_at: string;
  items: {
    line_id: string;
    name: string;
    unit_price: number;
    units: {
      unit_id: string;
      status: "paid" | "refunded";
      addons: {
        addon_id: string;
        name: string;
        unit_price: number;
        status: "paid" | "refunded";
      }[]; // empty array when there are none
    }[];
  }[];
};
```
Errors

| Status | Code | When |
| --- | --------------- | ----- |
| `404` |	`order_not_found`	    | No order with that ID |
| `503` |	`service_unavailable`	| Server failure |

3. `POST /orders/:orderId/refunds`
Refunds selected units and, optionally, the delivery fee. The server recalculates the total from its own prices and refuses if it differs from the total the staff member reviewed.

| | |
| -------- | ------- |
|Method |	POST |
|Path |	/orders/:orderId/refunds |
|Path params |	orderId |
|Success |	201 Created (proposed) |

Request body

```ts
type CreateRefundRequest = {
  order_id: string;              // must match :orderId
  staff_id: string;
  unit_ids: string[];            // may be empty if refund_delivery_fee is true
  refund_delivery_fee: boolean;
  reason: "wrong_item" | "missing_item" | "quality_issue" | "late_delivery" | "other";
  other_reason: string | null;   // required when reason is "other"; otherwise null
  channel: "original_payment" | "in_app";
  expected_amount: number;       // the total shown to the staff member
  refund_request_key: string;    // UUID created by the client, reused on retries
};
```

Response

```ts
type CreateRefundResponse = {
  order_id: string;
  amount_refunded: number; // always equals expected_amount on success
};
```

| Status | Code | When |
| --- | --- | --- |
|`400`|	`invalid_reason` / `invalid_channel` |	Value not in the allowed list |
|`400`	|`other_reason_required` |	reason is "other" and `other_reason` is empty after trimming
|`400`	| `nothing_to_refund` |	`unit_ids` is empty and `refund_delivery_fee` is false
|`400`	| `duplicate_unit` |	The same unit appears twice in `unit_ids`
|`400` | `invalid_expected_amount` |	Not a number, or negative
|`404` | `order_not_found` |	Unknown order
|`404` |	`unit_not_found` |	A unit isn't part of this order
|`409` |	`unit_already_refunded`	| A selected unit is already refunded
|`409` |	`delivery_fee_already_refunded` |	Delivery fee requested but already refunded
|`409` | `amount_mismatch` |	Server total is not equal to `expected_amount`. Nothing was refunded.
|`503` | `service_unavailable` | Server failure. Safe to retry with the same key.

The `amount_mismatch` response needs both amounts so the UI can show them:

type AmountMismatchError = ErrorResponse & {
  code: "amount_mismatch";
  expected_amount: number;
  server_amount: number;
};


### Refund Calculations

You can check out the calculations on both ends:
FE: `/src/features/refund.ts`
BE (simulated): `/src/mocks/api/refund.ts`

In general, here are the calculations:

```ts
// Note: The cent drifts are added to the real calculations. This is just a simplified version of calculation for documentation purpose

// 1. Get each unit total price
const addOnsPrice = addOns.reduce((total, amount) => total + amount);
const unitTotalPrice = addOnPrice + unit_price;

// 2. Add all refund draft units and total them (plus optional delivery fee)
const refundTotal = units.reduce((total, amount) => total + amount) + delivery_fee;
```

The refund calculation happens both on FE and BE.
1. Calculations on FE is to show the total amount of refund live to the staff.
2. We passed the `expected_amount` to BE to conduct a recon step after the calculation is done on the BE as a part of the refund draft, and submitted through `POST /orders/:orderId/refunds`.
3. If the `expected_amount` and the calculations on BE is tally, then it should return 201, as the refund will be created and processed on BE.
4. If the amount is not tally, then it returns error `409` with code `amount_mismatch`, indicates that the refund process cannot be done. This is for few cases:
  - **Out-of-date order**. The order may have been refunded by someone else in the server.
  - **Different rules**. The server may apply certain rules on the calculation, and this may need fix on FE to make sure that the calculations tally. e.g. added tax, rounding cents rules

### Assumptions

Few assumptions have been made throughout the development
- In the original assignment, the order has `status`. Since there is a rule where full refund applies when staff selects all items in the order, the `status` for order will only be changed when all items in the order has been refunded - staff can still select an order that is not refunded fully, and select other items that has not been refunded.
- Since there is no specific error handling in the spec, I've added few examples on how the error will be handled in several cases of the standard CRUD API (not found, invalid fields)
- Refunding delivery fees may need to assess further, as the fee may involve the riders. However, for the simplicity of the project, there is no validation checks on the delivery fee, and passed every time. I might be asking to PM on this matter.
- `Items that were already refunded cannot be refunded again.` This didn't mention regarding the delivery fee item, so I treated delivery fee as an item, and mark it as refunded, so the next time the order is revisited (may be some of the items are not refunded), staff can no longer refund the delivery fee.
- Though I might ask PM about the reason for the refund, as there is a possibility that a single refund process may have more than 1 reason (1 item missing, 1 quality issue), but for the sake of simplicity, I make 1 refund to only have 1 reason.
- I've added few extra keys in the models - e.g. order now have `staff_id`, `created_at` as I thought about the audit trail.
- There is no restriction on the access control, so anyone can do refund freely.

Related to dev-only processes:
- In the assignment, there is a line mentioned regarding the API - `Your mock
should behave like a real API, which means responses can be slow and can fail.`. I decided to add an admin panel - in which can only be accessed in developer mode. In developer mode, look into your bottom left of the screen to access the admin panel and simulate certain conditions for each API. The code is split, so that it won't be bundled and ported to the production.

### Key decisions

Decisions that I've made:
- Refund to have split between refund draft and the real refund - this is to ensure that the calculations, status and the processes for refund is tally between FE and BE. `refund_request_key` is an temporary idempotent key, as this only checks for that refund session, so it refers to the existing refund draft the next time it recalculates.
- Adding staff info and timestamp for the audit trail. While there is no interface to get this info, this data can be retrieved later for further use.
- Admin panel are added to assist developer in simulating few conditions. In real development, the request network speed can be tested by throttling in the browser. The error is instead is useful, made to match the contract between BE and FE, so FE can spend some time to handle errors on FE, while BE can finish up their work to fulfil the contract.
- As for code architecture:
  - I've splitted between `/api` and `/mocks` that represent 2 distinct features - `/api` should always be in the project (I may be able to add Tanstack Query in the future), and `/mocks` represents how BE works and serve as a contract.
  - I've also have `/tests` to hold all test suites. This enabled the developer to go through the test cases, find any flaky tests, or create a new one.
- I installed important libraries enough for my operations. I would love to add more dependencies such as Radix, TanStack Query, Zustand and so on, but those will only add complexity to the project for now. If this happens to grow, then I may install these dependencies to fulfil matched requirements.

### Known limitations & Next Steps
- It is known that there is no API to be called, and all of API calls are mocked instead. This is not simulating the real behavior of the BE, but the current mock is enough to simulate most BE responses.
- As the contracts has been established, the next step should be integrating to the real BE. Since all the error handling, the golden paths has been completed, the integrations should be seamless. All the bugs found after the integrations will be patched later on.
- There is no design spec given. While the design are assumed in this assignment, the next process could also be product acceptance, checking all designs and copyrights.
- For a proper app flow, we may next incorporate into an app with a proper navigation and auth, so we can have a proper access control.
- On technical side, the project is bootstrapped using Typescript 7.0. ESLint is not compatible with the TS7.0, so running the eslint is expected to fail. Given more time, I will downgrade the Typescript, as the type definitions used in this project are all backward-compatible.