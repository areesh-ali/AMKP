export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <header className="mb-6">
      <h2 className="mb-2 font-display text-[32px] font-semibold tracking-[-0.02em]">
        {title}
      </h2>
      {description ? <p className="text-muted">{description}</p> : null}
    </header>
  );
}
