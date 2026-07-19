import type { TraceRecord } from "@amkp/sdk-js";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { createPlaneClient } from "../../../shared/api/client";
import { formatApiError } from "../../../shared/api/errors";
import { useSession } from "../../../shared/session/SessionContext";
import {
  AlertBanner,
  Button,
  Input,
  Label,
  PageHeader,
} from "../../../shared/ui";
import { TraceDetail } from "../components/TraceDetail";

export function TracesPage() {
  const { session } = useSession();
  const [params, setParams] = useSearchParams();
  const fromUrl = params.get("requestId") ?? "";
  const [requestId, setRequestId] = useState(fromUrl);
  const [trace, setTrace] = useState<TraceRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (id: string) => {
      if (!session || session.role !== "operator") {
        setTrace(null);
        return;
      }
      const rid = id.trim();
      if (!rid) {
        setError("Enter a requestId from a Retrieve run.");
        setTrace(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const { tenant } = createPlaneClient(session);
        if (!tenant) throw new Error("Tenant client unavailable");
        setTrace(await tenant.getTrace(rid));
      } catch (e) {
        setError(formatApiError(e));
        setTrace(null);
      } finally {
        setLoading(false);
      }
    },
    [session],
  );

  useEffect(() => {
    setRequestId(fromUrl);
    if (!fromUrl) {
      setTrace(null);
      return;
    }
    void load(fromUrl);
  }, [fromUrl, load]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const rid = requestId.trim();
    if (!rid) {
      setError("Enter a requestId from a Retrieve run.");
      return;
    }
    if (rid === fromUrl) {
      void load(rid);
      return;
    }
    setParams({ requestId: rid }, { replace: true });
  }

  if (session?.role === "admin") {
    return (
      <div className="mx-auto max-w-stream">
        <PageHeader
          title="Traces"
          description="Sign in as Tenant Operator to inspect retrieve traces."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-stream space-y-6">
      <PageHeader
        title="Traces"
        description="Inspect router decisions and hops as tool steps for a requestId."
      />
      <form
        onSubmit={onSubmit}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-elevated p-4"
      >
        <div className="min-w-[16rem] flex-1 space-y-1">
          <Label htmlFor="requestId">requestId</Label>
          <Input
            id="requestId"
            name="requestId"
            mono
            value={requestId}
            onChange={(e) => setRequestId(e.target.value)}
            placeholder="Paste requestId from Evidence…"
          />
        </div>
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? "Loading…" : "Inspect"}
        </Button>
      </form>
      {error ? <AlertBanner message={error} /> : null}
      {trace ? <TraceDetail trace={trace} /> : null}
    </div>
  );
}
