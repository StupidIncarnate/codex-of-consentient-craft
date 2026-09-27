# T10: JSX only in `widgets/` and `flows/`

| | |
|---|---|
| Phase | Phase 5 — tests and mocking |
| Source | `scrolls/brands-types-tests-rules.md`, D1 (lines 2035-2054), row 2274 |
| Needs | A17 |
| Unblocks | none named |
| Packages touched | `eslint-plugin` (new rule) |
| Checks to run | `lint,typecheck,unit,integration` |
| Split | one agent |
| Runs alone | no |

## Why

There are no per-folder npm allowlists any more — every folder can import any `#gateway` subpath. What
was left of the old allowlists' job (keeping React components out of the wrong folders) becomes one
structural rule instead: a `JSXElement` or `JSXFragment` may only appear in `widgets/` or `flows/`. In
`web`, 26 of 38 adapter proxies are empty today, because the "adapters" there are really components and
test helpers, not outside calls — the old allowlist pushed them into the wrong folder type.

## Current state

Checked 2026-09-26:

- `packages/web/src/adapters/xyflow/` still exists, with `edge/`, `node-handles/` and `react-flow/`
  subfolders. `packages/web/src/adapters/testing-library/` still exists, with `act/`, `act-async/`,
  `render-hook/`, `wait-for/`. `packages/web/src/adapters/mantine/` still exists, with `notifications/`,
  `notifications-show/`, `render/`. This confirms A17 (moving these into `widgets/`, or into the gateway
  as `#gateway/npm/xyflow__react` etc.) has not run yet in this worktree.
- The new rule `ban-jsx-outside-widgets-and-flows` does not exist yet, confirmed absent from
  `packages/eslint-plugin/src` by a directory walk for that name.

## Work

1. **Build `ban-jsx-outside-widgets-and-flows`**: refuses a `JSXElement` or `JSXFragment` node in any file
   outside `widgets/` or `flows/`. Syntax-only check.

2. **Leave the rules about which of our folders may import which exactly as they are** — this item adds
   one new structural check, it does not touch `enforce-import-dependencies` or any allowlist logic.

3. **Do not do the file moves here.** The xyflow component move (from `web/src/adapters/xyflow/` into a
   widget, and the testing-library/mantine helpers into the gateway or `testing`) is A17's job, in Phase
   2. This item's own "Needs" names A17 because the rule cannot be turned on for real until A17 has moved
   every JSX file out of `adapters/` — turning the rule on first would just fail A17's own unmigrated
   files with no fix in this item's scope.

4. **Scan first.** Per the epic's per-item lint-rule procedure: run the rule as a scan over the whole
   repo before switching it on, and hand-check a sample of what it flags and what it lets through — by
   the time this item runs (after A17), the scan should show zero real violations if A17 did its job
   completely; any hit is either a genuinely missed file from A17 or a new violation introduced since.

```text
// before — widgets may not import @xyflow/react, so React components live in adapters
web/src/adapters/xyflow/react-flow/xyflow-react-flow-adapter.ts   a React component, filed as an adapter
web/src/adapters/testing-library/…                                4 test helpers with no production user
web/src/adapters/mantine/render/mantine-render-adapter.ts

// after
web/src/widgets/react-flow/react-flow-widget.tsx                  the xyflow component is a widget, importing #gateway/npm/xyflow__react
#gateway/npm/testing-library__react                               the testing-library helpers, reached through the gateway
```

## Lint rules this item adds or changes

| Rule | Refuses | Pre-edit? |
|---|---|---|
| `ban-jsx-outside-widgets-and-flows` | A `JSXElement` or `JSXFragment` outside `widgets/` and `flows/` | Yes — syntax only |

Tag it `'pre-edit'` in `packages/shared/src/statics/dungeonmaster-rule-enforce-on/dungeonmaster-rule-enforce-on-statics.ts`.

## Teaching text this item changes

None named in the source beyond what A17 and Z01/Z03 already carry for the gateway's own `xyflow__react`
and `testing-library__react` subpaths.

## Done when

- `ban-jsx-outside-widgets-and-flows` exists, is tagged `'pre-edit'`, and is on.
- A scan of the whole repo shows zero JSX files outside `widgets/`/`flows/` (assuming A17 completed
  first).
- `npm run ward -- --uncommitted` exits 0 on every touched file.

## Traps

- This item is blocked on A17 in practice, not just on paper — if A17 has not landed, turning this rule
  on will fail on every file A17 was supposed to move. Confirm A17's status before scanning.
- Do not attempt any file moves as part of this item; it is lint-rule-only.

## Concessions made while executing

<Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table.>
