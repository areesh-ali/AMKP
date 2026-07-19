# AMKP Console

First-party web product to **operate** the knowledge plane. Brand is **AMKP**. Interaction grammar is Claude-like (composer, working steps, artifacts); climax is still **Evidence + citations + cost**.

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) — atomic `app/` · `features/*` · `shared/ui/{atoms,molecules,organisms}`. Plane access only via `@amkp/sdk-js`.

## Local

```bash
# from repo root — API + worker must be up; CORS must allow :5173
pnpm docker:up
pnpm --filter @amkp/adapters-postgres prisma:migrate
pnpm dev:api          # other terminal
pnpm dev:worker       # other terminal
pnpm dev:console      # http://localhost:5173
```

| Env | Meaning |
| --- | --- |
| `VITE_AMKP_BASE_URL` | API origin (default `http://127.0.0.1:3000`; empty = same-origin) |

## Docker stack

```bash
pnpm docker:stack
# Console http://localhost:8080 — nginx proxies /v1 → api
```

## Roles

| Role | Credential | Surfaces |
| --- | --- | --- |
| Platform Admin | `PLATFORM_ADMIN_TOKEN` | Tenants, keys, audit, policy, health |
| Tenant Operator | Tenant API key (`amkp_…`) | Studio, documents, traces, eval |

Sign-in **probes** the plane before writing the session vault. Vault is sessionStorage — **dev only**.
