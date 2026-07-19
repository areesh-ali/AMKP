import { Button } from "../atoms/Button";

/** Sally: one-time key reveal — never re-show after dismiss */
export function OneTimeSecret({
  value,
  onDismiss,
}: {
  value: string;
  onDismiss: () => void;
}) {
  return (
    <div
      className="rounded-xl border border-working bg-working-soft p-4"
      role="dialog"
      aria-label="One-time secret reveal"
    >
      <p className="mb-2 text-sm font-semibold text-working">
        Copy now — plaintext will not be shown again
      </p>
      <code className="mb-3 block break-all font-mono text-[13px]">{value}</code>
      <Button
        variant="secondary"
        onClick={() => void navigator.clipboard.writeText(value)}
      >
        Copy
      </Button>
      <Button variant="ghost" className="ml-2" onClick={onDismiss}>
        Dismiss
      </Button>
    </div>
  );
}
