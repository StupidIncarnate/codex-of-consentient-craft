# Z07: The finish line

| | |
|---|---|
| Phase | Phase 6 — docs and finish |
| Source | Operator's own closing item — synthesized from EPIC.md's standing instructions (rule 4, "FIX EVERY PRE-EXISTING FAILURE"), repo `CLAUDE.md`'s build table and "Verification Standards" section, and G25's own Notes column ("rerun in Z07") |
| Needs | Z01-Z06 |
| Unblocks | none — this is the epic's last item |
| Packages touched | whichever ones a red `npm run ward` or `check:published` names |
| Checks to run | full `npm run ward` (bare), `npm run build:clean`, `npm run check:published`, browser smoke |
| Split | one agent — this item is the operator's own closing pass, not a fan-out |
| Runs alone | yes — nothing else may be mid-edit in this repo while this item runs, since it is the final gate before the epic is marked finished |

## Why

Every prior item in this epic runs scoped: file-scoped ward, one package, one folder. Nothing has yet
proven the WHOLE repo is green, that a from-scratch build works, that a consumer's `dungeonmaster init`
still works end to end, or that the browser UI actually renders without a blank panel or a console error.
This item is that proof. Per EPIC.md's own standing rule 4: "any pre-existing needs to be fixed... we're
trying to get to a good state with this slew of changes" — a full `npm run ward` must exit 0, and this
item is where that promise gets cashed in, not asserted.

## Current state

Not applicable — this item's job is to RUN checks against whatever state the repo is in once Z01-Z06 are
all `done`, not to check pre-existing files. Do not attempt to pre-verify anything here; every check
below has to be run for real, at the time this item executes, against the final code.

## Work

Run every step below in order. Do not skip a step because an earlier one looked clean — each one checks
something the others do not.

1. **A bare `npm run ward` exits 0.** Full repo, every check type, no `--only`, no file scope.
   ```
   npm run ward
   ```
   Give it `timeout: 600000` and wait on it properly — do not `sleep` and re-check, and do not end your
   turn while it is still running (per this repo's own background-tasks rule). If it is not green, fix
   every failure it reports, whether or not this item's own agent caused it — per EPIC.md rule 4, an
   agent working directly for the user (which is what this item is) owns every failure in a full run,
   including ones it did not cause.

2. **`npm run build:clean`, then `npm run check:published`.** Per this repo's own `CLAUDE.md` build
   table: `check:published` grades compiled output, and a warm tree still holds emit that no current build
   config would produce, so a plain `npm run build` is not enough here — it has to be `build:clean` first.
   Fix whatever `check:published` finds; it is checking the shape of what actually gets published, which
   nothing else in this epic has verified end to end.

3. **Run the consumer suite.** After step 2's `npm run build:clean`, run `npm run check:consumer` (G27)
   in local-install and global-install modes, and make it exit 0. By now it asserts every piece the epic
   added to a consumer: G27 lists the items that each added assertions. It replaces a manual rerun of
   G25, whose checks G27 folded in. This is the one check that proves the whole epic works somewhere
   that is not this monorepo (EPIC.md goal 3).

4. **Regenerate `.claude/settings.json` if any hook or MCP generator changed.** Per repo `CLAUDE.md`'s
   "Regenerating `.claude/settings.json` Here": `npm run build`, then `npm link --workspaces`, then
   `npm run init`. Only do this if this epic actually touched a generator (hooks, MCP permissions) — check
   before running; if nothing changed, skip this step and say so in the report.

5. **The browser UI smoke, per repo `CLAUDE.md`'s "Verification Standards."** `npm run dev`, open the web
   UI, and confirm no blank panels, no frozen spinners, no missing rows, no wrong routes, no console
   errors. Use `dungeonmaster siegelense` (see `dungeonmaster siegelense docs --for walking`) or the
   claude-in-chrome browser tools to drive it and read back what actually rendered — **the browser UI is
   the verdict, not the backend.** A run FAILS if a UI surface broke during it, even when every ward check
   is green. Kill the dev server when done, per this repo's own background-tasks rule (you are DONE with
   it once the smoke is read).

6. **Confirm every EPIC.md row is `done` or recorded as a `blocked` concession.** Read through every
   phase's table in EPIC.md. Every row must show `done` with a commit SHA, or `blocked` with a reason in
   the "Blocked items" table and a note on what else it holds up. An item still `todo` or `ready` at this
   point means the epic is not actually finished — stop and report that instead of proceeding to step 7.

7. **Write the closing log line and mark the epic FINISHED.** Add one line to EPIC.md's "Log" table with
   today's date and what the finish-line pass found. Add "FINISHED" at the very top of EPIC.md (the
   `# Brands and gateways: the epic` heading line, or immediately below it), so a fresh session opening
   this file first sees that the epic is done, not a run sheet still in progress.

## Lint rules this item adds or changes

None — this item runs and fixes, it does not add rules of its own. If a full-repo run surfaces a rule
gap serious enough to need a new one, that is a new unit of work, not something to squeeze into the
finish line; report it in the closing log line instead.

## Teaching text this item changes

EPIC.md itself: the "Log" table gets its final line, and the top of the file gets the FINISHED marker.

## Done when

- `npm run ward` (bare, full repo) exits 0.
- `npm run build:clean` then `npm run check:published` both succeed.
- `npm run check:consumer` (G27) exits 0 in both install modes.
- `.claude/settings.json` is regenerated if needed (or confirmed not needed).
- The browser UI smoke shows no blank panels, no frozen spinners, no missing rows, no wrong routes, no
  console errors.
- Every EPIC.md row reads `done` or is recorded as a blocked concession with a reason.
- EPIC.md carries a final log line and is marked FINISHED at the top.

## Traps

- **This is the one item that is allowed, and required, to run a bare `npm run ward`** — every other
  item in this epic must scope its ward runs; do not let that scoping habit stop this item from running
  the full sweep it exists to run.
- Do not mark the epic FINISHED if step 6 finds any row still `todo`/`ready`/`active`/`review` — go back
  and either finish that item or get an honest `blocked` recorded for it first.
- The browser smoke is not optional and not satisfied by ward's own `e2e` check type passing — per this
  repo's own Verification Standards, ward's e2e passing does not substitute for watching the actual
  browser render. Drive it and look.
- Per the background-tasks rule: give the ward run and the build a long enough timeout and wait on them
  properly; never end your turn with one still running, and never sleep-and-guess.

## Concessions made while executing

<Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table.>
