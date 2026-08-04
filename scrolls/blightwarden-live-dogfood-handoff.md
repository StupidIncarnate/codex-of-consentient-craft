# Handoff: live dogfood of the blightwarden operator conversion

You are picking this up cold. Read this whole file before touching anything.

## Why you are here

Commit `82d2bd77` on branch `flow-ui` deprecated the `lawbringer` role and converted
`blightwarden` from a **fixpoint** role into an **operator** with a server-computed completion gate. Full `npm run ward`
exits 0 (6643 lint / 6623 typecheck / 2338 unit / 103 integration / 62 e2e across 13 packages). **None of it has ever
run live.** Your job is to prove it works in a real quest, and specifically to prove blightwarden does not cycle.

### The failure that motivated the change

Quest `e0210063` ran `lawbringer` three times back to back (`e0795d79` → `00de1626` → `9ba6f6b1`). Each pass re-derived
its scope from scratch, re-partitioned the same diff differently (4 → 6 → 9 minion groups), and found a *disjoint* set
of problems. It never converged, burned the pt-chain budget (`maxAttempts: 3`), and the quest **blocked** with the final
audit never running.

Three causes, all supposedly fixed by `82d2bd77`:

1. **Unreachable exit condition.** The old rule said signal `partial` if the pass changed *anything*
   and `done` only on a byte-identical pass. With open-ended review criteria and fix authority, a fresh reviewer always
   finds one more thing.
2. **No memory of what was reviewed-and-clean.** A commit message records what was *fixed*, never what was *inspected
   and found fine*. Pass 1 found 2 untested branches in a file; pass 2 found 4 *different* ones in the same file. No
   pass-3 finding was in code the earlier passes hadn't already reached.
3. **The diff was wrong.** `git diff master...HEAD` returned 30 files where the quest had touched 173, because master
   already contained the implementation commits. ~144 files were never reviewed by anyone.

### What replaced it

- Review surface = `<implPath>:<concern>` units over 7 concerns (`coverage`, `craft`, `security`,
  `dedup`, `perf`, `integrity`, `dead-code`), derived deterministically from
  `git diff <quest.baseRef>...HEAD`. Ids reproduce byte-identically across passes.
- `quest.baseRef` is stamped at relay seed (Start Quest), and **only when unset**.
- Dispositions persist in `quest.planningNotes.blightLedger` via `modify-quest`, keyed on `itemId`
  (re-dispositioning REPLACES). Minions write them directly, mid-run, as they go.
- `get-blight-checklist({ questId })` MCP tool renders the surface with `[x]`/`[ ]` and a REMAINING count.
- `signal-back` **recomputes** the outstanding set and **throws on `done`** while any unit carries no disposition.
  `partial` bypasses the gate. A refused `done` persists nothing and costs no pt attempt.
- Dispositions are `reviewed` / `fixed` / `routed` / `recorded` / `gap`. All five clear a unit — the gate refuses
  **absence**, not honesty.
- Minions: `blightwarden-minion` (a disjoint group of file pairs, all 7 lenses, fixes in place) and
  `blightwarden-crosscut-minion` (whole diff, runs last and alone).
- Feature tail: `ward(changed) → flowrider → siegemaster → blightwarden → ward(full)`.

---

## Before you start

### 1. Branch off `flow-ui`, NOT master

`82d2bd77` is on `flow-ui`. Branching off master gets you none of this.

```bash
git checkout flow-ui
git log --oneline -1          # expect 82d2bd77
git checkout -b dogfood-blightwarden-live
```

### 2. Regenerate the MCP permission — MANDATORY, nothing works without it

`.claude/settings.json` has **no permission entry** for the new `get-blight-checklist` tool. A live blightwarden calling
it will be **blocked**, and you will misread that as the feature being broken.

```bash
npm run build
npm link --workspaces
npm run init
```

`npm run init` regenerates `.claude/settings.json` from `mcpToolsStatics.tools.names` via each package's `StartInstall`.
**Never hand-edit that file.** Afterwards, confirm
`mcp__dungeonmaster__get-blight-checklist` appears in `permissions.allow[]`.

You will also need to **restart your Claude session** for the new MCP tool to be visible to agents.

### 3. Kill stale processes

```bash
npm run dev:kill
```

Scoped by port (LISTEN-only) + cwd + MODE. Spares the prod stack and other repos.

---

## Building the quest

You need a `feature` quest whose implementation work is small but **touches several real files**, so blightwarden gets a
diff with genuine substance. Aim for something the codebase can actually build in 2–4 codeweaver items — a few small
contracts/transformers/guards is ideal. Do NOT ask for anything that needs a browser flow you care about; siegemaster
runs before blightwarden and will hand-walk it.

Two routes:

**Route A (preferred, exercises the real path):** run `/dumpster-create` and drive ChaosWhisperer through the spec
lifecycle to `approved`. Slower, but it produces a well-formed quest and proves the intake path still works after the
role changes.

**Route B (faster):** hand-write `quest.json` under
`<repo>/.dungeonmaster/guilds/<guildId>/quests/<questId>/` and set `status: "approved"`.

If you take Route B, the gate content requirements are enforced (`questGateContentRequirementsStatics`
via `has-quest-gate-content-guard`) — `approved` requires:

- non-empty `flows` (with observables embedded in flow nodes), AND
- for `feature` quests, an `operations` ledger containing **at least one `role: 'codeweaver'` item**.

Do **not** hand-author the verify tail. `questBuildRelayGraphBroker` appends it at Start.

Do **not** set `baseRef` by hand on a new quest — Start stamps it from HEAD. (Only an old, pre-existing quest would need
it stamped manually.)

---

## Running it

`npm run prod` is **root-only**. Never `npm run prod --workspace=...`, never `cd packages/x && npm run
prod`. The root script kills stale instances, resolves ports from `.dungeonmaster.json`, sets
`DUNGEONMASTER_HOME` to `<repo>/.dungeonmaster/` and `DUNGEONMASTER_PORT`, sets `VERBOSE=1`, and spawns server + web
together.

```bash
npm run prod
```

Then either:

- **MCP dispatch mode:** run `/dumpster-launch` in your Claude session (the long-lived dispatch loop), or
- **Node dispatch mode:** hit the play button on the `/queue` page.

Check `orchestrationMode` in `.dungeonmaster.json` if the UI behaves unexpectedly.

---

## The 5-minute check-in loop

Check in **every 5 minutes**. Do not sleep-poll in a tight loop; set a real interval and look at both surfaces each
time.

**The browser UI is the source of truth for pass/fail** — backend `passed: true` is necessary, not sufficient. But read
`quest.json` too, because the ledger tells you things the UI does not.

```bash
python3 -c "
import json,glob
p=glob.glob('.dungeonmaster/guilds/*/quests/*/quest.json')[-1]
q=json.load(open(p))
print('status', q['status'], '| baseRef', q.get('baseRef'))
print('--- operations ---')
for o in q['operations']:
    print(f\"  {o['status']:<12} {o['role']:<16} {o['text'][:70]}\")
print('--- blightLedger:', len(q['planningNotes'].get('blightLedger',[])), 'entries ---')
from collections import Counter
print(Counter(e['disposition'] for e in q['planningNotes'].get('blightLedger',[])))
"
```

(Native `grep`/`find` are hook-blocked in this repo. Use `python3` for all searching.)

---

## What to watch for at blightwarden — this is the point of the run

### The failure signature you are hunting

**`pt 2:` / `pt 3:` operation items appearing on the ledger for blightwarden.**

Under the old fixpoint rule this was *guaranteed* — any code change forced `partial`. Under the operator rule it should
happen **only when real scope remains and is named**. A blightwarden that fixes things and then signals `done` is the
correct new behaviour.

- **1 blightwarden item, signals `done`** → the conversion works. This is success.
- **`pt 2` appears** → read *why*. Legitimate if the session genuinely ran out of budget with units still
  undispositioned and said so. **Not** legitimate if it signalled `partial` merely because it changed code — that means
  the old rule survived somewhere in the prompt.
- **`pt 3` then quest `blocked`** → the budget was spent. That is the old failure reproduced. Capture everything.

### Specific things that can go wrong, and how they will look

| Symptom                                                                      | What it means                                                                                                                                                               | Where to look                                                    |
|------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| Blightwarden reports it received a file path instead of a checklist          | The tool result overflowed `mcpToolResultStatics.maxOutputTokens` (25,000). Render measured 31,343 chars at 170 files, but a bigger diff could still trip the 1596-unit cap | Its transcript; the `get-blight-checklist` tool result           |
| `signal-back refused: … N still carry none` repeatedly, agent can't clear it | The agent can't reconstruct `itemId` = `<implPath>:<concern>`. The header states the grammar explicitly — check it read it                                                  | The throw message names the outstanding units                    |
| `blightLedger` stays empty while minions run                                 | Minions aren't writing dispositions mid-run, or `modify-quest` is rejecting `blightLedger` at `in_progress`                                                                 | `quest.json` `planningNotes.blightLedger`; the allowlist         |
| Phantom ward failures blamed on "stale dist" / "pre-existing"                | Parallel minions editing the same file. Groups are supposed to be **disjoint by file**                                                                                      | The parent's dispatch briefs — are the groups actually disjoint? |
| Blightwarden runs `git diff master...HEAD` by hand                           | It ignored the checklist tool and re-derived scope. This is the exact bug being fixed                                                                                       | Its transcript, early tool calls                                 |
| `baseRef` is null after Start                                                | The stamp didn't fire; blightwarden won't be gated at all and `done` sails through                                                                                          | `quest.json` top-level `baseRef`                                 |

### Also worth confirming

- **`get-blight-checklist` returns real units** and the REMAINING count decreases across the run.
- **The checklist's `[x]` column** is populated — that's the resume property that makes a second pass cheap rather than
  a cold restart.
- **After blightwarden completes, the next dispatched item is `ward (full)`** — not another blightwarden.
- **`lawbringer` never appears anywhere.** If it does, something wasn't deleted.

---

## Capture this regardless of outcome

- The final `quest.json` (operations ledger + `blightLedger` + `baseRef`).
- Blightwarden's session transcript, and its minions' sub-agent transcripts. They live at
  `~/.claude/projects/-home-brutus-home-projects-codex-of-consentient-craft/<sessionId>.jsonl` and
  `.../<sessionId>/subagents/agent-*.jsonl`.
- Every `pt N` item that appeared, and the signal that produced it.
- Wall-clock and token spend for the blightwarden stage, so it can be compared against the three lawbringer passes (~
  5.2M subagent tokens, 23 ward runs, 10 builds, for 989 insertions).

---

## Aborting safely

The quest queue is repo-local at `<repo>/.dungeonmaster/`. Nothing touches `~/.dungeonmaster` or another repo. To stop:

```bash
npm run dev:kill
```

A blocked quest is resumable — `OrchestrationResumeResponder` accepts `blocked`, rearms work items whose operation item
is still unfinished, and restores `in_progress`.

---

## Known-open items (not bugs to chase)

- `blightwarden` is `sonnet` in `role-to-model-statics` while the other two operators (`flowrider`,
  `siegemaster`) are `opus`. Deliberate — a cost decision left to the user.
- The legacy root `tests/` harness is not run by ward at all (no npm script invokes root
  `jest.config.js`) and imports a `v1/` directory that doesn't exist. Pre-existing, untouched.
- The commit message of `82d2bd77` claims it includes the flowrider groundwork; that actually landed separately as
  `f391eea1`. Harmless, uncorrected.

---

## The one-sentence version

Run a real feature quest end to end on a branch off `flow-ui` with the MCP permission regenerated, check every 5
minutes, and confirm blightwarden reviews the diff once and signals `done` — rather than spawning `pt 2`, `pt 3`, and
blocking the quest the way its predecessor did three times in a row.
