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
   Its work sits in the worktree named in the row, under `worktrees/`. Run `git -C worktrees/<name> log --oneline -5`
   and `git -C worktrees/<name> status`. Then merge it (see "When a sub-agent reports back"), or set the row to
   `interrupted — re-dispatch`.
3. Check whether a rebuild is owed. `LEDGER.md` lists fixes marked `fixed, not built`. Siegelense and the other CLIs
   run compiled output, so a fix does not reach the CLI until a build. Build only with no sub-agent in flight.
4. You may merge a sub-agent's worktree branch into `master` without asking. The user gave this permission on
   2026-09-23, on the condition that sub-agents work in their own worktree and never build in the main checkout.
5. Tell the user where the cursor is, how many defects are open, and what case comes next. Keep it to three lines.

## The loop, one case at a time

1. Show the case ID and the exact command in a ```bash block. For a UI case, show the URL and the clicks.
2. Run it. Use the shell for CLI cases. Use the claude-in-chrome tools for UI cases, and load them all in one
   ToolSearch call first.
3. Reply with the command you ran, what state changed, and which values you checked against the case's Expect
   column. Say what you would record: `pass`, `fail`, or `skip`. **Do not paste the command's stdout back.** The
   user already sees it in the tool call.
4. Stop. Wait for the user. **Do not write `pass` into the Result cell yet.** The user reads the output too, and
   often finds a defect you did not. Not "pass (pending)", not "pass" with a note to revise it later.
5. When the user says "next" (or "next cmd"), write that case's Result cell: `pass`, `fail DEF-NN`, or
   `skip — <reason>`. Then move the cursor and run the next case.
6. When the user calls out a defect instead, the case gets `fail DEF-NN` at once. See the next section.

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
2. **Every fix sub-agent works in its own worktree.** Its first call is
   `mcp__dungeonmaster__create-worktree({ name: "def-<NN>" })`. It edits, runs ward, and commits only inside that
   path. The worktree has its own git index and its own compiled output. So its work cannot land in another agent's
   commit, and nothing it does rebuilds the main checkout that the walkthrough runs from.
3. **Never two sub-agents in the same package at once.** Worktrees stop them overwriting each other, but their
   branches would then conflict at merge time. Queue the second, and name the blocker in the status cell.
4. **Sub-agents never touch the main checkout.** No edit, no build, no `git` command outside their worktree. They
   never run `npm install`, `npm rebuild` or a bare `npm run ward`. They never merge. The driver owns the merge and
   the main checkout's build.
5. Use `model: "sonnet"` for mechanical fixes. Use the default model for a fix that needs debugging.
6. A read-only sub-agent, such as a review or an investigation, needs no worktree. It must edit nothing.
7. Write the worktree name into the ledger row's status cell, like `dispatched — worktrees/def-26`.

### The brief for a fix sub-agent

Copy this, fill the angle brackets, and send it with `run_in_background: true`:

```
Fix DEF-<NN> in /home/brutus-home/projects/codex-of-consentient-craft.

The defect: <what the user ran, what they expected, what happened, verbatim output line>.
Known leads: <file:line, if any>.

Rules:
- Your first call is mcp__dungeonmaster__create-worktree({ name: "def-<NN>" }). Work ONLY inside the path it
  returns: every Read, Edit, ward run and git command. Never edit, build or run git in the main checkout at
  /home/brutus-home/projects/codex-of-consentient-craft itself. A user is walking the app from there.
- Before your first edit, call the MCP tools get-architecture and get-testing-patterns, and get-folder-detail for
  each folder type you write into. Search with get-project-map, then discover, then Read. Native grep/find are blocked.
- Do not build, npm install, npm rebuild, or run a bare `npm run ward`. Do not merge. Do not fork helpers to do
  your core task.
- When ward is green, commit inside your worktree, on its own branch. Stage files by explicit path. End the commit
  message with the line: Claude'd it up in here!
- Write the failing test FIRST, run it, and see it go red for the reason in the defect. Then fix.
- Prove your tests bite. After they pass, break the code on purpose and confirm a test goes red. If a mutation
  passes, you found a missing test: write it, re-run green, re-apply the mutation, confirm red.
- Grade with `npm run ward -- --only lint,typecheck,unit,integration -- <every file you touched>`, timeout 600000.
  Run it from your worktree root. Use only the check types that apply to those files.

Report back in this shape, and nothing else:
WORKTREE — the path, the branch name, and the commit SHA
CHANGED — each file, with one verbatim line from it
MUTATIONS — which mutation, which test caught it
WARD — the command and its final summary line
BUILD NEEDED — which workspace, or none
LEFT STANDING — anything you could not fix, with file:line
```

### When a sub-agent reports back

1. Read its report. Open one or two of the files it names, in its worktree, and check the claim holds.
2. Merge its branch into `master` from the main checkout: `git merge --no-ff <branch>`. If it conflicts, stop and
   tell the user. Do not resolve a conflict by picking a side blind.
3. Remove the worktree once merged: `git worktree remove worktrees/<name>`, then `git branch -d <branch>`.
4. If it touched a compiled CLI, set the ledger row to `fixed, not built`. Otherwise set it to `fixed`. Put the
   merge SHA in the row.
5. When nothing is in flight and fixes are waiting on a build, run the build. Scope it with
   `npm run build --workspace=@dungeonmaster/<name>` when one package changed. Then set those rows to `fixed`.
6. Tell the user in one line that DEF-NN landed. Offer to re-run the failed case.

## End of every session

Do all of these before your final reply. A background command dies with your final reply.

1. Kill every siegelense instance you started: `dungeonmaster siegelense kill --instance <id>`. Stop any dev server.
2. Move the cursor in `LEDGER.md` to the next case to run.
3. Add a line to the session log: the date, the cases run, and the defects opened and closed.
4. Any sub-agent still running: set its row to `interrupted — re-dispatch`, and keep the worktree name in the
   cell. It dies with this session, but its partial work stays in that worktree.

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
