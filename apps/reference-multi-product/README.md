# Reference multi-Product app (T-8.4)

Two Products (`support`, `docs`) each get a Tenant API key and call the shared AMKP plane via `@amkp/sdk-js`.

```bash
export AMKP_BASE_URL=http://localhost:3000
export AMKP_SUPPORT_KEY=amkp_...
export AMKP_DOCS_KEY=amkp_...
pnpm --filter @amkp/reference-multi-product build
pnpm --filter @amkp/reference-multi-product start
```
