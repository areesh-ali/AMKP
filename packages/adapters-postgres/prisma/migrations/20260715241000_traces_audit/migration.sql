-- Durable retrieve Traces (T-6.1 hardening).
CREATE TABLE "traces" (
    "request_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "record" JSONB NOT NULL,

    CONSTRAINT "traces_pkey" PRIMARY KEY ("request_id")
);

CREATE INDEX "traces_tenant_id_idx" ON "traces"("tenant_id");

-- Durable audit log (T-4.2 hardening).
CREATE TABLE "audit_entries" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "tenant_id" TEXT,
    "detail" JSONB,
    "at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_entries_tenant_id_idx" ON "audit_entries"("tenant_id");
CREATE INDEX "audit_entries_at_idx" ON "audit_entries"("at");
