import Link from "next/link";
import { LiveCap } from "@/components/LiveCap";

export type TapeRow = {
  symbol: string;
  slug: string;
  name: string;
  marketCap: number | null;
  yahooSymbol: string | null;
};

/** Live exchange-board ticker tape across the top of the homepage hero. */
export function Tape({ rows }: { rows: TapeRow[] }) {
  // Duplicate so the linear-translate loop seamlessly tiles
  const tiled = [...rows, ...rows];

  return (
    <div className="tape-pause overflow-hidden border-y border-rule bg-ink text-paper">
      <div className="tape-track flex whitespace-nowrap py-2.5 font-mono text-[12px]">
        {tiled.map((c, i) => (
          <Link
            key={`${c.symbol}-${i}`}
            href={`/companies/${c.slug}`}
            className="flex items-center gap-3 px-5 border-r border-paper/10 hover:text-saffron"
          >
            <span className="tracking-wider">{c.symbol}</span>
            <span className="text-saffron">●</span>
            <span className="tnum text-paper/80">
              <LiveCap symbol={c.yahooSymbol} seed={c.marketCap} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
