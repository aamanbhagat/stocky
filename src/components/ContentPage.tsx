import { Breadcrumb } from "@/components/Breadcrumb";

export function ContentPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="border-b border-rule bg-paper-warm">
        <div className="max-w-[820px] mx-auto px-6 pt-6 pb-12">
          <Breadcrumb items={[{ href: "/", label: "Home" }, { label: title }]} />
          <p className="eyebrow mt-6">{eyebrow}</p>
          <h1 className="font-display text-[clamp(38px,5vw,60px)] leading-[1.02] mt-2 text-ink">
            {title}
          </h1>
          {intro && <p className="text-mute text-[16px] mt-4 max-w-2xl leading-relaxed">{intro}</p>}
        </div>
      </div>
      <article className="max-w-[820px] mx-auto px-6 py-12 prose-body">{children}</article>
    </>
  );
}
