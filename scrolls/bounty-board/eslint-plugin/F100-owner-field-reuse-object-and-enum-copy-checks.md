# F100: `enforce-owner-field-reuse` has no nested-object copy check and no inline-enum copy check

| | |
|---|---|
| Kind | change |
| Status | ready |
| Priority | P3: two planned checks were never built; nothing is wrong meanwhile |
| Package | eslint-plugin |
| Found | R8 |
| Moved from | `scrolls/brands-gateways-epic/EPIC.md` (Follow-up units), 2026-09-30 |

## What is wrong

R8's item specifies a nested-object copy check and an inline-enum copy check. R8 built only the parameter and contract-key checks. The big-bang W10 switched R8 on at error without these two checks.

Checked 2026-09-30: `packages/eslint-plugin/src/brokers/rule/enforce-owner-field-reuse/rule-enforce-owner-field-reuse-broker.ts` reports only `contractKeyNotReused` (line 136) and `paramNotOwnerType` (line 238).

## What should happen

Build the two checks in `enforce-owner-field-reuse`, scan, and fix what they find. The two-inline-copies enum case gets a message but no autofix.

## Where to look

`packages/eslint-plugin/src/brokers/rule/enforce-owner-field-reuse/` (9 eslint-plugin files in 3 batches) and `packages/shared` (18 files in 5 batches: owner index records enums, object-copy and enum-copy matchers).

## History

The plan is in `scrolls/brands-gateways-epic/items/b13-owner-field-reuse.md`, section "Plan — F100: the nested-object and inline-enum copy checks in `enforce-owner-field-reuse`". Order: 18 shared files in 5 batches, then a shared build (quiet window), then 9 eslint-plugin files in 3 batches.

Shared batches are done: the F100-shared commit (owner index records enums; object-copy and enum-copy matchers; five helper files beyond the plan; gate 1790724135952-f5a5). Next: the shared build, then the three eslint-plugin batches.
