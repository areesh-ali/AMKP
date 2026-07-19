import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createPlaneClient } from "../../../shared/api/client";
import { formatApiError } from "../../../shared/api/errors";
import { useSession } from "../../../shared/session/SessionContext";
import {
  AlertBanner,
  Badge,
  Button,
  PageHeader,
} from "../../../shared/ui";
import { asDocs, docId, statusTone, type DocRow } from "../lib/types";

export function DocumentsPage() {
  const { session } = useSession();
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const refresh = useCallback(async () => {
    if (!session || session.role !== "operator") {
      setDocs([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { tenant } = createPlaneClient(session);
      if (!tenant) {
        throw new Error("Tenant client unavailable — sign in as Operator");
      }
      const res = await tenant.listDocuments({ limit: 50 });
      setDocs(asDocs(res.items));
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!session || session.role !== "operator") return;
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) {
      setError("Choose a file to upload.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const { tenant } = createPlaneClient(session);
      if (!tenant) return;
      await tenant.ingestUpload({
        file,
        filename: file.name,
        contentType: file.type || undefined,
      });
      form.reset();
      await refresh();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setUploading(false);
    }
  }

  if (session?.role === "admin") {
    return (
      <div className="mx-auto max-w-stream">
        <PageHeader
          title="Documents"
          description="Sign in as Tenant Operator with a Tenant API key to upload and list documents."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-stream space-y-6">
      <PageHeader
        title="Documents"
        description="Upload and track parse status for the Active Tenant."
      />
      <form
        onSubmit={onUpload}
        className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-elevated p-4"
      >
        <input
          name="file"
          type="file"
          className="text-sm text-muted file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-teal-soft file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-teal"
          required
        />
        <Button type="submit" variant="primary" disabled={uploading}>
          {uploading ? "Uploading…" : "Upload"}
        </Button>
        <Button type="button" onClick={() => void refresh()}>
          Refresh
        </Button>
      </form>
      {error ? <AlertBanner message={error} /> : null}
      <div className="overflow-hidden rounded-xl border border-line bg-elevated">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-[12px] tracking-wide text-muted uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Document</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Version</th>
              <th className="px-4 py-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => {
              const id = docId(d);
              const when = d.updatedAt ?? d.createdAt;
              const label = d.sourceKey ?? (id || "—");
              return (
                <tr key={id || label} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    {id ? (
                      <Link
                        to={`/documents/${encodeURIComponent(id)}`}
                        className="block hover:text-teal"
                      >
                        <div className="font-medium">{label}</div>
                        <div className="font-mono text-[11px] text-muted">
                          {id}
                        </div>
                      </Link>
                    ) : (
                      <>
                        <div className="font-medium">{label}</div>
                        <div className="font-mono text-[11px] text-muted">—</div>
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(d.status)}>
                      {d.status ?? "unknown"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px]">
                    {d.version != null ? `v${d.version}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {when ? new Date(when).toLocaleString() : "—"}
                  </td>
                </tr>
              );
            })}
            {!loading && docs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  No documents yet — upload to ground Retrieve.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
