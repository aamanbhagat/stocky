// Indian numbering formatters

export function inr(n?: number | null): string {
  if (n == null || !isFinite(n)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: n < 100 ? 2 : 0,
  }).format(n);
}

export function crore(n?: number | null): string {
  if (n == null || !isFinite(n)) return "—";
  const cr = n / 1e7;
  if (cr >= 1e5) return `₹${(cr / 1e5).toFixed(2)}L Cr`;
  if (cr >= 100) return `₹${cr.toFixed(0)} Cr`;
  return `₹${cr.toFixed(2)} Cr`;
}

export function crFromCr(cr?: number | null): string {
  if (cr == null || !isFinite(cr)) return "—";
  if (cr >= 1e5) return `₹${(cr / 1e5).toFixed(2)}L Cr`;
  if (cr >= 100) return `₹${cr.toFixed(0)} Cr`;
  return `₹${cr.toFixed(2)} Cr`;
}

export function pct(n?: number | null, digits = 2): string {
  if (n == null || !isFinite(n)) return "—";
  return `${n.toFixed(digits)}%`;
}

export function num(n?: number | null, digits = 2): string {
  if (n == null || !isFinite(n)) return "—";
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: digits }).format(n);
}

export function signedPct(n?: number | null, digits = 2): string {
  if (n == null || !isFinite(n)) return "—";
  const s = n >= 0 ? "+" : "";
  return `${s}${n.toFixed(digits)}%`;
}

export function ratio(n?: number | null, digits = 2): string {
  if (n == null || !isFinite(n)) return "—";
  return `${n.toFixed(digits)}x`;
}

export function compactDate(d?: Date | null): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}
