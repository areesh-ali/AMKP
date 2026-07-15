-- AlterTable
ALTER TABLE "tenants" ADD COLUMN "agentic_max_hops" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "tenants" ADD COLUMN "agentic_max_cost_usd" DOUBLE PRECISION NOT NULL DEFAULT 0.01;
