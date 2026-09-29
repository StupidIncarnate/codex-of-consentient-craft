# B02: the parse index is built, and every contract nothing parses is deleted

> **Re-planned 2026-09-29.** Order, chunking and sizes for this item are in [`EPIC.md`, "Phases 3 and 4 — the plan"](../EPIC.md), chunks 3.1 (deletions) and R1 (index and rule). That plan wins on order and size; this file still specifies the rules. Counts below are from 2026-09-26 unless marked.

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

## Plan — R1 switch-on queue

Planning pass, 2026-09-29. No code changed. Every count is `npm run ward -- scan @dungeonmaster/require-contract-parse -- packages/<pkg>`, one package at a time, run in this worktree.

### Measured

| Package | Unparsed | Note |
|---|---|---|
| config | 2 |  |
| eslint-plugin | 5 | provisional: another agent is editing this package |
| hooks | 3 |  |
| hydration | 4 | provisional: another agent is editing this package |
| hydration-recipes | 8 | provisional: another agent is editing this package |
| mcp | 11 | provisional: another agent is editing this package |
| orchestrator | 24 | provisional: another agent is editing this package |
| shared | 20 |  |
| siegelense | 4 | provisional: another agent is editing this package |
| testing | 18 |  |
| tooling | 4 |  |
| web | 19 |  |
| cli, local-eslint, session-forensics, ward, `@gateway/bin`, `@gateway/browser`, `@gateway/node`, `@gateway/npm` | 0 | `@gateway/*` hold no `contracts/` folder |
| server | 0 | provisional: another agent is editing this package |
| **Total** | **122** | The 2026-09-29 tsx count was 135; siegelense first failed with an ENOENT on a transient `packages/hooks/src/.test-tmp/...` file another agent's test run had created, and read 4 on the re-run. |

### How each contract was classified

Codes below: **B** = (b) the contract is dead, move it out with its stub, test and barrel line (rule 20, agent-brief rule 8: `mv` to `tmp/deletions/b02/<repo path>`, never delete). **A** = (a) add the parse at the named file and line. **K** = (c) the 4.0 exception in b14 "Decisions (4.0)" applies; those decisions retire the empty-carrier const and keep the method-set type. **W1** = (b), but the brand is class `plain` in b15 and has production type users, so the W1 codemod removes it (changing the type to `string`/`number` is W1's job, not a hand edit). **O** = open: waits on another item or an operator decision, named in the row.

The importer evidence is the file's own `import ... from '.../<name>-contract'` lines in the same package (not a name match, since several packages define a `filePathContract` with the same text), plus the package's barrel and `src/index.ts`. Test, stub, proxy and harness importers are counted separately and do not save a contract.

Two index gaps the batches will hit, both for the R1 owner rather than the batches: (1) every scan message read "Contract X is never parsed by production code", so the scan output shows no "type is not `z.infer`" report; the 4.0 exceptions therefore cost R1 no per-file edit beyond the carrier consts, but nothing here proves the second check is live, and the switch-on agent must confirm it with a one-file probe; (2) a schema passed as a value to another package's function that parses it (hydration `fields:`/`args:`) is invisible to the index, which is why the four hydration-recipes schema aliases are moved out rather than parsed.

### config (2)

| Contract file | Decision | Detail |
|---|---|---|
| `packages/config/src/contracts/file-contents/file-contents-contract.ts` | (b) move out (B) | no importer in `packages/config`; config code imports `@dungeonmaster/shared/contracts`. Move out with `file-contents.stub.ts`, `file-contents-contract.test.ts`, barrel `packages/config/src/contracts/contracts.ts:18`. b11 row 292: "config P (test-only)". |
| `packages/config/src/contracts/file-path/file-path-contract.ts` | (b) move out (B) | dead: every config broker imports shared's (`config-resolve-broker.ts:14`, `config-file-load-broker.ts:11`, `index.ts:13`). Barrel `contracts.ts:20`. 3.1 dropped it only for docs that teach it (`packages/mcp/src/statics/folder-constraints/adapters-constraints.md:110,336`, `contracts-constraints.md:77`, `packages/mcp/README.md:120`); leave those teaching examples alone, they name a hypothetical import. b11 row 294: "config P (dead)". |

### eslint-plugin (5) — provisional

| Contract file | Decision | Detail |
|---|---|---|
| `packages/eslint-plugin/src/contracts/allowed-import/allowed-import-contract.ts` | (b) move out (B) | 0 importers in production. Test string fixtures: `rule-enforce-stub-patterns-broker.test.ts:57` and `is-entry-file-guard.test.ts:190-192` name the path; edit those two tests off it. No barrel line. |
| `packages/eslint-plugin/src/contracts/eslint-rule-name/eslint-rule-name-contract.ts` | (b) move out (B) | 0 importers (b15 row 638 calls it "plain (record key)", fan-out 29 is stub/test use). No barrel line. b11 row 290 clears it at W1; nothing production imports it now, so move it now. |
| `packages/eslint-plugin/src/contracts/collected-export/collected-export-contract.ts` | (a) add the parse (A) | type only, built by hand: `brokers/rule/enforce-project-structure/collect-exports-layer-broker.ts:26` (`const exports: CollectedExport[] = []`) and the casts `type: 'VariableDeclaration' as CollectedExport['type']` at `:77`, `:95`, `:111`. Replace each cast-and-push with `collectedExportContract.parse({...})`; `validate-export-layer-broker.ts` reads it. |
| `packages/eslint-plugin/src/contracts/ast-node/ast-node-contract.ts` | open / blocked (O) | hand copy of the ESTree node (`parent: z.unknown()`), used at `transformers/ast-to-violation/ast-to-violation-transformer.ts:21`, exported at `src/index.ts:12`. b15 row 791 gives `parent` the gateway schema `#GatewayTsestreeNode`. Waits for the L2/C2 library-copy replacement and B06. |
| `packages/eslint-plugin/src/contracts/rule-violation/rule-violation-contract.ts` | open / blocked (O) | `violation: RuleViolation` at `ast-to-violation-transformer.ts:22`, exported at `src/index.ts:13`; `fix` and `suggest` are functions kept out of the schema. b15 rows 800-801 give `node` the gateway schema and `data` `z.json()`. Waits for L2/C2 and B06. |

### hooks (3)

| Contract file | Decision | Detail |
|---|---|---|
| `packages/hooks/src/contracts/has-string-property/has-string-property-contract.ts` | (b) move out (B) | not a schema: `export const hasStringPropertyContract = ({ obj, property }) => boolean` is a guard in `contracts/`. 0 importers. Move it out (a guard with a live caller would move to `guards/`; there is none). |
| `packages/hooks/src/contracts/session-start-hook-data/session-start-hook-data-contract.ts` | (b) move out (B) | 0 importers. The session-snippet flow parses `baseHookDataContract.safeParse(hookInput)` (`flows/hook-session-snippet/hook-session-snippet-flow.ts:56`), not this one. |
| `packages/hooks/src/contracts/subagent-start-hook-data/subagent-start-hook-data-contract.ts` | (b) move out (B) | 0 importers; same flow line as above reads `hook_event_name === 'SubagentStart'` off `baseHookDataContract`. |

### hydration (4) — provisional

| Contract file | Decision | Detail |
|---|---|---|
| `packages/hydration/src/contracts/http-response/http-response-contract.ts` | (b) move out (B) | 0 importers; hydration-recipes has its own `dmHttpResponseContract`. Barrel `packages/hydration/src/contracts/contracts.ts:23`. |
| `packages/hydration/src/contracts/type-diagnostic/type-diagnostic-contract.ts` | (b) move out (B) | 0 importers. Barrel `contracts.ts:91`. |
| `packages/hydration/src/contracts/hydration-run-state/hydration-run-state-contract.ts` | (a) add the parse (A) | the run state is built as a literal at `brokers/plan/run/plan-run-broker.ts:60` (`const state: HydrationRunState = {`) and again at `brokers/plan/preflight/plan-preflight-broker.ts:173`. Parse the `recipeName` half with `hydrationRunStateContract.parse`, then attach the `records` and `saved` Maps (the 4.0 KEEP-3 shape). Barrel `contracts.ts:37`. |
| `packages/hydration/src/contracts/hydration-target/hydration-target-contract.ts` | (a) add the parse (A) | caller-supplied target enters `planRunBroker` at `brokers/plan/run/plan-run-broker.ts:50` (`target: HydrationTarget`): parse `hydrationTargetContract.parse(target)` there. Conflict to report: 4.0 row 11 says this file's const "is class `type-only`" and drops it, but the const holds a real `baseUrl` field and `HydrationTarget` is `z.infer` of it, used in 10 files; a parse at `:50` keeps the type honest. Barrel `contracts.ts:39`. |

### hydration-recipes (8) — provisional

| Contract file | Decision | Detail |
|---|---|---|
| `packages/hydration-recipes/src/contracts/recipe-manifest/recipe-manifest-contract.ts` | (b) move out (B) | hydration-recipes' local copy; `index.ts:17` imports hydration's (`@dungeonmaster/hydration/contracts`) and `index.ts:21` parses that one. b11 row 278: "`DELETE` ... hydration-recipes' copy is a per-recipe object, class `dead`". 3.1 dropped it for a string fixture: `packages/eslint-plugin/src/brokers/rule/enforce-hydration-recipes-structure/rule-enforce-hydration-recipes-structure-broker.test.ts:51` (edit the test). Barrel `contracts.ts:51`. Delete before the other three (they are its nested fields). |
| `packages/hydration-recipes/src/contracts/recipe-fidelity/recipe-fidelity-contract.ts` | (b) move out (B) | only user is the dead `recipeManifestContract` (and a comment in `statics/recipe-fidelity/recipe-fidelity-statics.ts:5`). Barrel `contracts.ts:45`. |
| `packages/hydration-recipes/src/contracts/recipe-name/recipe-name-contract.ts` | (b) move out (B) | local copy; production parses hydration's (`brokers/recipes/catalog/recipes-catalog-broker.ts:52`, `contracts/recipe-catalog-entry/recipe-catalog-entry-contract.ts:15` both import `@dungeonmaster/hydration/contracts`). Barrel `contracts.ts:47`. b11 row 311 leaves the owner question to W3/W4; that concerns hydration's copy, not this dead one. |
| `packages/hydration-recipes/src/contracts/recipe-return-name/recipe-return-name-contract.ts` | (b) move out (B) | only user is the dead `recipeManifestContract`. Barrel `contracts.ts:49`. |
| `packages/hydration-recipes/src/contracts/corrupt-schema-args/corrupt-schema-args-contract.ts` | (b) move out (B) | `z.object({})` handed to the hydration engine as `args: corruptSchemaArgsContract` (`brokers/quest/ingredient/quest-ingredient-broker.ts:120`); never parsed as data. Barrel `contracts.ts:9`. Edit: the ingredient config needs an empty-args schema; the agent tries `z.ZodType<undefined>` via the hydration `NoRecipeInputSchema` shape first and reports under DECISIONS if the typing forces a keep. |
| `packages/hydration-recipes/src/contracts/guild-fields-schema/guild-fields-schema-contract.ts` | (b) move out (B) | a `z.ZodType<GuildFields, z.input<...>>` alias of `guildFieldsContract` (parsed elsewhere) handed as `fields:` to the engine (`brokers/guild/ingredient/guild-ingredient-broker.ts`). Edit the broker to pass `guildFieldsContract` directly; if the `ZodType` widening was load-bearing for `ingredient()` inference, report it. |
| `packages/hydration-recipes/src/contracts/operation-fields-schema/operation-fields-schema-contract.ts` | (b) move out (B) | same alias pattern for `operationFieldsContract` (`brokers/operation/ingredient/operation-ingredient-broker.ts`). |
| `packages/hydration-recipes/src/contracts/quest-fields-schema/quest-fields-schema-contract.ts` | (b) move out (B) | same alias pattern for `questFieldsContract` (`brokers/quest/ingredient/quest-ingredient-broker.ts:97`). |

### mcp (11) — provisional

| Contract file | Decision | Detail |
|---|---|---|
| `packages/mcp/src/contracts/buffer-state/buffer-state-contract.ts` | (b) move out (B) | 0 importers. |
| `packages/mcp/src/contracts/discover-tree-result/discover-tree-result-contract.ts` | (b) move out (B) | 0 importers (nests `treeOutputContract` and `resultCountContract`, both used elsewhere). |
| `packages/mcp/src/contracts/error-message/error-message-contract.ts` | (b) move out (B) | 0 importers; shared has the live one (b11 row 291: "mcp P (test-only)"). |
| `packages/mcp/src/contracts/header-text/header-text-contract.ts` | (b) move out (B) | 0 importers; b15 row 655 "plain", fan-out is test use. |
| `packages/mcp/src/contracts/line-index/line-index-contract.ts` | (b) move out (B) | 0 importers; b15 row 656 "plain". |
| `packages/mcp/src/contracts/mcp-config/mcp-config-contract.ts` | (a) add the parse (A) | the `.mcp.json` on disk enters at `responders/install/config-create/install-config-create-responder.ts:40`: `(await readJsonFileIfExists(configPath)) as McpConfig \| null`. Replace the cast with `mcpConfigContract.parse(...)` on the read value; the merged (`:59`) and new (`:82`) configs are then built from a parsed value. |
| `packages/mcp/src/contracts/discover-list-item/discover-list-item-contract.ts` | (a) add the parse (A) | nested through `treeItemContract` (`.extend`); clears when `treeItem` is parsed. |
| `packages/mcp/src/contracts/tree-item/tree-item-contract.ts` | (a) add the parse (A) | `items: readonly TreeItem[]` enters `transformers/tree-formatter/tree-formatter-transformer.ts:27`; the discover broker builds the items. Parse each item where the discover broker builds it; the agent names the exact line after reading `packages/mcp/src/brokers/` for the `TreeItem` producer. |
| `packages/mcp/src/contracts/tree-node/tree-node-contract.ts` | (a) add the parse (A) | `const root: TreeNode = {` at `tree-formatter-transformer.ts:33`; the type is `z.infer & { children: Map }`, so parse the `{ name, items }` half and attach `children` after. Second user `transformers/format-tree-node/format-tree-node-transformer.ts:26`. |
| `packages/mcp/src/contracts/tool-description/tool-description-contract.ts` | (c) sanctioned by 4.0 (K) | nested field of `toolRegistrationContract`; goes with it. |
| `packages/mcp/src/contracts/tool-registration/tool-registration-contract.ts` | (c) sanctioned by 4.0 (K) | b14 row 22 (4.0): "mcp/tool-registration \| `ToolHandler` \| KEEP-1, carrier \| Function type over `ToolResponse`; G04 decides the response type." Conflict to report: the const is not an empty carrier, it holds `name`, `description` and `inputSchema` (`z.record(..., z.unknown())`, a W8 site: b15 row 51 `z.json()`), and `ToolRegistration` is `z.infer & { handler }`. Four flows build registrations from literals (`flows/quest/quest-flow.ts`, `architecture/architecture-flow.ts`, `interaction/interaction-flow.ts`, `mcp-server/mcp-server-flow.ts`). Recommended: (a) `toolRegistrationContract.parse` on each registration in those four flows, which also clears `toolDescription`. Waits for W8 row 51 only if the parse is to use the new `z.json()`; the parse itself can land now. |

### orchestrator (24) — provisional

| Contract file | Decision | Detail |
|---|---|---|
| `packages/orchestrator/src/contracts/agent-spawn-streaming-result/agent-spawn-streaming-result-contract.ts` | (b) move out (B) | 0 importers. |
| `packages/orchestrator/src/contracts/captured-orchestration-emit/captured-orchestration-emit-contract.ts` | (b) move out (B) | 0 production importers (8 test importers; move them). Its `payload` `z.unknown()` is W8 row 53 in b15; deleting the contract retires that site. |
| `packages/orchestrator/src/contracts/elapsed-ms/elapsed-ms-contract.ts` | (b) move out (B) | 0 importers; b15 row 667 "plain". |
| `packages/orchestrator/src/contracts/slot-status/slot-status-contract.ts` | (b) move out (B) | 0 importers. |
| `packages/orchestrator/src/contracts/smoketest-placeholder/smoketest-placeholder-contract.ts` | (b) move out (B) | 3.1 dropped it: `statics/smoketest-blueprints/smoketest-blueprints-statics.ts:45-62` names type `SmoketestPlaceholder` and the contract path as data, and its test (`:48`) asserts the path. Edit the statics and that test off it in the same batch; b15 row 671 "plain". |
| `packages/orchestrator/src/contracts/step-name/step-name-contract.ts` | (b) move out (B) | dead copy: b11 row 309 "orchestrator F (dead)", 246 "removed by the index's own `delete.cjs`". Shared has the live one. W4 clears the name. |
| `packages/orchestrator/src/contracts/active-quest-facade/active-quest-facade-contract.ts` | (c) sanctioned by 4.0 (K) | `z.object({}).loose()` carrier plus function members (`setActive`, `clear`), not in the b14 table (which lists 45 files; this one is the same shape as rows 23 and 36). Apply 4.0's retirement: b14:249 "The empty-carrier trick (`z.object({}).loose()` plus an intersection) is retired". Drop the const, keep `ActiveQuestFacade` as a method-set type; users `quest-node-dispatch-loop-broker.ts:36`, `quest-get-next-step-broker.ts:30`, `scan-once-layer-broker.ts:32`. |
| `packages/orchestrator/src/contracts/chat-line-processor/chat-line-processor-contract.ts` | (c) sanctioned by 4.0 (K) | b14 row 23: "orchestrator/chat-line-processor \| `ChatLineProcessor` \| KEEP-1, carrier \| `{ processLine: fn }`: a method set." |
| `packages/orchestrator/src/contracts/node-dispatch-runner/node-dispatch-runner-contract.ts` | (c) sanctioned by 4.0 (K) | b14 row 25: "orchestrator/node-dispatch-runner \| `NodeDispatchWakeHandler`, `NodeDispatchRunnerDeps`, `NodeDispatchRunnerController` \| KEEP-1, carrier \| Every member is a function; `AdapterResult` returns follow B18." Coordinate with B18 (b18-returns-say-what-happened.md, 11 mentions). |
| `packages/orchestrator/src/contracts/orchestration-callbacks/orchestration-callbacks-contract.ts` | (c) sanctioned by 4.0 (K) | b14 row 27: "orchestrator/orchestration-callbacks \| `OnAgentEntryCallback` ... \| KEEP-1, carrier \| Six function types." Its const also nests `workItemIdContract`; dropping the const is what removes that use. |
| `packages/orchestrator/src/contracts/rate-limits-watch-handle/rate-limits-watch-handle-contract.ts` | (c) sanctioned by 4.0 (K) | `z.object({}).loose()` plus a `stop` function; same shape as row 23; not in the b14 table. Drop the const, keep the type. |
| `packages/orchestrator/src/contracts/orchestration-process/orchestration-process-contract.ts` | (a) add the parse (A) | registered with `state/orchestration-processes/orchestration-processes-state.ts:33` (`register: ({ orchestrationProcess }: { orchestrationProcess: OrchestrationProcess }): void`); parse the data half there (`kill` is attached through the `.loose()` pass-through). |
| `packages/orchestrator/src/contracts/process-activity/process-activity-contract.ts` | (a) add the parse (A) | `activity: new Map<ProcessId, ProcessActivity>()` at `orchestration-processes-state.ts:29`, read at `:66`, consumed by `brokers/process/stale-watch/process-stale-watch-broker.ts:31`; parse where activity is written in the same state file. |
| `packages/orchestrator/src/contracts/pending-clarification-entry/pending-clarification-entry-contract.ts` | (a) add the parse (A) | `state/pending-clarification/pending-clarification-state.ts:15-16,45`; parse the entry in the state's set function before it enters the two Maps. |
| `packages/orchestrator/src/contracts/scenario-instance/scenario-instance-contract.ts` | (a) add the parse (A) | `state/smoketest-scenario/smoketest-scenario-state.ts:25,35,71`; parse the instance in the state's set function. |
| `packages/orchestrator/src/contracts/active-quest-entry/active-quest-entry-contract.ts` | (a) add the parse (A) | built in `brokers/quest/active-quests/quest-active-quests-broker.ts:28,33` (returns `Promise<ActiveQuestEntry[]>`; `:45` is `return [] as ActiveQuestEntry[]`); parse each entry it maps. |
| `packages/orchestrator/src/contracts/active-session-result/active-session-result-contract.ts` | (a) add the parse (A) | `transformers/quest-active-session/quest-active-session-transformer.ts:25` returns `ActiveSessionResult`; parse the return. |
| `packages/orchestrator/src/contracts/next-ready-result/next-ready-result-contract.ts` | (a) add the parse (A) | `transformers/next-ready-work-items/next-ready-work-items-transformer.ts:23` returns `NextReadyResult`; parse the return. |
| `packages/orchestrator/src/contracts/linked-quest-info/linked-quest-info-contract.ts` | (a) add the parse (A) | `responders/chat/replay/chat-replay-responder.ts:36` (`const linked = await (async (): Promise<LinkedQuestInfo \| null> =>`); parse the object it returns. |
| `packages/orchestrator/src/contracts/quest-folder-find-result/quest-folder-find-result-contract.ts` | (a) add the parse (A) | `brokers/quest/folder-find/quest-folder-find-broker.ts:25` returns `Promise<QuestFolderFindResult>`; parse both union arms. |
| `packages/orchestrator/src/contracts/replacement-entry/replacement-entry-contract.ts` | (a) add the parse (A) | `brokers/quest/work-item-insert/quest-work-item-insert-broker.ts:25` takes `replacementMapping?: ReplacementEntry[]`; parse each entry where the caller of that broker builds the mapping (the agent finds the caller first). |
| `packages/orchestrator/src/contracts/followup-depth/followup-depth-contract.ts` | open / blocked (O) | only `src/index.ts:90-91` exports it (plus `index.test.ts:25`); no package imports it. 3.1 review kept the orchestrator public API; removing the export is an API change the operator has to approve. b15 row 668 "plain": W1 removes it anyway. |
| `packages/orchestrator/src/contracts/slot-manager-result/slot-manager-result-contract.ts` | open / blocked (O) | 3.1 dropped it: `src/index.ts:87-88` exports it, `index.test.ts:50` lists it, and the stub is in `testing.ts`. No consumer package imports it. Same operator call as followupDepth. |
| `packages/orchestrator/src/contracts/work-item-id/work-item-id-contract.ts` | open / blocked (O) | exported at `src/index.ts:93-94`, nested in the two contracts above; b15 row 331 maps it to `workItemContract.id` (W3 owned ids). Blocked on W3 and on the two API decisions above. |

### shared (20)

| Contract file | Decision | Detail |
|---|---|---|
| `packages/shared/src/contracts/claude-queue-response/claude-queue-response-contract.ts` | open / blocked (O) | test-support contract: users are `packages/web/test/harnesses/claude-mock/claude-mock.harness.ts:26` and `packages/orchestrator/test/harnesses/orchestration-jsonl/orchestration-jsonl.harness.ts:19`, which the index excludes. The fake Claude CLI that reads the queue file (`locationsStatics.siegelense.claudeQueueDir`, `packages/web/playwright.config.ts:22`) is the real boundary; the agent locates the reader. If it lives under `test/`, R1 cannot count it and the operator decides between moving the contract into `@dungeonmaster/testing` and a new sanctioned exception. Barrel `contracts.ts:275`. |
| `packages/shared/src/contracts/ward-queue-response/ward-queue-response-contract.ts` | open / blocked (O) | same as `claudeQueueResponse` (`packages/web/test/harnesses/ward-mock/ward-mock.harness.ts:24`); b15 row 871 puts its `wardResultJson` `z.unknown()` at W8. Barrel `contracts.ts:284`. |
| `packages/shared/src/contracts/ward-run-id/ward-run-id-contract.ts` | open / blocked (O) | nested in `wardQueueResponse` (`runId`) and typed at `brokers/locations/ward-local-run-path-find/locations-ward-local-run-path-find-broker.ts:25`; b15 row 419 "owner-field". Decided with the pair above and W3/W4. Barrel `contracts.ts:287`. |
| `packages/shared/src/contracts/result-stream-line/result-stream-line-contract.ts` | open / blocked (O) | no production reader; test users only (e.g. `packages/web/src/flows/quest-chat/chat-stop-pauses-quest.e2e.ts:102` calls `ResultStreamLineStub`). `streamJsonLineContract` is `z.string().brand<'StreamJsonLine'>()`, so no union parses these shapes. Repo rule: tests build JSONL shapes from shared stubs, so a move-out leaves those tests without a stub. Operator decision: keep as test support (needs a sanctioned exception) or add the parse in the orchestrator's line processor where `type === 'result'` enters. Barrel `contracts.ts:236,244`. |
| `packages/shared/src/contracts/summary-stream-line/summary-stream-line-contract.ts` | open / blocked (O) | same as `resultStreamLine`. Barrel `contracts.ts:238`. |
| `packages/shared/src/contracts/system-init-stream-line/system-init-stream-line-contract.ts` | open / blocked (O) | same as `resultStreamLine`. Barrel `contracts.ts:234`. |
| `packages/shared/src/contracts/contract-uses-binding/contract-uses-binding-contract.ts` | (a) add the parse (A) | R1's own index: `transformers/contract-index-from-sources/contract-uses-scan-layer-transformer.ts:26` (`bindings: ContractUsesBinding[]`); parse each binding where the scan builds it. No barrel line. |
| `packages/shared/src/contracts/file-write-call/file-write-call-contract.ts` | (a) add the parse (A) | `transformers/file-write-calls-extract/file-write-calls-extract-transformer.ts:55` (`const results: FileWriteCall[] = []`); parse each pushed object. Barrel `contracts.ts:497`. |
| `packages/shared/src/contracts/tail-file-call/tail-file-call-contract.ts` | (a) add the parse (A) | `transformers/tail-file-calls-extract/tail-file-calls-extract-transformer.ts:47`; same. Barrel `contracts.ts:529`. |
| `packages/shared/src/contracts/web-fetch-call-site/web-fetch-call-site-contract.ts` | (a) add the parse (A) | `transformers/web-fetch-calls-extract/web-fetch-calls-extract-transformer.ts:39`; same. Barrel `contracts.ts:535`. |
| `packages/shared/src/contracts/server-route-call-site/server-route-call-site-contract.ts` | (a) add the parse (A) | `transformers/server-route-calls-extract/server-route-calls-extract-transformer.ts:59`; same. Barrel `contracts.ts:532`. |
| `packages/shared/src/contracts/folder-dependency-tree/folder-dependency-tree-contract.ts` | (a) add the parse (A) | `transformers/folder-dependency-tree/folder-dependency-tree-transformer.ts:24` returns `FolderDependencyTree`; parse the return. Barrel `contracts.ts:51`. (b11 line 58 says mcp's copy is gone.) |
| `packages/shared/src/contracts/method-domain-group/method-domain-group-contract.ts` | (a) add the parse (A) | `transformers/namespace-methods-group-by-domain/namespace-methods-group-by-domain-transformer.ts:27` returns `MethodDomainGroup[]`; parse each group. |
| `packages/shared/src/contracts/widget-context/widget-context-contract.ts` | (a) add the parse (A) | `brokers/architecture/boot-tree/architecture-boot-tree-broker.ts:56` (`const widgetContext: WidgetContext \| undefined =`); parse when built. Barrel `contracts.ts:526`. |
| `packages/shared/src/contracts/widget-edges/widget-edges-contract.ts` | (a) add the parse (A) | `brokers/architecture/widget-tree/extract-widget-edges-layer-broker.ts:36` returns `WidgetEdges`; parse the return. Barrel `contracts.ts:500`. |
| `packages/shared/src/contracts/install-context/install-context-contract.ts` | (a) add the parse (A) | `packages/cli/src/transformers/create-default-install-context/create-default-install-context-transformer.ts:14` returns `InstallContext` as an object literal; parse it. This batch touches shared and cli. Barrel `contracts.ts:104`. |
| `packages/shared/src/contracts/rate-limits-history-line/rate-limits-history-line-contract.ts` | (a) add the parse (A) | `packages/cli/src/brokers/rate-limits/history-append/rate-limits-history-append-broker.ts:23` takes `line: RateLimitsHistoryLine` and appends it as a JSONL row; parse it there before it is written (the value is built by the caller). Touches shared and cli. Barrel `contracts.ts:549`. |
| `packages/shared/src/contracts/quest-section/quest-section-contract.ts` | (a) add the parse (A) | `packages/orchestrator/src/transformers/quest-stage-to-sections/quest-stage-to-sections-transformer.ts:14`: `[...questStageMappingStatics.stages[stage]] as QuestSection[]`; parse each with `questSectionContract` instead of the cast. `quest-section-filter-transformer.ts:32` only reads `.options`, which is not a parse. Also exported by `packages/orchestrator/src/index.ts:35-36`. Touches shared and orchestrator. Barrel `contracts.ts:555`. |
| `packages/shared/src/contracts/quest-status-metadata/quest-status-metadata-contract.ts` | (b) move out (B) | 3.1 dropped it for a path fixture: `packages/local-eslint/src/guards/is-status-comparison-allowlisted/is-status-comparison-allowlisted-guard.test.ts:78` ("safe to reinstate" in `reviewed-dropped.md`). Edit that test. Barrel `contracts.ts:427`. |
| `packages/shared/src/contracts/work-item-status-metadata/work-item-status-metadata-contract.ts` | (b) move out (B) | same fixture at `is-status-comparison-allowlisted-guard.test.ts:79`. Barrel `contracts.ts:430`. |

### siegelense (4) — provisional

| Contract file | Decision | Detail |
|---|---|---|
| `packages/siegelense/src/contracts/browser-session/browser-session-contract.ts` | (c) sanctioned by 4.0 (K) | b14 row 36: "siegelense/browser-session \| `BrowserSession` \| KEEP-1, carrier \| Every member is a function; the `z.object({}).loose()` const is dropped." Also `BufferLengths` becomes `bufferLengthsContract` (row 36 CONV), whose parse sits in the method that returns it. |
| `packages/siegelense/src/contracts/lane-session/lane-session-contract.ts` | (c) sanctioned by 4.0 (K) | same `z.object({}).loose()` carrier (`contracts/lane-session/lane-session-contract.ts`), not in the b14 table; retire per b14:249. 24 importers of the type stay untouched. |
| `packages/siegelense/src/contracts/seed-bindings/seed-bindings-contract.ts` | (a) add the parse (A) | `transformers/step-interpolate/step-interpolate-transformer.ts:40` takes `bindings: SeedBindings`; the seed step (`brokers/step/seed/step-seed-broker.ts`) produces the record; parse it there. |
| `packages/siegelense/src/contracts/compare-query/compare-query-contract.ts` | (a) add the parse (A) | `compareReadBroker` reads it "off disk" per `compare-args-contract.ts:4`; the query reaches `responders/siegelense/compare/siegelense-compare-responder.ts:27` from `flows/siegelense/siegelense-compare-layer-flow.ts`, handed a `CompareArgs` with `isJson` stripped. Parse `compareQueryContract.parse({ instanceId, runA, runB })` in the flow where it drops `isJson`. Barrel `contracts.ts:103`. |

### testing (18)

| Contract file | Decision | Detail |
|---|---|---|
| `packages/testing/src/contracts/base-name/base-name-contract.ts` | (b) through W1 | b15 row 701: "BaseName ... plain \| 0 \| 7 \| 410 \| 412"; type users `brokers/install-testbed/create/install-testbed-create-broker.ts:51` and `brokers/integration-environment/create/integration-environment-create-broker.ts:60`. W1 turns them into `string` and removes contract, stub, test. |
| `packages/testing/src/contracts/command-name/command-name-contract.ts` | (b) through W1 | b15 row 702, same; users `integration-environment-create-broker.ts:127,192` and `contracts/test-guild/test-guild-contract.ts:28,36`. |
| `packages/testing/src/contracts/pending-request/pending-request-contract.ts` | (a) add the parse (A) | `brokers/network-record/capture/network-record-capture-broker.ts:36` (`new Map<MswRequestId, PendingRequest>()`); parse the record where it is set on request start. |
| `packages/testing/src/contracts/proxy-mock-queue-entry/proxy-mock-queue-entry-contract.ts` | (a) add the parse (A) | `middleware/proxy-mock-collector/proxy-mock-collector-middleware.ts:44` (`const filesToProcess: ProxyMockQueueEntry[] = [{ filePath: proxyFilePath, requestedNames }]`); parse each entry pushed to the queue. |
| `packages/testing/src/contracts/staged-call/staged-call-contract.ts` | (a) add the parse (A) | `middleware/mock-register/mock-register-middleware.ts:85` and `middleware/spy-on-register/spy-on-register-middleware.ts:101` build `const record: StagedCall = { args, impl: () => undefined, once: false, consumed: false }`; parse the data half, `impl` rides the `.loose()` pass-through. b15 row 92 keeps `args` as the one recorded `z.unknown()` exception. |
| `packages/testing/src/contracts/isolate-modules-mock/isolate-modules-mock-contract.ts` | (a) add the parse (A) | `middleware/modules-isolate/modules-isolate-middleware.ts:22` takes `mocks: IsolateModulesMock[]` from `register-mock.ts`; parse `module` there, `factory` rides `.loose()`. |
| `packages/testing/src/contracts/mock-process-behavior/mock-process-behavior-contract.ts` | (a) add the parse (A) | `middleware/child-process-mock/child-process-mock-middleware.ts:35,40` takes `behavior: MockProcessBehavior`; parse at entry. Clears `mockSpawnResult` (nested `result`). b06 has 3 mentions (the `throwError` `z.instanceof(Error)` field); keep that field as is. |
| `packages/testing/src/contracts/mock-spawn-result/mock-spawn-result-contract.ts` | (a) add the parse (A) | nested in `mockProcessBehaviorContract`; clears with it. |
| `packages/testing/src/contracts/endpoint-control/endpoint-control-contract.ts` | (c) sanctioned by 4.0 (K) | b14 row 37: "testing/endpoint-control \| `EndpointResponseContract`, `EndpointControl` \| KEEP-1, carrier \| `{ parse: fn }` and a method set. The const is dropped." Also `HttpMethod` becomes `endpointHttpMethodContract` (row 37 CONV). |
| `packages/testing/src/contracts/endpoint-mock-lifecycle/endpoint-mock-lifecycle-contract.ts` | (c) sanctioned by 4.0 (K) | same `z.object({}).loose()` carrier plus functions, not in the b14 table; retire per b14:249. User `responders/endpoint-mock/setup/endpoint-mock-setup-responder.ts:30`. |
| `packages/testing/src/contracts/mock-handle/mock-handle-contract.ts` | (c) sanctioned by 4.0 (K) | same carrier shape (`contracts/mock-handle/mock-handle-contract.ts`), not in the b14 table; retire per b14:249. Exported at `src/index.ts:44`; users are the two mock middlewares. |
| `packages/testing/src/contracts/mock-staging/mock-staging-contract.ts` | (c) sanctioned by 4.0 (K) | same carrier shape; retire per b14:249. Five prod users (`mock-register-middleware.ts:83,92` and others). |
| `packages/testing/src/contracts/recorded-calls/recorded-calls-contract.ts` | (c) sanctioned by 4.0 (K) | b14 row 39: "testing/recorded-calls \| `RecordedCalls` \| KEEP-1, carrier \| An array-like facade: `length` plus functions." |
| `packages/testing/src/contracts/timer-handle/timer-handle-contract.ts` | (c) sanctioned by 4.0 (K) | b14 row 41: "testing/timer-handle \| `TimerHandle` \| KEEP-1, carrier \| `{ hasRef?: fn }`." Edit `guards/is-timer-holding-loop/...:13` and `brokers/timers/watch/timers-watch-broker.ts:28,63,64` only if the type moves. |
| `packages/testing/src/contracts/typescript-node-factory/typescript-node-factory-contract.ts` | open / blocked (O) | b15 row 94: gateway schema `#GatewayTypescriptNodeFactory (typescriptNodeFactorySchema)`, `create`. Waits for B06 and the new `@gateway/npm` typescript subpaths. |
| `packages/testing/src/contracts/typescript-program/typescript-program-contract.ts` | open / blocked (O) | b15 row 95: `#GatewayTypescriptProgram (typescriptProgramSchema)`; `typescript/program/` subpath already exists. Waits for B06. |
| `packages/testing/src/contracts/typescript-statement/typescript-statement-contract.ts` | open / blocked (O) | b15 row 96: `#GatewayTypescriptStatement`. Waits for B06. |
| `packages/testing/src/contracts/typescript-source-file/typescript-source-file-contract.ts` | open / blocked (O) | library copy (`.loose().brand<'TypescriptSourceFile'>()` with `as unknown as TypescriptSourceFile` casts at `middleware/typescript-source-file-get/...:31,37` and `transformers/source-file-prepend-statements/...:38`); a14 has 7 mentions, b05 has 13. Wave 3.5 / B05 owns it. |

### tooling (4)

| Contract file | Decision | Detail |
|---|---|---|
| `packages/tooling/src/contracts/command-result/command-result-contract.ts` | (b) move out (B) | 0 importers. |
| `packages/tooling/src/contracts/exec-error/exec-error-contract.ts` | (b) move out (B) | 0 importers (b06 lists it as a `bufferSchema` gateway-schema field; deleting it retires that row). |
| `packages/tooling/src/contracts/exit-code/exit-code-contract.ts` | (b) move out (B) | only nested in the two dead contracts above; b15 rows 494, 567 name `exitCode`/`status` fields of exactly those. Delete last in the batch. |
| `packages/tooling/src/contracts/gateway-implementation/gateway-implementation-contract.ts` | (a) add the parse (A) | `brokers/adapter-census/build/adapter-census-build-gateway-layer-broker.ts:34,35` returns and fills `GatewayImplementation[]`; parse each implementation pushed. Users `transformers/gateway-match-find/gateway-match-find-transformer.ts:23`, `adapter-census-build-records-layer-broker.ts:42`. |

### web (19)

| Contract file | Decision | Detail |
|---|---|---|
| `packages/web/src/contracts/css-dimension/css-dimension-contract.ts` | (b) through W1 | b15 row 734 class `plain`; every production use is `x as CssDimension` on a literal, so there is no boundary to parse at. W1 turns the type into `string`/`number` and removes contract, stub, test. |
| `packages/web/src/contracts/css-spacing/css-spacing-contract.ts` | (b) through W1 | b15 row 735 class `plain`; every production use is `x as CssSpacing` on a literal, so there is no boundary to parse at. W1 turns the type into `string`/`number` and removes contract, stub, test. |
| `packages/web/src/contracts/display-file-path/display-file-path-contract.ts` | (b) through W1 | b15 row 737 class `plain`; every production use is `x as DisplayFilePath` on a literal, so there is no boundary to parse at. W1 turns the type into `string`/`number` and removes contract, stub, test. |
| `packages/web/src/contracts/form-input-value/form-input-value-contract.ts` | (b) through W1 | b15 row 740 class `plain`; every production use is `x as FormInputValue` on a literal, so there is no boundary to parse at. W1 turns the type into `string`/`number` and removes contract, stub, test. |
| `packages/web/src/contracts/form-placeholder/form-placeholder-contract.ts` | (b) through W1 | b15 row 741 class `plain`; every production use is `x as FormPlaceholder` on a literal, so there is no boundary to parse at. W1 turns the type into `string`/`number` and removes contract, stub, test. |
| `packages/web/src/contracts/pixel-dimension/pixel-dimension-contract.ts` | (b) through W1 | b15 row 747 class `plain`; every production use is `x as PixelDimension` on a literal, so there is no boundary to parse at. W1 turns the type into `string`/`number` and removes contract, stub, test. |
| `packages/web/src/contracts/row-order/row-order-contract.ts` | (b) through W1 | b15 row 750 class `plain`; every production use is `x as RowOrder` on a literal, so there is no boundary to parse at. W1 turns the type into `string`/`number` and removes contract, stub, test. |
| `packages/web/src/contracts/section-count/section-count-contract.ts` | (b) through W1 | b15 row 754 class `plain`; every production use is `x as SectionCount` on a literal, so there is no boundary to parse at. W1 turns the type into `string`/`number` and removes contract, stub, test. |
| `packages/web/src/contracts/section-label/section-label-contract.ts` | (b) through W1 | b15 row 755 class `plain`; every production use is `x as SectionLabel` on a literal, so there is no boundary to parse at. W1 turns the type into `string`/`number` and removes contract, stub, test. |
| `packages/web/src/contracts/tag-item/tag-item-contract.ts` | (b) through W1 | b15 row 759 class `plain`; every production use is `x as TagItem` on a literal, so there is no boundary to parse at. W1 turns the type into `string`/`number` and removes contract, stub, test. |
| `packages/web/src/contracts/theme-scheme-description/theme-scheme-description-contract.ts` | (b) through W1 | b15 row 763 class `plain`; every production use is `x as ThemeSchemeDescription` on a literal, so there is no boundary to parse at. W1 turns the type into `string`/`number` and removes contract, stub, test. |
| `packages/web/src/contracts/theme-scheme-name/theme-scheme-name-contract.ts` | (b) through W1 | b15 row 764 class `plain`; every production use is `x as ThemeSchemeName` on a literal, so there is no boundary to parse at. W1 turns the type into `string`/`number` and removes contract, stub, test. |
| `packages/web/src/contracts/execution-step-status/execution-step-status-contract.ts` | (a) add the parse (A) | shared's `WorkItem['status']` enters the view through casts: `widgets/execution-panel/execution-panel-widget.tsx:225` (`wi.status as ExecutionStepStatus`) and `execution-work-item-row-layer-widget.tsx:155`. Replace those two casts with `executionStepStatusContract.parse(...)`; the `as` casts in `execution-row-layer-widget.tsx:103` are literals and become the enum members. |
| `packages/web/src/contracts/gate-section-key/gate-section-key-contract.ts` | (a) add the parse (A) | `widgets/quest-spec-panel/quest-spec-panel-widget.tsx:53` (`const CONTRACTS_SECTION = 'contracts' as GateSectionKey`): `gateSectionKeyContract.parse('contracts')`. `guards/is-gate-section-visible/is-gate-section-visible-guard.ts:19,25` reads the statics. |
| `packages/web/src/contracts/theme-color-token/theme-color-token-contract.ts` | (b) move out (B) | 0 importers. |
| `packages/web/src/contracts/plan-section-test-item/plan-section-test-item-contract.ts` | (b) move out (B) | 0 importers. |
| `packages/web/src/contracts/chat-entry-group/chat-entry-group-contract.ts` | (a) add the parse (A) | `transformers/collect-subagent-chains/collect-subagent-chains-transformer.ts:131,157,185,216` build the groups (`{ kind: 'single' as const, entry: e } satisfies SingleGroup`, `kind: 'subagent-chain' as const`); parse the groups it returns. Seven other transformers/widgets only consume the type. |
| `packages/web/src/contracts/chat-stream-ended-payload/chat-stream-ended-payload-contract.ts` | (a) add the parse (A) | `state/web-socket-channel/web-socket-channel-state.ts:163` and `:170` build `{ ...payload.data, reason: 'turn-ended' \| 'history-replayed' }` and push it into `chatStreamEndedSubject.next(...)`; wrap both in `chatStreamEndedPayloadContract.parse`. |
| `packages/web/src/contracts/upload-progress-post/upload-progress-post-contract.ts` | (a) add the parse (A) | b14 row 44: "web/upload-progress-post \| `UploadProgressHandler` \| KEEP-1, carrier \| Function type." keeps the handler type, but the const holds `url` and `body` and `UploadProgressPost` is `z.infer` of it, imported by `brokers/quest/new/quest-new-broker.ts` (b15 row 893: `:46` builds an object literal), `quest-chat-broker.ts`, `quest-followup-broker.ts`, `bindings/use-quest-chat/use-quest-chat-binding.ts`. Parse the request object in the post helper those brokers share; `body: z.unknown()` becomes `z.json()` under W8 row 106. Report the row-44 conflict. |

### Agent batches

Each batch is 2 to 4 contract files, plus their stubs and tests, plus the barrel line and the named production edits. Batches in different packages touch disjoint files and run side by side (four is the sensible cap). Batches in one package share a barrel file and run one after another. Every batch: `npm run ward -- --only lint,typecheck,unit -- <touched files>`, then a re-scan of the package, `npm run ward -- scan @dungeonmaster/require-contract-parse -- packages/<pkg>`, whose count must fall by exactly the batch's contracts. A move-out batch proves with `discover` that nothing imports the file, tests and harnesses included, before `mv`; it never deletes. Parse batches assert real values in the added tests (the parsed object's fields), not that a parse was called.

| Batch | Packages | Contracts (file = `packages/<pkg>/src/contracts/<x>/<x>-contract.ts`) | Decision | Proxies composed | Waits for |
|---|---|---|---|---|---|
| R1-config | config | fileContents, filePath | B | none: pure `mv` of contract, stub and test, one barrel edit (`packages/config/src/contracts/contracts.ts:18,20`). No proxy composes them. | nothing |
| R1-hooks | hooks | hasStringProperty, sessionStartHookData, subagentStartHookData | B | none: no production or proxy importer. | nothing |
| R1-eslint-a | eslint-plugin | allowedImport, eslintRuleName, collectedExport | A/B | eslint-plugin own proxies for `rule-enforce-stub-patterns-broker`, `is-entry-file-guard` (test edits) and `collect-exports-layer-broker`. | provisional package: run after the eslint-plugin agent lands, then re-scan |
| R1-hydration-a | hydration | httpResponse, typeDiagnostic | B | none. | nothing |
| R1-hydration-b | hydration | hydrationRunState, hydrationTarget | A | hydration own proxies for `plan-run-broker` and `plan-preflight-broker`; `@dungeonmaster/testing` registerMock only. | provisional package; same barrel file as R1-hydration-a, so run after it |
| R1-hyd-recipes-a | hydration-recipes | recipeManifest, recipeFidelity, recipeName, recipeReturnName | B | hydration-recipes own proxies; edit `packages/eslint-plugin/.../rule-enforce-hydration-recipes-structure-broker.test.ts:51` (touches eslint-plugin, so it runs after R1-eslint-a or names that one test file as a cross-package edit). | provisional package |
| R1-hyd-recipes-b | hydration-recipes | corruptSchemaArgs, guildFieldsSchema, operationFieldsSchema, questFieldsSchema | B | hydration-recipes own `*-ingredient-broker` proxies; imports the hydration engine's `ingredient()`. Same barrel as the batch above: sequential. | provisional package |
| R1-mcp-a | mcp | bufferState, discoverTreeResult, errorMessage, headerText | B | none. | provisional package |
| R1-mcp-b | mcp | lineIndex, mcpConfig | A/B | mcp `install-config-create-responder.proxy.ts`, which composes the `#gateway/node` fs proxy for `readJsonFileIfExists`. | provisional package |
| R1-mcp-c | mcp | discoverListItem, treeItem, treeNode | A | mcp `tree-formatter-transformer` has no proxy; the discover broker's proxy composes `#gateway/node` fs. | provisional package |
| R1-mcp-d | mcp | toolDescription, toolRegistration | K | mcp flows have no proxies; `mcp-server-flow` integration test. | provisional package; parse can land now, the `z.json()` on `inputSchema` is W8 row 51 |
| R1-orch-a | orchestrator | agentSpawnStreamingResult, capturedOrchestrationEmit, elapsedMs, slotStatus | B | none: only tests import them (8 test importers for `capturedOrchestrationEmit`). | provisional package |
| R1-orch-b | orchestrator | smoketestPlaceholder, stepName | B | orchestrator statics test `smoketest-blueprints-statics.test.ts` (edit). | provisional package |
| R1-orch-c | orchestrator | activeQuestFacade, chatLineProcessor, nodeDispatchRunner, orchestrationCallbacks | K | orchestrator own proxies for the seven `ChatLineProcessor` users; type-only edits. | provisional package; `nodeDispatchRunner` coordinates with B18 (11 mentions) |
| R1-orch-d | orchestrator | rateLimitsWatchHandle, orchestrationProcess, processActivity | A/K | orchestrator `orchestration-processes-state.proxy.ts`. | provisional package |
| R1-orch-e | orchestrator | pendingClarificationEntry, scenarioInstance | A | orchestrator state proxies. | provisional package |
| R1-orch-f | orchestrator | activeQuestEntry, activeSessionResult, nextReadyResult | A | orchestrator `quest-active-quests-broker.proxy.ts` composes `@dungeonmaster/shared` guild/quest brokers and `#gateway/node` fs; the two transformers have no proxy. | provisional package |
| R1-orch-g | orchestrator | linkedQuestInfo, questFolderFindResult, replacementEntry | A | orchestrator `chat-replay-responder.proxy.ts`, `quest-folder-find-broker.proxy.ts`, `quest-work-item-insert-broker.proxy.ts`. | provisional package |
| R1-shared-a | shared, local-eslint | questStatusMetadata, workItemStatusMetadata | B | edits `packages/local-eslint/.../is-status-comparison-allowlisted-guard.test.ts:78-79` (touches local-eslint). | nothing |
| R1-shared-b | shared | fileWriteCall, tailFileCall, webFetchCallSite, serverRouteCallSite | A | none: transformers. | nothing |
| R1-shared-c | shared | folderDependencyTree, methodDomainGroup, contractUsesBinding | A | none: transformers. | nothing |
| R1-shared-d | shared | widgetContext, widgetEdges | A | shared architecture broker proxies composing `#gateway/node` fs. | nothing |
| R1-shared-e | shared, cli, orchestrator | installContext, rateLimitsHistoryLine, questSection | A | cli `create-default-install-context` (no proxy), cli `rate-limits-history-append-broker.proxy.ts` (composes `#gateway/node` fs), orchestrator `quest-stage-to-sections` (no proxy). Run alone: three packages. | orchestrator part is provisional |
| R1-siege | siegelense | browserSession, laneSession, seedBindings, compareQuery | A/K | siegelense `step-seed-broker`, `siegelense-compare-layer-flow` proxies; type-only edits elsewhere (24 importers). | provisional package |
| R1-testing-a | testing | pendingRequest, proxyMockQueueEntry, stagedCall, isolateModulesMock | A | testing own proxies; the two mock middlewares are what every other package's proxies call, so run the full `@dungeonmaster/testing` unit suite. | nothing |
| R1-testing-b | testing | mockProcessBehavior, mockSpawnResult, endpointControl, endpointMockLifecycle | A/K | testing `child-process-mock-middleware`, `endpoint-mock-setup-responder` proxies. | nothing |
| R1-testing-c | testing | mockHandle, mockStaging, recordedCalls, timerHandle | K | testing register-mock middleware proxies. | nothing |
| R1-tooling | tooling | commandResult, execError, exitCode, gatewayImplementation | A/B | tooling `adapter-census-build-gateway-layer-broker.proxy.ts` composes the gateway proxies for its reads. | nothing |
| R1-web-a | web | themeColorToken, planSectionTestItem | B | none. | nothing |
| R1-web-b | web | chatEntryGroup, chatStreamEndedPayload | A | web `collect-subagent-chains` (no proxy) and `web-socket-channel-state.proxy.ts`. | nothing |
| R1-web-c | web | executionStepStatus, gateSectionKey | A | web `execution-panel-widget.proxy.tsx`, `quest-spec-panel-widget.proxy.tsx`. | nothing |
| R1-web-d | web | uploadProgressPost | A | web `quest-new-broker`, `quest-chat-broker`, `quest-followup-broker` proxies (compose the fetch gateway). | coordinate with W8 row 106 |

Runnable now: 32 batches covering 93 contracts.

### Blocked or open

| Batch | Packages | Contracts | Blocked on |
|---|---|---|---|
| R1-eslint-b | eslint-plugin | astNode, ruleViolation | L2/C2 library-copy replacement and B06 (`#GatewayTsestreeNode`); package mid-edit. |
| R1-orch-h | orchestrator | followupDepth, slotManagerResult, workItemId | operator decision on the orchestrator public API (3.1 dropped two of them; `src/index.ts:87-94`, `index.test.ts:25,50`); `workItemId` also waits for W3 (b15 row 331). |
| R1-shared-f | shared | claudeQueueResponse, wardQueueResponse, wardRunId | operator decision: the only readers are test harnesses the index excludes; W3/W4 for `wardRunId`, W8 for `wardResultJson`. |
| R1-shared-g | shared | resultStreamLine, summaryStreamLine, systemInitStreamLine | operator decision: keep as test support (needs a sanctioned exception) or parse in the orchestrator line processor. |
| R1-testing-d | testing | typescriptNodeFactory, typescriptProgram, typescriptStatement, typescriptSourceFile | B06 gateway schemas (b15 rows 94-96) and B05 / wave 3.5 library copies. |
| R1-testing-w1 | testing | baseName, commandName | W1 (b15 rows 701-702); the W1 codemod owns the type rewrite. |
| R1-web-w1 | web | cssDimension, cssSpacing, displayFilePath, formInputValue, formPlaceholder, pixelDimension, rowOrder, sectionCount, sectionLabel, tagItem, themeSchemeDescription, themeSchemeName | W1 (b15 rows 734-764); 12 contracts, so the codemod, not hand batches. |

Blocked or open: 7 batches covering 29 contracts: 14 are W1-class brands the W1 codemod removes, 6 wait on B06, B05 or L2, and 9 need an operator decision.

### Order and switch-on

1. Wave one, in parallel by package: R1-config, R1-hooks, R1-hydration-a, R1-tooling, R1-shared-a to R1-shared-d, R1-testing-a to R1-testing-c, R1-web-a to R1-web-d. These packages are not being edited by other agents.
2. Wave two, after the operator confirms the orchestrator, hydration, hydration-recipes, mcp, siegelense and eslint-plugin agents have landed: their batches, re-scanned first, because their counts are provisional. R1-shared-e waits for the orchestrator half.
3. The blocked batches follow W1 (14 brands), B06 and L2 (6), and the operator\'s three decisions (9). Until they clear, the scan cannot read 0.
4. Switch on: when every package scan reads 0, change `require-contract-parse` from `off` to `error` in the eslint-plugin rule config and enforce-on statics, then `npm run ward -- --only lint -- <a file per package>` as the probe. EPIC step 6b: "each after its scan reads 0".

### Operator decisions for the R1 queue (2026-09-29 afternoon)

| Contracts | Decision |
|---|---|
| orchestrator `followupDepth`, `slotManagerResult` | Move out (rule 20) if nothing outside `packages/orchestrator/src/index.ts` and `index.test.ts` imports them; drop their `index.ts` export lines. A contract nobody parses guarantees nothing at runtime. If a real importer exists, parse at that importer's boundary instead. |
| orchestrator `workItemId` | Waits for W3 (it becomes the work item's own `id`). |
| shared `claudeQueueResponse`, `wardQueueResponse`, `wardRunId` | Parse in the test harness where the fake queue's response is read; that harness is their boundary. |
| shared `resultStreamLine`, `summaryStreamLine`, `systemInitStreamLine` | Parse where the stream reader parses a real Claude CLI line, when they describe real output; if they only shape test fixtures, the batch agent reports it and they move out, with their stubs kept only if another contract's stub uses them. |
| b14 rows 11, 22, 44 (`hydrationTarget`, `toolRegistration`, `uploadProgressPost`) | Add a parse at the boundary; they hold real fields, so they are not carriers. |
| the six unlisted empty carriers (`activeQuestFacade`, `rateLimitsWatchHandle`, `laneSession`, `endpointMockLifecycle`, `mockHandle`, `mockStaging`) | Retired per b14:249, as the plan says. |

## Plan — types-only contract files (R1-K)

Planning pass, 2026-09-29. No code changed, no ward command run. Sources: b14:243-250 (the retirement of the empty carrier) and the K rows above. Every claim below was read from the file named; nothing was run, so the two lint refusals the siegelense agent measured are explained from source, not reproduced.

### What the rules do today with a `-contract.ts` that exports only types

| Rule (eslint-plugin unless noted) | Today, on a contract file with no const | Change |
|---|---|---|
| `enforce-project-structure` (`collect-exports-layer-broker.ts`, `validate-export-layer-broker.ts`) | `collect-exports` skips every `export type`/`export interface` (`isTypeOnly` is computed and the entry is never pushed), so `validateExportLayerBroker` sees zero value exports and reports `missingExpectedExport` ("File must export exactly one value named ..."). Its own test pins this: `validate-export-layer-broker.test.ts:640` "INVALID: type-only export in contracts (no value export) => reports missingExpectedExport". | TO-1a, TO-1b |
| `enforce-implementation-colocation` | A `-contract.ts` always needs `{name}-contract.test.ts` (unit `testType`) and `{name}.stub.ts` (`missingTestFile`, `missingStubFile`, broker lines 211-257). | TO-2 |
| `require-contract-parse` (ward only, `off`) | The index still emits an entry for the file (`contract-index-from-sources-transformer.ts:144-163`: `exportedContractNames: []`, `isParsed: false`), so the rule reports `contractNeverParsed` with an empty name list. It also has no second check yet: the broker only reports `contractNeverParsed`, though b02:134 specifies a type check. | TO-3 |
| `enforce-stub-patterns` | Fires only on a `.stub.ts` file. It refuses a stub that does not call `contract.parse()` (`useContractParse`). So a stub written beside a types-only contract fails, which is the second refusal the siegelense agent measured. | none if no stub file exists; TO-4 only if a non-parsing stub stays (see D1) |
| `enforce-contract-usage-in-tests` | A non-contract test may not import from a `-contract` file, types included ("Test files must not import from contracts (including types)"). With no stub, a test cannot name the type. | none: tests pass an object literal, which types structurally |
| `enforce-contract-declarations` | No rule of that name exists. `requireContractDeclarations` is a `folderConfigStatics` field, `false` for `contracts`, read by no rule. | none |
| `enforce-unique-contract-names`, `require-object-contract-brands`, `enforce-owner-field-reuse`, `enforce-gateway-schema-fields`, `ban-join-id-beside-child` | Each walks `z.object(...)` nodes or the owner index; a file with no schema gives them nothing to grade. | none; TO-3's agent confirms with one probe file |
| shared classifier `type-node-shape-classify-layer-transformer.ts` | Exempts a function type, a type literal or interface whose members are all methods or function-typed properties, an intersection of those, and inferred plus functions. Everything else is `other`: a hand-written data member, a union of literals, a property typed by a call-signature literal. | TO-5 |
| `mcp` `architecture-folder-detail-broker.ts:128-132`, `orchestrator` `blight-checklist-build-transformer.ts:52-60` | Folder detail prints `- Stub:` and `- Test:` for every contract (`requireStub: true`). The blight builder pairs a stub with `-contract.ts` and does not need one to exist. | teaching row T6 only |

### Findings that argue against b14:243-250 or against the K rows

1. **`LaneSession` is not a method set.** It has data members (`specName`, `ports`, `homePath`, `evidencePath`, `baseUrl`, `apiBaseUrl`, `pgids`, `logFds`) beside `browser: BrowserSession | null` and two functions. Drop the const and the type is a hand-written object of data members, which b14:229 calls "a contract". The K row for `laneSession` is wrong. Decision D2 below.
2. **`BrowserSessionStub` has 29 users and `LaneSessionStub` 24** (counted by name across `packages/`: browserSession 6 tests, 22 proxies and the lane stub; laneSession 14 tests, 8 proxies, 2 JSDoc examples). b14 says "delete the const, its stub and its test". Deleting the browserSession stub means 28 files each build a 32-member fake; that duplicates `browser-session.stub.ts:33-130` 28 times. Decision D1 below.
3. **Four K types fail the exempt shapes as written.** `BufferLengths` (`browser-session-contract.ts:45`) and `HttpMethod` (`endpoint-control-contract.ts:16`) are data types in a file that will be types-only; b14 row 36 and 37 already say CONV, so each becomes its own contract with a parse. `MockHandle.callsMatching` (`mock-handle-contract.ts:28-31`) is a property typed by a call-signature literal, and `RecordedCalls` (`recorded-calls-contract.ts:17`) is `Readonly<Pick<unknown[][], 'length'>> & {...}`; the classifier calls both `other`. TO-5 extends the classifier (D3).
4. **`timerHandle` is dead, not K.** After the testing wave's edits nothing under `packages/` names `TimerHandle` except its own contract, stub and test (`timers-watch-broker.ts:118` only mentions it in a comment). Move it out per rule 20 once that wave lands; re-verify with `discover` first.
5. **`rateLimitsWatchHandle` has no type importer either.** `rate-limits-bootstrap-state.ts:10,13,15` spells the shape inline (`{ stop: () => void }`), an ad-hoc type. Only `rate-limits-bootstrap-state.test.ts:1,16,27` uses the stub. The batch makes the state import the type (K), so the type gets its user.
6. **`orchestrationCallbacks`'s const is a five-field schema, not an empty carrier**, and nothing parses it. It goes the same way (`OnAgentEntryCallback` and five siblings stay as function types); the operator table already lists it as a carrier retirement.
7. **A seventh empty carrier the operator table does not list:** `packages/orchestrator/src/contracts/orchestration-events-state-facade/orchestration-events-state-facade-contract.ts:15` (`z.object({}).loose()`, `on`/`off` functions). It is nested into `orchestrationEventsStateModuleContract` (`orchestration-events-state-module-contract.ts:17`) and parsed there, so the scan reads 0 for it and it is not in any batch. b14:249 retires the trick everywhere. LEFT OPEN for the operator: retire it (the module contract's field then needs a different schema) or leave it, since it does one real check (the value is an object).
8. **Public API:** `packages/testing/src/index.ts:24,25,44` exports `HttpMethod`, `EndpointControl` and `MockHandle`. They stay valid `export type` re-exports of a types-only file; `HttpMethod` moves to the new `endpointHttpMethodContract` (b14 row 37) and the re-export line changes.

### Decisions the operator makes before the dependent batch starts

| # | Question | Recommended | Blocks |
|---|---|---|---|
| D1 | `BrowserSessionStub` (29 users): delete, or keep as a non-parsing test double? | Keep it. Add TO-4: `enforce-stub-patterns` skips `useContractParse` for a stub that imports nothing as a value from its sibling `-contract` file (AST only, stays pre-edit). The other K contracts have 0 to 2 test users each and lose their stubs; those tests pass literals. | K-siege-1, TO-4 |
| D2 | `LaneSession`: how does a type with data members satisfy b14? | Make it a real data-plus-functions contract (exception 3): `laneSessionContract = z.object({ specName, ports, homePath, evidencePath, baseUrl, apiBaseUrl, pgids, logFds, browser: z.custom<BrowserSession \| null>(...) })`, `LaneSession = z.infer<typeof laneSessionContract> & { readServerLogSince; serverLogLength }`, parsed in `lane-boot-broker.ts:62` where the lane is built, stub kept. `browser` stays in the data half because 65 reads across 25 siegelense files use `.browser`; the `z.custom` predicate checks object-or-null and passes the reference through, so the functions survive. This turns the row from K into A. The alternative is a classifier that resolves an imported exempt type across files (index two-pass, about six files); not recommended. | K-siege-2 |
| D3 | Widen the exempt list for `MockHandle.callsMatching` and `RecordedCalls`? | Yes, narrowly: a property typed by a type literal of call signatures only counts as a function; a method set may also hold `readonly length: number` (b14 row 39 already calls `RecordedCalls` "`length` plus functions"). `RecordedCalls` is rewritten as an interface so the classifier sees `length` directly. | K-test-2 |

### Part 1 — rule and index batches

One agent at a time inside `packages/eslint-plugin` (they share the rule config and barrel). TO-5 is in `packages/shared` and the docs batch is in `packages/mcp`, so those run side by side with the eslint-plugin chain: three agents at once.

| Batch | Package | Files (2 to 5) | What changes |
|---|---|---|---|
| TO-1a | eslint-plugin | `src/brokers/rule/enforce-project-structure/collect-exports-layer-broker.ts`, `collect-exports-layer-broker.test.ts`, `rule-enforce-project-structure-broker.test.ts` | `collect-exports` pushes an entry (`isTypeOnly: true`, name from the declaration's `id`) for `export type X = ...` and `export interface X`; `export type { X }` and `export type { X } from` stay skipped. `collect-exports-layer-broker.test.ts:72` "VALID: type-only export => skips and returns empty" is rewritten to expect the entry. The rule test gains: a `contracts/` file with only `export type`/`export interface` is valid; the same file under `guards/`, `statics/`, `brokers/` is still `missingExpectedExport`; an empty `-contract.ts` is still `missingExpectedExport`. |
| TO-1b | eslint-plugin | `validate-export-layer-broker.ts`, `validate-export-layer-broker.test.ts` | In the `valueExports.length === 0` branch (line 50): return without a report when `firstFolder === 'contracts'`, the file is a `-contract.ts` (not `.stub.ts`, not a proxy) and at least one type entry was collected. `validate-export-layer-broker.test.ts:640` flips to VALID; lines 667 (statics) and 694 (broker) stay INVALID; new INVALID: a `.stub.ts` in `contracts/` with only types. Pre-edit stays true: no file read. |
| TO-2 | eslint-plugin | new `src/guards/is-types-only-program/is-types-only-program-guard.ts` and `.test.ts`, `src/brokers/rule/enforce-implementation-colocation/rule-enforce-implementation-colocation-broker.ts`, `rule-enforce-implementation-colocation-broker.test.ts` | The guard, modelled on `is-reexport-only-program-guard.ts`, is true when the Program has at least one `export type`/`export interface` declaration and no value export, default export or `export *`. In the broker, `isContract && isTypesOnlyProgramGuard({ node })` skips the unit-test requirement (lines 205-230) and the stub requirement (234-257). Tests: valid types-only contract with no test and no stub; invalid contract with a const and no stub; invalid types-only file under `guards/` (not a contract, still needs its test). Stays post-edit; no change to `dungeonmaster-rule-enforce-on-statics`. |
| TO-3 | eslint-plugin | `src/brokers/rule/require-contract-parse/rule-require-contract-parse-broker.ts`, `rule-require-contract-parse-broker.test.ts` | Skip `contractNeverParsed` when `entry.exportedContractNames` is empty. Add the b02:134 check as message id `typeNotSchemaInferred` ("`{{typeName}}` in `{{file}}` is not z.infer of a schema in this file. A contract's exported types must come from its own parse."), reported for each `typeExports` element with `isSchemaInferred === false && isExempt === false`, on files with or without a const. Tests stage a types-only file with a function type (valid), with a plain data type (invalid), and a const file whose type is not inferred (invalid). The rule stays `off`; the agent reports `npm run ward -- scan @dungeonmaster/require-contract-parse` per package for the new message id, because those counts join the R1 queue. |
| TO-4 (only if D1 = keep) | eslint-plugin | `src/brokers/rule/enforce-stub-patterns/rule-enforce-stub-patterns-broker.ts`, `rule-enforce-stub-patterns-broker.test.ts` | Track `ImportDeclaration`s; when the stub has a `-contract` import and every one is `import type`, do not report `useContractParse`. Tests: types-only stub valid; a stub that calls `xContract.parse` unchanged; a stub with only a type import and no parse and a data-shaped type is not caught here (TO-3's type check catches the data type). |
| TO-5 | shared | `src/transformers/contract-index-from-sources/type-node-shape-classify-layer-transformer.ts` and `.test.ts`, `contract-file-exports-read-layer-transformer.test.ts`, `contract-index-from-sources-transformer.test.ts` | D3's two widenings. New tests: a types-only file yields `exportedConstNames: []` with every type `isExempt: true` (a copy of `mock-handle-contract.ts:17-32` and of the rewritten `RecordedCalls` as fixtures), and the index entry for it has `exportedContractNames: []`, `isParsed: false`. |

Order inside eslint-plugin: TO-1a, TO-1b, TO-2, TO-3, then TO-4 if wanted. TO-3's tests do not need TO-5 (a plain function type is already exempt). Rebuild is not needed for any of these; eslint loads the plugin from source. Ward for each: `--only lint,typecheck,unit`.

### Part 2 — teaching text rows

One agent, `packages/mcp`, runs alongside Part 1. Every row states the rule as it stands, in the present tense.

| Row | File and lines | Change |
|---|---|---|
| T1 | `packages/mcp/src/statics/folder-constraints/contracts-constraints.md:1-13` (FOLDER STRUCTURE) | Add the types-only tree: `contracts/active-quest-facade/active-quest-facade-contract.ts` alone, no test, no stub. |
| T2 | same file `:42-48` (CRITICAL - TEST IMPORTS) | A test never imports a contract; for a types-only contract with no stub, the test passes an object literal and TypeScript types it structurally. |
| T3 | same file `:85-124` (pattern 3, Mixed Data + Function Stubs) | Split: data plus functions keeps the const and the stub (exception 3). A type whose every member is a function, a function type, or a generic method set has no schema: the file exports only types, with no const, stub or test. The comment "Contract defines ONLY data properties" stays true for the first case. |
| T4 | same file `:131-136` (All stubs MUST) | State that "Data properties MUST be validated through `contract.parse()`" applies to a contract with data; a stub for a types-only contract (only when a test double has many users) imports the contract as a type and does not parse. Delete this line if D1 = delete. |
| T5 | `packages/mcp/src/statics/folder-constraints/adapters-constraints.md:169-189` (COMPLEX TYPES) | Same example as T3; add the sentence that a function-only type needs no contract const. |
| T6 | `packages/mcp/src/brokers/architecture/folder-detail/architecture-folder-detail-broker.ts:128-132` and its test | When the folder type is `contracts`, add a line under Required Files: "A file whose every export is a function type or method set exports only types and needs no test or stub." Its test asserts the exact line. |
| T7 | b02 `## Teaching text this item changes` (`:139-146`) | Currently "None directly." Replace with a pointer to T1 to T6, and hand the one-sentence rule to Z03: "A `-contract.ts` whose every export is a type Zod cannot check (a function type, a method set, a generic) exports no const and has no stub or test." |
| T8 | file headers written by the K batches themselves | `browser-session-contract.ts:1-20` and `lane-session-contract.ts:1-24` explain the empty-object trick and cite `eslintContextContract` as "the sanctioned pattern"; each batch rewrites its own header. |

### Part 3 — the K files, per package

Each batch moves the contract's `-contract.test.ts` and `.stub.ts` out with `mv` to `tmp/deletions/b02/<repo path>` (agent-brief rule 8) unless noted, edits every stub user named, then runs `npm run ward -- --only lint,typecheck,unit -- <touched files>` and the package re-scan; the count falls by the batch's contracts. Tests assert real values (a jest.fn called with the payload), and a test that used a deleted stub passes an object literal typed by inference. Batches wait for TO-1a, TO-1b and TO-2 (lint refuses the files before that). Packages are independent, so orchestrator, testing and siegelense chains run side by side (three agents); inside a package the batches run in the order listed. These three packages are provisional or mid-edit (git status shows `packages/testing` dirty, and a quiet-tree wave is running there): start each chain only after its owner's wave has landed.

**orchestrator**

| Batch | Contract | Importers (type) | Stub or test users to rewrite | Edit |
|---|---|---|---|---|
| K-orch-1 | `activeQuestFacade` | `brokers/quest/get-next-step/quest-get-next-step-broker.ts:15`, `.../scan-once-layer-broker.ts:12`, `brokers/quest/node-dispatch-loop/quest-node-dispatch-loop-broker.ts:30` | `quest-get-next-step-broker.test.ts:10`, `scan-once-layer-broker.test.ts:14` (`ActiveQuestFacadeStub`) | Drop the const and the stub; both tests pass `{ setActive: jest.fn(), clear: jest.fn() }`. |
| K-orch-1 | `chatLineProcessor` | `brokers/agent/launch/start-main-tail-layer-broker.ts:20`, `brokers/chat/main-session-tail/chat-main-session-tail-broker.ts:36`, `brokers/chat/stream-process-handle/chat-stream-process-handle-broker.ts:33`, `brokers/chat/subagent-tail/chat-subagent-tail-broker.ts:40`, `brokers/quest/monitor-jsonl-watcher/scan-subagents-dir-layer-broker.ts:35`, `.../start-subagent-tail-layer-broker.ts:32`, `transformers/chat-line-process/chat-line-process-transformer.ts:33` | `chat-main-session-tail-broker.test.ts:8`, `chat-subagent-tail-broker.test.ts:8` (`ChatLineProcessorStub`) | Drop the const (line 37) and stub; the header block stays. Interface has method-typed properties, so it is exempt today. |
| K-orch-2 | `nodeDispatchRunner` | `brokers/quest/node-dispatch-runner/quest-node-dispatch-runner-broker.ts:19`, `responders/orchestration-dispatch/bootstrap/orchestration-dispatch-bootstrap-responder.ts:22` | none | Drop the const (line 30) and the `z` import. Coordinate with B18 (its `AdapterResult` returns). |
| K-orch-2 | `orchestrationCallbacks` | `brokers/quest/orchestration-loop/quest-orchestration-loop-broker.ts:22`, `.../run-chat-layer-broker.ts:22` | none | Drop the const (lines 30-54) and every value import it needed; the six function types stay. |
| K-orch-2 | `rateLimitsWatchHandle` | none today | `state/rate-limits-bootstrap/rate-limits-bootstrap-state.test.ts:1,16,27` | `rate-limits-bootstrap-state.ts:10,13,15` import `RateLimitsWatchHandle` in place of the inline `{ stop: () => void }`; the test passes `{ stop }` literals. |

**testing** (the full `@dungeonmaster/testing` unit suite runs after each batch; these files sit under every other package's proxies)

| Batch | Contract | Importers (type) | Stub or test users to rewrite | Edit |
|---|---|---|---|---|
| K-test-1 | `endpointControl` | `src/index.ts:24,25`, `src/responders/endpoint-mock/listen/endpoint-mock-listen-responder.ts:17`, `.../endpoint-mock-listen-responder.proxy.ts:4` | none (0 stub users) | Drop the const. `HttpMethod` becomes `endpointHttpMethodContract` in a new `contracts/endpoint-http-method/` (contract, stub, test) and is parsed where the listen responder receives the method (`endpoint-mock-listen-responder.ts:26`); update `src/index.ts:24` and the two `HttpMethod` users in `contracts/pending-request/pending-request-contract.ts:12` and `contracts/network-log-entry/network-log-entry-contract.ts:12` only if they import this one. `EndpointResponseContract` and `EndpointControl` stay. |
| K-test-1 | `endpointMockLifecycle` | `src/responders/endpoint-mock/setup/endpoint-mock-setup-responder.ts:18` | none | Drop the const. |
| K-test-1 (move-out, not K) | `timerHandle` | none after the testing wave | own test and stub only | `mv` contract, stub, test to `tmp/deletions/b02/`; re-run `discover` for `TimerHandle` first. |
| K-test-2 | `mockHandle` | `src/index.ts:44`, `src/middleware/mock-register/mock-register-middleware.ts:16`, `src/middleware/spy-on-register/spy-on-register-middleware.ts:18`, `src/register-mock.ts:10` | none (`mock-handle.stub.ts` is its own) | Drop the const. `callsMatching` needs TO-5's call-signature widening. |
| K-test-2 | `mockStaging` | `src/contracts/mock-handle/mock-handle-contract.ts:10`, `src/middleware/mock-register/mock-register-middleware.ts:17`, `src/middleware/mock-staging-create/mock-staging-create-middleware.ts:15`, `src/middleware/spy-on-register/spy-on-register-middleware.ts:19`, `src/register-mock.ts:11`, `src/transformers/mock-staging-create/mock-staging-create-transformer.ts:10` | `mock-handle.stub.ts:3` (goes with mockHandle's stub) | Drop the const and stub. |
| K-test-2 | `recordedCalls` | `src/contracts/mock-handle/mock-handle-contract.ts:11`, `src/register-mock.ts:12` | none | Rewrite `RecordedCalls` as an interface (`readonly length: number`, `map`, `filter`, `[Symbol.iterator]`) so D3's widening classifies it; drop the const, whose header comment explains a stub-only reason. |

**siegelense**

| Batch | Contract | Importers | Stub or test users to rewrite | Edit |
|---|---|---|---|---|
| K-siege-1 | `browserSession` | `src/brokers/browser-session/launch/browser-session-launch-broker.ts:55`, `src/brokers/run/execute/run-execute-step-layer-broker.ts:56`, and `src/brokers/step/{before,box,click,dispatch/run-verb-layer,dispatch/step-dispatch,dom,eval-source,goto,health,hold,key,look,paste,reset,resize,screenshot,storage,target-resolve,type,until,video,wait-for}/*-broker.ts` (the broker and its `.proxy.ts`), `src/contracts/lane-session/lane-session-contract.ts:30` | tests `lane-teardown-broker.test.ts:6`, `step-health-broker.test.ts:4`, `step-hold-broker.test.ts:3`, `reset-clear-storage-layer-broker.test.ts:1`, `step-reset-broker.test.ts:5`; 22 proxies (`BrowserSessionStub`) | Per D1: keep `browser-session.stub.ts` as a non-parsing double (its `browserSessionContract.parse({})` at `:73` and the `z` import go), or move the 32 defaults into the proxies. Drop the const (`:43`). `BufferLengths` (`:45`) becomes `bufferLengthsContract` in `contracts/buffer-lengths/`, parsed in the `bufferLengths` method of `browser-session-launch-broker.ts` (`:652`); repoint its type users `step-dispatch-broker.ts:65`, `run-verb-layer-broker.ts:28`, `step-health-broker.ts:22`, `step-until-broker.ts:30`, `step-until-broker.proxy.ts:13`, `run-execute-step-layer-broker.ts:56` and the stub `:7`. |
| K-siege-2 | `laneSession` (A, per D2) | `src/brokers/driver/handle-request/driver-handle-request-broker.ts:31`, `.../heartbeat-tick/driver-heartbeat-tick-broker.ts:31`, `src/brokers/lane/boot/lane-boot-broker.ts:62`, `.../lane/teardown/lane-teardown-broker.ts:46`, `src/brokers/run/execute/run-execute-broker.ts:69`, `.../run-execute-step-layer-broker.ts:57`, `src/brokers/step/{dispatch/run-verb-layer,dispatch/step-dispatch,file,health,hold,request,reset,seed,snapshot,until}/*-broker.ts`, `src/responders/siegelense/driver/{driver-serve-layer,siegelense-driver}-responder.ts:73,54`, `src/state/driver-session/driver-session-state.ts:41` | 14 tests and 8 proxies (`LaneSessionStub`) | The stub stays and its `laneSessionContract.parse({})` becomes a real parse of the data half. The 24 type users need no edit. |

### Batch count and what runs together

Rule and doc batches: TO-1a, TO-1b, TO-2, TO-3, TO-5, the T1 to T6 docs batch, plus TO-4 if D1 = keep: 6 or 7. K batches: K-orch-1, K-orch-2, K-test-1, K-test-2, K-siege-1, K-siege-2: 6. Total 12 or 13.

1. Wave A, three agents side by side: the eslint-plugin chain (TO-1a, then TO-1b, TO-2, TO-3), TO-5 in shared, the docs batch in mcp.
2. Wave B, after TO-1a to TO-2: the orchestrator chain (K-orch-1, K-orch-2), the testing chain (K-test-1, then K-test-2 after TO-5), the siegelense chain (K-siege-1 after D1 and TO-4 if kept, then K-siege-2 after D2). Three agents side by side.
3. Switch-on: the K contracts stop counting in the scan; they leave the total when their batch lands, on the same rule as the other classes above.

### Operator decisions for R1-K (2026-09-29 afternoon)

| # | Decision |
|---|---|
| D1 | Yes: `BrowserSessionStub` stays as a non-parsing test double; TO-4 (`enforce-stub-patterns` accepts a stub of a types-only contract that returns a typed literal) is in scope. |
| D2 | Yes: `LaneSession` becomes a data-plus-functions contract parsed in `lane-boot-broker.ts` (`browser` as `z.custom` in the data half); the row moves from K to parse-at-boundary. |
| D3 | Yes: the exempt list widens narrowly for a call-signature property (`callsMatching`) and a `Pick<unknown[][], 'length'>` member (`RecordedCalls`); nothing broader. |
| D4 | `orchestrationEventsStateFacade` is retired with the other carriers (add it to K-orch-1 or K-orch-2). |
| D5 | `timerHandle` is dead after L4 wave 3: moved out (by L4 T5 if it has not already). |

## Plan — typeNotSchemaInferred queue (R1-T)

Planning pass, 2026-09-29. No code changed. Every hit below is a `typeNotSchemaInferred` line from `npm run ward -- scan @dungeonmaster/require-contract-parse -- packages/<pkg>`, one package at a time, run in this worktree after `shared`'s `dist` was rebuilt at 14:32 (the classifier's `CallSignature` widening from 3cb1197bb is in `dist`, so the counts are current). The rule reads `@dungeonmaster/shared/brokers` through ESLint, which sets no `source` condition, so **every classifier change below needs a `shared` rebuild before the scan moves**.

### Measured

| Package | typeNotSchemaInferred hits | Types |
|---|---|---|
| hydration | 8 | `HydrationRunState`, `AnyZodSchema`, `AnyZodObjectSchema`, `AnyIngredient`, `Registry` (all four in `ingredient-config`), `OpFilterNestedOp`, `AnyRecipeInputSchema`, `NoRecipeInputSchema` |
| hooks | 3 | `SettingsHookListEntry`, `PreEditLintConfig`, `RuleConfig` |
| testing | 3 | `HttpMethod`, `InstallTestbed`, `TestGuild` |
| cli | 2 | `DependencyKey`, `DependencyVersion` |
| hydration-recipes | 2 | `DmResponseBody`, `RecipeCatalogEntry` |
| mcp | 2 | `ToolRegistration`, `TreeNode` |
| server | 2 | `IsoTimestamp`, `ProcessId` |
| eslint-plugin | 1 | `RuleViolation` |
| shared | 1 | `WorkItemForUpsert` |
| orchestrator, siegelense | 0 | (orchestrator still reads 3 `contractNeverParsed`; siegelense reads 0 in all) |
| web, tooling, config, ward, local-eslint, session-forensics | 0 | measured too, because no other agent had; web still reads 12 `contractNeverParsed` (the W1 brands) |

Total 24. All 24 are in files whose other exports are fine; the scan reports each once per type, on the first token of the file.

### Decision per hit

Codes: **(a)** a sanctioned exception the rule must exempt; **(b)** convert to `z.infer` of a named schema in the file; **(c)** a types-only method set or data-plus-functions the classifier misses.

| Type (file under `packages/<pkg>/src/contracts/`) | Class | Decision | Cite |
|---|---|---|---|
| hooks `SettingsHookListEntry` (`claude-settings/`) | (b) | `settingsHookListEntryContract = z.union([preToolUseHookContract, postToolUseHookContract, sessionStartHookContract, subagentStartHookContract, subagentStopHookContract, worktreeCreateHookContract])`, non-exported like its siblings; the type becomes `z.infer` of it. | b14 row 5 (CONV) |
| hooks `RuleConfig` (`rule-config/`) | (b) | The `message?: Message \| ((hookData: unknown) => Message)` half is a hand-written data-plus-callable member (`Message \| fn` is not a function type, so the classifier says `other`). Put it in the schema: `message: z.union([messageContract, z.custom<(hookData: unknown) => Message>((value) => typeof value === 'function')]).optional()`, the same `z.custom` + `typeof` pattern as `ingredientDefaultsFnContract` (`ingredient-config-contract.ts:47`). `RuleConfig` becomes `z.infer<typeof ruleConfigContract>`. | not in b14 table; 4.0 row 6 says "the clean fix is in `rule-config-contract.ts`" |
| hooks `PreEditLintConfig` (`pre-edit-lint-config/`) | (b) | With `message` inside `ruleConfigContract`, the `Omit<...> & { rules: ... }` substitution has no reason left: `PreEditLintConfig = z.infer<typeof preEditLintConfigContract>`. Same batch as `RuleConfig`. | b14 row 6 (called KEEP-3, but its data half is a hand-written array, not functions) |
| cli `DependencyKey`, `DependencyVersion` (`dependency-map/`) | (b) | `z.infer<typeof dependencyMapContract.keyType>` has a property access in its `typeof`; the classifier accepts only a bare identifier (`type-node-shape-classify-layer-transformer.ts:78`). Extract `dependencyKeyContract = z.string().brand<'DependencyKey'>()` and `dependencyVersionContract`, use them in the `z.record`, and infer from each. No rule change. | 4.0 did not list it |
| hydration `HydrationRunState` (`hydration-run-state/`) | (b) | `records: Map<RowRef, unknown>` and `saved: Map<SavedRecordName, unknown>` are data. Move both into `hydrationRunStateContract` as `z.map(rowRefContract, z.unknown())` and `z.map(savedRecordNameContract, z.unknown())`; the type becomes `z.infer`. Same file as R1-hydration-b (which adds the parse), so it rides that batch. | b14 row 11 names `hydrationTarget`, not this file |
| hydration `AnyZodSchema`, `AnyZodObjectSchema` (`ingredient-config/`) | (b) | Delete both aliases; each use site writes the library type through `#gateway/npm/zod` (`z.ZodType`, `z.ZodObject<z.ZodRawShape>`). Users: `op-attach-apply-layer-broker.ts`, `op-create-apply-layer-broker.ts`, `op-update-apply-layer-broker.ts`, `plan-preflight-broker.ts`. | b14 row 12 (CONV, C2) |
| hydration `AnyRecipeInputSchema`, `NoRecipeInputSchema` (`recipe-def/`) | (b) | Same: delete, write `z.ZodTypeAny` and `z.ZodType<undefined>` at the users `hydration-create-broker.ts`, `recipe-declare-broker.ts`, `hydration-target-contract.ts` and inside `RecipeInputOf` in the same file. | b14 row 17 (CONV) |
| hydration `OpFilterNestedOp` (`op-filter/`) | (b) | Delete; users `op-filter-apply-layer-broker.ts` and `op-filter-transformer.ts` write `OpFilter['ops'][number]`. | b14 row 16 (CONV, B5) |
| hydration `AnyIngredient` and `Registry` (`ingredient-config/`) | (a) | 4.0 keeps both (row 12 KEEP-2: "Phantom keys and conditional types. `Registry = Record<string, AnyIngredient>` is a plain alias over a keep-2 type"). The classifier exempts a compile-time type only when the declaration has type parameters (`contract-file-exports-read-layer-transformer.ts:63`); these two have none. Rule change **RC-2**. | b14:222-224 exception 2 |
| hydration-recipes `DmResponseBody` (`dm-response-body/`) | (b) | Hand-written recursive JSON type with a `z.ZodType<DmResponseBody>` annotation on the const. Replace with `export const dmResponseBodyContract = z.json();` and `DmResponseBody = z.infer<typeof dmResponseBodyContract>`; the JSON value set is the same. The R1 table's `uploadProgressPost` row already plans `z.json()` for its `body` (W8 row 106). | not in b14 table |
| hydration-recipes `RecipeCatalogEntry` (`recipe-catalog-entry/`) | (b) then (c) | `inputs?: z.ZodType \| undefined` is data (a schema value), so 4.0's KEEP-3 (row 21) misses it. Move `inputs` into `recipeCatalogEntryContract` as `zodSchemaContract.optional()` (the `z.custom` instanceof check `recipe-def-contract.ts:20` already uses). The remaining intersection member holds `probeListing` and `execute`, both functions; its left half `RecipeCatalogEntryData` is an alias, so it needs **RC-1**. | b14 row 21 |
| mcp `ToolRegistration` (`tool-registration/`) | (c) | `z.infer<typeof toolRegistrationContract> & { handler: ToolHandler }` where `ToolHandler` is a same-file function type. The classifier sees a property typed by an identifier and says `data`. Rule change **RC-1** (resolve a same-file alias). | b14 row 22 (KEEP-1) |
| mcp `TreeNode` (`tree-node/`) | (b) | `children: Map<FolderName, TreeNode>` is data. Add `get children(): ...` returning `z.map(folderNameContract, treeNodeContract)` to `treeNodeContract`, the self-reference form `op-filter-contract.ts:59-74` documents (the getter's return type wraps `z.core.$ZodType<...>`). The type becomes `z.infer`. Rides R1-mcp-c, which already parses `treeNode`. | not in b14 table |
| server `IsoTimestamp`, `ProcessId` (`iso-timestamp/`, `process-id/`) | (b) | Re-export aliases. Repoint the two users (`server-init-responder.ts` to `@dungeonmaster/orchestrator`'s `isoTimestampContract`, `process-id-params-contract.ts` to `@dungeonmaster/shared/contracts`'s `processIdContract`), then move the two contract files with their stubs and tests out (rule 8). | b14 rows 32, 33 (DROP) |
| eslint-plugin `RuleViolation` (`rule-violation/`) | (b) | `fix?` and `suggest?` are a callable and an array of `{ desc; fix }` records, so the intersection's literal half is data. Move both into the schema: `fix: z.custom<(...args: unknown[]) => unknown>((value) => typeof value === 'function').optional()` and `suggest: z.array(z.object({ desc: suggestionDescriptionContract, fix: <same custom> })).readonly().optional()`; drop the type-only `SuggestionDescription` helper's comment. **Rides R1-eslint-b** (`ruleViolation`, blocked on B06), so this hit joins that blocked row. | not in b14 table |
| shared `WorkItemForUpsert` (`work-item-for-upsert/`) | (b) | `z.infer<typeof workItemForUpsertContract>` in place of `ReturnType<typeof workItemForUpsertContract.parse>`. One line. | b14 row 35 (CONV) |
| testing `HttpMethod` (`endpoint-control/`) | (b) | `endpointHttpMethodContract = z.enum([...])`; already planned as K-test-1 (b02 R1-K Part 3). No new batch: K-test-1 clears it. | b14 row 37 (CONV) |
| testing `InstallTestbed`, `TestGuild` (`install-testbed/`, `test-guild/`) | (c) | `InstallTestbedData & { ...functions }` and `TestGuildData & { ...functions }`: each left half is a same-file alias of `z.infer` and each literal half is only functions. Rule change **RC-1**. | b14 rows 38, 40 (KEEP-3) |

Classes: 5 exempt through the rule (RC-1: `ToolRegistration`, `InstallTestbed`, `TestGuild`; RC-2: `AnyIngredient`, `Registry`), 19 converted. `RecipeCatalogEntry` is counted with the converts and also needs RC-1.

### The rule changes, in one batch

One agent, `packages/shared` only, five files: `src/transformers/contract-index-from-sources/type-node-shape-classify-layer-transformer.ts` and `.test.ts`, `contract-file-exports-read-layer-transformer.ts` and `.test.ts`, `contract-index-from-sources-transformer.test.ts`. The rule broker and the eslint-plugin config do not change.

| Change | Shape it exempts | How |
|---|---|---|
| **RC-1** same-file alias resolution | A reference to a type alias or interface declared at the top level of the same file resolves to that declaration's right-hand side, at the top of the type, as an intersection member and as a property type. `InstallTestbedData` resolves to `inferred`; `handler: ToolHandler` resolves to a function property; `RecipeCatalogEntryData` resolves to `inferred`. A visited-name set stops a cycle. | The reader passes the file's alias map to the classifier (a new `typeAliases` parameter beside `schemaNames`). Nothing crosses files. |
| **RC-2** phantom carrier | An interface whose every member is a computed property keyed by a `unique symbol` const declared in the same file (`readonly [ING]: unknown`). `Record<string, X>` and `Readonly<X>` of such a type carry it (`Registry`). New shape `'phantom'`, counted as exempt beside `functions`. | Reads the `declare const ING: unique symbol` declaration from the file's statements, as `schemaNames` is read. |

The concession if the operator declines RC-2: a per-file rule override in the eslint config for `packages/hydration/src/contracts/ingredient-config/ingredient-config-contract.ts` only, with a comment naming b14 exception 2. It is weaker: the override also stops grading that file's other types.

Tests: the classifier test gains the five shapes above as fixtures (valid), and keeps a `Record<string, SomeDataInterface>` and an alias of a data literal as `other` (invalid), so the widening is proved narrow. Ward for the batch: `npm run ward -- --only lint,typecheck,unit -- <the five files>`. **BUILD NEEDED: `@dungeonmaster/shared`**, run by the coordinator, before any re-scan.

### Convert batches

Each: 2 to 4 contract or user files plus their stubs and tests, `npm run ward -- --only lint,typecheck,unit -- <touched files>`, then the package re-scan whose `typeNotSchemaInferred` count falls by exactly the batch's types. Batches in different packages run side by side (cap four); batches in one package run in order.

| Batch | Package | Files | Types cleared | Waits for |
|---|---|---|---|---|
| T-hooks | hooks | `claude-settings-contract.ts`, `rule-config-contract.ts`, `pre-edit-lint-config-contract.ts` (+ their tests and stubs) | `SettingsHookListEntry`, `RuleConfig`, `PreEditLintConfig` | nothing |
| T-cli | cli | `dependency-map-contract.ts` (+ stub, test) | `DependencyKey`, `DependencyVersion` | nothing |
| T-shared | shared | `work-item-for-upsert-contract.ts` | `WorkItemForUpsert` | nothing |
| T-server | server | `iso-timestamp-contract.ts`, `process-id-contract.ts` (moved out), `server-init-responder.ts`, `process-id-params-contract.ts` | `IsoTimestamp`, `ProcessId` | nothing |
| T-hyd-a | hydration | `ingredient-config-contract.ts`, `op-attach-apply-layer-broker.ts`, `op-create-apply-layer-broker.ts`, `op-update-apply-layer-broker.ts` | `AnyZodSchema` | R1-hydration-a/b done (same barrel) |
| T-hyd-b | hydration | `ingredient-config-contract.ts`, `plan-preflight-broker.ts` | `AnyZodObjectSchema` | T-hyd-a |
| T-hyd-c | hydration | `recipe-def-contract.ts`, `hydration-create-broker.ts`, `recipe-declare-broker.ts`, `hydration-target-contract.ts` | `AnyRecipeInputSchema`, `NoRecipeInputSchema` | T-hyd-b, and R1-hydration-b (edits `hydration-target-contract.ts`) |
| T-hyd-d | hydration | `op-filter-contract.ts`, `op-filter-apply-layer-broker.ts`, `op-filter-transformer.ts` | `OpFilterNestedOp` | T-hyd-c |
| R1-hydration-b (amended) | hydration | adds `hydration-run-state-contract.ts`'s two maps | `HydrationRunState` | as before |
| T-hyr | hydration-recipes | `dm-response-body-contract.ts` (its only type user is `dm-response-body.stub.ts`), `recipe-catalog-entry-contract.ts`, and `recipes-catalog-broker.ts` (the one production file that names `RecipeCatalogEntry` and reads `.inputs`) | `DmResponseBody`, `RecipeCatalogEntry` | RC-1 rebuilt |
| R1-mcp-c (amended) | mcp | adds `tree-node-contract.ts`'s `children` getter | `TreeNode` | as before |
| R1-eslint-b (amended) | eslint-plugin | adds `rule-violation-contract.ts`'s `fix` and `suggest` | `RuleViolation` | as before (blocked) |
| K-test-1 (unchanged) | testing | `endpoint-control-contract.ts` | `HttpMethod` | as before |

The two ingredient-config batches and T-hyd-c/d share the hydration barrel and `ingredient-config-contract.ts`, so they run one after another: one agent chain. T-hyd-a's four files are one over the "2 to 4 users" comfort line only because three are one-line type swaps; if the agent finds more than four users, split by user rather than by type.

Risk to check in T-hyr: `recipeCatalogEntryContract.parse` now returns `inputs` as `unknown` (a `z.custom` with no type argument, as `recipe-def-contract.ts:17-19` explains, avoids `StubArgument`'s expansion of a `ZodType`'s methods). Any reader that calls `.parse` on `entry.inputs` needs its own narrowing; the agent runs the recipe catalog and hydration-recipes unit suites and reports the readers it edits.

### Can R1's rule switch on after this queue?

`typeNotSchemaInferred` reads 0 everywhere once RC-1, RC-2, the eight convert batches and the three amended rows land. The rule as a whole switches on only when the second message reads 0 too. What the scans read now for `contractNeverParsed`:

| Package | Still unparsed | Row that clears it |
|---|---|---|
| eslint-plugin | `astNode`, `eslintRuleName`, `ruleViolation` | R1-eslint-b (blocked: L2/C2 and B06); `eslintRuleName` is R1-eslint-a and has not landed |
| orchestrator | `followupDepth`, `slotManagerResult`, `workItemId` | R1-orch-h; the first two move out under the operator decision, `workItemId` waits for W3 |
| shared | `adapterResult`, `claudeQueueResponse`, `wardQueueResponse`, `wardRunId`, `resultStreamLine`, `systemInitStreamLine` | R1-shared-f and R1-shared-g (operator decisions recorded above); `adapterResult` is in no batch: B18 deletes `AdapterResult`, so it needs an owner or a note under B18 |
| testing | `baseName`, `commandName` (W1); `endpointControl`, `endpointMockLifecycle`, `mockHandle`, `mockStaging`, `recordedCalls` (K-test-1/2); `isolateModulesMock`, `mockProcessBehavior`, `mockSpawnResult`, `pendingRequest`, `proxyMockQueueEntry`, `stagedCall` (R1-testing-a/b) | the testing batches |
| web | 12 contracts | R1-web-w1 (the W1 codemod) |
| cli, hooks, hydration, hydration-recipes, mcp, server, siegelense, tooling, config, ward, local-eslint, session-forensics | 0 | done |

So the switch-on waits on: R1-T (this queue), R1-eslint-a and -b, R1-orch-h, the W1 and W3 blocked rows (testing `baseName`/`commandName`, web's 12, `workItemId`), the shared-f/g decisions with an owner for `adapterResult`, and the testing batches. The change itself stays as written under "Order and switch-on": rule config `off` to `error`, then `npm run ward -- --only lint -- <a file per package>` as the probe.

### Operator decisions for R1-T (2026-09-29 afternoon)

| # | Decision |
|---|---|
| T-D1 | RC-1 yes: the classifier resolves a type alias declared in the same file. |
| T-D2 | RC-2 yes, narrowly: an interface keyed only by a same-file `unique symbol` (and `Record`/`Readonly` of one) is an exempt phantom carrier. No per-file override. |
| T-D3 | `adapterResult` belongs to B18's last step ("remove `adapterResultContract`"), after B18's `sh-1` and `c-5` leftovers land. |
| T-D4 | T-server is dropped: the R1 index agent already owns `iso-timestamp` and `process-id`. |

## Concessions made while executing

