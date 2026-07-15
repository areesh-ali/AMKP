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
| `health()` | `GET /health` |
| `me()` | `GET /v1/me` |
| `ingest(...)` | `POST /v1/ingest` |
| `retrieve(...)` | `POST /v1/retrieve` |
| `getTrace(requestId)` | `GET /v1/traces/:requestId` |
