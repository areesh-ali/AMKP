type Tone = "ok" | "warn" | "danger" | "muted";

const tones: Record<Tone, string> = {
  ok: "bg-ok-soft text-ok",
  warn: "bg-working-soft text-working",
  danger: "bg-cost-soft text-cost",
  muted: "bg-canvas text-muted",
};

export function Badge({
  tone = "muted",
  children,
}: {
  tone?: Tone;
  children: string;
}) {
  return (
    <span
      className={[
        "inline-block rounded-full px-2 py-0.5 text-[12px] font-medium",
        tones[tone],
      ].join(" ")}
    >
      {children}
    </span>
  );
}
