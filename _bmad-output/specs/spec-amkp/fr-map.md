# FR → Capability Map

PRD FRs absorbed into CAP intents. Tickets should cite both IDs.

| CAP | PRD FRs | UJs |
| --- | --- | --- |
| CAP-1 | FR-1, FR-2, FR-3 | UJ-1, UJ-2 |
| CAP-2 | FR-4, FR-5, FR-6, FR-7 | UJ-1 |
| CAP-3 | FR-8, FR-9, FR-10, FR-11 | UJ-1, UJ-3 |
| CAP-4 | FR-12, FR-13, FR-14, FR-15 | UJ-2, UJ-3 |
| CAP-5 | FR-16, FR-17, FR-18 | UJ-1, UJ-2 |
| CAP-6 | FR-19, FR-20 | UJ-3 |
| CAP-7 | FR-21, FR-22, FR-23 | UJ-2 |
| CAP-8 | FR-24, FR-25, FR-26, FR-27 | UJ-1 |

## Success metrics → CAP

| SM | Validates |
| --- | --- |
| SM-1 TTF Retrieve &lt;60m | CAP-8 |
| SM-2 Leak soak = 0 | CAP-5 |
| SM-3 ≥90% single-pass | CAP-4 |
| SM-4 TableRank lift | CAP-2, CAP-7 |
| SM-5 ≥2 Tenants/30d | CAP-1 |
| SM-6 p95 ≤800ms | CAP-3 |

Counter-metrics SM-C1..C3 remain in PRD; do not optimize agentic hop rate, ingest without eval, or public embedding boards alone.
