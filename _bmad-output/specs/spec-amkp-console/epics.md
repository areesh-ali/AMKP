# AMKP Console — Epics & story order

Brand: **AMKP**. App: `apps/console`. Client: `@amkp/sdk-js`.

| Epic | CAP | Stories |
| --- | --- | --- |
| E-C1 Session & shell | CAP-1 | C-1.1 Scaffold apps/console; C-1.2 Session/credential vault; C-1.3 Role-gated layout + Active Tenant chrome |
| E-C2 Admin tenancy | CAP-2 | C-2.1 Accounts/Tenants UI; C-2.2 API keys; C-2.3 Audit list |
| E-C3 Knowledge | CAP-3 | C-3.1 Document list/upload; C-3.2 Detail/versions/chunks; C-3.3 Lifecycle (reparse/delete/prune/download) |
| E-C4 Retrieve | CAP-4 | C-4.1 Retrieve studio; C-4.2 Evidence + cost + PreferCorrectness UI |
| E-C5 Traces | CAP-5 | C-5.1 Trace inspector by requestId |
| E-C6 Eval | CAP-6 | C-6.1 Golden-set; C-6.2 TableRank; C-6.3 POC Pack links |
| E-C7 Policy | CAP-7 | C-7.1 Tenant policy toggles |
| E-C8 Ops | CAP-8 | C-8.1 Health/ready/adapters; C-8.2 Orphan sweep dry-run |
| E-C9 Onboarding | CAP-9 | C-9.1 Guided &lt;60m path |

## Execution constraint

E-C1 → E-C2 → E-C3 → E-C4 → E-C5 (then E-C6/E-C7/E-C8 can parallelize) → E-C9 last polish.
