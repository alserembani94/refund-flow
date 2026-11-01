import type { Currency } from "../types";

export function formatMoney(amount: number, currency: Currency = "MYR") {
  return new Intl.NumberFormat("en-MY", { style: "currency", currency }).format(
    amount,
  );
}

const toCents = (amount: number) => Math.round(amount * 100);

export function sumMoney(amounts: number[]) {
  return amounts.reduce((total, amount) => total + toCents(amount), 0) / 100;
}

export function sameAmount(a: number, b: number) {
  return toCents(a) === toCents(b);
}
