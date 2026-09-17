# Step verb — `seed`, plus `start --seed` and the executable recipe book

The eighth step verb, and the one that closes build-order item 3. `look` made a walk able to SEE a screen;
`seed` is what puts the app into the state worth looking at. It also fills `start`'s manifest `seeded` field,
which has read NOT YET since it was written.

Line numbers cite `scrolls/seigelense/siegelense-tooling.md` (`T`) and `scrolls/seigelense/siegelense-recipes.md`
(`R`) unless another file is named.

---

## 1. The requirements table

One row per distinct thing the spec says `seed`, `start --seed` and an EXECUTABLE recipe must do. Graded in §8.

| #   | Requirement | Cite |
|-----|-------------|------|
| S1  | `{ step: 'seed', recipe: '<name>', as: '<binding>' }` runs a recipe against this instance and returns THE IDS IT MADE | T2672-2676 |
| S2  | `as` names a step's output; `{name.field}` reads it back in a LATER step | T2801-2802 |
| S3  | A seed mints runtime ids no file contains, so a later step must reference them with no round trip to the model | T2802 |
| S4  | `seed` is a STEP, placeable anywhere in a batch, as many times as the walk needs — never a prologue | T2908, R284 |
| S5  | A recipe takes its dependencies EXPLICITLY, as named parameters written on the step itself — `{ step:'seed', recipe:'session-with-nested-subagent', guild:'{g.guildId}', as:'s' }` | T2921, R281, R711 |
| S6  | Recipes COMPOSE: one recipe's returned ids are another's parameters, so the catalogue gets DEEPER not wider | T2927-2930, R450 |
| S7  | Seeding while a page is OPEN is the only way to exercise a live-update path — so a seed mid-batch must not disturb the page | T2932-2935 |
| S8  | A recipe touches STATE, never a screen — no ref, no selector, no position, no assertion about a render | R471, R266 |
| S9  | A recipe RETURNS the ids: guild id, slug, quest id, session ids, URLs. A walk cannot address what it cannot name | R427 |
| S10 | `produces:`, `fidelity` and `mirrors:` stay LISTABLE without being RUN — the runner reads the same declaration the listing reads | T2005, R713 |
| S11 | `fidelity: production` means built by calling the REAL code path, and the server does what it really does | R433 |
| S12 | `fidelity: direct` means written straight to disk in the shape production WOULD have made, and must declare `mirrors:` | R434, R282 |
| S13 | `guild-with-three-quests` produces one guild holding three quests, one `in_progress`, at `production` fidelity | T2321-2322, T2343-2344 |
| S14 | `session-with-nested-subagent` produces one session transcript holding an outer sub-agent chain with one chain nested inside it, both finished, at `direct` fidelity | T2318-2320, T2340-2342 |
| S15 | TWO of anything an assertion must tell apart — one row makes "the right one" and "the first one" the same value | R454 |
| S16 | A recipe never calls `Date.now()`, `Math.random()` or `randomUUID()` for anything that reaches a screen | R283 |
| S17 | `start { spec, seed: '<name>' }` seeds at boot and returns `seeded: { … }` on the manifest | T2303-2308 |
| S18 | The `guildId` in `seeded` is NOT the partition guild in the evidence path | T2328-2330 |
| S19 | A `direct` recipe is pure `fs` and tests under `installTestbedCreateBroker`; a `production` one needs a server | R578-582 |
| S20 | A `direct` recipe's test asserts against its `mirrors:` output, never a hardcoded snapshot | R277, R572 |
| S21 | A recipe's returns are declared, so a `satisfies`-shaped check catches a missing one at build time rather than when a walk needs it | R505-506 |
| S22 | An unresolved or misspelled `as:` binding fails LOUDLY and names the binding — never interpolates as a literal | job brief; the `count: 0` family, T1990 |
| S23 | `seed` is NOT a browser step: it touches disk and HTTP, so it must work against a browserless lane too | T2315-2326 (browser steps go missing loudly; seed is not one) |
| S24 | The docs the tool serves must stop saying seeding is impossible | HANDOFF findings row 13 |

---

## 2. What a recipe is handed, and why it cannot hold a page

**`RecipeContext = { apiBaseUrl: ContentText; homePath: AbsoluteFilePath }`**, owned by
`packages/siegelense-recipes/src/contracts/recipe-context/`.

Two fields and no third. `apiBaseUrl` is the lane's **API** origin (`http://<host>:<ports.api>`), not the web
origin — the api process is the one that binds `/api/*`, and going through Vite's proxy would add a hop that
says nothing. `homePath` is the lane's throwaway home, which is both `DUNGEONMASTER_HOME` and `HOME` for the
api process (`laneSpecStatics.API_PROCESS.env`), so it is where `os.homedir()` resolves inside the server and
therefore where a Claude transcript has to land.

**R8 is held by the SHAPE, not by a comment.** There is no field a DOM handle could live in — no page, no ref,
no selector, no rect, no `BrowserSession`. A recipe that wanted one would have to grow a field on this
contract, which is a review rather than a typo. That is the same mechanism `recipeManifestContract` already
uses for its own half of R8.

`LaneSession` is deliberately NOT passed: it carries `browser`, and handing a recipe the lane would put a live
`BrowserSession` one property access away.

---

## 3. Where a recipe's code lives

`packages/siegelense-recipes/`, per T1970 and T1975-1977 — "this exact path, in every repo it runs in", and a
consumer writes its own recipes there. The package already owns the DECLARATION (`recipeBookStatics`,
`recipeManifestContract`); it now owns the EXECUTION beside it, so nothing about a recipe lives in two
packages.

```
packages/siegelense-recipes/
  src/adapters/fetch/json/recipes-fetch-json-adapter.ts       one JSON request, any method
  src/adapters/fs/write-text/recipes-fs-write-text-adapter.ts mkdir -p + write
  src/contracts/recipe-context/                               §2
  src/contracts/recipe-result/                                the flat id map a recipe returns
  src/statics/seed-fixture/                                   every literal both recipes write — S16
  src/brokers/guild-with-three-quests/seed/                   the production recipe
  src/brokers/session-with-nested-subagent/seed/              the direct recipe
  src/brokers/recipe/run/recipe-run-broker.ts                 name -> broker, the ONE entry siegelense calls
  adapters.ts  brokers.ts                                     new barrels
```

`siegelense` → `siegelense-recipes` is the only direction; a `brokers/` file may import another package's
`brokers`, so `stepSeedBroker` reaches `recipeRunBroker` and nothing reaches back.

**`RecipeResult` is a FLAT record keyed by the manifest's own `returns[].name`.** The book already declares
`'sessions.nested'` as a NAME, so the flat form is what the declaration was written in: the runner can check
the keys it produced against the keys the manifest promised (S21), and the check is a string-set comparison
rather than a structural walk. `seedResultRenderTransformer` expands the dots back into the nested object the
spec prints at T2676, so what a reader sees is the spec's own shape.

---

## 4. How `as:` bindings are stored and interpolated

**Bindings are RUN-scoped.** `runExecuteBroker` owns a `bindingsState` holder for the length of one batch,
the same shape (and for the same `require-atomic-updates` reason) as its existing `cursorState`. A binding
names "the ids THIS batch made", and a batch is the unit `run` returns a status for. Cross-run bindings would
have to survive a `reset`, which does not exist, so they are refused with a message that says which batch the
binding would have had to come from rather than resolving something stale.

**Substitution happens inside `runExecuteStepLayerBroker`, at the top of its `try`.** That is the one place
that already turns any throw into an `ok: false` `StepReading` plus a `StoppedAt` naming the step — so a
misspelled binding stops the batch under `stopOn: 'error'`, is written to the transcript, and reads back
through `results` like any other failure. Interpolating in the parent's loop instead would crash the batch
rather than record it.

`stepInterpolateTransformer({ step, bindings })`:

1. Round-trips the parsed `Step` to plain JSON and walks every string.
2. Replaces every `{<name>.<dotted.path>}` occurrence with the bound value.
3. **Throws `SeedBindingUnknownError` naming the binding** when `<name>` is unbound, or when `<name>` is bound
   but has no `<dotted.path>` — the message lists what IS bound and what that binding DOES hold, because
   "`{g.guildSlug}` silently passing through as a literal becomes a `goto` to a nonsense URL and a NO MATCH
   three steps later" (S22).
4. Re-parses through `stepContract`, so an interpolated step is branded and validated exactly like a typed one.

The pattern is deliberately narrow — `{ident.dotted.path}` with no whitespace — so a JS block in an `eval`
source (`() => { return 1 }`) never matches. A `{g.guildSlug}` inside an eval source DOES match, and that is
wanted: the ids are as useful in page-side JS as in a URL.

**Parameters ride the step as top-level keys**, which is the form every worked batch in the spec writes
(T2792, T2915-2922, T2941). The `seed` member of `stepContract` therefore carries `.catchall(contentText)`
rather than `.strict()` — the one member that does. The loudness the other members get from `.strict()` is
supplied one layer up and better: `stepSeedBroker` refuses any key the recipe's manifest does not declare,
BY NAME, and refuses a missing required one the same way. Zod cannot do that check, because only the manifest
knows what parameters a recipe takes.

---

## 5. `seed` is not a browser step

`stepDispatchBroker` today throws `BrowserStepUnsupportedError` twice: once for a browser verb against a
browserless lane, and once unconditionally when `lane.browser === null` — with a comment saying every verb
shipped so far is a browser verb. `seed` is the first that is not, so:

- `stepDispatchBroker` passes the whole `lane` to `runVerbLayerBroker` rather than `lane.browser`, and drops
  the unconditional throw. Its three `session.capture` call sites become `lane.browser !== null &&` guarded —
  reachable only when `shotPath !== null`, which only a `verbs.capturing` member gets, all of which are
  browser verbs.
- `runVerbLayerBroker` routes `seed` FIRST, before it narrows `lane.browser`, and throws
  `BrowserStepUnsupportedError` there for every other verb on a browserless lane.

`seed` joins `stepStatics.verbs.all` and NONE of `acting` / `capturing` / `targeting` / `browser`. It takes no
shot (S7: it must not disturb the page — a capture is a page operation), changes nothing on the page, resolves
no element, and works against `dungeonmaster-headless` (S23).

---

## 6. `start --seed`

`instanceStartBroker` is the CLIENT half: it spawns the driver and polls its socket. After a successful boot it
already holds `bootedEntry.ports` and the deterministic `homePath`, so it can build a `RecipeContext` and run
the recipe itself — no new socket request kind, no run id burned, no transcript entry for something that is
not a step.

- `startArgsContract` gains `seed: recipeNameContract.nullable()`; `startArgsParseTransformer` gains `--seed`.
- `instanceManifestContract` gains `seeded: recipeResultContract.nullable()` — `null` when no `--seed` was
  given, which is different from `{}` (a recipe that returned nothing).
- A seed failure after a successful boot **tears the instance down and rethrows**. A lane whose seed failed is
  a lane whose state is not what the caller asked for, and handing back a manifest with `seeded: null` would
  make it indistinguishable from one nobody asked to seed (S17, and the `count: 0` family again).
- S18 stands untouched: `evidence` is still resolved from the PARTITION guild (`questId`/`guildId`), and the
  seeded guild only ever appears under `seeded`.

---

## 7. Build list, file by file

| #  | File | Folder type | New/Edit |
|----|------|-------------|----------|
| 1  | `siegelense-recipes/src/contracts/recipe-context/` (3) | contracts | NEW |
| 2  | `siegelense-recipes/src/contracts/recipe-result/` (3) | contracts | NEW |
| 3  | `siegelense-recipes/src/adapters/fetch/json/` (3) | adapters | NEW |
| 4  | `siegelense-recipes/src/adapters/fs/write-text/` (3) | adapters | NEW |
| 5  | `siegelense-recipes/src/statics/seed-fixture/` (2) | statics | NEW |
| 6  | `siegelense-recipes/src/brokers/guild-with-three-quests/seed/` (3) | brokers | NEW |
| 7  | `siegelense-recipes/src/brokers/session-with-nested-subagent/seed/` (3 + integration) | brokers | NEW |
| 8  | `siegelense-recipes/src/brokers/recipe/run/` (3) | brokers | NEW |
| 9  | `siegelense-recipes/{adapters,brokers}.ts`, `contracts.ts`, `package.json` | barrels | NEW/EDIT |
| 10 | `siegelense/src/statics/step/step-statics.ts` (+test) | statics | EDIT — `verbs.all` gains `seed` |
| 11 | `siegelense/src/contracts/seed-binding-name/` (3) | contracts | NEW |
| 12 | `siegelense/src/contracts/seed-bindings/` (3) | contracts | NEW |
| 13 | `siegelense/src/contracts/step/step-contract.ts` (+test/stub) | contracts | EDIT — the `seed` member |
| 14 | `siegelense/src/contracts/start-args/` (3) | contracts | EDIT — `seed` |
| 15 | `siegelense/src/contracts/instance-manifest/` (3) | contracts | EDIT — `seeded` |
| 16 | `siegelense/src/errors/seed-binding-unknown/` (2) | errors | NEW |
| 17 | `siegelense/src/errors/recipe-unknown/` (2) | errors | NEW |
| 18 | `siegelense/src/errors/recipe-parameters-invalid/` (2) | errors | NEW |
| 19 | `siegelense/src/transformers/step-interpolate/` (2) | transformers | NEW |
| 20 | `siegelense/src/transformers/seed-result-render/` (2) | transformers | NEW |
| 21 | `siegelense/src/transformers/start-args-parse/` (2) | transformers | EDIT — `--seed` |
| 22 | `siegelense/src/brokers/recipe/seed-run/` (3) | brokers | NEW — resolve, validate, run, check returns |
| 23 | `siegelense/src/brokers/step/seed/` (3) | brokers | NEW |
| 24 | `siegelense/src/brokers/step/dispatch/run-verb-layer-broker.*` | brokers | EDIT — lane, `seed` route |
| 25 | `siegelense/src/brokers/step/dispatch/step-dispatch-broker.*` | brokers | EDIT — lane, capture guards |
| 26 | `siegelense/src/brokers/run/execute/run-execute-broker.*` | brokers | EDIT — the bindings store |
| 27 | `siegelense/src/brokers/run/execute/run-execute-step-layer-broker.*` | brokers | EDIT — interpolate |
| 28 | `siegelense/src/brokers/instance/start/instance-start-broker.*` | brokers | EDIT — `--seed` |
| 29 | `siegelense/src/responders/siegelense/start/siegelense-start-responder.*` | responders | EDIT — carry `seed` |
| 30 | `siegelense/src/statics/siegelense-help/` (+test) | statics | EDIT — `--seed` on `start` |
| 31 | `siegelense/src/statics/docs/docs-statics.ts` (+test) | statics | EDIT — S24 |
| 32 | `siegelense/package.json` | config | already depends on `@dungeonmaster/siegelense-recipes` |

---

## 8. The two recipes, and whether `production` is honoured

### `guild-with-three-quests` — `production`

`POST /api/guilds` and `PATCH /api/quests/:id` are the app's own writers, reached over the lane's real API
port. Nothing writes a file.

1. `mkdir` the guild's repo path inside the throwaway home (a guild points at a directory; the directory has
   to exist for the transcript encoding and for the UI to read it).
2. `POST /api/guilds { name, path }` → the server mints `id`, `urlSlug`, `createdAt` and writes `config.json`.
   **The returned `id` and `urlSlug` are the ones the recipe hands back** — never the ones it sent, because it
   sent neither.
3. `POST /api/quests { guildId, title, userRequest }` ×3 → each returns its own `questId`.
4. One of the three — the SECOND, so "the right one" and "the first one" are different values (S15) — is
   walked to `in_progress` through seven `PATCH /api/quests/:id` calls, one per edge of
   `questStatusTransitionsStatics`:
   `created → explore_flows → review_flows → flows_approved → explore_observables → review_observables →
   approved → in_progress`. Each PATCH writes only fields `questStatusInputAllowlistStatics` permits at the
   status it is leaving; the `explore_flows` one carries the flow blueprint that satisfies
   `questGateContentRequirementsStatics.approved` (`flows` non-empty) and the node-package-coverage invariant.

   This is exactly the walk `questHydrateBroker` performs, and `PATCH /api/quests/:id` reaches the same
   `questModifyBroker` through `QuestModifyResponder` → `orchestratorModifyQuestAdapter`. So every gate, every
   transition guard and every save invariant the app enforces is enforced here.

   **`POST /api/quests/:id/start` is deliberately NOT used.** It would also spawn the orchestration loop, so
   the fixture would keep moving after the recipe returned — a seeded state that changes under the walk is
   the determinism failure R356 names. The status edge `approved → in_progress` is legal without it.

Returns `guildId`, `guildSlug`, `questId` (the `in_progress` one) — exactly the manifest's declared names.

### `session-with-nested-subagent` — `direct`

No app endpoint writes a Claude session transcript; the Claude CLI does, and the lane runs a MOCK of it that
is a queue CONSUMER rather than a writer. So the recipe writes the shape itself, which is what `direct` means
and why it carries `mirrors:`.

1. `GET /api/guilds` to resolve the `guild` parameter (a guild ID) to that guild's `path` and `urlSlug`. A
   READ through the app's own route — fidelity is a claim about how state is CREATED.
2. `claudePathSlugEncoderTransformer({ homeDir: context.homePath, projectPath: guildPath })` gives the
   directory. This is production code in `@dungeonmaster/shared/transformers`, shared with the server's own
   reader, so the recipe cannot drift from where the app looks.
3. Writes three files, in the shape `sessionHarness.createNestedSubagentSessionFiles` writes and the
   orchestrator's replay broker reads:
   - `<sessionId>.jsonl` — user kickoff, `Task(A)` launch, A's completion `tool_result` carrying
     `toolUseResult.agentId`
   - `<sessionId>/subagents/agent-<A>.jsonl` — A's own text, then the `Task(B)` launch, then B's completion
   - `<sessionId>/subagents/agent-<B>.jsonl` — B's marker text

   Every line is built from a **stream-line stub in `@dungeonmaster/shared/contracts`** — the repo's own rule
   for anything constructing Claude CLI JSONL — so a contract change breaks the recipe in the same ward run.
   Every id, every timestamp and every string is a literal in `seedFixtureStatics` (S16): no `Date.now()`, no
   `randomUUID()`, so two runs produce byte-identical files and a `pixelChange` reading means something.

Returns `sessionId`, `sessions.outer`, `sessions.nested`.

**A correction to `mirrors:`.** Its author flagged it as the thing they were least sure of. Checked against
what making it executable required: the on-disk LOCATION half is right and is the load-bearing half —
`claudePathSlugEncoderTransformer` is what both the recipe and the server's reader resolve through. The line
shapes half names the right module. What it does not say, and what a diagnosis actually needs, is the READER:
the drift that matters is between these lines and what the orchestrator's replay broker expects of them, and
that is where a failing recipe test points. The pointer is extended to name it.

---

## 9. The test list

Every assertion names a real value. Four carry the job, and each is a way this verb could pass a test while
being useless.

| Test | Cases |
|---|---|
| `recipe-context-contract.test.ts` | round-trips whole; `.strict()` rejects a `browser`/`page` key BY NAME — the R8 negative |
| `recipe-result-contract.test.ts` | a dotted key round-trips; an empty record parses; a non-string value throws |
| `recipes-fetch-json-adapter.test.ts` | the exact `fetch` call (url, method, headers, body) for POST/PATCH/GET; a non-2xx throws naming method, url, status and body |
| `recipes-fs-write-text-adapter.test.ts` | mkdir of the parent then the write, with the exact contents |
| `seed-fixture-statics.test.ts` | the complete object; no `Date`/`random` anywhere in it |
| `guild-with-three-quests-seed-broker.test.ts` | **the COMPLETE ordered request list** — one POST /api/guilds, three POST /api/quests, seven PATCHes with their exact bodies; **the returned ids are the ones the RESPONSES carried**, staged distinct from anything the recipe sent |
| `session-with-nested-subagent-seed-broker.test.ts` | the three exact file paths; each file's exact line count and the `toolUseId`/`agentId` pairings; the returned routes |
| `session-with-nested-subagent-seed-broker.integration.test.ts` | **real `installTestbedCreateBroker` temp dir.** Writes for real, reads back, and asserts the nested pairing the replay broker keys on: A's completion in the MAIN file names A, B's completion in A's FILE names B. Plus composition: a guildId whose path is the testbed's own puts the transcript under that guild's encoded directory |
| `recipe-run-broker.test.ts` | each name routes to its own broker with the context and parameters; an unknown name throws listing the known ones |
| `step-statics.test.ts` | `verbs.all` complete with `toStrictEqual`; `seed` in NONE of acting/capturing/targeting/browser |
| `step-contract.test.ts` | a `seed` member with parameters as top-level keys parses and keeps them; `as` defaults to null; `recipe` is required |
| `seed-binding-name-contract.test.ts` | `g` parses; `1g`, `g.x`, `''` throw |
| `step-interpolate-transformer.test.ts` | `{g.guildSlug}` inside a path; `{s.sessions.nested}` whole-value; two placeholders in one string; a step with no placeholder comes back identical; **an unbound name throws naming it AND listing what is bound**; a bound name with an unknown field throws naming both; a JS block `{ return 1 }` in an eval source is untouched |
| `seed-result-render-transformer.test.ts` | the flat map renders as the spec's nested object, `toBe` on the exact string |
| `recipe-seed-run-broker.test.ts` | resolves through `recipeBookReadBroker`; an unknown recipe throws listing the book; a missing required parameter throws naming it; an unknown parameter throws naming it; **a recipe returning a key its manifest never declared throws** (S21) |
| `step-seed-broker.test.ts` | the reading is the rendered result; `as` records the binding under that name; a null `as` records nothing |
| `run-execute-broker.test.ts` | **a two-step batch where step 1 seeds `as: 'g'` and step 2's path carries `{g.guildSlug}` dispatches step 2 with the SUBSTITUTED path**; a misspelled binding makes step 2 `ok: false` with `stoppedAt` naming the binding and stops the batch |
| `step-dispatch-broker.test.ts` | a `seed` step against a lane whose `browser` is `null` RUNS rather than throwing |
| `start-args-parse-transformer.test.ts` | `--seed <name>`; absent is `null`; a bad name refuses naming the flag |
| `instance-start-broker.test.ts` | with `seed`, the manifest carries the recipe's real returns; without, `seeded` is `null`; a seed that throws tears the instance down and rethrows |

---

## 10. Ward, then drive

```
npm run ward -- --only lint,typecheck,unit,integration -- <every touched file>
```

Repo-relative, no `./`, `timeout: 600000`, iterate to exit 0. Then build `@dungeonmaster/siegelense-recipes`,
`@dungeonmaster/siegelense` and `@dungeonmaster/cli`, and DRIVE the real binary against a real lane per
`scrolls/seigelense/manual-verification-runbook.md`: seed, `goto`, `look`, and read the seeded guild off the
screen.

---

## 11. The grade, after the build and the drive

Every row of §1, graded against the code and against a real drive of the compiled CLI on
`dungeonmaster-web`.

| # | State | Note |
|---|---|---|
| S1 | **built** | Driven: `{"step":"seed","recipe":"guild-with-three-quests","as":"g"}` returned `{"guildId":"580dd00b-…","guildSlug":"siege-guild","questId":"0a222db1-…"}` as its reading. |
| S2, S3 | **built** | Driven: `goto {s.sessions.nested}` opened `/siege-guild/session/a1b2c3d4-…`. |
| S4 | **built** | `seed` is a member of `stepContract`'s union and dispatches like any other verb; a batch ran two of them at positions 1 and 2. |
| S5 | **built** | Parameters ride the step as top-level keys — the `seed` member is the one `.catchall()` member — and `recipeSeedRunBroker` grades them against the manifest. Driven: a missing `guild` refused by name. |
| S6 | **built** | Driven: `{"step":"seed","recipe":"session-with-nested-subagent","guild":"{g.guildId}","as":"s"}` filed its transcript under the guild the first recipe made. |
| S7 | **built** | `seed` is in none of `verbs.acting`/`capturing`, so it takes no shot and touches no page. |
| S8 | **built** | `recipeContextContract` is `.strict()` and carries only `apiBaseUrl` and `homePath`; a `browser` or `page` key is rejected by name, with a test per key. The LINT half (Part 7 item 16) stays open. |
| S9 | **built** | Both recipes return the ids their manifests declare, and `recipeSeedRunBroker` refuses a set that does not match. |
| S10 | **built** | `recipeSeedRunBroker` resolves through `recipeBookReadBroker` — the same call the listing makes. |
| S11 | **built, and honoured** | `guild-with-three-quests` writes nothing: one `POST /api/guilds`, three `POST /api/quests`, seven `PATCH /api/quests/:id`. Read back out of the app afterwards: three quests, one `in_progress`, and it is the middle one. |
| S12 | **built** | `session-with-nested-subagent` writes the three JSONL files and declares `mirrors:`; the contract refuses a `direct` recipe without one. |
| S13 | **built** | Driven and read back through `GET /api/quests?guildId=…`. |
| S14 | **built** | Driven: `look` showed `SUBAGENT_CHAIN` "Outer chain" holding a nested `SUBAGENT_CHAIN` "Nested chain". |
| S15 | **built** | The `in_progress` quest is the SECOND of three (`seedFixtureStatics.quest.inProgressIndex`). |
| S16 | **built** | Every id, text and timestamp is a literal in `seedFixtureStatics`; an integration test runs the direct recipe twice and asserts the files are byte-identical. |
| S17 | **built** | Driven: `start --seed guild-with-three-quests` returned `"seeded": {"guildId":"76246e48-…","guildSlug":"siege-guild","questId":"b7e03e3c-…"}`. |
| S18 | **built** | `evidence` still resolves from the partition guild; the seeded guild appears only under `seeded`. |
| S19 | **built** | The direct recipe's integration test uses `installTestbedCreateBroker` plus a real HTTP server for the one route it reads. The production recipe's own suite still needs a booted instance — that is build-order item 3a, unblocked but not delivered. |
| S20 | **part** | The test asserts the placement the replay reader keys on (which completion sits in which file, naming which agent) rather than a hardcoded snapshot — but it asserts it against the recipe's own output, not against a live run of the production writer. A true mirror test needs the Claude CLI, which the lane deliberately mocks. |
| S21 | **built** | `RecipeReturnsMismatchError` — an undeclared return or an unfulfilled one both refuse, naming the key. |
| S22 | **built** | Driven: `{s.sessions.nsted}` refused with `UNKNOWN BINDING … "s" holds: sessionId, sessions.outer, sessions.nested`, the batch stopped, and nothing was opened. |
| S23 | **built** | `seed` is in `verbs.all` and not in `verbs.browser`; `runVerbLayerBroker` routes it before the browser is narrowed, with a unit test against a `browser: null` lane. |
| S24 | **built** | Four passages in `docsStatics` said seeding was impossible (and two still said `look` was unbuilt). All four now describe what exists. |

### Findings the drive surfaced

1. **`packagesAffected` with `changeType: 'edit'` is refused by the app**, because
   `questPackageEntryViolationsTransformer` checks the location against the FILESYSTEM and the seeded
   guild points at an empty directory. The first drive failed with
   `PATCH to status "review_flows" … was refused: Package entry validation failed`. Fixed by declaring
   the entry `changeType: 'new'` with a `usedBy` list — the honest reading for a package the quest
   would be what creates. This is the class of defect `fidelity: production` exists to expose: a
   fixture that wrote the quest.json itself would have accepted a shape the app refuses.
2. **The spec's own `goto /{g.guildSlug}` has no route.** siegelense-tooling.md line 2917 writes it,
   and `AppFlow` carries `/`, `/queue`, `/:guildSlug/quest/:questId` and `/:guildSlug/session/:sessionId`
   and nothing else. Driven: `goto /siege-guild` then `look` returned `key: 1 rows` with
   `blank: true` on both shots. A batch copied from the spec lands on a white screen.
3. **`guild-with-three-quests` is not repeatable inside one instance.** A second run refuses with
   `A guild with path … already exists` — the guild path is a fixed literal, which is what keeps the
   recipe deterministic. The refusal names the exact reason and the path, so it is actionable, but a
   walk that wants two guilds needs two instances or a second recipe.
4. **`urlPathContract` cannot express a `goto` whose whole path is a placeholder.** `{s.sessions.nested}`
   does not start with `/`, and the batch is parsed before any recipe has run. `stepPathContract` is
   the fix: `/`-rooted OR placeholder-leading at submit time, and the post-substitution re-parse
   leaves only the `/` branch.
