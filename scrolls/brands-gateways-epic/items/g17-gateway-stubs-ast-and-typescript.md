# G17: Gateway stubs — AST nodes, rule context, TypeScript source file

| | |
|---|---|
| Phase | Phase 1 — gateway foundation |
| Source | `scrolls/gateway/followup-sustainability.md`, item 25's AST/rule-context/SourceFile rows, lines 600-625; `scrolls/brands-types-tests-rules.md` C5, lines 1215-1316 |
| Needs | [G26](g26-per-file-proxy-and-stub-imports.md) (the per-file import form every new stub in this item uses) |
| Unblocks | [G18](g18-gateway-stub-every-subpath.md), [B04](b04-eslint-rules-on-real-tsestree.md), [B05](b05-other-library-type-copies.md) |
| Packages touched | `@gateway/npm` (new stubs under `typescript-eslint__parser`, `typescript-eslint__utils`, `typescript`, and a possible new subpath for `typescript-eslint__typescript-estree`) |
| Checks to run | `lint,typecheck,unit` |
| Split | one agent |
| Runs alone | no |

This is the second of three pieces the operator split gateway follow-up item 25 into (EPIC.md
concession 5). [G16](g16-gateway-stubs-node-and-failures.md) covers the colocation-rule mechanics,
recorded failures and Node-only stubs. This item covers the AST-node stubs, the rule-context stub, and
the TypeScript `SourceFile` stub — all built on real parsed code, never a hand-built shape. The
CALLERS that switch from the repo's old copied-type stubs onto these are a later item (B04/B05), not
this one.

## Why

Two of the repo's own stubs build fake ASTs and fake ESLint rule contexts by hand, through a copied
type (`TsestreeStub`, called 1,856 times in 60 files; `EslintContextStub`, called 307 times in 21
files). A hand-built tree compiles fine but does not look like what the real parser produces — the
source doc's own example shows a `CallExpression` built with no `arguments` property, something the
real parser never emits. Code tested against a shape like that passes on inputs the real library never
produces. The fix, per BR's C5, is one stub per outside type, built FROM REAL PARSED CODE, living in
the gateway next to the type it stubs.

## Current state

Checked 2026-09-26 against the code:

- **No AST, rule-context or TypeScript-source-file stub exists anywhere in the gateway yet.** The
  2026-09-26 stub census (see G16's "Current state") found exactly one `.stub.ts` file in the whole
  gateway, and it is unrelated (`node/src/fs/is-fs-error/fs-error.stub.ts`).
- **The npm gateway package's dependency list, as declared today** (`packages/@gateway/npm/package.json`,
  `peerDependencies`):

  ```
  @typescript-eslint/eslint-plugin  ^8.35.1
  @typescript-eslint/parser         ^8.45.0
  @typescript-eslint/utils          ^8.35.1
  eslint                            ^9.36.0
  typescript                        ^5.8.3
  ```

  `@typescript-eslint/typescript-estree` is NOT listed, in either `dependencies` or
  `peerDependencies`.
- **Subpath folders that already exist** for these packages:
  `packages/@gateway/npm/src/typescript/`, `packages/@gateway/npm/src/typescript-eslint__parser/`,
  `packages/@gateway/npm/src/typescript-eslint__utils/`, and (unrelated to this item but confirming the
  naming convention) `typescript-eslint__eslint-plugin/`. Each is a BARE pass-through today — one
  barrel file plus one test file, nothing else:

  ```typescript
  // packages/@gateway/npm/src/typescript-eslint__utils/typescript-eslint__utils.ts
  export * from '@typescript-eslint/utils';
  ```

  No wrapper folders or stubs exist under any of the three yet.
- **`@typescript-eslint/typescript-estree` IS installed** (checked in `node_modules/@typescript-eslint/`
  on 2026-09-26 — present as a transitive dependency of `@typescript-eslint/utils`), but has no gateway
  subpath folder of its own and no declared dependency entry in the npm gateway's `package.json`.
  `simpleTraverse` (needed for step 2 below) lives there. **This item needs a new subpath**,
  `#gateway/npm/typescript-eslint__typescript-estree`, with its own declared dependency entry
  (`gateway-dependency-declared` already enforces that every npm-gateway folder names a real
  package in `dependencies` or `peerDependencies` — decide which list it belongs in: it is used only
  to build test stubs inside the gateway itself, never by a consumer directly, which argues for
  `dependencies` rather than `peerDependencies`, but confirm against how the other three
  `typescript-eslint__*` entries are split before deciding).
- No shared "parse and find a node" helper exists yet anywhere in the repo (checked by folder listing
  under all four `typescript-eslint__*`/`typescript` subpaths — none holds anything beyond its bare
  barrel and test).

## BR C5, quoted in full (gateway side only — callers switch in B04/B05)

> #### C5: a test value of an outside package's type comes from the gateway's stub, never from a copy
> or a cast
>
> A stub for one of our contracts parses through the contract. A value of an outside package's type,
> such as an AST node, an ESLint rule context or a `ChildProcess`, comes from the gateway's stub for
> that type, imported from its own file beside the type: `import { CallExpressionStub } from
> '#gateway/npm/typescript-eslint__utils/call-expression/call-expression.stub'`.
> `@dungeonmaster/testing` ships no stubs of outside types.
>
> **This doc does not build those stubs.** The gateway writes them, typed with the package's own types
> and built by the package where it can; how is in the gateway follow-ups, item 25. This rule covers
> our side: our stubs of copied types are deleted with their copies (C1), every caller switches to the
> gateway's stub, and no test builds an outside value by hand.
>
> ```typescript
> // before — hand-built nodes through the copy; TsestreeStub is called 1,856 times in 60 test and proxy files
> const node = TsestreeStub({
>   type: TsestreeNodeType.CallExpression,
>   callee: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'foo' }),
> });   // compiles with no `arguments`, a CallExpression the real parser never produces
>
> // after — the gateway's stub, from real parsed code
> import { CallExpressionStub } from '#gateway/npm/typescript-eslint__utils/call-expression/call-expression.stub';
> const node = CallExpressionStub();                         // a TSESTree.CallExpression for 'foo()'
> const withArgs = CallExpressionStub({ code: 'bar(1, 2)' });
> ```
>
> ```
> // before — a partial ESLint context through the copy; EslintContextStub is called 307 times in 21 files
> const context = EslintContextStub({ getFilename: () => 'x.ts', report: jest.fn() });
>
> // after — the gateway's complete TSESLint.RuleContext
> import { RuleContextStub } from '#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub';
> const context = RuleContextStub({ filename: 'x.ts' });
> ```
>
> What our side changes, stub by stub (test/proxy file counts and call counts, measured against the
> main checkout — re-verify against this branch before treating them as current):
>
> | Our stub on a copied type today | Test and proxy files | Calls | Callers switch to (the gateway's) |
> |---|---|---|---|
> | `TsestreeStub` (eslint-plugin) | 60 | 1,856 | `CallExpressionStub`, `IdentifierStub` and the rest, one per node type |
> | `EslintContextStub` (eslint-plugin) | 21 | 307 | `RuleContextStub` |
> | `TypescriptSourceFileStub` (testing) | 7 | 38 | `SourceFileStub` |
>
> Ins and outs:
>
> - **The copies do harm today, where they meet real code.** Production adapters already return the
>   real Node types, so proxies cast the thin stub into the real slot, and code under test receives an
>   object missing real methods (`fsStatAdapter` returning `Promise<Stats>` while its proxy resolves a
>   cast fake, for example).
> - **Hand-built AST trees shrink at the call site.** A tree nested 5 levels deep by hand becomes one
>   line from parsed code: `CallExpressionStub({ code: "describe.each(table)('name', fn);" })`.
> - **Most `EslintContextStub` calls override only `report`.** Most call sites switch to
>   `RuleContextStub()` with a `report` mock and nothing else.
> - **A test that corrupts a node on purpose keeps doing so after building a real one** — a cast to
>   `never` to test defensive code against a shape no parser produces is not an outside-type cast, so
>   C5's check leaves it alone.
> - **Whole-rule behaviour is still tested through ESLint's `RuleTester`** with real code strings; C5
>   covers guard and transformer tests below that level.
> - **Our own objects are not outside types.** An object our own code builds (a contract, its stub) is
>   unaffected by C5 (covered by C6 instead).
> - **A contract field of an outside type takes the gateway stub too** — branded `'#Gateway<Type>'`
>   (C9, see [G20](g20-gateway-schemas-gateway-brand.md)).
>
> Why: a hand-built outside value has the shape the author imagined, the same problem as invented
> failures (T5). Code tested against it passes on inputs the real library never produces. One stub per
> outside type, in the gateway, keeps that work in one place, and production code never changes its
> types to suit a test.
>
> How a machine checks it: syntax plus type imports. In test, proxy and stub files, refuse an object
> literal cast to a type imported from a package, with `as`, `as unknown as`, or through `Partial<…>`.

## Work

1. **Build one shared parse-and-find function.** Given a code string and a node type (or a predicate),
   parse it with `@typescript-eslint/parser` and return the first matching node, typed
   `TSESTree.<Type>`. This is what every node stub below calls with its own default code sample and its
   own node-type filter.
2. **Wire up parent links.** The parser does not set `.parent` on nodes — ESLint adds that while it
   walks. The shared parse-and-find function walks the parsed tree once with
   `simpleTraverse(ast, { enter() {} }, true)` from `@typescript-eslint/typescript-estree` (the new
   subpath from "Current state" above), which sets `.parent` as a side effect of the walk. Verify:
   parsing `foo(a)` should give a real `CallExpression` with its `arguments` populated, and after the
   walk its `.parent` set.
3. **JSX support.** `JSXElement` and `JSXFragment` node stubs need the parser invoked with its `jsx`
   parser option turned on — the shared function needs a way to opt into that (a parameter, or a
   second JSX-flavored entry point).
4. **Write stubs for the node types tests actually use**, not all 68 that show up across the repo's
   current 1,856 `TsestreeStub` calls. The 12 most-used cover about 81% of uses (1,602 of 1,974, per a
   2026-09-24 measurement) — start with these: `Identifier`, `ArrowFunctionExpression`,
   `CallExpression`, `MemberExpression`, `ObjectExpression`, `Program`, `BlockStatement`,
   `ReturnStatement`, `Literal`, `ExpressionStatement`, `Property`, `VariableDeclaration`. Add more as
   B04/B05 (the caller-migration items) find they need them — this item does not have to anticipate
   every one of the 68.
   Each stub lives in its own wrapper folder under `#gateway/npm/typescript-eslint__utils/<kebab-node-name>/`
   (matching the "one folder per wrapper" convention, e.g.
   `typescript-eslint__utils/call-expression/call-expression.stub.ts`), takes an optional `{ code?:
   string }` (or similar) to let a caller supply different sample source, and returns the parsed node
   typed as `TSESTree.<Type>` via the shared function from step 1.
5. **`RuleContextStub`.** A real `TSESLint.RuleContext` only exists while ESLint is actually linting, so
   the stub must write EVERY member of the type — no `Partial`, no cast — filling each with a working
   default (a callable `report` that's a jest mock by default, sensible filename/options/etc.) and
   letting a caller override individual members (`RuleContextStub({ filename: 'x.ts' })`). Nearly all
   of today's 307 `EslintContextStub` calls override only `report` — make sure that is the trivial case
   in the new stub's own signature. Lives at
   `#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub.ts`.
6. **`SourceFileStub`.** Built with `ts.createSourceFile('x.ts', code, ts.ScriptTarget.Latest, true)` —
   a real `ts.SourceFile`, not a copy. Takes the code string as a parameter (with a sensible default).
   Lives at `#gateway/npm/typescript/source-file/source-file.stub.ts`.
7. **Every new stub's own proxy and test**, per this repo's usual colocation rule (a stub still needs
   the wrapper-folder's test/proxy pair unless the stub itself is exempt — check
   `gateway-colocation`'s current exemptions for `.stub.ts` files before assuming one is or is not
   required; if none exists yet for `.stub.ts` specifically, this item's stubs still need SOME test
   proving they build a real, correctly-shaped value — an ordinary `.test.ts` beside the stub is the
   safe default).
8. **New subpath: `typescript-eslint__typescript-estree`.** A bare pass-through barrel
   (`export * from '@typescript-eslint/typescript-estree';`), its own test (export-key comparison
   against the real module, matching the existing pass-through pattern in e.g. `npm/src/zod/zod.test.ts`),
   and a declared dependency entry in `packages/@gateway/npm/package.json`. This is what `simpleTraverse`
   (step 2) and the shared parse-and-find function import.
9. **Parser cost — note it, do not try to fix it.** Loading `@typescript-eslint/parser` costs about
   250 ms once per test file (measured 2026-09-24 on Node 22.17); a parse plus the walk after that is
   about 0.18 ms (1,000 warm calls took 176 ms). This is a real, fixed cost of switching to real-parsed
   stubs — call it out in the stub's own PURPOSE comment if a reviewer might otherwise wonder why a
   "simple" stub call is comparatively slow the first time a test file runs it, but do not attempt to
   cache the parser across test files (Jest's per-file isolation makes that unreliable, and the source
   doc does not ask for it).

## Lint rules this item adds or changes

None directly — BR's C5 machine check ("refuse an object literal cast to a type imported from a
package, in test/proxy/stub files") is built here as part of writing these stubs correctly (a stub that
casts a partial object to `TSESTree.CallExpression` instead of parsing real code is exactly what this
rule refuses), but the RULE ITSELF, as a reusable lint check applied repo-wide, belongs to B04 (which
also switches lint rules onto the real `TSESTree` types). Confirm with B04's own item file before
building a duplicate.

## Done when

- [ ] A shared parse-and-find function exists, used by every node stub, with parent links wired via
      `simpleTraverse`.
- [ ] Stubs exist for at least the 12 node types named above, each in its own wrapper folder, each
      imported from its own file under `typescript-eslint__utils`.
- [ ] `RuleContextStub` writes every member of `TSESLint.RuleContext`, with no `Partial` and no cast,
      and is imported from its own file, alongside the node stubs.
- [ ] `SourceFileStub` builds a real `ts.SourceFile` via `ts.createSourceFile`, imported from its own file
      under `typescript`.
- [ ] `#gateway/npm/typescript-eslint__typescript-estree` exists as a new subpath, declared in
      `package.json`, with its own barrel test.
- [ ] Every new stub is typed with the real outside type, builds a complete value from real parsed
      code (not a hand-built object cast to the type), and has a colocated test.
- [ ] `npm run ward -- -- <files touched>` exits 0.

## Traps

- Do not hand-build any node as a plain object literal cast to `TSESTree.<Type>` — that is precisely
  what C5 refuses, and precisely the failure mode this item exists to retire.
- `simpleTraverse`'s signature and its exact parent-link side effect should be confirmed against the
  installed `@typescript-eslint/typescript-estree` version (not assumed from memory) — call it with a
  small real example and inspect the result before writing the shared function around it.
- Keep the JSX parser option scoped to only the stubs that need it — turning it on globally in the
  shared parse function may change how ordinary (non-JSX) code parses.
- This item is scoped to the GATEWAY side only. Do not go looking for `TsestreeStub` or
  `EslintContextStub` call sites to migrate — that is B04/B05's job, later in the epic, after these
  replacement stubs exist and are proven correct.

## Concessions made while executing

<Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table.>
