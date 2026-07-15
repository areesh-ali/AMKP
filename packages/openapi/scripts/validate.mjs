import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const specPath = join(root, "..", "openapi.yaml");
const yaml = readFileSync(specPath, "utf8");

const required = [
  "/v1/accounts:",
  "/v1/accounts/{accountId}/tenants:",
  "/v1/tenants/{tenantId}/api-keys:",
  "/v1/me:",
  "/v1/retrieve:",
  "/v1/ingest:",
  "/v1/traces/{requestId}:",
  "/v1/mcp/tools:",
  "/v1/mcp/tools/retrieve:",
  "/v1/eval/golden-set:",
  "/v1/eval/table-rank:",
  "/v1/audit:",
  "/metrics:",
  "PlatformAdminBearer:",
  "TenantApiKeyBearer:",
  "createAccount",
  "listAccounts",
  "getAccount",
  "createTenant",
  "listTenants",
  "getTenant",
  "createApiKey",
  "revokeApiKey",
  "rotateApiKey",
  "retrieve",
  "getMe",
  "ingestDocument",
  "ingestDocumentUpload",
  "deleteDocument",
  "reparseDocument",
  "getTrace",
  "listMcpTools",
  "mcpRetrieve",
  "runGoldenEval",
  "runTableRankEval",
  "getMetrics",
  "getReady",
  "listAudit",
  "EvidenceEnvelope:",
  "EvidenceItem:",
  "Citation:",
  "CostEstimate:",
  "PreferCorrectnessOutcome:",
  "TraceRecord:",
  "McpToolManifest:",
  "GoldenEvalReport:",
];

const missing = required.filter((s) => !yaml.includes(s));
if (missing.length > 0) {
  console.error("OpenAPI validation failed. Missing:", missing.join(", "));
  process.exit(1);
}

// T-3.2: citation required; no chat/answer fields on Retrieve contract
const citationRequired =
  yaml.includes("Citation:") &&
  yaml.includes("required: [documentId]") &&
  yaml.includes("required: [id, score, citation]");
if (!citationRequired) {
  console.error(
    "OpenAPI validation failed: EvidenceItem must require citation.documentId",
  );
  process.exit(1);
}

const forbiddenAnswerFields = [
  "\n        answer:\n",
  "\n        finalAnswer:\n",
  "\n        final_answer:\n",
  "\n        completion:\n",
  "\n        message:\n",
];
const envelopeIdx = yaml.indexOf("EvidenceEnvelope:");
if (envelopeIdx < 0) {
  console.error("OpenAPI validation failed: EvidenceEnvelope missing");
  process.exit(1);
}
const envelopeSlice = yaml.slice(envelopeIdx, envelopeIdx + 2500);
for (const field of forbiddenAnswerFields) {
  if (envelopeSlice.includes(field)) {
    console.error(
      `OpenAPI validation failed: EvidenceEnvelope must not define chat answer field (${field.trim()})`,
    );
    process.exit(1);
  }
}

const retrieve200UsesEnvelope =
  yaml.includes('operationId: retrieve') &&
  yaml.includes("#/components/schemas/EvidenceEnvelope");
if (!retrieve200UsesEnvelope) {
  console.error(
    "OpenAPI validation failed: /v1/retrieve 200 must $ref EvidenceEnvelope",
  );
  process.exit(1);
}

console.log(
  "openapi.yaml OK — Tenancy + Ingest + EvidenceEnvelope (no answer fields)",
);
