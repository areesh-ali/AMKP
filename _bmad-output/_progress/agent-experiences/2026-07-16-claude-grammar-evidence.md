# Agent experience — Claude grammar × Evidence contract

**Date:** 2026-07-16  
**Topic:** reconciling Claude.ai feel with AMKP SPEC non-goal on chat-as-primary

## Insight

“Feels like Claude” is an **interaction grammar** (threads, composer, attach, working steps, artifacts), not permission to make free-form generation the product climax. AMKP’s climax stays Evidence + citations + cost; the stream is how humans *watch the plane work*.

## Pattern to reuse

| Claude pattern | AMKP mapping |
| --- | --- |
| User message | Query + PreferCorrectness + attachments |
| Tool use / working | Router + hops + parse status |
| Assistant prose | Optional secondary gloss |
| Artifacts | Evidence cards, CostEstimate, Trace |

## Pitfall

Shipping a chat bubble without Evidence violates SPEC and Maya/Ken fears. Shipping only dense admin tables violates areesh’s Claude-feel ask.
