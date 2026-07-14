# Addendum — AMKP Product Brief

Supporting detail from market research (2026-07-14) and brainstorm (AMKP). Not required to read the brief; use for PRD / architecture / discovery interviews.

## Positioning non-goals (locked)

- Workforce chat / enterprise search UI  
- Commodity text-only RaaS clone  
- Agentic loops without budgets/traces  
- Customer-data training  

## ICP decision weights (product/platform buyers)

Primary: hard tenancy/ACL → corpus-specific answer quality (incl. multimodal) → deployment control → predictable agentic cost → API/MCP fit → eval/observability.  
Buying motion: layer choice → golden-set POC → security/procurement (AI cycles often ~16–20 weeks).

## Competitive layer map

| Layer | Examples | AMKP stance |
| --- | --- | --- |
| Workforce platforms | Glean, Onyx, Cohere North | Do not compete |
| Managed RaaS / cloud KB | Vectara, Ragie, Bedrock KB, Azure AI Search, DO KB | Closest peers; differentiate on guarantee bundle |
| Frameworks | LangGraph, LlamaIndex | Integrate/partner; wrap with tenancy+eval+multimodal |

## MVP capability checklist (from brainstorm)

1. Silo/namespace tenancy + JWT tenant + leak tests (+ optional attestation)  
2. Parse ladder + TableEvidence / TableRank  
3. Router + hop budgets + OTel traces + Agentic Readiness gate  
4. Sealed eval harness (customer-held gold answers optional)  
5. Citation-obligatory / PreferCorrectness modes  
6. CostEstimate on retrieve responses  

## Parking lot (post-MVP)

- Insurance-backed tenancy SLA  
- Knowledge Containers / CRDs / Git-for-knowledge  
- Vertical packs (10-K filings, manufacturing diagrams)  
- Knowledge MCP Store / OEM white-label  
- OSS core + paid control plane split  
- Proof-carrying answers / Compliance Binder generator  

## Open questions for discovery

1. First design-partner vertical: horizontal SaaS vs finance filings vs manufacturing?  
2. Self-host/VPC required at MVP or SaaS-first?  
3. OSS core in v1 or proprietary until PMF?  
4. Who owns LLM spend in customer accounting—AMKP pass-through or BYO keys only?  

## Source artifacts

- `_bmad-output/planning-artifacts/research/market-agentic-multimodal-rag-multi-product-research-2026-07-14.md`  
- `_bmad-output/brainstorming/brainstorm-amkp-rag-product-ideas-2026-07-14/brainstorm-intent.md`  
- `_bmad-output/brainstorming/brainstorm-amkp-rag-product-ideas-2026-07-14/.memlog.md`  
