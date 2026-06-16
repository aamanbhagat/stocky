import Link from "next/link";
import type { Company } from "@prisma/client";
import { sectorColor } from "@/lib/sectors";
import { crFromCr } from "@/lib/format";

export function CompanyCard({ c, compact = false }: { c: Company; compact?: boolean }) {
  const color = sectorColor(c.sector);
  return (
    <Link
      href={`/companies/${c.slug}`}
      className="group block bg-paper-warm border border-rule hover:border-ink transition-colors relative"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className={`p-4 ${compact ? "" : "min-h-[120px]"}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[11px] tracking-wider text-mute uppercase">{c.exchange}</p>
            <p className="font-display text-[19px] leading-tight text-ink truncate group-hover:text-saffron-dim">
              {c.name}
            </p>
          </div>
          <span className="font-mono text-[12px] text-ink-2 shrink-0">{c.symbol}</span>
        </div>
        {!compact && (
          <div className="mt-3 flex items-end justify-between">
            <p className="text-[11px] text-mute-2 truncate max-w-[60%]" title={c.sector ?? ""}>
              {c.sector ?? "—"}
            </p>
            <p className="font-mono text-[13px] tnum text-ink">
              {c.marketCap ? crFromCr(c.marketCap) : "—"}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
