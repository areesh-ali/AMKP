---
story_id: "7.2"
story_key: "7-2-multimodal-tablerank"
ticket: "T-7.2"
epic: "7"
status: review
created: 2026-07-15
baseline_commit: "4991422"
fr: ["FR22"]
cap: ["CAP-7"]
depends_on: ["T-7.1", "T-2.3"]
blocks: ["T-7.3"]
---

# Story 7.2: Multimodal pack + TableRank

Status: review

## Acceptance Criteria

1. **AC1** — Multimodal vs text-only eval — ✅ `POST /v1/eval/table-rank`
2. **AC2** — Report includes both TableRank scores + lift — ✅
