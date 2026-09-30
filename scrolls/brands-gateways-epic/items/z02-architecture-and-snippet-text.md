# Z02: `get-architecture` and the session snippets

| | |
|---|---|
| Phase | Phase 6 — docs and finish |
| Source | `scrolls/gateway/followup-sustainability.md`, "Existing text that changes" rows for `get-architecture` and the session snippets (lines 416-435); `scrolls/brands-types-tests-rules.md`, "Architecture docs: `get-architecture` and the session snippets" (2324-2344) |
| Needs | every A, B, G, T item |
| Unblocks | Z07 |
| Packages touched | `shared` (`architecture-overview-broker.ts`, `session-snippet-statics.ts`) |
| Checks to run | `lint,typecheck,unit,integration` |
| Split | one agent |
| Runs alone | no (runs with Z01, Z03-Z06) |

## Why

`architecture-overview-broker.ts` (served by `get-architecture`) and
`session-snippet-statics.ts` (served at every session start, in every repo `dungeonmaster init` has
touched) both teach a rule this epic replaces at several places: `adapters/` as the only way to wrap an
npm package, `node10` module resolution, brand rules from before B1-B9, return-type rules from before R1,
and no line at all on the gateway, test barrels, or the home sandbox. A model that reads either source
today learns rules the code no longer enforces once this epic lands.

## Current state

- `packages/shared/src/brokers/architecture/overview/architecture-overview-broker.ts` exists, confirmed
  present. Its exact current line numbers were not re-verified against the source doc's citations
  (`:76`, `:96`, `:104`, `:110`, `:119`, `:177`, `:250`, `:264`, `:274`, `:279`, `:336`, `:352`, `:393`) —
  treat every specific line number below as approximate; search the file's text for the quoted sentence
  rather than trusting the number.
- `packages/shared/src/statics/session-snippet/session-snippet-statics.ts` exists, confirmed present.
  Line numbers cited (`:103`, `:104`, `:105`) are similarly approximate.

## Work

Apply every row below to the finished code, not to what the row's "Says today" cell describes — by the
time this item runs, the exact wording may already differ from what these rows quote, since the source
docs were written 2026-09-24 to 2026-09-26. Search for each quoted sentence's substance, not its exact
line number.

### `get-architecture` (`architecture-overview-broker.ts`)

| Says today (approx.) | Change to |
|---|---|
| `lib/` → `adapters/`: "Only adapters wrap an npm package"; forbidden-folders table | "An outside package is reached only through the gateway: `#gateway/<folder>/<subpath>`." Drop the `adapters/` rows. |
| "node10 resolution (`moduleResolution: "node"`, used everywhere) ignores the `exports` map…" | `node16` with the `source` condition; how that resolves a root barrel and `#gateway` |
| layer diagram and import rules: `adapters/` alone may import `node_modules` | every folder type imports outside things through `#gateway`; nothing imports a raw package |
| `adapters/axios/get/axios-get-adapter.ts` as the naming example | a broker path as the example instead |
| "A `brokers/` file may import another package's `contracts`/`adapters`/`brokers`" | drop `adapters` from that list |
| "In `adapters/` only: the npm-package call stays in the parent" | removed with `adapters/`; the layer list adds `contracts`, `transformers`, `statics` and `bindings` (C7, epic item B07) |
| "Returns must be branded Zod contracts — inputs MAY take a raw `string`. The asymmetry is deliberate" | "Every object contract and every string and number field in it is branded. A loose parameter, return or local is plain." (B1, B6) |
| "`ban-primitives` is asymmetric on purpose…" | "Brands live on object contracts: every object and every field there is branded, and nothing else is." |
| "An adapter mocks its own npm package" | "The proxy of the file that calls a gateway wrapper composes that wrapper's proxy, imported from its own file. MSW answers HTTP and WebSocket." |
| `const dagNodeId = dagNodeIdContract.parse(stepId); // ✅ re-brands through validation` | removed — a field that holds another object's id reuses that id's schema (B4), and parsing one id into another brand is refused (B8) |
| `const data = JSON.parse(response) as ApiResponse; // ✅ you know what the compiler cannot` | `const data = apiResponseContract.parse(JSON.parse(response));` (C4) |
| `const indexMap = new Map<ChatEntry, number>(); // ❌ raw number trips ban-primitives` | the `number` form is right; drop the ❌ line (B6) |
| "Types supporting the file's one export may sit beside it" | "An object type that leaves a function is a contract in `contracts/`. A type used only inside one function body stays inline." (B9) |
| no section on where test support lives | add: "A stub sits beside its contract and a proxy beside the file it mocks. No barrel exports either. Tests import each from its own file. Production code never imports one." (C6, adjusted for concession 1) |
| no section on returns beyond the `void` ban | add: "Return what your calls told you. `void` only when every call you discard returned `void`. `{ success: true }` counts as `void`." (R1) |

### Session snippets (`session-snippet-statics.ts`)

| Says today (approx.) | Change to |
|---|---|
| "Returns must be branded Zod contracts — inputs MAY take a raw `string`. The asymmetry is deliberate" | "Every object contract and every string and number field in it is branded. A loose parameter, return or local is plain." (B1, B6) |
| "Tests import `.stub.ts`, never `-contract.ts`; Stubs import contract to parse with" | "Tests import each stub and proxy from its own file, never from a production barrel. A stub for our type parses through its contract. A stub for an outside type comes from the gateway." (C5, C6, adjusted for concession 1) |
| "No `as unknown as` on a brand mismatch — re-parse it: `dagNodeIdContract.parse(stepId)`" | "No `as unknown as` on a brand mismatch. A field that holds another object's id reuses that id's schema. Never parse one id into another brand." (B4, B8) |
| `modifyingCodeGuidance` snippet: no line on outside packages or per-file test imports | add: "Import outside packages only through `#gateway/<folder>/<subpath>`, types included. Import each stub and proxy from its own file." (C2, C6, gateway) |
| `folderTypes` snippet: has an `adapters/` row | remove the `adapters/` row entirely (gateway) |
| `<dungeonmaster-packages>` snippet: lists `@gateway` as one package | change to `#gateway` — the gateway is reached and referred to by its import prefix, not a package name (per "The discovery tools show the gateway as `#gateway`" in the GW follow-up doc) |

## Lint rules this item adds or changes

None. This item is text only.

## Teaching text this item changes

This item's whole output IS teaching text: `architecture-overview-broker.ts` and
`session-snippet-statics.ts`.

## Done when

- Every row above is applied to the finished code's actual current text (not blindly pasted over
  whatever the row's "Says today" cell shows, since that cell may already be stale).
- `<dungeonmaster-packages>` and `<dungeonmaster-folderTypes>` snippets (as served to a live session) show
  `#gateway` and no `adapters/` row respectively.
- `npm run ward -- --uncommitted` exits 0 on every touched file.

## Traps

- Do not paste the row text verbatim without first confirming it against the file — the "Says today"
  column is dated and the file may already read differently by the time this item runs.
- This item and Z01/Z03 both touch documentation served by MCP tools; coordinate scope so no two agents
  edit `architecture-overview-broker.ts` or `folder-config-statics.ts` at once — this item owns
  `architecture-overview-broker.ts` and `session-snippet-statics.ts` only, not the folder-constraints
  `.md` files (Z01, Z03) or `architecture-testing-patterns-broker.ts` (Z03).

## Concessions made while executing

<Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table.>

## Plan

Planned 2026-09-30 against HEAD 84dea7b74 (branch `gateway-pivot`) by a read-only planning agent. Every line number below was read at that HEAD; the item's own "Current state" said line numbers were unverified, so these replace them. Scratch: `tmp/z-plan/` (`census.py`, `g.py`).

### 0. What is already done (skip these rows of "Work")

| Row in "Work" above | State at HEAD |
|---|---|
| `node10` resolution paragraph | Gone. The "Cross-Package Public API" section (overview `:102-119`) teaches explicit barrel keys, `source` condition and TS2742. Nothing to do. |
| "no section on where test support lives" | Done: overview `:110` "A stub sits beside its contract and a proxy beside the file it mocks. No barrel exports either..." (concession 1 wording, per-file `./*.stub` / `./*.proxy` keys). |
| layer list adds `contracts`, `transformers`, `statics`, `bindings` (C7) | Done: the line is generated from `folderConfigStatics` (`allowsLayerFiles`), and `architecture-overview-broker.test.ts:55` pins `bindings/, contracts/, flows/, statics/, transformers/, widgets/, brokers/, responders/`. |
| `<dungeonmaster-packages>` shows `#gateway` | Done: `packages/hooks/src/responders/hook/session-snippet-packages/hook-session-snippet-packages-responder.ts` collapses `packages/@gateway` to `gatewayLocationsStatics.importPrefix`. The snippet in a live session reads `- **#gateway**`. |
| `<dungeonmaster-folderTypes>` has no `adapters/` row | Done: `packages/hooks/src/transformers/build-folder-types-table/build-folder-types-table-transformer.ts` builds the table from `folderConfigStatics`, which has no `adapters` key. BUT the "When to Use" column prints `config.meta.whenToUse`, and the middleware row reads "Combine adapters for infrastructure" (`folder-config-statics.ts:169`). That stale cell reaches every session; it is owned by Z03 batch Z03-C. |

### 1. Every source file behind these tools (full paths)

| Served by | File | Role |
|---|---|---|
| `get-architecture` | `/home/brutus-home/projects/codex-of-consentient-craft/worktrees/gateway-pivot/packages/shared/src/brokers/architecture/overview/architecture-overview-broker.ts` | the whole document, literal markdown (401 lines) |
| | `.../architecture-overview-broker.test.ts` | pins it with line-anchored regexes (316 lines) |
| | `packages/mcp/src/responders/architecture/handle/architecture-handle-responder.ts` | routes the tool to the broker; carries no teaching text |
| | `packages/shared/src/statics/folder-config/folder-config-statics.ts` | feeds the layer diagram (via `folderDependencyTreeTransformer`) and the "Allowed in" list; Z03 owns it |
| session snippets | `packages/shared/src/statics/session-snippet/session-snippet-statics.ts` | the 13 static snippets; `folderTypes` and `packages` are `null` here and generated by the two hooks files above |
| | `packages/shared/src/statics/session-snippet/session-snippet-statics.test.ts` | caps every snippet at 2048 bytes (`MAX_SNIPPET_BYTES`, `:4`); pins the ward, comment, build, worktree, siegelense and gateway-wrapper snippets; **pins nothing in `modifyingCodeGuidance`** |
| | `packages/hooks/src/transformers/agents-rules-creator/agents-rules-creator-transformer.ts` | Antigravity copy: reads the same statics, no text of its own |

### 2. Stale-teaching audit

**`architecture-overview-broker.ts`** (the file's backticks are escaped `\``; quote by substance):

| Line | Stale claim | Current rule |
|---|---|---|
| 74 | `\| lib/ \| adapters/ \| Only adapters wrap an npm package \|` | No `adapters/` folder type exists. An outside package is reached only through `#gateway/<folder>/<subpath>` (EPIC concession 6; `validate-external-import-layer-broker.ts:38-51` treats a gateway import as the one boundary). Replace the row: `lib/` -> `brokers/` or `#gateway` ("An outside package is reached only through the gateway"). |
| 75 | `utils/, helpers/` -> "adapters/, guards/ or transformers/ ... wraps a package, returns a boolean, or reshapes data" | Drop `adapters/`: "guards/ or transformers/ ... returns a boolean, or reshapes data"; a wrapper of a package goes in `#gateway`. |
| 94 | `adapters/axios/get/axios-get-adapter.ts ✅ name is the folder path` | Gateway work (Work row 4): use a broker path, e.g. `brokers/user/create/user-create-broker.ts`. |
| 89-100 | Import Rules says nothing about outside packages | Add one sentence: outside packages, types included, are imported only through `#gateway/<folder>/<subpath>`; nothing imports a raw package (concessions 9, 20 carve out web's `main.ts` CSS imports and `@dungeonmaster/*` toolkit imports; do not teach the carve-outs here). |
| 117 | "`…Adapter` -> adapters" in the main-barrel classification list | No such suffix. Drop the item. |
| 119 | "A `brokers/` file may import another package's `contracts`/`adapters`/`brokers` ... `adapters/` (which alone allow `node_modules`) are the sanctioned boundary for anything else." | Drop `adapters`; replace the last sentence with the gateway sentence. `folder-config-statics.ts:178-186` has no `adapters/` in any `allowedImports`. |
| 177 | "**In `adapters/` only:** the npm-package call stays in the parent. ..." | Remove the paragraph (Work row 6). Its pin is `architecture-overview-broker.test.ts:89-97`; delete that `it` with it. |
| 239, 267 | `{userId}: {userId: UserId}`, `companyId: CompanyId` in the good examples | `UserId` and `CompanyId` are standalone scalar brands, which no longer exist (B2; `packages/shared/src/contracts/` has empty `path-segment/`, `content-text/`, `array-index/` folders). Per concession 29 and R8 (`enforce-owner-field-reuse`): `{userId}: {userId: User['id']}`, `companyId: Company['id']`. |
| 250 | "Types supporting the file's one export may sit beside it; a second broker may not." | B9 (`ban-adhoc-types` with `checkModuleLevelShapes`, registered off at `config-dungeonmaster-broker.ts:210-211`; EPIC: R3 switch-on is P3). the B9 row of "Work" still applies: "An object type that leaves a function is a contract in `contracts/`. A type used only inside one function body stays inline." Decision D3 below. Pinned by `architecture-overview-broker.test.ts:238-240`. |
| 260-264 | "### Parameters and return types" closes with "`ban-primitives` is asymmetric on purpose: an input MAY take a raw `string`, a return MUST be branded." | `ban-primitives` is not in the `typescript` config or `ruleEnforceOn` (`config-dungeonmaster-broker.test.ts:158-167` asserts it absent). Concession 29 / F129: a parameter named for another object's field takes `Owner['field']` (R8 enforces it except in `errors/`, concession 28); every other parameter may be a plain `string`. Brand rule: concession 25 and the B1/B6 Work row (see D1 for the return wording). Pinned by `architecture-overview-broker.test.ts:253-261` (a regex on the exact sentence). |
| 271 | `export const badFunction = ({userId}: {userId: string}) => {};  // ❌ no return type, so nothing is branded` | R8 reports `{userId: string}` itself. Change the example to `({user}: {user: User})` or annotate it: "❌ userId is an owner's field: `User['id']`". The "no return type" half is still true (`enforce-folder-return-types` `missingReturnType`). |
| 276-281 | "Passing a branded value into another domain means re-parsing it ... `dagNodeIdContract.parse(stepId)  // ✅ re-brands through validation`" | B4/B8: a field holding another object's id reuses that id's schema; parsing one id into another brand is refused. Remove the ✅ line; keep the `as unknown as` ❌ line; replace the lead sentence. |
| 289-295 | Header example names `pathSegmentContract`, `absoluteFilePathContract`, `repoRelativePathContract`, `repoRelativePathContract.parse('packages/shared/src/x.ts')` | All three are deleted (B2; `tmp/deletions/W5/packages/shared/src/contracts/`). The example must name live contracts. Suggested: a live object contract with a reuse-over-sibling sentence, e.g. `questContract`/`questBriefContract` (agent verifies names with `discover` before writing). Also `:310` ("Zod schema for validating absolute file paths") and `:320` ("The repo's own worst case is `file-path-contract.ts`", which is deleted) need live or hypothetical examples. |
| 336 | `const data = JSON.parse(response) as ApiResponse;  // ✅ you know what the compiler cannot` | C4: `const data = apiResponseContract.parse(JSON.parse(response));` Also the prose at `:340` ("`as` is for information the compiler lacks") needs "never for parsing outside data". |
| 351-352 | `Map<ChatEntry, ArrayIndex>  // ✅` and `Map<ChatEntry, number> // ❌ raw number trips ban-primitives` | `ArrayIndex` is deleted (empty `packages/shared/src/contracts/array-index/`). `Map<ChatEntry, number>` is now the right form (B6). Replace with one ✅ line; drop the ❌ and the "An index map still holds a branded value" lead. |
| 393 | "An adapter mocks its own npm package, a global mock covers non-determinism like `Date.now`, and every broker, guard, transformer and widget runs real." | Work row 9: "The proxy of the file that calls a gateway wrapper composes that wrapper's proxy, imported from its own file. MSW answers HTTP and WebSocket." |
| (missing) | No gateway section, no B1 brand section, no R1 returns section | Add, in this order after "Import Rules": `## Outside Packages: the Gateway` (2-3 sentences: `#gateway/<npm|node|browser|bin>/<subpath>`, types included, a wrapper is a folder with `.proxy.ts` and `.stub.ts`, a consumer's wrapper layout is in the `consumerGatewayWrapper` snippet); under "Parameters and return types": the R1 paragraph from the R1 row of "Work" ("Return what your calls told you. `void` only when every call you discard returned `void`. `{ success: true }` counts as `void`." The rule is `enforce-folder-return-types`, `rule-enforce-folder-return-types-broker.ts:5,32`); under "Types": a short brand paragraph (B1, B3: an object contract and each string/number field carry `.brand<'OwnerKey'>()`, a field that holds another object's field reuses that schema). |

**`session-snippet-statics.ts`** (only `modifyingCodeGuidance` is stale):

| Line | Stale claim | Current rule |
|---|---|---|
| 103 | "Tests import each stub and proxy from its own file, never from a production barrel. A stub for our type parses through its contract. A stub for an outside type comes from the gateway's own file" | Already correct (snippet table row 2, already done). Kept, shortened only to buy bytes (see budget). |
| 104 | "Returns must be branded Zod contracts — inputs MAY take a raw \`string\`. The asymmetry is deliberate" | Concession 29, F129: "Returns are branded; a parameter named for another object's field takes `Quest['id']`, any other may be a plain `string`". |
| 105 | "No \`as unknown as\` on a brand mismatch — re-parse it: \`dagNodeIdContract.parse(stepId)\`" | B4/B8: "No `as unknown as` on a brand mismatch; a field holding another object's id reuses its schema". |
| 95-107 | no line on outside packages | Add "Import outside packages only through `#gateway/<folder>/<subpath>`, types included". |
| 96 | "No `utils/`, `helpers/`, `lib/` folders" | Correct. |

Byte budget: the snippet renders to about 2000 of the 2048 allowed bytes (measured with a split-and-count script at HEAD; the agent re-measures). The four proposed lines below total 429 bytes against 392 today, +37, which fits. F129's own wording ("A parameter named for another object's field (`questId`) takes `Quest['id']`; any other parameter may be a plain `string`") is 26 bytes longer than the line below, which with the gateway line would exceed the cap: use the shortened forms.

```
- Import each stub and proxy from its own file, never a production barrel; a stub for an outside type comes from the gateway
- Import outside packages only through `#gateway/<folder>/<subpath>`, types included
- Returns are branded; a parameter named for another object's field takes `Quest['id']`, any other may be a plain `string`
- No `as unknown as` on a brand mismatch; a field holding another object's id reuses its schema
```

**Master conflict.** Master changed exactly one line in this folder's scope: `packages/shared/src/statics/session-snippet/session-snippet-statics.ts` (1 insertion, 1 deletion; `git diff --stat $(git merge-base HEAD master) master`), a siegelense snippet edit (commit 6f9798b9a area). The other Z02 files (overview broker and test) and every Z03 file are untouched on master. So only batch Z02-B waits for the merge.

### 3. Tests that pin this text (they change in the same batch)

| Test | Lines | Must change because |
|---|---|---|
| `architecture-overview-broker.test.ts` | `:89-97` "keeps the npm-package call in the parent for adapter layers" | the `adapters/` layer paragraph is removed: delete this `it`. |
| same | `:253-261` "states the ban-primitives asymmetry" | sentence replaced: rewrite the regex to the new paragraph, asserting a real value. |
| same | `:238-240` ends `...Types supporting the file's one export may sit beside it; a second broker may not.$` | changes with the B9 sentence (D3). |
| same (new) | after `:251` | add `it`s pinning: the gateway section heading; the R1 sentence; the owner-id sentence; the `Map<ChatEntry, number>` line; the `apiResponseContract.parse(JSON.parse(response))` line. Assert exact lines with `^...$` like its neighbours. |
| `session-snippet-statics.test.ts` | (none pin `modifyingCodeGuidance`; the 2048 cap runs via `it.each(staticEntries)` at `:17-23`) | add a `modifyingCodeGuidance` `it` pinning the four lines above; the cap test is the byte guard. |
| `packages/mcp/src/brokers/architecture/testing-patterns/...test.ts` | n/a | not touched by Z02. |

### 4. Batches (text work, 1 to 3 files each)

| Batch | Files | Does | Runs with |
|---|---|---|---|
| **Z02-A** | `packages/shared/src/brokers/architecture/overview/architecture-overview-broker.ts`, `architecture-overview-broker.test.ts` (2 files) | every overview row in section 2, the new gateway, brand and R1 sections, the F129 batch-2 sentence at `:264`, and the test changes in section 3. Checks `lint,typecheck,unit`. | Z02-B, all of Z03, Z10. May run before the master merge (master did not touch it). |
| **Z02-B** | `packages/shared/src/statics/session-snippet/session-snippet-statics.ts`, `session-snippet-statics.test.ts` (2 files) | the four-line `modifyingCodeGuidance` rewrite, F129 batch-2 line 104, and the new test. **Runs after the master merge** in the merge worktree, on top of master's siegelense edit. Re-measure bytes after the merge. Checks `lint,typecheck,unit`. | Z02-A and Z03 (disjoint files). |
| **Z02-C** | `scrolls/brands-types-tests-rules.md` (1 file) | F129 batch 3: rows `:2328` and `:2330` of the teaching-text table carry the new sentence, so Phase 6 does not undo it; also row `:2351` already says "unless it is a field taken through `Owner['key']`" (consistent, leave). Text only. | anything |
| **Z02-D** | `scrolls/brands-gateways-epic/EPIC.md`, `bigbang/FIXER-BRIEF.md`, `bigbang/recipes/plain-into-brand.md`, `bigbang/recipes/ts2322-mismatch.md` (4 files, operator-sized; it is F129 batch 1) | concession 25's last sentence restated, concession 28 gains the owner-claimed sentence, FIXER-BRIEF decision 1 and the two recipes (`plain-into-brand.md:8` and `:119`, `ts2322-mismatch.md:68`). Docs only; the operator may do it directly. | anything |

F129 fold: batch 1 -> Z02-D; batch 2 -> Z02-A (overview `:264` and its test) plus Z02-B (snippet `:104`); batch 3 -> Z02-C. Z02 owns every F129 file; Z03 owns none of them.

Parallelism: Z02-A, Z02-B (after merge), Z02-C, Z02-D touch disjoint files. Z02-A plus up to three Z03 batches may run at once under the operator's agent cap.

### 5. Builds before a live session sees the text

| Text | Needs | Then |
|---|---|---|
| `architecture-overview-broker.ts` (get-architecture) | `npm run build --workspace=@dungeonmaster/shared` | reconnect the MCP (`mcp` runs `dist` and imports shared's `dist`) |
| `session-snippet-statics.ts` | the same shared build | a NEW session (snippets are injected at SessionStart/SubagentStart by the hooks binaries, which read shared's `dist`); no hooks rebuild, because no hooks file changes |
| scrolls docs (Z02-C, Z02-D) | none | none |

Verification the operator runs after the build: call `get-architecture` and read the gateway section and the Parameters paragraph; start a session and read `<dungeonmaster-modifyingCodeGuidance>`.

### 6. Open decisions

- **D1. Return wording.** the Work rows for B1/B6 say "a loose parameter, return or local is plain"; concession 25 and FIXER-BRIEF decision 1 say "returns are branded". Nothing enforces a branded scalar return today: `ban-primitives` is off the config, and `enforce-folder-return-types` only grades `void`, `unknown`, `object`, `Record`, and guard returns. Recommendation: teach "a scalar from a loose source is returned plain; a value that came from a contract keeps its brand; an object contract and each of its fields is branded" in the overview, and the short "Returns are branded" line in the snippet only because it cannot carry the nuance in 2 KB. The operator confirms before Z02-A/B run.
- **D2. `ban-primitives` file.** `packages/eslint-plugin/src/brokers/rule/ban-primitives/` still exists and is registered in `eslint-plugin-create-responder.ts:103,257` (just not configured). Out of scope here; the docs stop naming it. Left standing for the operator (P3).
- **D3. B9 sentence at `:250`.** `checkModuleLevelShapes` is off (R3 switch-on is P3), so "An object type that leaves a function is a contract in `contracts/`" is taught but not yet enforced. Recommendation: teach it as the rule (the brands doc says so) with the parenthetical "enforced by `ban-adhoc-types`"; do not claim `checkModuleLevelShapes` is on.
- **D4. Section order.** Gateway section placed after "Import Rules" (recommended) versus a new top-level heading near the forbidden-folders table. No test depends on the order.
