import Link from "next/link";
import { SECTORS, sectorColor } from "@/lib/sectors";
import { slugify } from "@/lib/slug";
import { prisma } from "@/lib/prisma";

export async function SectorGrid() {
  const counts = await prisma.company.groupBy({
    by: ["sector"],
    _count: { _all: true },
  });
  const map = new Map(counts.map((c) => [c.sector ?? "", c._count._all]));

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-rule border border-rule">
      {SECTORS.map((s) => {
        const n = map.get(s) ?? 0;
        const color = sectorColor(s);
        return (
          <Link
            key={s}
            href={`/sector/${slugify(s)}`}
            className="group bg-paper-warm hover:bg-paper-2 p-4 flex flex-col justify-between min-h-[110px] relative"
          >
            <div
              className="absolute left-0 top-0 bottom-0 w-[3px]"
              style={{ background: color }}
            />
            <p className="font-display text-[17px] leading-snug text-ink pr-4">{s}</p>
            <div className="flex items-end justify-between mt-3">
              <p className="font-mono text-[11px] tracking-wider text-mute uppercase">
                {n} {n === 1 ? "company" : "companies"}
              </p>
              <span className="font-mono text-mute-2 group-hover:text-saffron-dim transition-colors">→</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
