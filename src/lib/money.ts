import type { Currency } from "../types";

export function formatMoney(amount: number, currency: Currency = "MYR") {
  return new Intl.NumberFormat("en-MY", { style: "currency", currency }).format(amount);
}

const toCents = (amount: number) => Math.round(amount * 100);

/** Sums in integer cents so 0.1 + 0.2 style float drift never reaches a refund total. */
export function sumMoney(amounts: number[]) {
  return amounts.reduce((total, amount) => total + toCents(amount), 0) / 100;
}

export function sameAmount(a: number, b: number) {
  return toCents(a) === toCents(b);
}
