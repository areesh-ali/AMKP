# Glossary (AMKP)

Binding terms for SPEC, tickets, and tests. Synonyms elsewhere are a discipline violation.

| Term | Definition |
| --- | --- |
| Account | Customer org billing/admin boundary; contains Tenants |
| Tenant | Hard isolation unit for a Product; scoped from auth |
| Product | Downstream app/agent consuming AMKP |
| Document | Source object under Ingest |
| Chunk | Indexed retrieval unit from a Document |
| Evidence | Structured retrieve result with citations/scores/parse metadata |
| TableEvidence | Evidence preserving table structure |
| Parse Ladder | Cheap → layout → VLM/page-vision ingest tiers |
| Knowledge Plane | AMKP as a whole |
| Guarded Agentic Retrieval | Budgeted multi-step retrieve with Traces |
| Router | Chooses single-pass vs Guarded Agentic |
| Trace | End-to-end request record |
| Leak Test | Adversarial cross-Tenant disclosure check |
| POC Pack | Golden set + ACL suite + multimodal pack + cost simulator |
| TableRank | Multimodal table/chart eval score |
| Agentic Readiness | Gate before enabling agentic mode |
| PreferCorrectness | Refuse/low-coverage when Evidence insufficient |
| MCP Tool | MCP-exposed capability Tenant-scoped from connection auth |
| CostEstimate | Per-request cost fields on Retrieve/hops |
