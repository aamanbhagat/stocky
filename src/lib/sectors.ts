// Sector palette — each sector gets its own left-rail color.
// Chosen to harmonize with navy/saffron base while staying distinct.

export const SECTORS = [
  "Financial Services",
  "Information Technology",
  "Oil Gas & Consumable Fuels",
  "Fast Moving Consumer Goods",
  "Automobile and Auto Components",
  "Healthcare",
  "Metals & Mining",
  "Power",
  "Telecommunication",
  "Construction",
  "Capital Goods",
  "Chemicals",
  "Consumer Durables",
  "Consumer Services",
  "Realty",
  "Textiles",
  "Media Entertainment & Publication",
  "Services",
  "Forest Materials",
  "Diversified",
] as const;

export type Sector = (typeof SECTORS)[number];

export const SECTOR_COLORS: Record<string, string> = {
  "Financial Services": "#0E7C66",
  "Information Technology": "#4F46E5",
  "Oil Gas & Consumable Fuels": "#B45309",
  "Fast Moving Consumer Goods": "#BE185D",
  "Automobile and Auto Components": "#0EA5B7",
  "Healthcare": "#16A34A",
  "Metals & Mining": "#71717A",
  "Power": "#EAB308",
  "Telecommunication": "#7C3AED",
  "Construction": "#A16207",
  "Capital Goods": "#0F766E",
  "Chemicals": "#C026D3",
  "Consumer Durables": "#DC2626",
  "Consumer Services": "#EA580C",
  "Realty": "#9D174D",
  "Textiles": "#9333EA",
  "Media Entertainment & Publication": "#0891B2",
  "Services": "#3F6212",
  "Forest Materials": "#365314",
  "Diversified": "#475569",
};

export function sectorColor(sector?: string | null): string {
  if (!sector) return "#475569";
  return SECTOR_COLORS[sector] ?? "#475569";
}

// Heuristic mapping from NSE/BSE industry strings to top-level sectors
const MAP: Array<[RegExp, string]> = [
  [/bank|financ|nbfc|insur|asset|broker|invest|holding/i, "Financial Services"],
  [/software|it serv|comput|tech|saas|ites|bpo/i, "Information Technology"],
  [/oil|gas|petrol|refin|fuel|coal/i, "Oil Gas & Consumable Fuels"],
  [/fmcg|consumer goods|food|beverage|dairy|tobacco|persona/i, "Fast Moving Consumer Goods"],
  [/auto|tyre|tire|vehicl|truck|two wheeler/i, "Automobile and Auto Components"],
  [/pharma|hospital|health|diagnostic|biotech|medical/i, "Healthcare"],
  [/steel|iron|aluminium|aluminum|copper|zinc|mine|metal/i, "Metals & Mining"],
  [/power|electric utility|generation|transmission/i, "Power"],
  [/telecom|wireless|broadband/i, "Telecommunication"],
  [/construct|infra|engineer|cement/i, "Construction"],
  [/capital goods|machin|industrial|electrical equip|defen/i, "Capital Goods"],
  [/chemical|fertili[sz]er|paint|dye/i, "Chemicals"],
  [/consumer durabl|home appli|electronic/i, "Consumer Durables"],
  [/retail|hotel|restaurant|travel|airline|leisure|education/i, "Consumer Services"],
  [/realty|real estate|property/i, "Realty"],
  [/textile|garment|apparel|cotton|spin/i, "Textiles"],
  [/media|broadcast|publish|film|entertain/i, "Media Entertainment & Publication"],
  [/logistic|shipping|port|transport|courier|warehous/i, "Services"],
  [/paper|forest|timber|sugar/i, "Forest Materials"],
];

export function inferSector(industry?: string | null): string {
  if (!industry) return "Diversified";
  for (const [re, sec] of MAP) if (re.test(industry)) return sec;
  return "Diversified";
}
