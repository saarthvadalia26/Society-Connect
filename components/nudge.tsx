// WhatsApp deep link — opens wa.me with a pre-filled reminder. No API needed.
// In v3 we can swap this for the WhatsApp Business API used in the gym app.

const PORTAL_URL = "https://localhost:3000/login";

function buildMessage(opts: { name: string; amount: number; period: string; flat: string }) {
  const amountStr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })
    .format(opts.amount);
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
}: {
  name: string;
  phone: string | null | undefined;
  amount: number;
  period: string;
  flat: string;
}) {
  const text = encodeURIComponent(buildMessage({ name, amount, period, flat }));
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
