# B04: every lint rule uses the real `TSESTree` and `TSESLint.RuleContext`, and the copies are deleted

| | |
|---|---|
| Phase | Phase 3 — brands foundation |
| Source | `scrolls/brands-types-tests-rules.md` (BR), "Library type copies", lines 64-86; C1, lines 998-1058; C2, lines 1060-1119; C5 rows for `TsestreeStub` and `EslintContextStub`, lines 1259-1262 and 1283-1306; "Today's rules and docs that change" row "Every rule in both packages also changes mechanically", lines 2242-2245; statics copy `tsestree-node-type-statics.ts`, lines 1041-1043; package-docs rows, lines 2392-2398 |
| Needs | [G17](../g17-gateway-stubs-ast-and-typescript.md), [A06](../a06-adapters-eslint-plugin.md) |
| Unblocks | [B05](b05-other-library-type-copies.md) (runs with, not needs), and Z01–Z07 |
| Packages touched | `eslint-plugin`, `local-eslint` |
| Checks to run | `lint,typecheck,unit` — `RuleTester`-based whole-rule tests count as `unit` here, not `integration` |
| Split | Operator splits by rule folder, 2-4 files per agent (one rule folder is usually one rule broker plus its guards/transformers plus its test) |
| Runs alone | No — runs with [B05](b05-other-library-type-copies.md) |

## Why

`eslint-plugin/src/contracts/tsestree/tsestree-contract.ts` is a 597-line hand copy of TSESTree, and
`eslint-context/eslint-context-contract.ts` is a 95-line copy of ESLint's `Rule.RuleContext`. Neither is
ever parsed against real data — nothing calls `.parse()` on either outside a test. The copy fails on its
own terms:

- It is one flat node type with every field optional. Real TSESTree is a union: checking
  `node.type === 'CallExpression'` tells the compiler `node.callee` exists. The files using the copy do
  288 `.type === '...'` checks and still need 325 `?.` guards, because the check narrows nothing.
- It brands `name` as `Identifier`, but nothing ever parses a node — the brand was never checked. Casts
  fill the gaps: `rule-enforce-contract-usage-in-tests-broker.ts:160` reports on
  `imports.contractImportNode ?? ({} as Tsestree)`.
- 119 non-test files in `eslint-plugin` and 14 in `local-eslint` depend on it.

`tsestree-node-type-statics.ts` copies `AST_NODE_TYPES` into statics ("without external dependencies" per
its own header) rather than importing it — 183 lines, used by 7 files. It is not a contract, so C1's
parse-index rule (`b02-contract-index-and-unused-contracts.md`) never sees it; it is a separate, smaller
copy this item deletes directly.

The fix for both: import the library's own type through the gateway, the same way its functions are
already imported. `#gateway/npm/typescript-eslint__utils` is where `TSESTree`, `TSESLint` and
`AST_NODE_TYPES` all come from once G17 has built the gateway's AST/rule-context/TypeScript stubs.

## Current state

Confirmed this session (2026-09-26) by reading the files directly:

- `packages/eslint-plugin/src/contracts/tsestree/tsestree-contract.ts`,
  `packages/eslint-plugin/src/contracts/tsestree/tsestree-contract.test.ts`, and
  `packages/eslint-plugin/src/contracts/tsestree/tsestree.stub.ts` all exist.
- `packages/eslint-plugin/src/contracts/eslint-context/eslint-context-contract.ts`,
  `eslint-context-contract.test.ts`, and `eslint-context.stub.ts` all exist.
- `packages/eslint-plugin/src/statics/tsestree-node-type/tsestree-node-type-statics.ts` and its test
  exist.
- `packages/local-eslint/`'s own source has **no** `tsestree`/`eslint-context` named files of its own,
  confirmed by a walk of `packages/local-eslint/src` — this matches BR's description that `local-eslint`
  depends on these copies *through eslint-plugin's exports*, not by holding its own copy.
- `packages/@gateway/npm/src/typescript-eslint__utils/typescript-eslint__utils.ts` exists today, but as a
  **pass-through barrel only** — no `.stub.ts` files exist yet anywhere under that gateway subpath
  (confirmed: a walk of the directory found only `typescript-eslint__utils.ts` and its `.test.ts`; no
  `call-expression.stub.ts`, `program.stub.ts`, `rule-context.stub.ts`, or similar). **This confirms G17
  has not landed yet** — do not start this item until it has; the stubs this item's callers need to
  switch to do not exist in the tree today.
- The rule-folder census (BR's "119 non-test files in eslint-plugin and 14 in local-eslint") was **not
  re-counted this session** — the executing agent should treat any specific count in the source doc as
  approximate and re-derive its own batch list from what `discover`/`get-project-inventory` shows for
  `packages/eslint-plugin/src/brokers/rule/` at the time it starts.

## Work

1. **Wait for G17.** This item cannot start until the gateway ships `TSESTree`/`TSESLint`/
   `AST_NODE_TYPES` stubs under `#gateway/npm/typescript-eslint__utils`. If dispatched before G17 is
   `done`, stop and report it as blocked rather than improvising a workaround stub.
2. **Delete the three copies and their test/stub files**: `tsestree-contract.ts` (+ `.test.ts` +
   `.stub.ts`), `eslint-context-contract.ts` (+ `.test.ts` + `.stub.ts`), and
   `tsestree-node-type-statics.ts` (+ `.test.ts`). Do this only after every caller below is switched, or
   in the same pass as switching them — do not leave a caller pointing at a deleted file mid-item.
3. **Every rule broker, guard and transformer that imports the copy switches to the gateway's real
   type**, in any folder, the same way a wrapper's function is already imported:
   ```
   // before — eslint-plugin/src/contracts/tsestree/tsestree-contract.ts: 597 lines copying TSESTree
   export const tsestreeContract = z.object({ type: z.enum(...), callee: recursiveBase.optional(), ... });
   export type Tsestree = z.infer<typeof tsestreeContract>;
   'CallExpression': (node: Tsestree) => { if (node.callee?.type === 'Identifier') … }

   // after — the copy is deleted; the rule imports the library's type through the gateway
   import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';
   'CallExpression': (node: TSESTree.CallExpression) => {
     if (node.callee.type === 'Identifier') { … }       // no ?.: the real type says callee is always there
   }
   ```
   ```
   // before — a partial ESLint context through the copy
   const context = EslintContextStub({ getFilename: () => 'x.ts', report: jest.fn() });

   // after — the gateway's complete TSESLint.RuleContext, imported from its own file
   import { RuleContextStub } from '#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub';
   const context = RuleContextStub({ filename: 'x.ts' });
   ```
   `AST_NODE_TYPES` switches the same way: `import { AST_NODE_TYPES } from
   '#gateway/npm/typescript-eslint__utils';` in place of the statics copy.
4. **Fix every spot where the loose copy let code skip a check the real type requires.** The flat, all-
   optional copy let 325 `?.` guards through that a real narrowed union does not need, and let some code
   skip a narrowing check `node.type === '...'` should have done first. Read each file being converted for
   this, do not just swap the import and leave stale `?.` chains — a real `TSESTree.CallExpression`'s
   `.callee` is never `undefined`, so a leftover `?.` there is dead code, and a place with *no* type check
   before reading a union-only field will now fail to compile, which is the correct signal to add the
   narrowing.
5. **`TsestreeStub` calls (1,856 across 60 test and proxy files) and `EslintContextStub` calls (307
   across 21 files) switch to the gateway's per-node-type stubs and `RuleContextStub`.** This is C5's
   job in full — see `b05-other-library-type-copies.md` for the general rule; this item's scope is just
   making the switch inside `eslint-plugin`'s and `local-eslint`'s own rule files. A hand-built AST tree
   shrinks to one line once it comes from parsed code:
   ```typescript
   // before — five hand-built nodes, ast-callee-root-name-transformer.test.ts:87-104
   const node = TsestreeStub({ type: TsestreeNodeType.CallExpression,
     callee: TsestreeStub({ type: TsestreeNodeType.CallExpression,
       callee: TsestreeStub({ type: TsestreeNodeType.MemberExpression,
         object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'describe' }),
         property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'each' }) }) }) });
   // after
   const node = CallExpressionStub({ code: "describe.each(table)('name', fn);" });
   ```
   Most `EslintContextStub` calls only ever override `report` — switch those to
   `RuleContextStub()` with a `report` mock and nothing else; do not carry over unused `getScope`/
   `getSourceCode` overrides that the real stub already provides sensibly.
6. **`RuleTester` stays for whole-rule tests.** `eslint-rule-tester-adapter` (or its gateway/broker
   equivalent post-Phase-2) already tests whole-rule behavior with real code strings in 72 test files —
   this item does not touch those. C5 covers only the guard-and-transformer-level tests below that; one
   file uses both, for a case `RuleTester` cannot reach, and `brokers/rule/CLAUDE.md:109` documents the
   split — read it before assuming a file's tests should merge.
7. **Census the rule folders and batch the work.** Walk `packages/eslint-plugin/src/brokers/rule/` (and
   `packages/local-eslint/src/` for its own rule-adjacent files) and group files into batches of 2-4 for
   the operator to dispatch. Do not attempt the whole package census yourself if you are already a batch
   agent — that is the operator's or the first dispatched agent's job.
8. **Update package docs**:

   | Where | Says today | Change to |
   |---|---|---|
   | `eslint-plugin/src/brokers/rule/CLAUDE.md:7` | "Use the shared `Tsestree` contract." | "Import `TSESTree` from `#gateway/npm/typescript-eslint__utils`. Never copy it." |
   | `eslint-plugin/src/brokers/rule/CLAUDE.md`, line 58 | "All AST nodes in rule brokers must use `Tsestree` type." | "AST nodes in rule brokers use the library's `TSESTree` types." |
   | `eslint-plugin/src/brokers/rule/CLAUDE.md`, line 127 | `` const node = TsestreeStub({type: TsestreeNodeType.Program}); `` | `` const node = ProgramStub({ code: '…' }); ``, from `#gateway/npm/typescript-eslint__utils/program/program.stub` |

## Lint rules this item adds or changes

None new. This item is the mechanical caller-side migration that lets C1 (`require-contract-parse`,
built in `b02-contract-index-and-unused-contracts.md`) and C2 (raw-import-ban / the gateway sentinel,
already built by the gateway migration) correctly flag the three deleted copies and every remaining raw
`@typescript-eslint/utils`/`eslint` type import. Confirm both those existing rules do fire correctly on
`eslint-plugin` and `local-eslint` once this item's switch is complete — that is this item's acceptance
check, not a new rule to build.

## Teaching text this item changes

From BR "Package docs" table (see Work step 8 above — copied there in full). No `get-architecture` or
`get-testing-patterns` rows are this item's to change; those are C1/C2/C5's general text, finished in
[Z01](../z01-gateway-folder-type-doc.md)–[Z03](../z03-folder-type-and-testing-docs.md) once every item is
done.

## Done when

- [ ] `tsestree-contract.ts`, `eslint-context-contract.ts`, `tsestree-node-type-statics.ts` and all three
      stubs/tests are deleted.
- [ ] Every rule broker, guard and transformer in `eslint-plugin` and `local-eslint` imports `TSESTree`,
      `TSESLint` and `AST_NODE_TYPES` from `#gateway/npm/typescript-eslint__utils`.
- [ ] No leftover `?.` guard exists where the real union type already guarantees the field.
- [ ] Every `TsestreeStub`/`EslintContextStub` call in `eslint-plugin` and `local-eslint` is switched to
      the gateway's stubs, each imported from its own file under `#gateway/npm/typescript-eslint__utils/`.
- [ ] `RuleTester`-based whole-rule tests are untouched.
- [ ] `eslint-plugin/src/brokers/rule/CLAUDE.md` reflects the three doc changes above.
- [ ] `npm run ward -- --only lint,typecheck,unit -- <touched files>` exits 0.

## Traps

- Do not start before G17 is `done` — the gateway stubs this item switches callers onto do not exist yet
  (confirmed this session).
- A rule that reads `node.callee?.type` will silently keep compiling after the switch, even where the
  real type guarantees `callee` — the loose copy's habits do not surface as compiler errors, so read for
  them, don't wait for tsc to catch them.
- `local-eslint` does not hold its own copy of these types; it re-exports `eslint-plugin`'s rules, so
  fixing `eslint-plugin` alone may be enough for the type-level change, but its own test files that build
  `Tsestree`/`EslintContext` values still need the stub-call switch in step 5.

## Concessions made while executing

