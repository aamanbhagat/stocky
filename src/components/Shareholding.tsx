import { compactDate } from "@/lib/format";

type Pattern = {
  promoter?: number | null;
  institutional?: number | null;
  public?: number | null;
  asOf?: Date | null;
  source?: string | null;
};

const PALETTE = {
  promoter: "#0D1B2A",
  institutional: "#FF9500",
  public: "#94A3B8",
};

export function Shareholding({ pattern }: { pattern: Pattern }) {
  const segs = [
    { key: "promoter", label: "Promoters", value: pattern.promoter, color: PALETTE.promoter, hint: "Founders & promoter group" },
    { key: "institutional", label: "Institutions", value: pattern.institutional, color: PALETTE.institutional, hint: "FII + DII" },
    { key: "public", label: "Public", value: pattern.public, color: PALETTE.public, hint: "Retail & non-institutional" },
  ];
  const any = segs.some((s) => s.value != null);

  if (!any) {
    return (
      <p className="text-[14px] text-mute-2">
        Shareholding pattern not yet captured for this company. Pulled from NSE
        corporate filings on the next ownership refresh.
      </p>
    );
  }

  const total = segs.reduce((a, s) => a + (s.value ?? 0), 0) || 100;

  return (
    <div>
      <div className="flex h-[20px] w-full overflow-hidden border border-rule">
        {segs.map((s) => {
          const pct = s.value != null ? (s.value / total) * 100 : 0;
          if (!pct) return null;
          return (
            <div
              key={s.key}
              style={{ width: `${pct}%`, background: s.color }}
              title={`${s.label}: ${s.value?.toFixed(2)}%`}
            />
          );
        })}
      </div>

      <ul className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-6 list-none">
        {segs.map((s) => (
          <li key={s.key} className="flex items-start gap-2.5">
            <span className="block w-2.5 h-2.5 mt-1 shrink-0" style={{ background: s.color }} aria-hidden="true" />
            <div className="min-w-0">
              <p className="eyebrow">{s.label}</p>
              <p className="font-mono font-semibold tnum text-[20px] text-ink leading-none mt-1">
                {s.value != null ? `${s.value.toFixed(2)}%` : "—"}
              </p>
              <p className="text-[11px] text-mute-2 mt-1">{s.hint}</p>
            </div>
          </li>
        ))}
      </ul>

      {(pattern.asOf || pattern.source) && (
        <p className="mt-5 font-mono text-[11px] tracking-wide text-mute-2">
          {pattern.asOf ? `As of ${compactDate(pattern.asOf)}` : ""}
          {pattern.asOf && pattern.source ? " · " : ""}
          {pattern.source === "NSE"
            ? "Source: NSE corporate filings"
            : pattern.source === "Yahoo"
              ? "Source: market data (estimated)"
              : ""}
        </p>
      )}
    </div>
  );
}
