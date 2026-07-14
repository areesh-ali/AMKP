---
title: "AMKP — Agentic Multimodal Knowledge Plane"
status: draft
created: 2026-07-14
updated: 2026-07-14
project: RAG-Sol
---

# Product Brief: AMKP (Agentic Multimodal Knowledge Plane)

## Executive Summary

AMKP is an API / SDK / MCP-first **knowledge plane** that multiple products share: structure-aware multimodal ingest, hard multi-tenant isolation, and guarded agentic retrieval (routed, budgeted, traced). Product teams stop rebuilding RAG stacks and avoid soft-tenancy leaks—without buying a workforce search UI.

**Why now:** buyers are eval- and governance-first; MCP is the emerging agent↔knowledge handshake; multimodal table/page fidelity is practical but painful to DIY. AMKP sells measurable production guarantees (isolation, evidence objects, cost caps, sealed POCs). If it wins, it becomes knowledge middleware for product suites—grounding infrastructure others embed.

## Who This Serves

**Primary:** Product / platform engineers at multi-product software companies and ISVs. Success = a new product tenant live in about a day; zero cross-tenant leaks in soak testing; AI features ship without a three-person ML platform hire.

**Secondary:** AI CoE and security reviewers who gate production (attestations, traces, residency). End users of customer products benefit via better grounded answers.

## The Problem

Platform teams must ship grounded AI across several products. They stitch vector DBs, parsers, frameworks, and ad-hoc ACL filters—and get inconsistent quality, duplicated spend, cross-tenant risk, and agent demos that become proofs of cost.

The missing piece is not “an LLM.” It is a shared plane that combines **multimodal evidence fidelity**, **hard tenancy**, and **controlled multi-hop**—integrable behind many products.

## The Solution

AMKP exposes ingest and retrieve as first-class APIs (plus MCP tools). Customers get:

- **Evidence objects** — citation-obligatory, typed where possible (e.g. tables), with traces  
- **Silo/namespace-default multi-product tenancy** — JWT-derived identity, tenant-keyed caches, automated leak tests  
- **Structure-aware multimodal path** — cheap→layout→VLM/page-vision parse ladder; TableRank as a hero quality metric  
- **Guarded agentic router** — single-pass default; capped multi-hop only when needed; circuit breakers and cost attribution  

BYO LLM is supported. AMKP owns grounding infrastructure, not the chat surface. A sealed **POC-in-a-box** (golden set, ACL suite, multimodal chart pack, cost simulator) is an MVP deliverable for bake-offs.

## What Makes This Different

| Alternative | Gap AMKP closes |
| --- | --- |
| Workforce platforms (Glean-class) | Wrong surface for product backends |
| Commodity RaaS | Weak on hard tenancy + multimodal structure + eval SKU |
| Hyperscaler KB | Cloud lock-in; uneven multi-product story |
| DIY LangGraph/LlamaIndex | Flexibility without packaged guarantees → sprawl returns |

Early moat: execution on that guarantee bundle and developer DX—not a proprietary foundation model.

## Scope

**In (MVP):** Multi-tenant ingest/retrieve API + MCP; hybrid search + rerank; multimodal v1 (tables + optional page-vision tier); complexity router with hop budgets; traces + basic faithfulness sampling; leak-test CI; POC-in-a-box; docs/free tier; one reference multi-product app.

**Out:** Glean-class employee search UI; unbounded agentic-by-default; training on customer data; competing as a general vector DB; full connector marketplace (API/MCP sources first).

## Success Criteria

- Time-to-first-retrieve from docs < 60 minutes on free/self-serve  
- Cross-tenant leak tests: zero failures in continuous soak testing for design partners  
- Multimodal gold set: material lift on table/chart questions vs text-only baseline  
- ≥90% of production queries served via single-pass retrieval; agentic hops within budget caps  
- Design partners: ≥2 products on one plane within the first expansion cycle  

## Assumptions

- Initial ICP: mid-market SaaS / product orgs with 2+ AI-facing products  
- Durable advantage later may come from eval datasets, vertical modality packs, and switching costs once many products share one plane  
- Business model: free→paid on usage + tenancy/eval SKUs; expand ACV via products-per-account  
- Vertical multimodal packs later include filings, manuals, and instructions for use (IFUs)  
