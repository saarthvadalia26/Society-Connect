// Pure formatting utilities — no server imports.
// Safe to use in both Server Components and "use client" components.

export function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function fmtPeriod(period: string): string {
  const [y, m] = period.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
}

export function fmtCurrency(amount: number, currency: string): string {
  const fractionDigits = currency === "INR" ? 0 : 2;
  const locale =
    currency === "USD" ? "en-US"
    : currency === "GBP" ? "en-GB"
    : currency === "EUR" ? "en-IE"
    : "en-IN";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
}

export function fmtINR(amount: number): string {
  return fmtCurrency(amount, "INR");
}
