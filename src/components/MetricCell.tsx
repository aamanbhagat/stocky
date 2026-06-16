export function MetricCell({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="p-5 bg-paper-warm border border-rule">
      <p className="eyebrow">{label}</p>
      <p
        className={`font-mono tnum mt-1 leading-none ${
          accent ? "text-saffron-dim" : "text-ink"
        } text-[22px]`}
      >
        {value}
      </p>
      {hint && <p className="text-[11px] text-mute-2 mt-1.5">{hint}</p>}
    </div>
  );
}
