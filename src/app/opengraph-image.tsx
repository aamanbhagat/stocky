import { ImageResponse } from "next/og";
import { BRAND, SITE_HOST } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${BRAND} — NSE & BSE Listed Company Database`;

export default function OgImage() {
  const bar = (h: number, color: string) => (
    <div style={{ display: "flex", width: 40, height: h, background: color, borderRadius: 6 }} />
  );
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0D1B2A",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 70,
          color: "#F5F7FA",
          fontFamily: "monospace",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
          {bar(70, "#F5F7FA")}
          {bar(110, "#FF9500")}
          {bar(150, "#FF9500")}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 80, fontFamily: "serif", lineHeight: 1 }}>
            Finance<span style={{ color: "#FF9500", fontStyle: "italic" }}>City</span>
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#94A3B8", marginTop: 20, maxWidth: 900 }}>
            Share price, market cap, CIN, ISIN & shareholding for every NSE & BSE listed company.
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: "#6B7280", letterSpacing: 4, textTransform: "uppercase" }}>
          <div style={{ display: "flex" }}>5,000+ Indian stocks</div>
          <div style={{ display: "flex" }}>{SITE_HOST}</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
