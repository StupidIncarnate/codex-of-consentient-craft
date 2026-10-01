# DEF-281: `bin-program-spawn-ban` does not watch a consumer's own spawn wrappers

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Priority | P2: a spawn through a consumer's own wrapper is never checked, and the consumer is not told |
| Package | eslint-plugin |
| Found | 2026-09-30, from assayer, a consumer that links dungeonmaster through `file:` |
| Moved from | assayer `scrolls/brands-gateways-epic/EPIC.md`, "Upstream reports" item 17, 2026-10-01 |

## What is wrong

`bin-program-spawn-ban` checks a call from the node gateway's `child_process` subpath only when the imported name is in
a fixed list (`child-process-function-names-statics.ts:14-25`, checked at `rule-bin-program-spawn-ban-broker.ts:130-137`).
The list holds dungeonmaster's own wrapper names: `run`, `runSync`, `spawnDetached`, `runFireAndForget` and the rest.

A consumer's node gateway is its own copy, and it may add wrappers. Assayer added `spawnFireAndForget` to its
`#gateway/node/child_process`. A call to `spawnFireAndForget` outside the gateway is not checked, whatever program it
starts, because the name is not in the list. The rule's only option is `scope` (`:51-63`), so a consumer cannot add a
name either.

## What should happen

The rule watches every process-start function the consumer's gateway exports, not a fixed list. Two ways:

- Read the exported names from the consumer's own `packages/@gateway/node/src/child_process/` barrel, the way other
  gateway rules read wrapper exports from the AST.
- Add a rule option that names extra wrapper functions, and have `init` fill it.

A test lints a fixture whose gateway exports an extra spawn wrapper and asserts a direct `git` spawn through it is
reported.

## Where to look

- `packages/eslint-plugin/src/statics/child-process-function-names/child-process-function-names-statics.ts:14-25`
- `packages/eslint-plugin/src/brokers/rule/bin-program-spawn-ban/rule-bin-program-spawn-ban-broker.ts:51-63`, `:104-146`

## History

Assayer upstream report 17.
