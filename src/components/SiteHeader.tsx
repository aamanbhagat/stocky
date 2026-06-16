import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-rule bg-paper-warm">
      <div className="max-w-[1280px] mx-auto px-6 h-[58px] flex items-center justify-between">
        <Link href="/" className="flex items-baseline gap-2 group">
          <span className="font-display text-[26px] leading-none text-ink">
            Finance<span className="italic text-saffron-dim">City</span>
          </span>
          <span className="eyebrow hidden sm:inline" aria-hidden="true">NSE · BSE · India</span>
        </Link>
        <nav className="flex items-center gap-7 text-[13px] text-ink-soft">
          <Link href="/companies" className="hover:text-saffron-dim">All companies</Link>
          <Link href="/exchange/nse" className="hover:text-saffron-dim">NSE</Link>
          <Link href="/exchange/bse" className="hover:text-saffron-dim">BSE</Link>
          <Link
            href="/companies"
            className="hidden md:inline px-3 py-1.5 border border-ink text-ink hover:bg-ink hover:text-paper transition-colors"
          >
            Search ↗
          </Link>
        </nav>
      </div>
    </header>
  );
}
