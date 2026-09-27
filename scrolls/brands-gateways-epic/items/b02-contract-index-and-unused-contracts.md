# B02: the parse index is built, and every contract nothing parses is deleted

| | |
|---|---|
| Phase | Phase 3 — brands foundation |
| Source | `scrolls/brands-types-tests-rules.md` (BR), C1 "a contract must be parsed somewhere in production code", lines 998-1058; "Status and order of work" step 4, lines 2444-2445; "Found along the way" rows for `mcpServerClientContract` and hydration's generic interfaces, lines 2482 and 2485 |
| Needs | [A19](../a19-adapters-folder-type-gone-caller-rules-on.md) |
| Unblocks | [B03](b03-package-exports-and-per-file-test-imports.md), [B10](b10-owner-index.md), and Z01–Z07 |
| Packages touched | The index reads every workspace package's `contracts/` folder. Deletions land in whatever package holds a contract nothing parses — expected: `eslint-plugin`, `local-eslint`, `testing`, `hooks`, `mcp`, `hydration` at minimum (see Current state) |
| Checks to run | `lint,typecheck,unit` on the index's own package (wherever it lives — see Work step 1) and on every package that loses a contract |
| Split | One agent builds the index and the `require-contract-parse` rule. A second wave, 2-3 files per agent, hand-checks the deletion candidate list and deletes each dead contract with its stub and test. |
| Runs alone | No |

## Why

A contract is supposed to be a check on real data. `tsestree-contract.ts` (597 lines) and its four
siblings (`eslint-context-contract.ts`, `typescript-source-file-contract.ts`, `child-process-contract.ts`,
`file-stats-contract.ts`) are copies of library types that nothing ever parses — they exist only as
TypeScript shapes. `mcpServerClientContract` is the same problem without being a copy: its `process`
field is `z.unknown()` standing in for a `ChildProcess`, and nothing in production imports it at all.
Deleting every contract nothing parses, before the brand rules (B1 onward) touch the repo, means those
rules never have to migrate dead code — every contract the brand rules see afterward is one worth
branding correctly.

The check has to read the syntax tree, not text: 1,095 of the 1,103 `.parse(` lines inside `contracts/`
folders are JSDoc `@example` comments, and a text search would count those as real parses and pass every
copy that carries an example.

## Current state

Confirmed this session (2026-09-26) by reading the files directly:

- `packages/eslint-plugin/src/contracts/tsestree/tsestree-contract.ts`, `tsestree.stub.ts`, and
  `tsestree-contract.test.ts` all exist.
- `packages/eslint-plugin/src/contracts/eslint-context/eslint-context-contract.ts`,
  `eslint-context.stub.ts`, and `eslint-context-contract.test.ts` all exist.
- `packages/eslint-plugin/src/statics/tsestree-node-type/tsestree-node-type-statics.ts` and its test
  exist. This is a statics copy of `AST_NODE_TYPES`, not a contract, so `require-contract-parse` does not
  see it — C2 in `b04-eslint-rules-on-real-tsestree.md` handles it.
- `packages/testing/src/contracts/typescript-source-file/typescript-source-file-contract.ts` and its
  stub exist. `packages/testing/src/contracts/timer-handle/timer-handle-contract.ts` and its stub exist
  too.
- `packages/hooks/src/contracts/child-process/child-process-contract.ts` and
  `packages/hooks/src/contracts/file-stats/file-stats-contract.ts`, each with a stub, exist.
- `packages/mcp/src/contracts/mcp-server-client/mcp-server-client-contract.ts`, its stub, and its test
  exist.
- `packages/hydration/src/contracts/hydration-collection/`, `ingredient-handle/` and `matched-set/`
  folders all exist under `packages/hydration/src/contracts/`. Whether they still export hand-written
  generic interfaces rather than `z.infer` types was **not re-checked this session** — read each file
  before assuming the doc's 2026-09-24 description still holds.

None of these six copies' contents were re-diffed against the doc's descriptions this session beyond
confirming the files exist — the agent doing the deletion work should read each one fresh, since the
gateway migration (Phase 2) may already have moved some callers off them.

No index of `.parse(`/`.safeParse(` calls exists in this repo today — this is new capability, not a
rewrite of one. No lint rule named `require-contract-parse` exists yet (confirmed: no such folder under
`packages/eslint-plugin/src/brokers/rule/` as of this session's scan for brand/contract-related rule
folders).

## Work

1. **Build the index as a reusable piece.** This is the first of several rules in this epic that need a
   repo-wide index rather than a single-file syntax check ([B10](b10-owner-index.md) extends it with
   owners and keys; [B16](b16-real-owner-and-id-rebrand.md) reuses it via B7's index). Decide where it
   lives — a broker or transformer in the package that owns the `require-contract-parse` rule
   (`eslint-plugin`, most likely, since that is where the rule itself lives) or in `@dungeonmaster/shared`
   if other packages' rules need to call it too. Recommended — the executing agent may change it with a
   reason in DECISIONS: put the index-building logic in `@dungeonmaster/shared`, since B10 (owners and
   keys) and the C8-sharing rule in `b11-unique-contract-names.md` both need the same kind of read and
   both may run from different packages' rule files. The file-scanning code behind the `discover` MCP
   tool does a similar job and may be reusable — check it before writing a new walker.
2. **What the index must record**, read from the syntax tree of every `*-contract.ts` file (not
   `*-layer-contract.ts` — those are C7's job, in `b07-layers-and-statics-regex.md`) in every workspace
   package:
   - Every exported contract name and the package it lives in.
   - Every `.parse(` and `.safeParse(` call in production code (excluding `.test.ts`, `.proxy.ts`,
     `.stub.ts`, `.harness.ts` files, and anything under a package's `test/` directory), and which
     contract or contract field each call's argument type resolves to.
   - Whether a contract's own type exports are all `z.infer` of a schema declared in that same file —
     a contract exporting a hand-written interface (`Collection`, `RowVerbs`, `Op` in hydration, per
     "Found along the way") has no schema to parse, so it can never pass the "is it parsed" test on its
     own terms; flag it separately as "not a real contract" rather than silently marking it unused.
3. **A contract counts as parsed in either of two ways.** A search for its own `.parse(` call finds only
   the first:
   1. Production code parses it, or one of its fields: `questContract.parse(…)`,
      `questContract.shape.id.parse(…)`.
   2. It is a field of a contract that counts as parsed. A nested contract sits inside its parent, and a
      layer sits inside its parent (C7, handled in `b07-layers-and-statics-regex.md` — this item's index
      should be built so B07's layer-parses-through-parent case can be added without a rewrite).
4. **Flag every contract that fails both.**
   ```
   // flagged — never .parse'd in production
   tsestreeContract, eslintContextContract, typescriptSourceFileContract, childProcessContract, fileStatsContract

   // left alone — parsed where outside data enters
   const report = jestJsonReportContract.parse(JSON.parse(stdout));
   const line = streamJsonLineContract.parse(JSON.parse(rawLine));        // Claude CLI output
   const pkg = packageJsonContract.parse(JSON.parse(await readFile(filePath)));   // readFile from #gateway/node/fs__promises
   ```
   A parse is not a boundary check just because it runs. `responderResultContract` and
   `adapterResultContract` both parse without checking outside data — but that is not this rule's
   problem: C1 passes any contract that is parsed at all, whether or not the parse checks something real.
   `adapterResultContract` goes away under [B18](b18-returns-say-what-happened.md), and
   `responderResultContract`'s `data: z.unknown()` field goes away under
   [B15](b15-brand-migration.md) (open decision 5: `z.unknown()` is refused in `contracts/`). Do not
   delete either one here for being a weak check — only delete a contract nothing parses at all.
5. **Build the `require-contract-parse` lint rule** (ward only — never pre-edit; see "Lint rules this
   item adds" below).
6. **Run the index as a scan over the whole repo before switching the rule on**, and hand-check a sample
   of what it flags and what it lets through — this is the standing rule for every new lint rule in this
   epic (EPIC.md, "The order of work").
7. **Delete every contract the index flags, hand-checking first.** For each: delete the contract file,
   its `.stub.ts`, its `.test.ts`, and remove it from any barrel that still exports it (barrels are B03's
   job to restructure, but a barrel entry pointing at a file you just deleted has to go regardless).
   Confirm no test file still imports the deleted stub — a stub deleted out from under a live test import
   is a build break, not a cleanup.
8. **Any copied library type the gateway migration (Phase 2) left behind goes here too**, with its stub —
   this item runs after Phase 2, so check for stragglers the adapter-deletion items missed.

## Lint rules this item adds or changes

**`require-contract-parse`** — ward only, never pre-edit. It needs a repo-wide index of `.parse(` and
`.safeParse(` calls read from the syntax tree, which the file being edited cannot supply on its own —
BR's "Where each rule runs" names this rule as the clearest case that fails all three pre-edit conditions:
it reads other files, a contract is flagged for what *other* files don't contain, and the fix (adding a
parse) usually lands in a file that does not exist yet at the moment the contract itself is written.

| What it checks | Message |
|---|---|
| Every exported contract in `contracts/` is parsed via C1's two-way test (direct parse, or nested inside a contract that counts as parsed) | `{{contractName}} in {{file}} is never parsed in production. Delete it with its stub and test, or add a parse where its data enters.` |
| Every type a contract file exports is `z.infer` of a schema in that file | `{{typeName}} in {{file}} is not z.infer of a schema in this file. A contract's exported types must come from its own parse.` |

No autofix — deleting a contract touches its stub, its test and every barrel that re-exports it, which is
too wide a blast radius for an automatic fix.

## Teaching text this item changes

None directly. [Z01](../z01-gateway-folder-type-doc.md)–[Z03](../z03-folder-type-and-testing-docs.md) add
the general "a contract nothing in production parses is deleted, with its stub and test" line (BR docs
table row for C1, "Folder-type docs: `get-folder-detail`", "new section... `Nothing on unused
contracts`... `A contract nothing in production parses is deleted, with its stub and test.`") — this item
does the deleting; Z01–Z03 write the sentence once every item that could still produce a dead contract has
landed.

## Done when

- [ ] The index exists, is callable from a lint rule, and records contract names, packages, parse sites,
      and which type exports are `z.infer`.
- [ ] `require-contract-parse` is built, scanned over the whole repo, and hand-checked before being
      switched on.
- [ ] Every contract the scan flags has been hand-checked and either deleted (with its stub and test) or
      confirmed to have a real parse the scan missed (report which, and why the scan missed it).
- [ ] `tsestree-contract.ts`, `eslint-context-contract.ts`, `typescript-source-file-contract.ts`,
      `child-process-contract.ts`, `file-stats-contract.ts` and `mcp-server-client-contract.ts` are gone,
      with their stubs and tests, unless the hand-check found a real parse (report it if so).
- [ ] `npm run ward -- --only lint,typecheck,unit -- <touched files>` exits 0.

## Traps

- The 1,095-of-1,103 JSDoc `@example` figure is the reason a text search is wrong here — read from the
  syntax tree (an AST), not a string match on `.parse(`.
- Deleting a stub that a test still imports breaks that test's compile, not just its run — check callers
  before deleting, not after.
- `mcpServerClientContract`'s `process: z.unknown()` field looks like it needs C9's gateway-schema
  treatment ([B06](b06-gateway-schema-fields-in-contracts.md)), but it does not: this contract has no
  production importer at all, so it is simply deleted, not migrated.
- Hydration's hand-written interfaces (`Collection`, `RowVerbs`, `Op`) import each other in a cycle
  (BR "Found along the way": "import each other's types in a cycle"). Deleting or rewriting one without
  reading the others first may break the cycle in a way that is not obvious from one file.

## Concessions made while executing

