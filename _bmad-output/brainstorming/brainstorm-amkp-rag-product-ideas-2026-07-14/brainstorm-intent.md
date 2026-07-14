# Intent: Agentic Multimodal Knowledge Plane (AMKP)

**Source:** Brainstorm 2026-07-14 (Ideate-for-me) + market research on agentic/multimodal multi-product RAG  
**Goal:** Buildable wedge for RAG-Sol

## Product intent

Ship an **Evidence + Policy + Tenancy plane** (API / SDK / MCP first) that multiple products share — not a workforce chat UI and not a commodity text RaaS clone.

## Primary wedge

1. **Hard multi-product tenancy** — silo/namespace-default isolation, JWT-derived tenant, tenant-keyed caches, automated leak tests, optional tenancy attestation  
2. **Structure-aware multimodal** — parse ladder (cheap → layout → VLM/page-vision), TableEvidence / chart fidelity, TableRank as launch hero metric  
3. **Guarded agentic retrieval** — complexity router, hop budgets/circuit breakers, full traces, Agentic Readiness gates  
4. **Sealed eval / POC-in-a-box** — customer-held golden set, ACL adversarial suite, multimodal chart pack, cost simulator  

## Non-goals

- Glean-class employee search UI  
- “Another LangChain” without production guarantees  
- Agentic-by-default unbounded loops  
- Training on customer data  

## Differentiation thesis

Compete on **measurable production guarantees** (isolation, faithfulness SLOs, citation-obligatory evidence objects, cost caps) — not model brand or chat chrome.

## Suggested MVP cut

- Multi-tenant retrieve/ingest API + MCP tool  
- Hybrid search + rerank; multimodal path v1 (tables + page-vision optional tier)  
- Router: single-pass default → capped agentic  
- Traces + basic faithfulness sampling + leak-test CI  
- Docs + free tier + one reference multi-product app  

## Handoff-ready next skills

- `bmad-product-brief` or `bmad-prd` using this intent  
- `bmad-spec` for AMKP MVP kernel  
- Architecture spike: tenancy model + parse ladder  

