import Link from "next/link";

export default function NotFound() {
  return (
    <section className="max-w-[1280px] mx-auto px-6 py-32 grid lg:grid-cols-12 gap-10 items-center">
      <div className="lg:col-span-7">
        <p className="eyebrow">404 · Off the boards</p>
        <h1 className="font-display text-[clamp(50px,8vw,96px)] leading-[0.95] mt-3">
          That listing isn&rsquo;t on the <span className="italic text-saffron-dim">board.</span>
        </h1>
        <p className="text-mute mt-5 max-w-lg">
          The symbol you&rsquo;re looking for may have been delisted, renamed, or never existed.
          Try searching the directory.
        </p>
        <div className="mt-7 flex gap-3 font-mono text-[12px] tracking-widest uppercase">
          <Link href="/" className="px-4 py-3 bg-ink text-paper hover:bg-saffron hover:text-ink">
            Home
          </Link>
          <Link href="/companies" className="px-4 py-3 border border-ink hover:bg-ink hover:text-paper">
            Browse directory
          </Link>
        </div>
      </div>
      <div className="lg:col-span-5 lg:border-l lg:border-rule lg:pl-10">
        <p className="font-mono text-[11px] tracking-widest uppercase text-mute">last seen</p>
        <p className="font-mono text-[14px] tnum mt-2 text-mute-2 leading-relaxed">
          ████ ─ ─ ─ ─<br />
          NSE/BSE record could not be located in the FinanceCity index.
        </p>
      </div>
    </section>
  );
}
