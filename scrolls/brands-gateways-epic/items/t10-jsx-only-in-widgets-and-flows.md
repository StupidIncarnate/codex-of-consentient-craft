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

## Plan

Planned 2026-09-29 against the code in this worktree.

### Findings that change the item

- A17 is done (EPIC.md line 427: `packages/web/src/adapters/` is gone). The "Current state" section above
  (lines 24-32) is stale: `packages/web/src/adapters/` does not exist.
- A directory walk of every package finds 336 `.tsx` files, all in `web`, all under a `widgets/` folder. No `.tsx`
  file sits outside `widgets/` or `flows/` in any package, and none sits outside `packages/`. Violations expected
  from the scan: 0 in every package.
- A `.ts` file cannot hold real JSX (TypeScript will not parse it), so the rule can only ever fire on `.tsx`.
  The `.ts` files that mention JSX (`packages/testing/src/middleware/mantine-render/mantine-render-middleware.ts`,
  the `@gateway/npm` `jsx-element` stubs, `packages/cli/src/statics/package-seed-frontend/package-seed-frontend-statics.ts`,
  eslint-plugin tests) hold it only in comments or strings; they are not violations and the rule never sees them.
- The rule does not exist. No rule under `packages/eslint-plugin/src/brokers/rule/` matches
  `ban-jsx-outside-widgets-and-flows` (the nearest is `ban-anonymous-jsx-in-map`).
- The item is silent on tests, proxies, harnesses and stubs. Recommendation: cover every file, no exemption.
  Today a `.test.tsx`, `.proxy.tsx` or `.stub.tsx` exists only inside `widgets/`, which passes the rule as it is.
  A harness or e2e file with JSX would be a real violation and should be told to call a widget or a `.ts`
  helper. Do not reuse the exclusion guard `shouldExcludeFileFromProjectStructureRulesGuard` blindly: read it and
  keep every exclusion it grants out of this rule unless it excludes only non-source files.

### Batch 1 (new rule, `eslint-plugin`, one agent, 3 batches in sequence; the same agent)

Folder-type detection: `filename.includes('/widgets/') || filename.includes('/flows/')`, the same substring test
`packages/eslint-plugin/src/guards/is-file-in-folder-type/is-file-in-folder-type-guard.ts` uses. If a guard for
"in one of these folder types" is wanted, add `packages/eslint-plugin/src/guards/is-jsx-allowed-folder/is-jsx-allowed-folder-guard.ts`
plus its `.test.ts`; otherwise keep the test inline in the broker.

Batch 1a, the rule (3 files):
1. `packages/eslint-plugin/src/brokers/rule/ban-jsx-outside-widgets-and-flows/rule-ban-jsx-outside-widgets-and-flows-broker.ts`
   handlers `JSXElement` and `JSXFragment`, each reports one message id (`jsxOutsideWidgetsAndFlows`) telling the
   author to move the markup into a widget under `widgets/` (or route it from a flow). Model on
   `packages/eslint-plugin/src/brokers/rule/ban-anonymous-jsx-in-map/rule-ban-anonymous-jsx-in-map-broker.ts`.
   Report only the outermost JSX node in a tree (skip a node whose parent is a JSX node) so one violation gives one hit.
2. `packages/eslint-plugin/src/brokers/rule/ban-jsx-outside-widgets-and-flows/rule-ban-jsx-outside-widgets-and-flows-broker.proxy.ts`
3. `packages/eslint-plugin/src/brokers/rule/ban-jsx-outside-widgets-and-flows/rule-ban-jsx-outside-widgets-and-flows-broker.test.ts`
   cases: JSX in `widgets/` passes, in `flows/` passes; element, fragment, and nested tree outside both fail with one
   report; `.test.tsx` / `.proxy.tsx` / `.stub.tsx` outside them fail; a `.ts` file with no JSX passes.

Batch 1b, registration (4 files):
4. `packages/eslint-plugin/src/responders/eslint-plugin/create/eslint-plugin-create-responder.ts` import (near line 68),
   type entry (near line 154, `readonly 'ban-jsx-outside-widgets-and-flows': EslintRule;`), map entry (near line 245).
5. `packages/eslint-plugin/src/responders/eslint-plugin/create/eslint-plugin-create-responder.proxy.ts` import (near line 62)
   and proxy call (near line 149).
6. `packages/eslint-plugin/src/brokers/config/dungeonmaster/config-dungeonmaster-broker.ts` add
   `'@dungeonmaster/ban-jsx-outside-widgets-and-flows': 'off'` beside line 169 first, so the scan can run.
7. `packages/shared/src/statics/dungeonmaster-rule-enforce-on/dungeonmaster-rule-enforce-on-statics.ts` add
   `'@dungeonmaster/ban-jsx-outside-widgets-and-flows': 'pre-edit'` (the `ban-anonymous-jsx-in-map` entry is at line 86).
   Then check the two tests that enumerate rules (the config broker's `config-dungeonmaster-broker.test.ts` and the
   responder's test, if either lists rule names) and update them.
   Note: the item says `packages/shared` is not in "Packages touched"; this one line is required by the item's own text.

Batch 1c, scan then switch on (no new files):
8. `npm run ward -- scan ban-jsx-outside-widgets-and-flows` (EPIC T1 row, line 535). Expect `violations: 0` for every
   package. Hand-check by seeding one JSX fragment in a scratch `.tsx` under `tmp/` is NOT possible (outside
   `packages/`); the rule's unit tests carry that proof instead. Any non-zero hit is a new violation since A17:
   list it under LEFT STANDING with its path and move it into a widget (one file per cleanup batch, at most 3 files).
9. Flip the config entry in file 6 from `'off'` to `'error'`. This item's checks: `npm run ward -- --only lint,typecheck,unit,integration -- <every file above>`.
   Build note: the `locationsStatics` build rule does not apply; report "build needed: shared" only if the
   lint run cannot see the new enforce-on entry.

### Violating files

None. Zero files to move. No cleanup batches are needed, and no other package is touched, so nothing runs in
parallel with anything else inside this item. The whole item is one agent, in `eslint-plugin` plus the one
`shared` statics line. It conflicts with no other item unless that item edits the same responder or config broker
(the responder and config broker are shared registration points for every rule item; run this item apart from
any other rule-registering item, or after it).

### Counts per package (files with JSX outside `widgets/` and `flows/`)

`web` 0 (336 `.tsx` files, all in `widgets/`); every other package 0 (no `.tsx` at all).
