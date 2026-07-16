# AMKP Console — UI ideas

Prioritized concepts for implementers. Brand **AMKP**. Spec: `SPEC-amkp-console`.

## P0 — Must ship with product quality

1. **Evidence-first Retrieve studio** — Split pane: query + toggles (mode, PreferCorrectness) | ranked Evidence cards + cost pill. No answer bubble.
2. **Active Tenant chrome** — Persistent chip; fail-closed; switcher.
3. **Document lifecycle strip** — Status badge + upload + versions drawer + chunks preview.
4. **Trace hop timeline** — Vertical steps from Trace API; link from Retrieve.
5. **One-time key reveal** — Modal after issue/rotate; copy; never re-show plaintext.

## P1 — Differentiating

6. **Compare Tenants (Admin only)** — Side-by-side health/doc counts without mixing Evidence data.
7. **Eval report board** — Pass/fail matrix for golden-set; TableRank bar vs ablation.
8. **Policy cockpit** — pageVision / agentic / PreferCorrectness threshold with audit “last changed”.
9. **Onboarding runway** — Checklist with progress; climaxes on first Evidence screenshot-worthy panel.
10. **Plane pulse** — Compact `/health` + `/ready` adapters strip on Admin Health.

## P2 — Polish

11. **Command palette** — Jump surfaces + recent requestIds.
12. **Citation hover** — Document title + version watermark peek.
13. **Cost sparkline** — Per-Tenant estimatedUsd from recent Retrieves (from traces/metrics if available).
14. **Webhook delivery log** — If plane exposes it later; stub as “coming from plane”.

## Explicitly not ideas

- Workforce search home
- Chat “final answer” as default Retrieve UX
- Replacing SDK with Console-only workflows
