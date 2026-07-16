# DD-001 Handoff — Knowledge Studio

**Date:** 2026-07-16  
**From:** Freya (WDS) → agent-dev / Console implementers  
**Brand:** AMKP Console

## Agreed

- Claude-like shell; Evidence + citations + cost as climax  
- Warm stone canvas + teal Evidence (`D-Design-System/00-design-system.md`)  
- First implementation epic: scaffold `apps/console` (C-1.1), then wire Studio path (CAP-3→4→5)  
- SDK/MCP remain; Console consumes `@amkp/sdk-js` only  

## Artifacts

| Artifact | Path |
| --- | --- |
| Delivery | `deliveries/DD-001-knowledge-studio.yaml` |
| Test scenario | `test-scenarios/TS-001-knowledge-studio.yaml` |
| Scenario + pages | `C-UX-Scenarios/02-kens-knowledge-studio/` |
| Interactive prototype | `…/prototype-knowledge-studio.html` |
| Design system | `D-Design-System/00-design-system.md` |
| Console SPEC | `specs/spec-amkp-console/SPEC.md` |

## Next for engineering

1. C-1.1 scaffold shell with tokens from design system (not archived cool-slate mockups)  
2. Session + Active Tenant chip (CAP-1)  
3. Documents upload + Studio retrieve + Trace (DD-001 / TS-001)  
4. Then DD-002 Admin, DD-003 Onboarding, DD-004 Eval/Policy  

## Touch Point 3

When Studio path is implemented, validate against TS-001.
