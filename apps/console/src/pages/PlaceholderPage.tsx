type Props = {
  title: string;
  blurb: string;
  cap?: string;
};

export function PlaceholderPage({ title, blurb, cap }: Props) {
  return (
    <div className="max-w-stream">
      <h2 className="mb-2 font-display text-[32px] font-semibold tracking-[-0.02em] text-ink">
        {title}
      </h2>
      <p className="mb-6 text-muted">{blurb}</p>
      {cap ? <p className="text-[13px] text-muted">{cap}</p> : null}
    </div>
  );
}
