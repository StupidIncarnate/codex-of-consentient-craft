# Recipes build — handoff

## The prompt that starts the next session

**Paste everything in this block.**

---

> Move to the worktree `recipes-doc` and do all this work there. It is already carved; create no new
> one.
>
> **Read `scrolls/seigelense/recipes-HANDOFF.md` first, all of it, before anything else.** It carries
> what is built, what each chunk has reached, the rulings already made, the traps that each cost an
> agent a cycle, and the three things to do first. Do not re-derive any of it, and do not re-litigate
> a ruling recorded there.
>
> **Master is merged and the tree is green.** Sweep before your first commit, and never merge on a red
> tree.
>
> Then continue the goal, unchanged:
>
> Implement the recipe book in `scrolls/seigelense/siegelense-recipes.md` in every detail, so one
> manual test pass finds no holes the doc documents as requirements.
>
> Use sub agents for everything: planning, work, ward runs, verification. Only 3 in parallel. Opus
> plans, sonnet the rest. Commit as you like.
>
> The loop:
>
> - A sub agent plans features against the doc for a chunk — what to build, in what order.
> - Sub agents build them, with unit and integration tests. No e2e needed.
> - Sub agents review the code against the plan for holes and blindspots.
> - A sub agent manually uses the tool against the doc's requirements.
> - A sub agent compares promised to delivered and marks each doc section delivered to the detail
>   specified — a running mark of covered vs not.
> - Start over.
>
> Repeat until the planner says nothing is left, then send sub agents to validate every doc
> requirement by manually running the tool.
>
> Before every commit, run `ward --uncommitted --committed` until green; save the full ward for when
> the feature is done. Agents run `ward -- -- {files}` on files they change.
>
> **Three packages** under `packages/`, bound by our arch and testing standards, which every sub agent
> pulls: `@dungeonmaster/hydration` (the framework, ships), `packages/siegelense-recipes` (this repo's
> own ingredients and recipes, must NOT ship — it is renamed to `hydration-recipes` late), and the
> `@dungeonmaster/siegelense` changes that list and seed them.
>
> **All 65 combinatorial cases are driven and recorded.** Rounds A–D are in `recipes-ledger.md` and
> `scrolls/seigelense/rounds/`. What is left is acting on what they found — the open list is in this
> handoff. A finding still goes into the document rather than around it.
>
> Converting the existing suites proves the design and is in scope.
> **`plans/recipes-chunk-09-10-migration.md` has the order and the batches**; batch 10.0 has landed and
> 10.1 is next. `python3 scrolls/tools/seed-census.py --methods` is the running mark. A converted test
> keeps its assertions exactly — if it needs a different assertion to pass, the ingredient is wrong,
> not the test. A test that will not convert is a finding, written into the doc.
>
> Blockers: send sonnet agents to unblock.

---

**Branch `recipes-doc`, worktree `worktrees/recipes-doc`. Work only there.**

---

## Do these first, in this order

### 1. Sweep

```bash
npm run ward -- --committed --uncommitted
```

`timeout: 600000`. **The last full sweep was green** — 1550 files linted, 9130 typechecked, 3217 unit,
140 integration. The final commit of that session skipped ward at the user's instruction, so **this run
is the first thing to confirm.** It grades the reference grammar, the C19 fix and the round evidence.

### 2. Finish chunk 8 — one item is left

**E3: the run holds each step's output and substitutes references into the next.** The grammar and the
resolver are built and tested; nothing wires them into `run-execute-broker.ts` yet.

Until E3 lands, a recipe cannot take an earlier seed's output inside one batch. The cost is named in
the chunk-8 plan as F11: a walk must paste ids between two `run` calls, which loses the live-update
case the specification is explicit about.

**One loose end E2 left deliberately:** `run-verb-layer-broker.ts` around line 70 carries a five-line
narrowing guard that throws if a `goto` step's `path` is still an unresolved reference at dispatch
time. It exists because widening `goto.path` to accept a reference broke that call site's types. **E3
should make it unreachable, not delete it** — it is the assertion that substitution really happened.

### 3. Act on what the rounds found

The open list is below. Nothing there is blocked.

---

## Where things are

| Package | State |
|---|---|
| `@dungeonmaster/hydration` | **Built.** Contracts, chain, runner, transitions, filter, sad paths, both halves of the negative type suite, the public barrels. Two refusals added this session |
| `packages/siegelense-recipes` | **Built.** Five ingredients, a registry, three recipes, route brokers, a listing builder, a seed runner, a conformance test. Does NOT ship — absent from root `dependencies`, marked private, both pinned by a test |
| `@dungeonmaster/siegelense` | **The `recipes` call and the `seed` step are built and run.** Four contract domains, seven refusal classes, the locate/read/seed brokers, the responder, the route, the help page, the reference grammar |
| `@dungeonmaster/orchestrator` | Gained a `./brokers` subpath, so a consumer can reach its brokers without booting an application |
| `@dungeonmaster/web` | The migration's target harness. Nothing imports it yet |

**Commits this session:** `21f9025f8` (the `recipes` call) · `c5c88b7f8` (the chunk-8 plan, seven
findings, the regraded ledger) · `ea66a81f7` (the `seed` step) · `6cf2372d5` (rounds A and B) · plus the
final commit carrying rounds C and D, the C19 fix and the reference grammar.

---

## Chunk status

| # | Chunk | State |
|---|---|---|
| 1-3 | contracts, declaration, chain | **Done** |
| 3b | typed plan output | **Not started.** Scheduled, with an abort condition, in the chunk 1-3 plan §12 |
| 4 | runner and pre-flight | **Done** |
| 5 | transitions and `reach` | **Done** |
| 6 | filter and `fromSaved` | **Done** |
| 6b | sad paths driven for real | **Mostly.** Round D drove what remained; two rows need a real database and a consumer wrapper |
| 7 | this repo's ingredients | **Done.** The `copies:` question is settled — see rulings |
| 8 | siegelense listing and `seed` | **Done except E3.** See "do these first" |
| 9 | integration conversion | **One file converted.** The rest descoped — see rulings |
| 10 | browser conversion | **Batch 10.0 landed.** 10.1 is next and is scouted — see below |
| 11 | manual siegelense round | **Partly.** `recipes` driven by hand; `seed` has not been driven through a live lane |
| 12 | combinatorial rounds | **All 65 cases driven and recorded.** Rounds A-D |

---

## What the rounds found, and what is still open

All four rounds are recorded in `recipes-ledger.md`, with every scratch script preserved under
`scrolls/seigelense/rounds/` and runnable:

```bash
npx tsx --conditions=source scrolls/seigelense/rounds/round-c/<file>.ts
```

**Fixed this session:** a `fromSaved` naming a field its record never declares now refuses at pre-flight
(A5). A `create` nested in a `filter` now resolves against its own ingredient rather than the enclosing
filter's, which was silently running the wrong ingredient's routes (C19). Verbs on a removed handle
now refuse at pre-flight with `HydrationRemovedHandleVerbError` and folding is fenced across remove (C18).
Ambiguity refusals in `HydrationFilterExpectationError` carry matched candidates in `candidates` and in the
message (C13). Transitions after `setRaw` pass the raw value to `reach` with safe diagnostic formatting
in `HydrationTransitionRefusedError` (C5). `remove()` cascades in-memory eviction of all descendant
references and cleans up plan-created child rows in reverse-depth order (C6). Chunk 8 item E3
(reference substitution across steps) is completely delivered and verified through live siege runs.

**Open, worst first:**

| Case | What is true | Why it matters |
|---|---|---|
| **C3, C11, C12** | A repeated `saveRecordAs` name silently keeps the last row, never refused at pre-flight | The spec documents last-wins, so this may be confirmation rather than defect — decide it |
| **A9** | A `set` with no `transitions` declared consults no gate and carries no `transition` key — indistinguishable from `setRaw` | |
| **A4** | A `fields` contract wider than the entity lets the extra field travel to the write route, and the reported result hides it | |
| **A12/A13** | Rows with no `defaults`, or a constant one, come out byte-identical and nothing notices | The "two of anything" rule, breaking where Table 1 says it does |
| **The `write` route creates a directory production never creates** | `guild-write-route-broker.ts` mkdirs the guild's path; `guildAddBroker` only mkdirs `guildsPath/<id>/quests` | A test seeded this way assumes a world the app cannot produce. **This is a design decision, deliberately left open** |
| **A16, B5** | Two refusals name the symptom rather than the rule — a caller meets TypeScript's own `Object is possibly 'undefined'` | Recorded as a class. Whether a framework can beat a compiler's wording is a design question |
| **D16** | `under()` with a dead id writes a real directory for a guild that never existed, in total silence | **Confirmed design**, per the ruling that the id's validity is the target's business. The sharpest illustration of a half-written world reporting success |

---

## Open decisions — yours

### 1. The write route's `mkdir`

Above. It is the clearest remaining fidelity gap, and fixing it might break every recipe that relies on
the directory existing. Decide it on purpose.

### 2. Whether `copies:` should be renamed to `mimics:`

The user said "mimics is what I would call it… but fine". **The rename is cheap** — nothing reads the
value, so there is no logic to chase: the field name in the framework's contracts, its two presence
checks, the type that enforces it, five ingredient declarations, and its mentions in the spec. Not done,
because they said fine.

---

## Rulings already made — do not re-litigate

| Ruling | Where |
|---|---|
| The siegelense interface is the CLI. The MCP layer is ended, and the spec states the CLI surface | user, this session |
| `copies:` may name a producer outside the repo, spelled `external:<name>`, and neither form may contain a `/`. The contract enforces it at module load | spec, beside the `copies:` rule |
| An ingredient mimicking an external producer gets no two-route comparison, and nothing claims otherwise | same |
| `routes` gains optional `query`, `update`, `remove` | chunk 4-6 plan §5 |
| An extra is `{ args, apply }`; `reach` receives the record; a link carries an optional `from` | same |
| `api` wins over `write` when both are declared and a base URL exists | same |
| A filter's scope is its immediate host. A top-level filter matches the whole instance | spec, `filter` section |
| A forward `fromSaved` is caught in the pre-flight, not the builder | same |
| A saved record is a **snapshot at save time**, not a live view | spec, beside `saveRecordAs` |
| The orchestrator-owned integration targets are **descoped** | spec, migration section |
| The compiler suites stay split, one program per suite at module scope | chunk 1-3 plan §10b |
| Validation splits: siegelense checks a seed call's SHAPE off the listing; the recipe's own schema checks every VALUE. Both before anything is written | spec, `seed` section |
| The reference grammar is narrow on purpose — `as` on `seed` only, references in `seed.params` and `goto.path` only, never inside `eval` | chunk-8 plan E1 |

---

## Traps — each cost an agent a cycle

| Trap | What happens |
|---|---|
| **A file-scoped ward can pass while the package is broken** | `tsc` grades a package WHOLE, but ward reports against the paths you name. A type error in an unnamed file in the same package shows green. **Scope package-wide when you change a shared type.** This bit three separate agents |
| **Cross-package drift is invisible to a file-scoped run** | Adding a member to one package's returned object broke a key-list assertion in another, four times this session. Only the git-scoped sweep catches it |
| **Importing `@dungeonmaster/orchestrator`'s main barrel boots an application** | Its first line exports from a startup file that calls `setInterval` at module scope. A short-lived command then never exits. Reach its brokers through `@dungeonmaster/orchestrator/brokers` |
| **A unit test's `setInterval` spy hides that hang** | The tests exit because of the spy. The real binary has none. **A manual run is the only thing that sees it** |
| **A route can escape the target** | Several brokers resolve their home from the global `DUNGEONMASTER_HOME`. A seed must set it and restore it in a `finally` |
| **`instanceof` fails across test realms** | Each test file gets its own constructor. Walk a cause chain by SHAPE (`typeof`, `in`), never `instanceof` |
| **A test under `test/` never runs** | This package's jest config scopes `roots` to `src`. Suites live under `src/`; fixtures and harnesses under `test/` |
| **Neither tsconfig may carry a comment** | Ward parses it as strict JSON and its catch swallows the failure. Verify with `python3 -c "import json; json.load(open(...))"` |
| **A tsconfig `exclude` of a directory still compiles a file a test imports** | `tsc` follows the import graph; ward's discovery is a glob. They disagree and ward fails the run. Exclude files individually |
| **A contract's test proves nothing about its generic** | The proof is a real call site compiling |
| **`registry()` and `run()` must come from ONE factory call** | Registered ingredients are closure state. A second call sees none and answers confidently wrong. `listing` is subject to the same rule |
| **A config entry naming an unregistered lint rule is FATAL** | It takes down linting for the whole package |
| **`enforce-stub-usage` flags ANY object literal bound to a `const` in a test** | Inline it as a call argument, or build it through calls |
| **A proxy staging one-shot mocks at construction corrupts unrelated suites** | Stage inside the `stages*` methods, never at construction. One agent silently broke a passing file this way |
| **Playwright resolves by plain Node rules, never the `source` condition** | A fix inside a package is invisible to an e2e run until that package is rebuilt |
| **`tmp/` is gitignored** | Scratch evidence dies with the worktree. The round scripts were copied to `scrolls/seigelense/rounds/` for this reason |

---

## The migration, and what scouting established

**Batch 10.0 has landed** — `packages/web/test/harnesses/dm-target/dm-target.harness.ts`, with
`apiTarget()` and `writeTarget()`. `apiTarget()` points at **the web port**, because real browser
traffic reaches the API through Vite's proxy and the API server's own port skips that hop. The dead
`buildQuestJson` is deleted.

**Batch 10.1 is scouted and unblocked.** What the scouting established:

- The current harness and the ingredient's `api` route both POST to `/api/guilds` and terminate in the
  same production chain, so the assertions should survive untouched.
- **The two-route comparison cannot use one path** — `guildAddBroker` throws on a duplicate. It needs
  two paths, so it can compare `urlSlug` and `name` for equal input but never `id`, `createdAt` or
  `path`.
- Both routes read-modify-write the same `config.json`. **Sequential, never parallel.**
- **Nothing has yet proven Playwright can resolve the recipes package at run time.** It would fail as a
  module-resolution error, not an assertion. Settle it by running one cohort-G spec and looking for that
  error before looking at any result.

**The running mark:**

```bash
python3 scrolls/tools/seed-census.py --methods
```

Today: **32 methods write directly, none route through the framework.**

---

## Documents, and which is authoritative

| File | For |
|---|---|
| `siegelense-recipes.md` | **The specification.** Part 5 wins over Part 3A. Carries every finding written back |
| `recipes-ledger.md` | The running mark of covered versus not, plus rounds A and B in full |
| `rounds/` | Every round's scratch scripts, runnable, plus the C and D reports |
| `plans/recipes-chunk-01-03-framework-types.md` | Contracts and chain. **§10b amendments** records where the plan was wrong |
| `plans/recipes-chunk-04-06-runner.md` | Runner, transitions, filter, sad paths. **§5 rulings** |
| `plans/recipes-chunk-07-repo-ingredients.md` | This repo's ingredients. **§0b** records what building found |
| `plans/recipes-chunk-08-siegelense-listing-and-seed.md` | The listing and the `seed` step, against the CLI |
| `plans/recipes-chunk-09-10-migration.md` | The conversion, rewritten around the harness seam |
| `plans/recipes-chunk-12-combinatorial-rounds.md` | The 65 cases, all driven |
| `plans/recipes-seeding-survey.md` | What the real harnesses do, with file-and-line evidence |

---

## How this build has been working, and why

**Every agent verifies rather than trusts.** Plans were wrong about something in nearly every group, and
each defect was caught by an agent checking a cited fact against real code instead of following it. Two
agents this session were told a premise and found it false — one about how to stage an HTTP boundary,
one about which side of a contradiction was correct. Both were right to check.

**Prove a test can fail.** Every fix this session broke its own code deliberately, watched the test go
red, and pasted what it printed. That caught a test that would have passed against the bug it was
written for.

**The manual run finds what tests cannot.** The listing printed perfectly and the command hung forever.
Every test passed, because they spy on the timer that caused it.

**A finding goes into the document, not around it.** That is the specification's own rule and it is the
reason the doc is now worth more than when this started.
