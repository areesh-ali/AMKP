import { FormEvent, useState } from "react";
import type { AmkpClient } from "@amkp/sdk-js";
import { formatApiError } from "../../../shared/api/errors";
import { AlertBanner, Button, Input, Label } from "../../../shared/ui";

export function LifecycleActions({
  client,
  documentId,
  sourceKey,
  filename,
  onChanged,
  onDeleted,
}: {
  client: AmkpClient;
  documentId: string;
  sourceKey?: string;
  filename?: string;
  onChanged: () => void;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [keep, setKeep] = useState("2");

  async function run(label: string, fn: () => Promise<void>) {
    setBusy(label);
    setError(null);
    setNotice(null);
    try {
      await fn();
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(null);
    }
  }

  async function onReparse() {
    await run("reparse", async () => {
      const res = await client.reparseDocument(documentId);
      setNotice(`Reparse queued (job ${res.jobId}, status ${res.status}).`);
      onChanged();
    });
  }

  async function onDownload() {
    await run("download", async () => {
      const buf = await client.getDocumentContent(documentId);
      const blob = new Blob([buf]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename?.trim() || `${documentId}.bin`;
      a.click();
      URL.revokeObjectURL(url);
      setNotice("Download started.");
    });
  }

  async function onDelete() {
    if (
      !window.confirm(
        "Delete this document version? Chunks for this version will be removed.",
      )
    ) {
      return;
    }
    await run("delete", async () => {
      await client.deleteDocument(documentId);
      onDeleted();
    });
  }

  async function onPrune(e: FormEvent) {
    e.preventDefault();
    if (!sourceKey?.trim()) {
      setError("sourceKey required to prune versions.");
      return;
    }
    const n = Number(keep);
    if (!Number.isFinite(n) || n < 1) {
      setError("Keep must be a positive number.");
      return;
    }
    if (
      !window.confirm(
        `Prune older versions of ${sourceKey}, keeping the newest ${n}?`,
      )
    ) {
      return;
    }
    await run("prune", async () => {
      const res = await client.pruneDocumentVersions({
        sourceKey: sourceKey.trim(),
        keep: n,
      });
      setNotice(
        `Kept ${res.kept}; deleted ${res.deleted.length} older version(s).`,
      );
      onChanged();
    });
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium tracking-wide text-muted uppercase">
        Lifecycle
      </h2>
      {error ? <AlertBanner message={error} /> : null}
      {notice ? (
        <p className="rounded-lg border border-line bg-teal-soft px-3 py-2 text-sm text-teal">
          {notice}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          disabled={busy !== null}
          onClick={() => void onReparse()}
        >
          {busy === "reparse" ? "Reparsing…" : "Reparse"}
        </Button>
        <Button disabled={busy !== null} onClick={() => void onDownload()}>
          {busy === "download" ? "Downloading…" : "Download"}
        </Button>
        <Button
          variant="danger"
          disabled={busy !== null}
          onClick={() => void onDelete()}
        >
          {busy === "delete" ? "Deleting…" : "Delete"}
        </Button>
      </div>
      {sourceKey ? (
        <form
          onSubmit={(e) => void onPrune(e)}
          className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-elevated p-4"
        >
          <div className="w-28 space-y-1">
            <Label htmlFor="keep">Keep newest</Label>
            <Input
              id="keep"
              name="keep"
              type="number"
              min={1}
              mono
              value={keep}
              onChange={(e) => setKeep(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={busy !== null}>
            {busy === "prune" ? "Pruning…" : "Prune older versions"}
          </Button>
          <p className="basis-full text-[12px] text-muted">
            Prunes by sourceKey <span className="font-mono">{sourceKey}</span>
          </p>
        </form>
      ) : null}
    </section>
  );
}
