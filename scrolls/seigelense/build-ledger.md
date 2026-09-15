# Siegelense build ledger

Running coverage of `siegelense-tooling.md` (2,923 lines) against what has been planned and delivered.
**One row per spec section**, keyed by heading text and line number. Every round updates this file.

Status vocabulary:

| Status | Means |
|---|---|
| `NOT STARTED` | nothing plans it yet |
| `PLANNED chunk N` | a chunk plan under `plans/` covers it, wholly |
| `PLANNED chunk N (part)` | a chunk plan covers some of it; the notes column says which part, and the rest stays open |
| `DELIVERED chunk N` | chunk N built it, wholly, and the code was read against this section's own words |
| `DELIVERED chunk N (part)` | chunk N built some of it; the notes column says exactly which part landed and which stays open |
| `N/A — spec-side, not tooling` | the document itself says this is not tooling work |

Chunk plans live in `scrolls/seigelense/plans/`. Chunk 1 is `plans/chunk-01-registry-spine.md`; a chunk 2 plan sits
beside it.

**The spec carries the same verdicts inline.** Every section this ledger marks as delivered or partial has a
`> **Status: DELIVERED (chunk 1)**` or `> **Status: PARTIAL (chunk 1)**` line under its heading in
`siegelense-tooling.md`. Those marker lines shifted every line below them, so the line numbers in this file are the
POST-marker ones — re-derive them from heading text, never from an older copy of this table.

---

## Part 1 — The architecture (line 9)

| Section | Line | Requires | Status | Notes |
|---|---|---|---|---|
| Decision: an INSTANCE service, reached over MCP | 11 | Thirteen MCP tools over a per-instance driver; steps are DATA inside `run`, never tools | NOT STARTED | Chunk 1 pinned the thirteen NAMES and the `siegelense-` prefix in `siegelenseToolsStatics`, `look` deliberately absent. Nothing is registered in `mcpToolsStatics` and nothing handles a name, so the tool surface does not exist yet |
| The shape | 42 | `start` → id; `run` → status-index; `results` → narrow query; `kill` → teardown | NOT STARTED | |
| An instance is a TIMELINE of runs, and every run is addressable | 63 | Run ids minted per run, step numbering restarting at 1, run-namespaced shots, continuous buffers with per-run windows, refs surviving a run boundary | NOT STARTED | Chunk 1 delivered the `RunId` / `StepIndex` contracts that pin the numbering rule; nothing mints a run id, and the buffers, windows and refs are later |
| Many sessions, one machine: a disk REGISTRY, not a master | 116 | `registry.json`, `boot.lock`, `profiles/<hash>/`, `guilds/<guildId>/instances/<id>/`, `unowned/instances/<id>/`, the `<repoRoot>/.siegelense` symlink, guild partitioning by the QUEST's guild | **DELIVERED chunk 1** | The whole tree and every resolver: `locations-root-path-find`, `-registry-path-find`, `-boot-lock-path-find`, `-registry-lock-path-find`, `-profiles-path-find`, `-instance-evidence-path-find` (the guild/`unowned` branch pair) and `-repo-link-path-find`. The symlink is written by `install-link-create-responder` and resolves through the same `dungeonmasterHomeFindBroker` at install time and at runtime |
| What the registry has to make safe | 181 | Port claim before bind, `boot.lock` across processes, reservation before boot, append-only profile samples, assets under the minted id | **DELIVERED chunk 1 (part)** | Four of the five rows: `instance-reserve-broker` claims the pair in the registry before anything binds and re-rolls on collision; `boot.lock` is taken by an OS-atomic exclusive create; a reservation is a row with `bootedAtMs: null`; assets live under the minted id. `profile writes` (line 190) needs the sampler and moves to the capacity chunk. **Open defect:** `registry-lock-acquire-broker.ts:59` reads every failed lock read as absence — see "Open defects in delivered code" below |
| Retention: assets outlive their instance, and something must prune them | 201 | Age-out windows, `prune` refusals, video first, citation resolution through `.quest-plans/`, never prune on `start` | NOT STARTED | Part 7 item 2c. Chunk 1 delivered the tombstone fields the answers hang off (`prunedAtMs`, `prunedByRule`) and the recorded `questId`; no ageing, no refusal and no citation resolver exists |
| Reading evidence starts nothing, and that is a SEPARATE PATH through the tool | 242 | Every evidence read resolves off disk; only `start`/`run`/`kill` need a driver; tombstones; no browsing | NOT STARTED | Part 7 item 2a. Chunk 1's `InstanceState` contract carries the `pruned`/`unknown` answers this section demands, and the path resolvers are built; no read call exists to use them |
| What a batch buys beyond call count | 297 | Batched steps at millisecond gaps so a race is reachable; stop-on-first-failure; mid-walk branching is the cost | NOT STARTED | |

## Part 2 — The capabilities, and the problem each one solves (line 310)

| Section | Line | Requires | Status | Notes |
|---|---|---|---|---|
| Addressing: a listing, not a selector | 310 | The key: four columns, element-bound refs, the whole flag set, `within` scoping, document order, own text nodes, the naming ladder | NOT STARTED | Part 7 item 7 |
| The `attrs` column — what the element DECLARES, in the app's own words | 412 | `href` as `→ /path`, `data-*`, input constraints, `type`, `title`; a budget; runtime-id values dropped; `className` excluded | NOT STARTED | Part 7 item 7 |
| "Does this element have a click handler?" — four routes, and none of them answers it here | 453 | `not-tabbable` stays a labelled PROXY; listeners only on `dom` over CDP; nothing infers a dead control | NOT STARTED | |
| Two key-level readings, which are not row flags at all | 483 | The duplicate-testId line under the key; `role` beside the tag in the element column | NOT STARTED | |
| What is deliberately NOT computed, and why | 500 | No sibling rect intersection, no per-row listeners, no z-index analysis, nothing about motion; a flag earns its place by being ABSENT on most rows | NOT STARTED | |
| `dom` is the ESCAPE HATCH, and the ladder above it has four rungs | 567 | `look` → `look { within }` → `box` → `dom`; own text by default, `fields:` projection, a cap that reports the true count | NOT STARTED | Part 7 item 10 |
| Perception: three artifacts, and they are not interchangeable | 627 | The shot (evidence), the map (optional, later), the key; different filters; always capture, open on signal | NOT STARTED | Part 7 item 6 |
| `pixelChange` — an attention router, not a measurement | 672 | One number per acting step; `null` on the first capture; `blank` checked FIRST with its colour; paired with the element delta | NOT STARTED | Part 7 item 6 |
| Settling: a step ends when the page is DONE, not when a clock says so | 742 | Network + paint + DOM quiet together, repeating patterns discounted, a CEILING not a timeout, the settle state reported | NOT STARTED | |
| Instrumentation: run a script before the page's | 777 | A `before` step over `addInitScript` | NOT STARTED | Part 7 item 5 |
| Computed findings: on the key's rows, not in a command of their own | 785 | The geometry checks ride the key row, never a separate command | NOT STARTED | Part 7 item 7 |
| Time: what is decidable, and what is not | 800 | `hold` detects non-settlement; `video` is for a human; nothing grades motion quality | NOT STARTED | Part 7 item 11 |
| What no track can settle goes to a PERSON, with its evidence attached | 836 | `verifyByHuman: true`, dropped from every automated denominator, collected into a list with its evidence | `N/A — spec-side, not tooling` | Part 7 item 11b: "otherwise the only options are an unsignable unit nobody can close, or a real expectation nobody ever checks. Spec-side work, not tooling" (line 1947) |
| The test lives in ONE shared place, and ChaosWhisperer reads it too | 889 | One statics, three readers — the author, the denominators, the walker | `N/A — spec-side, not tooling` | Same item 11b. The walk-side evidence collection it describes is the `video` step, tracked under Part 7 item 11 |
| Survival: what a stress tester needs and the verifier does not | 935 | `health` — one reading, one verdict line, including the server logs | NOT STARTED | Part 7 item 8 |
| Resetting: three layers, and a reset must say which one it touched | 978 | `page` / `state` / `instance`; named snapshots with an explicit `to`; the diff reported; the snapshot covers STATE only | NOT STARTED | Part 7 item 14 |
| Baselines: promoting a walk's shots | 1037 | Per-shot promotion off sign-offs, the `node:` label, baselines fetched by `results` against the happy walk's instance | NOT STARTED | |
| Teardown: the failure that is silent, costs three processes, and is never noticed by the session that caused it | 1081 | Process-group kill, SIGTERM → grace → SIGKILL, skip the signal for an exited child, home removed, evidence kept | NOT STARTED | Part 7 item 2b. Chunk 1 delivered the `ProcessGroupId` contract and the heartbeat file that records the pgids this teardown will need; nothing spawns or signals a process |
| When it dies without warning: OOM, SIGKILL, a full disk | 1115 | The heartbeat file (pid, instance id, every child's pgid, a timestamp), reaping on next contact, per-step transcript flush, `status` as post-mortem, disk checks | **DELIVERED chunk 1 (part)** | `heartbeat-write-broker` writes `heartbeat.json` — pid, instance id, pgids, `beatAtMs` — BEFORE stamping `lastBeatMs` on the row, so a crash between the two still leaves the pgids findable; `is-stale-registry-entry-guard` is the staleness reading, taking `nowMs` as a parameter. NOT: the reap itself (nothing kills a group or removes a home), `status`, `likelyCause`, the OOM evidence, the per-step transcript flush and the disk checks |
| When a session's instance dies under it: bubble up, never self-heal | 1206 | A dead instance is `rework`, never `wall`; no self-healing; only the operator sees the pool | `N/A — spec-side, not tooling` | Prompt text for the walker, the antagonist and the planner — not a change in this package. Ships with the `docs { for: … }` scopes |
| The crash a walker must NOT mistake for a defect | 1230 | `status` separates a driver death from a child death; a walk checks `status` before writing anything down | NOT STARTED | The tooling half is `status`; the ordering rule is prompt text |
| Handing a defect to a fixer: what a walker must write down | 1249 | Instance id, run id, failing step, the prelude, the evidence paths; `results` answering for a killed instance; a required run id against a finished one | NOT STARTED | Part 7 items 2a and 4b |
| The fixer writes the e2e, and the PRELUDE is what makes that possible | 1288 | A recipe is a plain function an e2e calls directly, so the walk and its regression test share one seeding vocabulary | NOT STARTED | Part 7 items 3 / 3a |
| What the operator owns after a crash | 1309 | `status` → `cleanup` → re-read `capacity` → re-dispatch; no phase advances with an instance in an unknown state | NOT STARTED | The tooling half is `status` + `cleanup`; the ordering is prompt text |
| `cleanup` — the operator's bookend | 1324 | `cleanup {}` reaping by staleness, releasing ports and the lock, ageing assets, and reporting `leftAlone` | NOT STARTED | Chunk 1 delivered the staleness primitive `cleanup` is built on (`is-stale-registry-entry-guard`) and the release half (`instance-release-broker` marks a row `killed` without deleting it) |
| Testing teardown — ONCE, as the tool's own suite. Never per quest. | 1359 | Seven teardown assertions, each shown FAILING against broken teardown first, including the three-instance parallel case | NOT STARTED | Part 7 item 2b. Deliberately deferred: asserting "no process matching the instance remains" when nothing spawns one is the leak-guard that passes for every tree and proves nothing |

## Part 3 — Restructuring the pass (line 1394)

| Section | Line | Requires | Status | Notes |
|---|---|---|---|---|
| Profiling: measure what an instance costs, then divide | 1394 | Sample RSS per process group, record STEADY and PEAK, key by the spec's content hash, divide by `peak` | NOT STARTED | Chunk 1 delivered the `SpecHash` contract and `locations-profiles-path-find-broker` (`<root>/profiles/<hash>/`); nothing samples and nothing writes a profile |
| Phase zero IS the profiling run, and that has two consequences | 1423 | The planner profiles solo; solo profiling is optimistic; an OOM death corrects the profile; memory travels between machines and timing does not | NOT STARTED | |
| The TOOL staggers, because nobody else can | 1462 | `start` queues, admits one boot at a time, refuses past the pool, blocks and reports `queuedMs` / `aheadOfMe`; `capacity` counts foreign load; one hard floor | NOT STARTED | Chunk 1 delivered `boot.lock` — the mechanism the queue is built on, with its TTL, wait ceiling and poll interval in `instanceLifecycleStatics.bootLock`. The QUEUE itself, `queuedMs` and `aheadOfMe` are later |

## Part 4 — Decisions already taken (line 1536) · 4A — What the tool implements (line 1550)

| Section | Line | Requires | Status | Notes |
|---|---|---|---|---|
| Readings, and what a step may never do | 1552 | A step returns a READING; ambiguity THROWS with candidates; the no-pick rule held by LINT; `querySelector` banned in eval source by the package `CLAUDE.md` | **DELIVERED chunk 1 (part)** | `packages/siegelense/CLAUDE.md` (line 1562) carries the reading-not-verdict rule, the no-pick rule and the `querySelector` ban. The LINT rule and the command implementations it would grade are Part 7 item 16 |
| Addressing: the key, refs, the map | 1564 | Every key/ref/map decision — four columns, the flag set, the `dom` ladder and its guards, ephemeral refs, the map shipped last | NOT STARTED | Part 7 item 7 |
| Perception: shots, pixelChange, animation | 1595 | Only the shot is evidence; always capture with `open:` flags; the `node:` label; frozen comparison captures; nothing grades animation | NOT STARTED | Part 7 item 6 |
| The service: instances, runs, batches | 1614 | Thirteen tools; `docs` as a call; thin clients over a socket; the disk registry; port claim; reservation; `boot.lock`; append-only samples; staleness reaping; minted ids; run timelines; disk-resolved reads; `compare`; `stopOn`; settle | **DELIVERED chunk 1 (part)** | Delivered: 1627 (disk registry, no daemon), 1628 (ports claimed before bound), 1629 (reserved before boot), 1630 (`boot.lock` across processes), 1633 (assets under the minted id), 1638 (ids minted not chosen), 1640 (step numbering restarts at 1 per run, pinned in `stepIndexContract`). Every other row in this table needs a driver, a tool registration or an evidence writer and stays open |
| Snapshots, reset, and the state/evidence line | 1654 | Named snapshots, the automatic `run_N:start`/`run_N:end` pair, the state-subtree boundary, three reset levels, the diff reported | NOT STARTED | Part 7 item 14 |
| Teardown and crash recovery | 1664 | `kill` mandatory; teardown its own concern; the heartbeat file and its pgids; staleness reaping; tombstones; guild partitioning; the `.siegelense` symlink; per-step flush; disk checks; no auto-restart | **DELIVERED chunk 1 (part)** | Delivered: 1678 (a reaped row is a TOMBSTONE — `instance-release-broker` maps, never filters), 1679 (guild partitioning with `unowned/` as a real partition), 1682 (`init` creates `<repoRoot>/.siegelense` and ignores it in git AND in the check globs), 1684 (the heartbeat file and its pgids). NOT: `kill`, the teardown suite, `status`, the reaping sweep (1685), retention, the per-step flush, the disk checks and the no-auto-restart rule. **1682 is not whole:** the check-glob insert misses a single-line array — see "Open defects in delivered code" |
| Capacity and profiling | 1697 | A measured pool size; RSS sampling; the content hash key; `suggested: 2` with no profile; staggered starts; `queuedMs`; the policy ceiling; foreign load; the `why` sentence; the hard floor | NOT STARTED | |
| Recipes: what one is and what holds it | 1717 | The package names as conventions; `init` scaffolds the recipes package; an empty one is a real answer; recipes are a graded PACKAGE; listable without running; explicit dependencies; `fidelity` / `mirrors:`; determinism; `seed` as a step; the oddities file | **DELIVERED chunk 1 (part)** | Delivered: 1724 (both names are conventions at their exact paths), 1725 (`init` scaffolds `packages/siegelense-recipes/`), 1726 (an empty one answers as empty — `install-recipes-scaffold-responder` creates `src/` and leaves an existing folder untouched), 1727 and 1731 (a real graded workspace package made with `dungeonmaster create-package`). The recipe CONTENT, `produces:`, `fidelity`, `mirrors:`, the listing, the colocated recipe tests and the DOM-handle lint rule are Part 7 items 3 / 3a / 16 |

## Part 5 — The determinism this system depends on (line 1747)

| Section | Line | Requires | Status | Notes |
|---|---|---|---|---|
| What the TOOLING must guarantee | 1757 | Nine invariants: ref stability, key row order, element identity, port claiming, retention, append-only evidence, per-run step numbering, settle-based steps, one boot at a time, pool size on every sample | **DELIVERED chunk 1 (part)** | Delivered: 1766 (port allocation claimed in the registry before binding, re-rolled on conflict), 1771 (one boot at a time held by `boot.lock`, taken by an atomic exclusive create). 1769 (per-run step numbering) is PINNED in `stepIndexContract` but has no run to number yet. Ref stability, key row order, element identity, the retention window, append-only evidence, settle-based steps and the per-sample pool size all stay open |
| What the CONTENT must guarantee | 1774 | A recipe's output bytes, its timestamps, ids that paint, ordering; no `Date.now()` / `Math.random()` / `randomUUID()` reaching a screen | NOT STARTED | Part 7 items 3 / 16 |
| Animation is the one that conflicts with the product | 1787 | `animations: 'disabled'` and `caret: 'hide'` on every comparison capture; `before` freezes JS-driven motion; `video` and `hold` stay live | NOT STARTED | Part 7 item 6 |
| The honest limit | 1817 | `pixelChange: 0%` is a strong signal, never a verdict; `blank` is the one exact exception | NOT STARTED | |

## Part 6 — The recipe book (line 1831)

| Section | Line | Requires | Status | Notes |
|---|---|---|---|---|
| The tool is `siegelense`, and its recipes live beside it | 1833 | `packages/siegelense/`, `dungeonmaster siegelense`, `siegelense-*` tools, `packages/siegelense-recipes/`; `init` scaffolds the recipes package; an empty one is a real answer; both real workspace packages; subpath-importable barrels that do not pull msw; the monorepo limit stated | **DELIVERED chunk 1 (part)** | Both packages exist at their exact paths, made with `dungeonmaster create-package`, registered in the ROOT `package.json` `dependencies`. Seven subpath barrels on `siegelense` plus one on `siegelense-recipes`, each a plain `export *` with a `source`/`import`/`require`/`types` exports entry, and the whole `src` tree measured msw-free. `init` scaffolds the recipes package and an empty one is a real answer. NOT: the `dungeonmaster siegelense` command and the recipe listing |

## Part 7 — Where to go, in order (line 1924)

| # | Line | Requires | Status | Notes |
|---|---|---|---|---|
| 1 | 1930 | Gate `POST /api/tooling/smoketest/run` at registration, with an absence test | **DELIVERED chunk 1** | Built after the chunk 1 plan wrote it out of scope. `packages/server/src/flows/tooling/tooling-flow.ts:28` — `if (process.env.TOOLING_SMOKETEST_HTTP === '1') {` wraps the `app.post`, so an unset flag leaves no route and an unauthorized caller gets the framework's own 404. The absence test is `tooling-flow.integration.test.ts:18`, `'VALID: {TOOLING_SMOKETEST_HTTP unset} => 404, route not registered…'`, shown failing against the ungated route first. Same shape as `E2E_SIGNAL_BACK_HTTP` in `quest-flow.ts` |
| 2 | 1931 | The instance service — start / run / results / kill / capacity / profile / status / cleanup / docs, status-as-index with shot list and `open:` flags, refs invalidated on navigation/reset/restart, RSS per process group | **DELIVERED chunk 1 (part)** | The registry, its locks, the location resolvers, the heartbeat and the reservation/port-claim primitives every one of those calls sits on. NOT: the driver process, any tool registration, any call, the status-as-index, refs and RSS sampling. **Cut chunk 2 from:** the driver that binds the ports `instance-reserve-broker` already claimed, `start`/`run`/`kill`, and the thirteen registrations |
| 2a | 1932 | The evidence read path — `results`/`status` off the asset tree, guild partitioning, the `.siegelense` symlink `init` creates and ignores, every returned path absolute and repo-local | **DELIVERED chunk 1 (part)** | The symlink, its gitignore line, the guild/`unowned` partitioning and the repo-local resolver (`locations-repo-link-path-find-broker` answers `linkPresent: false` both for an absent link AND for one pointing at a different tree, so a path never silently resolves elsewhere). NOT: `results`, `status`, and the check-glob half is incomplete — see the open defects below. **Also not asserted:** `start-install.integration.test.ts` covers four of the five properties the chunk 1 plan named; "every path the result hands back is absolute" is never checked with an absoluteness assertion |
| 2b | 1933 | Teardown and crash recovery, tests written red-first — process groups, port release, home removal, evidence retention, idle-timeout reaping, the three-instance parallel case, the heartbeat file and stale-instance reaping | **DELIVERED chunk 1 (part)** | The heartbeat file and the staleness guard — "the ONLY defence against a SIGKILLed driver". Every concurrency fix in this chunk was shown failing first. NOT: the process-group kill, port release, home removal, the idle-timeout reap, the three-instance parallel case and the seven-assertion teardown suite, all of which need the driver |
| 2c | 1934 | Retention and tombstones — the quest id recorded at `start`, `prune`/`cleanup` resolving citations through `.quest-plans/` and naming the citing file, a reaped entry surviving as a tombstone, a pruned query answering `pruned` | **DELIVERED chunk 1 (part)** | The `questId` field on the row, the `prunedAtMs` / `prunedByRule` tombstone fields, `instance-release-broker` never deleting a row, and the `pruned` / `unknown` members of `InstanceState`. NOT: the ageing itself, the refusal rules and the citation resolver — and the citation half is BLOCKED on item 11g, since a resolver cannot match an id buried in prose |
| 3 | 1935 | The recipe book — free the HTTP-only harnesses, expose the free ones by name, add `produces:` and `fidelity`, make them listable | NOT STARTED | The foundation half (the package exists, scaffolded in every repo) is chunk 1; the content is not |
| 3a | 1936 | Recipe integration tests — each asserts its own `produces:`; `direct` ones assert against `mirrors:`; production ones share one instance | NOT STARTED | |
| 3b | 1937 | The PLANNER role — maps paths to recipes, proves every prelude by running it, dispatches for research and diagnosis | NOT STARTED | Prompt work in `packages/orchestrator`, not this package |
| 4 | 1938 | A transcript of every step and reading, written by the instance | NOT STARTED | |
| 4b | 1939 | The record's `WALKED` field — instance id and run id against every path walked and every attack run, clean ones included | `N/A — spec-side, not tooling` | The document's own words: "Spec-side work: a quest-contract change, not tooling. See `siege-verification-remainder.md` Part 4". **It still gates tooling:** the `WALKED` line is one of the citations `prune` and `cleanup` must refuse to delete over, so item 2c's refusal rule cannot be finished until this and item 11g land |
| 5 | 1940 | `before` — run a script ahead of the page's own | NOT STARTED | |
| 6 | 1941 | Capture on every acting step, frozen for the comparison path, with a change-amount number; open start and end | NOT STARTED | "The only item that changes what gets SIGNED" (line 1964) — ship this one first if any capability ships alone |
| 7 | 1942 | The key as a tree — element-bound refs, `within`, four columns, the duplicate-testId line; ship without the map | NOT STARTED | |
| 8 | 1943 | `health`, one reading with one verdict line, including the server logs | NOT STARTED | |
| 9 | 1944 | `until` — wait on a response, a file or a predicate | NOT STARTED | |
| 10 | 1945 | Selectable readings — `network` by method and path with field projection; the same plus a self-reporting cap on `dom` | NOT STARTED | |
| 11 | 1946 | `hold` (non-settlement, live) plus `video` (for a human, never graded) | NOT STARTED | |
| 11b | 1947 | The human-check route — a flag on the observable, dropped from automated denominators, collected into a list handed to the user | `N/A — spec-side, not tooling` | The document's own words: "Spec-side work, not tooling". Blocks no tooling requirement; the walk-side evidence it wants is the `video` step under item 11 |
| 11c | 1948 | The declared-value block and its third reader — extract the duplicated enumeration into one interpolated statics, add the siege consequence, give `siegemaster-prompt-statics.ts` a rule for an UNFLAGGED one | `N/A — spec-side, not tooling` | The document's own words: "Spec-side work, not tooling". Blocks no tooling requirement |
| 11d | 1949 | `siegemaster-reader` — a minion that opens the files a walk must not, returning values with `file:line` | NOT STARTED | Not this package: `agentPromptNameContract`, `agentPromptClassificationStatics.minionNames` and `agentNameToPromptTransformer` all live in `packages/orchestrator` |
| 11e | 1950 | `siegemaster-operational` — a per-operational-flow minion, plus `process-state`, `environment`, a wider log tail and a named elapsed figure | NOT STARTED | Split ownership: the surfaces are steps in this package, the minion is an orchestrator prompt |
| 11f | 1951 | The `(human-check)` PANEL on the quest, in the web UI | NOT STARTED | `packages/web`, not this package |
| 11g | 1952 | A `walked` kind on `questNotes`, with typed `instanceId` and `runId` | NOT STARTED | Verified absent: `questNoteKindContract` is still exactly `['open-question', 'tooling-error', 'out-of-scope', 'walk-reset']` and `questNoteContract` carries no `instanceId` or `runId`. `packages/shared` contract + `packages/orchestrator`. **It BLOCKS tooling:** it is what `prune` and `cleanup` resolve a `WALKED` citation against, so it gates item 2c's refusal rule |
| 11h | 1953 | Print the owning NODE id in `get-qa-checklist` | NOT STARTED | `packages/orchestrator` / `packages/mcp`, not this package |
| 12 | 1954 | Server-side failure injection | NOT STARTED | |
| 13b | 1955 | `compare { runA, runB }` — the index delta between two runs | NOT STARTED | |
| 14 | 1956 | The three reset levels with named snapshots and an explicit `to`, each reporting the diff it undid | NOT STARTED | |
| 15 | 1957 | `resize`, and a direct `request` step for the curl surface | NOT STARTED | |
| 16 | 1958 | The two local lint rules — no `.first()`/`.last()` in a command, no DOM handle in a recipe — plus the package `CLAUDE.md` | **DELIVERED chunk 1 (part)** | The package `CLAUDE.md` only, with all twelve entries. Both lint rules stay deferred to the chunks that create their targets (the command implementations, and the recipes); a rule that cannot be shown firing against a real violation is one nobody can audit, and the spec carries its own caution about exactly that |
| 17 | 1959 | The lane spec and N ports; move it where consumers get it | NOT STARTED | The largest item. `siege-lane.ts`'s `SERVER_WORKSPACE` / `WEB_WORKSPACE` literals, exactly-two-processes, the fake-CLI env block and `REPO_ROOT` resolved four directories up. "Items 4 to 16 are additive to files item 17 moves. Doing 17 first means doing them twice." (line 1967). Chunk 1 added nothing to those files |

## Part 8 — The surface, consolidated (line 1976)

| Section | Line | Requires | Status | Notes |
|---|---|---|---|---|
| The rule that governs every targeting step | 1981 | Three outcomes per targeting step; AMBIGUOUS carries the candidates with their refs; NO MATCH names near misses; a ref is never ambiguous and answers `stale` | NOT STARTED | |
| Holding the no-pick rule mechanically | 2018 | A local lint rule banning `.first()`/`.last()` on a locator in a command; `.nth()` only with caller input; the rule states its own scope; `querySelector` in eval source held by the package `CLAUDE.md` | **DELIVERED chunk 1 (part)** | The `CLAUDE.md` half only — both rules are written there as prose. The lint rule is Part 7 item 16 |
| Refs are for DRIVING. Selectors are for RECORDING. | 2042 | A ref is ephemeral, scoped to one instance and one page state; four boundaries it cannot cross; never stored; binds to an element not a row number | NOT STARTED | The package `CLAUDE.md` carries the rule as prose; nothing mints or resolves a ref |
| The package needs a `../../CLAUDE.md`, and these are the entries | 2092 | Twelve named invariants, each with the measurement behind it | **DELIVERED chunk 1** | All twelve written at `packages/siegelense/CLAUDE.md`, in this table's own order, each carrying its measurement. Read entry by entry against the table |
| The thirteen calls | 2118 | Every tool registered as `siegelense-<name>`; steps are not tools; only `start`/`run`/`kill` need a live instance | **DELIVERED chunk 1 (part)** | The thirteen names and the `siegelense-` prefix pinned in `siegelenseToolsStatics`, with `look` correctly absent, plus the seven `docs` scopes. Registration in `mcpToolsStatics` and the flow is deferred — it triggers the ~29-file cascade `packages/mcp/CLAUDE.md` documents, and thirteen names answering errors teaches the wrong surface |
| Steps that exist today and are kept | 2391 | `goto`, `waitFor`, `look`, `click`, `type`, `key`, `paste`, `box`, `screenshot`, `dom`, `storage`, `eval`, `file`; ambiguity now throws; `end` becomes `kill` | NOT STARTED | Today's source is `packages/web/test/siege-driver/siege-command.ts` |
| Steps that are new | 2423 | `look`, `before`, `health`, `reset`, `snapshot`, `seed`, `until`, `hold`, `video`, `request`, `resize` | NOT STARTED | |
| Results queries | 2549 | `console` · `network` · `ws` · `server` · `screenshots` · `steps`; per-step attribution on every entry; projection and filtering | NOT STARTED | |
| What every acting step returns, on top of its own reading | 2590 | `shot`, `pixelChange`, `elements` on every acting step | NOT STARTED | |
| A worked batch | 2603 | `as` naming a step's output and `{name.field}` reading it back; `stopOn`; `expect: 'error'`; a step expecting failure that succeeds is itself a finding | NOT STARTED | |
| A FIXER reading a finished instance | 2641 | Steps 1–4 start nothing; repo-local absolute shot paths; server-log window; per-step network; reproduction on a FRESH instance; the same recipes in the e2e | NOT STARTED | |
| Interleaving recipes and steps | 2724 | `seed` placeable anywhere; recipes composed by explicit parameters; seeding with a page open; a reload where no socket drives the surface | NOT STARTED | |
| Cycles — run, snapshot, collect, repeat | 2773 | The two cycle shapes; `compare`; the clean status return; the failing return carrying the key; a timeout naming its step | NOT STARTED | |

### The thirteen calls, individually (Part 8, line 2118)

| Call | Line | Requires | Status | Notes |
|---|---|---|---|---|
| `start` | 2130 | Stands up an instance; returns id, baseUrl, home, evidence dir, log paths, seeded ids; optional `quest` decides the partition and the citation; browserless specs are first-class; queues and reports `queuedMs` | **DELIVERED chunk 1 (part)** | Everything `start` WRITES exists: the reservation row, the claimed port pair, the boot lock, the heartbeat and the evidence directory resolver. The boot itself, the return shape, the queue and `queuedMs` are chunk 2 |
| `run` | 2177 | Submit a batch; blocks; returns a STATUS, never a payload | NOT STARTED | |
| `results` | 2179 | Query narrowly by run/step/kind; starts nothing; answers for a dead instance; run id required against a finished one; every answer carries `instanceState` | **DELIVERED chunk 1 (part)** | The `InstanceState` contract carries all five members including `pruned` and `unknown`, and its test derives its cases from the enum's own `.options` so a sixth member cannot be silently skipped. No query surface exists |
| `kill` | 2382 | Tear down; `{ stopped, ports: 'released' }`; removes the throwaway state and never the evidence | NOT STARTED | `instance-release-broker` is the registry half — it marks the row `killed`, clears `pid`/`pgids` and never deletes the row. Nothing tears down a process |
| `capacity` | 2354 | `suggested`, `ceiling`, a `why` sentence, `measured` and `profile`; counts foreign load; advisory with one hard floor | NOT STARTED | `is-reserved-registry-entry-guard` is the primitive that lets `capacity` count reservations rather than only running instances |
| `profile` | 2369 | Processes, hash, measuredAt, fromRuns, bootMs, samples grouped by pool size and never averaged across them | NOT STARTED | Chunk 1 delivered the `SpecHash` contract and the `profiles/<hash>/` resolver |
| `status` | 2333 | The post-mortem — `monitored`, `machine`, one entry per instance; a dead one carrying last beat, last step, RSS, orphan pgids, evidence paths and `likelyCause`; never lists runs or evidence for an instance you did not name | NOT STARTED | Chunk 1 delivered the heartbeat file and the `ProcessGroupId` contract whose pgids `status` reports as orphans |
| `cleanup` | 2296 | Reap stale instances, release ports and the lock, age assets; report `reaped`, `portsReleased`, `lockReleased`, `assetsAged` and `leftAlone`; never touch a live instance | NOT STARTED | Chunk 1 delivered the staleness detection it is built on, and the lock-release halves for both `boot.lock` and `registry.lock` |
| `prune` | 2272 | Reclaim by `olderThan` / `instance` / `kind`; refuse anything a `VERIFIED` prelude, an open issue or an open quest's `WALKED` line cites, naming the citing file | NOT STARTED | Blocked in part on Part 7 items 11g and 4b (typed `instanceId`/`runId` on a `walked` note). The tombstone fields it writes exist |
| `compare` | 2310 | The index delta between two runs of one instance; a READING, never a verdict; no cross-instance form | NOT STARTED | |
| `snapshots` | 2321 | List what `reset level: 'state'` can return to; manual names plus the automatic `run_N:start`/`run_N:end` pair; gone with the instance | NOT STARTED | |
| `recipes` | 2166 | Every recipe name with its `produces:` and `fidelity`; listable without being run; no instance needed | NOT STARTED | Chunk 1 made the empty-folder answer possible by scaffolding the package with an empty `src/` |
| `docs` | 2213 | The tool's own instructions, served by a call; seven scopes — `operating`, `planning`, `walking`, `attacking`, `fixing`, `driving`, `operational`; `operating` carries no step verbs | **DELIVERED chunk 1 (part)** | The seven scope names pinned in `siegelenseToolsStatics.docs.scopes`, asserted complete with `toStrictEqual`. The prose each scope serves is written with the calls it describes |

## Part 9 — What exists as scratch (line 2911)

| Section | Line | Requires | Status | Notes |
|---|---|---|---|---|
| What exists as scratch | 2911 | Nothing in Parts 1–3 is built; the `tmp/siege*` prototypes are throwaway | `N/A — spec-side, not tooling` | An inventory, not a requirement. `packages/web/test/siege-driver/` is superseded rather than renamed (line 1874) and is retired by Part 7 item 17. **This section is now partly out of date:** Part 1's registry half IS built |

---

## Open defects in delivered code

Found while grading chunk 1 against the spec. Both sit inside code this ledger marks delivered, which is why they are
recorded here rather than as unbuilt requirements.

| Defect | Where | State | What a planner needs |
|---|---|---|---|
| `registry.lock`'s acquire reads every failed lock read as ABSENCE | `packages/siegelense/src/brokers/registry/lock-acquire/registry-lock-acquire-broker.ts:59-68` | OPEN | The create side correctly distinguishes `EEXIST` from a real failure (lines 49-55), and `boot-lock-acquire-broker` distinguishes a genuine `ENOENT` from every other read failure (lines 133-140) with a test behind it. The registry lock's READ does neither: a bare `catch {}` leaves `existingContents` null and line 67 recurses. The wait-ceiling check at line 83 is reachable only from the successful-read branch, so a persistent non-`ENOENT` read failure recurses without bound. Fix mirrors `boot-lock-acquire-broker`, and the proxy needs a `setupLockReadFailsForNonAbsenceReason` equivalent — there is no test for this case today |
| The check-glob insert misses a SINGLE-LINE array | `packages/siegelense/src/responders/install/ignore-write/array-entry-anchor-insert-layer-responder.ts:43-60` | OPEN, being worked | The anchor scan splits on `'\n'` and extracts at most one quoted value per line, so `"exclude": ["node_modules", "worktrees"]` on one line parses to the KEY token `exclude`, never to `worktrees`; `anchorIndex` stays `-1` and nothing is inserted. A multi-line array works. No test in the suite uses a single-line array. Consequence: a consumer repo whose `tsconfig.json` or jest config writes its exclusions on one line gets no `.siegelense` entry, and lint/typecheck/test globs then walk a tree of thousands of PNGs |

Two smaller deviations from the chunk 1 plan, neither a defect in behaviour:

- `instance-reserve-broker` resolves the owner from `process.pid` internally, as the plan asked, but the proxy never
  mocks `process.pid` — the test reads the live pid of the test runner. The plan's own wording was "mocking
  `process.pid` through the proxy" (`plans/chunk-01-registry-spine.md:641`).
- The port re-roll test asserts the returned pair, not the WRITTEN row; only the sibling happy-path test asserts the
  row through the registry proxy. The plan asked for the written row on the collision case specifically.
- `port-claim-exhausted-error.ts:16-17`'s `WHEN-NOT-TO-USE` describes a sequential ask-check-reask retry. The broker
  fetches all `claimAttempts` candidates from the OS upfront in parallel and picks the first free one inside one
  atomic mutate — a deliberate, documented TOCTOU-avoiding design. The error's doc comment and the broker's header
  disagree about which one the code does.

## Off-spec work delivered alongside chunk 1

Not required by `siegelense-tooling.md`. All three were found while building chunk 1 and all three are fixed; they are
recorded so the work is not invisible.

| Item | Where | State | What it was |
|---|---|---|---|
| `dungeonmaster create-package` seeded a jest config that could not run an integration test | `packages/cli/src/statics/package-scaffold-config/package-scaffold-config-statics.ts` | DELIVERED, committed | A scaffolded package importing `@dungeonmaster/testing`'s root barrel hit `SyntaxError: Unexpected token 'export'` from msw's ESM. `jestConfigNodeIntegration` now carries `transformIgnorePatterns` AND a widened `transform`; three scratch jest runs proved each field is independently required. The transformer picks it over `jestConfigNode` for a seed whose `needsMswTransform` is true |
| `@dungeonmaster/hooks` install failed on a repo with no `.claude/` directory | `packages/hooks/src/adapters/fs/ensure-write/`, `.../responders/install/create-settings/install-create-settings-responder.ts`, `packages/hooks/test/harnesses/fresh-project/` | DELIVERED, uncommitted at this ledger pass | Writing `.claude/settings.json` into a brand-new project threw `ENOENT` because nothing created the parent directory. `fsEnsureWriteAdapter` now `mkdir -p`s it first. `installTestbedCreateBroker` could never reproduce this — it pre-creates `.claude/` to satisfy other packages — so `freshProjectHarness` makes a project holding only a `package.json`, and `install-flow.integration.test.ts` drives the fresh case against it |
| `dungeonmaster init` printed the literal string `undefined` for a failed package install | `packages/cli/src/responders/cli/init/cli-init-responder.ts` | DELIVERED, uncommitted at this ledger pass | `InstallResult` populates `message` on success and `error` on failure, never both, and the line printed `result.message` unconditionally. Every real failure therefore reported `[FAIL] @dungeonmaster/x: undefined` |
