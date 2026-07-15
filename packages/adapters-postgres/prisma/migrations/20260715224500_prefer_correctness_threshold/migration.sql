-- AlterTable
ALTER TABLE "tenants" ADD COLUMN "prefer_correctness_threshold" DOUBLE PRECISION NOT NULL DEFAULT 0.5;
