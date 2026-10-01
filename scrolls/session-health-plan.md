# Session health: plan

Status: proposal, 2026-10-01. Nothing here is built yet.

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
| What gets built first | The recorder and the MCP tool. Both are checked against quest 1918a5ee's counts before any UI is built. |

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

1. **Never re-parse every transcript when a quest loads.** Record health stats while the quest runs, and read
   that record on load.
2. **Never send a whole quest's transcripts to the browser for this feature.** `useQuestChatBinding` already
   holds every entry as `entriesByWorkItem`, and that will not scale. The View Context drawer fetches a window
   of entries around one call.
3. **Store only a capped preview of each error.** Lines reach 1.11 MB. The full error text loads only when
   someone opens that instance.

## Design

### Recording while the quest runs

**The recorder reads raw transcript lines itself. It does not hang off the chat-entry stream**, for two
reasons:
- Chat entries drop the fields it needs: byte offsets, `sourceToolAssistantUUID`, `toolDenialKind` and raw
  timestamps.
- The live tail starts at the END of each file (`startPosition: 'end'`), so it never sees lines written
  before it started.

So the recorder is an incremental indexer. For each of a quest's transcripts, including sub-agent files, it
reads from the saved byte offset to the end of the file. It parses only complete lines and saves the new
offset. One code path covers three triggers:
1. the existing JSONL watcher reporting new lines
2. server start
3. a quest opened whose health files are missing or behind.

Transcript paths come from `questCwdResolveBroker` and `claudeProjectPathEncoderTransformer`, the same pair
the replay path uses. They resolve per SESSION, because a carved quest's transcripts sit under two
directories.

Per quest, the recorder writes into `<questFolder>/health/`, next to `quest.json`:

| File | Content | Growth |
|---|---|---|
| `calls.jsonl` | One compact row per tool call (see below). Rows are only ever appended. | About 300 bytes per call, so 25,532 calls is about 7.5 MB |
| `failures.jsonl` | One row per failed call, with a 2 KB error preview and the cause | Small |
| `cursors.json` | For each transcript, the byte offset already processed | One entry per transcript |
| `summary.json` | Rolled-up counters, rewritten at most once a second | Fixed size |

The recorder needs `cursors.json` for three reasons:
- After a server restart, it carries on from the saved offset and never starts over.
- Old quests get a one-time catch-up scan that uses the same code path.
- A resumed session, one "CUT OFF mid-work", simply keeps appending.

A call row is written when its result arrives. The recorder pairs the call to its result by `tool_use_id`.
The census found this pairing held for all 860 results, and `sourceToolAssistantUUID` confirms it.

```
call row:
  toolUseId, tool, workItemId, role, step, sessionId, agentId?
  startedAt (tool_use timestamp), endedAt (tool_result timestamp)
  ok | failed, cause?          // cause only when failed
  phase                        // filled in phase two, see Timeline
  locator: { transcriptId, byteOffset, lineIndex, resultUuid }
```

`locator` is what View Context seeks to. `byteOffset` makes the seek cheap even in a 25 MB file. The
`resultUuid` field lets the server confirm it landed on the right line. If the file changed, the server falls
back to a scan.

**Parallel tool calls need care.** When an agent issues several calls in one turn, their results arrive one
at a time. A naive start-to-result duration then overstated total Edit time: 1,721 s against a real 729 s. The
recorder serialises a turn's results, so each call counts from the previous result.

### Live updates

After each batch it records, the recorder emits a new orchestration event, `quest-health-updated`. The event
carries the changed counters plus any new failure rows. It joins `PER_QUEST_EVENT_TYPES`
(`packages/server/src/responders/server/init/server-init-responder.ts:62`). The web keeps a running copy and
applies each event to it. So failures appear in the right panel as the quest runs.

### Failure causes

The recorder sorts each failure into a cause, using shapes the census found in this quest's transcripts:

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

The panel loads `GET /api/quests/:questId/health`, then applies each `quest-health-updated` event.

**Drill-down.** Clicking a cause lists its instances, newest first, in pages of 50. Each instance shows the
work item and role, the time, the tool input summary and the error preview. An expand control fetches the full
error text.

**View Context drawer.** No side drawer exists yet. The closest surface is
`flow-node-detail-panel-layer-widget`, an absolutely positioned right-hand panel, which we copy. The drawer:
- calls `GET /api/quests/:questId/transcripts/:transcriptId/window?toolUseId=…&before=40&after=20`, which seeks
  by the stored `byteOffset` and returns chat entries
- renders them with the existing `ChatEntryListWidget`, read-only
- scrolls to the failed call and highlights it. This needs a scroll-to-entry feature, which does not exist yet.
  `useAutoScrollBinding` only pins to the bottom.
- loads more entries as you scroll up or down.

### The MCP tool

The new tool is `get-quest-health({ questId, sections?, cause?, limit? })`. It reads `summary.json` and
`failures.jsonl`, never transcripts, so it stays fast at any quest size. Output is capped:
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

The recorder fills each call row's `phase` as it goes. `summary.json` gains per-work-item phase totals. The UI
shows a lane per work item, with bars per phase and gaps marked. The MCP tool returns the same data as text
rows, such as `item 21 codeweaver/work: explore 27s, edit 133s, verify 115s FAIL, fix 25s, verify 100s`.

**Use active time, not `createdAt` to `completedAt`.** Item 2's span was 134 minutes, but it was active for
only about 297 s. The rest was a killed session waiting to be resumed.

## Bugs found during the eval

These bugs are separate from this plan. Each should become a bounty-board entry or a fix.

1. **The plan validator refuses paths inside the package it owns.** The last planner, session 97eb9b67, ended
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

## Slice 1 in detail: the recorder and the MCP tool

**The server is the only process that writes health files.** The MCP tool reads them over HTTP, as
`get-quest-status` already does. Two processes indexing the same files would race.

### Contracts in `@dungeonmaster/shared`

These live in shared because the server, the web and the MCP package all read them.

| Contract | Fields |
|---|---|
| `toolFailureCauseContract` | an enum: `hook-refusal`, `permission-denied`, `ward-red`, `ward-red-hidden`, `mcp-refused`, `tool-error`, `command-error` |
| `transcriptLocatorContract` | `transcriptPath`, `sessionId`, `agentId?`, `byteOffset`, `lineIndex`, `resultUuid` |
| `toolCallRecordContract` | `toolUseId`, `tool`, `workItemId`, `role`, `step?`, `sessionId`, `agentId?`, `startedAt`, `endedAt`, `durationMs`, `ok`, `cause?`, `subCause?`, `locator` |
| `toolFailureRecordContract` | a call record plus `inputSummary` (capped at 300 chars), `errorPreview` (capped at 2,000 chars) and `errorChars` (the full length) |
| `questHealthSummaryContract` | `questId`, `updatedAt`, `totals { calls, failed }`, `byCause`, `byTool`, `byWorkItem`, `transcriptCount` |
| `questHealthCursorContract` | per transcript: `transcriptPath`, `byteOffset`, `lineIndex`, `pendingToolUses` (calls seen with no result yet) |

`pendingToolUses` has to persist. A call and its result can land on either side of one indexing pass, so
the pass that sees the result must still know the call.

### Orchestrator

| File | Job |
|---|---|
| `statics/tool-failure-cause` | The detection table, one row per cause, with the exact text patterns |
| `transformers/transcript-line-tool-events` | One raw JSONL line becomes its tool uses and tool results, with ids, timestamps and flags |
| `transformers/tool-result-cause-classify` | A paired call and result become `ok`, or a cause plus a sub-cause |
| `transformers/quest-health-summary-fold` | A summary plus new rows becomes the next summary |
| `brokers/quest-health/index` | Lists a quest's transcripts, including sub-agent files. Reads each from its cursor to the end of the file, classifies, and appends rows. Writes the cursors and the summary, and returns what changed. |
| `brokers/quest-health/get` | Reads the summary and the failures, filtered by `sections`, `cause` and `limit` |
| `state/quest-health-index` | One indexing pass per quest at a time |
| a bootstrap responder | Every 2 s, stats the transcripts of each active quest. Indexes any quest whose files grew, and emits `quest-health-updated` with what changed. |
| `StartOrchestrator.getQuestHealth` | The get broker, with a catch-up index run first |

### Server and MCP

1. Add the route `GET /api/quests/:questId/health`, taking the query parameters `sections`, `cause` and
   `limit`.
2. Add `quest-health-updated` to the event-type contract and to `PER_QUEST_EVENT_TYPES`.
3. Add `get-quest-health` to the MCP package. It calls that route.

### How we check it

- **Unit tests.** They use lines copied from quest 1918a5ee's transcripts, one per failure shape.
- **The real quest.** A full index of quest 1918a5ee must produce the following:

  | Count | Expected |
  |---|---|
  | Tool results | 860 |
  | `is_error` failures | 98 |
  | Hidden ward reds | 18 |
  | `Bash(sed:*)` denials | 19 |

  Any difference must be explained before slice 1 counts as done.

**Not in slice 1:** recovery time and turns. Both need the calls AFTER a failure, so the get broker
computes them when it reads, in slice 6.

## Order of work

| Step | Delivers |
|---|---|
| 1 | Failure-cause statics and a line classifier, unit-tested against lines copied from this quest |
| 2 | The health recorder, with its files, cursors and parallel-call serialising. It runs on the live stream and as a catch-up scan. |
| 3 | The `GET /health` route, the `quest-health-updated` event and the `get-quest-health` MCP tool (summary and failures) |
| 4 | The right-panel health section and the drill-down |
| 5 | The transcript window route, the View Context drawer and scroll-to-entry |
| 6 | The phase-one metrics beyond failures: ward mismatch, refusal loops, resumes, how a session ended, cost |
| 7 | Timeline phases, the timeline UI and the timeline MCP section |
| 8 | The phase-two metrics |

Steps 1 to 3 can be checked against quest 1918a5ee. A catch-up scan of it must reproduce the counts above: 98
failed results, 18 soft failures and 19 sed denials.

## Open questions

1. **Does `session-forensics` become the parser, or go away?** It is an unwired CLI, and its contracts drop
   `is_error` and `tool_use_id`. The recorder belongs in the orchestrator, on the live stream. One parser is
   better than two.
2. **Health files next to `quest.json`, or a separate store?** Next to the quest keeps it simple, and lets
   Claude Code read it in this repo.
3. **Where do quest-level idle gaps come from?** This quest sat idle for 72.5 minutes and 13.8 hours, and
   item 38 waited 12.4 minutes between `createdAt` and `startedAt`. None of the data says why.
