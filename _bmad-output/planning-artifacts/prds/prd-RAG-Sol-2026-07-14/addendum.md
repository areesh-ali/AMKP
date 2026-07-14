# PRD Addendum — AMKP

Mechanism notes and deferred detail. Capabilities live in `prd.md`; this file holds how/options.

## Isolation options considered

| Approach | Pros | Cons | MVP choice |
| --- | --- | --- | --- |
| Metadata filter only (pool) | Cheap | Fail-open if filter omitted | Rejected |
| Namespace/collection per Tenant | Fail-closed | More index ops | **Selected** `[ASSUMPTION]` |
| Physical DB per Tenant | Strongest | Ops heavy | Post-MVP enterprise |

## Parse Ladder tiers (indicative)

1. Text/pdfplumber-class extract + structure heuristics  
2. Layout-aware (Docling/Marker-class)  
3. VLM caption / page-as-image late-interaction (ColPali-class) when enabled  

Exact vendors/models are architecture decisions, not PRD locks.

## MCP tool surface (MVP)

- `retrieve_evidence` — hybrid retrieve, Tenant from auth  
- Optional: `get_trace` — if safe under Tenant scope  
- Non-MVP: admin ingest via MCP (prefer HTTP for writes initially)

## Competitive peers (embeddable)

Vectara, Ragie, Bedrock KB, Azure AI Search, DigitalOcean Knowledge Bases, DIY LangGraph/LlamaIndex. AMKP differentiates on guarantee bundle (isolation tests, multimodal structure, guarded agentic, POC Pack).

## Inputs reconciled

- Product brief + brief addendum (2026-07-14)  
- Market research report (agentic/multimodal multi-product)  
- Brainstorm intent (AMKP)  
- Web digest: multi-tenant MCP requires auth-derived tenant, fail-closed resource scope, adversarial leak tests (2026 practitioner guidance)

## Parking lot → future epics

- VPC / EU residency  
- Connector catalog  
- Vertical modality packs  
- OSS core split  
- Insurance-backed tenancy SLA  
- Compliance Binder generator  
