# Consolidated plan — handoff

Pick up from here. `scrolls/consolidated-plan.md` is the original plan and is still the source for
WHAT the work is; this file is what a session needs to keep RUNNING it, plus everything the plan
turned out to be wrong about.

## Where you are

| | |
|---|---|
| Branch | `consolidated-plan` |
| Worktree | `worktrees/consolidated-plan` |
| Carved from | `master` at `e20c6b771` |
| Commits landed | 7 |
| Units finished | 28 |
| Units remaining | roughly 45, listed below |

Every command in this file runs from the worktree root, never from the main checkout.

## How to operate — the user's standing instructions

1. **THREE sub-agents at a time. Never a fourth.** Queue instead. This is a direct user
   instruction, not a guideline.
2. **A 45-minute recurring ping.** The user asked for it to keep the session's cache warm. Set it
   with `ScheduleWakeup` (`delaySeconds: 2700`) and RE-SCHEDULE IT on every firing — one call fires
   once. Its honest value is as a heartbeat: if an agent hangs on a ward run and never notifies, the
   ping is what wakes you.
3. **The operator owns builds and commits. A dispatched agent does neither.** Twelve concurrent
   commits in one worktree was measured at three landing and nine dying on `Unable to create
   index.lock`.
4. **Pre-existing failures are IN SCOPE.** The user ruled this explicitly. A full `npm run ward`
   must exit 0, including failures this work did not cause.
5. **Commit on the branch you are on.** No new branches. This repo's `CLAUDE.md` overrides the
   harness default that says otherwise.

## The five owner decisions — settled, do not re-litigate

1. **`workItem.observations[]` IS the sign-off record.** `signoffContract`, `signoffTrackContract`,
   `signoffTracksStatics` and `signoffVerdictContract` all retire. Vocabulary is
   `met` / `cant-meet` / `unmet`.
2. **The execution panel renders REAL step names** from `agent-flow-statics.ts`. Flowrider has no
   `walk` step — its rows read `work`. Four-tier label: bare, then the step, then `step - pieceName`
   where pieces differ, then `step pt: N` where even the piece is the same.
3. **`verifyByHuman` is a bare optional boolean.** No guard, no refinement, any role may set it.
   **The enforcement is the FILTER** that drops flagged criteria from every LLM's observable list.
4. **Delete the `recording` hydration route.** DONE, end to end.
5. **Delete the `operating` and `operational` docs scopes.** Five remain. Make `about` reachable
   with no `--for`, and say so in the help text and every prompt that reaches for `docs`.

## Operator rulings made during the run

Each of these changed what got built. They are decisions, not observations.

| # | Ruling |
|---|---|
| R1 | The coverage row carries FOUR counts — `met`, `cantMeet`, `unmet`, `outstanding`. `27-ui.md:170` requires it: `unmet` had nowhere to appear. |
| R2 | Counts attribute PER TRACK. A codeweaver's `met` does not count for flowrider. |
| R3 | The `QuestSummary` wire shape may change; a stale browser bundle is fixed by a reload. |
| R4 | `docs-statics.ts:27-28` becomes five scopes, and line 27 announces the bare-`docs` overview. |
| R7 | ADD T2-0, a projection endpoint (orchestrator broker + server responder). No projection anything exists, and `27-ui.md:6` scopes story 27 to `@dungeonmaster/web`, which cannot build it — `agentFlowStatics` lives in orchestrator. Without T2-0, T2-2 and T2-4 are undeliverable. |
| R8 | T2-8 merges into T2-7 — it has no scope of its own once the ward-mode finding lands. |
| R11 | ADD T3-20d. The filter has more than one site. |
| R12 | SPLIT the prompt work: T3-20c = both intake prompts (BugHunt authors observables too), T3-20e = both siege walkers. |
| R13 | SPLIT T3-21b. The verdict panel needs a WRITE path; the browser calls no MCP tool. |
| R17 | Name the debt contract `quest-summary-DEBT`, not `cant-meet`. It holds TWO marks. |
| R18 | **A `packages/shared` BARREL unit RUNS ALONE.** See Traps. |
| R19 | T1-10 also owns `packages/mcp/.../quest-summary-layer-responder.test.ts` — no unit in any track covered it. |
| R22 | T1-5 makes both summary contracts `.strict()`. See Traps. |
| R23 | T2-5 RETIRED — duplicate of T1-9. |
| R24 | **A file-scoped ward run proves the FILES, never the PACKAGE.** See Traps. |
| R25 | **DISPROVEN.** The 39 web lint errors are NOT a stale-`dist` artefact. See Traps. |
| R26 | **The `verifyByHuman` filter has THREE sites, in two packages.** See below. |

## Traps — every one of these was measured, not guessed

### A `.parse()` of an object literal is invisible to the compiler

`questSummaryBuildTransformer` wrote `confirmed: 0` and `unconfirmable: 0` into a contract that had
neither field, and **typechecked green through an entire migration** — 1793/1793, three times. The
cause is that `.parse()` takes `unknown`.

Worse: the replacement fields all carry `.default(0)`, so with a loose contract the parse
**succeeded**, stripped the stale keys, and defaulted every count to zero. Silent zeros on screen,
no error anywhere.

Both summary contracts are now `.strict()`, and reintroducing the bug reddens 34 tests. **Every
other `.parse()` of an object literal in this repo has the same hole.** A sweep is owed.

### A file-scoped ward run can report a package typecheck PASS while the package is broken

Measured: a scoped run reported `typecheck: PASS (1421/1421)` for `packages/web`. The
package-scoped run found 14 errors across 7 files and discovered 1424. Once a file is ORPHANED,
a typecheck scoped to other files never pulls it into the tsc program.

**A package is only proven green by `npm run ward -- --only lint,typecheck,unit -- packages/<name>`.**

### A `packages/shared` barrel edit breaks EVERY package while it is inconsistent

`jest.setup.js` requires `integration-environment-cleanup-all-broker` through that barrel in its
`beforeAll`. Measured: a mid-rename dangling export failed an unrelated agent's run in a different
package with `Cannot find module`. Serialising barrel-against-barrel is not enough — a barrel unit
runs with **nothing else in flight**.

### Compare paths WITH the separator, after resolving both sides

`startsWith(targetRoot)` without a trailing separator let a write land in `/tmp/dm-home-evil` when
the target was `/tmp/dm-home`. It passed every existing test and was found only by mutation. Two
units now guard it; assume the shape exists elsewhere.

### `discover`'s index goes stale in this worktree

Confirmed by eleven agents. It returns pre-edit content, including for files it claims still hold
strings deleted hours ago. Use it to LOCATE, then `Read`. After your own writes, trust `Read` and
ward only.

### `signoffTrackEligibilityStatics` is defined in NO file

Eight files name it; zero declare it. `step-scope-statics.ts:49` is the live table. Still stale at
`step-scope-statics.ts:4,28,37` and `step-in-scope-units-transformer.ts:117`.

### The stale-`dist` trap did NOT apply to the web lint errors

I predicted it and was wrong. `npm run build --workspace=@dungeonmaster/shared` cleared **none** of
them. Do not build again expecting them to clear.

## Mutation testing — put this clause in every brief

> Prove your tests bite, and treat a mutation that PASSES as a finding. After they pass, break the
> code deliberately and confirm a test goes red. If a mutation passes you have found a MISSING TEST:
> write it, re-run green, re-apply the mutation, confirm red. Report which test caught which
> mutation, and every mutation that initially passed.

It has found **ten** gaps that ordinary green suites missed, including:

- a path-prefix escape letting writes land outside their target directory
- a contract silently accepting `null`
- a React key collision nothing could observe until a test read React's own duplicate-key warning
- a settle call droppable on a ref branch no test covered
- an **untestable** code path, correctly reported rather than faked: `run-chat-layer-broker` discards
  the process id it mints, so nothing can observe it without a production change

## The remaining queue

### Track 1 — sign-off re-homing (13 of 15 done)

Remaining: **T1-13** (session-forensics `trackVerdicts` → `unitMark`) and **T1-15** (delete the four
retiring folders, their barrel lines, and the e2e that PINS the fiction).

T1-15 must also:
- sweep TEST files, not just source — `SignoffStub` imports survive there
- clear three readers of `signoffTracksStatics`: `signoff-track-contract.ts:31`,
  `text-display-symbols-statics.test.ts:1`, `quest-summary-build-transformer.test.ts:10`
- delete `signoffTrackMarks` — T1-4 confirmed nothing needs it
- rename `signoffDenominatorTrackContract` and `questSummaryLimitsStatics.maxUnconfirmable`
- rewrite `quest-summary-under-raccoon.e2e.ts`, which asserts `'0 confirmed'` / `'no unconfirmable
  verdicts'` — **rewrite it BEFORE the fix lands**, per this repo's regression-guard rule
- fix the history sentence at `unit-mark-contract.ts:3-4`

### Track 2 — the execution panel (0 of 13 done)

**Entirely unstarted, and entirely blocked on `packages/web` being green.** Do not dispatch into web
until the debt units below land — an agent sent there spends its run chasing 39 errors that are not
its own.

Order: T2-0 (the new endpoint) → T2-2 → T2-4. T2-1 → T2-11 → T2-10 → T2-3 → T2-9 is a **forced
serial chain**; all five write `execution-row-layer-widget.tsx`. T2-6, T2-7, T2-12 are independent.

`27-ui.md` is wrong in four places, all verified:
- `:245-249` says `quest.flows[].recipes[]` does not exist. It does, at `flow-contract.ts:39`.
- `:149-150` lists the ward-mode tag as broken. It renders today and its test asserts it.
- `:151-153` lists the retry badge as broken. It renders today.
- `:194-201` describes `operations-partial-continuation.e2e.ts` wrongly on every particular. **There
  is no pt-N double-meaning trap.**

### Track 3 — the independent work (6 of 16 done)

Remaining: T3-13b, T3-14b, T3-14c, T3-15, T3-20a, T3-20b, T3-20c, T3-20d, T3-20e, T3-21b, T3-21c.

**R26 — the filter has THREE sites, in two packages.** Each hardcodes the same ternary today, and
that ternary is what the filter replaces: `unit.verifyByReading === true ? 'reading' : 'test'`

1. `orchestrator/src/transformers/step-in-scope-units/step-in-scope-units-transformer.ts:92`
2. `orchestrator/src/transformers/quest-summary-build/quest-summary-build-transformer.ts:121`
3. `session-forensics/src/guards/is-track-owed-unit/is-track-owed-unit-guard.ts:49`

The plan named only the first. **Miss 2 or 3 and a flagged criterion leaks back into a role's list**
— the flag looks wired and does nothing. The filter must PRODUCE the literal `'human-check'` and
compare; do not import the type across packages, because orchestrator publishes no `statics` subpath.

`28-independent.md:26-27` claims SIX files carry glyphsmith logic, "MEASURED". The real footprint is
11+, and five of them contain no occurrence of the string:
`flows/design-chat-start/`, `start-orchestrator.ts:370`, the server's
`orchestrator-start-design-chat-adapter.ts` and `design-session-responder.ts`, `design-flow.ts`, and
`web/src/statics/chat-process-id-prefixes/chat-process-id-prefixes-statics.ts:15`.

**T3-21b is load-bearing, not cosmetic.** T3-21a's citation holds a screencast past cleanup with no
release condition, so a quest carrying a `verifyByHuman` criterion holds its instance **forever**.
The verdict write path is what releases it — wire the release in the same pass as the panel.

### Track 4 — siegelense and hydration (11 of 28 done)

Remaining: T4-4b, T4-5, T4-7a, T4-7b, T4-8, T4-10b, T4-11, T4-12b, T4-13a, T4-13b, T4-13c, T4-15a,
T4-15b, T4-15c, T4-15d, T4-16d, T4-17a–f.

Two are the OPERATOR's, not an agent's:
- **T4-13a** regenerates `package-lock.json` through `npm install`, which rewrites `node_modules`
  under every running agent. Run it ALONE.
- **T4-15a** changes `locations-statics.ts`. This repo's ESLint rules import
  `@dungeonmaster/shared/statics` at load with no `source` condition, so lint cannot grade it until
  `shared` is rebuilt.

### The debt units — added by the user's ruling that pre-existing failures are in scope

`packages/web`, run `1790102251700-29d3`: 21 files, 40 errors. PROVEN pre-existing — the rule commit
`3aa2d4816` is an ancestor of master's tip, and zero e2e files were touched by this work.

```
D1  dispatch-pause-between-specs.e2e.ts (34) · bughunt-begin-transition.e2e.ts (285)
D2  execution-queue-streaming.e2e.ts (95,100,166) · guild-delete.e2e.ts (24,43,59)
D3  guild-two-route-comparison.e2e.ts (8,9) · quest-start.e2e.ts (68,132)
D4  chat-send-auto-resumes.e2e.ts (72) · elapsed-duration-finished.e2e.ts (x4)
D5  elapsed-duration-tick.e2e.ts (x2) · execution-panel-pause-button.e2e.ts (x1)
    · multi-widget-coexistence.e2e.ts (x2)
D6  pause-resume-emits-lifecycle-event.e2e.ts (x1) · pause-resume-status-matrix.e2e.ts (111,132)
    · quest-pause-resume.e2e.ts (62,118,127)
D7  quest-ws-update.e2e.ts (75,148) · resume-execution-row-runs-again.e2e.ts (115)
    · resume-starts-dispatch.e2e.ts (73,152)
D8  subagent-duration-notification-arrives.e2e.ts (135,244) · ward-execution-streaming.e2e.ts (142,328)
    · warpgate-queue-listing.e2e.ts (119,136)
D9  playwright.config.ts:85 — `command: 'npm run dev:no-watch --workspace=@dungeonmaster/server',`
```

**D1–D8 are unlike every other unit here: they need E2E verification.** Routing setup through a
harness CHANGES what a spec does, and only a browser run proves it still passes. The specs run from
source, but the app they drive is `packages/web/dist`, which is stale.

> **SEQUENCE: build `packages/web` FIRST, then dispatch D1–D8 with `--only e2e -- <their own specs>`
> permitted.** Ward gives each e2e run its own port pair, report path and artifact directory, so
> four can run at once; a cap of 3 is already inside that.

**D9's lint message points at the wrong helpers.** It names `isPackageE2eEligibleGuard` and
`architecturePackageE2eEligibleDetectBroker`, which answer the FRONTEND question. The hardcoded name
here is the http-backend. Find the backend equivalent, or establish that an exemption is the honest
answer — do not follow the message into a helper that resolves the wrong package.

### `packages/orchestrator` exits 1 on an OPEN-HANDLE LEAK

lint 1795/1795 PASS, typecheck 1794/1794 PASS, unit 648 files PASS, **exit 1**. A `setImmediate`
stays armed, reported in `chat-spawn-broker.test.ts` and `design-chat-start-responder.test.ts`.

**Both files were changed in commit `eaeb92845`**, which deleted a callback parameter. An agent
concluded they were untouched "because they are absent from `git status`" — that only proves they
are COMMITTED. The leak may be ours. A unit was diagnosing this at handoff; see below.

## In flight at handoff — THREE agents, work uncommitted and UNVERIFIED

These were mid-run when the session stopped. Their edits are on disk. **Read each file before
building on it; none of this work has passed a ward run.**

| Unit | Was doing | Files to inspect |
|---|---|---|
| T3-14a | Deleting the `design.session` route | `packages/server/src/flows/design/design-flow.ts`, `responders/design/session/`, `adapters/orchestrator/start-design-chat/` |
| orchestrator leak | Diagnosing the `setImmediate` | `packages/orchestrator/src/brokers/chat/spawn/`, `responders/design-chat/start/`, the three named proxies |
| T4-4b | Element delta onto an acting step | `packages/siegelense/src/contracts/step-reading/`, `brokers/step/dispatch/` |

**T3-14a carries a trap**: `design-flow.ts` holds THREE routes. `design.session` goes;
`design.start` and `design.stop` are the design SANDBOX and STAY. Deleting the sandbox because it
shares a prefix is not caught by any typecheck.

**T4-4b carries a trap**: `step-dispatch-broker.ts` builds a `StepReading` in THREE branches. A
stamp in one is a silent hole in the other two — the same shape that bit a settle wiring earlier.

A previous trio died on a session rate limit mid-run. Both predecessors' work turned out to be
complete and correct; the resuming agents verified rather than redid it. **Ask an agent to READ what
its predecessor left and judge it, never to assume either way.**

## What is owed and was not done

1. **A full `npm run ward`.** Only `web` and `orchestrator` have been graded package-scoped, and
   BOTH carried failures that scoped runs had hidden. Fifteen packages are unmeasured. Whatever it
   finds joins the debt list.
2. **`npm run build --workspace=@dungeonmaster/web`**, before any D-unit's e2e run.
3. **Nothing writes a `.webm`.** `prune-statics.ts:39-41` marks the video step NOT STARTED. Decision
   3's flag, filter, citation and retention are all correct, and there is no recording to cite — so
   a `verifyByHuman` unit resolves `blocked`, loudly and by design. The person gets a question with
   no evidence. Building the recorder was in none of the four tracks. **This is a scope decision for
   the user, flagged and not absorbed.**

## The brief template that worked

Every execution brief carried, and every future one should:

- the four standing bans — no build, no commit, no bare ward, no `npm install`
- an explicit fence naming the packages other agents hold, and that a failure there is not theirs
- the `discover`-is-stale warning
- `get-architecture`, `get-testing-patterns`, and `get-folder-detail` per folder type, before the
  first write
- the mutation-testing clause above
- a package-scoped ward command, never file-scoped, when the deliverable is a green package
- a fixed report shape: what changed with one VERBATIM line each, mutation evidence, the ward exit
  line, and what it left standing for the next agent

**The agents that reported what they LEFT BROKEN were worth more than the ones that reported what
they fixed.** That field is what found an unowned mcp test file, a stale stub in an unrelated chat
widget, and the three-site filter.
