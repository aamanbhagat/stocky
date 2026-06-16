const SUFFIX = /\s+(limited|ltd|ltd\.|pvt|private|corp|corporation|inc)\.?$/i;
const COMMON_SHORT: Record<string, string> = {
  "limited": "ltd",
  "ltd.": "ltd",
};

export function slugify(name: string): string {
  let s = name.trim().toLowerCase();
  s = s.replace(/&/g, " and ");
  s = s.replace(/[._'"]/g, "");
  s = s.replace(/[^a-z0-9]+/g, "-");
  s = s.replace(/^-+|-+$/g, "");
  return s;
}

export function companySlug(name: string, symbol: string): string {
  let base = slugify(name);
  if (!base) base = slugify(symbol);
  // collapse common phrases
  base = base.replace(/-(private|pvt)-(limited|ltd)/g, "-pvt-ltd");
  base = base.replace(/-limited$/g, "-ltd");
  return base || symbol.toLowerCase();
}

export function sectorSlug(sector: string): string {
  return slugify(sector);
}
