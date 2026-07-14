import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const specPath = join(root, "..", "openapi.yaml");
const yaml = readFileSync(specPath, "utf8");

const required = [
  "/v1/accounts:",
  "/v1/accounts/{accountId}/tenants:",
  "PlatformAdminBearer:",
  "createAccount",
  "createTenant",
  "listTenants",
];

const missing = required.filter((s) => !yaml.includes(s));
if (missing.length > 0) {
  console.error("OpenAPI validation failed. Missing:", missing.join(", "));
  process.exit(1);
}

console.log("openapi.yaml OK — Account/Tenant endpoints present");
