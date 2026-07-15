---
story_id: "3.1"
story_key: "3-1-hybrid-retrieve-rerank"
ticket: "T-3.1"
epic: "3"
status: review
created: 2026-07-15
baseline_commit: "7be4a9f"
fr: ["FR8"]
cap: ["CAP-3"]
depends_on: ["T-2.5", "T-5.1"]
blocks: ["T-3.2"]
---

# Story 3.1: Hybrid retrieve + rerank

Status: review

## Story

As a Product developer,
I want hybrid Retrieve within my Tenant,
so that I get ranked Evidence with citations.

## Acceptance Criteria

1. **AC1** — Retrieve returns Evidence IDs, citations, scores — PASS
2. **AC2** — Empty result is 200 with empty list (not fabricated) — PASS
3. **AC3** — Hybrid lexical+dense stub scores with score-desc rerank — PASS

## Spec sync

- CAP-3 single-pass Retrieve; no generate API
- PreferCorrectness empty → insufficient_evidence when preferCorrectness=true (T-3.3 path)

## Dev Agent Record

### Completion Notes List

- InMemoryVectorIndex hybrid scores: 0.6 lexical term overlap + 0.4 dense stub.
- Retrieve reranks by score; empty → `{ kind: "evidence", items: [] }` unless preferCorrectness.

### Change Log

- 2026-07-15: Implemented T-3.1 — status → review
