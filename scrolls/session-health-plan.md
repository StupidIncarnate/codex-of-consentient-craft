# Session health: plan

Status: proposal, 2026-10-01. Nothing here is built yet.

This is the first feature built on the chronicle-llm data layer (`scrolls/chronicle-llm/design.md`).
It holds what the health feature shows and how it behaves. Where its data comes from, how it is stored and
how it stays live all live in the chronicle-llm docs. The first draft of this plan kept per-quest health
files next to `quest.json`, written by a recorder inside the server. Measurement showed that cannot serve
the command center or scale to large quests, so chronicle-llm replaced it.

## What we are building

1. **Failed-call overview in the quest's right panel.** Counts by cause, updating live while the quest runs.
2. **Failure drill-down.** Click a cause and see every instance with its error text.
3. **View Context.** A button on each instance opens a side drawer. The drawer shows that agent's transcript,
   scrolled to the failed call and highlighted.
4. **`get-quest-health` MCP tool.** An LLM asks for a quest's health stats in one call: failures, ward
   verdicts, resumes, cost, and later the timeline.
5. **Timeline (second phase).** A per-work-item timeline split into phases (explore, edit, verify, fix, and
   so on), with durations. It shows in the UI, and the MCP tool can return it.

## Decisions made (2026-10-01)

| Question | Decision |
|---|---|
| Where the overview lives | The right panel, ABOVE the coverage summary |
| How View Context opens | A side drawer over the right half. The quest execution stays visible on the left. |
| What the headline number counts | Every failure, split by kind. Ward reds the agent later fixed still show. |
| What gets built first | The chronicle-llm store and its Claude Code harness, then the MCP tool. Both are checked against quest 1918a5ee's counts before any UI is built. |

## What quest 1918a5ee showed

Four read-only agents measured quest `1918a5ee-8bce-4f3d-a4ab-f7ff51f45878`. Their raw output is in `tmp/q1918-*.json`, with the
scripts beside it.

| Measure | Value |
|---|---|
| Work items | 40. Of these, 28 have a session, and 12 are commands (ward, commit, riftcarver) |
| Transcripts | 31, which is 28 sessions plus 3 sub-agents, 34.0 MB in total |
| Tool results | 860, of which 98 failed with `is_error` (11.4%) |
| Sessions with at least one failure | 25 of 28 |
| Recovery time after failures, summed | about 3,640 s |
| Wall-clock span | 19.7 h, of which 8,645 s (about 12%) was busy |
| Cost | $56.93 (opus $35.88, sonnet $21.04) |

These are the failure causes, grouped by the census agent:

| Count | Cause | Kind |
|---|---|---|
| 19 | Bash denied by the `Bash(sed:*)` rule. The denial gives no reason. | Policy gap |
| 11 | Pre-bash hook blocks `grep` and `find` | Guard working |
| 15 | Ward red. In 4 of these only the slow-test limit tripped. | Expected |
| 9 | `pre-folder-detail` refused a Write | Guard working |
| 9 | `pre-edit-lint` refused a Write or Edit | Expected, self-correcting |
| 20 | `quest-work` plan payload refused by the schema | Agent and schema mismatch |
| 7 | `quest-work` refused a declared outcome, because the outcome is derived from marks | Agent mistake |
| 8 | Other: bad `get-agent-prompt` args, a Read over 256 KB, scratch python errors | Agent mistake |

The census also found **18 soft failures**. These are Bash results that exit 0 but contain `FAIL`, because
`| tail` or a python wrapper swallowed the exit code. Any failure count has to catch these as well as
`is_error`.

## Sizes we must handle

Measured across `~/.claude/projects` on 2026-10-01: 3,676 JSONL files, 5.09 GB in total.

| Measure | Size |
|---|---|
| Median single file | 1.04 MB |
| 99th percentile file | 7.22 MB |
| Largest file | 25.8 MB |
| Longest single line | 1.11 MB |
| Largest session plus its sub-agents | 465.6 MB across 217 files (`gateway-pivot` / 03103751) |
| That session parsed in full | 1.99 s in python. It has 101,256 lines, 25,532 tool calls and 1,611 failures. |

A future quest may hold several sessions that size, so a few GB per quest is plausible. Three rules follow
from that:

1. **Never re-parse every transcript when a quest loads.** chronicle-llm records everything as it is written, and
   the health feature only queries it.
2. **Never send a whole quest's transcripts to the browser for this feature.** `useQuestChatBinding` already
   holds every entry as `entriesByWorkItem`, and that will not scale. The View Context drawer fetches a window
   of entries around one call.
3. **Store only a capped preview of each error.** Lines reach 1.11 MB. The full error text loads only when
   someone opens that instance.

## What the health feature shows

### Failure causes

chronicle-llm sorts each failed tool call into a cause (`tool_calls.cause`), using shapes the census found in this quest's transcripts:

| Cause | How it is detected |
|---|---|
| `hook-refusal` | Text starts with `PreToolUse:<Tool> hook error: [dungeonmaster-pre-…]`. The hook name becomes a sub-cause. |
| `permission-denied` | Text is `Permission to use … has been denied.`, and the line has `toolDenialKind` |
| `ward-red` | A ward command with `Exit code 1`. Sub-causes are which checks failed, or `slow-tests-only`. |
| `ward-red-hidden` | A ward command that exits 0 but whose output contains `FAIL`. This is the soft failure. |
| `mcp-refused` | An MCP result with `{"success":false,…}` or a zod message. The tool name and first error path become the sub-cause. |
| `tool-error` | A tool's own error, such as Read over 256 KB |
| `command-error` | Any other non-zero Bash exit |

Causes live in one statics table, so a new shape is one new row.

### Health metrics

These metrics were ranked by how much they help an LLM or a human diagnose a quest. Phase one builds the
first group.

**Phase one**

1. **Failed calls by cause**, with recovery time and turns until the next successful call.
2. **Ward verdict mismatch.** This flags a ward exit code that disagrees with its check statuses. In this
   quest, run `a87e3c0a` exited 1 while every check passed. It spawned a repair agent that found nothing to
   fix.
3. **Refusal loops.** The count of consecutive refused calls of one tool in one session. The last planner here
   made 7 refused `quest-work` plans in a row, then was killed.
4. **Resumes and stalls.** The count of "CUT OFF mid-work" resumes, plus the longest idle gap inside a
   session. `quest.json` `retryCount` was 0 on all 40 items, yet 3 sessions were resumed, one after a 7,565 s
   gap.
5. **How a session ended.** The cases are `signalled`, `killed` and `running`. `killed` means the last line is
   a tool result with no follow-up.
6. **Cost per session and per role.** This is read from the `cost-state` line near the end of each transcript.
   Reading that one line is nearly free.

**Phase two**

7. **`complete` with unmet work.** This flags a signal-back of `complete` while the item's declared outcome is
   `unmet`. Item 29 did exactly this.
8. **Bash file writes that skip the edit hook.** Here 39 writes went through `python3`, `sed -i` and `cat >`.
9. **Zero-output spend.** This is cost with no lines changed and no accepted plan. It was $3.46 for the stuck
   planner here and $0.49 for the repair that changed nothing.
10. **Files touched outside the plan.** This compares touched paths with `planned-work/*.json`. It was 3 of 46
    here.
11. **Session start load.** This is the context size at the first model turn. Every session here started at
    about 38k tokens, about 110 KB of it from bootstrap tool results.
12. **Share of weak-evidence observations.** 12 of 83 observations here said "not probed" or "not driven".

### The UI

**Right panel.** A health section goes in the execution-phase right half, ABOVE the coverage summary that
`QuestSummaryWidget` renders (`packages/web/src/widgets/quest-chat/quest-chat-content-layer-widget.tsx:626`).
It shows:
- the total failed calls, and the failure rate
- one row per cause, with its count, and whether it is still rising
- badges for a ward verdict mismatch, a refusal loop, or a killed session.

The panel loads `GET /api/quests/:questId/health`, which queries `tool_calls`, `errors` and `rollup_quest`.
It then updates from the same cursor-based push every chronicle-llm reader uses.

**Drill-down.** Clicking a cause lists its instances, newest first, in pages of 50. Each instance shows the
work item and role, the time, the tool input summary and the error preview. An expand control fetches the full
error text.

**View Context drawer.** No side drawer exists yet. The closest surface is
`flow-node-detail-panel-layer-widget`, an absolutely positioned right-hand panel, which we copy. The drawer:
- calls `GET /api/runs/:runId/window?toolCallId=…&before=40&after=20`, which reads that window of the
  `timeline` view
- renders them with the existing `ChatEntryListWidget`, read-only
- scrolls to the failed call and highlights it. This needs a scroll-to-entry feature, which does not exist yet.
  `useAutoScrollBinding` only pins to the bottom.
- loads more entries as you scroll up or down.

### The MCP tool

The new tool is `get-quest-health({ questId, sections?, cause?, limit? })`. It goes through the server's HTTP API,
which queries chronicle-llm and never reads a transcript, so it stays fast at any quest size. Output is capped:
- by default, a summary of counters and the ranked metrics
- `sections: ['failures']`, which returns grouped causes with 2 example instances each
- `cause`, which returns that cause's instances, up to `limit`
- `sections: ['timeline']`, which phase two adds.

Following `packages/mcp/CLAUDE.md` ("Adding New MCP Tools"), adding the tool takes these steps:
1. Add the name to `mcpToolsStatics`. This drives permissions.
2. Add a layer responder, and register it in `layerResponders`.
3. Add an input contract with its stub, and a schema entry in `quest-flow.ts`.
4. Add a `StartOrchestrator.getQuestHealth`, which both the MCP tool and the server route call.

### Timeline (phase two)

The timeline agent found a quest timeline cheap to build. Every work item has start and end times. Idle gaps
and parallel runs follow from those. Simple rules over tool names and Bash command text split a session into
the phases bootstrap, explore, edit, verify, fix, plan-write, signal, report and stall. Only 10 of more than
1,000 calls fell outside those phases.

Item 21, split by those rules:

| Phase | Duration |
|---|---|
| bootstrap | 7 s |
| explore | 27 s |
| edit | 133 s |
| verify (fail) | 115 s |
| fix | 25 s |
| verify (pass) | 100 s |
| signal | 10 s |
| report | 6 s |

Phases are derived at query time from `tool_calls` and `events`, so a better phase rule needs no re-ingest. The UI
shows a lane per work item, with bars per phase and gaps marked. The MCP tool returns the same data as text
rows, such as `item 21 codeweaver/work: explore 27s, edit 133s, verify 115s FAIL, fix 25s, verify 100s`.

**Use active time, not `createdAt` to `completedAt`.** Item 2's span was 134 minutes, but it was active for
only about 297 s. The rest was a killed session waiting to be resumed.

## Bugs found during the eval

These bugs are separate from this plan. Each should become a bounty-board entry or a fix.

1. **FIXED in `f5c298cc1`. The plan validator refused paths inside the package it owns.** The last planner, session 97eb9b67, ended
   on 7 refused plans. The refusal text was `payload.files[].path '/home/…/worktrees/…/packages/web/…' is
   outside the packages this operation item owns (web)`. The likely cause is an absolute path compared against
   a relative one. This is why the quest is `paused`.
2. **`Bash(sed:*)` is denied with no reason given.** It caused 19 denials across 14 sessions, about 840 s of
   recovery. Either the denial should name the alternative, or the snippets should say not to use sed.
3. **A ward red caused only by the slow-test limit reaches the JSON as a plain red.** Ward run `a87e3c0a` has
   `exitCode 1`, yet every check is `pass`. The repair agent it spawned changed nothing.
4. **The repair item's `errorMessage` contradicts itself.** It says "maxVisits spent … entered 1 times …
   budget is 3".
5. **`attempt` and `retryCount` stay 0 through resumes, and `startedAt` is overwritten.**
6. **Agents piping ward through `tail` hide its exit code.** Either ward's output or the snippet should stop
   this.

## Open questions

1. **Where do quest-level idle gaps come from?** This quest sat idle for 72.5 minutes and 13.8 hours, and
   item 38 waited 12.4 minutes between `createdAt` and `startedAt`. None of the data says why.
