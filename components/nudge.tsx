// WhatsApp deep link — opens wa.me with a pre-filled reminder. No API needed.
// In v3 we can swap this for the WhatsApp Business API used in the gym app.

import { fmtCurrency } from "@/lib/format";

const PORTAL_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") + "/login" ||
  "https://societyconnect.app/login";

function buildMessage(opts: { name: string; amount: number; period: string; flat: string; currency: string }) {
  const amountStr = fmtCurrency(opts.amount, opts.currency);
  return (
    `Hello ${opts.name}, a friendly reminder that your maintenance for ${opts.period} ` +
    `of ${amountStr} is pending for Flat ${opts.flat}. Please pay via the portal: ${PORTAL_URL}`
  );
}

function digitsOnly(phone: string | null | undefined) {
  if (!phone) return "";
  return phone.replace(/[^\d]/g, "");
}

export function NudgeLink({
  name,
  phone,
  amount,
  period,
  flat,
  currency = "INR",
}: {
  name: string;
  phone: string | null | undefined;
  amount: number;
  period: string;
  flat: string;
  currency?: string;
}) {
  const text = encodeURIComponent(buildMessage({ name, amount, period, flat, currency }));
  const num = digitsOnly(phone);
  const href = num ? `https://wa.me/${num}?text=${text}` : `https://wa.me/?text=${text}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700"
    >
      Nudge on WhatsApp
    </a>
  );
}
