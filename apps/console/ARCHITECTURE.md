# Console frontend architecture

Strict atomic / feature layout. Do not dump pages into a flat `components/` or `pages/` root.

```
src/
  app/                 # bootstrap + routing only
  features/            # vertical slices — never import each other
    auth/ admin/ studio/ documents/ traces/
    eval/ policy/ ops/ onboarding/ help/ common/
      pages/           # route-level screens
      components/      # feature-local UI
      lib/             # feature-local types/helpers
  shared/
    api/               # SDK client factory, error helpers
    session/           # vault + auth guards
    ui/
      atoms/           # Button, Input, Badge, …
      molecules/       # PageHeader, CostChip, …
      organisms/       # AppShell
  styles/              # Tailwind @theme
```

## Rules

1. **Atoms** have no feature imports.
2. **Features** may import `shared/*` only — never each other.
3. **App** wires routes; no business UI in `app/`.
4. Plane access only via `shared/api/client.ts` → `@amkp/sdk-js`.
5. Claude-like UX tokens live in `styles/index.css` `@theme`.
6. Shared plane UI (e.g. CostChip) lives in `shared/ui`, not under a feature.
