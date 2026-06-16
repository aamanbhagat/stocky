import Link from "next/link";

type Crumb = { href?: string; label: string };

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="font-mono text-[11px] tracking-widest uppercase text-mute-2">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((c, i) => (
          <li key={i} className="flex items-center gap-2">
            {c.href ? (
              <Link href={c.href} className="hover:text-saffron-dim">{c.label}</Link>
            ) : (
              <span className="text-ink">{c.label}</span>
            )}
            {i < items.length - 1 && <span className="text-rule-strong">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
