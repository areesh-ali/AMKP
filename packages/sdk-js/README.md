# @amkp/sdk-js

Official TypeScript/JavaScript client for AMKP (T-8.2).

## Signup → key → ingest → retrieve (<60 minutes)

```bash
# 1) Run API locally (see repo README)
pnpm docker:up
pnpm --filter @amkp/api dev

# 2) Create Account/Tenant with PLATFORM_ADMIN_TOKEN, copy apiKey

# 3) Use the SDK
```

```ts
import { AmkpClient } from "@amkp/sdk-js";
import { readFileSync } from "node:fs";

const client = new AmkpClient({
  baseUrl: "http://localhost:3000",
  apiKey: process.env.AMKP_API_KEY!,
});

await client.me();

const contentBase64 = readFileSync("./note.md").toString("base64");
await client.ingest({
  filename: "note.md",
  contentType: "text/markdown",
  contentBase64,
});

const envelope = await client.retrieve({ query: "refund policy" });
console.log(envelope.outcome);

if (envelope.requestId) {
  const trace = await client.getTrace(envelope.requestId);
  console.log(trace.evidenceIds);
}
```

## Methods

| Method | Endpoint |
| --- | --- |
| `health()` / `ready()` | `GET /health`, `GET /ready` |
| `me()` | `GET /v1/me` |
| `ingest(...)` | `POST /v1/ingest` |
| `ingestUpload(...)` | `POST /v1/ingest/upload` (multipart) |
| `listDocuments({ limit, cursor, status, sourceKey })` / `listDocumentVersions` / `pruneDocumentVersions` / `listDocumentChunks` / `getDocument` / `getDocumentContent` / `waitForDocument` / `deleteDocument` / `reparseDocument` | documents |
| `retrieve(...)` | `POST /v1/retrieve` |
| `getTrace(requestId)` | `GET /v1/traces/:requestId` |
| `listMcpTools()` / `mcpRetrieve(...)` | MCP facade |
| `runGoldenEval(...)` / `runTableRankEval(...)` | eval |

### Admin client

```ts
import { AmkpAdminClient } from "@amkp/sdk-js";

const admin = new AmkpAdminClient({
  baseUrl: "http://localhost:3000",
  adminToken: process.env.PLATFORM_ADMIN_TOKEN!,
});

const { accountId } = await admin.createAccount("Acme");
await admin.listAccounts();
await admin.getAccount(accountId);
await admin.listTenants({ accountId });
const { apiKey } = await admin.createTenant(accountId, "support");
await admin.getTenant(/* tenantId */);
await admin.updateTenant(/* tenantId */, { pageVisionEnabled: true });
await admin.listApiKeys(/* tenantId */);
// await admin.createApiKey / revokeApiKey / rotateApiKey
const { items } = await admin.listAudit(50, { tenantId: "ten_..." });
```

`AmkpApiError` exposes `status`, `body`, and `requestId` (from `error.request_id` or `x-request-id`).
