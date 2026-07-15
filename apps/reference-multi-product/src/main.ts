/**
 * Reference multi-Product demo (T-8.4).
 * Two logical Products (support + docs) share one AMKP plane via separate Tenants.
 *
 * Usage:
 *   AMKP_BASE_URL=http://localhost:3000 \
 *   AMKP_SUPPORT_KEY=... AMKP_DOCS_KEY=... \
 *   pnpm --filter @amkp/reference-multi-product start
 */
import { AmkpClient } from "@amkp/sdk-js";

async function main() {
  const baseUrl = process.env.AMKP_BASE_URL ?? "http://localhost:3000";
  const supportKey = process.env.AMKP_SUPPORT_KEY;
  const docsKey = process.env.AMKP_DOCS_KEY;
  if (!supportKey || !docsKey) {
    console.error(
      "Set AMKP_SUPPORT_KEY and AMKP_DOCS_KEY (two Tenant API keys).",
    );
    process.exit(1);
  }

  const support = new AmkpClient({ baseUrl, apiKey: supportKey });
  const docs = new AmkpClient({ baseUrl, apiKey: docsKey });

  const supportMe = await support.me();
  const docsMe = await docs.me();
  console.log("Products:", {
    supportTenant: supportMe.tenantId,
    docsTenant: docsMe.tenantId,
  });

  const supportHit = await support.retrieve({ query: "refund" });
  const docsHit = await docs.retrieve({ query: "getting started" });

  console.log("Support evidence count:", evidenceCount(supportHit));
  console.log("Docs evidence count:", evidenceCount(docsHit));
  console.log(
    "Cross-check: tenants differ?",
    supportMe.tenantId !== docsMe.tenantId,
  );
}

function evidenceCount(env: {
  outcome: { kind: string; items?: unknown[] };
}): number {
  return env.outcome.kind === "evidence" ? (env.outcome.items?.length ?? 0) : 0;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
