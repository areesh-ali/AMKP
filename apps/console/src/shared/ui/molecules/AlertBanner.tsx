export function AlertBanner({
  message,
  tone = "danger",
}: {
  message: string;
  tone?: "danger" | "warn";
}) {
  return (
    <p
      role="alert"
      className={[
        "rounded-lg border px-3 py-2 text-[13px]",
        tone === "danger"
          ? "border-danger/30 bg-cost-soft text-danger"
          : "border-working/40 bg-working-soft text-working",
      ].join(" ")}
    >
      {message}
    </p>
  );
}
