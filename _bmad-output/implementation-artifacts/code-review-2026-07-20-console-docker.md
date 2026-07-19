---
review_date: 2026-07-20
review_mode: no-spec
diff_source: working-tree + HEAD console/sdk + docker/README
status: in_progress
---

# Code review — Console, SDK, Docker stack

Adversarial pass (Winston arch + Amelia fixes). Spec: CAP-8 DX + Console CAP-1–9.

## Findings triage

| ID | Sev | Status | Issue |
| --- | --- | --- | --- |
| CR-1 | critical | **accepted risk / documented** | sessionStorage vault — labeled dev-only on SignIn; BFF deferred |
| CR-2 | critical | **fixed** | Dockerfiles + `docker-compose.stack.yml` (migrate image built) |
| CR-3 | high | **fixed** | Admin/Operator nav split |
| CR-4 | high | **fixed** | Sign-in probes before vault write |
| CR-5 | high | **fixed** | CORS in `.env.example` + stack compose |
| CR-6 | high | **improved** | SDK DTOs: docs, accounts, tenants, keys, audit, golden + table-rank |
| CR-7 | medium | **fixed** | sdk-js excludes `*.test.ts` from emit |
| CR-8 | medium | **fixed** | Policy under Admin nav only |
| CR-9 | medium | **fixed** | Orphan delete requires typed `DELETE ORPHANS` + prior dry-run |
| CR-10 | low | **fixed** | OneTimeSecret clipboard failure fallback |

## Residual

- Production auth (httpOnly BFF)
- OpenAPI→SDK codegen pipeline
- Full `pnpm docker:stack` bring-up E2E on a clean machine
