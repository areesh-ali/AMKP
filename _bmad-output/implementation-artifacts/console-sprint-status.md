# AMKP Console — Sprint status

**Updated:** 2026-07-20  
**Loop:** continuous until user says stop (backlog complete — polish; 12 unit tests green)  
**Frontend:** atomic `app/` · `features/*` · `shared/ui/{atoms,molecules,organisms}`

| Story | Status |
| --- | --- |
| C-1.1 Scaffold | **done** |
| C-1.2 Session vault | **done** |
| C-1.3 Role + Tenant chrome | **done** |
| C-2.1 Accounts/Tenants UI | **done** |
| C-2.2 API keys | **done** |
| C-2.3 Audit list | **done** |
| C-3.1 Document list/upload | **done** |
| C-3.2 Detail/versions/chunks | **done** |
| C-3.3 Lifecycle | **done** |
| C-4.1 Retrieve studio | **done** |
| C-4.2 Evidence + cost UI | **done** |
| C-5.1 Trace inspector | **done** |
| C-6.1 Golden-set | **done** |
| C-6.2 TableRank | **done** |
| C-6.3 POC Pack link | **done** |
| C-7.1 Policy | **done** |
| C-8.1 Health/ready | **done** |
| C-8.2 Orphan sweep | **done** |
| C-9.1 Onboarding | **done** |

## Constraints

- UI: Claude-like Knowledge Studio (Sally / DD-001)
- Arch: `@amkp/sdk-js` only — no adapters/Prisma (Winston)
- Structure: see `apps/console/ARCHITECTURE.md` — no flat pages dump
- Brand: AMKP
