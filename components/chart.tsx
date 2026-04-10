import { fmtINR } from "@/lib/db";

export interface MonthlyDatum {
  period: string;
  collected: number;
  outstanding: number;
}

function shortMonth(period: string): string {
  const [y, m] = period.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-IN", { month: "short" });
}

export function CollectionChart({ data }: { data: MonthlyDatum[] }) {
  const width = 640;
  const height = 220;
  const padX = 40;
  const padY = 28;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const max = Math.max(1, ...data.flatMap((d) => [d.collected + d.outstanding]));
  const groupW = innerW / Math.max(1, data.length);
  const barW = (groupW - 16) / 2;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Collection vs Outstanding chart">
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map((pct) => (
          <line
            key={pct}
            x1={padX}
            y1={height - padY - pct * innerH}
            x2={width - padX}
            y2={height - padY - pct * innerH}
            stroke="#f1f5f9"
            strokeWidth={1}
          />
        ))}
        <line x1={padX} y1={height - padY} x2={width - padX} y2={height - padY} stroke="#e2e8f0" strokeWidth={1} />

        {data.map((d, i) => {
          const x0 = padX + i * groupW + 8;
          const collH = Math.max(2, (d.collected / max) * innerH);
          const outH = Math.max(2, (d.outstanding / max) * innerH);
          return (
            <g key={d.period}>
              <rect x={x0} y={height - padY - collH} width={barW} height={collH} fill="url(#greenGrad)" rx={4}>
                <title>{`Collected ${fmtINR(d.collected)}`}</title>
              </rect>
              <rect x={x0 + barW + 4} y={height - padY - outH} width={barW} height={outH} fill="url(#amberGrad)" rx={4}>
                <title>{`Outstanding ${fmtINR(d.outstanding)}`}</title>
              </rect>
              <text
                x={x0 + barW + 2}
                y={height - padY + 15}
                textAnchor="middle"
                className="fill-slate-400"
                fontSize={11}
                fontWeight={500}
              >
                {shortMonth(d.period)}
              </text>
            </g>
          );
        })}

        <defs>
          <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
      </svg>
      <div className="mt-3 flex items-center justify-end gap-5 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Collected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-500" /> Outstanding
        </span>
      </div>
    </div>
  );
}
