import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createPlaneClient } from "../../../shared/api/client";
import { formatApiError } from "../../../shared/api/errors";
import { useSession } from "../../../shared/session/SessionContext";
import {
  AlertBanner,
  Badge,
  Button,
  PageHeader,
} from "../../../shared/ui";
import { ChunksPreview } from "../components/ChunksPreview";
import { LifecycleActions } from "../components/LifecycleActions";
import { VersionsList } from "../components/VersionsList";
import {
  asChunks,
  asVersions,
  statusTone,
  type ChunkRow,
  type DocRow,
  type VersionRow,
} from "../lib/types";

export function DocumentDetailPage() {
  const { documentId = "" } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const { session } = useSession();
  const [doc, setDoc] = useState<DocRow | null>(null);
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [chunks, setChunks] = useState<ChunkRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const tenant =
    session?.role === "operator"
      ? createPlaneClient(session).tenant
      : null;

  const load = useCallback(async () => {
    if (!session || session.role !== "operator" || !documentId) {
      setDoc(null);
      setVersions([]);
      setChunks([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { tenant: client } = createPlaneClient(session);
      if (!client) throw new Error("Tenant client unavailable");

      const detail = await client.getDocument(documentId);
      setDoc(detail);

      const sourceKey = detail.sourceKey?.trim();
      if (sourceKey) {
        const ver = await client.listDocumentVersions(sourceKey);
        setVersions(asVersions(ver.items));
      } else {
        setVersions([]);
      }

      const ch = await client.listDocumentChunks(documentId);
      setChunks(asChunks(ch.items));
    } catch (e) {
      setError(formatApiError(e));
      setDoc(null);
      setVersions([]);
      setChunks([]);
    } finally {
      setLoading(false);
    }
  }, [session, documentId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (session?.role === "admin") {
    return (
      <div className="mx-auto max-w-stream">
        <PageHeader
          title="Document"
          description="Sign in as Tenant Operator to inspect versions and chunks."
        />
      </div>
    );
  }

  const title =
    doc?.filename ?? doc?.sourceKey ?? (documentId || "Document");

  return (
    <div className="mx-auto max-w-stream space-y-8">
      <div className="space-y-3">
        <Link
          to="/documents"
          className="text-sm font-medium text-muted hover:text-ink"
        >
          ← Documents
        </Link>
        <PageHeader
          title={title}
          description="Confirm version and chunks are ready before Retrieve."
        />
        <div className="flex flex-wrap items-center gap-2">
          {doc?.status ? (
            <Badge tone={statusTone(doc.status)}>{doc.status}</Badge>
          ) : null}
          {doc?.version != null ? (
            <span className="font-mono text-sm text-muted">v{doc.version}</span>
          ) : null}
          <Button type="button" onClick={() => void load()} disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </Button>
          <Link
            to="/"
            className="rounded-md bg-teal px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            Ask in Studio
          </Link>
        </div>
      </div>

      {error ? <AlertBanner message={error} /> : null}

      {doc ? (
        <section className="space-y-2">
          <h2 className="text-sm font-medium tracking-wide text-muted uppercase">
            Metadata
          </h2>
          <dl className="grid gap-2 rounded-xl border border-line bg-elevated p-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Document ID</dt>
              <dd className="font-mono text-[12px] break-all">
                {doc.documentId ?? documentId}
              </dd>
            </div>
            <div>
              <dt className="text-muted">sourceKey</dt>
              <dd className="font-mono text-[12px] break-all">
                {doc.sourceKey ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Content type</dt>
              <dd>{doc.contentType ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Size</dt>
              <dd>
                {doc.byteSize != null
                  ? `${doc.byteSize.toLocaleString()} bytes`
                  : "—"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted">Content hash</dt>
              <dd className="font-mono text-[12px] break-all">
                {doc.contentHash ?? "—"}
              </dd>
            </div>
          </dl>
        </section>
      ) : null}

      {tenant && doc ? (
        <LifecycleActions
          client={tenant}
          documentId={documentId}
          sourceKey={doc.sourceKey}
          filename={doc.filename}
          onChanged={() => void load()}
          onDeleted={() => navigate("/documents", { replace: true })}
        />
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-medium tracking-wide text-muted uppercase">
          Versions
        </h2>
        <VersionsList versions={versions} activeId={documentId} />
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-medium tracking-wide text-muted uppercase">
            Chunks
          </h2>
          <span className="text-[12px] text-muted">{chunks.length} total</span>
        </div>
        <ChunksPreview chunks={chunks} />
      </section>
    </div>
  );
}
