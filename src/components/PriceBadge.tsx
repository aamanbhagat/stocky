import { inr, signedPct } from "@/lib/format";

export function PriceBadge({
  price,
  changePct,
}: {
  price?: number | null;
  changePct?: number | null;
}) {
  if (price == null) return null;
  const up = (changePct ?? 0) >= 0;
  const color = up ? "var(--color-bull)" : "var(--color-bear)";
  return (
    <span className="inline-flex items-baseline gap-2">
      <span className="font-mono font-semibold tnum text-[22px] text-ink">{inr(price)}</span>
      {changePct != null && (
        <span className="font-mono font-semibold tnum text-[14px]" style={{ color }}>
          {up ? "▲" : "▼"} {signedPct(changePct)}
        </span>
      )}
    </span>
  );
}
