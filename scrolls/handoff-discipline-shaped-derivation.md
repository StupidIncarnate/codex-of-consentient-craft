# Handoff — the planner's derivation is now discipline-shaped

Uncommitted work on `master`. 23 modified files, all under
`packages/orchestrator/src/statics/**` plus `packages/orchestrator/CLAUDE.md`.

## What this change is

The six-stage planner that landed in `5e92f905` was written in ONE discipline's vocabulary. Its
`SURFACE` block was defined as "every FILE, found or to be made" and `IMPORTS` as "the file-to-file
graph". `manual-qa` authors nothing and imports nothing, so that pack could only contradict its own
template in prose while the template's format fence still showed `./packages/<pkg>/src/<path>.ts`.

Three things changed:

1. **`IMPORTS` became `CHAIN`.** All five packs already called that stage "the chain"; only
   `implementation` has an edge that is literally an import.
2. **The two derivation blocks take their ENTRY SHAPE from the pack.** The template keeps the order,
   the append discipline, the completeness check, and that the surface exists before a single chunk.
   Two new pack headings carry the rest: `### The surface` and `### The chain`. Both are now
   `MUST CARRY` on all five packs, recorded in each pack's docblock and in the pointer table in
   `packages/orchestrator/CLAUDE.md`.
3. **`manual-qa` says the checklist IS its itinerary and denominator.** `get-qa-checklist` for a
   siegemaster item already returns the walk paths with the force each branch needs, every unit
   under them, and a `checkSurface` per observable. So that pack's surface takes the path ids and
   unit ids VERBATIM and adds the one thing the tool cannot know — the INSTRUMENT. Its chain is
   PRECONDITION order, and the DELTA case is why it is worth writing at all.

Per-pack entry and edge:

| Pack | An entry is | An edge is |
|---|---|---|
| `implementation` | one PRODUCT file, `EXISTS`/`NEW`, companions riding with it | an IMPORT, down the six-rung ladder |
| `bug-repro` | files GROUPED BY BUG — the repro test and the traced cause | a CAUSAL hop: symptom → wire → contract |
| `below-browser` | a TEST file plus its layer, and each harness by full path | HARNESS ownership |
| `browser-e2e` | ONE `.e2e.ts`, plus every existing spec whose `page.goto` matches | spec → harness |
| `manual-qa` | a WALK PATH off the checklist, carrying its instrument | a PRECONDITION |

## Two defects found and fixed along the way

- **Three served prompts blew the 50,000-char MCP ceiling.** `planner+implementation`,
  `reviewer+below-browser` and `reviewer+browser-e2e` all spilled to a file and handed the agent an
  error stub. The pack tests could not see it: they bounded the PACK at 15,000 characters while the
  block it landed in was already over 50,000 served. Every pack's `budgets` test now measures the
  SERVED JSON block the way `agentNameToPromptTransformer` builds it, with
  `SERVED_HEADROOM_CHARS = 400`. Worst pair today is `reviewer + browser-e2e` at about 490 chars of
  headroom — it is the one that breaks first, and the comment in that pack's test says so.
- **The reviewer template graded against `LINKS` and `SUMMARY`**, two block names the planner stopped
  writing in `5e92f905`. Now `SURFACE` / `CHAIN` / `DECISIONS` / `ASSERTIONS`.
- Smaller: `agentOperatingRulesStatics.delegationSpike` served three escaped backticks
  (`` \`Agent\` ``) as literal backslashes; the worker template still called the `Agent` tool
  synchronous; `browser-e2e`'s planner had lost its `get-qa-checklist` call entirely, so its
  denominator had no named source.

## State of the tests

Green, verified by scoped `npm run ward -- --only lint,unit -- <file>`:

- `planner-minion`, `worker-minion`, `reviewer-minion`
- `agent-operating-rules`, `flow-evidence-contract`, `standards-review-concerns`
- `discipline-implementation`, `discipline-bug-repro`, `discipline-below-browser`,
  `discipline-manual-qa`

**Not yet green: `discipline-browser-e2e-statics.test.ts`.** It was down to 4 failures; five needle
edits were applied after that run and have not been re-run once. Nothing else is known-red.

## What is left

1. Re-run `npm run ward -- --only lint,unit -- packages/orchestrator/src/statics/discipline-browser-e2e/discipline-browser-e2e-statics.test.ts`
   and close whatever remains. The failures are all stale prose needles, not logic: read the diff,
   find the current sentence in the pack, repoint the needle. Watch the LINE WRAPS — most of these
   failures are a needle whose newline moved.
2. Re-run `packages/orchestrator/src/transformers/agent-name-to-prompt/agent-name-to-prompt-transformer.test.ts`.
   That is the hard 50,000-char gate and it was red at baseline for the three pairs above.
3. `npm run build` (its own command, unpiped, confirm exit 0), then the FULL `npm run ward`,
   foreground, `timeout: 600000`. Own every failure in it.
4. Delete the scratch files under `<repoRoot>/tmp/`: `measure-prompts.ts`, `measure-served.ts`,
   `measure-rules.ts`, `measure-sections.ts`, `measure-concerns.ts`, `measure-template.ts`,
   `dump-planner.ts`, `dump-reviewer.ts`, `find-stale-needles.ts`, `planner-template.md`,
   `reviewer-template.md`, `e2e-detail.txt`.

`tmp/measure-served.ts` is the useful one to keep until the end — it prints every
minion × discipline served size with its headroom, which is how the budget work was driven.

## Two traps this work hit

- **The pre-edit lint hook rejects `?.`, `??` and `!x.some(...)` INSIDE an `it()` body** as "a
  conditional in a test". Hoist the computation to a module-scope `const` and assert the constant.
  It also rejects a raw `: number` return type — return a boolean instead.
- **A `Write` of a whole test file is re-linted from scratch**, so patterns that were tolerated in
  the old file fail on the rewrite. Expect to hoist things the original had inline.
