# Chunks 9 and 10 — converting this repo's own suites onto the recipe framework

> **This is the validation, not cleanup.** `siegelense-recipes.md`'s own words: *"Converting the
> existing suites is how this design gets proven, and it is in scope for this work … a conversion
> that cannot reproduce a test's setup has found a hole no invented example would have."* A batch
> that produces a finding and no conversion has done its job. A batch that produces a conversion by
> loosening an assertion has destroyed the exercise.
>
> **Revised 2026-09-16** against the `recipes-doc` worktree, after the first real conversion landed
> in `server`. Three of the five GATE 0 blockers are resolved in code, the quest ingredient grew
> `transitions`, and **the running mark was measured and found to count no seeding call at all.**
> Every claim below was re-derived against the tree rather than carried over; §13 lists what changed
> and why, so nothing here reads as unexplained drift from the previous revision.

---

## 0. The discovery that set this revision, and the one that reversed it

**The brief for this revision carried a premise. It is half true, and the half that is false is the
half the plan was resting on.**

### 0.1 TRUE — a `flows/`-folder *integration test* cannot import a broker

`get-folder-detail({ folderType: 'flows' })` lists the whole allowed set:

> `contracts/`, `transformers/`, `guards/`, `statics/`, `errors/`, `flows/`, `responders/`, `hono`,
> `react-router-dom`, `express`, `@modelcontextprotocol/sdk`, `zod-to-json-schema`

No `brokers/`, in-package or cross-package, and a colocated `*.integration.test.ts` gets no
carve-out — `integrationOverrides`
(`packages/eslint-plugin/src/brokers/config/dungeonmaster/config-dungeonmaster-broker.ts:220-225`)
turns off exactly one rule, `jest/max-expects`, and `enforce-import-dependencies` is not it.

`@dungeonmaster/siegelense-recipes` exposes its runner only as `dmRegistryBroker`, a
`brokers/`-suffixed export, and has no `responders` subpath. **So the landed conversion had to route
through `test/harnesses/`, and its harness says so on the code**
(`packages/server/test/harnesses/server-app/server-app.harness.ts:61-68`):

> *"A file under `test/harnesses/` is not classified into any architecture folder type, so it is the
> only place in this package that can import a broker on the recipe framework's behalf."*

### 0.2 FALSE — a browser spec is NOT bound by that rule

**`enforce-import-dependencies` is switched OFF for every `*.e2e.ts` file in the repo.**

`config-dungeonmaster-broker.ts:271-295`, in the block whose `files` is `['**/*.e2e.ts']`:

```
// Import deps — e2e specs are TEST files colocated under flows/<route>, not flow
// modules. They legitimately reach for node builtins (crypto) to mint unique test
// data; the flows/-can't-import-external rule targets shipped flow code, not specs.
'@dungeonmaster/enforce-import-dependencies': 'off',
```

Nothing else stands in the way, and each half was checked rather than assumed:

| Gate | State |
|---|---|
| the folder-type import rule | **off** for `**/*.e2e.ts` (line 295) |
| `ban-node-builtins-in-test-scenarios` | bans only `harnessPatternsStatics.bannedNodeBuiltins` — `fs`/`path`/`os`/`child_process`. A package import is not a builtin |
| the package's `exports` map | `.`, `./brokers`, `./contracts`, `./statics` all present |
| `web`'s dependency declaration | `packages/web/package.json:36` — `"@dungeonmaster/siegelense-recipes": "*"`, in **devDependencies**, which is where §3 G0-b asked for it |

**Proved by running it, not by reading it.** A real spec was written at
`packages/web/src/flows/home/recipes-spec-import-proof-tmp.e2e.ts` importing `dmRegistryBroker` and
`recipesHydrationCreateBroker` from `@dungeonmaster/siegelense-recipes/brokers`, and
`dmTargetContract` / `guildFieldsContract` from `…/contracts`, building a real plan with
`dm.guilds.add(1, …)`:

```
run: 1789580578153-5c47  (16.0s)
lint:      PASS  1 packages (1 files passed/0 files failed, 1 discovered)  5.8s
typecheck: PASS  1 packages (1411 files passed/0 files failed, 1411 discovered)  9.9s
```

The first attempt failed on `@typescript-eslint/require-await` — a test body with no `await` — and
on nothing else; there was never an import diagnostic. **The file was deleted after the run**; it
exists only as this record.

### 0.3 So the harness seam is a CHOICE, not a constraint — and it is still the right one

The plan below keeps the harness as the seam. **Not because a spec cannot import an ingredient —
it can — but because converting through the harness is strictly better at the thing this exercise
exists to do.** §11 argues that in full. The one-line version: a spec that does not change is a
stronger control than a spec an agent rewrote, and the pressure this exercise depends on never lived
in the spec's text.

**Where the seam does NOT serve, a spec imports the framework directly, and §11.4 names those
cases.** That door is open and is now known to be legal.

---

## 1. The census, as it prints today

```bash
python3 scrolls/tools/seed-census.py              # the target list
python3 scrolls/tools/seed-census.py --progress   # the running mark — see §10, it does not measure what it claims
```

Run on this worktree, 2026-09-16 — unchanged from the previous revision:

| | Prints |
|---|---|
| e2e specs | **118 of 122** seed domain state |
| integration tests | **21 of 137** seed domain state and are convertible |
| excluded | **1** — a test OF a production writer an ingredient copies |
| seeding call sites | `guildHarness` 510 · `questHarness` 259 · `sessionHarness` 147 — **916 total** |
| driving call sites, untouched | `navigationHarness` 268 · `environmentHarness` 236 |

**Every one of the 916 sits inside a `*.e2e.ts` file.** The census walks only `*.e2e.ts` and
`*.integration.test.ts`, so a harness calling another harness is invisible to it —
`dispatch.harness.ts`'s own `questHarness` calls, for one.

**The census has not caught up with the specification.** It still lists the 11 `orchestrator`
integration targets, which `siegelense-recipes.md:1792-1796` descoped outright (§4.1). A build agent
working from today's list will spend a batch discovering that. §12 Q9-1 carries the fix.

### The census's 21 integration targets are not 21 conversion targets

The census's `DOMAIN` regex matches a URL string and a `Stub` import as readily as a seed. Opened
file by file, the 21 fall into four groups now that the descoping ruling exists. §9 carries the full
per-file table.

| Group | Count | Why |
|---|---|---|
| **descoped — inside `orchestrator`** | **11** | the dependency cycle; the specification's own ruling, not this plan's |
| **the framework's own subjects** | 5 | `planRunBroker`, `fetchPostAdapter`, and the three recipe tests — the same exclusion rule, one level up |
| **seed nothing to convert** | 4 | `mcp-server-flow`, and `server`'s `design-flow` / `guild-flow` / `session-flow` |
| **the real conversion target** | **1** | `server/…/flows/quest/quest-flow.integration.test.ts` — **converted; see §5** |

---

## 2. The write route, settled against the code

**`copies: 'questPersistBroker'` names the counterpart a diagnosis starts from. The route is
`questWriteRouteBroker`, and it is an IMITATION, because the real broker is not exported.** A
converted test that disagrees with the real broker is a drift between the imitation and its
counterpart — that is a finding against `questPersistDirectBroker`, never against the test.

`packages/siegelense-recipes/src/brokers/quest/ingredient/quest-ingredient-broker.ts:110,115`
declares `write: questWriteRouteBroker` and `copies: 'questPersistBroker'`;
`quest-write-route-broker.ts` calls `questPersistDirectBroker`, an in-package broker reproducing the
two effects by hand — atomic temp-then-rename plus an `event-outbox.jsonl` append. Confirmed against
`packages/orchestrator/package.json` (`exports` holds `.` and `./testing`) and
`packages/orchestrator/src/index.ts` (no `persist`, no `hydrate`, no `operations-update` export).

**What changed since the last revision:** the quest ingredient **now declares `transitions`**
(`quest-ingredient-broker.ts:101-107`), with `field: 'status'`, a `to` list derived from
`questStatusContract.options.filter(isTransitionTargetQuestStatusGuard)`, and
`reach: questReachRouteBroker`. The previous revision's *"the quest ingredient declares no
`transitions` at all today"* is **no longer true**, and Phase F is unblocked in consequence (§6.7).

---

## 3. GATE 0 — what still blocks a batch, and what no longer does

**Three of the five original gates are resolved in code.** Each was re-checked against the tree, not
assumed from the previous revision.

### RESOLVED — G0-a, the package boundary

`packages/siegelense-recipes/package.json` `exports` now holds `.`, `./brokers`, `./contracts` and
`./statics`. `dmRegistryBroker`, `recipesHydrationCreateBroker`, the five ingredients, the three
recipes and `dmTargetContract` are all reachable. `brokers.ts` is the barrel. **Nothing to do.**

### RESOLVED — G0-b, the dependency declarations

- `packages/web/package.json:36` declares `@dungeonmaster/siegelense-recipes` as a **devDependency** —
  exactly what the previous revision recommended, and it never reaches the Vite bundle.
- `packages/server/package.json:33` declares it too.
- **`@dungeonmaster/server` is gone from `siegelense-recipes`'s `dependencies`** — they are now
  `@dungeonmaster/hydration`, `@dungeonmaster/orchestrator`, `@dungeonmaster/shared`, `zod`. Half the
  cycle removed, as recommended.
- The orchestrator half is settled by **descoping**, not by spiking — `siegelense-recipes.md:1805`:
  *"the orchestrator-owned targets are descoped from this conversion, and the limit is documented
  rather than worked around."* **Q9-4 is closed; do not re-open it, and do not copy ingredients into
  `orchestrator`.**

### RESOLVED — G0-c, the `api` envelope

Both `api` routes now return the record and throw on a failure status, rather than handing back
`DmHttpResponse`. `guild-api-route-broker.ts` and `quest-api-route-broker.ts` both end in
`dmHttpResponseUnwrapAdapter({ … })`, and both headers say so:

> *"Returns the created `Guild` record itself on a success status, never `dmHttpRequestAdapter`'s
> `{ status, body }` envelope — the runner parses whatever this route returns straight through"*

Q9-2's recommendation (*"the route unwraps"*) is what landed. **The remaining half of that gate is
unpaid:** nothing has yet run an `api` route against a real server through the runner. That is now
batch **10.1**'s job rather than a gate of its own — the probe batch is the proof.

### LIVE — G0-d, a target with a `baseUrl` always takes `api`

`packages/hydration/src/transformers/route-select/route-select-transformer.ts:22-27`, unchanged:

```ts
if (hasBaseUrl && routes.api !== undefined) { return 'api'; }
if (routes.write !== undefined) { return 'write'; }
```

Route choice is **per ingredient, per target**. On an e2e target (which has a `baseUrl`), `quest`
takes `api` unconditionally, and `questApiRouteBroker`'s own header says what that costs:

> *"it walks the real intake path (`questUserAddBroker` mints the id, seeds the chat work item, and
> the quest starts at `created`), so it cannot express an arbitrary seeded
> `status`/`workItems`/`operations` the way `write` can."*

**`writeQuestFile`'s 172 call sites need exactly that expression.** A `set({ status, workItems })`
after the create does not rescue it: `planFoldWritesTransformer` folds a plain `set` into the
`create` for the same row.

**Ruling: option A — two targets, and the harness seam makes it free.** A `baseUrl` target for
`createGuild`/`createQuest`, a home-only target for `writeQuestFile` and every session method. This
preserves today's split exactly: `createGuild`/`createQuest` were HTTP, so their rows take `api`;
`writeQuestFile` and every `sessionHarness` method were `fs`, so theirs take `write`.

**The seam is what turns this from a per-spec cost into a per-harness one.** The previous revision
costed option A at *"two `run` calls per spec; the guild id crosses by hand"* across 46 files. Inside
a harness method it is two module-level target builders and no spec ever sees either. **Q9-3 is
closed by the seam.**

### LIVE — G0-e, the target harness and the teardown

**Deliverable: `packages/web/test/harnesses/dm-target/dm-target.harness.ts`.** It builds BOTH
`DmTarget`s (§3 G0-d) and owns the teardown.

Two things it must carry, both load-bearing and both established by reading:

1. **The sequential-delete rule survives verbatim.** `guild.harness.ts:35-39` —
   *"Sequential deletes: concurrent DELETEs corrupt config.json (race on read-modify-write)"*. Chunk
   7 §2 rules cleanup is not an ingredient verb; it belongs to the target's teardown, and the comment
   moves with the code that still depends on it.
2. **`process.env.DUNGEONMASTER_HOME` is already correct in a spec process, and that is luck worth
   recording.** `guildWriteRouteBroker` and `operationWriteRouteBroker` resolve their home from the
   GLOBAL env var, never from `target.home` (`packages/siegelense-recipes/CLAUDE.md`, *"A `DmTarget`
   alone does not isolate a `write` route from the real machine"*). `playwright.config.ts:32,34` sets
   `process.env.DUNGEONMASTER_HOME = TEST_HOME` and `process.env.HOME = TEST_HOME` at module scope,
   and Playwright re-imports the config in every worker — **so a `write` route running inside a spec
   worker resolves the same home the server does.** The harness must assert this rather than assume
   it; a config refactor that moves those two lines breaks every `write` route in the suite with no
   other symptom.

### NEW — G0-f, `.under()` does not carry ancestor names forward

`packages/siegelense-recipes/CLAUDE.md` records it as a measured finding:

> *"`dm.quests.under({ guildId }).add(1, (q) => [...])` type-checks, but `q[0].operations` inside
> that builder does NOT — `TS2339`."*

This bites any harness method seeding a quest under a guild and then wanting the `operation`
ingredient's child accessor. **The established workaround is the quest's plain `operations` FIELD via
`set()`** — which is exactly what `writeQuestFile`'s callers pass anyway (§7, Chunk 7 Q7-1), so it
costs this conversion nothing. Recorded so nobody rediscovers it mid-batch.

### NEW — G0-g, `saveRecordAs` freezes a record at CREATE time

`op-create-apply-layer-broker.ts:112` runs once and is never updated. A quest row saved before a
sibling `operation` create reads back its ORIGINAL `operations: []`. **A harness method returning a
record must return one whose fields it actually set**, and anything asserting a ledger reads the file.
`fileTargetHarness.readQuestFileOperations` is the existing precedent.

---

## 4. The order, and what each step proves

### 4.1 Chunk 9 is one file, and it is done

`siegelense-recipes.md:1792-1796`:

> *"most of the cheap half of this migration — the chunk 9 integration conversions — sits inside
> `orchestrator` itself, and every one of those targets is descoped for exactly this reason. Only the
> one integration target inside `server` converts, because `server` sits outside the cycle. The chunk
> 10 browser specs are unaffected."*

So chunk 9's whole scope is `packages/server/src/flows/quest/quest-flow.integration.test.ts`, **and
it has landed** (§5). The previous revision's batches 9.1–9.5 named nine orchestrator files and are
struck out; §9 records each as DESCOPED rather than deleting the row, so the reasoning stays
checkable.

| Step | Scope | Proves | State |
|---|---|---|---|
| GATE 0 | §3 a–g | the package boundary, the `api` envelope, the target shape | a, b, c **done**; d, e, f, g carried into 10.0 |
| Chunk 9 | the 1 `server` target | the `write` route, links, defaults, the fold, and that a plan runs with no `baseUrl` | **DONE — §5** |
| Chunk 10 | the 118 e2e targets | the `api` routes, and one plan serving a caller with both | this plan |
| Step 3 (not this plan) | one manual siegelense round | `recipes {}`, the `seed` step, params validation | not started |

**Integration-first still held, and it paid.** The spec's own reasoning — *"Converting 118 browser
specs against an unproven runner is how you spend a day watching Playwright find the same bug
repeatedly"* — is why G0-c was found and fixed before a single browser walk.

---

## 5. The harness-seam shape, with the landed conversion as its worked example

**The rule:** a harness method keeps its NAME, its PARAMETER SHAPE and its RETURN SHAPE, and
replaces its BODY with a recipe run. The spec that calls it does not change.

### 5.1 What landed

`packages/server/test/harnesses/server-app/server-app.harness.ts` grew two methods —
`seedQuestFields` and `seedGuildAndQuestFields` — beside the raw `seedQuest` it did not delete. The
body of `seedQuestFields`, verbatim (`:296-307`):

```ts
const target = dmTargetContract.parse({
  home: dungeonmasterHome,
  claudeHome: dungeonmasterHome,
});
const plan = recipe({ name: 'seed-quest-fields', description: 'one seeded quest' }, () => [
  dmRegistryBroker.quests
    .under({ guildId: guildIdContract.parse(guildId) })
    .add(1, (q) => [q[0].setRaw(fields), q[0].saveRecordAs({ name: QUEST_SAVE_NAME })]),
])();
const result = await dmRegistryBroker.run(plan, target);
return result[QUEST_SAVE_NAME] as Quest;
```

And the call site, in the test (`quest-flow.integration.test.ts:85-93`):

```ts
const quest = await harness.seedQuestFields({
  dungeonmasterHome,
  guildId,
  fields: { status: 'flows_approved' as never, flows: [flow], comments: [bareComment, observableComment] },
});
```

with its assertions untouched below it (`:101-105`):

```ts
expect(response.status).toBe(200);
expect(harness.toPlain(body)).toStrictEqual({ success: true, quest: harness.toPlain(quest) });
```

### 5.2 The measurement that makes it a proof

```
git diff HEAD -- packages/server/src/flows/quest/quest-flow.integration.test.ts
  430 lines changed
  ASSERTION LINES REMOVED: 0
  ASSERTION LINES ADDED:   0
```

**Four hundred and thirty lines of setup changed and not one `expect(` moved.** That is the rule
*"a converted test keeps its assertions, exactly"* holding under real load — and, more usefully, it
is **mechanically checkable**. §11 makes that the control for the whole browser half.

### 5.3 Four decisions in that harness worth copying

Each is recorded on the code, and each generalises to the three web harnesses:

| Decision | Where | Why it generalises |
|---|---|---|
| ONE `recipesHydrationCreateBroker()` per harness file, at module scope; `run` off `dmRegistryBroker` | `:59` and its comment `:54-58` | a `run` from a second call sees an empty registry. Every web harness inherits this exactly |
| `setRaw`, never `set`, for a hand-built status | the `seedQuestFields` header `:113-115` | `status` is the quest's one `transitions` field; a real walk either throws on a write-only target or runs gates the fixture never meant to satisfy |
| ids are **read off the returned record**, never chosen | the header `:115-116` | `id`/`folder` are minted by the write route and are not part of `fields`. This is what lets a spec's `quest.id` keep working unchanged |
| the raw writer is **kept beside** the converted one | `seedQuest` survives at `:271-285` | a method with no ingredient does not get forced through one. §7's table is the list |

---

## 6. What each of the three harnesses becomes, method by method

**Call-site counts below are METHOD calls across the 118 e2e targets**, measured 2026-09-16 by
walking each spec, resolving `const x = <harness>(…)` bindings and counting both `x.method(` and the
inline `<harness>({…}).method(` form. **These are not the census's numbers and must not be compared
to them** — §10 explains why they differ.

### 6.1 `guildHarness` — 5 methods, all 5 change, none disappears

`packages/web/test/harnesses/guild/guild.harness.ts`, 70 lines.

| Method | Calls | Becomes | Signature |
|---|---|---|---|
| `createGuild` | **243** | `dm.guilds.add(1, …)` on the **`baseUrl`** target → the `api` route | **unchanged** |
| `extractUrlSlug` | **177** | `String(guild.urlSlug)` — read off the record, re-derivation DELETED | **unchanged** |
| `extractGuildId` | **95** | `String(guild.id)` — unchanged body, now over a typed record | **unchanged** |
| `cleanGuilds` | **132** | the `dm-target` harness's teardown, called through | **unchanged** |
| `beforeEach` | — | stays `cleanGuilds` | **unchanged** |

**`extractUrlSlug` is the single highest-value change in the chunk, and it is three lines.** Survey
finding 1: the harness re-derives the slug with a NARROWER rule than production —

```ts
String(guild.urlSlug ?? guild.name).toLowerCase().replace(/\s+/gu, '-') as UrlSlug;
```
(`guild.harness.ts:58-61`) collapses only WHITESPACE runs, where
`nameToUrlSlugTransformer` collapses every run of non-alphanumerics and strips leading/trailing
hyphens. **177 call sites read a value that is right only because every e2e guild name happens to be
plain words.** Replacing the body with a read of the real field is the one place in this conversion
where an assertion could legitimately move — **and if one does, that is the finding this whole cohort
exists to produce.** It gets written into §14, not fixed by putting the re-derivation back.

### 6.2 `questHarness` — 2 methods carry the chunk, 4 convert, 3 stay

`packages/web/test/harnesses/quest/quest.harness.ts`, 733 lines.

| Method | Calls | Verdict | Becomes |
|---|---|---|---|
| `createQuest` | **176** | CONVERT | `dm.quests.under({guildId}).add(1, …)` on the **`baseUrl`** target → `api`. Signature unchanged; the `{questId, questFolder, filePath, success}` return is built from the record |
| `writeQuestFile` | **172** | CONVERT | `…add(1, (q) => [q[0].setRaw(fields)])` on the **home-only** target → `write`. Signature unchanged. `workItems`/`operations`/`flows`/`comments` stay FIELDS (§7, Q7-1) |
| `writeUnparseableQuestFile` | **3** | CONVERT | the quest extra `corruptToLegacySchema` — **exists** (`quest-ingredient-broker.ts:117-120`) |
| `writeWardResultDetail` | **2** | CONVERT | the quest extra `withWardResultDetail` — **exists** (`:121-124`) |
| `patchQuestStatus` | **1** (+6 in Phase F specs) | **CONVERT — newly possible** | `set({ status })`, walked by `transitions.reach` (`:101-107`). See §6.7 |
| `rewindQuestStatus` | **1** | **STAYS** | reaches a row by a bare `questFilePath` from outside the plan. Survey finding 2 |
| `questFolderExists` | **4** | **STAYS** | an assertion, not a seed. `fs.existsSync`; it belongs in the spec's half |
| `seedInProgressWithOperations` | 0 from specs | CONVERT | wrapper over `writeQuestFile`; converts for free. Its one caller is `dispatch.harness.ts:218-229` |
| `buildQuestJson` | **0** | **DELETE** | dead code — survey confirmed no caller anywhere |

### 6.3 `sessionHarness` — a long tail, and the tail is the point

`packages/web/test/harnesses/session/session.harness.ts`, 1139 lines, 21 returned members.

**These figures match `python3 scrolls/tools/seed-census.py --methods` as it prints today. Re-derive them from
that command rather than trusting this table by hand** — see Q10-3.

| Method | Calls | Verdict |
|---|---|---|
| `createSessionFile` | **139** | CONVERT — `dm.sessions.under({ path }).add(1, …)`, `write` route |
| `cleanSessionDirectory` / `cleanSessionFiles` | **22** / **3** | teardown → the `dm-target` harness. Signatures unchanged |
| `createSessionWithAssistantText` | **14** | CONVERT |
| `createSubagentTailOnly` | **6** | CONVERT — the `subagent` ingredient |
| `appendSubagentLine` / `appendMainSessionLine` | **2** / **5** | **STAY** — a bare id from outside the plan. Survey finding 2 |
| `createSubagentSessionFiles`, `createInFlightSubagentSessionFiles`, `createMultiSubagentSessionFiles`, `createNestedSubagentSessionFiles` | **1 each** | CONVERT — the last is the session extra `withNestedChain` (`session-ingredient-broker.ts:60-63`) |
| `createSubagentTailMultiEntry` | **2** | CONVERT |
| `createMultiEntrySessionFile`, `createSubagentSessionWithInternalTool`, `createBackgroundAgentSession`, `createSessionWithRedactedThinking`, `createSessionFileForQuest` | **0 from specs** | CONVERT last, or leave — a method no spec calls proves nothing either way. **Do not spend a batch on these** |
| `createAnsweredClarificationSession` | **2** | CONVERT — has real call sites, unlike its neighbors above; it does not belong in the zero-call group |
| `sessionFileExists` | small | **STAYS** — an assertion |

**`session` is the highest-risk cohort and the likeliest to produce a finding**, because its
`record` had to be assembled from leaf contracts — nothing in this repo has a whole-session contract
to derive from — and `copies: 'claude-mock/bin/claude'` names an external tool rather than a broker.
Every `create*` method builds its lines from `@dungeonmaster/shared/contracts` stream-line stubs, so
the comparison against what the fake CLI really writes is available and should be made.

### 6.4 The three harnesses SURVIVE, and that is the honest end state

**Q9-7's ruling stands and is now load-bearing rather than incidental: do not delete these files, and
do not plan to.** Each keeps exactly the methods §7's table says have no ingredient — `rewindQuestStatus`,
`appendMainSessionLine`, `appendSubagentLine`, `questFolderExists`, `sessionFileExists` — plus the
lifecycle members every spec wires. `dispatch.harness.ts` and `subagentDurationHarness` keep calling
them.

### 6.5 The cohorts, measured

Every one of the 118 falls in exactly one row. Re-derive rather than trusting the counts.

| Cohort | Files | Seeds |
|---|---|---|
| **G** | 18 | a guild and nothing else |
| **GQ** | 8 | guild + quest |
| **GS** | 20 | guild + session |
| **GQS** | 38 | guild + quest + session |
| **PARTIAL:D** | 14 | domain state **plus** `dispatchHarness`'s two mock subprocess queues |
| **PARTIAL:S** | 10 | domain state **plus** `subagentDurationHarness.appendNotification` |
| **PARTIAL:W** | 5 | domain state **plus** a row reached by a bare id from outside the plan |
| **PARTIAL:DW** | 1 | `carved-quest-session-cwds` — both of the two above |
| **PARTIAL:R** | 2 | domain state **plus** `rate-limits.harness.ts`'s three files |
| **PARTIAL:T** | 2 | domain state **plus** `patchQuestStatus`, which walks the real gates |

18 + 8 + 20 + 38 = 84; 14 + 10 + 5 + 1 + 2 = 32; 2 more. 118.

**Under the seam these stop being conversion units and become VERIFICATION scopes.** No spec in any
row is edited; each row names which specs must stay green when a given harness method's body changes.
That is the single largest change this revision makes to the batch plan.

### 6.6 Phase E's "partial" files are no longer partial in any file-editing sense

The 32 `PARTIAL:*` files convert their domain half and keep their other half **because the harness
method they call keeps its body or loses it, not because anybody edits the spec**. `dispatchHarness.queueScript`,
`subagentDurationHarness.appendNotification`, `rateLimitsHarness` and the bare-id reaches are
untouched methods on untouched harnesses. **Nothing in these 32 files changes at all.** They are
pure regression surface, and they are the cheapest verification in the chunk.

### 6.7 Phase F is UNBLOCKED — `transitions` now exists

`home/quest-approved-modal` (6 `patchQuestStatus` calls) and `quest-chat/followup-tab-bar` (1).

The previous revision blocked these because *"`quest-ingredient-broker.ts` declares no
`transitions`"*. **It does now** (`:101-107`), with `reach: questReachRouteBroker`, and
`packages/siegelense-recipes/CLAUDE.md` describes the walk:

> *"`set({ status: … })` on a quest is a WALK, never a plain field write, for every value on the
> declared `to` list … `reach` walks every ordinary hop through `questModifyBroker`, over a shortest
> path computed by `questStatusWalkPathTransformer`."*

**Two cautions, both from that same file, and both decide the batch:**

1. **`in_progress` needs a `baseUrl`.** It seeds the operations relay, which only
   `POST /api/quests/:questId/start` does, so `reach` calls the real route when the target carries a
   `baseUrl` and **THROWS a named error on a write-only target** rather than flipping the field and
   leaving the ledger empty. `patchQuestStatus` is already an HTTP method, so it takes the `baseUrl`
   target and this is the correct behaviour — but it means `patchQuestStatus` and `writeQuestFile`
   genuinely need different targets, which is G0-d's ruling arriving under real load.
2. **`to`'s static type is the un-narrowed `QuestStatus[]`.** The `.filter()` cannot carry literal
   types forward, so `set({ status: 'blocked' })` still TYPECHECKS while the runtime pre-flight
   refuses it with `HydrationTransitionUnreachableError`. **A red here is a correct refusal, not a
   bug** — `created`, `pending`, `paused`, `blocked`, `merging` and `merged` are deliberately off the
   list, and `setRaw` is the only way onto them.

**So `patchQuestStatus` converts, and `rewindQuestStatus` explicitly does not** — the latter is the
gate-bypassing sibling, and keeping it raw is what preserves the distinction the two methods exist to
draw.

---

## 7. What a conversion CANNOT reproduce, named up front

**A file nobody can convert is identified here, not discovered halfway through a batch.**

| What it seeds | Files | Why no ingredient covers it | The answer |
|---|---|---|---|
| mock subprocess response QUEUES (`claudeMockHarness`, `wardMockHarness`) | 15 e2e | the chain's verbs are rows and links. There is no verb for *"the next N times something asks for a subprocess result, answer with these, in this order"* | keep `dispatchHarness.queueScript` / `playAndDrive`. Survey finding 4 |
| real git repo / worktree / branch / commit state | 3 integration | no guild, quest or session has anywhere to put a git ref | moot here — all 3 are inside `orchestrator` and descoped. Still the **first** candidate for a sixth ingredient |
| rate-limit accounting — `usage-ledger.json`, `rate-limits.json`, `dispatch-state.json` | 2 e2e | a fourth domain with no contract in any of the five ingredients | keep `rateLimitsHarness`. Chunk 7 Q7-9 rank 2 |
| a row the LIVE APPLICATION minted, reached by a bare id | 6 e2e | `add`, `filter`, `fromSaved` and `under` are the only ways into a row, and none is *"here is a raw id from outside this plan"* | keep `rewindQuestStatus`, `appendMainSessionLine`, `appendSubagentLine`, `subagentDurationHarness.appendNotification`. Survey finding 2; chunk 7 Q7-6 |
| a work item's foreign key | every quest | `relatedDataItems: ['operations/<id>']` is a prefixed string inside an ARRAY; `links` writes one field to one field | `workItems` stays a FIELD on `quest` — which is what keeps `writeQuestFile` mechanical. Chunk 7 Q7-1 |
| a child accessor under `.under()` | any nested seed | G0-f — `TS2339`, ancestor names are not carried forward | the quest's plain `operations` FIELD via `set()`. Already what callers pass |
| a ward result's detail blob | 2 e2e | one logical entity across two files | **SOLVED** — the quest extra `withWardResultDetail` exists. `riftcarverResults` is the same shape one directory over and remains a finding |
| an unparseable quest file | 3 e2e | a record the contract must REJECT | **SOLVED** — the quest extra `corruptToLegacySchema` exists |
| a gate-walked status change | 2 e2e | `quest` declared no `transitions` | **SOLVED** — §6.7 |

**On the session ingredient's `copies:`.** `siegelense-recipes.md`'s Known gaps and
`recipes-ledger.md` both still say this blocks the `session` AND `subagent` ingredients *"from being
declared at all"*. **That is stale.** Both are declared on disk with `copies: 'claude-mock/bin/claude'`
— a repo-level judgment call `ingredientConfigContract` permits (it demands a non-empty string and
has no opinion on which). The GAP is real; the BLOCK is resolved. §12 Q9-5.

---

## 8. What an agent does with a conversion that will not land

> **A converted test keeps its assertions, exactly. Only its setup changes.**
>
> **If a converted test needs a different assertion to pass, the ingredient is wrong — not the test.**
> The assertions were written against what the app really does, by somebody who was not thinking
> about this framework. **They are the control.**

**Under the seam this rule gets sharper, not softer: you are not editing the spec at all, so ANY
`expect(` diff in a `*.e2e.ts` is out of bounds by construction.** §11.2 makes that a check rather
than a instruction.

**The moment you find yourself opening a spec file to make a harness change land, stop.**

### The steps, in order

1. **Revert the harness method** to its pre-conversion body. `git checkout -- <harness>`.
2. **Run the affected specs ONCE against the original** and capture the output verbatim. That is the
   control's real behaviour, not your memory of it.
3. **Run them ONCE against the converted method** and capture ITS output verbatim. The diff between
   the two IS the finding. A finding without both outputs is an opinion.
4. **Write it into §14**, under the verb or property it defeated — `links`, `defaults`, `set`,
   `setRaw`, `filter`, `copies:`, a route, `transitions`, the fold. Name: the method, the spec, the
   assertion that moved, both outputs, and which ingredient property could not express the setup.
5. **Leave the method raw and move on.** One unconvertible method does not stop a batch; it is the
   batch's output, and §7's table grows a row.
6. **Report it in the commit**, by name, alongside what did convert.

### What you must NEVER do

| Never | Why |
|---|---|
| edit an `expect(` in any `*.e2e.ts` | destroys the control. Under the seam there is no legitimate reason to open a spec at all |
| `toStrictEqual` → `toMatchObject`, or a literal → `expect.any` | the same thing, wearing a disguise |
| widen a harness method's PARAMETERS to make a plan fit | you have changed the seam, and every call site silently means something new |
| leave an `fs` write in a "converted" method body | then it is wrapped, not converted — and §11.3 catches it |
| add a `set()` the original setup did not have | you have changed what the test seeds, which is the thing being measured |
| widen an ingredient's `fields` to admit what one method passes | if the field is real it comes from the repo's own contract by `.pick()`/`.omit()`/`.extend()`. If not, the method has found something |
| `skip` a spec | a skipped test reports green. Revert the harness instead, so it keeps running |
| decide it is "out of scope" | the repo's own standard: there is no out of scope. If the setup cannot be reproduced, that IS the deliverable |

---

## 9. Every target, classified

**Integration — the census's 21.**

| File | Verdict |
|---|---|
| `orchestrator/…/quest/hydrate/quest-hydrate-broker.integration.test.ts` | **EXCLUDED** — `describe('questHydrateBroker')`; its SUBJECT is production code an ingredient calls |
| `orchestrator/…/quest/modify/quest-modify-broker.integration.test.ts` | **DESCOPED** — dependency cycle |
| `orchestrator/…/quest/pause/quest-pause-broker.integration.test.ts` | **DESCOPED** |
| `orchestrator/…/node-dispatch-loop/pre-stamp-in-progress-layer-broker.integration.test.ts` | **DESCOPED** |
| `orchestrator/…/smoketest/clear-prior-quests/…-broker.integration.test.ts` | **DESCOPED** |
| `orchestrator/…/worktree/ensure-quest-branch/…-broker.integration.test.ts` | **DESCOPED** (and seeds only git) |
| `orchestrator/…/flows/agent-prompt/agent-prompt-flow.integration.test.ts` | **DESCOPED** |
| `orchestrator/…/flows/chat-start/chat-start-flow.integration.test.ts` | **DESCOPED** |
| `orchestrator/…/flows/comment-batch/comment-batch-flow.integration.test.ts` | **DESCOPED** |
| `orchestrator/…/flows/quest/quest-flow.integration.test.ts` | **DESCOPED** |
| `orchestrator/…/orchestration/start/orchestration-start-responder.integration.test.ts` | **DESCOPED** |
| `orchestrator/…/quest/handle-signal-back/…-responder.integration.test.ts` | **DESCOPED** |
| **`server/…/flows/quest/quest-flow.integration.test.ts`** | **CONVERTED — §5.** The whole of chunk 9 |
| `hydration/…/plan/run/plan-run-broker.integration.test.ts` | **NOT A TARGET** — the runner every conversion runs THROUGH |
| `hydration/…/fetch/post/fetch-post-adapter.integration.test.ts` | **NOT A TARGET** — the framework's own adapter |
| `siegelense-recipes/…/guild-mid-execution-recipe-broker.integration.test.ts` | **NOT A TARGET** — already uses the framework |
| `siegelense-recipes/…/quest-advances-one-step-recipe-broker.integration.test.ts` | **NOT A TARGET** |
| `siegelense-recipes/…/session-with-nested-chain-recipe-broker.integration.test.ts` | **NOT A TARGET** |
| `mcp/…/flows/mcp-server/mcp-server-flow.integration.test.ts` | **NOT A TARGET** — persists nothing; `QuestStub` ×33 are JSON-RPC arguments |
| `server/…/flows/design/design-flow.integration.test.ts` | **NOT A TARGET** — read in full: every case asserts a 400/404 against an unseeded route |
| `server/…/flows/guild/guild-flow.integration.test.ts` | **NOT A TARGET** — `setupTestHome` then error paths. No guild is ever created |
| `server/…/flows/session/session-flow.integration.test.ts` | **NOT A TARGET** — 24 lines, one "guild not found" assertion |

**e2e — the census's 118.** No file is edited; §6.5's cohorts are verification scopes. No e2e target
is excluded outright.

---

## 10. The running mark — what it measures, and what it should

### 10.1 The old mark counts no seeding call at all

**Measured 2026-09-16** by walking the 118 e2e targets and categorising every occurrence of the
three identifiers:

| | import lines | constructions | lifecycle / other | total |
|---|---|---|---|---|
| `guildHarness` | 118 | 392 | 0 | **510** |
| `questHarness` | 70 | 188 | 1 | **259** |
| `sessionHarness` | 72 | 74 | 1 | **147** |
| | **260** | **654** | **2** | **916** |

**Every one of the 916 is either an import line or a constructor call. Not one is a seeding method
call.** The census counts the harness IDENTIFIER, and the seeding call usually does not contain it —
`packages/web/src/flows/home/quest-creation.e2e.ts` shows both forms in one file:

```
 4 | import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
16 |     await guildHarness({ request }).cleanGuilds();
20 |     await guildHarness({ request }).createGuild({ name: 'Quest Guild', path: GUILD_PATH });
```

Line 4 is counted and is a teardown-free import. Line 16 is counted and is teardown, not seeding.
Line 20 is counted once though it both constructs and seeds. And the extremely common two-line form —

```ts
const guilds = guildHarness({ request });
const guild = await guilds.createGuild({ … });
```

— counts the first line and is **blind to the second**.

### 10.2 What that means for the mark

> **Under the harness seam, `--progress` cannot fall by even one.** Not "never reaches zero" — never
> moves. Every import line and every construction survives a change that replaces only a method body.

And it was never going to measure the conversion even under direct-import: it would fall only when a
spec stopped naming a harness entirely, which §6.4 says is not the end state for any of the three.

**So the spec's own sentence — `siegelense-recipes.md:1700-1702`, *"zero across all three harnesses is
the conversion finished, the number only falls, and a batch that does not move it converted
nothing"* — is wrong on all three clauses, and it is wrong about a number nobody can move.** It must
not be used as a batch gate; a build agent held to it will either stop after batch one reporting
failure, or start deleting harness constructions to move it, which is the worst outcome available.

### 10.3 The honest mark: `--methods`

Replace it with a per-method census — the shape Q9-7 already reached for (*"deleting a method is the
conversion's real mark"*), made mechanical:

```bash
python3 scrolls/tools/seed-census.py --methods
```

Per harness, per method, it prints three columns:

| Column | Meaning |
|---|---|
| **call sites** | method calls across the 118 e2e targets — §6's numbers |
| **routes through the framework** | the method body reaches `dmRegistryBroker` |
| **still writes directly** | the body still holds an `fs.*` call or a bare `request.post('/api/…')` |

**Done is:** every method §6 marks CONVERT has `routes through the framework = yes` and
`still writes directly = no`, and the set with `still writes directly = yes` is **exactly** §7's
table — `rewindQuestStatus`, `appendMainSessionLine`, `appendSubagentLine`, plus the two assertion
readers and the untouched `dispatchHarness` / `rateLimitsHarness` methods.

**The mark that matters is the third column, not the first.** A call-site count can fall because
somebody deleted a spec; a method that no longer writes to disk itself cannot be faked, and the
target state is a NAMED LIST rather than a number.

| | Today | When chunk 10 finishes |
|---|---|---|
| `--progress` (identifiers) | 916 | **916.** Unchanged, and that is correct, not a failure |
| methods still writing directly | all of them | **5**, each named in §7 |
| `expect(` lines changed in `*.e2e.ts` | 0 | **0** |

---

## 11. How the browser half stays a proof

**The question this revision has to answer honestly:** if no spec changes, the assertions hold
trivially — so where is the pressure?

### 11.1 The pressure was never in the spec's text; it is in the STATE

A spec asserts against a rendered browser reading a real server reading real files. It does not
assert against its own setup call. **When `guildHarness.createGuild`'s body becomes
`dm.guilds.add(1, …)`, the bytes on disk and the rows in `config.json` are produced by completely
different code, and 243 call sites' worth of downstream assertions are the oracle for whether they
match.** If the `guild` ingredient mints a different `urlSlug`, a different `createdAt` shape, or
skips the outbox append, specs go red with assertions nobody touched.

**An unchanged spec is a STRONGER control than a rewritten one, not a weaker one.** The failure mode
the rule exists to prevent is an agent adjusting a test until it passes. A spec the agent never opens
cannot be adjusted. The previous revision's §8 spent seven rows forbidding edits an agent might make
to a spec; under the seam, those edits are not available.

### 11.2 Check one — the assertion diff, mechanically

Already proved on the landed conversion (§5.2): 430 lines changed, zero `expect(` lines. For the
browser half it becomes a gate, not an observation:

```bash
git diff --unified=0 origin/master -- 'packages/web/src/**/*.e2e.ts' | grep -cE '^[+-].*expect\('
```

**Must print `0` at every batch boundary.** A non-zero answer is either a finding somebody failed to
write into §14, or a control that has been destroyed — and the two are told apart by reading §14, not
by the number.

### 11.3 Check two — the method holds no direct write

**The hole the seam opens, and the one thing that could make this a refactor nobody can check: a
harness method can be made to pass by NOT using the ingredient.** An agent that cannot make
`writeQuestFile` work through the `write` route can quietly leave the `fs.writeFileSync` in place,
add an unused import, and report a green suite.

`--methods`' third column closes it: **a converted method body contains no `fs.*` call and no bare
`request.post('/api/…')`.** This is the check that makes "converted" mean something, and it is why
§10.3 puts it above the call-site count.

### 11.4 Check three — where a spec SHOULD change, and it now legally can

§0.2 proved a spec can import the framework. **Three cases where it should, and where the assertions
then become a real independent control in the classic sense:**

| Case | Why the seam cannot serve it | Batch |
|---|---|---|
| a spec needing guild + quest + session as **one plan**, one `run`, one transaction | three harness methods are three separate runs; the whole point of a recipe is the linked instance | one GQS spec, in 10.13 |
| a spec whose setup wants a **named catalogue recipe** (`guild-mid-execution`, `session-with-nested-chain`) | the catalogue is what `recipes {}` prints and what a siegelense `seed` step names; a harness method hides it | one spec per recipe, in 10.14 |
| a spec proving the **two-route comparison** — the same `fields` through `api` and through `write` | neither harness method offers both, by construction | 10.1, as the `api` probe's other half |

**Convert exactly these, and no more.** Q9-6's ruling still holds against a catalogue that grows one
entry per spec: *"a catalogue that grows wide instead of deep"* is the object-mother failure the
specification explicitly refuses.

### 11.5 What the browser half honestly proves, and what it does not

**Proves:** the `api` routes against a live server; the `write` routes against a real home in the
spec's own process; `links` (`guild`→`quest` by `guildId`, `guild`→`session` by
`{as:'cwd', from:'path'}`); `defaults(index)` under real variation; `transitions.reach` against real
gates; both quest `extras` and the session `extra`; the fold; and `copies:` for three ingredients —
against 118 specs' worth of assertions written by people who had never heard of this framework.

**Does not prove:** `recipes {}`, the `seed` step, or params validation at the MCP boundary. That is
step 3, it is not optional, and it cannot be folded in — `siegelense-recipes.md:1740-1743`.

**Honest limitation, stated rather than buried:** because no spec changes, the browser half does not
test the CHAIN'S ERGONOMICS — whether a person writing a recipe finds the verbs natural. It tests
whether the ingredients reproduce real state. §11.4's handful of directly-converted specs are the
only ergonomic evidence this chunk produces, and they are a small sample. **That is a real gap and it
should not be claimed as covered.**

---

## 12. Open questions, each with a recommendation

### Q9-1 — the census is stale in two directions *(was: over-reports by ten)*

It still lists 11 descoped `orchestrator` targets, and its `--progress` mode measures something that
cannot move (§10).

**Recommendation, three edits:** skip `packages/hydration` and `packages/siegelense-recipes` (the
framework is not a conversion target of itself); add a `DESCOPED` section for the `orchestrator`
targets carrying the specification's line number as the reason; and **add `--methods` per §10.3**.
Keep `--progress` working and print a one-line warning on it naming §10. Do this BEFORE batch 10.1.

### Q9-2 — how does an `api` route's return satisfy `record`? — **CLOSED**

The routes unwrap. `dmHttpResponseUnwrapAdapter` in both. The recommendation is what landed. The
remaining proof — one run through a live server — is batch 10.1.

### Q9-3 — one target or two? — **CLOSED, option A**

Two targets, built once in `dm-target.harness.ts`. The seam makes the cost two module-level builders
instead of a per-spec line, which is what made this cheap enough to stop arguing about.

### Q9-4 — does `orchestrator` devDepending on `siegelense-recipes` resolve? — **CLOSED, moot**

Descoped by the specification (`siegelense-recipes.md:1805`). **Do not spike it, and do not copy
ingredients into `orchestrator`** — that is the duplication the package exists to end.

### Q9-5 — the spec and the ledger are stale about `session`'s `copies:` — **OPEN**

`siegelense-recipes.md`'s Known gaps and `recipes-ledger.md` line 101 both still say `session` and
`subagent` are blocked from being declared. They are declared.

**Recommendation: correct both in the round that reads this plan.** The GAP (what `copies:` names
when the imitated writer is an external tool) stays open and is a real Part 5 question; the BLOCK is
resolved, and reading it as open sends somebody to re-decide a decision already made in the code.

### Q9-6 — does a converted spec declare its own recipe, or grow the catalogue? — **NARROWED**

Under the seam most setups live in a harness method and declare an inline `recipe()` there.

**Recommendation: inline `recipe()` in the harness method by default; promote to
`packages/siegelense-recipes/src/brokers/<name>/recipe/` only when a THIRD method or spec wants the
same shape.** Revisit at the end of 10.14 with the count of shapes that actually repeated.

### Q9-7 — the three seeding harnesses, after the conversion — **CLOSED, and promoted**

They survive, holding exactly §7's methods. **This is no longer a recommendation but the plan's
measurement** — §10.3's third column.

### Q9-8 — `buildQuestJson` and `extractUrlSlug` — **SPLIT**

- **`buildQuestJson`: delete in 10.0.** Dead code, no caller anywhere, confirmed twice.
- **`extractUrlSlug`: do NOT delete.** The previous revision's "deleted, not converted" was written
  when a spec was expected to change; under the seam its 177 call sites are exactly why the signature
  must stay. **Delete its BODY's re-derivation, keep the method.** §6.1.

### Q10-1 — NEW — does the `dm-target` harness build one target or a target factory?

The teardown is guild-scoped; the two targets differ only by `baseUrl`.

**Recommendation: one harness exposing `apiTarget()` and `writeTarget()` plus the shared
`beforeEach` teardown.** Assert `process.env.DUNGEONMASTER_HOME` is set in the constructor and throw
naming `playwright.config.ts:32` if it is not (G0-e). A silent wrong home is the most expensive
failure available here — every write lands somewhere plausible and nothing says so.

### Q10-2 — NEW — should `createQuest` convert at all?

It is already an HTTP POST to the real route, and the `api` route walks that same intake path.
Converting it swaps one real HTTP call for another that also mints ids and seeds a chat work item.

**Recommendation: convert it, in 10.4, and treat a no-op diff as the finding.** If the `api` route
and the harness produce byte-identical state, that is the two-route comparison working and it is
worth recording. If they differ, 176 call sites will say so immediately — which is the cheapest
possible place to learn it.

### Q10-3 — NEW, CLOSED — §6.3's `sessionHarness` figures, re-measured

`python3 scrolls/tools/seed-census.py --methods` is the authoritative per-method call-site count, and
§6.3 carries what it prints as of this revision: `createSessionFile` 139, `cleanSessionDirectory` 22,
`createSessionWithAssistantText` 14, `appendMainSessionLine` 5, `createSubagentTailMultiEntry` 2,
`createAnsweredClarificationSession` 2. The last of these has real call sites and does not belong
among the zero-call methods deferred as "CONVERT last, or leave" — every other method in that group
is genuinely 0 per the census. `createSessionFile`'s weight is why 10.10 and 10.11 (§15) each convert
one method instead of two.

**Recommendation: re-derive every figure in §6.3 from `--methods` before relying on it, and do not
carry a count forward by hand** — a hand-copied figure drifts from the tree the moment a spec is
added or removed, and `--methods` is a five-second command against the live checkout.

---

## 13. What changed in this revision, and why

| Was | Now | Because |
|---|---|---|
| "a spec cannot import an ingredient" | **it can** — proved by a passing ward run | `enforce-import-dependencies` is off for `**/*.e2e.ts` (§0.2) |
| G0-a: no package exports | resolved | `.`/`./brokers`/`./contracts`/`./statics` all present |
| G0-b: no consumer declares the dep | resolved | `web` devDepends; `@dungeonmaster/server` dropped from recipes |
| G0-c: `api` returns an envelope | resolved | `dmHttpResponseUnwrapAdapter` in both routes |
| chunk 9 = 11 orchestrator files in 5 batches | **1 file, landed** | `siegelense-recipes.md:1792-1796` descopes orchestrator |
| Phase F blocked — no `transitions` | **unblocked** | `quest-ingredient-broker.ts:101-107` |
| `withWardResultDetail` / `corruptToLegacySchema` planned | **exist** | `quest-ingredient-broker.ts:116-125` |
| `--progress` is the running mark | **it measures no seeding call** | §10.1's measurement |
| batches = 9 spec files per agent | **batches = 1 harness method + its verification scope** | the seam; specs are not edited |
| `extractUrlSlug` deleted | **body changed, signature kept** | 177 call sites |

---

## 14. Findings this conversion produced

**Empty on purpose.** §8 step 4 fills it. A batch that produced no finding writes nothing here and
says so in its commit; a batch that produced one and did not write it here has lost the only thing
the batch was for.

| Batch | Harness method / spec | Verb or property it defeated | The assertion that moved | Both outputs |
|---|---|---|---|---|
| — | — | — | — | — |

---

## 15. Chunk 10 — the revised batches

**A batch is ONE harness method's body, plus the cohort that verifies it.** Not a set of spec files
— no spec file is edited except in 10.13 and 10.14.

**Why this size.** The repo's 1–3-files-per-agent rule still binds, and a batch here touches one or
two files: the harness, and occasionally the `dm-target` harness. The *verification* is wide (a whole
cohort of specs) but costs no edits, and **four concurrent browser walks is this repo's stated cap**,
so three working agents plus one verification slot saturates it exactly.

**Green between batches means, literally:**

```bash
npm run ward -- --only lint,typecheck -- <the harness files touched>
npm run ward -- --only e2e -- <the cohort's spec files>
git diff --unified=0 origin/master -- 'packages/web/src/**/*.e2e.ts' | grep -cE '^[+-].*expect\('   # must be 0
python3 scrolls/tools/seed-census.py --methods                                                      # the third column moved
```

**Do not edit the repo while an e2e batch runs**, and serialise the verification runs through the
batch lead — two agents running scoped e2e against overlapping specs is the real risk here.

| # | Converts | Verification scope | Proves |
|---|---|---|---|
| **10.0** | `dm-target.harness.ts` (new); delete `buildQuestJson`; `--methods` added to the census | none — no behaviour changes | the two targets, the teardown, the `DUNGEONMASTER_HOME` assertion (G0-e, Q10-1) |
| **10.1** | `guildHarness.createGuild` → `api` **+ the two-route comparison spec** (§11.4) | **cohort G, 3 files only** — this is the probe | G0-c's unpaid half: an `api` route through the runner against a live server. **Widen only once green** |
| **10.2** | `createGuild` cohort G remainder | cohort **G**, all 18 | the `api` route at cohort scale |
| **10.3** | **`extractUrlSlug` body** — read the real field | cohort **G** + every spec asserting a slug | **the highest-value finding surface in the chunk** (§6.1). A moved assertion here is the deliverable |
| **10.4** | `guildHarness.cleanGuilds` → target teardown | cohort **G** | that teardown is the target's job, with the sequential-delete rule intact |
| **10.5** | `questHarness.createQuest` → `api` | cohort **GQ**, 8 | Q10-2. The `guild`→`quest` link over HTTP |
| **10.6** | `questHarness.writeQuestFile` → `write`, home-only target | **GQ**, 8 | **G0-d under real load.** `status` + literal-id `workItems` — exactly what `api` cannot express |
| **10.7** | `writeQuestFile` — the field long tail (`operations`, `flows`, `comments`, `wardResults`, `sessions`, `planningNotes`, `questType`, `steps`, `worktreePath`) | **GQS** execution-panel + ward sub-groups | `workItems` as a FIELD (Q7-1) and `designDecisions`/`toolingRequirements` — survey finding 7, which chunk 7 says *"disappears"* |
| **10.8** | `writeUnparseableQuestFile` → `corruptToLegacySchema`; `writeWardResultDetail` → `withWardResultDetail` | `home/unreadable-quest-file-reported`, `malformed-quest-file-reported`, `ward-crash-detail`, `ward-discovery-mismatch-detail` | **`extras` outside an ingredient's own test**, for the first time |
| **10.9** | `questHarness.patchQuestStatus` → `transitions.reach` | **PARTIAL:T** — `quest-approved-modal`, `followup-tab-bar` | §6.7. A gate-walked status change, and that `rewindQuestStatus` stays raw beside it |
| **10.10** | `sessionHarness.createSessionFile` → `write` route | cohort **GS**, 20 | the `{ of:'guild', as:'cwd', from:'path' }` link — the case `from` exists for |
| **10.11** | `sessionHarness.createSessionWithAssistantText` | cohort **GS**, 20 | assistant-text session content over the same link, verified against the same cohort as 10.10 |
| **10.12** | `sessionHarness` sub-agent family; `cleanSessionDirectory`/`cleanSessionFiles` → teardown | **GS** + **GQS** replay/transcript sub-group | the `subagent` ingredient, and `copies: 'claude-mock/bin/claude'` against transcripts the real fake CLI also writes |
| **10.13** | `createNestedSubagentSessionFiles` → the session extra `withNestedChain`; **one GQS spec converted directly** (§11.4) | **GQS**, 38 | one plan, one `run`, three linked ingredients — the ergonomic sample |
| **10.14** | **two specs converted directly** to name catalogue recipes (§11.4) | those two | that `recipes {}`'s catalogue entries are reachable by name from a spec. Q9-6's evidence |
| **10.15** | nothing — **the regression pass** | **PARTIAL:D** (14), **:S** (10), **:W** (5), **:DW** (1), **:R** (2) — all 32 | §6.6: none of these files changes, so this is pure regression. `--methods`' third column must now equal §7's list exactly |

**`createSessionFile` and `createSessionWithAssistantText` each get their own batch, 10.10 and 10.11.**
§6.3's `createSessionFile` count is the largest single method converted anywhere in the sessionHarness
tail — well past `createSessionWithAssistantText` and past the whole sub-agent family combined — so it
does not bundle with a smaller method, the same way `createQuest`, `writeQuestFile` and `extractUrlSlug`
each already stand alone. The rest of chunk 10's batches are numbered 10.12 through 10.15, in the order
shown above.

**10.3 and 10.9 are the two batches most likely to produce a real finding**, and they are the two
worth giving an opus agent. 10.3 because the production slug rule is genuinely wider than the
harness's, and 177 assertions have never seen the difference. 10.9 because it is the first time
anything walks real gates through `reach`, and `in_progress`'s deliberate throw on a write-only
target is a behaviour no test has exercised.

**10.15 is not a formality.** It is the only batch that proves the 32 partially-converted files still
pass with every convertible harness method rewritten underneath them — and it is where a silent
regression from any earlier batch surfaces.
