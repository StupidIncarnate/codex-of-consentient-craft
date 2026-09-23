# siegelense CLI — walkthrough

Case prefix: `SL` · Packages: `siegelense`, `hydration-recipes`, `hydration` · Main sources:
`packages/siegelense/CLAUDE.md`, `packages/hydration-recipes/CLAUDE.md`,
`packages/siegelense/src/flows/siegelense/siegelense-flow.ts`, `packages/siegelense/src/statics/siegelense-help/siegelense-help-statics.ts`

## What changed

`siegelense` is a CLI (`dungeonmaster siegelense <call>`) that boots an isolated app instance (API
server, Vite web server, headless Chromium), drives it through a `run` batch of typed steps, and
answers queries off disk. All thirteen documented calls route through their own layer flow file
(`packages/siegelense/src/flows/siegelense/siegelense-<call>-layer-flow.ts`), each with its own
`.integration.test.ts`. Every
call defaults to a human-readable view and takes `--json` for the raw contract. `docs` now serves five
role scopes (`planning`, `walking`, `attacking`, `fixing`, `driving`) plus a bare overview with no
`--for`; earlier design scrolls describing a sixth/seventh scope (`operating`, `operational`) describe
unbuilt future work, not the current call surface — verified directly against
`siegelenseCallStatics.docs.scopes`. The recipe catalog (`packages/hydration-recipes`) now wires all
nine recipes into `recipesCatalogBroker` — the "orphaned ninth recipe" a design scroll once flagged
(`session-with-nested-subagent`) is live. `seedResultContract` now accepts the real per-binding-record
shape a recipe run actually returns, and `guild-with-three-quests` now walks its
`in_progress`/`complete` quests through real transition gates with real gate content.

## How to reach it

| Surface | How to reach it | Notes |
|---|---|---|
| CLI | `dungeonmaster siegelense <call> [flags]` | Needs a build: `npm run build` (whole repo) per root `CLAUDE.md`. `npm link --workspaces` if `dungeonmaster` is not yet on PATH. |
| Per-call help | `dungeonmaster siegelense <call> --help` or `-h` | Read-only, starts nothing. |
| Bare index | `dungeonmaster siegelense --help` / `-h` | Lists all calls. |
| Fleet listing | `dungeonmaster siegelense` (no args) | Same as `status` with no `--instance`. |

## Setup

1. `npm run build` at repo root (grades compiled output — `recipes` reads `packages/hydration-recipes/dist`,
   `siegelense` itself runs from its own `dist`). If a listing looks stale after editing a recipe, rebuild
   `hydration-recipes` specifically: `npm run build --workspace=@dungeonmaster/hydration-recipes`.
2. `npm link --workspaces` and `npm run init` if `dungeonmaster` is not already resolvable — see root
   `CLAUDE.md`'s "Regenerating `.claude/settings.json` Here".
3. Confirm the install-side symlink exists: `<repoRoot>/.dungeonmaster-assets/siegelense-assets` should
   resolve (via `ls -la`) to this checkout's siegelense root. This is what lets a `Read` on any evidence
   path actually work.
4. No `.dungeonmaster.json` collision needed — `start` allocates its own OS-assigned port pair per
   instance, independent of the repo's own dev/prod ports.
5. Capture an `<instanceId>` from a `start` call before running any command that needs one; capture a
   `<runId>` (e.g. `run_1`) from a `run` call before `results`/`compare`.
6. Every case below uses `<instanceId>` / `<runId>` as placeholders for real values.

## Test cases

### docs

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| SL-001 | `dungeonmaster siegelense docs` | Prints the about-overview Markdown alone — no role section. No `NOT BUILT YET` markers in the overview text itself. | integration — `siegelense-docs-layer-flow.integration.test.ts` | P2 | pass (earlier session) |
| SL-002 | `dungeonmaster siegelense docs --for walking` | Prints Markdown: title, About block, one heading for `walking` with its audience, summary and bulleted sections (starts with "READ THIS FIRST"). | integration — same file | P2 | pass (earlier session) |
| SL-003 | `dungeonmaster siegelense docs --for planning` | Prints the planner's page (prelude/capacity/profile/recipes/testId-vs-ref/step-count sections). | integration — same file | P2 | |
| SL-004 | `dungeonmaster siegelense docs --for attacking` | Prints the stress-tester's page. | integration — same file | P2 | |
| SL-005 | `dungeonmaster siegelense docs --for fixing` | Prints the fixer's page. | integration — same file | P2 | |
| SL-006 | `dungeonmaster siegelense docs --for driving` | Prints the page for "a session nobody orchestrated". | integration — same file | P2 | |
| SL-007 | `dungeonmaster siegelense docs --for reader` (unknown scope) | Exits 1: `Unknown docs scope: reader` naming the five real scopes, and saying omitting `--for` gets the overview. | integration — same file | P2 | |
| SL-008 | `dungeonmaster siegelense docs --for walking --json` | Prints raw `DocsAnswer` JSON (about + one document keyed `walking`). | integration — same file | P2 | |
| SL-009 | `dungeonmaster siegelense docs --json` (no `--for`) | Prints raw JSON with `about` populated and no per-scope document. | integration — same file | P2 | |
| SL-010 | `dungeonmaster siegelense docs --for walking --human` | Exits 1: `Unknown flag: --human` `--human` is gone from every command. | integration — same file | P2 | |
| SL-011 | `dungeonmaster siegelense docs --help` | Prints the `docs` help page: synopsis, `--for`/`--json` flags, the two refusal sentences, an example. | none | P3 | |

### capacity

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| SL-012 | `dungeonmaster siegelense capacity --spec dungeonmaster-stack` | Human summary: `SUGGESTED:`/`SPEC:`/`WHY:`/`PROFILE:` lines. | integration — `siegelense-capacity-layer-flow.integration.test.ts` | P2 | pass (earlier session) |
| SL-013 | `dungeonmaster siegelense capacity --spec dungeonmaster-stack --pool 3` | Same shape; `WHY:` names the pool-3 sample group (or "no measured profile" if none recorded). | integration — same file | P2 | pass (earlier session) |
| SL-014 | `dungeonmaster siegelense capacity` (no `--spec`) | Exits 1: `--spec is required: name the lane spec to calculate capacity against...` | integration — same file | P2 | |
| SL-015 | `dungeonmaster siegelense capacity --spec no-such-spec` | Exits 1: `Unknown lane spec "no-such-spec". Known specs: dungeonmaster-stack, dungeonmaster-api`. This is the audit's "capacity unknown-spec refusal never reached" item — now proven by a real (unmocked) integration test. | integration — same file | P1 | |
| SL-016 | `dungeonmaster siegelense capacity --spec dungeonmaster-api --pool 2 --json` | Prints raw `CapacityAnswer` JSON: `suggested`, `ceiling`, `why`, `profile`. | integration — same file | P2 | |
| SL-017 | `dungeonmaster siegelense capacity --spec dungeonmaster-stack --pool abc` | Exits 1 naming `--pool` and its contract's own message (non-numeric). | integration — same file | P2 | |
| SL-018 | `dungeonmaster siegelense capacity --help` | Prints synopsis, `--spec`/`--pool`/`--json` flags, the three advisory-vs-hard-refusal notes. | none | P3 | |

### status

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| SL-019 | `dungeonmaster siegelense status` | Box-drawing fleet table, filtered to the last 6h by default (`--since 6h` implied). | integration — `siegelense-status-layer-flow.integration.test.ts` | P2 | pass (earlier session) |
| SL-020 | `dungeonmaster siegelense status --branch main` | Table filtered to instances created on git branch `main`. | integration — same file | P2 | pass (earlier session) |
| SL-021 | `dungeonmaster siegelense status --since 6hr` | Same as bare (also accepts the old `6h` spelling). | integration — same file | P2 | pass (earlier session) |
| SL-022 | `dungeonmaster siegelense status --since beginning` | Table with every instance the registry holds regardless of age. | integration — same file | P2 | pass (earlier session) |
| SL-023 | `dungeonmaster siegelense status --since 1hr` | Table filtered to the last hour. | integration — same file | P2 | |
| SL-024 | `dungeonmaster siegelense status --since 1day` | Table filtered to the last day. | integration — same file | P2 | |
| SL-025 | `dungeonmaster siegelense status --since 45m` | Exits 1: only `1hr`/`6hr`/`1day`/`beginning` are accepted — "granular abuse" refusal. | integration — same file | P2 | |
| SL-026 | `dungeonmaster siegelense status --instance <instanceId>` | Full single-instance form: last beat, last step, RSS, orphans, evidence paths, `likelyCause`. | integration — same file | P2 | |
| SL-027 | `dungeonmaster siegelense status --instance inst_deadbeef00` (unknown id) | Exits 1 naming the unknown instance (`InstanceUnknownError`). | integration — same file | P1 | |
| SL-028 | `dungeonmaster siegelense status --json` | Prints raw `StatusAnswer` JSON for the fleet. | integration — same file | P2 | |
| SL-029 | `dungeonmaster siegelense status --instance <instanceId> --json` | Prints raw single-instance JSON. | integration — same file | P2 | |
| SL-030 | `dungeonmaster siegelense status --help` | Confirm `output` line describes the table default, NOT "One JSON document on stdout". | none | P3 | |

### cleanup

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| SL-031 | `dungeonmaster siegelense cleanup` | Human summary: what was reaped, ports/locks released, assets aged out, what was left alone and why. | integration — `siegelense-cleanup-layer-flow.integration.test.ts` | P2 | pass (earlier session, as part of Command 4) |
| SL-032 | `dungeonmaster siegelense status` (immediately after SL-031) | Reaped rows reflected — no longer `alive` with a cold heartbeat. | integration — status flow test | P2 | pass (earlier session) |
| SL-033 | `dungeonmaster siegelense cleanup --json` | Prints raw `CleanupAnswer` JSON. | integration — same file | P2 | |
| SL-034 | `dungeonmaster siegelense cleanup --instance <id>` (unknown flag for this call) | Exits 1: `Unknown flag: --instance` plus "Takes no input" wording. | integration — same file | P2 | |
| SL-035 | `dungeonmaster siegelense cleanup extra-positional` | Exits 1: unexpected positional argument, same "takes no input" wording. | integration — same file | P2 | |

### recipes

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| SL-036 | `dungeonmaster siegelense recipes` | Human block listing, one entry per recipe: `guild-empty`, `guild-with-three-quests`, `guild-mid-execution`, `quest-advances-one-step`, `quest-completed`, `session-single-turn`, `session-with-nested-chain`, `guild-active-suite`, `session-with-nested-subagent` — 9 entries. Each shows `description`, `inputs`, `runs` (serverless / needs a server), `makes`. | integration — `siegelense-recipes-layer-flow.integration.test.ts` | P2 | pass (earlier session) |
| SL-037 | `dungeonmaster siegelense recipes --json` | Prints raw `RecipesAnswer` JSON, same 9 entries. | integration — same file | P2 | |
| SL-038 | `dungeonmaster siegelense recipes --kind foo` (unknown flag) | Exits 1: `Unknown flag: --kind` plus "takes no instance" wording. | integration — same file | P2 | |

### profile

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| SL-039 | `dungeonmaster siegelense profile --spec dungeonmaster-stack` | Human summary: spec name, process count, content hash, `measuredAt`/boot/runs, a box table of samples by pool size (or "none measured yet"). | integration — `siegelense-profile-layer-flow.integration.test.ts` | P2 | pass (earlier session) |
| SL-040 | `dungeonmaster siegelense profile` (no `--spec`) | Exits 1: `--spec is required...there is no fleet-wide form`. | integration — same file | P2 | |
| SL-041 | `dungeonmaster siegelense profile --spec no-such-spec` | Reads what was measured (or nothing) — confirm whether an unknown spec name is refused here the same way `capacity`/`start` refuse it, or silently returns an empty profile. Worth a direct look: `profile` reads by content hash and may not validate the spec name against `laneSpecFindBroker` at all. | none confirmed | P1 | |
| SL-042 | `dungeonmaster siegelense profile --spec dungeonmaster-stack --json` | Raw `SpecProfile` JSON. | integration — same file | P2 | |
| SL-043 | `dungeonmaster siegelense profile --spec dungeonmaster-stack --human` | Exits 1: unknown flag (`--human` removed). | integration — same file | P2 | |

### start

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| SL-044 | `dungeonmaster siegelense start --spec dungeonmaster-stack` | Boots ~20s; human summary: instance id, spec, URLs (`API:`/web), home/evidence paths, boot time. Capture `<instanceId>`. | integration (parse-only) + manual boot — `siegelense-start-layer-flow.integration.test.ts` covers argv parsing; the real boot is unproven by any automated test per that file's own header comment | P1 | |
| SL-045 | `dungeonmaster siegelense start` (no `--spec`) | Exits 1: `--spec is required: name the lane spec to boot.` | integration — same file | P2 | |
| SL-046 | `dungeonmaster siegelense start --spec no-such-spec` | Exits 1: `Unknown lane spec "no-such-spec". Known specs: dungeonmaster-stack, dungeonmaster-api`. | none confirmed at flow level (confirmed lower down at `laneSpecFindBroker`) | P2 | |
| SL-047 | `dungeonmaster siegelense start --spec dungeonmaster-api` | Boots the browserless spec — `API:` URL present, no web URL (`baseUrl: null`). | none — no automated boot coverage | P1 | |
| SL-048 | `dungeonmaster siegelense start --spec dungeonmaster-stack --quest <questId>` (alone, no `--guild`) | Boots; manifest evidence filed under that quest's guild. **Explicitly uncovered by any test** — `siegelense-start-layer-flow.integration.test.ts`'s own header lists this as left out. | none | P1 | |
| SL-049 | `dungeonmaster siegelense start --spec dungeonmaster-stack --guild <guildId>` (alone, no `--quest`) | Boots; evidence filed under that guild directly. **Explicitly uncovered.** | none | P1 | |
| SL-050 | `dungeonmaster siegelense start --spec dungeonmaster-stack --idle-timeout-ms 1800000` | Boots; raises the idle ceiling above the 900000ms default for this instance only. | none | P1 | |
| SL-051 | `dungeonmaster siegelense start --spec dungeonmaster-stack --json` | Boots; prints the unabridged `InstanceManifest` JSON, `seeded` included. | none | P2 | |
| SL-052 | `dungeonmaster siegelense start --bogus X` | Exits 1: `Unknown flag: --bogus` listing `--spec, --quest, --guild, --idle-timeout-ms, --seed, --json`. | integration — `siegelense-start-layer-flow.integration.test.ts` | P2 | |
| SL-053 | `dungeonmaster siegelense start --spec ""` | Exits 1 naming `--spec` and the contract's own "at least 1 character" message. | integration — same file | P2 | |
| SL-054 | `dungeonmaster siegelense start --spec dungeonmaster-stack --seed guild-empty` | Boots and seeds; `SEEDED:` line shows one summarized `guild:` row (id, name, urlSlug). Recipe takes no params — should succeed. | none end-to-end (broker-level real recipe proven in `recipe-seed-run-broker.integration.test.ts`, not through this CLI flag) | P1 | |
| SL-055 | `... --seed guild-with-three-quests` | Boots and seeds; `SEEDED:` shows `guild`, `questCreated`, `questInProgress`, `questComplete`. Confirm it no longer throws a Zod dump and that `questInProgress`/`questComplete` really reached those statuses (check via `status --instance` or a follow-up read of the quest file, not just the manifest). | none end-to-end through the CLI | P1 | |
| SL-056 | `... --seed guild-mid-execution` | Boots and seeds; no params required — should succeed. | none end-to-end | P1 | |
| SL-057 | `... --seed quest-completed` | Boots and seeds; no params required — should succeed. | none end-to-end | P1 | |
| SL-058 | `... --seed guild-active-suite` | Boots and seeds; no params required — should succeed. | none end-to-end | P1 | |
| SL-059 | `... --seed quest-advances-one-step` | **Expected to FAIL.** This recipe requires `guildId` in its `inputs`, but `instanceStartBroker` always calls `recipeSeedRunBroker` with `parameters: {}` (`instance-start-broker.ts:393`) — there is no way to pass recipe params through `start --seed`. Expect an error naming the recipe and the missing `guildId` key. If it instead SUCCEEDS, that is a surprise worth writing up. | none | P1 | |
| SL-060 | `... --seed session-single-turn` | **Expected to FAIL** for the same reason — this recipe requires `guildPath`. | none | P1 | |
| SL-061 | `... --seed session-with-nested-chain` | **Expected to FAIL** for the same reason — requires `guildPath`. | none | P1 | |
| SL-062 | `... --seed session-with-nested-subagent` | **Expected to FAIL** for the same reason — requires `guild`, and also needs `target.baseUrl` (only reachable via `dungeonmaster-stack`/`dungeonmaster-api`, both of which have one). | none | P1 | |
| SL-063 | `dungeonmaster siegelense start --spec dungeonmaster-stack --seed no-such-recipe` | Exits 1/tears down: unknown recipe name, naming the known catalog. | none | P2 | |
| SL-064 | `dungeonmaster siegelense start --help` | Synopsis with `--spec` (required) and all five optional flags, the `--seed`/`--idle-timeout-ms` refusal notes, `output` line describing the human summary plus `seeded` binding lines. | none | P3 | |

### run — step vocabulary (needs a live instance; use `dungeonmaster-stack` unless noted)

One case per step kind. Submit each as `dungeonmaster siegelense run --instance <instanceId> --steps '[{...}]'`.

| ID | Step | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|---|
| SL-065 | `goto` | `[{"step":"goto","path":"/"}]` | Navigates; index reading shows the step succeeded. | integration — `siegelense-run-layer-flow.integration.test.ts` | P2 | |
| SL-066 | `look` | `[{"step":"look"}]` | Returns the key: numbered elements with ref/testId/tag/role/domId/text/attrs/state-flags. | integration — same file | P2 | |
| SL-067 | `look` with `within` | `[{"step":"look","within":"GUILD_LIST"}]` | Scoped key, only elements under that testId. | none confirmed | P1 | |
| SL-068 | `screenshot` | `[{"step":"goto","path":"/"},{"step":"screenshot","name":"home.png"}]` | Writes a PNG under the instance's evidence path; `results --kind screenshots` later lists it. | integration — same file | P2 | |
| SL-069 | `waitFor` | `[{"step":"waitFor","target":"[data-testid=\"GUILD_LIST\"]","state":"visible"}]` | Waits for the element to reach that Playwright locator state. | none confirmed | P1 | |
| SL-070 | `click` (by `target`) | `[{"step":"click","target":"[data-testid=\"SOME_BUTTON\"]"}]` | Clicks; page reacts. | none confirmed | P1 | |
| SL-071 | `click` (by `ref`) | Run a `look` first, then `[{"step":"click","ref":<ref from look>}]` | Clicks the same element the ref pointed at. | none confirmed | P1 | |
| SL-072 | `click` with neither `target` nor `ref` | `[{"step":"click"}]` | Contract refusal: "a driving step takes exactly one handle". | none confirmed via CLI (contract-level) | P2 | |
| SL-073 | `click` with both `target` and `ref` | `[{"step":"click","target":"...","ref":1}]` | Same handle-ambiguity refusal. | none confirmed via CLI | P2 | |
| SL-074 | `type` | `[{"step":"type","target":"[data-testid=\"NAME_INPUT\"]","value":"Guild One"}]` | Types into the field; a follow-up `look` shows the new value. | none confirmed | P1 | |
| SL-075 | `eval` | `[{"step":"eval","source":"document.title"}]` | Returns the raw JS expression's result. | none confirmed | P1 | |
| SL-076 | `box` | Run a `look` first, then `[{"step":"box","ref":<ref>}]` | Returns exact x/y/width/height for that one element. | none confirmed | P1 | |
| SL-077 | `dom` | `[{"step":"dom","target":"[data-testid=\"GUILD_LIST\"]","fields":["text","attrs"]}]` | Returns the narrow projected reading — never a bare `body *` scope (that returns unreadable stylesheet noise per the tool's own design notes). | none confirmed | P1 | |
| SL-078 | `dom` with `text: "full"` | `[{"step":"dom","target":"...","text":"full"}]` | Reads `textContent` (children included) instead of own-text-nodes only. | none confirmed | P1 | |
| SL-079 | `seed` | `[{"step":"seed","recipe":"guild-empty","as":"g"}]` | Runs the recipe against the live instance; binds `g` for later `{g.guild.id}` interpolation. | integration for the recipe/seam; none for this exact `run`-step path via CLI | P1 | |
| SL-080 | `seed` with `params` | `[{"step":"seed","recipe":"quest-advances-one-step","params":{"guildId":"<realGuildId>"},"as":"q"}]` | Succeeds where `start --seed` cannot — `run`'s `seed` step DOES accept `params`, unlike `start --seed`. Use this to actually exercise the four param-requiring recipes. | none confirmed via CLI | P1 | |
| SL-081 | `until` (`visible`) | `[{"step":"until","visible":"[data-testid=\"GUILD_LIST\"]","timeoutMs":10000}]` | Waits until the selector renders, or throws `UntilCeilingHitError` at the deadline. | none confirmed | P1 | |
| SL-082 | `until` (`predicate`) | `[{"step":"until","predicate":"document.querySelectorAll('[data-testid=\\"GUILD_ITEM\\"]').length === 1"}]` | Waits for the JS expression to become truthy. | none confirmed | P1 | |
| SL-083 | `until` (`console`) | `[{"step":"until","console":"hydrated"}]` | Waits for a console line matching that regex source. | none confirmed | P1 | |
| SL-084 | `until` (`response`) | `[{"step":"until","response":{"method":"GET","path":"/api/guilds"}}]` | Waits for a matching network exchange. | none confirmed | P1 | |
| SL-085 | `until` (`file`) | `[{"step":"until","file":"guilds/<id>/quests/<id>/quest.json"}]` | Waits for a file under the lane's home — works on `dungeonmaster-api` too (no browser needed for this form). | none confirmed | P1 | |
| SL-086 | `until` with zero conditions | `[{"step":"until"}]` | Contract refusal naming the five legal condition fields. | none confirmed via CLI | P2 | |
| SL-087 | `until` with two conditions | `[{"step":"until","visible":"x","console":"y"}]` | Same refusal — exactly one condition, never two. | none confirmed via CLI | P2 | |
| SL-088 | `key` | `[{"step":"key","press":"Enter"}]` | Sends the keypress to the page. | none confirmed | P1 | |
| SL-089 | `health` | `[{"step":"health"}]` | Returns the fixed-shape reading: root present, not blank, console errors, 5xx count, server log tail. | none confirmed | P1 | |
| SL-090 | `resize` | `[{"step":"resize","width":800,"height":600}]` | Resizes the browser viewport. | none confirmed | P1 | |
| SL-091 | `request` | `[{"step":"request","method":"GET","path":"/api/guilds"}]` | Works with NO browser — try this against a `dungeonmaster-api` instance too. Returns the raw HTTP exchange. | none confirmed | P1 | |
| SL-092 | `before` | `[{"step":"before","source":"window.__intervalCount = 0; const orig = setInterval; setInterval = (...a) => { window.__intervalCount++; return orig(...a); };"}]` followed by a `goto` | Installs the script BEFORE the page's own scripts run (Playwright `addInitScript`) — this is the trial's own documented technique for counting mount-time `setInterval` calls. | none confirmed | P1 | |
| SL-093 | `file` | `[{"step":"file","path":"guilds/<id>/config.json"}]` | Reads one file under the lane's home; no browser needed. | none confirmed | P1 | |
| SL-094 | `storage` | `[{"step":"storage"}]` | Returns localStorage/sessionStorage for the current origin. | none confirmed | P1 | |
| SL-095 | `storage` with `prefix` | `[{"step":"storage","prefix":"dm-"}]` | Same, narrowed to keys starting with that prefix. | none confirmed | P1 | |
| SL-096 | `paste` (by `filePath`) | `[{"step":"paste","target":"[data-testid=\"UPLOAD\"]","filePath":"/tmp/some-file.txt"}]` | Pastes file content into the target. | none confirmed | P1 | |
| SL-097 | `paste` (by `value`) | `[{"step":"paste","target":"[data-testid=\"NOTES\"]","value":"pasted text"}]` | Pastes literal text. | none confirmed | P1 | |
| SL-098 | `paste` with neither handle | `[{"step":"paste","value":"x"}]` (no `target`/`ref`) | Contract refusal: "requires at least one target handle". | none confirmed via CLI | P2 | |
| SL-099 | `paste` with neither payload | `[{"step":"paste","target":"..."}]` (no `filePath`/`value`) | Contract refusal: "requires at least one payload". | none confirmed via CLI | P2 | |
| SL-100 | `hold` | `[{"step":"hold"}]` (defaults) | Takes N frames at an interval; reports which differ — settlement/non-settlement, never a motion-quality verdict. | none confirmed | P1 | |
| SL-101 | `hold` with explicit frames | `[{"step":"hold","frames":5,"everyMs":1000}]` | Same, tuned. | none confirmed | P1 | |
| SL-102 | `video` start | `[{"step":"video","action":"start"}]` | Starts a screencast; `VideoResult` reports `status: 'started'`. | none confirmed | P1 | |
| SL-103 | `video` stop | `[{"step":"video","action":"stop"}]` (after start) | Stops; `VideoResult` reports the `.webm` path. | none confirmed | P1 | |
| SL-104 | `snapshot` | `[{"step":"snapshot","as":"before-click"}]` | Captures a named restore point; appears later in `snapshots`. | none confirmed via CLI | P1 | |
| SL-105 | `snapshot` with a reserved name | `[{"step":"snapshot","as":"run_1:start"}]` | Refused — names ending `:start`/`:end` are reserved for automatic per-run snapshots. | none confirmed | P2 | |
| SL-106 | `reset` (`level: "state"`) | `[{"step":"reset","level":"state","to":"before-click"}]` | Restores to the named snapshot. | none confirmed | P1 | |
| SL-107 | `reset` (`level: "state"`, no `to`) | `[{"step":"reset","level":"state"}]` | Contract refusal: `state` requires an explicit `to`. | none confirmed via CLI | P2 | |
| SL-108 | `reset` (`level: "page"`) | `[{"step":"reset","level":"page"}]` | Reloads the page without restoring app state. | none confirmed | P1 | |
| SL-109 | `reset` (`level: "instance"`) | `[{"step":"reset","level":"instance"}]` | Resets the whole instance to its boot state. | none confirmed | P1 | |
| SL-110 | `reset` with `reseed` | `[{"step":"reset","level":"instance","reseed":"guild-empty"}]` | Resets then re-seeds in one step. | none confirmed | P1 | |
| SL-111 | Unrecognised `step` value | `[{"step":"scroll"}]` | Contract refusal (discriminated union) — no such step. | none confirmed via CLI | P2 | |
| SL-112 | Step carrying an unrecognised extra field | `[{"step":"goto","path":"/","bogus":true}]` | `.strict()` refusal naming the extra key, not a silent strip. | none confirmed via CLI | P2 | |

### run — batch-level flags

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| SL-113 | `run --instance <id> --steps '[{"step":"goto","path":"/x-does-not-exist"}]'` (default `--stop-on`) | Batch stops at first failing step. `RunResult.stoppedAt` names it. | integration — `siegelense-run-layer-flow.integration.test.ts` | P2 | |
| SL-114 | Same batch with `--stop-on never`, plus a second, working step after the failing one | Both steps run; `stoppedAt` still names where it WOULD have stopped, not where it did. | none confirmed | P1 | |
| SL-115 | `run --instance <id> --steps-file /tmp/steps.json` (a file holding the same JSON array) | Same result as passing `--steps` inline. | none confirmed | P1 | |
| SL-116 | `run --instance <id>` with neither `--steps` nor `--steps-file` | Exits 1: "Exactly one of --steps or --steps-file is required... neither was given." | integration — same file | P2 | |
| SL-117 | `run --instance <id> --steps '[]' --steps-file /tmp/steps.json` (both) | Exits 1: "...both were given." | integration — same file | P2 | |
| SL-118 | `run` with no `--instance` | Exits 1: `--instance is required...` | integration — same file | P2 | |
| SL-119 | `run --instance <id> --steps 'not json'` | Exits 1: "...value is not valid JSON" naming the source flag. | integration — same file | P2 | |
| SL-120 | `run --instance <id> --steps '[...]' --json` | Prints raw `RunResult` JSON (status/index/shots), never step payloads. | integration — same file | P2 | |
| SL-121 | `run --instance inst_deadbeef00 --steps '[{"step":"look"}]'` (unknown instance) | Exits 1 naming the unknown instance. | none confirmed | P1 | |
| SL-122 | `run --instance <killedId> --steps '[{"step":"look"}]'` (against a killed instance) | Exits 1 — the driver socket is gone; a killed instance has no driver to submit a run to (per `CLAUDE.md`: "A killed instance has no driver"). | none confirmed | P1 | |

### status --instance followups (lifecycle checks)

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| SL-123 | `status --instance <id>` right after `start`, before any `run` | `runs: 0`, no `lastStep`. | integration — status flow test | P2 | |
| SL-124 | `status --instance <id>` right after Run 1 | `runs` incremented to 1, `lastStep` names the final step of that batch. | integration — status flow test | P2 | |
| SL-125 | `status --instance <id>` right after Run 2 | `runs` incremented to 2, `lastStep` reflects the second run. | integration — status flow test | P2 | |

### results

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| SL-126 | `results --instance <id> --run run_1` | Human answer: instance header, formatted step readings. | integration — `siegelense-results-layer-flow.integration.test.ts` | P2 | |
| SL-127 | `results --instance <id> --run run_1 --kind console` | Console buffer entries only. | integration — same file | P2 | |
| SL-128 | `results --instance <id> --run run_1 --kind network` | Network exchange entries only. | integration — same file | P2 | |
| SL-129 | `results --instance <id> --run run_1 --kind ws` | Websocket frames only. | integration — same file | P2 | |
| SL-130 | `results --instance <id> --run run_1 --kind server` | Server log lines only. | integration — same file | P2 | |
| SL-131 | `results --instance <id> --run run_1 --kind screenshots` | Screenshot metadata (paths, step index). | integration — same file | P2 | |
| SL-132 | `results --instance <id> --run run_1 --kind steps` | Step readings only (same as the default view, explicit). | integration — same file | P2 | |
| SL-133 | `results --instance <id> --run run_1 --step 2` | Just step index 2's payload. | integration — same file | P2 | |
| SL-134 | `results --instance <id> --run run_1 --where-path /api/guilds` | Network rows filtered to that path substring. | none confirmed | P1 | |
| SL-135 | `results --instance <id> --run run_1 --where-method POST` | Network rows filtered to POST. | none confirmed | P1 | |
| SL-136 | `results --instance <id> --run run_1 --where-nth 0` | Only the first matching row. | none confirmed | P1 | |
| SL-137 | `results --instance <id> --run run_1 --where-level error` | Console/server rows filtered to `error`. | none confirmed | P1 | |
| SL-138 | `results --instance <id> --run run_1 --where-steps 2-4` | Rows from steps 2 through 4 only. | none confirmed | P1 | |
| SL-139 | `results --instance <id> --run run_1 --fields step,status` | Projected answer, only those two fields per row. | none confirmed | P1 | |
| SL-140 | `results --instance <id> --since boot` | Reads the whole boot timeline (console/network/ws only — `sinceBootEligible`). | none confirmed | P1 | |
| SL-141 | `results --instance <id> --run run_1 --since boot` (both) | Exits 1: "--run and --since are mutually exclusive". | integration — same file | P2 | |
| SL-142 | `results --instance <id> --run run_1 --kind server --since boot` — the documented EDGE case | Per the plan's own audit finding: `since: 'boot'` wins the buffer filter (rows come from BOTH runs) while the answer still labels `runId` with the one named — mislabelled data, not an error. Worth re-confirming this is still true. | integration — same file (edge test added per audit) | P2 | |
| SL-143 | `results --instance <id> --kind console` (no `--run`, no `--since`, against a FINISHED/killed instance) | Exits 1 per the documented refusal: must name `--run` or `--since boot`. | none confirmed | P1 | |
| SL-144 | `results --instance <id>` (no `--run`, no `--since`, against a LIVE instance) | Resolves the latest run automatically (no refusal) — confirm this live/finished split actually holds. | none confirmed | P1 | |
| SL-145 | `results --instance inst_deadbeef00 --run run_1` (unknown instance) | Exits 1 naming the unknown instance. | none confirmed | P1 | |
| SL-146 | `results --instance <id> --run run_99` (unknown run) | Exits 1: `RunMissingError` naming the run. | none confirmed | P1 | |
| SL-147 | `results --instance <killedId> --run run_1` (post-kill, off-disk read) | Still answers — evidence reads go to disk, never the driver socket. `instanceState` on the answer says `killed`. | none confirmed via CLI (documented behaviour) | P1 | |
| SL-148 | `results --instance <id>` (no other flags) | Exits 1 unless the instance is live (see SL-144) — confirm the exact message. | none confirmed | P2 | |
| SL-149 | `results --instance <id> --run run_1 --json` | Raw `ResultsAnswer` JSON. | integration — same file | P2 | |

### snapshots

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| SL-150 | `snapshots --instance <id>` (before any `run`) | "none recorded yet". | integration — `siegelense-snapshots-layer-flow.integration.test.ts` | P2 | |
| SL-151 | `snapshots --instance <id>` (after at least one `run`) | Box table: `run_1:start`, `run_1:end` present — every run mints its own pair automatically. This is the audit's "populated list not driven through argv" item. | integration — same file (confirm it now drives a REAL populated list, not just empty/unknown) | P1 | |
| SL-152 | `snapshots --instance <id>` (after a `snapshot` step named `before-click`) | Table includes `before-click` alongside the automatic `run_N:start/end` pairs, flagged manual. | none confirmed | P1 | |
| SL-153 | `snapshots` (no `--instance`) | Exits 1: `--instance is required...no fleet-wide form.` | integration — same file | P2 | |
| SL-154 | `snapshots --instance <killedId>` | Empty list — snapshots die with the instance's throwaway home; `instanceState` on the answer says so. | none confirmed | P1 | |
| SL-155 | `snapshots --instance <id> --json` | Raw `SnapshotsAnswer` JSON: `instanceId`, `instanceState`, one row per point with `name`/`atMs`/manual flag. | integration — same file | P2 | |

### compare

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| SL-156 | `compare --instance <id> --run-a run_1 --run-b run_2` | Human answer: console/server/network error deltas, pixel diff summary — a reading, not a verdict. | integration — `siegelense-compare-layer-flow.integration.test.ts` | P2 | |
| SL-157 | `compare --instance <id> --run-a run_1 --run-b run_1` (same run twice) | Zero delta everywhere — confirm it does not error on identical run ids. | none confirmed | P2 | |
| SL-158 | `compare --instance <id> --run-a run_1` (missing `--run-b`) | Exits 1: `--run-b is required...` | integration — same file | P2 | |
| SL-159 | `compare --run-a run_1 --run-b run_2` (missing `--instance`) | Exits 1: `--instance is required...` | integration — same file | P2 | |
| SL-160 | `compare --instance-a <id> --instance-b <id2> --run-a run_1 --run-b run_1` | Exits 1: named-by-flag refusal — "there is no cross-instance form". | integration — same file | P2 | |
| SL-161 | `compare --instance <id> --run-a run_1 --run-b run_2 --json` | Raw `CompareAnswer` JSON, no `elements` field (element delta is a documented gap — `compareAnswerContract` is `.strict()` and refuses one). | integration — same file | P2 | |
| SL-162 | `compare --instance <id> --run-a run_9 --run-b run_2` (unknown run) | Exits 1 naming the unknown run. | none confirmed | P1 | |

### kill

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| SL-163 | `kill --instance <id>` | Three lines: instance id, processes reaped, whether the throwaway home was removed. | integration — `siegelense-kill-layer-flow.integration.test.ts` | P2 | |
| SL-164 | `status --instance <id>` (right after kill) | State is `killed` in the registry, row NOT deleted. | integration — status flow test | P2 | |
| SL-165 | `kill --instance <id>` again (already killed) | Confirm the exact behaviour — idempotent no-op, or a refusal? Not documented in `--help`'s refusals list. | none confirmed | P1 | |
| SL-166 | `kill` (no `--instance`) | Exits 1: `--instance is required: kill needs an instance id to tear down.` | integration — same file | P2 | |
| SL-167 | `kill --instance inst_deadbeef00` (never-existed id) | Confirm whether this is refused as unknown, or accepted (the help text says kill "accepts an already-dead instance id too, reaping its orphaned process groups from its heartbeat file" — but that's for a REGISTERED id whose driver died, not a wholly unknown one). | none confirmed | P1 | |
| SL-168 | `kill --instance <id> --json` | Raw `KillResult` JSON. | integration — same file | P2 | |

### prune

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| SL-169 | `prune` (bare) | Human summary: freed MB/bytes, removed[], refused[] (with citing file), unresolved[] (open-issue kind, always unresolved). | integration — `siegelense-prune-layer-flow.integration.test.ts` | P2 | |
| SL-170 | `prune --older-than 1h` | Only assets older than 1h swept. | integration — same file | P2 | |
| SL-171 | `prune --kind log --older-than 0s` | Only `.log` files removed; shot/transcript/video on the same instance untouched. | integration — same file (proven for real on disk) | P1 | |
| SL-172 | `prune --kind shot --older-than 0s` | Only screenshots removed. | integration — same file | P1 | |
| SL-173 | `prune --kind transcript --older-than 0s` | Only `.jsonl` transcripts removed. | integration — same file | P1 | |
| SL-174 | `prune --kind video --older-than 0s` | Only `.webm` files removed. | integration — same file | P1 | |
| SL-175 | `prune --kind video` (no `--older-than`) | Resolves to the SHARED 7d default, not `cleanup`'s own 2d video window — a video younger than 7d but older than 2d survives a `prune --kind video` with no window, and only `cleanup`'s fixed sweep would take it. | integration — same file (proven with a real backdated 3-day file) | P1 | |
| SL-176 | `prune --instance <id> --older-than 0s` | Only that instance's assets swept; a neighbouring instance's evidence is untouched. | integration — same file | P1 | |
| SL-177 | `prune --instance <liveId> --older-than 0s` | Refused: `<id> (live — last beat <n>s ago)` — a live instance is refused regardless of window. | integration — same file | P1 | |
| SL-178 | `prune --instance <citedId> --older-than 0s` (an instance a VERIFIED prelude or open quest's WALKED note cites) | Refused, naming the citing quest file and prelude path plus the run id. Every answer also lists `unresolved: [{kind:'open-issue', ...}]` — the third citation kind is never checked. | integration — same file | P1 | |
| SL-179 | `prune --older-than not-a-window` | Exits 1 at the argv edge, before any directory is read — bad window format refused up front. | none confirmed via CLI | P2 | |
| SL-180 | `prune --kind bogus` | Exits 1: unknown kind, naming the four real ones. | none confirmed via CLI | P2 | |
| SL-181 | `prune --json` | Raw `PruneAnswer` JSON. | integration — same file | P2 | |

### driver (internal, but technically typeable)

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| SL-182 | `dungeonmaster siegelense driver` (no `--instance`) | Exits 1: `--instance is required: name the instance to drive.` — note this is NOT routed through `CALL_ROUTES`; it is special-cased in `siegelense-flow.ts` before the closed-call-name check. | none confirmed | P3 | |
| SL-183 | `dungeonmaster siegelense driver --instance <alreadyRunningId>` | Help text calls `driver` "internal — `start` spawns it; nobody types it" and gives it no synopsis, yet the flow lets anyone type it directly against an id `start` already spawned a driver for. Worth confirming what actually happens (a second driver contending for the same socket, a clean refusal, or something else) — this is a real gap between the documented contract ("not directly invocable") and the actual routing code. | none confirmed | P1 | |

### Cross-cutting error paths and help

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| SL-184 | `dungeonmaster siegelense --help` | Index page: headline, footer, built-call count vs. total (should read `13/13` — every named call is built). | integration — `siegelense-flow.integration.test.ts` | P2 | |
| SL-185 | `dungeonmaster siegelense -h` | Same as `--help`. | integration — same file | P2 | |
| SL-186 | `dungeonmaster siegelense bogus-call` | Exits 1: `Unknown siegelense subcommand: bogus-call` plus the USAGE line. | integration — same file | P2 | |
| SL-187 | `dungeonmaster siegelense status --help` (a call's own `--help` mid-args) | Prints that call's page and returns success — confirmed to work BEFORE any flag parsing/refusal for that call. | integration — same file | P2 | |
| SL-188 | `dungeonmaster siegelense` (bare, no args) | Routes to the fleet listing — same as `status` with no flags. | integration — same file | P2 | |

## Install-side cases

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| SL-189 | `ls -la .dungeonmaster-assets/siegelense-assets` at repo root | A symlink resolving to this checkout's siegelense root (via `locationsRootPathFindBroker`). | integration — `install-flow.integration.test.ts` | P2 | |
| SL-190 | `ln -s /tmp .siegelense` at repo root (simulate a pre-nesting legacy install), then `npm run init` | The flat `.siegelense` symlink is removed (checked via `readlink`, never `existsSync`, so it correctly tells a dangling link from a real directory); the nested `.dungeonmaster-assets/siegelense-assets` link is (re)created or confirmed correct. `dungeonmaster init`'s own output/message should say `removed legacy .siegelense symlink`. Clean up: nothing to undo — the legacy link is gone by design. | integration — `install-link-create-responder` test suite | P2 | |
| SL-191 | `mkdir .siegelense` (a REAL directory, not a symlink) at repo root, then `npm run init` | Left untouched — install reports "`.siegelense` is a real directory or file; left untouched" rather than deleting it. Clean up: `rmdir .siegelense` afterward. | integration — same suite | P2 | |
| SL-192 | Inspect `packages/hydration-recipes/dist/index.js`'s exports after a build | Three named exports per `recipesConventionStatics.exports`: a manifest, a listing-build function, and a seed-run function — this is what `recipes`/`start --seed`/`run`'s `seed` step all read. | integration — `hydration-recipes-exports.integration.test.ts` | P3 | |

## Known open items

- **`start --seed` cannot pass recipe params — 4 of 9 catalog recipes are unreachable through `start`.**
  `instanceStartBroker` hardcodes `parameters: {}` at `packages/siegelense/src/brokers/instance/start/instance-start-broker.ts:393`.
  `quest-advances-one-step` (`guildId`), `session-single-turn` (`guildPath`), `session-with-nested-chain`
  (`guildPath`) and `session-with-nested-subagent` (`guild`) all declare required `inputs` with no
  default. See SL-059 through SL-062. `run`'s `seed` STEP does accept `params` (SL-080) — that is the
  only reachable way to seed these four today.
- **The driving-oddities file (commit `7c5ab8f7c`) has no CLI surface at all.** `drivingOddityAppendBroker`
  / `drivingOddityReadBroker` exist and are tested at the broker level, but nothing in
  `siegelenseCallStatics.calls.names`, no `step`, and no responder ever calls them. There is no manual
  case that exercises this through the CLI — it is dead code from a walkthrough's perspective. Its home
  is `.dungeonmaster-assets/` per its own header, alongside the `siegelense-assets` link.
- **`docs`'s five scopes are the current, correct surface.** Design scrolls
  (`scrolls/seigelense/siege-verification-remainder.md` §9c) describe a planned sixth/seventh scope
  (`operating`, `operational`) for future browserless/operator work — not built, and
  `siegelenseCallStatics.docs.scopes` confirms only the five above exist today.
- **`recipes-catalog-broker.ts` now wires all 9 recipes** — `session-with-nested-subagent` (the
  design-scroll's "orphaned ninth recipe") is live in the catalog. Treat that scroll note as stale.
- **`13a`/`13b` (element delta, `compare`'s `elements` field) remain unbuilt**, confirmed by
  `compareAnswerContract` still being `.strict()` with no `elements` key (SL-161).
- **`driver` is typeable directly**, contradicting its own help text ("not directly invocable"); see
  SL-183.
- **The audit's "Still open" items are mostly closed now** — see the table below. Several already have
  real, unmocked integration coverage (`capacity` unknown-spec, all four `prune --kind` values, `prune
  --kind video` default window, all five `docs` scopes). `start --quest`/`--guild` alone and the whole
  `--seed` matrix remain genuinely untested through the CLI.

## Sources

- `packages/siegelense/CLAUDE.md` — the package's own house rules (ambiguity throws, `run`/`results`
  split, evidence-reads-go-to-disk, `dev:no-watch`).
- `packages/hydration-recipes/CLAUDE.md` — the 5 real ingredients, their `copies:`, the quest transition
  gate mechanics, and the recipe-seam contract.
- `packages/siegelense/src/flows/siegelense/siegelense-flow.ts` — the call router.
- `packages/siegelense/src/flows/siegelense/siegelense-*-layer-flow.ts` and their `.integration.test.ts`
  siblings — one per call, the real argv-to-behaviour surface.
- `packages/siegelense/src/statics/siegelense-help/siegelense-help-statics.ts` — the `--help` text.
- `packages/siegelense/src/statics/docs/docs-statics.ts` — the `docs` role manuals.
- `packages/siegelense/src/contracts/step/step-contract.ts` — the 23-verb step union.
- `packages/hydration-recipes/src/brokers/recipes/catalog/recipes-catalog-broker.ts` — the live recipe
  catalog.
- `packages/siegelense/src/brokers/instance/start/instance-start-broker.ts` — where `--seed` params are
  hardcoded empty.
- `scrolls/seigelense/remaining-build-items.md`, `siegelense-recipes.md`, `siege-verification-remainder.md`,
  `siegelense-recipe-roles.md`, `siegelense-tooling.md` — design-intent scrolls; several describe
  unbuilt future work (element delta, settle-based stepping, operational docs scope) rather than the
  current call surface.
