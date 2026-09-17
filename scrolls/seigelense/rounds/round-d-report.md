# Round D — the sad paths, driven for real (`recipes-chunk-12-combinatorial-rounds.md`, §9)

Every one of D1–D21 is DRIVEN or BLOCKED this round from a real run or a real, cited absence — never
read and predicted. Outcomes use the plan's own §5 vocabulary (`RULE`, `OBSERVABLE`, `CONFIRMED`,
`BLOCKED`) exactly. Every scratch script lives under `<repoRoot>/tmp/round-d/`, run via
`npx tsx --conditions=source tmp/round-d/<file>.ts` from the repo root; every quoted line below is
copied verbatim from a real run. Two cases (D7, D17, D19 — three, really, since D7 is A11 and D17/D19
are A6/A7 relisted) are re-run from the existing Round A scripts rather than re-written, since they are
the identical case under a different label; every other case has its own new scratch file.

**Tier discipline.** This round stayed at tiers 1–3 throughout, with one exception explicitly
justified below: D1 needs a `baseUrl`, which tier 3's own definition excludes, but needs no server —
a closed port IS the absence of one, not an instance of "starting a server." No case in this round
started a dev server, a browser, or a live siegelense instance.

## The table

| Case | What it asked | Outcome | Evidence |
|---|---|---|---|
| **D1** | connection refused, on an `api` route | **CONFIRMED, and drivable with NO server at all** — the plan's own §4 table files this at tier 4 | `tmp/round-d/d1-d14.ts` — a scratch `remote` ingredient's `api` route calls the REAL `fetchPostAdapter` against `http://127.0.0.1:39182` (confirmed nothing listens there via `ss -ltn`). Run: `THREW: HydrationRouteFailedError: recipe "d1-scratch": ingredient "remote"'s "api" route at http://127.0.0.1:39182/api/remote refused the connection: Error: POST http://127.0.0.1:39182/api/remote refused: connect ECONNREFUSED 127.0.0.1:39182` — names the ingredient, the route, the URL and the real OS error |
| **D2** | the server answers 4xx/5xx, body verbatim | **BLOCKED, tier 4** — a genuine 4xx/5xx round-trip needs an actual listening endpoint; hand-constructing the thrown `{url,status,body}` shape myself would only prove my own fixture matches the transformer that reads it, not that the framework behaves correctly under a real answer | Not driven. Existing, colocated, not-yet-rerun evidence: `packages/hydration/src/brokers/plan/run/plan-run-broker.integration.test.ts:400-429`, `'ERROR: {api route answers 500 with a real body} => the message carries the response body verbatim'`, built on `packages/hydration/test/harnesses/api-target/api-target.harness.ts` (`createServer` on an ephemeral port). That harness's own comment (`api-target.harness.ts:63-67`) independently documents the exact "bad port" gotcha this round's D1 script hit and worked around |
| **D3** | the server answers 2xx with a shape `record` rejects | **CONFIRMED** | `tmp/round-d/d3-d4.ts` — a `thing` ingredient whose `record` requires `urlSlug`; its `api` route (selected via `baseUrl` set, route itself never makes a real call — a route is just a function, same as a `write` route already is) returns `{id:'api-1'}`. Run: `THREW: HydrationRecordShapeError: recipe "d3d4-scratch": ingredient "thing"'s "api" route answered 2xx with a record that field "urlSlug" rejects: Required` |
| **D4** | the same failure through a `write` route, and whether the message still wrongly claims "answered 2xx" | **CONFIRMED, and the previously-recorded wording defect is now FIXED** | Same script. Run: `THREW: HydrationRecordShapeError: recipe "d3d4-scratch": ingredient "thing"'s write route returned a record that field "urlSlug" rejects: Required` — no "answered 2xx" anywhere. Direct read confirms the fix is structural, not accidental: `hydration-record-shape-error.ts:40-43` branches `route === 'write' ? "write route returned a record…" : "\"${route}\" route answered 2xx with…"` |
| **D5** | the write fails, `EACCES` | **CONFIRMED** | `tmp/round-d/d5-d15.ts`, using the real `fileTargetHarness.denyWrites` and real `fsEnsureWriteAdapter`. Run: `THREW: HydrationWriteFailedError: recipe "d5-scratch": ingredient "locked"'s write route failed writing "/tmp/hydration-runner-c9f713e3/locked/row.json": Error: EACCES: permission denied, open '/tmp/hydration-runner-c9f713e3/locked/row.json'` then `locked/row.json exists after D5: false` |
| **D6** | the parent directory does not exist | **CONFIRMED — the pass is silence** | `tmp/round-d/d6.ts`, real `fsEnsureWriteAdapter` against a brand-new `mkdtemp` home with no subdirectories at all. Run: `home entries BEFORE run: []` → `NO THROW` → `file landed: true` → `contents: {"title":"x"}` — both `guilds/` and `guilds/g1/` are silently created |
| **D7** | `reach` throws — the gates refused | **CONFIRMED (= A11, re-run)** | `npx tsx --conditions=source tmp/round-a/a11.ts` → `THREW: HydrationTransitionRefusedError: recipe "a11-scratch": ingredient "quest" cannot go to "blocked" from "created": a quest needs at least one session before it can go to blocked` — still holds, unchanged from Round A |
| **D8** | the query fails mid-plan, distinctly from zero match | **CONFIRMED, both halves** | `tmp/round-d/d8.ts`. Throwing query: `THREW: HydrationQueryFailedError: recipe "d8-scratch": ingredient "task" filter where {"role":"riftcarver"} could not query: Error: connect ECONNREFUSED 127.0.0.1:9 (scratch, unreachable app)`. Empty-match query: `THREW: HydrationFilterExpectationError: recipe "d8-scratch": ingredient "task" filter where {"role":"riftcarver"} expected "some" but matched 0 row(s)` — two distinct classes, exactly as designed |
| **D9** | the transaction rolls back | **BLOCKED — cannot be driven against a file target, by design** | `discover({grep:"new HydrationTransactionRolledBackError"})` finds exactly two hits, both inside the error class's own file and its own message-shape test — zero production throw sites. `packages/hydration/CLAUDE.md:129-131`: *"`HydrationTransactionRolledBackError` has no thrower in this package, by design… Nothing inside this framework throws it."* `sqlTargetHarness` (chunk 6b) does not exist anywhere in the repo (`discover({grep:"sqlTargetHarness"})` returns only planning-doc hits) |
| **D10** | two ops racing the same file | **CONFIRMED — no error, no race** | `tmp/round-d/d10.ts` — two rows' write routes each log `start-n`/`end-n` around a real 30ms delay. Run: `recorded route call order: ["start-1","end-1","start-2","end-2"]` — strictly serial, zero interleaving |
| **D11** | the recipes package was never built | **CONFIRMED, and drivable with NO live instance** — the plan's own §4 table files this at tier 5 | `tmp/round-d/d11.ts`, against an ISOLATED fake repo root under the OS tmp dir (never the real `packages/siegelense-recipes/dist`). Package absent: `THREW: RecipesPackageMissingError: No recipes package found at /tmp/dm-d11-XSJnhk/packages/siegelense-recipes. Run "dungeonmaster init" to scaffold packages/siegelense-recipes.` Present, unbuilt: `THREW: RecipesBuildMissingError: Recipes package built output not found at /tmp/dm-d11-zZExLL/packages/siegelense-recipes/dist/index.js. Run "npm run build --workspace=@dungeonmaster/siegelense-recipes" to build it.` Both refusals reproduce identically through `recipesReadBroker` (the listing call) as well as `recipesLocateBroker` directly |
| **D12** | a recipe's params fail validation | **CONFIRMED, and drivable with NO live instance** — driven against the REAL, built `packages/siegelense-recipes`, through the real `stepSeedBroker`, no mock | `tmp/round-d/d12.ts`, `LaneSessionStub({browser:null})` (a plain data value, no browser, no dev server). Unknown recipe: `THREW: RecipeUnknownError: Unknown recipe "not-a-real-recipe". Known recipes: guild-mid-execution, quest-advances-one-step, session-with-nested-chain.` Unwanted param on a paramless recipe: `THREW: RecipeParamsRefusedError: Recipe "guild-mid-execution" does not accept the param "x". This recipe takes no params.` Missing required param: `THREW: RecipeParamsRefusedError: Recipe "session-with-nested-chain" requires the param "guildPath", which was not supplied. Accepted params: guildPath.` Wrong key: `THREW: RecipeParamsRefusedError: Recipe "session-with-nested-chain" does not accept the param "wrongKey". Accepted params: guildPath.` — all four refused before the recipe's own seed entry is ever dynamically imported |
| **D13** | stop the server MID-PLAN | **BLOCKED, tier 5** — needs a booted `LaneSession` from `laneBootBroker` (a real dev server) and a `seed` step running against it, killed mid-flight; explicitly out of scope per this round's brief | Not driven. `run-execute-broker.ts` and `laneBootBroker` both require a genuinely live lane; no fake/isolated substitute exists the way D11/D12 found for the listing and seed-params checks |
| **D14** | a half-run plan leaves what landed | **CONFIRMED — no undo, nothing on disk says a run was partial** | Same run as D1: `HOME notes/ after run: ["note-1.json"]` and `note file contents: {"id":"note-1","text":"landed before the failure"}` — the earlier op's file survives untouched; nothing in the thrown error or on disk marks the run as incomplete beyond the exception itself |
| **D15** | make the home read-only MID-plan | **CONFIRMED** | `tmp/round-d/d5-d15.ts`, second half — op A's own write route calls `denyWrites` on op B's directory right after A lands. Run: `THREW: HydrationWriteFailedError: recipe "d15-scratch": ingredient "locked"'s write route failed writing "…/locked/row.json": Error: EACCES…` then `first/row.json exists after D15 (should be true): true` and `locked/row.json exists after D15 (should be false): false` |
| **D16** | hand `under()` a dead id, as a sad path | **CONFIRMED — the worst outcome in this round: total silence, no error at all** | `tmp/round-d/d16-c8.ts` — `dm.sessions.under({guildId:'guild-that-was-never-created'}).add(1,…)` against a file-target write route. Run: `home entries BEFORE run: []` → `NO THROW — pre-flight had nothing to refuse` → `manufactured path exists: true` → `contents: {"guildId":"guild-that-was-never-created","transcript":"ghost session"}` — a directory for a guild that was never created is manufactured with no warning anywhere. Independently confirmed the same way by Round C's own `C8` (`tmp/round-c-report.md` line 31: *"no refusal anywhere, and the target silently manufactures the missing guild directory"*) |
| **D17** | pre-flight: an unservable route (= A6, re-run) | **CONFIRMED, unchanged from Round A** | `npx tsx --conditions=source tmp/round-a/a6.ts` → `THREW: HydrationRouteUnavailableError: recipe "a6-scratch": ingredient "guild" needs a route this target cannot serve. Routes it declares: api. The target lacks a baseUrl, so the api route has nothing to call` then `HOME CONTENTS after run: []`. `tmp/round-a/a6-listing.ts` → `{"serverless":false,"needsServerFor":"guild"}` |
| **D18** | pre-flight: `fromSaved` naming a record no op saves, or one declared LATER, or a field its record never declares | **CONFIRMED, three sub-cases** | `tmp/round-d/d18.ts`. Unknown name: `THREW: HydrationSavedRecordMissingError: … calls fromSaved("ghost"), but no op in this plan saves that name. Names saved by this plan: guild`. Forward reference: `THREW: HydrationSavedRecordMissingError: … calls fromSaved("future"), but no op in this plan saves that name. Names saved by this plan: future`. Known name, unknown field: `THREW: HydrationSavedFieldMissingError: … calls fromSaved("guild", "urlSlug"), but the record saved as "guild" never declares that field. Fields it declares: id, name` |
| **D19** | pre-flight: a row whose `links` no ancestor supplies (= A7, re-run) | **CONFIRMED, unchanged from Round A** | `npx tsx --conditions=source tmp/round-a/a7.ts` → `THREW: HydrationUnlinkedRowError: recipe "a7-scratch": ingredient "quest" needs a "guild" ancestor to fill its link, but this row has none — including a row added at the top level, which the type system allows freely` then `HOME CONTENTS after run: []` |
| **D20** | pre-flight: a chain call needs `query`/`update`/`remove` and the ingredient declares no matching route | **CONFIRMED, all three verbs** | `tmp/round-d/d20.ts`. `filter()`: `THREW: HydrationRouteVerbUnavailableError: … ingredient "writeOnly" declares no "query" route, so a call needing one cannot run`. Matched-row `remove()`: `THREW: … declares no "remove" route …`. Matched-row `set()` on a plain field (needs `update`): `THREW: … ingredient "queryableNoUpdate" declares no "update" route …` |
| **D21** | a mid-batch `seed` failure halts the batch and marks the instance unusable | **BLOCKED, tier 5** — needs a genuinely booted `LaneSession` (`laneBootBroker`, a real dev server) and `runExecuteBroker`'s own batch loop; no isolated substitute exists the way D11/D12 found | Not driven. Read directly: `instance-state-contract.ts` types `InstanceState` as exactly `alive`, `killed`, `dead`, `pruned` or `unknown` — no `unusable`/`crashed` member exists among the five, so whatever "marks the instance unusable" means today is not a literal state value; it was not possible to confirm or deny its exact mechanism without booting a lane |

## Findings this round adds beyond what the plan already predicted

- **D16 is the sharpest result in this round, and it is a CONFIRMATION, not a new bug.** `under()`
  handed a dead id produces no error of any kind and silently writes a real directory to disk for a
  guild that was never created — exactly the "half-written world that reports success" this round's
  brief calls the worst available outcome. The framework's own decision (`siegelense-recipes.md`'s
  `under()` section, and this plan's own C8 write-up) already treats this as intentional — *"the id's
  validity is the target's business"* — so nothing here is a code defect to fix. It is, however, now
  driven for real rather than reasoned about, and independently reproduced by Round C's own C8 script
  against a different fixture, which is as strong a confirmation as this round can offer.
- **D4's previously-recorded wording defect is fixed.** `recipes-ledger.md` (an earlier pass) recorded
  that `HydrationRecordShapeError`'s message still said "answered 2xx" even for a `write` route,
  which never answers a status. Direct read of `hydration-record-shape-error.ts:40-43` today shows the
  message branches correctly on `route === 'write'`, and D4's own run confirms the write-route message
  reads "write route returned a record…" with no "2xx" anywhere. Ledger line numbers for the original
  note have since shifted (the ledger has grown since), so this is stated from the source fix directly
  rather than from a stale cross-reference.
- **D11 and D12 are both drivable with no live instance at all, contradicting the plan's own §4 tier
  table** (which files both at tier 5, "a live instance … minutes"). `recipesLocateBroker` walks up
  from `process.cwd()` to the nearest `.dungeonmaster.json`, so an isolated scratch directory carrying
  that one marker file is a real repo root as far as the broker is concerned — no risk to the shared
  `packages/siegelense-recipes/dist` other concurrent sessions in this worktree may depend on.
  `stepSeedBroker`'s own test file already proves a headless `LaneSession` (`browser: null`) runs the
  seed step fine, since seeding is not a browser verb — this round confirms the same thing against the
  REAL package rather than a mocked proxy. This is the same shape of finding Round A made for A5/A6:
  the plan's own tier assignment is a documentation gap, not a rule about what the code needs.
- **The `siegelense-recipes-ledger.md` "Part 6" section is stale relative to what is built.** That
  section states *"No `stepSeedBroker`, `recipesSeedRunBroker` or `recipesListingBuildBroker` exists
  anywhere under `packages/siegelense{,-recipes}/src/brokers/`."* All three now exist and were driven
  for real in D11/D12 above, against three real recipes (`guild-mid-execution`,
  `quest-advances-one-step`, `session-with-nested-chain`). This matches exactly what this round's brief
  flagged before driving began — *"the listing call and the seed step both exist now."*
- **No third instance of the "message names the symptom, not the rule" pattern.** Round A found this
  for `TS2722` (A16, an undeclared `extra`) and Round B found it for `TS2532` (B5, a skip-one link) —
  both compile-time diagnostics. Every Round D case is a RUNTIME sad path, and every one that throws
  names its ingredient and the specific route/verb/field/value involved in full sentences, not a raw
  diagnostic code. The only readability wrinkle found is D18b: the message for a forward-referenced
  `fromSaved` lists the very name it just called missing under "Names saved by this plan" (because the
  plan's FULL saved-name list is deliberately shown regardless of position, per
  `plan-preflight-broker.ts`'s own header comment) — correct by design, but worth a reader's second
  look the first time they hit it.
- **D9 and D21 both cite a real, checkable absence rather than an assumption.** D9's zero-throw-sites
  claim is a `discover` grep result, not an inference from documentation alone. D21's "no unusable
  state" claim is a direct read of `instance-state-contract.ts`'s own five-member union, not a guess
  about what the driver *might* do.

## The two questions this round asks, answered plainly

- **When a plan fails part way, what is left on disk, and does anything say so?** Whatever landed
  before the failing op stays on disk untouched (D1/D14, D15, and D5 all confirm this directly).
  Nothing on disk, and nothing in the thrown exception beyond its own message, marks a run as
  partial — a caller has to know which ops preceded the one named in the error to reconstruct what
  survived. This matches the framework's own stated position (`recipes-chunk-04-06-runner.md`'s D14
  row: *"no undo, no cleanup"*) rather than contradicting it; this round adds a real, driven case
  proving it rather than a restatement of the rule.
- **Does each failure name what it was doing?** Yes, for every case that throws — D1, D3, D4, D5, D7,
  D8, D9 (n/a, never thrown), D11, D12, D15, D17, D18, D19 and D20 all name the ingredient plus the
  specific route, verb, field or gate value involved, in a full sentence rather than a bare code. The
  one glaring exception in this round's whole set is D16, which does not fail at all — the silent case
  the round exists to catch, now driven and confirmed for real rather than left as a hypothetical.

## Coverage

All of D1–D21 ran to a real outcome or a cited, checkable BLOCKED reason. **Seventeen are CONFIRMED**
(D1, D3, D4, D5, D6, D7, D8, D10, D11, D12, D14, D15, D16, D17, D18, D19, D20). **Four are BLOCKED**
(D2 and D9 — chunk 6b, needing `apiTargetHarness`/`sqlTargetHarness` respectively for a genuine
answer; D13 and D21 — needing a genuinely booted `LaneSession` and a live dev server, which this
round's brief explicitly excludes). No case was skipped to reach a conclusion, and no case was marked
CONFIRMED or BLOCKED without a real run or a real, cited absence backing it.

Tiers used: **tier 1** (none of D1–D21 needed only the chain — every case needed at least a run
against a target). **Tier 3** (a temp home, mostly no `baseUrl`) drove D3, D4, D5, D6, D7 (via A11),
D8, D9's absence-check, D10, D14, D15, D16, D17 (via A6), D18, D19 (via A7), D20. **D1 needed a
`baseUrl` but no server** — a closed port, not an instance of "starting a server," so it is recorded
as driven rather than blocked despite the plan's own table filing it at tier 4. **D11 and D12 needed
no target and no server at all** — an isolated fake repo root and a plain `LaneSession` data value,
respectively — despite the plan's own table filing both at tier 5.
