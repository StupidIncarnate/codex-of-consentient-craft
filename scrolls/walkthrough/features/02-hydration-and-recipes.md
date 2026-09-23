# Hydration and recipes — walkthrough

Case prefix: `HY` · Packages: `hydration`, `hydration-recipes`, `siegelense` · Main sources:
`packages/hydration/CLAUDE.md`, `packages/hydration-recipes/CLAUDE.md`,
`scrolls/seigelense/siegelense-recipes.md` Part 5-6, `scrolls/seigelense/siegelense-recipe-roles.md`

## What changed

`@dungeonmaster/hydration` is the seeding framework — ingredients, chains, plans, seven op kinds
(`add`, `set`, `setRaw`, `filter`, `remove`, `saveRecordAs`, and the newest, `attach`), and a runner
that can hit either a real HTTP route (`api`) or write storage directly (`write`). `attach(where,
build)` shipped in commit `15fec3a61`: it queries an ingredient's own `query` route, requires exactly
one match, and binds it into a NEW plan — the mechanism that lets a second, separate `run()` build on
rows an earlier run already created, which `saveRecordAs`/`fromSaved` could never do (those only
resolve a name the SAME plan saved). `attachWorkItem` (`96ed7b448`) is a `quest` extra that links a
work item to an operation minted earlier in the same plan, closing the gap that `workItems` sits off
every status's field allowlist. Guild removal (`3f21151c7`) now sends a real `DELETE
/api/guilds/:guildId` whenever the target carries a `baseUrl`, so a seeded removal sweeps
orchestration state the same way the UI's own delete does. `hydration-recipes` is this repo's own
catalog of nine recipes, reached through `dungeonmaster siegelense recipes` and seeded through
`dungeonmaster siegelense start --seed <recipe>` (no-input recipes only) or a `seed` step inside
`dungeonmaster siegelense run` (every recipe, including ones that take params). A mid-batch seed
failure now marks the instance `unusable` (`e5a99b1af`) rather than leaving it half-seeded and
drivable.

## How to reach it

| Surface | How to reach it | Notes |
|---|---|---|
| Recipe catalog | `dungeonmaster siegelense recipes [--json]` | No instance needed — reads compiled `packages/hydration-recipes/dist/index.js` |
| Docs | `dungeonmaster siegelense docs [--for planning\|operating\|walking\|attacking\|fixing\|driving] [--json]` | `--for planning` covers recipes, preludes, profiles |
| Seed at boot (no-input recipes only) | `dungeonmaster siegelense start --spec dungeonmaster-stack --seed <recipe> [--json]` | Always passes `params: {}` — a recipe that declares `inputs` is refused here |
| Seed mid-walk (every recipe) | `dungeonmaster siegelense run --instance <id> --steps '[{"step":"seed","recipe":"<name>","params":{...},"as":"<binding>"}]'` | `params` is required iff the recipe declares `inputs`; the listing's `inputKeys` says which |
| Seed step's own output | `dungeonmaster siegelense results --instance <id> --run <runId> [--json]` | `run` returns only a status; `results` returns the payload — see `packages/siegelense/CLAUDE.md` |
| Quest/guild two-route parity | `npx playwright test packages/web/src/flows/home/quest-two-route-comparison.e2e.ts` (and `guild-two-route-comparison.e2e.ts`) | Not blocked by the repo's Bash hooks. Needs the dev server or ward's own e2e boot |
| `attach` / cross-plan reuse | `packages/hydration-recipes/src/brokers/quest/ingredient/quest-ingredient-broker.integration.test.ts` (`attach reaches a row an EARLIER, SEPARATE run() created`) | No recipe in the catalog uses `attach` yet — this Jest test is the only way to exercise it today |
| Quest gate content, on disk | `<instance home>/guilds/<guildId>/quests/<questId>/quest.json` | The instance's `HOME:` line from `start`'s own output names the throwaway home |
| Web SPEC tab recipe callout | none found | `discover` over `packages/web/src/**` for a recipe-listing widget or a seed-picker component returned nothing; seeding a running instance is CLI/MCP-only today |

## Setup

1. Build once before trusting anything: `npm run build --workspace=@dungeonmaster/hydration-recipes`
   (the listing and every seed read compiled `dist/index.js`, never source — see
   `packages/hydration-recipes/CLAUDE.md`, "Build before a listing is honest").
2. Confirm the catalog is live: `dungeonmaster siegelense recipes`. If it prints `no recipes declared
   yet` or throws about a missing `dist/index.js`, redo step 1.
3. Have one instance up for every case under "Seeding" and "Failure paths":
   `dungeonmaster siegelense start --spec dungeonmaster-stack`. Capture the printed `INSTANCE:` id —
   every later command needs it.
4. `CLAUDE_CLI_PATH`/`WARD_CLI_PATH` are not required by hand in THIS checkout — `laneBootBroker`
   falls back to the repo's own committed fixture binaries when both specs declare
   `requiresFakeAgentCli: true` and neither var is set. If `start` throws `FakeAgentCliRequiredError`,
   something moved those fixtures; that is worth its own defect, not a setup fix here.
5. Kill every instance you start before ending a session:
   `dungeonmaster siegelense kill --instance <id>`.

## Test cases

### Recipe catalog and docs

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| HY-01 | `dungeonmaster siegelense recipes` | Nine blocks, in this order: `guild-empty`, `guild-with-three-quests`, `guild-mid-execution`, `quest-advances-one-step`, `quest-completed`, `session-single-turn`, `session-with-nested-chain`, `guild-active-suite`, `session-with-nested-subagent`. Each block: name, one-line description, `inputs:`, `runs:`, `makes:` — see `recipes-answer-render-transformer.ts` for the exact label padding | `unit` — `packages/hydration-recipes/src/brokers/recipes/catalog/recipes-catalog-broker.test.ts` | P2 | |
| HY-02 | Read `quest-advances-one-step`'s block from HY-01 | `inputs: guildId`, `runs: serverless`, `makes: quest ×1, operation ×2` | `unit` — same file, `quest-advances-one-step entry` describe block | P2 | |
| HY-03 | `dungeonmaster siegelense recipes --json` | One JSON document, `{recipes: [...]}`, no line-wrapped text version mixed in | `unit` — `siegelense-recipes-responder.test.ts` | P2 | |
| HY-04 | `dungeonmaster siegelense docs --for planning` | Mentions recipes, preludes, profiles, "proving a prelude" | `none` | P3 | |

### Seeding no-input recipes via `start --seed`

Run each on a fresh instance: `dungeonmaster siegelense start --spec dungeonmaster-stack --seed
<recipe>`. Then open the printed `URL:` in a browser and cross-check the printed `SEEDED:` block
against `quest.json`/`config.json` under the printed `HOME:`.

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| HY-05 | `--seed guild-empty` | One guild, no quests, no sessions. `SEEDED:` shows one `guild:` line with an id | `unit` — `recipes-guild-empty-broker` has no dedicated test file; covered indirectly by the catalog test's `probeListing` | P1 | |
| HY-06 | `--seed guild-with-three-quests` | One guild, three quests. First quest ("Setup Database") stays `created`. Second ("Implement Authentication") is walked to `in_progress` — carries the `flows`/`packagesAffected` gate content from `seedFixtureStatics.quest` (flow id `siege-flow`, package `siege-fixture-service`). Third ("Scaffold Architecture") is walked all the way to `complete`. Open the guild in the browser: three quest rows, statuses `CREATED`/`IN PROGRESS`/`COMPLETE` | `integration` — `packages/hydration-recipes/src/brokers/recipes/guild-with-three-quests/recipes-guild-with-three-quests-broker.integration.test.ts` (if present) or the catalog test's own `probeListing` | P1 | |
| HY-07 | `--seed guild-mid-execution` | One guild, three quests. `quest1` (title "The running one") is `in_progress` with exactly 4 operations: `codeweaver`, `ward`, `flowrider`, `siegemaster` — `riftcarver` was minted (5th) then removed by the recipe's own `filter({role:'riftcarver'}).remove()`. `quest2`/`quest3` stay `created`, titled "Quest 2"/"Quest 3" from the ingredient's own `defaults(index)` | `unit` — `recipes-catalog-broker.test.ts` → `guild-mid-execution entry` | P1 | |
| HY-08 | `--seed quest-completed` | One guild, one quest ("Verified Flow"), status `complete`. Ledger holds 2 operations (`codeweaver`, `ward`), both `complete`. Quest carries 2 work items, each `status: complete`, `createdAt: 2024-01-01T00:00:00.000Z`, and each `relatedDataItems` names the REAL run-time-minted id of its own operation (not a fixed literal) — open `quest.json` and confirm the id inside `relatedDataItems: ['operations/<id>']` matches one of the two operation ids in the ledger | `integration` — `recipes-quest-completed-broker.integration.test.ts` | P1 | |
| HY-09 | `--seed guild-active-suite` | One guild, two quests: `questActive` ("Active Development") `in_progress`, `questComplete` ("Base Framework") `complete`. One session, holding exactly one subagent | `unit` — `recipes-catalog-broker.test.ts` → probeListing for `guild-active-suite` (not yet asserted per-entry in that file as of this read — worth adding if missing) | P1 | |

### Seeding parametrized recipes via `run`'s seed step

These four recipes declare `inputs`, so `start --seed` cannot run them (see HY-17). Seed a guild
first (`start --seed guild-empty`, or a bare `start` then a `seed` step for `guild-empty`), capture
its `id`/`path` from the `SEEDED:` block, then issue one `run` per recipe.

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| HY-10 | `dungeonmaster siegelense run --instance <id> --steps '[{"step":"seed","recipe":"quest-advances-one-step","params":{"guildId":"<guildId>"},"as":"adv"}]'` | One new quest ("Advancing quest"), `status: in_progress`. Ledger holds exactly 2 operations: op1 `codeweaver`/`complete`, op2 `ward`/`in_progress` — both ids minted at run time, never a fixed literal (`packages/hydration-recipes/CLAUDE.md`, "Two of the three recipes diverge...") | `integration` — `recipes-quest-advances-one-step-broker.integration.test.ts` | P1 | |
| HY-11 | `... --steps '[{"step":"seed","recipe":"session-single-turn","params":{"guildPath":"<guildPath>"},"as":"s"}]'` | One session file under the guild's `.claude/projects/...` dir, exactly 2 JSONL lines: one `user` turn ("Single turn request"), one `assistant` reply ("Single turn response") | `unit`/`integration` — session ingredient's own tests | P1 | |
| HY-12 | `... --steps '[{"step":"seed","recipe":"session-with-nested-chain","params":{"guildPath":"<guildPath>"},"as":"s"}]'` | One session, nested sub-agent chain exactly TWO levels deep — a top agent plus one nested sub-agent. Open the session in the browser and confirm `SUBAGENT_CHAIN` renders one nested level, not more | `unit`/`integration` — session ingredient tests | P1 | |
| HY-13 | `... --steps '[{"step":"seed","recipe":"session-with-nested-subagent","params":{"guild":"<guildId>"},"as":"s"}]'` | Writes 3 JSONL files directly (main transcript + 2 subagent files: outer, nested), fidelity `direct`, NOT built via the hydration chain (`recipesSessionWithNestedSubagentBroker` is a plain async function, not `recipe()`-declared — confirm this is the ONE recipe whose catalog entry hand-brands its `description` via `recipeCatalogEntryContract.parse`, per `recipes-catalog-broker.ts:38-48`). Needs `target.baseUrl` — fails with a named error on a write-only target | `unit` — none found for the broker itself; only the catalog wrapper's params/baseUrl checks are tested | P2 | |

### Output format: `start --seed`, and its misuse

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| HY-14 | `--seed guild-mid-execution` (human default) | Six fixed lines (`INSTANCE:`, `URL:`, `API:`, `HOME:`, `EVIDENCE:`, `BOOT:`) then `SEEDED:` followed by ONE summary line per `saveRecordAs` binding — `  guild: <id>`, `  quest1: <id> (title: "The running one", status: in_progress)` or similar identity fields, never the row's full JSON dumped inline | `unit` — `start-answer-render-transformer.test.ts` | P1 | |
| HY-15 | `--seed guild-mid-execution --json` | One JSON document — the raw `InstanceManifest`, `seeded` rows UNABRIDGED (full record, not the trimmed identity-field summary HY-14 shows) | `unit` — same file's `--json` case | P2 | |
| HY-16 | `start --spec dungeonmaster-stack` with no `--seed` at all | `SEEDED: none` (not `(empty)`, not omitted) | `unit` — `start-answer-render-transformer.test.ts` | P2 | |
| HY-17 | `--seed quest-advances-one-step` (a recipe that DECLARES `inputs`, attempted through `start` rather than `run`) | Refused — `start` always calls with `params: {}}`, and `quest-advances-one-step` requires `guildId`. Expect an error naming the recipe and that it "refused params", not a silent empty seed | `none` — no test drives `start --seed` against an inputs-requiring recipe | P1 | |

### Output format: `run`'s seed step, and `results`

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| HY-18 | Issue the `run` from HY-10, then `dungeonmaster siegelense run` itself (human default) | A status line only — `RUN: run_N (status: done, steps: 1, duration: <n>ms)` — NOT the seeded row's data | `unit` — `run-answer-render-transformer.test.ts` | P2 | |
| HY-19 | `dungeonmaster siegelense results --instance <id> --run <runId>` | The seed step's actual payload — the JSON-stringified `saveRecordAs` rows the recipe made (`stepSeedBroker`'s return value) | `unit` — `results-answer-render-transformer.test.ts`, `step-seed-broker.test.ts` | P1 | |
| HY-20 | `dungeonmaster siegelense results --instance <id> --run <runId> --json` | One JSON document, unabridged | `unit` — same | P2 | |
| HY-21 | A `run` batch with TWO seed steps, `as: 'a'` and `as: 'b'`, then `{step.row.field}` interpolation reading `{a.guild.id}` into `b`'s `params` | The second step's params resolve the first step's saved id correctly. A two-segment reference like `{a.guildId}` (missing the row segment) should be refused, naming the rows step `a` actually saved | `none` found | P1 | |

### `attach`, `attachWorkItem`, and cross-plan reuse

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| HY-22 | `attachWorkItem` — already exercised by HY-08 (`quest-completed`) | Covered — see HY-08's `relatedDataItems` check | `integration` — `recipes-quest-completed-broker.integration.test.ts` | P2 | |
| HY-23 | `attach` — no CLI/recipe path exists. Run directly: `npm run ward -- --only integration -- packages/hydration-recipes/src/brokers/quest/ingredient/quest-ingredient-broker.integration.test.ts` and read the `attach reaches a row an EARLIER, SEPARATE run() created` case | One `dmRegistryBroker.run()` creates a guild+quest; a SECOND, separate `run()` attaches that quest by `{id, guildId}`, mints a new operation via `operations.under(...)`, links a new work item via `attachWorkItem`. On-disk quest carries exactly 1 operation and 1 work item, work item's `relatedDataItems` naming the real minted operation id | `integration` — the test itself | P1 (no recipe wires this — worth flagging to the user as a gap, not a defect) | |

### API route vs write route parity

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| HY-24 | `npx playwright test packages/web/src/flows/home/quest-two-route-comparison.e2e.ts` | One quest seeded via `POST /api/quests` (api route), one via the hydration `write` route (`questHarness.createQuestViaWriteRoute`), same `title`/`userRequest`. Both appear in `GET /api/quests?guildId=...` with identical `title`, `userRequest`, `status: created`. Only the id differs. Both render on the guild's quest list and each quest's own workspace shows the same title/user request | `e2e` — the spec itself | P2 | |
| HY-25 | `npx playwright test packages/web/src/flows/home/guild-two-route-comparison.e2e.ts` | Same shape for the guild ingredient: `urlSlug` for both routes is `dual-route-guild`, ids differ, both list in `GET /api/guilds`, both render on the home screen (`toHaveCount(2)`) | `e2e` — the spec itself | P2 | |

### Guild removal via `DELETE`

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| HY-26 | `npx playwright test packages/web/src/flows/home/guild-delete.e2e.ts` | Deleting a guild via the API removes it from the home list; deleting the currently-selected guild clears the quest panel; deleting the LAST guild shows the NEW GUILD empty state | `e2e` — the spec itself | P2 | |
| HY-27 | Hydration's own `guild` ingredient `remove` route choosing DELETE-vs-in-process by `target.baseUrl` — no recipe in the catalog removes a guild, so there is no CLI path. Read `packages/hydration-recipes/src/brokers/guild/remove-route/guild-remove-route-broker.test.ts` directly instead | On a `baseUrl`-carrying target it sends the real `DELETE /api/guilds/:guildId`; on a write-only target it calls `guildRemoveBroker` in-process, skipping the orchestrator's queue sweep (deliberately, since a write-only target has no server-side dispatch loop to sweep) | `unit` — the test file itself | P3 | |

### Failure paths

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| HY-28 | `run` a `seed` step naming a recipe that does not exist, e.g. `{"step":"seed","recipe":"nope"}` | `RecipeUnknownError`: `Unknown recipe "nope". Known recipes: guild-empty, guild-with-three-quests, guild-mid-execution, quest-advances-one-step, quest-completed, session-single-turn, session-with-nested-chain, guild-active-suite, session-with-nested-subagent.` | `unit` — `recipe-unknown-error.test.ts`, `step-seed-broker.test.ts` | P1 | |
| HY-29 | `start --seed nope` (the SAME bad-name case, but through `start` instead of `run`) | **Different wording than HY-28** — `recipeSeedRunBroker` in `hydration-recipes` throws a plain `Error`: `recipesSeedRunBroker: unknown recipe 'nope' — known recipes: <same 9, comma-joined, no trailing period>`. Confirm both surfaces actually disagree in wording before filing — this looks like a real inconsistency, not just a docs gap. Evidence: `packages/hydration-recipes/src/brokers/recipes-seed/run/recipes-seed-run-broker.ts:36-41` vs `packages/siegelense/src/errors/recipe-unknown/recipe-unknown-error.ts:19-25` | `none` crosses both surfaces in one test | P1 | |
| HY-30 | `run` a `seed` step supplying a `params` key the recipe does not declare, e.g. `{"step":"seed","recipe":"guild-empty","params":{"extra":"x"}}` | `RecipeParamsRefusedError`: `Recipe "guild-empty" does not accept the param "extra". This recipe takes no params.` | `unit` — `recipe-params-refused-error.test.ts` | P1 | |
| HY-31 | `run` a `seed` step for `quest-advances-one-step` with NO `params` at all | `RecipeParamsRefusedError`, `reason: 'missing'`: `Recipe "quest-advances-one-step" requires the param "guildId", which was not supplied. Accepted params: guildId.` | `unit` — same file | P1 | |
| HY-32 | Trigger a genuine connection refusal: find the API process pid (`dungeonmaster siegelense status --instance <id> --json`), `kill -9` it directly (leaving the siegelense instance registry entry alive), then issue a `run` with a `seed` step | `HydrationRouteFailedError` — since `fetchPostAdapter` attaches a `url` with no `status`, the message reads `... "api" route at <url> refused the connection: <cause>` — a DIFFERENT sentence than the no-URL case (HY-33). An earlier bug said "refused the connection" for every failure; current source (`hydration-route-failed-error.ts:53-58`) branches on `url === null` vs `status === null`, so confirm live that the two sentences are actually distinguishable, not just distinguishable in the source | `unit` — `hydration-route-failed-error.test.ts`, `route-failure-transformer.test.ts` | P1 | |
| HY-33 | A route failure with NO url attached at all (an ingredient's bespoke route throwing something that isn't a `fetchPostAdapter` rejection) — hardest to force from the CLI; nearest lever is a transition gate refusing for lack of content, since `reach` calling `dmHttpRequestAdapter` for `in_progress` still attaches a url, so a true `url: null` case may need the unit test directly | Message reads `... "<route>" route failed with no URL known: <cause>` — distinct wording from HY-32's connection-refused sentence | `unit` — `hydration-route-failed-error.test.ts`, "no URL" case | P2 | |
| HY-34 | Force `HydrationTransitionRefusedError` for real: no catalog recipe provokes this (every recipe either `setRaw`s past a gate or supplies gate content before approving, e.g. `guild-with-three-quests`'s `flows`/`packagesAffected` write). Nearest coverage is `quest-ingredient-broker.integration.test.ts`'s own transition cases — read it directly rather than trying to force this through the CLI | `Cannot go to "<to>" from "<from>": <gate's own message>` | `integration` — the test file | P3 | |
| HY-35 | Rename/move `packages/hydration-recipes/dist` temporarily, then `dungeonmaster siegelense recipes` or any `--seed` | `RecipesBuildMissingError`: `Recipes package built output not found at <path>/dist/index.js. Run "npm run build --workspace=@dungeonmaster/hydration-recipes" to build it.` Restore the directory afterward | `unit` — `recipes-build-missing-error.test.ts`, `recipes-locate-broker.test.ts` | P2 | |
| HY-36 | Let a `seed` step fail mid-batch on a live instance (e.g. combine HY-30's bad-param seed with a later step in the same batch), then issue ANY further `run` against the same instance | The whole batch halts at the failing seed step. The instance is marked `unusable` in the registry. The NEXT `run` against it is refused BEFORE any socket round trip: `Instance <id> is unusable: a seed step failed mid-batch on an earlier run, leaving it partially seeded with nothing to roll back to. ... start a fresh instance with dungeonmaster siegelense start instead.` `results`/`status`/`snapshots`/`compare` still work against it — confirm reads are NOT refused, only `run` | `unit`/`integration` — `instance-run-broker.test.ts` | P1 | |

## Known open items

- **Earlier seed fixes, not yet seen live.** Three fixes are proven by tests but not on the real CLI:
  `seedResultContract` accepts a full record, `guild-with-three-quests` seeds three distinct statuses with gate
  content, and `HydrationRouteFailedError` names the real failure kind. HY-06, HY-14, HY-32 and HY-33 confirm them.
- **`attach` has no recipe or CLI surface.** It is fully built and integration-tested
  (`15fec3a61`), but nothing in the catalog calls it — HY-23 is the only way to see it work today.
  `packages/hydration/CLAUDE.md`'s own `attach` section documents a real TypeScript limitation
  (`TS18048`) when chaining a child accessor off an attached row — worth re-reading if a future recipe
  tries to.
- **HY-29's error-text mismatch** between `start --seed <bad name>` and `run`'s `seed` step for the
  identical failure is a real inconsistency in the code, not a documentation gap — two different error
  classes, two different sentences, for the same user mistake.
- **No web UI surface for seeding.** `discover` over `packages/web/src/**` found nothing resembling a
  recipe picker or seed callout in the SPEC tab. If the task description's mention of "the SPEC tab
  recipe callout in the web" refers to something real, it was not found — flag this to the user rather
  than guessing at a UI flow that may not exist yet.
- **Known gaps table in `scrolls/seigelense/siegelense-recipes.md`** (search "Known gaps, named rather
  than discovered later") lists several still-open items relevant here: a plan requiring an `api`-only
  ingredient cannot say so before it runs; a recipe cannot call another recipe (no `include`); a row
  added at top level with unsatisfied `links` type-checks but should be refused by the runner; the
  guild `write` route's directory-creation asymmetry against its `api` counterpart.
- **`recording` route kind is declared and unexercised** — no ingredient in this repo's catalog uses
  it, so nothing here proves it works.

## Sources

- `packages/hydration/CLAUDE.md` — the framework's own invariants, including the `attach` section
- `packages/hydration-recipes/CLAUDE.md` — every ingredient's `copies:`, `attachWorkItem`, `attach`,
  and the two known-gap sections ("`.under()` does not carry ancestor names forward",
  "One known gap this chunk did not close")
- `packages/siegelense/CLAUDE.md` — `run` vs `results`, evidence handling
- `scrolls/seigelense/siegelense-recipes.md` — Part 5 (the recipe book: every verb, every route, the
  sad-path table) and Part 6 (the CLI surface, the `seed` step, a worked batch)
- `scrolls/seigelense/siegelense-recipe-roles.md` — the role rules for a session driving this at run
  time (not read in full for this doc; skim before writing a fix that touches ChaosWhisperer/siegemaster
  prompts)
- Recipe source: `packages/hydration-recipes/src/brokers/recipes/*/recipes-*-broker.ts` (nine files,
  one per recipe) and `packages/hydration-recipes/src/brokers/recipes/catalog/recipes-catalog-broker.ts`
  (the wiring and per-recipe params validation)
- Error classes: `packages/hydration/src/errors/**` (route/transition failures),
  `packages/siegelense/src/errors/**` (`RecipeUnknownError`, `RecipeParamsRefusedError`,
  `InstanceUnusableError`, `RecipesBuildMissingError`, `RecipesPackageMissingError`)
- e2e specs: `packages/web/src/flows/home/quest-two-route-comparison.e2e.ts`,
  `guild-two-route-comparison.e2e.ts`, `guild-delete.e2e.ts`
