import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";

export const revalidate = 86400;

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export const metadata: Metadata = {
  title: "Browse All NSE & BSE Listed Companies A–Z",
  description:
    "Browse every NSE and BSE listed company alphabetically. Jump to any letter to find a company's share price, market cap, CIN, ISIN and shareholding.",
  alternates: { canonical: "/browse" },
};

export default function BrowseIndex() {
  return (
    <>
      <div className="border-b border-rule bg-paper-warm">
        <div className="max-w-[1080px] mx-auto px-6 pt-6 pb-12">
          <Breadcrumb items={[{ href: "/", label: "Home" }, { label: "Browse A–Z" }]} />
          <h1 className="font-display text-[clamp(40px,5vw,64px)] leading-[0.98] mt-6 text-ink">
            Browse companies A–Z
          </h1>
          <p className="text-mute text-[15px] mt-3 max-w-2xl">
            Every NSE and BSE listing, alphabetically. Pick a letter to see all companies whose name
            starts with it.
          </p>
        </div>
      </div>

      <section className="max-w-[1080px] mx-auto px-6 py-12">
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 gap-3">
          {LETTERS.map((L) => (
            <Link
              key={L}
              href={`/browse/${L.toLowerCase()}`}
              className="border border-rule py-4 text-center font-display text-[22px] text-ink hover:border-ink hover:text-saffron-dim"
            >
              {L}
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
