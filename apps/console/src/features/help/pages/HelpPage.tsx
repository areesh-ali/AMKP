import { PageHeader } from "../../../shared/ui";
import { baseUrl } from "../../../shared/session/vault";

export function HelpPage() {
  return (
    <div className="mx-auto max-w-stream space-y-4">
      <PageHeader
        title="Help / DX"
        description="SDK, MCP, and OpenAPI remain first-class builder surfaces alongside AMKP Console."
      />
      <ul className="space-y-3 text-sm">
        <li className="rounded-xl border border-line bg-elevated px-4 py-3">
          <div className="font-medium">JavaScript SDK</div>
          <p className="mt-1 text-muted">
            <span className="font-mono text-ink">@amkp/sdk-js</span> — same
            client the Console uses for Retrieve, ingest, eval, and traces.
          </p>
        </li>
        <li className="rounded-xl border border-line bg-elevated px-4 py-3">
          <div className="font-medium">Plane base URL</div>
          <p className="mt-1 font-mono text-[13px] text-ink">{baseUrl()}</p>
        </li>
        <li className="rounded-xl border border-line bg-elevated px-4 py-3">
          <div className="font-medium">OpenAPI / MCP</div>
          <p className="mt-1 text-muted">
            Point builders at{" "}
            <span className="font-mono text-ink">{baseUrl()}/openapi.json</span>{" "}
            and MCP tools under{" "}
            <span className="font-mono text-ink">/v1/mcp</span>.
          </p>
        </li>
      </ul>
    </div>
  );
}
