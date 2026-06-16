import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const bar = (h: number, color: string) => (
    <div style={{ display: "flex", width: 26, height: h, background: color, borderRadius: 5 }} />
  );
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0D1B2A",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 14,
          paddingBottom: 46,
        }}
      >
        {bar(48, "#F5F7FA")}
        {bar(72, "#FF9500")}
        {bar(100, "#FF9500")}
      </div>
    ),
    { ...size }
  );
}
