import { useState } from "react";
import { Button } from "../atoms/Button";

/** One-time key reveal — never re-show after dismiss */
export function OneTimeSecret({
  value,
  onDismiss,
}: {
  value: string;
  onDismiss: () => void;
}) {
  const [copyState, setCopyState] = useState<"idle" | "ok" | "fail">("idle");

  async function onCopy() {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("clipboard unavailable");
      }
      await navigator.clipboard.writeText(value);
      setCopyState("ok");
    } catch {
      setCopyState("fail");
    }
  }

  return (
    <div
      className="rounded-xl border border-working bg-working-soft p-4"
      role="dialog"
      aria-label="One-time secret reveal"
    >
      <p className="mb-2 text-sm font-semibold text-working">
        Copy now — plaintext will not be shown again
      </p>
      <code className="mb-3 block select-all break-all font-mono text-[13px]">
        {value}
      </code>
      <Button variant="secondary" onClick={() => void onCopy()}>
        {copyState === "ok" ? "Copied" : "Copy"}
      </Button>
      <Button variant="ghost" className="ml-2" onClick={onDismiss}>
        Dismiss
      </Button>
      {copyState === "fail" ? (
        <p className="mt-2 text-[12px] text-muted">
          Clipboard blocked — select the key above and copy manually.
        </p>
      ) : null}
    </div>
  );
}
