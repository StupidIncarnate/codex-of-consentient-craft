# Post-refactor walkthrough — read this first

This folder runs a manual walkthrough of the features the recent refactor changed. It spans several sessions. You are
the **driver**: the session that sits with the user, runs each test case on the real surface, and records what
breaks. The **user** watches, asks questions, and calls out defects.

## The files

| File | What it holds | Who edits it |
|---|---|---|
| `README.md` (this file) | How to run the walkthrough | Only when the process itself changes |
| `LEDGER.md` | Where we are (the cursor), every defect, and a log of each session | The driver, every time something changes |
| `features/_TEMPLATE.md` | The shape every feature doc follows | Rarely |
| `features/NN-<name>.md` | One feature: what changed, how to reach it, and every manual test case | The driver fills the Result column and adds cases |

The feature docs, in the order to walk them:

| Order | Doc | Case prefix | Why this position |
|---|---|---|---|
| 1 | `features/01-siegelense.md` | `SL` | Already in progress. It also gives you isolated, seeded app instances for later features |
| 2 | `features/02-hydration-and-recipes.md` | `HY` | The recipes seed the states that features 3 to 5 need |
| 3 | `features/03-orchestrator-step-engine.md` | `OR` | The engine that everything in the UI reports on |
| 4 | `features/04-marks-and-human-verdicts.md` | `MK` | Marks and verdicts ride on the engine |
| 5 | `features/05-web-execution-panel.md` | `EX` | Shows the engine's state in the browser |
| 6 | `features/06-session-forensics.md` | `SF` | Reads transcripts that features 3 to 5 produce |
| 7 | `features/07-ward.md` | `WD` | Independent. Its expensive cases can run any time the machine is idle |
| 8 | `features/08-init-prompts-and-mcp.md` | `IN` | Needs a full build and an init. Do it last, or when the user asks |

The user may reorder these. The cursor in `LEDGER.md` is what counts.

## Start of every session

1. Read this file, then `LEDGER.md`, then the feature doc the cursor names.
2. Check every defect row whose status is `dispatched`. The sub-agent that held it died with the last session.
   Look for its commit with `git log --oneline -20`, and read the files it names. Then set the row to `fixed`,
   `fixed, not built` or `interrupted — re-dispatch`.
3. Check whether a rebuild is owed. `LEDGER.md` lists fixes marked `fixed, not built`. Siegelense and the other CLIs
   run compiled output, so a fix does not reach the CLI until a build. Build only with no sub-agent in flight.
4. Ask the user once whether you may commit sub-agents' fixes this session. The answer lasts for this session only.
5. Tell the user where the cursor is, how many defects are open, and what case comes next. Keep it to three lines.

## The loop, one case at a time

1. Show the case ID and the exact command in a ```bash block. For a UI case, show the URL and the clicks.
2. Run it. Use the shell for CLI cases. Use the claude-in-chrome tools for UI cases, and load them all in one
   ToolSearch call first.
3. Reply with the command you ran, what state changed, and which values you checked against the case's Expect
   column. **Do not paste the command's stdout back.** The user already sees it in the tool call.
4. Fill that case's Result cell in the feature doc: `pass`, `fail DEF-NN`, or `skip — <reason>`.
5. Stop. Wait for the user. Move to the next case **only when the user says "next"** (or "next cmd").

The user may ask questions, poke at state, or ask for a variant first. Answer, then wait again. If the user runs
something that is not a listed case and it shows something worth keeping, add it as a new case row.

## When the user calls out a defect

Do these in order, in the same turn:

1. Add a row to `LEDGER.md`'s defect table. Use the next free `DEF-NN`. Write the command, what was expected, what
   happened, and any file and line you already know. Set the status to `dispatched`.
2. Set the case's Result to `fail DEF-NN`.
3. Dispatch one background sub-agent to fix it, using the brief below.
4. Carry on with the walkthrough.

**Never fix code yourself.** A fix blocks your turn and stalls the user. Recording and dispatching is your whole job.
Not a one-line edit, not a "quick" patch, not a test tweak.

A call-out that is a request rather than a defect, such as "this output should be a table", is still a `DEF-NN` row.
A call-out that needs a decision from the user first gets the status `needs decision`, and you ask the question.

### Dispatch rules

1. **At most five sub-agents at a time.** Queue the rest as `queued` in the ledger.
2. **Never two sub-agents in the same package at once.** They would overwrite each other's work. Queue the second,
   and name the blocker in the status cell.
3. **Sub-agents never build, commit, `git add`, `git mv`, `git stash`, run `npm install`, or run a bare
   `npm run ward`.** The driver owns the build and the commit. The git index is shared, and one agent's `git mv` has
   already been swept into another agent's commit.
4. Use `model: "sonnet"` for mechanical fixes. Use the default model for a fix that needs debugging.

### The brief for a fix sub-agent

Copy this, fill the angle brackets, and send it with `run_in_background: true`:

```
Fix DEF-<NN> in /home/brutus-home/projects/codex-of-consentient-craft.

The defect: <what the user ran, what they expected, what happened, verbatim output line>.
Known leads: <file:line, if any>.

Rules:
- Before your first edit, call the MCP tools get-architecture and get-testing-patterns, and get-folder-detail for
  each folder type you write into. Search with get-project-map, then discover, then Read. Native grep/find are blocked.
- Do not build, commit, git add, git mv, git stash, npm install, or run a bare `npm run ward`. Do not fork helpers
  to do your core task.
- Write the failing test FIRST, run it, and see it go red for the reason in the defect. Then fix.
- Prove your tests bite. After they pass, break the code on purpose and confirm a test goes red. If a mutation
  passes, you found a missing test: write it, re-run green, re-apply the mutation, confirm red.
- Grade with `npm run ward -- --only lint,typecheck,unit,integration -- <every file you touched>`, timeout 600000.
  Use only the check types that apply to those files.

Report back in this shape, and nothing else:
CHANGED — each file, with one verbatim line from it
MUTATIONS — which mutation, which test caught it
WARD — the command and its final summary line
BUILD NEEDED — which workspace, or none
LEFT STANDING — anything you could not fix, with file:line
```

### When a sub-agent reports back

1. Read its report. Open one or two of the files it names and check the claim holds.
2. If it touched a compiled CLI, set the ledger row to `fixed, not built`. Otherwise set it to `fixed`.
3. If the user approved commits this session, stage the files it names by explicit path. Run
   `git diff --cached --stat` to check that nothing else is staged. Commit on the current branch. Put the SHA in the
   ledger row.
4. When nothing is in flight and fixes are waiting on a build, run the build. Scope it with
   `npm run build --workspace=@dungeonmaster/<name>` when one package changed. Then set those rows to `fixed`.
5. Tell the user in one line that DEF-NN landed. Offer to re-run the failed case.

## End of every session

Do all of these before your final reply. A background command dies with your final reply.

1. Kill every siegelense instance you started: `dungeonmaster siegelense kill --instance <id>`. Stop any dev server.
2. Move the cursor in `LEDGER.md` to the next case to run.
3. Add a line to the session log: the date, the cases run, and the defects opened and closed.
4. Any sub-agent still running: set its row to `interrupted — re-dispatch`. It dies with this session.

## Things that will trip you

- **Siegelense and the other CLIs run compiled output.** A source fix does nothing until a build.
- **`npm run dev` is root-only.** Never run it inside a workspace. Root `CLAUDE.md` says why.
- **An edit anywhere under `packages/*/src` restarts a watching dev server for about 1.5 seconds.** A sub-agent
  editing code will blip a UI you are looking at. Use a siegelense instance for UI cases: its lanes do not watch files.
- **The browser UI is the verdict.** A quest whose `quest.json` says `complete` still fails the case if a panel went
  blank or a spinner froze. Root `CLAUDE.md` has the full rule.
- **Never edit `agent-flow-statics.ts` while an e2e run is in flight.** The server checks that graph at boot, and a
  half-edited graph crashes other runs.
- Scratch files go in `<repoRoot>/tmp`, never `~/tmp`.
