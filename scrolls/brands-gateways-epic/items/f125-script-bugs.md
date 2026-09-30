# F125: the big-bang scripts stop producing the six defects the first run repaired by hand

| | |
|---|---|
| Phase | Before assayer (EPIC.md "Big-bang run", F125) |
| Source | `bigbang/PORTING.md` section 0 ("Four script bugs" plus the two "Traps" entries); EPIC.md row F125 |
| Needs | nothing |
| Unblocks | the first run of the scripts on another repo (assayer) |
| Packages touched | none: scripts under `scrolls/brands-gateways-epic/phase34-scripts/` only |
| Checks to run | none (no ward: scripts are outside every workspace); each fix is proved on a fixture repo under `tmp/f125/` |
| Split | one agent |
| Runs alone | no: nothing under `packages/` is read or written |

## Why

The first run's scripts left six classes of defect that fixer agents and repair commits removed by hand
(d2d9af3a0, 9cd766c94, c1e1ae7a4, 0bb52a52c, 8a5ac0a37, 00d7c20c7). On a second repo they recur unless the scripts stop
making them.

## Current state

| # | Defect | Script lines that cause it | Repair commit |
|---|---|---|---|
| 1 | W5's rewriter wraps at wrong offsets: `.parse(return)`, triple-nested wraps, a contract parsed inside its own definition, a field schema parsing a whole value | `b15-value-brands/run.cjs` `collectRewrites` (bare-value branch takes a `return` keyword, a declaration name or a callee as the wrap target; nothing checks the target is a plain value, nothing refuses an edit inside the owner's own definition or an already-parsed value); the same code copied in `b15-id-brands/run.cjs` | d2d9af3a0 (`strip-w5-wraps.py`) |
| 2 | W6 parses objects that hold functions; zod drops unlisted keys | `b12-object-brand-fallout/run.cjs` `wrap` (wraps the whole literal) and W5's root-parse branch | 9cd766c94 |
| 3 | Standalone brand deleted, its validation with it | `feasibility/b15/codemod.cjs` and `b15-value-brands/run.cjs`: a base schema naming local constants or statics is not inlineable, yet the contract is deleted; `C.parse(x)` becomes `x` whatever `C` checked | c1e1ae7a4 |
| 4 | `contract.parse(promise)` | every rewriter that wraps a non-literal expression (`b14-shape-contracts` returns in async functions, `b15-value-brands`, `b15-id-brands`, `b15-unknown-fields/responder-data.cjs`) | 0bb52a52c |
| 5 | W9 removes parses a comment calls deliberate | `b15-dead-reparse/run.cjs` census (no comment check) | 00d7c20c7 |
| 6 | SD12 retypes harness parameters | `feasibility/b13/retype.cjs` candidate walk (`--tests` includes every test-support file) | 8a5ac0a37 |

## Plan

Files edited (all under `scrolls/brands-gateways-epic/phase34-scripts/`):

1. `lib/rewrite-guards.cjs` (new): shared checks a rewriter asks before it wraps: plain-value type, wrap target from a
   diagnostic node, already-parsed, inside a contract file or the owner's own definition, literal that holds functions,
   Promise-typed operand.
2. `lib/base-schema.cjs` (new): analysis of a standalone brand's base schema: is it a bare shape or does it carry a check,
   which names it needs, local declarations to copy into the owning contract file.
3. `lib/repo.cjs`: `diagnosticsWithOverlay` and `gateEdits` report a parse handed a Promise as a new diagnostic (code 90001),
   so every script's gate refuses the edit that introduced it.
4. `b15-value-brands/run.cjs` (bugs 1, 2, 3, 4): guarded target, guarded root wrap, base-schema needs copied into the owner,
   refusal when a validating brand would lose its check.
5. `b15-id-brands/run.cjs` (bugs 1, 4): the copied field-parse rewriter uses the same guards.
6. `b12-object-brand-fallout/run.cjs` (bug 2): data part parsed, functions kept beside the parse, other function holders to leftovers.
7. `feasibility/b15/codemod.cjs` (bug 3): W1 inlines the base schema with its needs and refuses a validating brand it cannot carry.
8. `b15-unknown-fields/responder-data.cjs` (bug 4): a Promise-typed `data` is awaited or skipped.
9. `b15-dead-reparse/run.cjs` (bug 5): a nearby comment that names the parse keeps it.
10. `feasibility/b13/retype.cjs` (bug 6): harness files are not candidates.

Also edited outside `phase34-scripts/`: `bigbang/PORTING.md` section 0 (Step C) and this file.

## Work

Each bug gets a fixture under `tmp/f125/` that reproduces it against the script as committed (before) and against the fixed
script (after). Evidence is recorded in "Done when".

## Done when

- [x] every fixture shows the defect before and none after (W3/W4 `b15-id-brands`: smoke only, its rewriter is not reached by the fixture)
- [x] `node --check` passes on every edited script
- [x] `bigbang/PORTING.md` section 0 names what is fixed and how each was proved

## Traps

- Fixtures live under `<repoRoot>/tmp/f125/`, never `~/tmp`; no script runs `apply` against `packages/`.
- `strip-w5-wraps.py`, `promise-parse-scan.cjs` and `fix-dangling*.{cjs,py}` stay as repair tools.

## Concessions made while executing

None. `b15-id-brands` gets the wrap guards (bugs 1 and 4) but not bug 3's check rules: its owner takes the standalone's schema by design.
