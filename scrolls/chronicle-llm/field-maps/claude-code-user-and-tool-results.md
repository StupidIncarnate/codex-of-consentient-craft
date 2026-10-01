# Claude Code field map: `user` records and `toolUseResult`

Scope: every top-level `type: "user"` record in `~/.claude/projects/**` (main sessions and `subagents/` files), its
`message.content`, the `tool_result` blocks, and `toolUseResult` per tool. Targets are the tables in `schema.md`.

Evidence:
- `tmp/schema-claude-census.json`, bucket `user` and the `toolUseResult@<tool>` paths. Counts marked `n=` come from it
  (3,696 files, 256,383 `user` records, harness versions 2.1.251 to 2.1.287).
- A rescan of the same tree on 2026-10-01 for everything the census cannot say: per-tool result shapes, error text
  classes, interrupt context, soft failures. Counts marked `(rescan)` come from it; they run a little higher than the
  census because live sessions grew in between. Scripts: `tmp/fm-claude-user-scan*.py`, output `tmp/fm-claude-user-scan*.json`.
- Tool names seen with a result, from the census `tools` key: Bash, Read, Edit, Write, Agent, SendMessage,
  SubagentHandback, TaskStop, TaskOutput, Workflow, ListAgents, ToolSearch, Skill, AskUserQuestion, ExitPlanMode,
  EnterPlanMode, EnterWorktree, ExitWorktree, CronCreate/CronDelete/CronList, ScheduleWakeup, WebFetch, WebSearch,
  Artifact, Grep (2, error string only), and the `mcp__*` families.
- NOT in this corpus at all: `MultiEdit`, `Glob`, `TodoWrite`, `NotebookEdit`. Four names are model
  hallucinations that returned an error string (`bash`, `python3`, `get-architecture`, and `discover` with no `mcp__` prefix).
- `planContent` is not a field on any `user` record in this corpus. Plan text arrives as `toolUseResult.plan` on an
  `ExitPlanMode` result (see section 5).

## 1. `user` — the envelope

One JSON line per user-role message. Claude Code writes it for a typed prompt, for every tool result (one record per
`tool_result` block, even for parallel calls), and for harness-injected text (task notifications, hook feedback,
interrupt markers, skill bodies, compaction summaries).

n=256,383; versions 2.1.251 to 2.1.287; feeds `events`, `content_blocks`, `messages`, `turns`, `tool_results`,
`tool_calls`, `interventions`, `errors`, `compactions`, `attachments`, `artifacts`, `background_tasks`, `runs`.

A `user` record has NO `message.id`. Key its `messages` row as `claude-code:<uuid>`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `type` | Always `user`. | `user` | `raw_records.record_type` = `user` | n=256,383 |
| `uuid` | The record's own id. | `b23816a0-dde2-4a89-bd82-b90b028f43b2` | `events.event_id` = `<run_id>:<uuid>`; `messages.message_id` = `claude-code:<uuid>` | Not unique across files: a resumed session re-writes earlier records, and 260 repeat inside one file (rescan). Census saw 19,268 repeated uuids corpus-wide. Insert-or-ignore on `event_id`, and set `events.copied_from_event_id` when the uuid was first seen in another source. |
| `parentUuid` | Previous record in the conversation chain. | `b23816a0-dde2-4a89-bd82-b90b028f43b2`, `null` | `events.parent_event_id` | null on the first record of a run (and of a subagent file). For a tool result it equals the uuid of the assistant record that holds the `tool_use`. |
| `timestamp` | When Claude Code wrote the record, ISO-8601 UTC. | `2026-09-06T19:22:21.128Z` | `events.ts`; `raw_records.ts`; `tool_calls.completed_at` (tool result) | `tool_calls.latency_ms` = this minus the call record's `timestamp`. |
| `sessionId` | The session the file belongs to. In a `subagents/` file it is the PARENT session's id (3,144 of 3,283 first records; the other 139 differ). | `c48ce942-ba37-4baf-88a7-ae45fde52c12` | `runs.native_id` (main file); `runs.parent_run_id` (subagent file) | Do not use it as the sub-agent's identity, use `agentId`. |
| `session_id` | Snake-case twin of `sessionId`. Holds the id of the session that ORIGINALLY wrote the record. | `9d6cc00d-21ee-47d4-b179-8b40463cf7a1` | `events.copied_from_event_id` (the run is `claude-code:<session_id>`) when it differs from `sessionId` | n=27,091; 7,478 differ from `sessionId` (rescan), all in main files. A resume or continue copied the record into the new file. |
| `agentId` | Sub-agent id on every record of a `subagents/agent-<id>.jsonl` file. | `abccc31e1c3ec0bcf` | `runs.native_id` (kind `subagent`) | n=220,889, exactly the records with `isSidechain: true`. Equals the file name. Equals `toolUseResult.agentId` on the spawning `Agent` result. |
| `isSidechain` | True inside a subagent file. | `true`, `false` | `runs.kind` (`subagent` when true) | n=220,889 true, 35,494 false. |
| `cwd` | Working directory at write time. Changes when a worktree is entered. | `/home/brutus-home/projects/amalga-victorious` | `runs.cwd` (first value); `runs.repo_path` (resolve to git root) | Per-record, keep only the first on `runs`. |
| `gitBranch` | Branch at write time. | `refactor`, `master` | `runs.git_branch` (first value) | |
| `version` | Claude Code version. | `2.1.263`, `2.1.286`, `2.1.287` | `raw_records.harness_version`; `runs.harness_version_first/last` | Present on every record. |
| `entrypoint` | How the process was launched. | `cli` (224,718), `sdk-cli` (31,665) | `runs.entrypoint`; `runs.is_interactive` = (`entrypoint == 'cli'`) | `sdk-cli` is a `claude -p` child, which is how the dungeonmaster dispatcher spawns work. |
| `userType` | Always `external`. | `external` | raw only | No variation; nothing to filter on. |
| `message.role` | Always `user`. | `user` | `messages.role` | |
| `message.content` | String (a prompt) or array of blocks. | see section 2 | `events`, `content_blocks` | n=10,139 string, 246,478 array (rescan). |
| `promptId` | Id of the prompt that opened the turn this record belongs to. | `939ceaeb-9b7c-4bd6-adbc-3f5eace946d5` | `turns.prompt_id`; `turns.turn_id` = `<run_id>:<promptId>`; `events.turn_id` | n=255,651 (99.7%). Missing on 634 tool results and about 100 other records (rescan). In a subagent file it does NOT equal the nearest typed prompt for 47% of tool results (rescan), so group by `promptId`, never by proximity. |
| `isMeta` | Harness-injected text, not typed by the user. Only ever `true` when present. | `true` | `events.is_meta` = 1 | n=2,165. Which injections: section 4. |
| `isCompactSummary` | This record is the summary written after a compaction. | `true` | `events.kind` = `compaction`; `compactions.summary_blob_hash` (hash of the text) | n=8; v2.1.263 to 2.1.286; always with `isVisibleInTranscriptOnly`. `parentUuid` is null. `compactions.pre_tokens` and `trigger` come from `system/compact_boundary`, not here. |
| `isVisibleInTranscriptOnly` | Shown in the transcript view, not sent to the model. | `true` | `events.is_meta` = 1 | n=8, same eight records as `isCompactSummary`. |
| `permissionMode` | Permission mode in force when the prompt was sent. Only on prompt records, never on tool results. | `bypassPermissions` (4,253), `acceptEdits` (661), `auto` (121), `plan` (64), `default` (3) | `runs.permission_mode` (first value); `interventions` kind `mode-change` when it differs from the previous prompt's | n=5,102. Always paired with `promptSource`. The separate `permission-mode` record type (other map) is the primary mode-change signal. |
| `promptSource` | Who produced the prompt. | `typed` (1,993), `system` (2,358), `sdk` (723), `queued` (28) | `turns.origin` (table in section 4) | n=5,102. `queued` = a message the user typed while the agent was busy, delivered later. |
| `origin` | Object classifying the sender, beyond `promptSource`. | see rows below | `turns.origin`; `interventions` | n=5,138. |
| `origin.kind` | Sender class. | `task-notification` (2,518), `human` (2,024), `coordinator` (214), `peer` (122), `unclassified` (260) | `turns.origin`; `interventions.kind` | `unclassified` carries prompts from the dungeonmaster orchestrator (`First read /tmp/claude-1001/…`). |
| `origin.from` | Agent id of the sending peer or sub-agent. | `a0a593484eea67d67` | `interventions.preview` prefix; PROPOSED `interventions.source_agent_id` | n=122; v2.1.258 to 2.1.286. |
| `origin.senderTaskId` | Same value as `origin.from`. | `a0a593484eea67d67` | raw only (duplicate of `origin.from`) | n=122. |
| `origin.name` | Sender's agent name. | `general-purpose`, `fork`, `Explore` | raw only | n=96. |
| `origin.body` | The message body the peer sent. | `[Subagent hand-back] The text below is the final report of …` | `events.text_preview` | n=122. Same text as `message.content`. |
| `origin.handback` | True when the message is a sub-agent's final report. | `true` | `background_tasks.status` evidence | n=34; v2.1.285 to 2.1.286. |
| `origin.producer` | Subsystem that generated the prompt. | `session-task` | raw only | n=485; v2.1.284 to 2.1.287. |
| `turnOrigin` | Turn kind. | `human` (1,217), `task_notification` (1,323), `scheduled` (308), `sdk` (63), `peer` (40) | `turns.origin` | n=2,951; v2.1.278 to 2.1.287. Absent before 2.1.278, so fall back to `origin.kind` and `promptSource`. |
| `turnPosition.promptIndex` | Ordinal of the human prompt in the session. | `0`, `1`, `9` | raw only; optional PROPOSED `turns.prompt_index` | n=1,048; v2.1.284 to 2.1.287. |
| `turnPosition.turnIndex` | Ordinal of the turn in the session. | `1`, `21` | raw only; optional PROPOSED `turns.turn_index` | Same records. |
| `turnCompanion` | Record accompanies the previous prompt (image hints). | `true` | `events.is_meta` = 1 | n=100; always an `[Image: …]` line. |
| `scheduledFireId` | One firing of a scheduled task (Cron). | `037bb57e-db42-4f0e-81ef-f52d3b89014d` | `turns.origin` = `scheduled` | n=308; v2.1.278 to 2.1.286. |
| `scheduledTaskId` | The scheduled task; equals the `id` a `CronCreate` result returned. | `3a1292bd`, `ab1f9a04` | PROPOSED `turns.scheduled_task_id` | n=308. Joins to `toolUseResult.id` on `CronCreate`. |
| `sessionKind` | Background session marker. | `bg` | PROPOSED `runs.session_kind` | n=3,813; v2.1.267 to 2.1.278. Present on both main and subagent records. |
| `queueOrigin.kind` | What queued the message. | `task-notification` | raw only | n=14; v2.1.273 only. |
| `queueOrigin.source` | Queue source. | `goal-checkin` | raw only | n=14; v2.1.273 only. A goal check-in prompt. |
| `queuePriority` | Queue priority. | `later` | raw only | n=326; v2.1.270 to 2.1.286. |
| `queueSkipAttachments` | Skip attachment injection for this queued prompt. | `true` | raw only | n=2,748. |
| `queueTranscriptOnly` | Queued entry shown in transcript only. | `true` | raw only | n=1; v2.1.286. |
| `slug` | Random plan-file slug for the session. | `temporal-honking-cascade`, `floating-yawning-storm` | raw only | n=26,631; v2.1.261 to 2.1.286. Joins to `ExitPlanMode.filePath` (`~/.claude/plans/<slug>.md`). |
| `sourceToolAssistantUUID` | `uuid` of the assistant record holding the `tool_use` this result answers. | `91419a27-c087-4b0f-beed-9839982dce11` | `tool_calls.call_event_id` = `<run_id>:<value>` | n=245,708. It matches the assistant record in 245,926 of 245,931 resolvable cases (rescan). Absent on the 103 `text+tool_result` fork records. |
| `sourceToolUseID` | The `Skill` call whose expansion this text is. | `toolu_01BhisHarGYzM9x4PL4yNePu` | `tool_calls.tool_call_id` link (`events.tool_call_id`) | n=17, v2.1.263 to 2.1.285. Sits on the `Base directory for this skill:` record. |
| `toolDenialKind` | Why a tool call was refused. | `permission-rule` (7,604), `user-rejected` (158), `interrupted` (1), `automode-blocked` (1, rescan) | `tool_calls.denial_kind`; `tool_calls.status` (see section 6) | n=7,763; always with `is_error: true`. `permission-rule` ALSO covers a hook refusing the call (`PreToolUse:… hook error`), so it is not "a rule the user wrote". |
| `toolEndsTurn` | The tool result ends the agent's turn. | `true` | raw only | n=45, v2.1.285 to 2.1.286; every one is a `SubagentHandback` result. |
| `interruptedMessageId` | `message.id` of the assistant message that was cut off. | `msg_011CfMZyRMTEL3hn9DC5PMhD` | `interventions` kind `interrupt`, linked to `messages.message_id` = `claude-code:<value>` | n=173. Only on interrupt marker records. 122 of 174 point at a message that exists in the file; 52 point at one that was never flushed (rescan). |
| `imagePasteIds` | Numbers of the images pasted into this prompt. | `[1]`, `[3]`, `[12]` | raw only (the images themselves become `artifacts`) | n=63; v2.1.263 to 2.1.287. Each id matches an `[Image #N]` tag in the text block. |
| `userFeedback` | Free text the user typed when answering a prompt-dialog (clarify, plan feedback). | `have a sub agent analyze this plan for ambiguities…` | `interventions` kind `steer`, `preview` | n=9; v2.1.261 to 2.1.283. On the `ExitPlanMode` or `AskUserQuestion` result that carried it. |
| `mcpMeta._meta.*` | Extra metadata from an MCP server on its result. | `frontLoadedTabGroupId`, `authoredByOthers: false`, `sharedOutsideOrg: false` | `tool_results.details_json.mcpMeta` | n=13 (Chrome tab group, Claude Docs). |
| `classifierMetaLines` | Git status line fed to the permission classifier. | `{"meta":{"gitStatus":{"staged":0,…}}}` | raw only | n=1. |
| `serverClassifierContext.*` | Auto-mode classifier's snapshot (git state, cwd, remotes, request id). | `request: c2612212-…`, `live_cwd: /home/…`, `platform: linux` | raw only | n=1,858; v2.1.285 to 2.1.287. Design 3.5 already lists it as archive-only. |
| `toolUseResult` | The tool's structured result. Shape depends on the tool and on success; see sections 5 and 6. | object, array, string | `tool_results` | Present on 219,488 records; absent on 26,443 tool results (rescan), all of them inside `subagents/` files (v2.1.257 to 2.1.270 and 2.1.285). |

## 2. `user` — `message.content` forms

| Form | Count (rescan) | What it is | Maps to |
|---|---|---|---|
| string | 10,139 | A prompt or an injected message (section 4). | one `events` row (`user-message` or `meta`); `text_preview`; `blob_hash` when over 4 KB |
| array with one `tool_result` block | 245,849 | A tool result. | one `events` row (`tool-result`); one `content_blocks` row; `tool_results` |
| array with one `text` block | 369 | Interrupt marker, skill body, `[Image: source: …]` hint. | `events` row; `is_meta` per section 4 |
| array `text` + `tool_result` | 185 | A result plus a text sibling: `<fork-boilerplate>` on `Agent` results (103), `Tool loaded.` on `ToolSearch` results (82). | two `content_blocks` rows on one event |
| array `image` + `text` | 63 | A prompt with pasted image(s) and `[Image #N]`. | `content_blocks` (`image`, `text`); image to `artifacts` origin `image` |

### Block types inside `message.content[]`

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `message.content[text].type` / `.text` | A text block. | `[Request interrupted by user]`, `Tool loaded.` | `content_blocks.block_type` = `text`, `text_preview`, `text_chars` | n=628. |
| `message.content[image].type` | A pasted image in a prompt. | `image` | `content_blocks.block_type` = `image` | n=63; v2.1.263 to 2.1.287. |
| `message.content[image].source.type` | Encoding of the bytes. | `base64` | raw only | n=63. |
| `message.content[image].source.media_type` | MIME type. | `image/png` | `content_blocks.mime`; `artifacts.mime` | n=63. |
| `message.content[image].source.data` | The bytes, base64. | `iVBORw0KGgoAAAANSUhEUgAABCoAAALRCAYAAACd0EIq…` | `content_blocks.blob_hash`; `artifacts` (origin `image`, hash of the DECODED bytes) | Never inline. Design 3.5: broken out as artifacts, not stored in the row. |
| `message.content[tool_result].type` | The result block. | `tool_result` | `content_blocks.block_type` = `tool_result` | n=245,811. |
| `message.content[tool_result].tool_use_id` | Pairs the result with a call. | `toolu_01BhisHarGYzM9x4PL4yNePu` | `tool_calls.native_call_id`; `tool_calls.tool_call_id` = `<run_id>:<value>`; `content_blocks.tool_call_id` | Five results in the corpus point at a `tool_use` that is not in the same file (a fork's inherited history). `tool_calls.tool_name` is NOT NULL, so park such a result in `normalizer_state` until the call arrives (open question 5). |
| `message.content[tool_result].is_error` | Failure flag. Absent on most success records (treat absent as false); Bash writes an explicit `false`. | `true` (14,703), `false` (73,185), absent | `tool_results.is_error`; `tool_calls.status` | n=87,888 present. Not reliable alone: an over-size MCP result is a failure-looking string with `is_error` absent (section 6). |
| `message.content[tool_result].content` | The model-visible result: a string, or an array of blocks. | `Launching skill: modeling` | `tool_results.text_preview`, `text_chars`, `blob_hash` | n=245,811 (string and array). For Bash the string is `stdout` followed by `stderr` (63,744 identical to `stdout`, 180 equal to the concatenation, rescan). |
| `message.content[tool_result].content[text].text` | Text block inside a result. | `Async agent launched successfully. (This tool result is int…` | `tool_results.text_preview` | n=40,437. MCP and Agent results use this form. |
| `message.content[tool_result].content[image].source.{type,media_type,data}` | Screenshot or image Read. | `image/jpeg` (1,313), `image/png` (684) | `content_blocks` (nested image), `artifacts` origin `image` | n=1,997; v2.1.258 to 2.1.287. Sources: Chrome `computer` and `browser_batch`, and `Read` of an image. Nested blocks need a parent index; see PROPOSED `content_blocks.parent_idx`. |
| `message.content[tool_result].content[tool_reference].tool_name` | A deferred tool made loadable by `ToolSearch`. | `mcp__claude-in-chrome__tabs_context_mcp` | `content_blocks.block_type` = `other`; `tool_results.details_json.loaded` | n=3,716 (12,577 blocks, rescan). |

## 3. The pairing and `tool_calls` fields a result fills

Pairing key: `message.content[tool_result].tool_use_id` equals the `id` of the assistant `tool_use` block. Redundant
confirmation: `sourceToolAssistantUUID` and `parentUuid` both equal the uuid of that assistant record.

| tool_calls column | Source |
|---|---|
| `completed_at` | result record `timestamp` |
| `latency_ms` | result `timestamp` minus the call record's `timestamp`. The harness reports its own duration for only a few tools (below), so this is derived for the rest. |
| `status`, `denial_kind`, `cause`, `sub_cause` | section 6 |
| `spawned_run_id` | `toolUseResult.agentId` on an `Agent` result (`claude-code:<agentId>`); Workflow results carry `taskId`/`runId` instead |
| `background_task_id` | `toolUseResult.backgroundTaskId` (Bash) or `toolUseResult.agentId` when `status == 'async_launched'` (Agent) |

A call with no result at end of file: 11 across the corpus (rescan), 8 inside subagent files. Status `orphaned` once
its file has gone quiet; `pending` or `running` while it is live.

## 4. `user` — telling the injected records apart

The text of an `isMeta`-less record can still be harness output. A normalizer must classify by content and by the
fields in section 1, in this order. Counts are string-content records unless noted (rescan).

| Recognise by | Count | `events.kind` / `subtype` | `is_meta` | `turns.origin` | Other effect |
|---|---|---|---|---|---|
| `message.content` array, text starts `[Request interrupted by user]` | 169 | `meta` / `interrupt` | 0 | does not open a turn | `interventions` kind `interrupt` |
| text starts `[Request interrupted by user for tool use]` | 112 | `meta` / `interrupt-tool` | 0 | does not open a turn | `interventions` kind `interrupt`; follows a `user-rejected` result |
| string starts `<task-notification>` (`origin.kind` `task-notification`) | 2,381 | `meta` / `task-notification` | 0 | `task-notification` | closes a `background_tasks` row (section 7) |
| string starts `[SYSTEM NOTIFICATION - NOT USER INPUT]` | 133 | `meta` / `system-notification` | 1 | `system` | text for a background-task event |
| `isMeta` + `Stop hook feedback:` | 1,168 | `meta` / `stop-hook-feedback` | 1 | `system` | the Stop hook blocked the end of a turn; the hook execution itself is a `system/stop_hook_summary` record in the other map |
| `isMeta` + `The coordinator sent a message while you were working:` (`origin.kind` `coordinator`) | 214 | `user-message` / `coordinator` | 1 | `queued` | `interventions` kind `steer` |
| `isMeta` + `Another Claude session sent a message` (`origin.kind` `peer`) | 122 | `user-message` / `peer` | 1 | `queued` | `interventions` kind `steer`, preview from `origin.body`; PROPOSED source `peer` |
| `isMeta` + `The user sent a new message while you were working:` | 3 | `user-message` / `queued-human` | 1 | `queued` | `interventions` kind `steer` |
| `isMeta`, `turnOrigin` `scheduled`, text like `Cache keep-warm ping …` | 309 | `user-message` / `scheduled` | 1 | `scheduled` | |
| `promptSource` `typed`, `origin.kind` `human` | 1,936 | `user-message` | 0 | `user` | opens a turn |
| `promptSource` `sdk`, no `origin` (`Reply with the single word: ack`) | 335 | `user-message` | 0 | PROPOSED `sdk` | a `claude -p` child's first prompt |
| `promptSource` `queued` | 28 | `user-message` / `queued-human` | 0 | `queued` | |
| text starts `[Workflow harness — computed task]` | 137 | `user-message` / `workflow-task` | 0 | PROPOSED `workflow` | first record of a workflow agent |
| `isMeta` + `Base directory for this skill:` (carries `sourceToolUseID`) | 37 | `meta` / `skill-body` | 1 | none | links to the `Skill` call |
| text starts `<local-command-caveat>` / `<command-name>` / `<local-command-stdout>` | 61 / 67 / 32 | `meta` / `local-command` | 1 / 0 / 0 | none | a `/clear` or `/model` the user ran; `<command-name>/clear</command-name>` is the command |
| `isMeta` + `[Image: …]` text (also `turnCompanion`) | 100 | `meta` / `image-hint` | 1 | none | |
| `isCompactSummary` | 8 | `compaction` | 1 | none | `compactions` |
| `<fork-boilerplate>` text block next to an `Agent` result | 103 | `meta` / `fork-boilerplate` | 1 | none | marks the fork's first record |
| `<system-reminder>` + `Your final report is delivered through SubagentHandback` | 38 | `meta` / `handback-reminder` | 1 | none | |

`events.origin` is `transcript` for all of these.

## 5. `toolUseResult` per tool

Three shapes:
- Object: structured success result (most native tools).
- Array: the MCP content blocks, mirrored from `message.content[tool_result].content` (`mcp__*` tools). Versions
  2.1.258 to 2.1.262 stored a string or nothing here.
- String: the error form (section 6), or a few success strings.

`tool_results.shape`: `object` for an object, `mcp-blocks` for an array, `error-string` for a failure string,
`image` for an image Read, `text` when `toolUseResult` is absent and only `content` exists.

Duplicated bytes are never copied into `details_json`: Bash `stdout`/`stderr` and Read `file.content` repeat
`message.content[tool_result].content`; Edit `oldString`/`newString`/`originalFile` repeat the call's input; Read
`file.base64` repeats the image block. They stay in the archive.

### Bash

n=78,513 results; 67,510 objects, 11,003 strings or absent (rescan). Versions 2.1.251 to 2.1.287.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `toolUseResult.stdout` | Captured standard output. | `# The bean system — primitive, placement, …` | `tool_results.text_preview`, `blob_hash` (from `content`, which holds stdout then stderr) | Contains `\r\x1b[K` progress frames for ward; strip before the preview. |
| `toolUseResult.stderr` | Captured standard error. | `''` | `tool_results.details_json.stderrChars` | Empty in 63,744 of 63,924 (rescan). |
| `toolUseResult.interrupted` | Harness says the user interrupted the command. | `false` | `tool_results.interrupted` | n=67,510, and `true` in none of them. Interrupts show up as marker records (section 8), not here. |
| `toolUseResult.isImage` | stdout is image data. | `false` | raw only | Always false in this corpus. |
| `toolUseResult.noOutputExpected` | The command normally prints nothing. | `false` (67,224), `true` (286) | `tool_results.details_json.noOutputExpected` | |
| `toolUseResult.returnCodeInterpretation` | Harness reading of a non-zero exit that is not an error. | `No matches found` (277), `Files differ` (41), `Some directories were inaccessible` (2) | `tool_results.details_json.returnCodeInterpretation`; `exit_code` stays NULL | n=320; v2.1.252 to 2.1.286. `is_error` is false. |
| `toolUseResult.timedOutAfterMs` | The command passed its time limit and was moved to the background, NOT killed. | `120000` (407), `600000` (102), `300000` (3) | `tool_calls.status` = `running`; `tool_calls.cause` = `timeout-backgrounded`; `background_tasks` | n=539. Not a failure. |
| `toolUseResult.backgroundTaskId` | Id of the background task now running the command. | `bjyistn0u`, `b0n9ct2ld` | `tool_calls.background_task_id`; `background_tasks.task_id` = `<run_id>:<id>` | n=819; every one `is_error: false`. Arises three ways, see the next three rows and the call's own `run_in_background`. |
| `toolUseResult.backgroundedByUser` | The user pressed the background key. | `true` | `background_tasks.origin` = `user` (PROPOSED) | n=19; v2.1.263 to 2.1.285. |
| `toolUseResult.backgroundedToDeliverMessage` | Moved to the background so a queued message could reach the model. | `true` | `background_tasks.origin` = `message-delivery` (PROPOSED) | n=8; v2.1.283 to 2.1.286. |
| `toolUseResult.backgroundCwdHint` | Reminder that `cd` in a backgrounded command does not move the session. | `Session cwd remains /home/brutus-home/projects/amalga-victorious; …` | raw only | n=215. |
| `toolUseResult.dangerouslyDisableSandbox` | The call ran outside the sandbox. | `true` | `tool_results.details_json.sandboxDisabled` | n=13; v2.1.259 to 2.1.284. Also in the call input. |
| `toolUseResult.persistedOutputPath` | Output over the size cap was written to a spill file. | `/home/brutus-home/.claude/projects/-home-…/tool-results/bc7awuovd.txt` | `tool_results.persisted_path` | n=693. The `content` text is then a `<persisted-output>` stub with a 2 KB preview; read the spill file for the full text (`artifacts` origin `spill-file`). |
| `toolUseResult.persistedOutputSize` | Size of the spill file in bytes. | `33586`, `44200` | `details_json.persistedBytes` (not `text_chars`, which counts the stub) | n=693. |
| `toolUseResult.staleReadFileStateHint` | The command changed a file the agent had read. | `[This command modified 1 file you've previously read: eslint.config.js. Call Read before editing.]` | `tool_results.details_json.staleHint` | n=13; v2.1.259 to 2.1.286. |
| `toolUseResult.gitOperation.commit.{sha,kind,branch}` | The harness recognised a commit. | `a564f64`, `committed` (167) or `amended` (2), `worktree-agent-af14eb9559012bfc6` | `tool_results.details_json.git` | n=169; v2.1.252 to 2.1.286. Candidate for a future `git_events` table; useful for linking runs to commits. |
| `toolUseResult.gitOperation.branch.{action,ref}` | A merge or rebase. | `merged` (15), `rebased` (1); `master` | `details_json.git` | n=16; v2.1.261 to 2.1.283. |
| `toolUseResult.gitOperation.push.branch` | A push. | `master` | `details_json.git` | n=4; v2.1.258 to 2.1.266. |
| `toolUseResult.bashEditDiff.files[].filePath` | A file the command changed on disk (diffed by the harness). | `/home/…/references/anims/rigtest-repro-min.anim.json` | `file_touches.path` | n=5,906 files in 8,154 results; v2.1.280 to 2.1.287. See file touches, section 7. |
| `toolUseResult.bashEditDiff.files[].created` / `.deleted` | The file appeared or vanished. | `true` (639 / 397) | `file_touches.op` = `create` / `delete` | |
| `toolUseResult.bashEditDiff.files[].hunks[].{oldStart,oldLines,newStart,newLines,lines[]}` | Unified-diff hunks. | `oldStart: 1`, `newLines: 30`, `+{` | `file_touches.lines_added`, `lines_removed` (count `+` and `-` lines) | Hunk text stays in the archive. |
| `toolUseResult.bashEditDiff.changedFiles[]` | Paths of changed files (no hunks). | `/home/…/bear-front.png` | `file_touches.path`, `op` = `edit` | n=5,977. |
| `toolUseResult.bashEditDiff.moreFiles` | Files changed beyond the cap, not listed. | `0`, `10` | `tool_results.details_json.bashDiffMore` | n=8,154. |
| `toolUseResult.bashEditDiff.shared` | The checkout has other writers, so the diff is not attributable to this command. | `true` (5,493) | PROPOSED `file_touches.attribution` = `shared` | v2.1.280 to 2.1.286. |
| `toolUseResult.bashEditDiff.unavailable` | The harness could not compute a diff. | `true` (1,700) | `details_json.bashDiffUnavailable` | |
| `toolUseResult.bashEditDiff.skipped` | The diff was skipped. | `true` | raw only | n=1. |

Exit code. A successful Bash call carries NO exit code anywhere. A failing call (`is_error: true`) starts its
`content` text with `Exit code N` (5,216, rescan), and `toolUseResult` is the string `Error: Exit code N…`.
So `tool_results.exit_code` = N when that prefix exists, 0 when `is_error` is false and there is no
`returnCodeInterpretation`, and NULL otherwise. One record (rescan) has the prefix with `is_error: false`; trust the
prefix.

### Read

n=62,763; v2.1.251 to 2.1.287. Absent on 7,928 results inside subagent files (rescan).

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `toolUseResult.type` | Result kind. | `text` (61,058), `image` (368), `file_unchanged` (760) | `tool_results.shape` (`image` for image) | `file_unchanged` means the file had not changed since the previous Read; `content` is `Wasted call — file unchanged since your last Read…`. |
| `toolUseResult.file.filePath` | The file read. | `/home/…/ModelBuilder/CLAUDE.md` | `file_touches.path`, `op` = `read` | n=61,818. Missing on image reads: take the path from the call input `file_path`. When `toolUseResult` is absent, also use the input. |
| `toolUseResult.file.content` | The text, with line numbers. | `# Model-builder — rules & gotchas (READ before touching …` | `tool_results.text_preview`, `blob_hash` (from `content`) | Duplicate of `message.content[tool_result].content`. |
| `toolUseResult.file.startLine` | First line returned. | `1` | `tool_results.details_json.read.startLine` | n=61,058. |
| `toolUseResult.file.numLines` | Lines returned. | `443` | `details_json.read.numLines` | |
| `toolUseResult.file.totalLines` | Lines in the file. | `443`, `1254` | `details_json.read.totalLines` | |
| `toolUseResult.file.truncatedByTokenCap` | Read stopped at the token cap. | `true` | `details_json.read.truncated` | n=582; v2.1.258 to 2.1.287. |
| `toolUseResult.file.type` | MIME type of an image read. | `image/png` (353), `image/jpeg` (15) | `artifacts.mime` | v2.1.261 to 2.1.286. |
| `toolUseResult.file.base64` | Image bytes. | `iVBORw0KGgoAAAANSUhEUgAABXgAAAOEC…` | `artifacts` (origin `image`) | Same bytes as the nested image block; store once by hash. |
| `toolUseResult.file.dimensions.{displayHeight,displayWidth,originalHeight,originalWidth}` | Image size, as shown and as stored. | `900`, `1400` | `details_json.read.dims` | n=368. |
| `toolUseResult.file.originalSize` | Image size in bytes. | `147439` | `details_json.read.imageBytes` | |
| `toolUseResult.source` | Where the Read came from. | `seeded` | raw only | n=15; v2.1.263 to 2.1.285. A harness-seeded read, not a model call. |

### Edit

n=30,702; 29,667 objects. v2.1.251 to 2.1.287. Absent on 2,644 results inside subagent files (rescan); fall back to
the call input's `file_path` plus the success text `The file … has been updated successfully.`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `toolUseResult.filePath` | The file edited. | `/home/…/src/types/ModelPlaneProps.ts` | `file_touches.path`, `op` = `edit` | |
| `toolUseResult.structuredPatch[].{oldStart,oldLines,newStart,newLines}` | Diff hunk header. | `59`, `6`, `59`, `9` | `tool_results.details_json.edit.hunks` (count) | 1 hunk in 26,788, 2 in 2,123, 3 in 483 (rescan). |
| `toolUseResult.structuredPatch[].lines[]` | Hunk lines, prefixed ` `, `+`, `-`. | `   // rotates). Model-builder opts in; …`, `+  leftDragPan?: boolean;` | `file_touches.lines_added` = count of `+`; `lines_removed` = count of `-` | The text stays in the archive. |
| `toolUseResult.oldString` / `newString` | The replaced and replacement text. | `  leftDragPan?: boolean;` | raw only (repeats the call input) | |
| `toolUseResult.originalFile` | The whole file before the edit. | `import type { CSSProperties, ReactNode } …`, `null` | raw only | `null` whenever `contentNotInModelContext` is true. Large. |
| `toolUseResult.replaceAll` | The edit replaced every match. | `false` (29,248), `true` (419) | `details_json.edit.replaceAll` | |
| `toolUseResult.userModified` | The user edited the proposed change before accepting. | `false` | `details_json.edit.userModified` | `false` in all 29,667; never `true` in this corpus. |
| `toolUseResult.contentNotInModelContext` | The file text was not in the model's context when it edited. | `true` | `details_json.edit.blind` | n=4,977; v2.1.281 to 2.1.287. |
| `toolUseResult.staleRecovered` | The harness re-read after a stale-file conflict and retried. | `true` | `details_json.edit.staleRecovered` | n=214. |

### Write

n=10,634; 9,256 objects. v2.1.251 to 2.1.287. Absent on 1,134 results inside subagent files (rescan); fall back to the
input `file_path` plus `File created successfully at: …`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `toolUseResult.type` | New file or overwrite. | `create` (7,178), `update` (2,078) | `file_touches.op` = `create` / `write` | |
| `toolUseResult.filePath` | The file written. | `/home/…/src/types/BuildMode.ts` | `file_touches.path` | |
| `toolUseResult.content` | The text written. | `// Which placement example the `/build` route runs.` | raw only (repeats the call input) | |
| `toolUseResult.originalFile` | The file before an overwrite. | `null` on `create` | raw only | |
| `toolUseResult.structuredPatch[]` | Hunks; empty for a create, 1 to 4 hunks for an update. | `[]` | `file_touches.lines_added`/`lines_removed`; for a create, `lines_added` = line count of `content`, `lines_removed` = 0 | 2,074 results carry hunks. |
| `toolUseResult.userModified` | As Edit. | `false` | `details_json.write.userModified` | |

### Agent

n=3,289 (3,072 `async_launched`, 34 `completed`, 183 error strings). v2.1.251 to 2.1.287. 265 results in subagent files
have no `toolUseResult` and carry `Fork started — processing in background`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `toolUseResult.status` | Launch or completion. | `async_launched`, `completed` | `tool_calls.status` = `ok`; `details_json.agent.status` | `async_launched`: the call returned at once; the sub-agent's life is in `runs`. `completed`: a foreground sub-agent finished. |
| `toolUseResult.agentId` | The sub-agent's id. | `af07e2174083c36a4` | `tool_calls.spawned_run_id` = `claude-code:<agentId>`; `tool_calls.background_task_id`; `runs.spawned_by_tool_call_id` (set on the child) | n=3,104. Third join key for the parent link, after `.meta.json` `toolUseId`, before stdout `task_started`. |
| `toolUseResult.description` | The call's short description. | `Map the add-part and texture flows` | `runs.description` | n=3,070. |
| `toolUseResult.prompt` | The prompt sent to the child. | `Search breadth: very thorough. This repo (…` | raw only (repeats the call input and the child's first record) | |
| `toolUseResult.resolvedModel` | Model the child will use. | `claude-sonnet-5` (2,108), `claude-opus-5[1m]` (321), `claude-opus-5-5` (150) | `runs.model_first` (hint until the child's own records arrive) | n=3,104. |
| `toolUseResult.isAsync` | Launched in the background. | `true` | `details_json.agent.async` | n=3,070. |
| `toolUseResult.canReadOutputFile` | The parent may Read the output file. | `true` | raw only | n=3,070. |
| `toolUseResult.outputFile` | Where the child's output is written. | `/tmp/claude-1001/-home-…/tasks/af07….output` | PROPOSED `background_tasks.output_path` | n=3,070. |
| `toolUseResult.agentType` | Sub-agent type, on `completed` only. | `general-purpose` (31), `Explore` (3) | `runs.agent_type` | n=34; v2.1.265 to 2.1.286. |
| `toolUseResult.content[text].{type,text}` | Report text, on `completed` only. | `This agent's report was delivered to you as a message …` | `tool_results.text_preview` | n=34. |
| `toolUseResult.totalDurationMs` | Child's wall time. | `81202`, `22713` | `tool_results.reported_duration_ms` | n=34. One of the few harness-reported durations. |
| `toolUseResult.totalTokens` | Child's total tokens. | `73649` | `details_json.agent.totalTokens` | Do NOT add to `usage`: the child's own transcript has the per-message usage, and counting both double-counts. |
| `toolUseResult.totalToolUseCount` | Tool calls the child made. | `10`, `92` | `details_json.agent.toolCalls` | |
| `toolUseResult.toolStats.{bashCount,readCount,searchCount,editFileCount,otherToolCount,linesAdded,linesRemoved}` | Child's tool mix. | `bashCount: 3`, `linesAdded: 712` | `details_json.agent.toolStats` | The child's `file_touches` are the source of truth; this is a cross-check. |
| `toolUseResult.usage.*` | Child's summed usage (`input_tokens`, `output_tokens`, `cache_read_input_tokens`, `cache_creation_input_tokens`, `cache_creation.ephemeral_{5m,1h}_input_tokens`, `service_tier`, `speed`, `inference_geo`, `iterations`, `output_tokens_details.thinking_tokens`, `server_tool_use.web_{fetch,search}_requests`, `fallback_credit`) | `service_tier: standard`, `inference_geo: not_available` | raw only | n=34. Rolled-up total, never a `usage` row (see `totalTokens`). `fallback_credit` null, n=5. |
| `toolUseResult.handback` | The child delivered its report through `SubagentHandback`. | `send` | `details_json.agent.handback` | n=5; v2.1.286 only. |
| `toolUseResult.handbackReport.text` | That report. | `ANSWER: The bounty board is a hand-kept set of markdown files …` | `tool_results.text_preview`, `blob_hash` | n=5. |
| `toolUseResult.harnessNoteCount` / `harnessTailCount` / `harnessSectionHash` | Counters over the harness section of the child's prompt. | `0`, `1`, `0e5847fe30e6ec39` | raw only | n=34; v2.1.265 to 2.1.286. |

### SendMessage, SubagentHandback, TaskStop, TaskOutput, ListAgents

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `SendMessage.success` | Message accepted. | `true` | `tool_calls.status` | n=519; v2.1.258 to 2.1.286. |
| `SendMessage.message` | Delivery text. | `Message queued for delivery to a94cbfa6011cff0aa at its next tool round.`, `Resuming agent a8ea774` | `tool_results.text_preview` | |
| `SendMessage.resumedAgentId` | The message restarted a finished sub-agent. | `a8ea774649ba2c25c` | `interventions` kind `steer` on the CHILD run; `tool_calls.spawned_run_id` | n=248. The same agent id notifies again later. |
| `SendMessage.pin.{id,name,ref}` | Short handle of the target. | `a94cbfa6011cff0aa`, `23cd3c` | raw only | n=509. |
| `SubagentHandback.success` / `.message` | The child's report was delivered. | `true`, `Report delivered to your caller.` | `tool_calls.status` = `ok` | n=32; v2.1.285. The matching result record carries `toolEndsTurn`. |
| `TaskStop.task_id` / `.task_type` / `.command` / `.message` | A background task was stopped. | `bbcrvnmeg`, `local_bash` (35) or `local_agent` (17), `Successfully stopped task: …` | `background_tasks.status` = `stopped`, `ended_at` | n=52; v2.1.259 to 2.1.287. Error strings (`No task found with ID`, `is not running`, `is owned by`) are a further 87 failures. |
| `TaskOutput.task.{task_id,task_type,status,exitCode,output,description}` and `.retrieval_status` | Read a background task's result. | `b8req52w5`, `local_bash`, `failed`, `1` | `background_tasks.status`, `result_preview` | n=1; v2.1.259. `exitCode` here is the only place a background exit code appears outside the `<task-notification>` summary. |
| `ListAgents.listing` | Text list of live sessions and agents. | `This session is gateway-pivot-b2 [44844f] — …` | raw only | n=51; v2.1.261 to 2.1.283. |

### Workflow

n=10; v2.1.285 only.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `toolUseResult.status` | Launch status. | `async_launched` | `tool_calls.status` = `ok` | |
| `toolUseResult.taskId` / `.taskType` | Background task of the workflow. | `wrvx9g77s`, `local_workflow` | `tool_calls.background_task_id`; `background_tasks.task_id`, `kind` = `workflow` (PROPOSED value) | |
| `toolUseResult.runId` | Workflow run id. | `wf_5dcc93de-cdd` | `runs.spawned_by_tool_call_id` link for `workflow-agent` runs; `details_json.workflow.runId` | |
| `toolUseResult.workflowName` / `.summary` | What it does. | `bigbang-root-round`, `Fix the root files whose type errors cascade …` | `runs.description` | |
| `toolUseResult.scriptPath` / `.transcriptDir` | Where the script and the agents' transcripts live. | `/home/…/.claude/projects/-home-…/…` | PROPOSED `sources` discovery hint (`workflow-journal` kind) | Tells the ingester where the workflow agents' files are. |

### ToolSearch, Skill, and the small session tools

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `ToolSearch.query` | What was searched. | `select:mcp__claude-in-chrome__tabs_context_mcp,…` | `details_json.toolSearch.query` | n=2,691. |
| `ToolSearch.matches[]` | Tool names loaded. | `SendMessage`, `mcp__…__navigate` | `details_json.toolSearch.matches` | |
| `ToolSearch.total_deferred_tools` | Deferred tools available. | `81`, `105`, `107` | `details_json.toolSearch.total` | |
| `ToolSearch.failed_mcp_servers[].{name,error,errorCode}` | MCP servers that failed to connect at search time. | `dungeonmaster`, `Connection closed`, `CONNECTION_CLOSED` | `errors` kind `harness-error`, `message`, `tool_call_id` | n=6; v2.1.283 to 2.1.286. An MCP outage visible nowhere else in `user` records. |
| `Skill.commandName` / `.success` | Skill launched. | `modeling`, `true` | `tool_calls.status` = `ok`; `details_json.skill` | n=17. `allowedTools[]` (n=2, v2.1.275) goes to `details_json`. The skill body arrives as a separate `isMeta` record carrying `sourceToolUseID`. |
| `AskUserQuestion.questions[].{question,header,multiSelect,options[].{label,description,preview}}` | The questions put to the user. | `Mirroring`, `One sidebar switch (Recommended)` | raw only | n=81 objects. |
| `AskUserQuestion.answers.{key}` | The user's choices, keyed by the question text. | `The user answered: "…"="One sidebar switch"` | `interventions` kind `steer`, `preview` (first answer) | The key is free text, so the census shows one path per question; read it as a map. |
| `AskUserQuestion.annotations.{key}.{notes,preview}` | Notes the user added to an answer. | `routing needs same verbiage…` | raw only | n=81. |
| `ExitPlanMode.plan` / `.filePath` / `.isAgent` | The plan the model proposed, where it was saved, and whether an agent sent it. | `# Record where each session ran, instead of recalculating it`, `/home/…/.claude/plans/fine-go-plan-this-immutable-gem.md`, `false` | `attachments` (name `plan`, `blob_hash`); `details_json.plan.filePath` | n=6 objects; v2.1.261 to 2.1.286. 12 more `ExitPlanMode` results are the string `User rejected tool use` (rejected plan). The "planContent" the brief asks about does not exist; this is the plan text. |
| `EnterPlanMode.message` | Confirmation. | `Entered plan mode. You should now focus on exploring the codebase…` | `interventions` kind `mode-change` (preview `plan`) | n=6. |
| `EnterWorktree.{message,worktreePath,worktreeBranch}` | Moved the session into a worktree. | `/home/…/worktrees/seeding-fidelity-experiment` | `details_json.worktree` | n=9; v2.1.261 to 2.1.273. |
| `ExitWorktree.{action,message,originalCwd,worktreePath,worktreeBranch,discardedCommits,discardedFiles}` | Left a worktree. | `keep` (3), `remove` (1), `0` | `details_json.worktree` | n=5; v2.1.261 to 2.1.270. |
| `CronCreate.{id,humanSchedule,recurring,durable}` | A scheduled task was created. | `de74aa7f`, `13,43 * * * *`, `true`, `false` | `details_json.cron`; `id` joins `user.scheduledTaskId` | n=31; v2.1.278 to 2.1.286. |
| `CronDelete.id` / `CronList.jobs[].{id,cron,humanSchedule,prompt,recurring,durable}` | Delete or list scheduled tasks. | `de74aa7f` | `details_json.cron` | n=24 / 5. |
| `ScheduleWakeup.{scheduledFor,clampedDelaySeconds,wasClamped,stopped,cancelledWakeups}` | A self-wakeup. | `1790304960000`, `2700`, `false` | `details_json.wakeup` | n=19; v2.1.267 to 2.1.286. `scheduledFor` is epoch ms. |
| `Grep` | Native Grep (2 calls), a string only. | `Error: …` | `tool_results.shape` = `error-string` | Native Grep is hook-blocked in this repo; both are errors. |

### WebFetch, WebSearch, Artifact

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `WebFetch.url` | URL fetched. | `https://docs.claude.com/en/docs/claude-code/settings` | `details_json.web.url` | n=24; v2.1.263 to 2.1.287. |
| `WebFetch.code` / `.codeText` | HTTP status. | `200` (23), `301`; `OK`, `Moved Permanently` | `details_json.web.code`; a 301 returns `REDIRECT DETECTED` text, status stays `ok` | |
| `WebFetch.bytes` | Size fetched. | `742`, `59209`, `269142` | `details_json.web.bytes` | |
| `WebFetch.durationMs` | Fetch time. | `216`, `5037`, `12258` | `tool_results.reported_duration_ms` | Harness-reported. |
| `WebFetch.result` | The extracted answer. | `REDIRECT DETECTED: The URL redirects to a location …` | `tool_results.text_preview`, `blob_hash` | |
| `WebSearch.query` | Search query. | `node:sqlite stable Stability 2 Node.js 26 release notes` | `details_json.web.query` | n=11. |
| `WebSearch.durationSeconds` | Search time, a float. | `7.252653657999821` | `tool_results.reported_duration_ms` = round(value × 1000) | Harness-reported. |
| `WebSearch.searchCount` | Searches run. | `1` | `usage.web_search_requests` is on the assistant side; keep here as `details_json.web.searches` | |
| `WebSearch.results[]` | Answer text, or `{tool_use_id, content[].{title,url}}`. | `Node.js`, `https://en.wikipedia.org/wiki/Node.js` | `details_json.web.urls` (urls only) | The `tool_use_id` is `srvtoolu_…`, a server-side id. |
| `Artifact.url` / `.artifact_id` / `.version` / `.title` / `.icon` / `.audience` / `.contract` / `.path` / `.seq` / `.updated` / `.liveSubscription` | A published page. | `https://claude.ai/code/artifact/7c775682-…`, `Pose Step Grid`, `owner`, `flag_off` | `details_json.artifact` | n=1 publish; v2.1.280. |
| `Artifact.read.{url,bytes,code,codeText,durationMs,result}`, `Artifact.artifactRead.{slug,ver}` | A read of a published page. | `200`, `OK`, `759`, `23679` | `reported_duration_ms` = `read.durationMs`; the rest `details_json.artifact` | n=6; v2.1.280 to 2.1.282. |

### MCP tools (`mcp__<server>__<tool>`)

`toolUseResult` is an array of `{type, text}` blocks (and `{type: 'image', source}` for screenshots), the same blocks as
`message.content[tool_result].content`. `tool_calls.tool_server` is the middle segment. `shape` = `mcp-blocks`.
`tool_results.text_preview` is the first text block. Nothing structured sits outside the text, so the MCP server's own
JSON (often `{"success": …, "data": …}`) stays inside the text and is raw only.

| Family and tool | n (census) | Notes |
|---|---|---|
| `mcp__dungeonmaster__discover` | 19,008 | Largest family. 248 results are an oversize string (`Error: result (N characters …) exceeds maximum allowed tokens. Output has been saved to <path>`) with `is_error` absent: a SPILL, not a failure. Map the path to `tool_results.persisted_path`. |
| `mcp__dungeonmaster__get-folder-detail`, `get-architecture`, `get-testing-patterns`, `get-project-inventory`, `get-project-map`, `get-syntax-rules` (to v2.1.263), `get-qa-checklist` (to v2.1.278) | 1,859 / 1,307 / 1,399 / 672 / 463 / 118 / 50 | Documentation fetches. `get-project-map` error `Unknown package(s): …` arrives as `is_error: true`. |
| `mcp__dungeonmaster__get-quest`, `get-quest-summary`, `get-quest-status`, `get-quest-work`, `get-quest-planning-notes`, `list-quests`, `list-guilds`, `get-server-config`, `get-agent-prompt` | 72 / 5 / 3 / 36 / 1 / 3 / 7 / 2 / 69 | Quest reads. A JSON `{"success": false, "error": …}` text with `is_error: true` is a harness-level failure. |
| `mcp__dungeonmaster__modify-quest`, `quest-work`, `signal-back`, `create-worktree`, `ask-user-question`, `run-ward` (v2.1.266 to 2.1.268, string only) | 274 / 58 / 52 / 137 / 21 / 6 | Quest writes. `Structural validation failed:\n- [FAIL] …` and Zod issue lists come back as `is_error: true`. |
| `mcp__claude-in-chrome__*` (`computer` 1,384, `javascript_tool` 1,116, `browser_batch` 880, `navigate` 220, `tabs_context_mcp` 79, `find` 44, `read_console_messages` 44, `tabs_close_mcp` 37, `tabs_create_mcp` 27, `read_network_requests` 5, `read_page` 3, `form_input` 3, `get_page_text` 2, `resize_window` 1) | | Screenshots arrive as nested `image` blocks (857 in `computer`, 843 in `browser_batch`). `mcpMeta._meta.frontLoadedTabGroupId` sits on the record. CDP timeouts and `Couldn't determine which page this action targets` are failures, the latter often tagged `permission-rule`. |
| `mcp__claude_ai_Claude_Docs__{batch,create,guide,read,update}` | 1 / 1 / 2 / 2 / 5 | `mcpMeta._meta.authoredByOthers`, `sharedOutsideOrg`. |
| `mcp__webstorm__*` (`apply_patch`, `create_new_file`, `get_file_problems`, `lint_files`, `list_directory_tree`), `mcp__echo__echo` | 1 / 1 / 1 / 1 / 2, 4 | `apply_patch` and `create_new_file` change files, but their result text is free-form, so they produce NO `file_touches` rows; read the call input if that is wanted. |
| unresolved tool `?` | 5 | The result's `tool_use` is not in the file (fork inheritance). Four are `Agent` async results, one a `ToolSearch` result. |

## 6. Failure: the error-string form, denial, and `tool_calls.status`

### The string form

When a call fails, `toolUseResult` is a STRING, not an object (n=14,730 failures, rescan). Forms:

| `toolUseResult` text | `message.content[tool_result].content` | Count (rescan) |
|---|---|---|
| `Error: ` + the content, wrapper stripped | the same text, often wrapped in `<tool_use_error>…</tool_use_error>` | 14,720 of 14,730 |
| `User rejected tool use` (no feedback) | `The user doesn't want to proceed with this tool use. …STOP what you are doing and wait for the user…` | 114 |
| `Error: The user doesn't want to proceed … the user said:\n<feedback>` (feedback typed) | same text | 9 |
| `InputValidationError: [ {…} ]` (no `Error: ` prefix) | `<tool_use_error>InputValidationError: <Tool> failed due to the following issue…</tool_use_error>` | 87 |

Rule: failure text = `tool_result.content`; the string form adds nothing, so raw only. Store it in
`tool_results.text_preview` and set `shape` = `error-string`. Strip `<tool_use_error>` before classifying.

A non-failure also arrives as a string: an oversize MCP result (`Error: result (…) exceeds maximum allowed tokens. Output
has been saved to <path>`), n=256, `is_error` absent. Detect by `^Error: result \(\d` plus `Output has been saved to`, set
`persisted_path`, and keep `status` = `ok`.

### `tool_calls.status`, `denial_kind`, `cause`

`design.md` points at a shared `cause` vocabulary but does not list it. The values below are the Claude side of it.

| Observation | `status` | `denial_kind` | `cause` | `sub_cause` | Count (rescan) |
|---|---|---|---|---|---|
| `toolDenialKind = permission-rule`, text `PreToolUse:<Tool> hook error: [<hook>]:` | `denied` | `permission-rule` | `hook-block` | the hook name, e.g. `dungeonmaster-pre-bash`, `dungeonmaster-pre-edit-lint`, `dungeonmaster-pre-folder-detail` | 4,563 |
| `permission-rule`, text `Permission to use <Tool> with command … has been denied.` | `denied` | `permission-rule` | `permission-denied` | `command` | 2,498 |
| `permission-rule`, text `Permission to use <Tool> has been denied. IMPORTANT: …` | `denied` | `permission-rule` | `permission-denied` | `tool` | 535 |
| `permission-rule` on a Chrome tool, `Couldn't determine which page this action targets` | `denied` | `permission-rule` | `browser-target-unknown` | | 16 |
| `toolDenialKind = user-rejected` | `denied` | `user-rejected` | `user-rejected` | `feedback` when `the user said:` is present, else `plain`; `needs-approval` for `This Bash command contains multiple operations` | 158 |
| `toolDenialKind = automode-blocked` | `denied` | `automode-blocked` | `auto-mode-blocked` | | 1 |
| `toolDenialKind = interrupted` | `interrupted` | `interrupted` | `user-interrupt` | | 1 |
| `is_error`, `Exit code N` | `error` | NULL | `nonzero-exit` | `exit-N` | 5,216 |
| `is_error`, `File does not exist` / `ENOENT` | `error` | NULL | `file-not-found` | | 430 |
| `is_error`, `String to replace not found` / `Found N matches` / `No changes to make` | `error` | NULL | `edit-mismatch` | | 366 |
| `is_error`, `File has been modified since read` / `File content has changed since it was last read` | `error` | NULL | `stale-read` | | 133 |
| `is_error`, `Fork is not available` / `Subagent nesting limit` / `Concurrent subagent limit` | `error` | NULL | `agent-limit` | `fork` / `depth` / `concurrency` | 181 |
| `is_error`, `File content (N tokens) exceeds maximum` | `error` | NULL | `read-too-large` | | 82 |
| `is_error`, `InputValidationError` | `error` | NULL | `tool-input-invalid` | | 38 (plus 87 string-form, same text) |
| `is_error`, `EISDIR` | `error` | NULL | `is-directory` | | 45 |
| `is_error`, `No task found` / `is not running` / `is owned by` | `error` | NULL | `task-not-found` | | 80 |
| `is_error`, `This session is isolated in the worktree` | `error` | NULL | `worktree-isolation` | | 27 |
| `is_error`, `MCP error -N` / `Unknown package(s)` / `Structural validation failed` / JSON `success: false` | `error` | NULL | `mcp-error` | | 155 |
| `is_error`, `Failed to execute JavaScript` / `CDP sendCommand` / `Error capturing screenshot` | `error` | NULL | `browser-error` | | 121 |
| any other `is_error: true` | `error` | NULL | `other` | | about 110 |
| `backgroundTaskId` present | `running` until the notification | NULL | `timeout-backgrounded` when `timedOutAfterMs`, else NULL | | 819 |
| `status = async_launched` on Agent/Workflow | `ok` (the call itself returned) | NULL | NULL | | 3,082 |
| `tool_use` with no result, file idle | `orphaned` | NULL | NULL | | 11 |
| a result with no `is_error` and none of the above | `ok` | NULL | NULL | | the rest |

`tool_results.is_error` = 1 for every `error`, `denied` and `interrupted` row. Rollup `tool_failures` counts a
denied call as a failure but `failures_by_cause_json` must keep `hook-block` apart from `user-rejected`, since the first
is dungeonmaster's own guard rails.

## 7. Where each result field feeds the derived tables

### `tool_results.details_json`

Small, tool-specific, never filtered on. The shapes above, per tool: Bash (`returnCodeInterpretation`,
`timedOutAfterMs`, `stderrChars`, `persistedBytes`, `git`, `staleHint`, `sandboxDisabled`, `noOutputExpected`,
`bashDiff*`), Read (`read.{startLine,numLines,totalLines,truncated,dims}`), Edit (`edit.{hunks,replaceAll,
staleRecovered,userModified,blind}`), Write (`write.{hunks,userModified}`), Agent (`agent.{status,totalTokens,
toolCalls,toolStats,handback}`), WebFetch/WebSearch (`web.*`), ToolSearch (`toolSearch.*`), Workflow, cron, worktree,
`mcpMeta`. Cap it at 4 KB; when over, keep the scalars and drop arrays.

### `file_touches`

| Source | Path | `op` | Lines |
|---|---|---|---|
| Read result, `toolUseResult.file.filePath` (else the input `file_path`) | as given | `read` | NULL |
| Edit, `toolUseResult.filePath` | as given | `edit` | count `+` and `-` lines in `structuredPatch[].lines[]` |
| Write `type: create` | as given | `create` | `lines_added` = lines of `content` |
| Write `type: update` | as given | `write` | count `+` and `-` in `structuredPatch` |
| Bash `bashEditDiff.files[]` | `filePath` | `create` if `created`, `delete` if `deleted`, else `edit` | count `+`/`-` in `hunks[].lines[]` |
| Bash `bashEditDiff.changedFiles[]` with no hunks | as given | `edit` | NULL |
| `toolUseResult` absent (subagent files) | the call input's `file_path` | by tool: Read `read`, Edit `edit`, Write `create` when the text says `File created successfully` else `write` | NULL |

Only successful results count: skip `is_error` rows. The primary key is `(tool_call_id, path, op)`, so repeated
hunks on one path collapse into one row with summed lines. The Bash rows are the only trace of files that a shell
command, a formatter or a test run changed; keep them, flagged (PROPOSED `source`, `attribution`).

### `background_tasks`

| Source | Fills |
|---|---|
| Bash result `toolUseResult.backgroundTaskId` | `task_id` = `<run_id>:<id>`, `tool_call_id`, `kind` = `bash`, `started_at` = result `timestamp`, `status` = `running`; the output path from the content text `Output is being written to: <path>` (PROPOSED `output_path`); `origin` from `timedOutAfterMs` / `backgroundedByUser` / `backgroundedToDeliverMessage` / the input's `run_in_background` |
| Agent result `status: async_launched` | `task_id` = `<run_id>:<agentId>`, `kind` = `subagent`; `outputFile` as the output path |
| Workflow result `taskId` | `kind` = `workflow` (PROPOSED value) |
| user record `<task-notification>` with `<task-id>`, `<tool-use-id>`, `<output-file>`, `<status>`, `<summary>`, `<result>` | `ended_at` = record `timestamp`; `status` = `completed`, `failed` (39), `killed` (11) or `stopped` (8); `result_preview` = `<result>` or `<summary>` (`… failed with exit code 1`) |
| `TaskStop` / `TaskOutput` results | `status` and `ended_at` |

A sub-agent notification can fire more than once for the same `<task-id>` (the `<note>` says it fires each time the
agent stops with no live children, and `SendMessage` can resume it). Update the row; do not insert a second one.
A `<task-notification>` with `<summary>Goal check-in…` has no task id: it is a scheduler prompt, not a task.

### `interventions`

| Source | `kind` | `preview` |
|---|---|---|
| `[Request interrupted by user]` or `… for tool use]` marker record | `interrupt` | the marker text; link `interruptedMessageId` |
| tool result with `toolDenialKind = user-rejected` | `user-rejected` | the text after `the user said:` when present, else `User rejected tool use` |
| `isMeta` record `The user sent a new message while you were working:` | `steer` | the message text |
| `origin.kind = coordinator` | `steer` | the text after the colon (source `coordinator`, PROPOSED) |
| `origin.kind = peer` | `steer` | `origin.body` (source `peer`, `origin.from` = sender, PROPOSED) |
| `userFeedback`, or `AskUserQuestion.answers` | `steer` | the feedback or first answer |
| `SendMessage.resumedAgentId` | `steer` on the child run | the summary |
| `permissionMode` differs from the previous prompt's, or `EnterPlanMode` | `mode-change` | `<old> -> <new>` |
| `promptSource = queued` | `dequeue` evidence only; the `enqueue`/`dequeue` rows come from `queue-operation` records | |

Do NOT write `permission-denied` interventions for `permission-rule` denials: 4,563 of 7,604 are dungeonmaster hooks
and the rest are standing rules, none of them a person acting mid-run.

### `errors`

`user` records produce almost none, because a failed tool result is a `tool_results` row. What does go here:
- `ToolSearch.failed_mcp_servers[]` becomes kind `harness-error`, message `mcp server <name>: <error>`, with `tool_call_id`.
- A `tool_result` with no matching `tool_use` after the file is idle (5 in the corpus) becomes `harness-error`.
- `[Request interrupted …]` markers: write the `interventions` row only. `errors.kind` lists `interrupt` too, but a
  second row per marker double-counts the same event (open question).

## 8. The `[Request interrupted by user]` markers

Both forms are a `user` record whose `message.content` is an ARRAY holding one `text` block (never a string), with
`isMeta` absent. They look like a human prompt but are not.

| Marker text | Count (rescan) | `interruptedMessageId` | Preceded by |
|---|---|---|---|
| `[Request interrupted by user]` | 169 | present on 121 | the user pressed Escape while the model was generating or a tool was running. Preceding records are assistant blocks, or a user prompt, or a tool result. |
| `[Request interrupted by user for tool use]` | 112 | present on 53 | a permission prompt the user rejected: in all 112 cases a tool result with `toolDenialKind = user-rejected` sits within the three preceding records, up to three in a row for parallel calls |

`interruptedMessageId` is the `message.id` of the assistant message being written when the user stopped it. It
resolves to an assistant record in the same file for 122 of 174 markers; for 52 it names a message that was cut off
before any block reached the file, so the id points at nothing. Keep the id on the `interventions` row regardless.

`toolUseResult.interrupted` on Bash is `false` in all 67,510 object results, so a user interrupt of a RUNNING Bash call is
never recorded there. Such a call appears as a `user-rejected` denial plus the marker, or as a call with no result.

## 9. Soft failure: exit 0, failing check

A call can report success (`is_error: false`, no `Exit code` prefix) while its output says a check failed. In this
repo the case that matters is ward.

Hard form (the harness knows): `npm run ward …` exits non-zero, so `is_error: true`, `content` starts `Exit code 1`,
and `toolUseResult` is the string `Error: Exit code 1…`. Direct ward calls (rescan): 3,752 hard failures against 5,018
clean runs.

Soft form (790 direct ward calls, rescan): the command still exits 0, usually because ward's output went through a pipe
(`… 2>&1 | tail -40`, 681), or `; echo exit=$?` (56), or into a log file (49). A further 1,030 records are
`python3`/`cat`/`TaskOutput` reading a saved ward log. In all of them `toolUseResult.stdout` and `content` carry ward's
summary block.

Detection, applied to `content` after stripping `\r\x1b[K` progress frames, on any `Bash` result with `is_error`
false or absent:

| Test | Meaning | Value |
|---|---|---|
| `^(lint\|typecheck\|unit\|integration\|e2e):\s+FAIL\b` (multiline) | a ward check failed | `softFailure.kind` = `ward`; `checks` = the matching names |
| `^run:\s+(\d{13}-[0-9a-f]{4})` or `ward -- detail (\d{13}-[0-9a-f]{4})` | the ward run id | `softFailure.runId`; join to the `dungeonmaster` command run |
| `DISCOVERY MISMATCH` or `SLOW TESTS FAILED THIS RUN` | ward itself failed the run though every per-check line reads PASS | `softFailure.kind` = `ward`; these exit non-zero, so they are usually hard failures (162, rescan) |
| `^Tests:\s+\d+ failed` and `^Test Suites:\s+\d+ failed` | a bare jest run failed | `kind` = `jest` (1,152, rescan) |
| `error TS\d+` | a bare tsc run failed | `kind` = `tsc` |

A ward summary line looks like `unit:      FAIL  1 packages (2 files passed/1 files failed, 143 discovered)  @dungeonmaster/hooks (1)  3.5s`.

Mapping: leave `tool_calls.status` = `ok` (the harness said so) and record the finding in a new column, PROPOSED
`tool_results.soft_failure` (TEXT, NULL when none, else `ward`, `jest`, `tsc`), with the detail in `details_json`
(`softFailure.{kind, checks, runId}`). Count soft failures in the rollups under their own bucket
(`failures_by_cause_json` key `soft:ward`) rather than in `tool_failures`, so the harness-visible failure rate stays
comparable with Antigravity.

## 10. Version drift

| Change | Versions |
|---|---|
| `toolUseResult` is an array for MCP tools (earlier: string or nothing) | from 2.1.258 (2.1.263 for Chrome) |
| `toolUseResult` absent on tool results in `subagents/` files | 2.1.257 to 2.1.270, and 2.1.285 |
| `Bash.returnCodeInterpretation`, `Bash.gitOperation.commit` | 2.1.252 |
| `Bash.staleReadFileStateHint`, `Bash.dangerouslyDisableSandbox` | 2.1.259 |
| `Bash.backgroundedByUser` | 2.1.263 |
| `Bash.bashEditDiff` (`shared`, `unavailable` to 2.1.286) | 2.1.280 |
| `Edit.contentNotInModelContext` | 2.1.281 |
| `Read.file.truncatedByTokenCap` | 2.1.258 |
| `Read` image result, `Read.source` | 2.1.261, 2.1.263 |
| `Agent` completed-form fields (`usage`, `toolStats`, `agentType`) | 2.1.265 |
| `Agent.handback`, `SubagentHandback`, `toolEndsTurn`, `origin.handback` | 2.1.285 and 2.1.286 |
| `Workflow` tool | 2.1.285 only |
| `turnOrigin`, `scheduledFireId`, `scheduledTaskId` | 2.1.278 |
| `turnPosition`, `origin.producer` | 2.1.284 |
| `serverClassifierContext` | 2.1.285 |
| `sessionKind: bg` | 2.1.267 to 2.1.278, then gone |
| `queueOrigin` | 2.1.273 only |
| `slug` | 2.1.261 |
| `imagePasteIds`, `isCompactSummary`, `isVisibleInTranscriptOnly`, `turnCompanion` | 2.1.263 |
| `userFeedback` | 2.1.261 to 2.1.283 |
| `sourceToolUseID` | 2.1.263 to 2.1.285 |
| `run-ward`, `get-syntax-rules`, `get-qa-checklist` MCP tools | removed by 2.1.268, 2.1.263, 2.1.278 |

## Proposed schema changes

| Column or table | Type | Reason |
|---|---|---|
| `tool_results.soft_failure` | TEXT NULL (`ward`, `jest`, `tsc`) | Exit-0 results whose output reports a failing check (section 9). Without it they count as clean. |
| `file_touches.source` | TEXT NOT NULL DEFAULT `tool-result` (`tool-result`, `bash-diff`, `input-fallback`) | Bash `bashEditDiff` rows and the fallback from the call input are weaker evidence than an Edit result's patch. |
| `file_touches.attribution` | TEXT NULL (`exact`, `shared`) | `bashEditDiff.shared` marks diffs made while other writers share the checkout; 5,493 results. |
| `background_tasks.output_path` | TEXT | Bash `Output is being written to: <path>`, Agent `outputFile`; the only place the task output lives. |
| `background_tasks.origin` | TEXT (`explicit`, `timeout`, `user`, `message-delivery`) | Separates a deliberate `run_in_background` from a command that ran past its time limit (539) or was backgrounded by the user. |
| `background_tasks.kind` value `workflow` | new enum value | `Workflow` results carry `taskType: local_workflow`. |
| `content_blocks.parent_idx` | INTEGER NOT NULL DEFAULT -1, PK becomes `(event_id, parent_idx, idx)` | Nested `image` and `tool_reference` blocks inside a `tool_result` (1,997 images) need a parent. |
| `turns.origin` values `sdk`, `peer`, `coordinator`, `workflow` | enum values | `promptSource: sdk` (723), `origin.kind: peer` (122) and `coordinator` (214), and workflow-computed tasks (137) fit none of `user`, `queued`, `scheduled`, `task-notification`, `resume`, `system`. |
| `turns.scheduled_task_id` | TEXT NULL | `scheduledTaskId` joins a fire to its `CronCreate`; 308 fires. |
| `turns.prompt_index`, `turns.turn_index` | INTEGER NULL | `turnPosition` (v2.1.284+), optional; cheap ordinals for the UI. |
| `runs.session_kind` | TEXT NULL (`bg`) | `sessionKind` marks background sessions, 3,813 records. |
| `interventions.source`, `interventions.source_agent_id` | TEXT NULL | Tell a human from `coordinator`, `peer`, `scheduled` senders; `origin.from` is the sender's agent id. |
| `tool_calls.cause` and `sub_cause` vocabulary | documented list | Section 6 table is the Claude side; `design.md` names `cause` but lists no values. |
| `events.subtype` values from section 4 | documented list | `interrupt`, `interrupt-tool`, `task-notification`, `stop-hook-feedback`, `coordinator`, `peer`, `queued-human`, `scheduled`, `skill-body`, `local-command`, `image-hint`, `fork-boilerplate`, `workflow-task`. |

## Open questions

1. Interrupt markers: one `interventions` row only, or also an `errors` row of kind `interrupt` (the schema allows
   both)? This map writes only the intervention.
2. Should the 4,563 hook refusals (`PreToolUse:… hook error`) also create `hook_runs` rows with outcome
   `blocking-error`, linked by `tool_call_id`? Doing so makes the hook visible in the hook table; the cost is a second row
   per refusal alongside `tool_calls.cause = hook-block`.
3. `toolUseResult` is missing on about 11% of results, all in `subagents/` files, in several version ranges. Is that a Claude
   Code bug, or a mode (for example a forked or background child) that omits it? Until known, the normalizer cannot rely
   on it and falls back to the call input and the result text.
4. `Bash` exit 1 with `returnCodeInterpretation` (`No matches found`, `Files differ`): store `exit_code` as NULL (this
   map) or as 1 (inferred for those two strings)?
5. The 5 results whose `tool_use` is in another file: wait in `normalizer_state` for the owning source, or insert a
   placeholder `tool_calls` row with `tool_name = '(unresolved)'`?
6. `ExitPlanMode.plan` is the only place plan text appears in `user` records. Keep it as an `attachments` row, or only in
   the archive?
7. Native `Glob`, `MultiEdit`, `TodoWrite`, `NotebookEdit` never occur in this corpus. They are not mapped; a different user's
   history may contain them, and the census-driven drift log will flag them as `unknown-record-type` or `new-path`.
