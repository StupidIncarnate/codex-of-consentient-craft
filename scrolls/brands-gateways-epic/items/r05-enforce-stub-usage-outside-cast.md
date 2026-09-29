# R5: `enforce-stub-usage` refuses an object literal cast to a package type in a test, proxy, stub or harness file

| | |
|---|---|
| Phase | Phase 4, 4.1 rules wave (chunk R5) |
| Source | `scrolls/brands-types-tests-rules.md` C5, lines 1215-1316 (rule sentence at 1316); "New rules" row 2265; "Today's rules" row 2235; caller-side migration is [B05](b05-other-library-type-copies.md) step 9 and [G16](g16-gateway-stubs-node-and-failures.md) section 4 |
| Needs | wave 3.5 (L2 to L5 for eslint-plugin) before its scan reads clean |
| Unblocks | the C5 acceptance check in B05 step 9; switch-on at W10 |
| Packages touched | `eslint-plugin` |
| Checks to run | `lint,typecheck,unit` |
| Split | one agent, three batches in the order below |
| Runs alone | no; disjoint file list from R7 and F100 (only `config-dungeonmaster-broker.ts` is shared, and only R5 edits it) |

## Why

BR C5: "a hand-built outside value has the shape the author imagined, the same problem as invented failures (T5)".
"How a machine checks it: syntax plus type imports. In test, proxy and stub files, refuse an object literal cast to
a type imported from a package, with `as`, `as unknown as`, or through `Partial<…>`."

## Current state (checked 2026-09-29)

- `packages/eslint-plugin/src/brokers/rule/enforce-stub-usage/rule-enforce-stub-usage-broker.ts` gates on `hasFileSuffixGuard({ filename, suffix: 'test' })` and returns `{}` for a gateway file. Its one visitor, `VariableDeclarator`, reports `useStubInsteadOfTypedLiteral` for a variable initialised with an object or array literal (unwrapping `as`). It never looks at `.proxy.ts`, `.stub.ts` or `.harness.ts`, and has no check for a cast that is not a variable initialiser.
- The rule is `'error'` in `packages/eslint-plugin/src/brokers/config/dungeonmaster/config-dungeonmaster-broker.ts` line 113 and `'pre-edit'` in `packages/shared/src/statics/dungeonmaster-rule-enforce-on/dungeonmaster-rule-enforce-on-statics.ts` line 40. Both stay. The C5 check reads only the linted file's AST and its import sources, so it stays pre-edit.
- Reach today (regex census over test, proxy, stub and harness files, object literal `as` or `as unknown as` a name imported from a non-relative module): 5 hits in 3 files, `packages/@gateway/node/src/child_process/stream/stream.proxy.ts`, `packages/@gateway/node/src/child_process/stream-lines/stream-lines.proxy.ts`, `packages/orchestrator/src/brokers/quest/mcp-create/quest-mcp-create-broker.proxy.ts`. The census found none in eslint-plugin (it only sees a cast on one line after a closing brace, so the scan may find more); `ward scan @dungeonmaster/enforce-stub-usage -- packages/hooks` reads 0 today. The real numbers come from the scan in batch 3.
- Helpers that exist: `isTestSupportFileGuard` (test, proxy, stub, harness, `test/` dir), `isGatewayFileGuard`, `isNpmPackageImportGuard` (true for any non-relative source, workspace packages included), `astGetImportsTransformer`, `isAstObjectStubSpreadGuard`. Nothing yet reads the root name of a cast target.

## Work

1. **Batch R5-a: two helpers (4 files).**
   - `packages/eslint-plugin/src/transformers/ast-cast-target-root-name/ast-cast-target-root-name-transformer.ts` and `.test.ts`. Input: the cast's type node. Output: the leftmost identifier of the target, looking through `Partial<X>`, `Readonly<X>` and other single-argument wrappers and through a qualified name (`TSESLint.RuleContext<string, []>` gives `TSESLint`; `ChildProcess` gives `ChildProcess`), or `null` for a keyword type, `never`, `const`, `unknown`.
   - `packages/eslint-plugin/src/guards/is-ast-outside-type-cast/is-ast-outside-type-cast-guard.ts` and `.test.ts`. Input: an `as` or angle-bracket assertion node plus the map of imported local names to sources. True when, after unwrapping a chain of `as unknown as`, the expression is an `ObjectExpression` and the target's root name is imported from a source `isNpmPackageImportGuard` accepts. A cast to `never`, `const` or a locally declared type is false (BR: "That cast is to `never`, not to an outside type, so C5's check leaves it alone"). A clone built only from stub spreads (`isAstObjectStubSpreadGuard`) is false.
2. **Batch R5-b: the layer broker (3 files).** `packages/eslint-plugin/src/brokers/rule/enforce-stub-usage/outside-type-cast-report-layer-broker.ts`, `.test.ts`, `.proxy.ts` (a layer beside its parent rule, as `enforce-project-structure` does). It takes the assertion node, the imports map and the context and calls `context.report` with messageId `outsideTypeCast` and `typeName`. Message: `An outside type is built by hand and cast: {{typeName}}. Use the gateway's stub for it, imported from its own file.`
3. **Batch R5-c: wire it, land it, scan it (4 files).** Edit `packages/eslint-plugin/src/brokers/rule/enforce-stub-usage/rule-enforce-stub-usage-broker.ts` and `rule-enforce-stub-usage-broker.test.ts`:
   - Split the file gate. The existing `VariableDeclarator` check keeps its `test`-suffix and gateway skip exactly as they are. The C5 check runs when `isTestSupportFileGuard({ filename })` is true and does NOT skip the gateway (G16 section 4: "Do not exempt gateway stub files from THAT rule").
   - Track imports in an `ImportDeclaration` listener (via `astGetImportsTransformer`), visit `TSAsExpression` and `TSTypeAssertion`, call the layer broker.
   - Add `messages.outsideTypeCast`, and an option `{ outsideTypeCasts?: boolean }` (schema entry, `defaultOptions: [{ outsideTypeCasts: true }]`). The option exists only so the config can land the check off while the repo still holds hits.
   - RuleTester cases, quoting BR: valid `const child = ChildProcessStub();`, `const c = { report: jest.fn() } as never;`; invalid `const node = { type: 'CallExpression' } as TSESTree.CallExpression;` in a `.proxy.ts`, `const sourceFile = { fileName: 'x.ts' } as unknown as ts.SourceFile;` in a `.stub.ts`, `const context = { report: jest.fn() } as Partial<TSESLint.RuleContext<string, []>>;` in a `.test.ts`, and the same cast in a gateway proxy path (still reported).
   - **Scan first.** With `config-dungeonmaster-broker.ts` untouched (option defaults on), run `npm run ward -- scan @dungeonmaster/enforce-stub-usage -- packages/<pkg>`, one package at a time, for every package (a scan keeps the config's options, and the config has none yet, so the default `true` applies). Hand-check a sample of each package. Report per-package counts and the file list.
   - **Then land it off.** Edit `packages/eslint-plugin/src/brokers/config/dungeonmaster/config-dungeonmaster-broker.ts` line 113 to `['error', { outsideTypeCasts: false }]` with a comment naming the scan counts and that W10 drops the option, and `config-dungeonmaster-broker.test.ts` (line 358 area lists `'@dungeonmaster/enforce-stub-usage'`) to assert the entry. That is 4 files: rule broker, its test, config broker, its test.
   - The gateway config block copies `dungeonmasterCustomRules`; the e2e block sets the rule `'off'` at line 423 and stays.

Autofix: none. Replacing a hand-built value with a stub needs a stub that may not exist (B05 and G16 to G18 build them).

## Lint rule

`enforce-stub-usage`, extended: refuses an object literal cast (`as`, `as unknown as`, `Partial<…>`) to a type imported from a package, in a test, proxy, stub or harness file, gateway included. Pre-edit (unchanged). Lands with the `outsideTypeCasts: false` config option, off in effect; W10 removes the option.

## Teaching text

- Rule broker header `PURPOSE`/`USAGE` and `meta.docs.description` change with the code.
- Source row 2384: `mcp/src/brokers/architecture/testing-patterns/architecture-testing-patterns-broker.ts:249` adds "An outside type, an AST node, a rule context, a `ChildProcess`, comes from the gateway's stub, imported from its own file. Never build one by hand and cast it." Finished in Z01 to Z03.
- Source row 2398: `packages/eslint-plugin/src/brokers/rule/CLAUDE.md` already shows `ProgramStub({ code })` (checked), so nothing to do there.

## Done when

- [ ] Batches a to c landed; per-package scan counts and file lists reported.
- [ ] The config entry carries `outsideTypeCasts: false`, so repo lint is unchanged.
- [ ] `npm run ward -- --only lint,typecheck,unit -- <touched files>` exits 0.

## Plan

**Size:** small. 11 files new or edited in eslint-plugin, 3 batches, one agent each, run in order (R5-a then R5-b then R5-c). Nothing outside `packages/eslint-plugin`; no shared change, so no build.

**Already done:** the rule, its config entry (`'error'`) and its `'pre-edit'` tag exist; the CLAUDE.md example row is already in the gateway-stub form.

**Dependencies:** the batches need nothing. The scan reads clean only after wave 3.5's eslint-plugin share (L2 to L5) lands, because the plugin's own tests may still build nodes and contexts through the copies (L3 leftovers, EPIC line 145); until then record the plugin's count and do not chase it. Uncommitted work by other agents sits in `packages/eslint-plugin/src/brokers/rule/enforce-stub-patterns/` and `hydration-recipes`; R5 touches neither.

**Files by batch**

| Batch | Files |
|---|---|
| R5-a | `packages/eslint-plugin/src/transformers/ast-cast-target-root-name/ast-cast-target-root-name-transformer.ts`, `packages/eslint-plugin/src/transformers/ast-cast-target-root-name/ast-cast-target-root-name-transformer.test.ts`, `packages/eslint-plugin/src/guards/is-ast-outside-type-cast/is-ast-outside-type-cast-guard.ts`, `packages/eslint-plugin/src/guards/is-ast-outside-type-cast/is-ast-outside-type-cast-guard.test.ts` |
| R5-b | `packages/eslint-plugin/src/brokers/rule/enforce-stub-usage/outside-type-cast-report-layer-broker.ts`, `packages/eslint-plugin/src/brokers/rule/enforce-stub-usage/outside-type-cast-report-layer-broker.test.ts`, `packages/eslint-plugin/src/brokers/rule/enforce-stub-usage/outside-type-cast-report-layer-broker.proxy.ts` |
| R5-c | `packages/eslint-plugin/src/brokers/rule/enforce-stub-usage/rule-enforce-stub-usage-broker.ts`, `packages/eslint-plugin/src/brokers/rule/enforce-stub-usage/rule-enforce-stub-usage-broker.test.ts`, `packages/eslint-plugin/src/brokers/config/dungeonmaster/config-dungeonmaster-broker.ts`, `packages/eslint-plugin/src/brokers/config/dungeonmaster/config-dungeonmaster-broker.test.ts` |

**Decisions for the operator**
1. "A package" means any non-relative import source (`#gateway/…`, bare npm, `@dungeonmaster/*`), matching `isNpmPackageImportGuard`, whose own header says it "includes workspace packages". The census hit in the orchestrator proxy is a workspace type (`AddQuestResult`). Narrowing to gateway and bare npm sources is a one-line change in the guard; say if you want it.
2. Harness files are included, per EPIC 4.1 ("proxies and harnesses too"), though BR C5 names only test, proxy and stub.
3. The option exists because `ward scan` "keeps whatever options the repo config gave the rule" (`scan-eslint-config-source-transformer.ts`), so it cannot see a check the config has switched off; hence scan first, land off after.

**Parallelism:** disjoint from R7 and F100 in files (R7 edits the create responder and its tests; R5 and F100 do not). Only `config-dungeonmaster-broker.ts` and its test are touched by both R5 and R7, so R5-c and R7's registration batch must not run together.

### Operator decision (2026-09-29 afternoon)

Keep the planner's reading: any non-relative import source counts as "a package", workspace packages included. A test, proxy or stub builds a workspace type through its stub too, so an object literal cast to one is refused.
