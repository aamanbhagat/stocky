"use client";
import { useEffect, useRef, useState } from "react";
import { ADSENSE_CLIENT, ADSENSE_SLOT } from "@/lib/site";

type Props = {
  position: "top" | "mid" | "bottom" | "sidebar";
  /** Override the publisher id (defaults to site config). */
  client?: string;
  /** AdSense ad-unit slot id. Falls back to NEXT_PUBLIC_ADSENSE_SLOT. */
  slot?: string;
  className?: string;
};

/**
 * In-content ad slot.
 *
 * Lazy-mounts on intersection so it never blocks LCP. Renders a real AdSense
 * unit only when both a publisher id and a slot id are configured. With Auto
 * Ads enabled (publisher script loaded in the layout) Google places ads
 * automatically, so when no slot id is set this renders nothing in production
 * — no reserved empty box, no layout shift. The dashed placeholder appears in
 * development only, as a visual marker.
 */
export function AdSlot({ position, client = ADSENSE_CLIENT, slot = ADSENSE_SLOT, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const hasUnit = Boolean(client && slot);
  const isDev = process.env.NODE_ENV !== "production";

  useEffect(() => {
    if (!ref.current || visible) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        }
      },
      { rootMargin: "250px" }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!visible || !hasUnit) return;
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] };
      (w.adsbygoogle = w.adsbygoogle || []).push({});
    } catch {}
  }, [visible, hasUnit]);

  // Production with no explicit unit: render nothing (Auto Ads covers placement).
  if (!hasUnit && !isDev) return null;

  return (
    <div
      id={`ad-${position}`}
      ref={ref}
      data-ad-position={position}
      className={`my-6 ${className}`}
      aria-label="Advertisement"
      role="complementary"
    >
      {visible && hasUnit ? (
        <ins
          className="adsbygoogle block"
          style={{ display: "block" }}
          data-ad-client={client}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : visible && isDev ? (
        <div className="h-[90px] border border-dashed border-rule grid place-items-center text-[11px] text-mute-2 font-mono uppercase tracking-widest">
          ad · {position}
        </div>
      ) : (
        <div className="h-[90px]" />
      )}
    </div>
  );
}
