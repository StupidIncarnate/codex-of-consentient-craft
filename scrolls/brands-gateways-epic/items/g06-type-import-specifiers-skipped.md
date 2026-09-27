# G06: A per-name `type` import specifier is not a value

| | |
|---|---|
| Phase | Phase 1 — gateway foundation |
| Source | `scrolls/gateway/followup-sustainability.md`, item 34, lines 788-794 |
| Needs | nothing |
| Unblocks | nothing named in EPIC.md's table (but the platform-crossing check's own workaround, named below, becomes removable once this lands — see Work step 3) |
| Packages touched | `eslint-plugin` |
| Checks to run | `lint,typecheck,unit` |
| Split | one agent |
| Runs alone | no |

## Why

`import { walkBroker, type WalkMemo } from './walk-broker'` mixes a real value import (`walkBroker`) with
a per-name TYPE-ONLY import (`type WalkMemo`) in one statement. `parseImplementationImportsTransformer`,
in `packages/eslint-plugin`, does not know the difference: it keeps `WalkMemo` as if it were an imported
VALUE. Downstream, `enforce-proxy-child-creation` then wrongly asks for a `WalkMemoProxy` — demanding a
proxy for something that is only a type, and can never have a runtime call to mock.

The platform-crossing check already has to work around this same gap: instead of importing a broker's
parameter type plainly, it derives types through
`Parameters<typeof broker>[0]['field']`, which is a real workaround for a bug, not a stylistic choice.

## Current state

Checked 2026-09-26 against the code:

- `packages/eslint-plugin/src/transformers/parse-implementation-imports/parse-implementation-imports-transformer.ts`
  is the file to fix (confirmed by `discover`); its sibling `.test.ts` exists in the same folder.
- `packages/eslint-plugin/src/brokers/rule/enforce-proxy-child-creation/rule-enforce-proxy-child-creation-broker.ts`
  is the rule that consumes the transformer's output and wrongly demands a proxy for a type-only name
  (confirmed by `discover`; not read in full in this pass — the executing agent reads both files before
  changing either, since the fix is in the transformer, but the PROOF the bug is fixed is that this rule
  stops flagging a type-only import).
- Not checked in this pass: the exact AST shape `parseImplementationImportsTransformer` walks (whether it
  iterates `ImportSpecifier` nodes and needs to check `importKind === 'type'` on each specifier, as
  opposed to the import DECLARATION's own `importKind`, which only tells you `import type { X }` — the
  WHOLE statement being type-only — not a per-name `type` prefix on one specifier inside a mixed
  import). TypeScript's ESTree AST gives each `ImportSpecifier` its own `importKind` field precisely for
  this mixed case, so the fix reads specifier-level `importKind`, not only the declaration-level one.

## Work

1. In `parseImplementationImportsTransformer`, skip any import specifier whose `importKind` is `'type'` —
   whether that comes from a whole `import type { X } from '...'` declaration, or from one `type`-prefixed
   name inside an otherwise-value import (`import { walkBroker, type WalkMemo } from './walk-broker'`).
   Only the VALUE specifiers (`walkBroker` in the example) should reach whatever consumes this
   transformer's output.
2. Confirm `enforce-proxy-child-creation` no longer asks for a `WalkMemoProxy` (or any proxy for a
   type-only import) once the transformer stops surfacing type-only names as if they were values. Add or
   update a test case in the transformer's own `.test.ts` covering exactly the mixed-specifier case from
   the example (`import { walkBroker, type WalkMemo } from './walk-broker'`), asserting `WalkMemo` is
   NOT in the output and `walkBroker` IS.
3. **Once this lands**, the platform-crossing check's `Parameters<typeof broker>[0]['field']` workaround
   (referenced by the source doc as compensating for this exact bug) CAN be removed — but that workaround
   lives in ward's platform-crossing code (part of G10's scope, not this item's). Report in CHANGED /
   DECISIONS that this fix makes that workaround removable, so whoever executes G10 (or a later cleanup)
   knows to check for it, rather than silently leaving dead workaround code behind. Do not go remove it
   yourself — it is outside this item's package (`eslint-plugin` vs. `ward`).

## Done when

- [ ] `parseImplementationImportsTransformer` skips every specifier whose `importKind` is `'type'`,
  covering both whole-statement `import type` and per-name `type` prefixes inside a mixed import.
- [ ] A test in the transformer's own `.test.ts` covers the mixed-specifier case and asserts the type-only
  name is excluded while the value name is kept.
- [ ] `enforce-proxy-child-creation` (or its own test) confirms it no longer demands a proxy for a
  type-only name once fed the fixed transformer's output.
- [ ] `npm run ward -- -- packages/eslint-plugin/src/transformers/parse-implementation-imports packages/eslint-plugin/src/brokers/rule/enforce-proxy-child-creation` (`lint,typecheck,unit`) exits 0.
- [ ] The report flags (does not fix) the now-removable workaround in ward's platform-crossing check, for
  G10 or a later cleanup to pick up.

## Traps

- Don't only check the import DECLARATION's `importKind` — that only catches a whole `import type {...}`
  statement. The bug this item fixes is specifically the MIXED case, one `type`-prefixed name among
  otherwise-value names in the same import statement, which needs the per-SPECIFIER `importKind`.
- Don't go fix the platform-crossing workaround as part of this item — it is in a different package
  (`ward`), which makes it out of this item's scope per the standing agent brief ("never edit files
  outside your item's scope... report it").

## Concessions made while executing
