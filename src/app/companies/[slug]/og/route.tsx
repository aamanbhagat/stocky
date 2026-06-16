import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { crFromCr } from "@/lib/format";
import { sectorColor } from "@/lib/sectors";
import { BRAND, SITE_HOST } from "@/lib/site";

export const runtime = "nodejs";
export const revalidate = 604800;

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;
  const c = await prisma.company.findUnique({ where: { slug } });
  if (!c) return new Response("Not found", { status: 404 });

  const ex = c.exchange === "BOTH" ? "NSE · BSE" : c.exchange;
  const cap = c.marketCap ? crFromCr(c.marketCap) : "—";
  const color = sectorColor(c.sector);
  const isinLine = c.isin ? `${c.symbol}  ·  ISIN ${c.isin}` : c.symbol;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#F5F7FA",
          padding: 60,
          borderLeft: `14px solid ${color}`,
        }}
      >
        <div style={{ display: "flex", gap: 14, alignItems: "center", fontFamily: "monospace" }}>
          <div style={{ display: "flex", fontSize: 18, letterSpacing: 4, textTransform: "uppercase", color: "#4B5563" }}>
            {BRAND}
          </div>
          <div style={{ display: "flex", fontSize: 14, padding: "4px 10px", background: "#0D1B2A", color: "#F5F7FA", letterSpacing: 3, textTransform: "uppercase" }}>
            {ex}
          </div>
          <div style={{ display: "flex", fontSize: 14, padding: "4px 10px", border: `2px solid ${color}`, color, letterSpacing: 3, textTransform: "uppercase" }}>
            {c.sector ?? "Diversified"}
          </div>
        </div>

        <div style={{ display: "flex", marginTop: 36, fontSize: 84, lineHeight: 1.0, color: "#0D1B2A", fontFamily: "serif" }}>
          {c.name}
        </div>

        <div style={{ display: "flex", marginTop: 18, fontSize: 26, color: "#C46E00", fontFamily: "monospace" }}>
          {isinLine}
        </div>

        <div style={{ display: "flex", marginTop: "auto", justifyContent: "space-between", alignItems: "flex-end", fontFamily: "monospace" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 14, letterSpacing: 3, color: "#6B7280", textTransform: "uppercase" }}>
              Market cap
            </div>
            <div style={{ display: "flex", fontSize: 64, color: "#0D1B2A", marginTop: 6 }}>
              {cap}
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 16, letterSpacing: 4, color: "#6B7280", textTransform: "uppercase" }}>
            {SITE_HOST} / {c.slug}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
