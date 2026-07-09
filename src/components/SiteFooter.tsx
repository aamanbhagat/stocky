import Link from "next/link";
import { BRAND } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-rule mt-20 bg-ink text-paper">
      <div className="max-w-[1280px] mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-2">
          <p className="font-display text-2xl leading-tight">
            The open record of <span className="italic text-saffron">India&rsquo;s listed companies.</span>
          </p>
          <p className="text-[13px] text-paper/60 mt-3 max-w-md">
            {BRAND} sources data from NSE Archives, the BSE public scrip master and Yahoo
            Finance. Updated weekly. For informational use only — not investment advice.
          </p>
        </div>
        <div>
          <p className="eyebrow text-paper/60">Browse</p>
          <ul className="mt-3 space-y-1.5 text-[13px]">
            <li><Link href="/companies" className="hover:text-saffron">All companies</Link></li>
            <li><Link href="/browse" className="hover:text-saffron">Browse A–Z</Link></li>
            <li><Link href="/stocks" className="hover:text-saffron">Stock lists</Link></li>
            <li><Link href="/exchange/nse" className="hover:text-saffron">NSE listings</Link></li>
            <li><Link href="/exchange/bse" className="hover:text-saffron">BSE listings</Link></li>
            <li><Link href="/sitemap.xml" className="hover:text-saffron">Sitemap</Link></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow text-paper/60">About</p>
          <ul className="mt-3 space-y-1.5 text-[13px]">
            <li><Link href="/about" className="hover:text-saffron">About &amp; sources</Link></li>
            <li><Link href="/methodology" className="hover:text-saffron">Data methodology</Link></li>
            <li><Link href="/disclaimer" className="hover:text-saffron">Disclaimer</Link></li>
            <li><Link href="/privacy" className="hover:text-saffron">Privacy policy</Link></li>
            <li><Link href="/contact" className="hover:text-saffron">Contact</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-paper/10">
        <div className="max-w-[1280px] mx-auto px-6 py-4 flex items-center justify-between text-[11px] text-paper/50 font-mono">
          <span>© {new Date().getFullYear()} {BRAND}</span>
          <span>BUILT IN INDIA · MADE FOR INVESTORS</span>
        </div>
      </div>
    </footer>
  );
}
