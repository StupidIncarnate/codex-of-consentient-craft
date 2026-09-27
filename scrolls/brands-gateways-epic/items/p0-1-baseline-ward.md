# P0-1: A full `npm run ward` exits 0, including the slow `cli` install test

| | |
|---|---|
| Phase | Phase 0 — a green baseline |
| Source | `scrolls/gateway/followup-sustainability.md`, item 39, lines 822-831; CLAUDE.md "Verification Standards"; the `<dungeonmaster-ward>` and `<dungeonmaster-wardDiscipline>` session snippets |
| Needs | nothing |
| Unblocks | [A00](a00-orchestrator-own-proxy.md), [T07](t07-home-sandbox-for-consumers.md) |
| Packages touched | whichever packages the full ward run flags; item 39 already names `cli` |
| Checks to run | all of them — this item IS the full `npm run ward` |
| Split | mostly the operator's own work; see "Work" below for how it turns into sub-dispatches |
| Runs alone | no — Phase 1 items outside the packages a failure names may run at the same time |

## Why

Nothing after Phase 0 means anything unless a full `npm run ward` exits 0 first. EPIC.md's own rule 4
says every pre-existing failure gets fixed, not just the ones this epic's own edits introduce. The
2026-09-26 run of `npm run ward` passed every check, then failed the slow-test gate on
`packages/cli/src/startup/start-install.integration.test.ts`: slowest test 10.7s against the 10s
integration bar (`slowFileThresholdStatics.integrationTestWarnMs`). Run alone, the same file's slowest
test takes 2.4s. The gateway source copy `init` now runs takes 50ms for 408 files, so the 10.7s comes
from load the rest of the suite puts on the machine, not from the copy itself. A bare `npm run ward` is
not green while this stands, so no later item's own ward run can be trusted as a true regression check.

## Current state

Checked 2026-09-26 against the code:

- `packages/ward/src/statics/slow-file-threshold/slow-file-threshold-statics.ts:28` sets
  `integrationTestWarnMs: 10_000` (10 seconds).
- `packages/cli/src/startup/start-install.integration.test.ts` holds six tests, confirmed by reading the
  file:
  1. `'VALID: {context} => delegates to flow and returns install result with devDependencies added'`
     (line 14)
  2. `'VALID: {e2e-eligible target, devServer.e2e.processes with an api and a web entry} => the written
     config maps each into webServer with tokens substituted'` (line 48)
  3. `'ERROR: {e2e-eligible target, devServer.e2e.processes still the unedited seeded placeholder} =>
     the written config refuses to load, naming the field to edit'` (line 142)
  4. `'ERROR: {e2e-eligible target, .dungeonmaster.json has no devServer.e2e} => the written config
     refuses to load, naming the field to edit'` (line 204)
  5. `'ERROR: {e2e-eligible target, a process command uses {apiWorkspace}} => the written config refuses
     to load, naming the unresolvable token'` (line 250)
  6. `'ERROR: {e2e-eligible target, a process portRole is neither api nor web} => the written config
     refuses to load, naming the process'` (line 311)
- Not checked: which of the six is the slow one under full-suite load, and why. That is this item's
  first step.
- Whether any OTHER package fails a full `npm run ward` today is not checked. The operator's first run
  (Work step 1) answers this for real; this item's own text can only describe the one failure the
  source doc already found.

## Work

This item is mostly OPERATOR work, not a single agent's. The operator runs the full check, then turns
each failure into a scoped sub-dispatch.

1. **Operator runs one full `npm run ward`**, with `timeout: 600000`, and waits on it — never
   backgrounds it, never polls it with `sleep`. See the `<dungeonmaster-backgroundTasks>` snippet: a
   command still running when a turn ends is killed, so this has to complete inside one turn.
2. **For every failing package the run reports**, the operator dispatches a sub-agent scoped to that
   package's failing files, following the `<dungeonmaster-wardDiscipline>` snippet: `npm run ward --
   --only <types> -- <files>` on the failing package, never a bare re-run of the whole repo.
3. **For the `cli` slow-test failure specifically**, dispatch an agent to:
   a. Run `packages/cli/src/startup/start-install.integration.test.ts` alone
      (`npm run ward -- --only integration -- packages/cli/src/startup/start-install.integration.test.ts`)
      and compare its per-test timings against a full-suite run, to find which of the six tests is the
      one that crosses 10s under load — the doc's own number (10.7s full-suite vs. 2.4s alone) says the
      file as a whole is slow under load, not necessarily every test in it equally.
   b. Find WHY that test is slow under load: what it waits on (a real timer, a retry loop, a fixed
      `setTimeout`, disk contention from `installTestbedCreateBroker`'s temp directories, CPU
      contention from parallel jest workers). Report the mechanism, not just the number.
   c. **Recommended: make the test cheaper.** Look for a hard-coded wait, a retry loop with a fixed
      backoff, or heavier I/O than the assertion needs (e.g. writing more fixture files than the test
      reads back). Making the test itself faster fixes the problem for every future run, whatever else
      is competing for CPU that day.
   d. **Raising `slowFileThresholdStatics.integrationTestWarnMs` is the last resort**, only once the
      agent has shown the test cannot be made cheaper without weakening what it checks. If this is the
      outcome, the agent's report must say why: which line makes the test irreducibly slow, and why
      speeding it up would drop real coverage.
4. **Whichever fix lands**, re-run `npm run ward -- --uncommitted` (or the scoped file-list form) until
   green, then the operator runs one more full `npm run ward` as the regression pass, per
   `<dungeonmaster-wardDiscipline>`: "one bare run as the regression pass" after scoped fixes exit 0.
5. **Commit.** Per EPIC.md rule 5, this commits straight to the branch the epic is running on, no new
   branch.

## Done when

- [ ] A full `npm run ward` (timeout 600000) exits 0, including the slow-test gate.
- [ ] The report for the `cli` fix names which of the six tests was slow under load and why.
- [ ] Every other failure the first full run found (if any) is fixed, not merely reported, per
  EPIC.md rule 4.
- [ ] The fix is committed on the current branch (`gateway-pivot`), with the SHA recorded in EPIC.md's
  status table.

## Traps

- Never `sleep` waiting on the ward run, and never `tail` its output file — wait on the command itself
  per `<dungeonmaster-backgroundTasks>`.
- A scoped ward run's "no tests found" reads as `skip`, not a failure — don't mistake that for green
  when the intent was a full-repo check. This item specifically needs a BARE `npm run ward` to mean
  anything, because it is checking the slow-test gate, which only fires under full-suite load.
- Raising the threshold is a config change with no expiry: once raised, a genuinely-slower test in
  ANY integration file gets 10.7s of runway before anyone notices. Treat it as a real cost, not a free
  knob.

## Concessions made while executing

