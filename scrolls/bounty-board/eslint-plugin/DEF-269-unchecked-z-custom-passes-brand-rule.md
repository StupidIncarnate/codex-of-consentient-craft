# DEF-269: An unchecked `z.custom<unknown>()` passes the rule that bans `z.unknown()`

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Priority | P2: one spelling slips past a brand rule that still catches `z.unknown()` and `z.any()` |
| Package | eslint-plugin |
| Found | 2026-10-01, assayer's brands-and-gateways epic, item R-2a (assayer commit `ff3b731`) |
| Moved from | assayer `scrolls/brands-gateways-epic/EPIC.md`, concession 17 and upstream report 21, 2026-10-01 |

## What is wrong

`require-object-contract-brands` refuses a contract field written as `z.unknown()` or `z.any()`, with
the message "`<key>` is z.unknown(), which checks nothing." It matches those two calls by name
(`rule-require-object-contract-brands-broker.ts:177`). A field written as `z.custom<unknown>()`, with
no check function, checks exactly as little, and the rule lets it through.

Two other rules ban `z.custom`, and neither covers this case:

- `enforce-gateway-schema-fields` flags `z.custom<T>()` only when `T` is imported from an npm package
  or a Node builtin.
- `gateway-schema-brand` flags a bare `z.custom<T>()` only inside the gateway packages.

Assayer ships one such field today, and it passes lint:
`packages/core/src/contracts/harness-declaration/harness-declaration-contract.ts` declares
`const harnessInputValueContract = z.custom<unknown>();` for each value under harness `inputs`.

## What should happen

`require-object-contract-brands` treats a `z.custom(...)` call with no check function the same as
`z.unknown()`, in every package, and its message says so.

Some fields really do hold any value. Assayer's harness inputs can be an object with methods, a
callback, a plain value or `undefined`, and `z.json()` rejects callbacks. So the rule needs one
accepted way to say "any value, on purpose". For example, a shared named any-value contract that the
rule recognises. The fix decides which form that takes. Dungeonmaster's own
`packages/hydration/src/contracts/hydration-run-state/hydration-run-state-contract.ts:25` uses the
same unchecked shape and needs the same answer.

## Where to look

`packages/eslint-plugin/src/brokers/rule/require-object-contract-brands/rule-require-object-contract-brands-broker.ts`,
around the `unknownSchema` report.
