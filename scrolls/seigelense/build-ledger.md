# Siegelense build ledger

Running coverage of `siegelense-tooling.md` (2,897 lines) against what has been planned and delivered.
**One row per spec section**, keyed by heading text and line number. Every round updates this file.

Status vocabulary:

| Status | Means |
|---|---|
| `NOT STARTED` | nothing plans it yet |
| `PLANNED chunk N` | a chunk plan under `plans/` covers it, wholly |
| `PLANNED chunk N (part)` | a chunk plan covers some of it; the notes column says which part, and the rest stays open |
| `DELIVERED` | built, reviewed and manually exercised |
| `N/A — spec-side, not tooling` | the document itself says this is not tooling work |

Chunk plans live in `scrolls/seigelense/plans/`. Chunk 1 is `plans/chunk-01-registry-spine.md`.

---

## Part 1 — The architecture (line 9)

| Section | Line | Requires | Status | Notes |
|---|---|---|---|---|
| Decision: an INSTANCE service, reached over MCP | 11 | Thirteen MCP tools over a per-instance driver; steps are DATA inside `run`, never tools | NOT STARTED | Chunk 1 pins the thirteen NAMES in a package-local statics; the registrations themselves need the driver |
| The shape | 42 | `start` → id; `run` → status-index; `results` → narrow query; `kill` → teardown | NOT STARTED | |
| An instance is a TIMELINE of runs, and every run is addressable | 63 | Run ids minted per run, step numbering restarting at 1, run-namespaced shots, continuous buffers with per-run windows, refs surviving a run boundary | NOT STARTED | Chunk 1 delivers the `RunId` / `StepIndex` contracts that pin the numbering rule; the buffers and windows are later |
| Many sessions, one machine: a disk REGISTRY, not a master | 116 | `registry.json`, `boot.lock`, `profiles/<hash>/`, `guilds/<guildId>/instances/<id>/`, `unowned/instances/<id>/`, the `<repoRoot>/.siegelense` symlink, guild partitioning by the QUEST's guild | **PLANNED chunk 1** | The whole tree, its resolvers, and the symlink `init` creates |
| What the registry has to make safe | 179 | Port claim before bind, `boot.lock` across processes, reservation before boot, append-only profile samples, assets under the minted id | **PLANNED chunk 1 (part)** | Four of the five rows. `profile writes` (line 186) needs the sampler and moves to the capacity chunk |
| Retention: assets outlive their instance, and something must prune them | 197 | Age-out windows, `prune` refusals, video first, citation resolution through `.quest-plans/`, never prune on `start` | NOT STARTED | Part 7 item 2c |
| Reading evidence starts nothing, and that is a SEPARATE PATH through the tool | 238 | Every evidence read resolves off disk; only `start`/`run`/`kill` need a driver; tombstones; no browsing | NOT STARTED | Part 7 item 2a. Chunk 1's `InstanceState` contract carries the `pruned`/`unknown` answers this section demands |
| What a batch buys beyond call count | 293 | Batched steps at millisecond gaps so a race is reachable; stop-on-first-failure; mid-walk branching is the cost | NOT STARTED | |

## Part 2 — The capabilities, and the problem each one solves (line 304)

| Section | Line | Requires | Status | Notes |
|---|---|---|---|---|
| Addressing: a listing, not a selector | 306 | The key: four columns, element-bound refs, the whole flag set, `within` scoping, document order, own text nodes, the naming ladder | NOT STARTED | Part 7 item 7 |
| The `attrs` column — what the element DECLARES, in the app's own words | 408 | `href` as `→ /path`, `data-*`, input constraints, `type`, `title`; a budget; runtime-id values dropped; `className` excluded | NOT STARTED | Part 7 item 7 |
| "Does this element have a click handler?" — four routes, and none of them answers it here | 449 | `not-tabbable` stays a labelled PROXY; listeners only on `dom` over CDP; nothing infers a dead control | NOT STARTED | |
| Two key-level readings, which are not row flags at all | 479 | The duplicate-testId line under the key; `role` beside the tag in the element column | NOT STARTED | |
| What is deliberately NOT computed, and why | 496 | No sibling rect intersection, no per-row listeners, no z-index analysis, nothing about motion; a flag earns its place by being ABSENT on most rows | NOT STARTED | |
| `dom` is the ESCAPE HATCH, and the ladder above it has four rungs | 563 | `look` → `look { within }` → `box` → `dom`; own text by default, `fields:` projection, a cap that reports the true count | NOT STARTED | Part 7 item 10 |
| Perception: three artifacts, and they are not interchangeable | 623 | The shot (evidence), the map (optional, later), the key; different filters; always capture, open on signal | NOT STARTED | Part 7 item 6 |
| `pixelChange` — an attention router, not a measurement | 668 | One number per acting step; `null` on the first capture; `blank` checked FIRST with its colour; paired with the element delta | NOT STARTED | Part 7 item 6 |
| Settling: a step ends when the page is DONE, not when a clock says so | 738 | Network + paint + DOM quiet together, repeating patterns discounted, a CEILING not a timeout, the settle state reported | NOT STARTED | |
| Instrumentation: run a script before the page's | 773 | A `before` step over `addInitScript` | NOT STARTED | Part 7 item 5 |
| Computed findings: on the key's rows, not in a command of their own | 781 | The geometry checks ride the key row, never a separate command | NOT STARTED | Part 7 item 7 |
| Time: what is decidable, and what is not | 796 | `hold` detects non-settlement; `video` is for a human; nothing grades motion quality | NOT STARTED | Part 7 item 11 |
| What no track can settle goes to a PERSON, with its evidence attached | 832 | `verifyByHuman: true`, dropped from every automated denominator, collected into a list with its evidence | `N/A — spec-side, not tooling` | Part 7 item 11b: "otherwise the only options are an unsignable unit nobody can close, or a real expectation nobody ever checks. Spec-side work, not tooling" (line 1927) |
| The test lives in ONE shared place, and ChaosWhisperer reads it too | 885 | One statics, three readers — the author, the denominators, the walker | `N/A — spec-side, not tooling` | Same item 11b. The walk-side evidence collection it describes is the `video` step, tracked under Part 7 item 11 |
| Survival: what a stress tester needs and the verifier does not | 931 | `health` — one reading, one verdict line, including the server logs | NOT STARTED | Part 7 item 8 |
| Resetting: three layers, and a reset must say which one it touched | 974 | `page` / `state` / `instance`; named snapshots with an explicit `to`; the diff reported; the snapshot covers STATE only | NOT STARTED | Part 7 item 14 |
| Baselines: promoting a walk's shots | 1033 | Per-shot promotion off sign-offs, the `node:` label, baselines fetched by `results` against the happy walk's instance | NOT STARTED | |
| Teardown: the failure that is silent, costs three processes, and is never noticed by the session that caused it | 1077 | Process-group kill, SIGTERM → grace → SIGKILL, skip the signal for an exited child, home removed, evidence kept | NOT STARTED | Part 7 item 2b. Chunk 1 records the pgids the teardown will need |
| When it dies without warning: OOM, SIGKILL, a full disk | 1111 | The heartbeat file (pid, instance id, every child's pgid, a timestamp), reaping on next contact, per-step transcript flush, `status` as post-mortem, disk checks | **PLANNED chunk 1 (part)** | Chunk 1 delivers the heartbeat FILE and stale-instance detection. `status`, `likelyCause`, the OOM evidence and the disk checks are later |
| When a session's instance dies under it: bubble up, never self-heal | 1200 | A dead instance is `rework`, never `wall`; no self-healing; only the operator sees the pool | `N/A — spec-side, not tooling` | Prompt text for the walker, the antagonist and the planner — not a change in this package. Ships with the `docs { for: … }` scopes |
| The crash a walker must NOT mistake for a defect | 1224 | `status` separates a driver death from a child death; a walk checks `status` before writing anything down | NOT STARTED | The tooling half is `status`; the ordering rule is prompt text |
| Handing a defect to a fixer: what a walker must write down | 1243 | Instance id, run id, failing step, the prelude, the evidence paths; `results` answering for a killed instance; a required run id against a finished one | NOT STARTED | Part 7 items 2a and 4b |
| The fixer writes the e2e, and the PRELUDE is what makes that possible | 1282 | A recipe is a plain function an e2e calls directly, so the walk and its regression test share one seeding vocabulary | NOT STARTED | Part 7 items 3 / 3a |
| What the operator owns after a crash | 1303 | `status` → `cleanup` → re-read `capacity` → re-dispatch; no phase advances with an instance in an unknown state | NOT STARTED | The tooling half is `status` + `cleanup`; the ordering is prompt text |
| `cleanup` — the operator's bookend | 1318 | `cleanup {}` reaping by staleness, releasing ports and the lock, ageing assets, and reporting `leftAlone` | NOT STARTED | Chunk 1 delivers the staleness primitive `cleanup` is built on |
| Testing teardown — ONCE, as the tool's own suite. Never per quest. | 1353 | Seven teardown assertions, each shown FAILING against broken teardown first, including the three-instance parallel case | NOT STARTED | Part 7 item 2b |

## Part 3 — Restructuring the pass (line 1386)

| Section | Line | Requires | Status | Notes |
|---|---|---|---|---|
| Profiling: measure what an instance costs, then divide | 1388 | Sample RSS per process group, record STEADY and PEAK, key by the spec's content hash, divide by `peak` | NOT STARTED | Chunk 1 delivers the `SpecHash` contract and the `profiles/<hash>/` path resolver |
| Phase zero IS the profiling run, and that has two consequences | 1417 | The planner profiles solo; solo profiling is optimistic; an OOM death corrects the profile; memory travels between machines and timing does not | NOT STARTED | |
| The TOOL staggers, because nobody else can | 1456 | `start` queues, admits one boot at a time, refuses past the pool, blocks and reports `queuedMs` / `aheadOfMe`; `capacity` counts foreign load; one hard floor | NOT STARTED | Chunk 1 delivers `boot.lock` — the mechanism the queue is built on |

## Part 4 — Decisions already taken (line 1530) · 4A — What the tool implements (line 1544)

| Section | Line | Requires | Status | Notes |
|---|---|---|---|---|
| Readings, and what a step may never do | 1546 | A step returns a READING; ambiguity THROWS with candidates; the no-pick rule held by LINT; `querySelector` banned in eval source by the package `CLAUDE.md` | **PLANNED chunk 1 (part)** | Chunk 1 writes the package `CLAUDE.md` (line 1554) carrying all four rules. The lint rule and the command implementations are Part 7 item 16 |
| Addressing: the key, refs, the map | 1556 | Every key/ref/map decision — four columns, the flag set, the `dom` ladder and its guards, ephemeral refs, the map shipped last | NOT STARTED | Part 7 item 7 |
| Perception: shots, pixelChange, animation | 1587 | Only the shot is evidence; always capture with `open:` flags; the `node:` label; frozen comparison captures; nothing grades animation | NOT STARTED | Part 7 item 6 |
| The service: instances, runs, batches | 1606 | Thirteen tools; `docs` as a call; thin clients over a socket; the disk registry; port claim; reservation; `boot.lock`; append-only samples; staleness reaping; minted ids; run timelines; disk-resolved reads; `compare`; `stopOn`; settle | **PLANNED chunk 1 (part)** | Chunk 1 covers lines 1617–1620, 1623, 1628, 1630. Everything else in this table stays open |
| Snapshots, reset, and the state/evidence line | 1644 | Named snapshots, the automatic `run_N:start`/`run_N:end` pair, the state-subtree boundary, three reset levels, the diff reported | NOT STARTED | Part 7 item 14 |
| Teardown and crash recovery | 1654 | `kill` mandatory; teardown its own concern; the heartbeat file and its pgids; staleness reaping; tombstones; guild partitioning; the `.siegelense` symlink; per-step flush; disk checks; no auto-restart | **PLANNED chunk 1 (part)** | Chunk 1 covers lines 1666, 1667, 1670, 1672, 1673. `kill`, the teardown suite, `status`, retention and the disk checks stay open |
| Capacity and profiling | 1685 | A measured pool size; RSS sampling; the content hash key; `suggested: 2` with no profile; staggered starts; `queuedMs`; the policy ceiling; foreign load; the `why` sentence; the hard floor | NOT STARTED | |
| Recipes: what one is and what holds it | 1705 | The package names as conventions; `init` scaffolds the recipes package; an empty one is a real answer; recipes are a graded PACKAGE; listable without running; explicit dependencies; `fidelity` / `mirrors:`; determinism; `seed` as a step; the oddities file | **PLANNED chunk 1 (part)** | Chunk 1 covers lines 1710–1713 and 1717 — the two packages exist, made with `dungeonmaster create-package`, and `init` scaffolds the recipes one. The recipe CONTENT, `produces:`, `fidelity`, listing and the DOM-handle lint rule are Part 7 items 3 / 3a / 16 |

## Part 5 — The determinism this system depends on (line 1733)

| Section | Line | Requires | Status | Notes |
|---|---|---|---|---|
| What the TOOLING must guarantee | 1743 | Nine invariants: ref stability, key row order, element identity, port claiming, retention, append-only evidence, per-run step numbering, settle-based steps, one boot at a time, pool size on every sample | **PLANNED chunk 1 (part)** | Chunk 1 covers the port-allocation row (1750) and the one-boot-at-a-time row (1755), and pins the per-run step numbering row (1753) in the `StepIndex` contract |
| What the CONTENT must guarantee | 1758 | A recipe's output bytes, its timestamps, ids that paint, ordering; no `Date.now()` / `Math.random()` / `randomUUID()` reaching a screen | NOT STARTED | Part 7 items 3 / 16 |
| Animation is the one that conflicts with the product | 1771 | `animations: 'disabled'` and `caret: 'hide'` on every comparison capture; `before` freezes JS-driven motion; `video` and `hold` stay live | NOT STARTED | Part 7 item 6 |
| The honest limit | 1801 | `pixelChange: 0%` is a strong signal, never a verdict; `blank` is the one exact exception | NOT STARTED | |

## Part 6 — The recipe book (line 1815)

| Section | Line | Requires | Status | Notes |
|---|---|---|---|---|
| The tool is `siegelense`, and its recipes live beside it | 1817 | `packages/siegelense/`, `dungeonmaster siegelense`, `siegelense-*` tools, `packages/siegelense-recipes/`; `init` scaffolds the recipes package; an empty one is a real answer; both real workspace packages; subpath-importable barrels that do not pull msw; the monorepo limit stated | **PLANNED chunk 1 (part)** | Chunk 1 delivers both packages, the barrels, the `init` scaffold and the empty-is-an-answer property. The `dungeonmaster siegelense` CLI subcommand and the recipe listing are deferred |

## Part 7 — Where to go, in order (line 1906)

| # | Line | Requires | Status | Notes |
|---|---|---|---|---|
| 1 | 1910 | Gate `POST /api/tooling/smoketest/run` at registration, with an absence test | NOT STARTED | **Out of this build's scope — see the chunk 1 plan's scope statement.** It is a pre-existing gap in `packages/server/src/flows/tooling/tooling-flow.ts`, which the document itself calls an "Independent live finding". Its pattern (`E2E_SIGNAL_BACK_HTTP` in `packages/server/src/flows/quest/quest-flow.ts:198`) already exists. Raise it as its own commit rather than coupling a server security fix to a new package |
| 2 | 1911 | The instance service — start / run / results / kill / capacity / profile / status / cleanup / docs, status-as-index with shot list and `open:` flags, refs invalidated on navigation/reset/restart, RSS per process group | **PLANNED chunk 1 (part)** | Chunk 1 delivers the registry, the locations, the heartbeat and the reservation/port-claim primitives every one of those calls sits on. The driver process, the tool registrations and the calls themselves are chunk 2 and after |
| 2a | 1912 | The evidence read path — `results`/`status` off the asset tree, guild partitioning, the `.siegelense` symlink `init` creates and ignores, every returned path absolute and repo-local | **PLANNED chunk 1 (part)** | Chunk 1 delivers the symlink, its gitignore + check-glob exclusion, the guild/unowned partitioning and the repo-local path resolvers. The `results` and `status` calls themselves are later |
| 2b | 1913 | Teardown and crash recovery, tests written red-first — process groups, port release, home removal, evidence retention, idle-timeout reaping, the three-instance parallel case, the heartbeat file and stale-instance reaping | **PLANNED chunk 1 (part)** | Chunk 1 delivers the heartbeat file and stale-instance detection — the document calls those "the ONLY defence against a SIGKILLed driver". The rest ships with the driver, in the same chunk as `kill` |
| 2c | 1914 | Retention and tombstones — the quest id recorded at `start`, `prune`/`cleanup` resolving citations through `.quest-plans/` and naming the citing file, a reaped entry surviving as a tombstone, a pruned query answering `pruned` | **PLANNED chunk 1 (part)** | Chunk 1 records the quest id and the tombstone fields on the registry entry, and the `pruned`/`unknown` members of `InstanceState`. The resolution of citations and the ageing itself are later |
| 3 | 1915 | The recipe book — free the HTTP-only harnesses, expose the free ones by name, add `produces:` and `fidelity`, make them listable | NOT STARTED | Foundation half (the package exists) is chunk 1; the content is not |
| 3a | 1916 | Recipe integration tests — each asserts its own `produces:`; `direct` ones assert against `mirrors:`; production ones share one instance | NOT STARTED | |
| 3b | 1917 | The PLANNER role — maps paths to recipes, proves every prelude by running it, dispatches for research and diagnosis | NOT STARTED | Prompt work in `packages/orchestrator`, not this package |
| 4 | 1918 | A transcript of every step and reading, written by the instance | NOT STARTED | |
| 4b | 1919 | The record's `WALKED` field — instance id and run id against every path walked and every attack run, clean ones included | `N/A — spec-side, not tooling` | The document's own words: "Spec-side work: a quest-contract change, not tooling. See `siege-verification-remainder.md` Part 4" |
| 5 | 1920 | `before` — run a script ahead of the page's own | NOT STARTED | |
| 6 | 1921 | Capture on every acting step, frozen for the comparison path, with a change-amount number; open start and end | NOT STARTED | "The only item that changes what gets SIGNED" (line 1944) — ship this one first if any capability ships alone |
| 7 | 1922 | The key as a tree — element-bound refs, `within`, four columns, the duplicate-testId line; ship without the map | NOT STARTED | |
| 8 | 1923 | `health`, one reading with one verdict line, including the server logs | NOT STARTED | |
| 9 | 1924 | `until` — wait on a response, a file or a predicate | NOT STARTED | |
| 10 | 1925 | Selectable readings — `network` by method and path with field projection; the same plus a self-reporting cap on `dom` | NOT STARTED | |
| 11 | 1926 | `hold` (non-settlement, live) plus `video` (for a human, never graded) | NOT STARTED | |
| 11b | 1927 | The human-check route — a flag on the observable, dropped from automated denominators, collected into a list handed to the user | `N/A — spec-side, not tooling` | The document's own words: "Spec-side work, not tooling" |
| 11c | 1928 | The declared-value block and its third reader — extract the duplicated enumeration into one interpolated statics, add the siege consequence, give `siegemaster-prompt-statics.ts` a rule for an UNFLAGGED one | `N/A — spec-side, not tooling` | The document's own words: "Spec-side work, not tooling" |
| 11d | 1929 | `siegemaster-reader` — a minion that opens the files a walk must not, returning values with `file:line` | NOT STARTED | Not this package: `agentPromptNameContract`, `agentPromptClassificationStatics.minionNames` and `agentNameToPromptTransformer` all live in `packages/orchestrator` |
| 11e | 1930 | `siegemaster-operational` — a per-operational-flow minion, plus `process-state`, `environment`, a wider log tail and a named elapsed figure | NOT STARTED | Split ownership: the surfaces are steps in this package, the minion is an orchestrator prompt |
| 11f | 1931 | The `(human-check)` PANEL on the quest, in the web UI | NOT STARTED | `packages/web`, not this package |
| 11g | 1932 | A `walked` kind on `questNotes`, with typed `instanceId` and `runId` | NOT STARTED | `packages/shared` contract + `packages/orchestrator`. It is what `prune` and `cleanup` resolve a `WALKED` citation against, so it gates item 2c's refusal rule |
| 11h | 1933 | Print the owning NODE id in `get-qa-checklist` | NOT STARTED | `packages/orchestrator` / `packages/mcp`, not this package |
| 12 | 1934 | Server-side failure injection | NOT STARTED | |
| 13b | 1935 | `compare { runA, runB }` — the index delta between two runs | NOT STARTED | |
| 14 | 1936 | The three reset levels with named snapshots and an explicit `to`, each reporting the diff it undid | NOT STARTED | |
| 15 | 1937 | `resize`, and a direct `request` step for the curl surface | NOT STARTED | |
| 16 | 1938 | The two local lint rules — no `.first()`/`.last()` in a command, no DOM handle in a recipe — plus the package `CLAUDE.md` | **PLANNED chunk 1 (part)** | Chunk 1 delivers the package `CLAUDE.md` only. Both lint rules are deliberately deferred to the chunks that create their targets (the commands, and the recipes); a rule with no subject cannot be shown firing |
| 17 | 1939 | The lane spec and N ports; move it where consumers get it | NOT STARTED | The largest item. `siege-lane.ts`'s `SERVER_WORKSPACE` / `WEB_WORKSPACE` literals, exactly-two-processes, the fake-CLI env block and `REPO_ROOT` resolved four directories up. "Items 4 to 16 are additive to files item 17 moves. Doing 17 first means doing them twice." (line 1947) |

## Part 8 — The surface, consolidated (line 1956)

| Section | Line | Requires | Status | Notes |
|---|---|---|---|---|
| The rule that governs every targeting step | 1961 | Three outcomes per targeting step; AMBIGUOUS carries the candidates with their refs; NO MATCH names near misses; a ref is never ambiguous and answers `stale` | NOT STARTED | |
| Holding the no-pick rule mechanically | 1998 | A local lint rule banning `.first()`/`.last()` on a locator in a command; `.nth()` only with caller input; the rule states its own scope; `querySelector` in eval source held by the package `CLAUDE.md` | **PLANNED chunk 1 (part)** | The `CLAUDE.md` half only — see Part 7 item 16 |
| Refs are for DRIVING. Selectors are for RECORDING. | 2020 | A ref is ephemeral, scoped to one instance and one page state; four boundaries it cannot cross; never stored; binds to an element not a row number | NOT STARTED | |
| The package needs a `../../CLAUDE.md`, and these are the entries | 2070 | Twelve named invariants, each with the measurement behind it | **PLANNED chunk 1** | Written in full at `packages/siegelense/CLAUDE.md` in chunk 1, so every later agent reads them before writing the code they bind |
| The thirteen calls | 2094 | Every tool registered as `siegelense-<name>`; steps are not tools; only `start`/`run`/`kill` need a live instance | **PLANNED chunk 1 (part)** | Chunk 1 pins the thirteen names and the prefix in a package-local statics. Registration in `mcpToolsStatics` and the flow is deferred — it triggers the ~29-file cascade `packages/mcp/CLAUDE.md` documents |
| Steps that exist today and are kept | 2365 | `goto`, `waitFor`, `look`, `click`, `type`, `key`, `paste`, `box`, `screenshot`, `dom`, `storage`, `eval`, `file`; ambiguity now throws; `end` becomes `kill` | NOT STARTED | Today's source is `packages/web/test/siege-driver/siege-command.ts` |
| Steps that are new | 2397 | `look`, `before`, `health`, `reset`, `snapshot`, `seed`, `until`, `hold`, `video`, `request`, `resize` | NOT STARTED | |
| Results queries | 2523 | `console` · `network` · `ws` · `server` · `screenshots` · `steps`; per-step attribution on every entry; projection and filtering | NOT STARTED | |
| What every acting step returns, on top of its own reading | 2564 | `shot`, `pixelChange`, `elements` on every acting step | NOT STARTED | |
| A worked batch | 2577 | `as` naming a step's output and `{name.field}` reading it back; `stopOn`; `expect: 'error'`; a step expecting failure that succeeds is itself a finding | NOT STARTED | |
| A FIXER reading a finished instance | 2615 | Steps 1–4 start nothing; repo-local absolute shot paths; server-log window; per-step network; reproduction on a FRESH instance; the same recipes in the e2e | NOT STARTED | |
| Interleaving recipes and steps | 2698 | `seed` placeable anywhere; recipes composed by explicit parameters; seeding with a page open; a reload where no socket drives the surface | NOT STARTED | |
| Cycles — run, snapshot, collect, repeat | 2747 | The two cycle shapes; `compare`; the clean status return; the failing return carrying the key; a timeout naming its step | NOT STARTED | |

### The thirteen calls, individually (Part 8, line 2094)

| Call | Line | Requires | Status | Notes |
|---|---|---|---|---|
| `start` | 2104 | Stands up an instance; returns id, baseUrl, home, evidence dir, log paths, seeded ids; optional `quest` decides the partition and the citation; browserless specs are first-class; queues and reports `queuedMs` | **PLANNED chunk 1 (part)** | Chunk 1 delivers what `start` writes: the reservation, the port claim, the boot lock, the heartbeat and the evidence directory. The boot itself is chunk 2 |
| `run` | 2151 | Submit a batch; blocks; returns a STATUS, never a payload | NOT STARTED | |
| `results` | 2153 | Query narrowly by run/step/kind; starts nothing; answers for a dead instance; run id required against a finished one; every answer carries `instanceState` | **PLANNED chunk 1 (part)** | Chunk 1 delivers the `InstanceState` contract carrying all five members including `pruned` and `unknown` |
| `kill` | 2356 | Tear down; `{ stopped, ports: 'released' }`; removes the throwaway state and never the evidence | NOT STARTED | |
| `capacity` | 2328 | `suggested`, `ceiling`, a `why` sentence, `measured` and `profile`; counts foreign load; advisory with one hard floor | NOT STARTED | |
| `profile` | 2343 | Processes, hash, measuredAt, fromRuns, bootMs, samples grouped by pool size and never averaged across them | NOT STARTED | Chunk 1 delivers the `SpecHash` contract and the `profiles/<hash>/` resolver |
| `status` | 2307 | The post-mortem — `monitored`, `machine`, one entry per instance; a dead one carrying last beat, last step, RSS, orphan pgids, evidence paths and `likelyCause`; never lists runs or evidence for an instance you did not name | NOT STARTED | Chunk 1 delivers the heartbeat file and the pgids `status` reports as orphans |
| `cleanup` | 2270 | Reap stale instances, release ports and the lock, age assets; report `reaped`, `portsReleased`, `lockReleased`, `assetsAged` and `leftAlone`; never touch a live instance | NOT STARTED | Chunk 1 delivers the staleness detection it is built on |
| `prune` | 2246 | Reclaim by `olderThan` / `instance` / `kind`; refuse anything a `VERIFIED` prelude, an open issue or an open quest's `WALKED` line cites, naming the citing file | NOT STARTED | Blocked in part on Part 7 item 11g (typed `instanceId`/`runId` on a `walked` note) |
| `compare` | 2284 | The index delta between two runs of one instance; a READING, never a verdict; no cross-instance form | NOT STARTED | |
| `snapshots` | 2295 | List what `reset level: 'state'` can return to; manual names plus the automatic `run_N:start`/`run_N:end` pair; gone with the instance | NOT STARTED | |
| `recipes` | 2140 | Every recipe name with its `produces:` and `fidelity`; listable without being run; no instance needed | NOT STARTED | Chunk 1 makes the empty-folder answer possible by scaffolding the package |
| `docs` | 2187 | The tool's own instructions, served by a call; seven scopes — `operating`, `planning`, `walking`, `attacking`, `fixing`, `driving`, `operational`; `operating` carries no step verbs | **PLANNED chunk 1 (part)** | Chunk 1 pins the seven scope names in a package-local statics. The prose each scope serves is written with the calls it describes |

## Part 9 — What exists as scratch (line 2885)

| Section | Line | Requires | Status | Notes |
|---|---|---|---|---|
| What exists as scratch | 2885 | Nothing in Parts 1–3 is built; the `tmp/siege*` prototypes are throwaway | `N/A — spec-side, not tooling` | An inventory, not a requirement. `packages/web/test/siege-driver/` is superseded rather than renamed (line 1856) and is retired by Part 7 item 17 |
