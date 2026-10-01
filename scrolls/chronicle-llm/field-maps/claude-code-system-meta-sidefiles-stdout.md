# Claude Code field map: system records, queue operations, metadata records, side files, headless stdout

Status: draft for review, 2026-10-01. Scope: everything in Claude Code's own data that is NOT an
`assistant`, `user` or `attachment` transcript record. Written against `schema.md` and `design.md` in this folder.

Evidence:

| Source | What it is |
|---|---|
| `tmp/schema-claude-census.json` | Field census of every transcript record (3,696 files, versions 2.1.251 to 2.1.287). Counts below are the census's unless a section says "rescan". |
| `~/.claude/projects/**` | Raw files, re-scanned for the facts the census cannot give (pairing, ordering, side files). The corpus is LIVE: a rescan hours later is a few records higher than the census (turn_duration 4,092 in the census, 4,102 raw). |
| `tmp/stream-explore-stdout.jsonl` | One `claude -p --output-format stream-json --verbose --include-partial-messages` capture, version 2.1.287, with its transcript for the join. |
| `tmp/bgprobe/runs/{A,B,C,D}/stream.jsonl` | Four captures with the production flags (no partial messages), version 2.1.267, each with its transcript and sub-agent transcripts. |

Scratch scripts: `tmp/fm-claude-sys-*.py`.

Conventions in the tables below: `ts` means the record's own timestamp converted to epoch ms. A path ending `[]` is an
array element. "Envelope" is the group of common fields described once in section 1.

---

## 1. `system/*` transcript records

Every `system` record is `{"type":"system","subtype":…}` plus the envelope below. They appear in MAIN transcripts only,
except `compact_boundary` (6 of 8 are inside sub-agent files). None carries a model, usage or content blocks.

### Envelope shared by every `system/*` record

Census count: every record below. All fields are present on every subtype unless the Notes column says otherwise.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `type` | Record kind, always `system` | `"system"` | `raw_records.record_type = 'system/<subtype>'` | discriminator |
| `subtype` | Which system record | `"turn_duration"`, `"compact_boundary"` | `events.subtype`; `raw_records.record_type` | |
| `uuid` | Record id | `"c4d96db0-c002-4d7e-8404-33fc04b85a16"` | key: `events.natural_key = '<session>:<uuid>'` | the only uuid-bearing family in scope |
| `parentUuid` | Previous record in the conversation chain | `"4932ca84-d49c-46aa-a2ce-499c61213119"`, `null` | `events.parent_event_ref` | `null` on `compact_boundary` (see there). On `turn_duration` it is the last assistant record of the turn. |
| `timestamp` | When written | `"2026-09-06T20:20:43.955Z"` | `events.ts` | |
| `isSidechain` | Record lives in a sub-agent file | `false`, `true` | raw only | redundant with the file path (`llm_sessions.kind`) |
| `isMeta` | Harness-injected, hidden by default | `false` | `events.is_meta` | always `false` for system records; absent on 2 of 8 `compact_boundary` |
| `userType` | Always `external` | `"external"` | raw only | constant |
| `entrypoint` | How the session was launched | `"cli"`, `"sdk-cli"` | `llm_sessions.entrypoint` (first seen) | `sdk-cli` = a headless `claude -p` child: 6 of 27 `stop_hook_summary` |
| `cwd` | Working directory when written | `/home/brutus-home/projects/amalga-victorious` | `llm_sessions.cwd` (first seen); `llm_sessions.repo_path` derived | changes inside one file after `EnterWorktree` / `relocated` |
| `sessionId` | Owning session | `"c48ce942-ba37-4baf-88a7-ae45fde52c12"` | key: `llm_sessions.native_id` | equals the transcript file name stem in every main file checked |
| `version` | Claude Code version | `"2.1.263"`, `"2.1.286"` | `raw_records.harness_version`; `llm_sessions.harness_version_first/last` | |
| `gitBranch` | Branch when written | `"refactor"`, `"gateway-pivot"` | `llm_sessions.git_branch` (first seen) | |
| `slug` | Plan-file style session nickname | `"logical-floating-rocket"` | raw only | appears on a minority of records, from 2.1.261; cosmetic |
| `sessionKind` | Session is a daemon (`--bg`) session | `"bg"` | `llm_sessions.session_kind` | only ever `bg`, when present; 2.1.267 to 2.1.278 |
| `level` | Display severity | `"info"`, `"warning"`, `"notice"`, `"suggestion"` | raw only (but see `informational`) | present on `compact_boundary`, `local_command`, `stop_hook_summary`, `informational` |
| `session_id` | Snake-case duplicate of `sessionId` | `"ed2876c1-1446-4f8f-9a90-b7fe71d952eb"` | raw only | only on 21 `stop_hook_summary` and 2 `informational`, 2.1.272 onward |

### `system/turn_duration` — one per completed turn in the main session; says how long the whole turn took.

Count 4,092 (the most common system record). Versions 2.1.251 to 2.1.287, all 24 seen. Feeds `turns`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `durationMs` | Wall time from the user prompt to the turn ending, tool and idle time included | `3109359`, `808673`, `366462` | `turns.duration_ms`; derived `turns.started_at = ts − durationMs`, `turns.ended_at = ts` | verified: on 4,090 turns, `ts − durationMs − (timestamp of the turn's first user record)` has median −10 ms, p10 −36 ms, p90 +6 ms |
| `messageCount` | Number of messages in the conversation so far | `819`, `231`, `384` | `turns.message_count` | grows monotonically; lets the UI show conversation length without counting events |
| `pendingBackgroundAgentCount` | Background sub-agents still running when the turn ended | `3`, `1`, `20` | `turns.pending_background_agents` | absent when 0 (2,495 of 4,092 have it); the "turn ended but work is still running" signal |
| `pendingWorkflowCount` | Workflows still running when the turn ended | `1` | `turns.pending_workflows` | 13 records, version 2.1.285 only |
| `sessionKind` | see envelope | `"bg"` | `llm_sessions.session_kind` | 149 records |
| (envelope) | | | | `turns.natural_key = '<session>:turn:<promptId>'`: `promptId` comes from the user record at the head of the chain, found by walking `parentUuid` back from this record. The record carries no `promptId` itself. |

### `system/compact_boundary` — marks the point where the conversation was compacted; the summary follows as a user record.

Count 8 (6 inside sub-agent files, 2 in main files). Versions 2.1.263, 2.1.280, 2.1.283, 2.1.286. Feeds `compactions`, `events`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `content` | Display text | `"Conversation compacted"` | `content_blocks.text` | constant in the corpus |
| `agentId` | Sub-agent whose file holds the record | `"aac1e6d257a066f82"`, `"a87bc2ee9308ce3d6"` | key: `llm_sessions.natural_key` of the sub-agent session (`claude-code:<sessionId>/<agentId>`) | present only when `isSidechain` is true (6 of 8) |
| `logicalParentUuid` | The record that really came before the compaction | `"049a79c9-8aeb-4f20-a4a8-d4a0cb3d9a3e"` | `events.parent_event_ref` | `parentUuid` is `null` here, so the chain would break without it |
| `compactMetadata.trigger` | What started it | `"auto"` | `compactions.trigger` | only `auto` in the corpus (8 of 8) |
| `compactMetadata.preTokens` | Context size before | `967413`, `979850`, `967067` | `compactions.pre_tokens` | all near 1M: these are 1M-context sessions |
| `compactMetadata.postTokens` | Context size after | `23978`, `26441`, `19191` | `compactions.post_tokens` | |
| `compactMetadata.durationMs` | How long the compaction call took | `270525`, `53357`, `162551` | `compactions.duration_ms` | |
| `compactMetadata.cumulativeDroppedTokens` | Tokens dropped across all compactions so far | `943435`, `1884456` | `compactions.cumulative_dropped_tokens` | `1884456` is a second compaction in the same session |
| `compactMetadata.preCompactDiscoveredTools[]` | Deferred tool names the model had loaded | `"TaskStop"`, `"CronCreate"`, `"mcp__dungeonmaster__discover"` | raw only | needed to re-hydrate deferred tools after compaction; no query uses it. 7 of 8 records. |
| `compactMetadata.preservedSegment.headUuid` / `.anchorUuid` / `.tailUuid` | The slice of old records kept verbatim | `"d59ae492-2c6e-4a04-bd1a-092dbd35af47"` | raw only | chain repair data |
| `compactMetadata.preservedMessages.uuids[]` / `.allUuids[]` / `.anchorUuid` | Same kept slice, listed per uuid | `"d59ae492-2c6e-4a04-bd1a-092dbd35af47"` | raw only | |
| (join) summary text | The `user` record with `isCompactSummary: true` | offset 1 record after the boundary in 1 case, 4 records after in the other 6 | `compactions.summary_blob_ref` (blob of that user record's content, 12 KB to 49 KB) | between them sit `attachment` records (instructions, files); the summary's `parentUuid` is the boundary's `uuid` |

### `system/local_command` — a slash command ran locally, or its stdout was echoed.

Count 49. Versions 2.1.251 to 2.1.284 (18). Feeds `events`; a record with `commandRun` is itself an event of kind
`intervention`, subtype `slash-command`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `content` | Command echo or its stdout, in pseudo-XML | `"<local-command-stdout></local-command-stdout>"`, `"<command-name>/rename</command-name>…"` | `content_blocks.text` (tags stripped) | shapes: `local-command-stdout` 42, `command-name` 7 |
| `commandRun.command` | The slash command name | `"clear"`, `"model"`, `"context"`, `"goal"` | `events.kind = 'intervention'`, `subtype = 'slash-command'`, command name in `events.details_json` | 25 records, from 2.1.271; `clear` is 22 of 25 |
| `commandRun.args` | Its arguments | `""` | `events.details_json` | always empty in the corpus |
| `level` | | `"info"` | raw only | |

### `system/scheduled_task_fire` — a cron-scheduled prompt (from `/loop` or CronCreate) fired and started a turn.

Count 308. Versions 2.1.278 to 2.1.286 (7). Feeds `turns` (origin `scheduled`), `events`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `content` | Display line | `"Running scheduled task (Oct 1 12:26am)"` | `content_blocks.text` | |
| `taskId` | The scheduled task | `"3a1292bd"`, `"ab1f9a04"`, `"5c026d8c"` | `turns.origin_ref` | 8 hex; the same id repeats on every fire of one cron |
| `cron` | Cron expression | `"13,43 * * * *"`, `"*/30 * * * *"`, `"27 10 * * *"` | raw only | |
| `prompt` | The prompt that runs | `"Operator watchdog for scrolls/brands-gateways-epic/EPIC.md. Read tmp/operator/agents.json, the led…"` | raw only | full text; the turn's user record repeats it. Sets `turns.origin = 'scheduled'` for the turn that follows. |
| `cronKind` / `taskKind` | Task type | `"loop"` | raw only | 4 records each, 2.1.278 to 2.1.280 only |

### `system/stop_hook_summary` — what the Stop hooks did when a turn ended.

Count 27. Versions 2.1.267 to 2.1.273 only (3); not seen since. Feeds `hook_runs`, `errors`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `hookCount` | Number of Stop hooks run | `1` | raw only | always 1 |
| `hookInfos[].command` | Hook identity. For a prompt-type hook this is the PROMPT TEXT, not a shell command. | `"We must implement the tooling described in scrolls/seigelense/siegelense-tooling.md in all its nitt…"` | `hook_runs.command` | the hook is the `/goal` evaluator; text is the user's goal. Present on all 27. |
| `hookInfos[].promptText` | The same prompt text, separate field | same as above | raw only | 21 records, from 2.1.272 |
| `hookInfos[].durationMs` | Hook run time | `18246`, `3474`, `22` | `hook_runs.duration_ms` | 10 of 27 |
| `hookErrors[]` | Hook failures | `[]` | `hook_runs.outcome` (non-empty gives `non-blocking-error`) | empty in all 27 |
| `hookAdditionalContext[]` | Context the hook returned | `[]` | raw only | empty in all 27 |
| `preventedContinuation` | The hook stopped the turn from ending | `false` | `hook_runs.prevented_continuation` | always `false` here; the key blocked-turn signal |
| `stopReason` | Why continuation was prevented | `""` | raw only | always empty |
| `hasOutput` | Hook produced output | `true`, `false` | raw only | 17 true, 10 false |
| `toolUseID` | Id of this hook invocation | `"c6a08de1-f771-4294-8a47-ca39e668b4e5"` | key: `hook_runs.natural_key = '<session>:<pos>:<hookInfos index>'`; `hook_runs.hook_group_id` | a uuid, not a `toolu_` id, so NOT `hook_runs.tool_call_ref` |
| `level` | | `"suggestion"` | raw only | |

### `system/informational` — a notice shown to the user (limits, command errors, hook overrides).

Count 18. Versions 2.1.267 to 2.1.278 (5). Feeds `events` (some as kind `intervention`), `errors`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `content` | The notice text | `"Usage limit reached · continuing automatically at 5pm · esc or type to cancel"`, `"Backgrounding after the current tool finishes…"` | `content_blocks.text`; classify below | texts seen: usage limit (4), backgrounding (4), unknown command (4), automatic continue cancelled (3), hook blocked turn 9 times (1), goal paused (1), name collision (1) |
| `level` | Severity | `"warning"` (11), `"notice"` (7) | raw only | |
| (derived) | `Usage limit reached…` | | `errors.kind = 'rate-limit'`, `message = content` | no status code or request id on this record |
| (derived) | `A hook blocked the turn from ending N consecutive times — overriding…` | | `errors.kind = 'hook-error'` | |
| (derived) | `Backgrounding after the current tool finishes…`, `Automatic continue cancelled…` | | `events.kind = 'intervention'`, `subtype = 'interrupt'` | user pressed the background or cancel key |

### `system/agents_killed` — the user killed all running background agents.

Count 4. Versions 2.1.270, 2.1.271, 2.1.278. Feeds `events` (kind `intervention`).

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| (envelope only) | no payload fields at all | | `events.kind = 'intervention'`, `subtype = 'kill-agents'` | which agents died is NOT here: read the `<task-notification>` records with `status` killed or `stopped by user` in the same second, and `stoppedByUser` in sub-agent `.meta.json` |

### `system/away_summary` — the recap the harness writes when you return after being away.

Count 3. Versions 2.1.267, 2.1.268, 2.1.273. Feeds `events`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `content` | A short model-written recap | `"Goal was a clean test baseline on the clean-test-baseline branch. That's done: the sweep ran, find…"` | `content_blocks.text` | ends with `(disable recaps in /config)`; all 3 are `bg` sessions |

---

## 2. `queue-operation/*` records

A queue-operation line is `{"type":"queue-operation","operation":…,"timestamp":…,"sessionId":…}`. It has NO `uuid`,
`parentUuid`, `cwd` or `version`. They occur in MAIN transcripts only (rescan: 9,985 records, 0 in sub-agent files),
and `sessionId` always equals the file name stem. Key: `events.natural_key = '<session>:line:<lineNo>'`, `events.kind = 'intervention'`,
`events.subtype = <operation>` (`enqueue`, `dequeue`, `remove`, `pop-all`). The queue-operation line is the intervention; the
item it delivers is a separate ARRIVAL event (an `attachment/queued_command` or a `user` record), never a second intervention.

The queue holds prompts waiting for the model: user messages typed mid-turn, background-task notifications, and
messages from other agents. Replaying a file in order with a FIFO list gave this result (rescan):
- `enqueue` pushes.
- `dequeue` pops the HEAD (3,052 of 3,052 matched, median 12 ms apart).
- `remove` deletes the item whose `content` is equal (1,892 of 1,925 matched; 729 of those were not at the head; the other 33 had no earlier enqueue in the file).
- `popAll` clears the queue.
- 37 items were still queued at end of file (session ended).

After a `dequeue`, the next `user` record follows within 1 to 3 ms and carries `promptId`, `origin` and `promptSource`.
Example: `enqueue 01:27:21.808`, `dequeue 01:27:22.765`, `user 01:27:22.766` with `origin.kind = task-notification`.

### `queue-operation/enqueue` — an item entered the queue.

Count 4,994. Dates 2026-08-31 to 2026-10-01 (no version field; take the nearest neighbour's `version`). Feeds `events` (kind `intervention`), `background_tasks`, `turns`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `operation` | | `"enqueue"` | `events.subtype` | |
| `timestamp` | When queued | `"2026-09-06T19:35:36.761Z"` | `events.ts` | |
| `sessionId` | | `"c48ce942-ba37-4baf-88a7-ae45fde52c12"` | `llm_sessions.native_id` | |
| `content` | The queued text. Three shapes, by first characters: `<task-notification>` 4,128 · `<agent-message from="<agentId>">` 68 · plain user text 805. | `"<task-notification>\n<task-id>a1b4915789d272563</task-id>…"`, `"Reply with the single word: ack"` | plain text: `events.details_json` (first 300 characters) on the `enqueue` intervention event. `<task-notification>`: see the XML table below. Every shape: the full text is the event's `content_blocks.text`. | max length 100,040 chars: above 4 KB the text is in `content_blocks.blob_ref`. The `<agent-message>` text starts `[Subagent hand-back] The text below is the final report of…` in most cases. |
| (derived) | The turn this item starts | enqueue, then dequeue, then a `user` record | `turns.origin = 'queued'` for plain text, `'task-notification'` for a notification; `turns.origin_ref = <task-id>` | |

### `queue-operation/dequeue` — the head of the queue was taken for processing.

Count 3,048. Feeds `events` (kind `intervention`).

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `operation`, `timestamp`, `sessionId` | as above | `"dequeue"` | `events.ts`, `events.subtype = 'dequeue'` | |
| (no `content`) | Dequeue never says WHICH item | | derived: pair with the FIFO head from `normalizer_state` | the normalizer must keep the queue between batches: that is exactly what `normalizer_state.state_json` is for |

### `queue-operation/remove` — an item left the queue without a dequeue, because it was delivered another way.

Count 1,925. Feeds `events` (kind `intervention`), `background_tasks`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `content` | Same text as the matching enqueue | `"<task-notification>…"`, `"e2es need open handle and slow test checks as wlel cause…"` | pairing key (equal-content match) | 1,794 notification, 131 plain |
| `reason` | Why removed | `"absorbed_mid_turn"` (1,792), `"delivered_to_agent"` (133) | `events.details_json.reason` | `absorbed_mid_turn`: the text was injected into the running turn as an `attachment/queued_command`. `delivered_to_agent`: only ever a notification; inferred to mean it went to a sub-agent's own context (not verified). |
| `commandUuid` | Id of the queued command | `"6b39fad0-c579-497e-8014-aab7c2272bd7"` | `events.details_json.refId` | 234 records; 154 equal the `attachment.source_uuid` of a `queued_command` attachment, 82 match nothing in the file |
| `deliveryId` | Delivery id | `"c59d8c0c-9356-4075-89aa-8da5b9b4e1d1"` | raw only | 108 records, 2.1.28x only; matches no record uuid, meaning unknown |

### `queue-operation/popAll` — the user pulled all queued prompts back into the input box (Esc).

Count 10. Dates 2026-09-16 to 2026-10-01. Feeds `events` (kind `intervention`).

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `content` | The text(s) recalled | `"ok generally, youll have to only use 2 agy parallel cause its limits are smaller for 5hr…"` | `events.subtype = 'pop-all'`, the text in `events.details_json` | 10 of 10 are plain text, preceded by the matching `enqueue`. Not an error; the user changed their mind. |

### The `<task-notification>` XML inside `content`

One notification is the harness telling the model that a background task finished. The same task id can notify more than
once. Parse with a tolerant tag reader: text inside is XML-escaped (`&lt;`, `&gt;`, `&amp;`) and must be unescaped.
Tag order seen in 4,124 of the notifications: `task-id, tool-use-id, output-file, status, summary, note, result, usage`.

| Tag | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `<task-id>` | The background task. Prefix tells the kind: `a`+16 hex = sub-agent (3,252), `b`+8 = Bash (822), `w`+8 = workflow (10), `k`+8 = MCP task (31). | `a1b4915789d272563`, `byrdhr226`, `wjlebnp6s`, `kf6x5b363` | key: `background_tasks.natural_key = '<session>:task:<task-id>'`; `background_tasks.kind` | a sub-agent's id is also its `agent-<id>.jsonl` file name. Appears TWICE in 4 notices that report several tasks at once (stopped agents after a restart). |
| `<tool-use-id>` | The tool call that started the task | `toolu_0126jdCiVARVo1H6AXE51TtM` | `background_tasks.tool_call_ref` (the call whose `natural_key` is `claude-code:<id>`) | absent in about 190 notices (previous-session recovery, MCP tasks, goal check-ins) |
| `<output-file>` | Where the full output lives | `/tmp/claude-1001/<project>/<session>/tasks/<id>.output` | `background_tasks.output_path` | outside `~/.claude`; see section 4.5 |
| `<status>` | Final state | `completed` 3,825 · `failed` 245 · `killed` 35 · `stopped` 8 (13 notices have none) | `background_tasks.status` | stdout uses `completed`, `failed`, `stopped`; a killed task shows `killed` only in the stdout `task_updated` patch |
| `<summary>` | Human line | `Agent "Map Viewport, routes, mobile handling" finished`, `Background command "npm run ward 2>&1" completed (exit code 0)` | `background_tasks.summary` | encodes the exit code for Bash: `(exit code N)` and `failed with exit code N`. Failed agents carry the API error: `failed: Agent terminated early due to an API error: You've hit your weekly limit … HTTP 429, request id req_…`: derive `errors.kind = 'rate-limit'`, `status_code = 429`. |
| `<note>` | Boilerplate saying the id may notify again | `A task-notification fires each time this agent stops with no live background children of its own…` | raw only | constant text |
| `<result>` | The agent's final report, or the MCP output | `I have a complete picture. Here's the report. …` | `background_tasks.result_preview` (first 300 characters, unescaped); the full text is the notification event's `content_blocks.text` | up to ~100 KB |
| `<usage><subagent_tokens>` | Tokens the sub-agent used | `84701`, `346771`, `996138` | `background_tasks.reported_tokens` | agents and workflows only (3,203, the 10 workflows included); NOT a split of input and output |
| `<usage><tool_uses>` | Tool calls the sub-agent made | `16`, `15`, `325` | `background_tasks.reported_tool_uses` | |
| `<usage><duration_ms>` | Wall time | `106692`, `560779`, `441684` | `background_tasks.reported_duration_ms` | equals the stdout `task_notification.usage.duration_ms` |
| `<usage><agent_count>`, `agents_done`, `agents_error`, `agents_skipped`, `agents_empty_result` | Workflow roll-up | `8`, `8`, `0`, `0`, `0` | raw only | 10 workflow notices; per-agent detail is in the workflow journal (section 4.3) |
| `<worktree><worktreePath>`, `<worktreeBranch>` | The isolated worktree the agent worked in | `…/.claude/worktrees/agent-af14eb9559012bfc6` | raw only | 3 notices |
| `<diagnostics>`, `<recovery>` | Workflow pointers: the journal path, and the `Workflow({scriptPath, resumeFromRunId})` call to resume | `Per-agent results: …/wf_5dcc93de-cdd/journal.jsonl — one {"type":"result",…} line per completed agent…` | raw only | 9 and 2 notices |
| `<system-reminder>` | A synthetic goal check-in (no task id) | `Goal check-in: «switch to the seigelense worktree and look at the handoff doc…` | `content_blocks.text`; not a background task | 11 notices that have only `<summary>`: `Goal check-in: background work still running` |

Notice summaries that mean something other than "finished" (counts, enqueue rows): `was stopped by Claude` 16, `was stopped by user` 7,
`was resumed by the user` 2 (no `<status>`), `didn't finish before the previous session ended` 4, `stopped at its N-turn limit (partial result)` 2,
`No completion record was found for this background shell command from the previous session` 3. All are derivable end states for `background_tasks.status`
and for `llm_sessions.end_state` of a sub-agent (`stopped-by-user`, `killed`).

---

## 3. Metadata records

These are one-line state records with no `uuid` (so no `parentUuid` chain). Most are RE-APPENDED over and over: the same
value written again at each turn, so a session file holds dozens of copies. Dates, not versions, bound them (no `version` field).
Rescan (main files): `sessionId` equals the file stem in all of them. Every one of these maps by upsert on
`(session, record type)`, last value wins, so replays are idempotent. Their `raw_records.pos` is the key.

| Record | Files holding it | Records per file (mean) | Files whose value changes inside the file |
|---|---|---|---|
| `last-prompt` | 405 | 31 | 397 (new `leafUuid` each time) |
| `ai-title` | 214 | 48 | 7 (max 2 distinct values) |
| `mode` | 162 | 66 | 0 |
| `permission-mode` | 118 | 71 | 11 (max 2 values) |
| `atis-latch` | 403 | 31 | 0 |
| `cost-state` | 183 | 1.8 | 15 (a new cumulative total each time) |

### `last-prompt` — remembers the most recent user prompt and the conversation's current leaf.

Count 12,410. Dates 2026-08-31 to 2026-10-01. Feeds `llm_sessions`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `type` | | `"last-prompt"` | `raw_records.record_type` | |
| `lastPrompt` | The last real user prompt, cut at 201 chars | `"go read up on what this repo is. I need to do a ux for players building out their creatur…"` | `llm_sessions.last_prompt_preview` | absent from about 506 of 12,410 (the latest prompt was not text, such as an image or a command). Not a title. |
| `leafUuid` | `uuid` of the newest conversation record when written | `"31fc6829-8368-44f5-a1cf-18f8559ff975"` | raw only | the head of the chain at that moment; lets a reader find the live branch after a fork or resume. Often follows `cost-state` at session end. |
| `sessionId` | | `"c48ce942-ba37-4baf-88a7-ae45fde52c12"` | `llm_sessions.native_id` | |

### `ai-title` — a model-written session title (Haiku, outside the transcript's own messages).

Count 10,280. Dates 2026-08-31 to 2026-10-01. Feeds `llm_sessions.title`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `aiTitle` | Short title, up to 70 chars | `"Creature builder UX from blob"`, `"Siegemaster family prompts UI verification"` | `llm_sessions.title` (lowest priority) | 7 files re-title once. Priority for `llm_sessions.title`: `agent-name`, then `custom-title`, then `ai-title`: in 12 of 15 files that have an `agent-name`, it equals the final `ai-title`; in 3 it equals the `custom-title`. |
| `sessionId` | | | `llm_sessions.native_id` | |

### `custom-title` — a title the user set with `/rename`.

Count 124 in 3 files. Dates 2026-09-13 to 2026-09-14. Feeds `llm_sessions.title`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `customTitle` | The chosen name | `"test-quest-seeding-approach"` | `llm_sessions.title` | one file shows `…-sharded-ritchie`: the harness appends a suffix when another live session already has the name (also announced by a `system/informational`) |
| `sessionId` | | | `llm_sessions.native_id` | |

### `agent-name` — the session's current display name.

Count 654 in 15 files. Dates 2026-09-06 to 2026-10-01. Feeds `llm_sessions.title`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `agentName` | The name shown in the session list | `"record-session-cwd"`, `"auto-fill-npm-gateway-wrappers"`, `"test-quest-seeding-approach"` | `llm_sessions.title` (highest priority) | equals the `custom-title` when one exists, else the `ai-title`. The same name is in `~/.claude/sessions/<pid>.json` as `name`, with `nameSource` `auto`, `derived` or user. |
| `sessionId` | | | `llm_sessions.native_id` | |

### `mode` — the session's UI mode.

Count 10,614. Dates 2026-08-31 to 2026-10-01. Feeds nothing.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `mode` | UI mode | `"normal"` | raw only | `normal` in all 10,614: a constant with no information today. Kept raw so a new value shows up in `schema_drift`. |
| `sessionId` | | | | |

### `permission-mode` — the permission mode the session was in.

Count 8,317. Dates 2026-09-01 to 2026-10-01. Feeds `llm_sessions.permission_mode`, and `events` of kind `intervention` on a change.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `permissionMode` | Mode | `"bypassPermissions"` 7,967 · `"plan"` 234 · `"auto"` 115 · `"default"` 1 | `llm_sessions.permission_mode` (first value); each change after it is an `events` row of kind `intervention`, subtype `mode-change`, the new mode in `details_json` | 11 files switch mode inside the file (usually into `plan` and back) |
| `sessionId` | | | | |

### `atis-latch` — an opaque per-session latch value, written every turn.

Count 12,193. Dates 2026-08-31 to 2026-10-01. Feeds nothing.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `atis` | Opaque id | `""` (6,955), `"24c73bd181b5ea0a"`, `"5ab033a6d276faff"` | raw only | 16 hex or empty; never changes within a file (0 of 403 files); meaning unknown, no field anywhere else matches it |
| `sessionId` | | | | |

### `cost-state` — the session's cumulative cost and usage, written when the process exits or the session switches.

Count 327 in 183 files. Dates 2026-08-31 to 2026-10-01. No `timestamp` field. Feeds `rollup_session.last_reported_cost_usd`
and `last_reported_at` only (a cross-check of the headline `usage` × `pricing` cost); every other field is raw only.

Checked against the transcripts: the totals cover the main session PLUS its sub-agents (output tokens in `modelUsage`
were within 1.5% of main plus sub-agent final records in 5 of 6 sessions sampled). The 6th, `2774bd72`, is a resumed
session where the file holds more than the snapshot. The final `cost-state` is the last line of its file in 183 of 183 files; earlier ones sit before a `last-prompt` or `continued-in`. 17 are written twice a few ms apart
(the second differs only in `totalDuration`, by 9 to 12 ms). `totalCostUSD` never decreased across any file.
`modelUsage` also lists models the transcript never shows as messages (the title generator, `claude-haiku-4-5-20251001`
in 256 records), so it is the only place that cost appears.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `totalCostUSD` | Cumulative cost Claude Code itself computed | `56.19134475`, `446.3975993500001`, `0` | `rollup_session.last_reported_cost_usd` (newest wins) | float or int (7 are int `0`) |
| `totalAPIDuration` | Cumulative API time, ms | `3825084`, `61919441` | raw only | |
| `totalAPIDurationWithoutRetries` | Same, retries excluded | `3824773` | raw only | |
| `totalToolDuration` | Cumulative tool time, ms | `640898`, `7813796` | raw only | |
| `totalDuration` | Cumulative wall time, ms | `23058959`, `27690997` | raw only | |
| `totalLinesAdded` / `totalLinesRemoved` | Cumulative lines changed | `3788` / `166`, `27887` / `2761` | raw only | the only place line counts are totalled; `file_touches` holds per-call line counts |
| `startTime` | Process start, epoch ms | `1788722528619` | raw only | constant within a file; a resumed session starts a new count |
| `hasUnknownModelCost` | A model had no known price | `false` | raw only | `false` in all 327 |
| `modelUsage.<model>.inputTokens` / `outputTokens` / `cacheReadInputTokens` / `cacheCreationInputTokens` / `thinkingTokens` / `webSearchRequests` / `costUSD` | Cumulative per model | `claude-opus-5[1m]`: `inputTokens 53226`, `costUSD 9.777953499999999` | raw only | model keys are `claude-opus-5`, `claude-opus-5[1m]`, `claude-opus-5-5`, `claude-opus-5-5[1m]`, `claude-sonnet-5`, `claude-sonnet-5-5`, `claude-fable-5-1`, `claude-haiku-4-5-20251001`. The `[1m]` suffix is part of the key. `thinkingTokens` is absent on 4 haiku records. |
| `sessionId`, `type` | | | | |
| (derived) `ts` | The record has no time | | `rollup_session.last_reported_at` = `timestamp` of the nearest preceding timestamped record in the file | a near-duplicate pair sets the same value twice: intended |

### `worktree-state` — the session is inside (or has left) a worktree.

Count 244 in 5 files. Dates 2026-09-06 to 2026-09-16. Feeds `llm_sessions`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `worktreeSession` | The worktree, or `null` after leaving | object (206), `null` (38) | derived: `null` ends the worktree | |
| `worktreeSession.worktreePath` | Worktree directory | `/home/brutus-home/projects/codex-of-consentient-craft/worktrees/seeding-fidelity-experime…` | `llm_sessions.cwd` for later records; `llm_sessions.repo_path` stays the origin | |
| `worktreeSession.worktreeName` / `.worktreeBranch` | | `"seeding-fidelity-experiment"`, `"recipes-doc"` | `llm_sessions.git_branch` when branch present | `worktreeBranch` on 67 records only |
| `worktreeSession.originalCwd` / `.preEnterOriginalCwd` | Where the session was before | `/home/brutus-home/projects/codex-of-consentient-craft` | raw only | |
| `worktreeSession.sessionId` | | | | equals the record's `sessionId` |
| `worktreeSession.enteredExisting` | Entered a worktree that already existed | `true` | raw only | 67 records |
| `worktreeSession.hookBased` | Created through a WorktreeCreate hook | `true` | raw only | 139 records: this repo's `create-worktree` path |

### `relocated` — the session's working directory was moved.

Count 105 in 5 files. Dates 2026-09-06 to 2026-09-16. Feeds `llm_sessions.cwd`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `relocatedCwd` | New cwd | `/home/brutus-home/projects/codex-of-consentient-craft/worktrees/seeding-fidelity-experime…` | `llm_sessions.cwd` (latest) | follows a `worktree-state`; the record has no timestamp |
| `sessionId` | | | | |

### `continued-in` — this session ended and another one carries on (compaction hand-off, `/clear`, or restart).

Count 5. Dates 2026-09-10 to 2026-09-22. Feeds `llm_sessions.forked_from_session_ref` on the NEW session.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `continuedInSessionId` | The successor session | `"f6c40029-2db8-4e4c-8f77-0729fecadcde"` | the successor's `llm_sessions.forked_from_session_ref` (the session `claude-code:<sessionId>`) | points FORWARD: the successor row may not exist yet, so the writer inserts a stub `llm_sessions` row (`is_stub = 1`) that its own transcript fills later |
| `sessionId` | The session that ended | `"52c05c1d-9d3c-4e68-baf8-1c4f93f39191"` | | the last records before it are `cost-state` (3 of 5) |
| `timestamp` | | `"2026-09-16T06:41:31.360Z"` | `llm_sessions.ended_at` for the old session | one of the few metadata records with a time |

### `frame-link` — a published artifact (claude.ai page) linked to the session.

Count 27 in 1 file. Dates 2026-09-22. Feeds `artifacts` (optional).

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `frameUrl` | Artifact URL | `https://claude.ai/code/artifact/7c775682-1909-49f9-81c9-0f5e4a867471` | raw only | only on the first record; later ones omit it |
| `path` | Local file that was published | `/tmp/claude-1001/<project>/<session>/scratchpad/pose-step-grid.html` | raw only | |
| `title` | Artifact title | `"Pose Step Grid"` | raw only | |
| `artifactCount` | Artifacts so far | `1` | raw only | |
| `timestamp`, `sessionId` | | | | |

### `fork-context-ref` — written first in a forked sub-agent's file: says which parent context it copied.

Count 1 (in a sub-agent file, line 0). No date. Feeds `llm_sessions`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `agentId` | The fork | `"a836828c47d66db1b"` | key: the fork's session | |
| `parentSessionId` | Session whose context it inherited | `"5e66f7c1-19d5-474f-b9d9-89e89269a6eb"` | `llm_sessions.forked_from_session_ref`, `llm_sessions.is_fork = 1` | the stronger source for `is_fork` is `.meta.json` `isFork` (103 files); only 1 file has this record |
| `parentLastUuid` | Last parent record the fork saw | `"67904d45-27c3-48d0-9972-aa76a4983192"` | raw only | |
| `contextLength` | Records inherited | `394` | raw only | |

### `file-history-snapshot` — the set of files the harness is tracking for undo, at the start of a turn.

Count 2,092 in 148 main files. Dates 2026-08-31 to 2026-10-01. No `sessionId` (belongs to its file). Raw only: no
table reads it, and the `~/.claude/file-history/` backups it names are not captured (design §8.5, §16).

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `messageId` / `snapshot.messageId` | The user record that starts the turn | `"00c9d39d-3d2b-4e55-8677-d0160232ee10"` | raw only | 2,099 of 2,099 resolve to a `user` record |
| `snapshot.timestamp` | Snapshot time | `"2026-09-06T19:22:21.129Z"` | raw only | |
| `snapshot.trackedFileBackups.<path>` | One entry per tracked file; the file's relative path is the object KEY (so the path set is open-ended) | key `src/types/BuildMode.ts` | raw only | the census shows these as `{key}` |
| `…<path>.backupFileName` | Backup file name, or `null` when the file did not exist yet | `"ba0cb1c2db0e83d7@v2"`, `null` | raw only; the file at `~/.claude/file-history/<sessionId>/<name>` is not captured | `null` also for a file this turn created |
| `…<path>.version` | Backup version number | `2`, `3`, `5` | raw only | |
| `…<path>.backupTime` | When backed up | `"2026-09-06T23:24:46.123Z"` | raw only | |
| `…<path>.realParentDir` | Absolute directory of the file | `/home/brutus-home/projects/amalga-victorious/src/types` | raw only | |
| `isSnapshotUpdate` | Update of an earlier snapshot | `false` | raw only | `false` in all 2,092 |

### `file-history-delta` — one tracked file changed during a turn: its pre-edit backup.

Count 1,751 in 129 main files. Dates 2026-08-31 to 2026-10-01. Raw only: `file_touches` comes from the Edit/Write
tool results themselves, and the backup file it names is not captured (design §8.5, §16).

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `messageId` | The ASSISTANT record whose tool call changed the file | `"d184e8f6-acdf-4a1c-8a76-46b2e4b2ed04"` | raw only | 1,754 of 1,754 resolve to an `assistant` record |
| `snapshotMessageId` | The turn's starting user record | `"22863870-ef61-4721-b459-7da79f8bed55"` | raw only | 1,751 resolve to a prompt-bearing user record |
| `trackingPath` | File path relative to the repo root | `src/types/BuildTarget.ts` | raw only | |
| `backup.backupFileName` | Pre-edit copy, or `null` | `"989991897b936a8c@v1"`, `null` | raw only; the file is not captured | 815 of 1,751 are `null` (file created by this edit); of the rest, 897 exist on disk and 42 are gone |
| `backup.version` | | `1` | raw only | `1` in all deltas |
| `backup.backupTime`, `backup.realParentDir` | | | raw only | |
| `timestamp` | | `"2026-09-06T19:46:34.864Z"` | raw only | |

---

## 4. Side files beside transcripts

Layout under `~/.claude/projects/<project>/`:

```
<sessionId>.jsonl                                  main transcript           (not in this scope)
<sessionId>/subagents/agent-<agentId>.jsonl        sub-agent transcript      (not in this scope)
<sessionId>/subagents/agent-<agentId>.meta.json    4.1
<sessionId>/subagents/workflows/wf_<runId>/agent-<agentId>.{jsonl,meta.json}   workflow agents
<sessionId>/subagents/workflows/wf_<runId>/journal.jsonl                       4.3
<sessionId>/workflows/wf_<runId>.json              4.3 session summary
<sessionId>/workflows/scripts/<name>-wf_<runId>.js 4.3 script source
<sessionId>/tool-results/…                         4.2 spilled outputs
<sessionId>/custom-title.json                      4.6
sessions-index.json                                4.4
```

Outside `~/.claude/projects`: `~/.claude/file-history/<sessionId>/<hash16>@v<n>` (section 3, `file-history-*`; NOT
captured, design §8.5), `/tmp/claude-1001/<project>/<session>/tasks/<task-id>.output` (4.5) and `~/.claude/sessions/<pid>.json` (4.7).

### 4.1 `subagent-meta-json`: `agent-<agentId>.meta.json` — what a sub-agent is, who spawned it, how.

Count 3,284 (3,147 beside sessions, 137 under workflows). One JSON object, written when the agent starts; one file is a
partial rewrite, `{"agentType","stoppedByUser"}` with no transcript beside it, so the file is UPDATED later and must be
read as a whole-file source (`sources.watermark_json = {hash}`), not tailed. The `agentId` is not inside it: it is the
file name between `agent-` and `.meta.json`, and the key of the session: `llm_sessions.native_id = agentId`. Dates are file mtimes.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `agentType` | The `subagent_type` the Agent call asked for | `"general-purpose"` 2,845 · `"Explore"` 187 · `"workflow-subagent"` 137 · `"fork"` 103 · `"Plan"` 7 · `"claude"` 3 · `"claude-code-guide"` 2 | `llm_sessions.agent_type` | present on all 3,284. `fork` pairs with `isFork`. Equals the Agent tool_use `input.subagent_type` in 3,123 of 3,123 resolved files (a missing one means `general-purpose`). |
| `description` | The call's short description | `"Research story 28 independent work"`, `"Find durationDisplayTransformer consumers"` | `llm_sessions.description` | 3,283; equals the Agent `input.description` in 3,123 of 3,123. For workflow agents it equals the journal `label`. |
| `toolUseId` | The `toolu_` id of the Agent call that spawned it | `"toolu_01G8oZBwJ9QQxsVKK2scBSho"` | `llm_sessions.spawned_by_tool_call_ref` (the call whose `natural_key` is `claude-code:<id>`); `tool_calls.spawned_session_ref` | 3,146; resolves to an Agent tool_use in 3,123 of 3,146 (23 sit in files not on disk). Absent on workflow agents. |
| `spawnDepth` | Nesting depth: 1 = spawned by the main session | `1` 2,752 · `2` 482 · `3` 49 | `llm_sessions.spawn_depth` | |
| `parentAgentId` | The sub-agent that spawned it | `"aac1e6d257a066f82"`, `"a73475092a0602462"` | `llm_sessions.parent_session_ref` | 531 files, spawn depth 2 and 3 only, dated from 2026-09-01. Absent means the parent is the main session. In 57 of 531 the tool_use is NOT in the named parent's file, so resolve the parent by searching `toolUseId` across the session's files first. |
| `requestShape` | How the call asked to run | `"background"` 2,395 · `"foreground"` 186 | `llm_sessions.request_shape` | from 2026-09-08. `background` also when `run_in_background` was unset (1,524 cases): background is the default. `foreground` matches `run_in_background: false` (49 of 49 resolved). |
| `requestNonInteractive` | The spawn happened in a non-interactive session | `true` 2,443 · `false` 138 | raw only | tracks the parent's entrypoint; derivable from `llm_sessions.is_interactive` |
| `model` | The model alias asked for, NOT the resolved model | `"sonnet"` 1,883 · `"opus"` 311 · `"inherit"` 103 · `"haiku"` 5 | `llm_sessions.model_first` only as a fallback | absent on 982 files. The real model is `message.model` in the agent's own transcript, and `resolvedModel` in the parent's tool result. Equals the Agent `input.model` in 2,040 of 2,040. |
| `isFork` | The agent inherited the parent's full context | `true` | `llm_sessions.is_fork`, `llm_sessions.kind = 'fork'` | 103 files, from 2026-09-03 |
| `stoppedByUser` | The user stopped it from the UI | `true` | derived: `llm_sessions.end_state = 'stopped-by-user'` | 27 files, from 2026-09-07; written after the fact |
| `workflowPhase` | Workflow phase the agent ran in | `"Fix batches"` 42 · `"Lint fixes"` 31 · `"Unit fixes"` 19 | `llm_sessions.description` suffix; `llm_sessions.kind = 'workflow-agent'` | 137 files, 2026-09-30 |
| `worktreePath` | Isolated worktree created for the agent | `/home/brutus-home/projects/amalga-victorious/.claude/worktrees/agent-adf2d7166671c29df` | `llm_sessions.cwd` for the agent when set | 3 files (2026-09-22). Also in the `<worktree>` tag of its notification. |
| `spawnedWithWorktree` | The Agent call used `isolation: worktree` | `true` | raw only | 3 files |
| `worktreeBranch` | Branch of that worktree | `"worktree-agent-adf2d7166671c29df"` | `llm_sessions.git_branch` for the agent | 3 files |

### 4.2 `spill-file`: `<session>/tool-results/…` — tool output too big for the transcript.

Count 1,320 files, 874 MB (rescan). A tool call whose result is large is written here; the transcript's `tool_result` keeps a
2 KB preview plus the path. EVERY file is named by at least one transcript (1,320 of 1,320); 214 other paths named in
transcripts do not exist (text that merely mentions a path). Spill files for sub-agent calls land in the PARENT session's
`tool-results/`, not under `subagents/`. Four name shapes:

| Name shape | Count | Written for | How the transcript names it | Content |
|---|---|---|---|---|
| `<bashTaskId>.txt`, 9 chars, e.g. `boh2v8bba.txt`, `bbqjhzuwv.txt` | 837 | Bash (also a foreground Bash call) | `tool_result.content` starts `<persisted-output>\nOutput too large (181.4KB). Full output saved to: <path>\n\nPreview (first 2KB):…`; ALSO `toolUseResult.persistedOutputPath` and `persistedOutputSize` (e.g. `33586`) on 693 records | plain text, stdout and stderr |
| `mcp-<server>-<tool>-<epochMs>.txt` | 335 | MCP tools | `tool_result.content` is the string `Error: result (76,487 characters across 4 lines) exceeds maximum allowed tokens. Output has been saved to <path>.…`, WITHOUT `is_error` set, and `toolUseResult` is that string | plain text; the epoch ms is when it was written |
| `toolu_<tool_use_id>.json` | 145 | MCP tools returning content-block arrays | `<persisted-output>` text as above | JSON array `[{"type":"text","text":"…"}]` |
| `toolu_<tool_use_id>.txt` | 3 | WebFetch and similar | `<persisted-output>` text as above | plain text |

| Field path (transcript side) | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `toolUseResult.persistedOutputPath` | Absolute path of the spill file | `/home/brutus-home/.claude/projects/-home-…/c48ce942-…/tool-results/boh2v8bba.txt` | `tool_results.persisted_path` | Bash only; other tools put the path only in the text, so parse `Full output saved to: (…)` and `Output has been saved to (…)\.` |
| `toolUseResult.persistedOutputSize` | Size in bytes | `33586` | `artifacts.raw_bytes` | |
| `tool_result.content` text | Preview plus path | `<persisted-output>\nOutput too large (181.4KB). Full output saved to: …` | `tool_results.text` (the stub with its 2 KB preview fits under the 4 KB inline limit), `tool_results.shape = 'text'` | the `181.4KB` is a rounded size: do not parse it as a number |
| (the file itself) | Full output | | `artifacts` with `origin = 'spill-file'`; `tool_results.blob_ref` | read each once by whole-file hash. `toolu_` names give the join key directly (`tool_calls.native_call_id`); `<bashTaskId>` and `mcp-…` ones join only through the transcript text. |

### 4.3 `workflow-journal`: `subagents/workflows/wf_<runId>/journal.jsonl`, plus `workflows/wf_<runId>.json` and `workflows/scripts/*.js`

A Workflow tool call runs a script that fans out agents. The journal is its append-only log; the `.json` is the finished
summary; the script is the source. Count: 10 journals, 10 summaries, 10 scripts, all from 2026-09-30, one session. A journal
line has NO timestamp. Journal line types share names with the stdout `result` event and with `started`: in the archive
`raw_records.record_type` MUST be prefixed (`workflow-journal/result`), or the census's `result` (137) collides with stdout.

Line order in every journal: one `launched`, then all `started`, then all `result`. Every `started.key` equals exactly one
`result.key` (137 of 137), the `agentId` matches, and `started.label` equals the agent's `.meta.json` `description` (137 of 137).

| Record / field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `launched` (`type` only) | The workflow began | `{"type":"launched"}` | raw only | 10 records |
| `started.key` | Stable agent key | `"v2:fed044e10c395cff8abb1c549e84fbabd2be79d535f0fa9c5f3d8506c0cc6b93"` | raw only | `v2:` + sha256; lets a resumed workflow reuse a finished agent |
| `started.agentId` | The agent | `"abc81398ea6f1a8a9"` | key: session `claude-code:<sessionId>/<agentId>` (design §12.1 rule 6; the session is the one whose `workflows/` folder holds the journal) | file `agent-<agentId>.jsonl` sits beside the journal |
| `started.label` | Agent label | `"I-hooks-eslint"`, `"B0001 cli"` | `llm_sessions.description` | |
| `started.phase` | Phase title | `"Integration"`, `"Fix batches"` | `llm_sessions.description` suffix | equals `.meta.json` `workflowPhase` |
| `result.key` / `result.agentId` | | | | as above |
| `result.result` | The agent's final report | `"FIXED — packages/hydration/src/transformers/row-handle-chain/row-handle-chain-transf…"` | `llm_sessions.end_state = 'exited'`; blob | up to 9,939 chars. No success flag: a failed agent appears only as an empty or error-text result. |

`workflows/wf_<runId>.json` (10 files, whole-file source):

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `runId` | Workflow run id | `"wf_beab96d7-9e5"` | key; equals the journal directory name | |
| `taskId` | Background task id of the workflow | `"wjlebnp6s"` | `background_tasks.natural_key` (`<session>:task:<taskId>`); equals the `<task-id>` of its notification and `toolUseResult.taskId` of the Workflow call | `w` prefix |
| `timestamp` | Finish time | `"2026-09-30T10:39:16.222Z"` | `llm_sessions.ended_at` for the workflow | `startTime` is epoch ms and earlier |
| `startTime` | Start, epoch ms | `1790764420567` | `llm_sessions.started_at` | |
| `durationMs` | Wall time | `335640` | | |
| `status` | Final state | `"completed"` | `background_tasks.status` | the 10th file instead has `error` (a TypeError in the script) and `result: null` |
| `workflowName`, `summary`, `phases[]` | Name, description, phase list | `"bigbang-integration-round"` | `llm_sessions.description` | |
| `defaultModel` | Model for agents | `"claude-opus-5-5"` | | |
| `agentCount`, `totalTokens`, `totalToolCalls` | Roll-up | `6`, `448748`, `105` | `background_tasks.reported_tokens`, `reported_tool_uses` | |
| `args` | Script input | `[["I-hooks-eslint",["hooks","eslint-plugin"]],…]` | raw only | a list in 7 files, a string in 1 |
| `result[]` | `{id, report}` per agent | `{"id":"I-hooks-eslint","report":"FIXED —…"}` | raw only | duplicates the journal |
| `workflowProgress[]` | Per-agent live state at the end: `agentId`, `label`, `state`, `model`, `tokens`, `toolCalls`, `durationMs`, `queuedAt`, `startedAt`, `lastToolName`, `lastToolSummary`, `attempt`, `promptPreview`, `resultPreview` | `"state":"done"`, `"tokens":81695`, `"toolCalls":23` | raw only (each agent's own transcript holds its exact usage; the workflow-wide totals above feed the workflow task) | `workflow_phase` entries carry only `index` and `title` |
| `script`, `scriptPath` | Script source and its file | `export const meta = { name: 'bigbang-leaf-round', …` | raw only | the `.js` copy is identical in intent; skip the `.js` files |

The join chain from the parent transcript: the `Workflow` tool_result reads `Workflow launched in background. Task ID:
wjlebnp6s` plus `Transcript dir:` and `Script file:`, and its `toolUseResult` has `status: async_launched`, `taskId`, `taskType:
local_workflow`, `runId`, `transcriptDir`. That is the link from the spawning tool call to the workflow agents, which carry no `toolUseId`.

### 4.4 `sessions-index.json`: legacy per-project session list

Count 6 files (one per project), 165 entries in total, `{"version":1,"entries":[…],"originalPath":…}`. Last written
2026-01-04 to 2026-02-04: current Claude Code versions do NOT maintain it. 0 of the 165 `fullPath` files still exist. Treat it as
history only: do not discover sessions through it.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `entries[].sessionId` | Session | `"53515a57-f920-427e-9d70-7406b1194c7f"` | `llm_sessions.native_id` (only if its transcript is later imported) | |
| `entries[].fullPath` | Transcript path | `/home/brutus-home/.claude/projects/-home-…/53515a57-….jsonl` | raw only | stale |
| `entries[].fileMtime` | Epoch ms | `1769473209375` | raw only | |
| `entries[].firstPrompt` | First prompt | `"No prompt"`, `"What We Did    1. Added generic <T> to runtimeDynamicImportAdapter in packages/sha…"` | raw only | |
| `entries[].summary` | Title | `"Claude Code CLI Session Started"`, `"Hook Testing and Validation Execution"` | `llm_sessions.title` | absent on 30 of 165 |
| `entries[].messageCount` | | `2`, `22`, `8` | raw only | |
| `entries[].created` / `.modified` | ISO times | `"2026-01-04T05:27:58.398Z"` | `llm_sessions.started_at` / `last_activity_at` | |
| `entries[].gitBranch`, `.projectPath`, `.isSidechain` | | `"master"`, `/home/brutus-home/projects/codex-of-consentient-craft`, `false` | `llm_sessions.git_branch`, `llm_sessions.cwd` | |
| `entries[].customTitle` | | `"Orchastration Attempt"` | `llm_sessions.title` | 1 entry |
| `originalPath` (top level) | Project path | | raw only | |

### 4.5 `task-output` (source kind `task-output`): `/tmp/claude-1001/<project>/<session>/tasks/<task-id>.output`

Not under `~/.claude`, so the design's discovery does not see it. 2,324 files at scan time, named by the
`<output-file>` tag of the notification and the stdout `task_notification.output_file`. By task prefix:

| Task | Count | What the file is | Maps to |
|---|---|---|---|
| `a`+16 hex (sub-agent) | 1,668 | a SYMLINK to `~/.claude/projects/<project>/<session>/subagents/agent-<id>.jsonl` | nothing new: skip |
| `b`+8 (Bash) | 646 | the real output of the background command. 519 end with `\n[exited with code N]\n`; 133 have no marker (killed or still running); 4 empty. Median 1.6 KB, p90 51 KB, **max 3.1 GB**. | `background_tasks` exit code (parse the marker); content via `artifacts` with a size cap |
| `w`+8 (workflow) | 10 | JSON summary equal to `workflows/wf_<runId>.json` minus the script | skip |

Total real data is about 3.3 GB, almost all in a few runaway outputs: a reader MUST cap the bytes it takes (head and tail)
and never hash a whole file blindly. The files live in `/tmp` and vanish at reboot, so this is the only place a Bash
task's full output survives, and it can be gone before ingest reads it.

### 4.6 Other files in the same folders (no field map, listed so discovery can ignore them)

| File | What it is | Decision |
|---|---|---|
| `<session>/custom-title.json` (3 files) | `{"customTitle":"test-quest-seeding-approach-sharded-ritchie"}`: the title WITH the collision suffix | `llm_sessions.title` source, same priority as the transcript `custom-title` record |
| `<project>/memory/*.md` (about 40 files), `MEMORY.md` | Claude's auto-memory notes | not a transcript source |
| `<session>.jsonl.save` (1 file, 2025-08-19) | an old manual backup | ignore: discovery must match `*.jsonl` exactly |

### 4.7 `session-registry`: `~/.claude/sessions/<pid>.json` — which Claude processes are alive right now

Outside `~/.claude/projects`. Read on 2026-10-01: 8 `<pid>.json` files, one per live process (the file is removed when the
process exits). Each is one small JSON object, rewritten in place as the status changes, so it is a whole-file source
(`sources.kind = 'session-registry'`, `watermark_json = {size, mtimeMs}`), and the writer re-reads it whenever its mtime
moves. It feeds `llm_sessions` only: it creates no `events`, `messages` or `usage`. The `<pid>.<hash>.key` files beside each JSON file are
not a source: no source kind reads them.

The join is `sessionId`: the registry row updates the session `claude-code:<sessionId>`, and a registry file read first creates
that session as a stub (`is_stub = 1`). A pid can be reused after a reboot, so `procStart` plus `pidDomain` identify the process,
and a file whose `procStart` no longer matches the live process is treated as stale.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `pid` | OS process id; also the file name stem | `1363824`, `1372529` | `llm_sessions.os_pid` | joins stdout `init.messaging_socket_path`, whose file name carries the same number |
| `sessionId` | The Claude session the process is running | `fabdc93b-9956-42e3-9208-052321180905` | join key: `llm_sessions.native_id` (session `claude-code:<sessionId>`) | not written to a column of its own |
| `status` | What the process is doing | `busy` (1 of 2 read), `idle` | `llm_sessions.liveness` | values seen across the 8 files: `busy`, `idle`. A file that disappears sets `stopped`; a file the writer cannot parse sets `unknown` |
| `statusUpdatedAt` | When `status` last changed, epoch ms | `1790881647066` | `llm_sessions.liveness_at` | |
| `updatedAt` | Last time the process wrote the file, epoch ms | `1790888407466` | `llm_sessions.last_activity_at` | only raises the value, never lowers a time the transcript set |
| `kind` | Session class | `interactive`, `bg` | `llm_sessions.session_kind` (`bg` stored as written; `interactive` leaves it NULL) | `bg` is the background session the transcript marks with `sessionKind` |
| `startedAt` | Process start, epoch ms | `1790878837616` | raw only | the transcript's first record sets `llm_sessions.started_at` |
| `procStart` | Kernel start time of the process, a string of ticks | `"96936224"` | raw only | with `pidDomain`, guards against pid reuse |
| `pidDomain` | Pid namespace identity | `linux:69bd72b5…:pid:[4026531836]` | raw only | |
| `cwd` | Working directory | `/home/brutus-home/projects/codex-of-consentient-craft` | raw only | the transcript sets `llm_sessions.cwd` |
| `version` | Claude Code version | `2.1.287` (also `2.1.278`, `2.1.285`, `2.1.286`) | raw only | the transcript's per-record `version` feeds `llm_sessions.harness_version_*` |
| `entrypoint` | How it was launched | `cli`, `sdk-cli` | raw only | the transcript's `entrypoint` feeds `llm_sessions.entrypoint` |
| `name`, `nameSource`, `nameSince` | Display name, how it was chosen (`derived`, `auto`), when | `codex-of-consentient-craft-90` | raw only | `nameSource` `derived` and `auto` are generated names, not titles; `llm_sessions.title` comes from the transcript records |
| `messagingSocketPath` | The process's peer socket | `/run/user/1001/cc-socks/1363824.sock` | raw only | the pid in its name is `pid` again |
| `peerProtocol`, `peerFeatures[]` | Peer messaging capabilities | `1`; `notify_idle`, `reply_across_default_dirs`, `artifact_yield` | raw only | |
| `jobId` | Daemon job id | present on 1 of 8 files | raw only | only for daemon sessions |

Liveness is a reading, not history: `llm_sessions.liveness` holds the last value and `llm_sessions.liveness_at` its time. A dispatched
session's `end_state` still comes from the dispatch spool; an interactive session has no spool, so `llm_sessions.liveness` is how the
command center tells it is alive.

---

## 5. Headless stdout: `claude -p --output-format stream-json --verbose`

One JSON object per line. The orchestrator spawns it with exactly these flags and no `--include-partial-messages`
(`packages/orchestrator/src/transformers/claude-spawn-command-build/claude-spawn-command-build-transformer.ts`), so
`stream_event` lines do NOT occur in production; they are documented because the design may switch them on.

Captures: 5 sessions, 2 harness versions (2.1.267: 4 sessions, 2.1.287: 1 session). That is thin evidence: every count below is from
those 5 files, and nothing about error subtypes, `permission_denials` contents or `system/api_retry` has been observed.
Event counts by type, all 5 captures: `stream_event` 39, `assistant` 50, `user` 22, `system/background_tasks_changed` 22,
`system/task_started` 17, `system/task_notification` 17, `system/task_updated` 13, `system/task_progress` 12,
`result/success` 11, `system/init` 11, `rate_limit_event` 6, `system/thinking_tokens` 7, `system/status` 2.

### 5.0 Rules that govern every stdout line

| Fact (observed) | Consequence for the tables |
|---|---|
| **No stdout line has a timestamp**, except `assistant` and `user` lines (`timestamp`, ms, identical to the transcript's). `system/*`, `result`, `rate_limit_event` have only `uuid` and `session_id`. | `session_results.ts` (NOT NULL) and `background_tasks.started_at` need a RECEIVE time, and the last init line is chosen by it. The stdout spool records `received_at` per line, and that is the row's time. `task_updated.patch.end_time` is the one exact epoch-ms time. |
| **One process emits many `init` and `result` lines.** After the first turn, each finished background task wakes the model for a new turn: session A (3 agents, 2 shell tasks) printed 4 `init` and 4 `result` lines under ONE `session_id`; B 2 and 2; D 3 and 3. The `init` lines are re-emitted just before each woken turn; the extra `result` lines carry `origin: {"kind":"task-notification"}`. | `session_results` takes one row per line, unique on `(session_ref, result_uuid)`, with `result_seq` for order. Init lines are NOT kept per line: each one overwrites the session's `llm_sessions.init_*` columns, so the LAST init line wins (spool order). |
| **`result` totals are partly cumulative.** In session A the four results show `total_cost_usd` 0.3143, 0.3143, 0.3143, 0.3241 and `duration_api_ms` 28937, 28937, 28937, 30689, with `modelUsage` identical in the first three. Those, plus `subagent_stats`, are process-wide snapshots at emission. `duration_ms` (9866, 2373, 1911, 1782), `num_turns`, `ttft_ms` and `usage` are PER TURN. | Summing `total_cost_usd` over a session's results overcounts. The session's cost is the LAST result's `total_cost_usd`. All results are flushed late (A printed them at stdout lines 48 to 53). |
| **`assistant` lines carry a placeholder `usage` and a null `stop_reason`.** Example: stdout `output_tokens: 1`, `stop_reason: null`; the transcript line for the same `uuid` has `output_tokens: 188`, `stop_reason: "tool_use"`. 50 of 50 stdout assistant lines have `stop_reason: null`. | Never write `usage` or `stop_reason` from an `assistant` stdout line. Final values come only from the transcript (as the design says). With partial messages on, `stream_event` `message_delta.usage` holds the true final usage (`output_tokens 188`, `thinking_tokens 103`). |
| **Lines from sub-agents arrive on the same stdout**, with `parent_tool_use_id` set to the spawning Agent call's `toolu_` id (19 of 50 assistant lines, 12 of 22 user lines) and `session_id` equal to the PARENT's. There is no agent id on them. Their `uuid`s are in the sub-agent's own transcript file (rescan, session A: 6 of 6 assistant lines and 3 of 3 user lines). | The session for such a line = the session spawned by that tool call, found through `task_started` (`tool_use_id` to `task_id`) or the `.meta.json` `toolUseId`. |
| **`uuid` joins stdout to the transcript for `assistant` and `user` lines: 50 of 50 and 22 of 22 across the 5 captures** (main and sub-agent files). It never joins for `system/*`, `result`, `rate_limit_event`, `stream_event` (not persisted). | `events.origin = 'both'` for exactly those. |

### `system/init` — first line of a session, and again before each woken turn: the session's configuration.

5 captures, 11 lines. Versions 2.1.267 (23 keys) and 2.1.287 (25 keys). Feeds `llm_sessions` only; a later init line
overwrites an earlier one's `init_*`, `api_key_source`, `permission_mode` and `harness_version_last`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `type`, `subtype` | | `"system"`, `"init"` | raw only | |
| `session_id` | The session | `"adfbb70d-c485-4ce6-96bc-6f85f16fa168"` | key: `llm_sessions.natural_key = 'claude-code:' + session_id` (the transcript file stem) | |
| `uuid` | Id of this init line | `"dab3d3ac-dcd1-4fb7-ab79-acacda246318"` | raw only | differs on every re-emitted init (A: 4 distinct) |
| `cwd` | Working dir of the child | `/home/brutus-home/projects/codex-of-consentient-craft/tmp/bgprobe` | `llm_sessions.cwd` | |
| `model` | Model the session starts on (resolved id) | `"claude-sonnet-5"`, `"claude-haiku-4-5-20251001"` | `llm_sessions.model_first` (first init only) | |
| `permissionMode` | | `"acceptEdits"`, `"default"` | `llm_sessions.permission_mode` (last init wins) | |
| `claude_code_version` | | `"2.1.267"`, `"2.1.287"` | `llm_sessions.harness_version_last` (last init wins); `harness_version_first` when still NULL | the transcript's `version` agrees |
| `apiKeySource` | Where the credential came from | `"none"` | `llm_sessions.api_key_source` | `none` in all 11 (subscription login) |
| `tools[]` | Tool names | `"Task"`, `"Bash"`, `"CronCreate"` | `llm_sessions.init_tools_json` | 67 to 78 per init; includes MCP tools by full name |
| `mcp_servers[].name` / `.status` / `.source` | MCP server, health, where it was configured | `"dungeonmaster"`, `"connected"`, `"project"` | `llm_sessions.init_mcp_servers_json` | status seen: `connected`, `failed`, `disabled`. `source` (`user`, `project`, `claudeai`) appears on 6 of 56 entries, 2.1.287 only. |
| `agents[]` | Agent types available | `"claude"`, `"Explore"`, `"general-purpose"` | `llm_sessions.init_agents_json` | |
| `skills[]` | Skills available | `"ink-setup"`, `"deep-research"`, `"design"` | `llm_sessions.init_skills_json` | |
| `slash_commands[]` | Slash commands | `"ink-setup"`, `"dumpster-create"` | raw only | derivable from the skills and the transcript `skill_listing` attachment |
| `terminal_slash_commands[]` | Commands that only work in the terminal UI | `"doctor"`, `"color"`, `"focus"` | raw only | |
| `plugins[].name` / `.path` / `.source` | Loaded plugins | `"cc-plugin-agents-md"`, `"builtin"`, `"cc-plugin-agents-md@builtin"` | raw only | 2 entries, 2.1.287 only |
| `output_style` | | `"Plain speech"` | raw only | transcript has the `output_style` attachment |
| `capabilities[]` | Stream-protocol features the child supports | `"interrupt_receipt_v1"`, `"interrupt_cancel_queued_v1"`, `"interrupt_send_now_v1"` | raw only | 2.1.287 only; worth keeping in the archive for the day the server sends interrupts |
| `analytics_disabled`, `product_feedback_disabled` | | `true`, `false` | raw only | |
| `messaging_socket_path` | The child's peer-messaging socket, `/run/user/<uid>/cc-socks/<pid>.sock` | `/run/user/1001/cc-socks/1633551.sock` | `llm_sessions.os_pid` (the number in the file name) | `<pid>` names the live registry file `~/.claude/sessions/<pid>.json` (open question 5): the link from a session to its process, so a live session can be told from a dead one |
| `fast_mode_state`, `fast_mode_disabled_reason` | Fast mode status | `"off"`, `"sdk_opt_in_required"` | raw only | |
| `per_turn_effort_active`, `view_mode` | | `false`, `"default"` | raw only | 2.1.287 only (1 line) |

### `system/status` — the harness's momentary state.

2 lines, 2.1.287 capture only (partial messages on); none in the 4 sessions from 2.1.267. Feeds nothing.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `status` | State | `"requesting"` | raw only | one per API request in the capture; likely a spinner state, other values unobserved |
| `session_id`, `uuid` | | | | |

### `system/thinking_tokens` — a running estimate while the model thinks.

7 lines (2.1.267 and 2.1.287). Feeds nothing.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `estimated_tokens` | Estimated thinking tokens so far in the block | `50`, `159`, `150` | raw only | an ESTIMATE; true count is `usage.output_tokens_details.thinking_tokens` on the transcript's final record |
| `estimated_tokens_delta` | Since the previous estimate | `50`, `109`, `100` | raw only | |
| `session_id`, `uuid` | | | | |

### `system/background_tasks_changed` — the full list of tasks currently running, re-sent on every change.

22 lines. Feeds `background_tasks` (live set).

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `tasks[].task_id` | Task | `"abddefaa25f4cfa73"`, `"bpgbycntf"` | `background_tasks.natural_key` (`<session>:task:<task_id>`) | a SNAPSHOT, not a delta: a task absent from the next list has ended. `tasks: []` means none left (seen 4 times, the last one before the process exits). |
| `tasks[].task_type` | | `"local_agent"`, `"local_bash"` | `background_tasks.kind` (`subagent`, `bash`) | |
| `tasks[].description` | | `"Background sleep probe 1"`, `"sleep 240; touch /tmp/bgprobe-a-2.done"` | raw only | |
| `session_id`, `uuid` | | | | |

### `system/task_started` — a task (sub-agent or shell command, background or foreground) began.

17 lines. Feeds `background_tasks`, `llm_sessions`, `tool_calls`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `task_id` | Task. For a sub-agent it is the `agentId`. | `"abddefaa25f4cfa73"`, `"bpnnj5x6c"` | `background_tasks.natural_key` (`<session>:task:<task_id>`); for agents the session is `claude-code:<session_id>/<task_id>` (the stdout line's `session_id` is the PARENT session; design §12.1 rule 6) | |
| `tool_use_id` | The tool call that started it | `"toolu_01STiN2Yo7ikCbUoAyR7PvDV"` | `background_tasks.tool_call_ref`; `tool_calls.spawned_session_ref` / `tool_calls.background_task_ref` | the early pairing the design wants: before `.meta.json` exists |
| `description` | | `"Background sleep probe 1"` | `llm_sessions.description` (agents) | |
| `subagent_type` | | `"general-purpose"` | `llm_sessions.agent_type` | agents only (8 of 17) |
| `is_backgrounded` | Started in the background | `true` (11), `false` (6) | `background_tasks.is_background` | `false` rows are 2 FOREGROUND sub-agents and 4 foreground Bash calls made inside sub-agents (session C): a table named `background_tasks` also receives them unless filtered |
| `spawn_depth` | Nesting depth | `1`, `2` | `llm_sessions.spawn_depth` | agents only |
| `task_type` | | `"local_agent"`, `"local_bash"` | `background_tasks.kind` | |
| `prompt` | The agent's full prompt | `"You are a measurement probe. Do exactly two things and nothing else. (1) Make ONE Bash call wit…"` | raw only | the sub-agent transcript's first user record holds it |
| `owned_by_subagent` | The task was started by a sub-agent, not the main session | `true` | `background_tasks.owner_session_ref` (the sub-agent session that made the call) | 8 of 17, all of them `local_bash` |
| `session_id`, `uuid` | | | | |
| (derived) `started_at` | no timestamp on the line | | receive time (see 5.0) | |

### `system/task_progress` — periodic progress of a running sub-agent.

12 lines. Feeds `background_tasks` (optional).

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `task_id`, `tool_use_id` | | | join as above | |
| `description` | Current activity | `"Running Sleep then create marker file"`, `"Running sleep 240; touch /tmp/bgprobe-a-2.done"` | raw only | |
| `subagent_type` | | `"general-purpose"` | | |
| `usage.total_tokens` | Tokens the agent has used so far, one total | `21609`, `21828`, `22886` | `background_tasks.reported_tokens` (latest wins) | not an input and output split |
| `usage.tool_uses` | | `1`, `2`, `3` | `background_tasks.reported_tool_uses` | |
| `usage.duration_ms` | | `2707`, `2532`, `2854` | `background_tasks.reported_duration_ms` | |
| `last_tool_name` | | `"Bash"`, `"Agent"`, `"Read"` | raw only | |
| `session_id`, `uuid` | | | | |

### `system/task_updated` — a task changed state; the patch carries the new fields.

13 lines. Feeds `background_tasks`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `task_id` | | `"abddefaa25f4cfa73"` | `background_tasks.natural_key` (`<session>:task:<task_id>`) | |
| `patch.status` | New state | `"completed"`, `"killed"` | `background_tasks.status` | `killed` is what happens to every still-running task when the child process exits (A: 3 tasks, all within 1 ms of each other); the paired `task_notification.status` then reads `stopped` |
| `patch.end_time` | End, epoch ms | `1789003641807` | `background_tasks.ended_at` | exact: the matching transcript `enqueue` is 1 ms later (`01:27:21.808Z`) |
| `session_id`, `uuid` | | | | |

### `system/task_notification` — the stdout twin of the transcript's `<task-notification>`.

17 lines. Feeds `background_tasks`, `llm_sessions.end_state`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `task_id`, `tool_use_id` | | `"aba2cdcf67ab78114"` | join keys | equal the XML `<task-id>` and `<tool-use-id>` |
| `status` | | `"completed"`, `"stopped"`, `"failed"` | `background_tasks.status` | 3 values here; the XML adds `killed` |
| `output_file` | Output location, or `""` | `/tmp/claude-1001/…/tasks/abddefaa25f4cfa73.output` | `background_tasks.output_path` | `""` on 4 of 17 lines |
| `summary` | **The task's RESULT text for agents, the description for shells** | `"DONE-1"` (agent), `"sleep 240; touch /tmp/bgprobe-a-2.done"` (shell) | `background_tasks.result_preview` | NOT the XML's `<summary>`: the XML summary is the human line (`Agent "…" finished`) and the stdout `summary` equals the XML `<result>` |
| `usage.total_tokens` / `.tool_uses` / `.duration_ms` | Final totals | `22800`, `1`, `4364` | `background_tasks.reported_*` | equal the XML `<subagent_tokens>`, `<tool_uses>`, `<duration_ms>` (22800, 1, 4364 in session A); present on 8 of 17 (agents only) |
| `session_id`, `uuid` | | | | |

### `rate_limit_event` — the account's quota state, sent a few times per session.

6 lines (one per session, two in B). Feeds `rate_limit_samples`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `rate_limit_info.status` | | `"allowed_warning"` | `rate_limit_samples.status` | only `allowed_warning` seen; a block would read differently (unobserved) |
| `rate_limit_info.rateLimitType` | Which window the status is about | `"seven_day"` | `rate_limit_samples.limit_type` | |
| `rate_limit_info.utilization` | Fraction used | `0.86`, `0.78` | `rate_limit_samples.utilization` | |
| `rate_limit_info.resetsAt` | Window reset, epoch SECONDS | `1791093600`, `1789279200` | `rate_limit_samples.resets_at` (× 1000) | seconds, unlike every other epoch here |
| `rate_limit_info.surpassedThreshold` | Warning threshold passed | `0.75` | `rate_limit_samples.surpassed_threshold` | |
| `rate_limit_info.isUsingOverage` | | `false` | `rate_limit_samples.is_overage` | |
| `rate_limit_info.unifiedWindows.five_hour.utilization` / `.resetsAt` | The 5-hour window | `0.21`, `1790883600` | `rate_limit_samples.five_hour_utilization` / `five_hour_resets_at` | |
| `rate_limit_info.unifiedWindows.seven_day.utilization` / `.resetsAt` | The 7-day window | `0.86`, `1791093600` | `rate_limit_samples.seven_day_utilization` / `seven_day_resets_at` | |
| `session_id`, `uuid` | | | | no timestamp: receive time |

### `assistant` (stdout) — one line per content block of an API message; a provisional copy of the transcript line.

50 lines. Feeds `messages` (`provisional = 1`), `events`, `content_blocks`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `uuid` | Record id | `"cde9e4ed-a925-4414-b497-7b872c80553d"` | key: `events.natural_key = '<session>:<uuid>'` | the join to the transcript (50 of 50) |
| `message.id` | API message id | `"msg_011Cfc5ma24CpoD7VEBZ492H"` | key: `messages.natural_key = 'claude-code:<id>'` | one message spans several lines, one per block |
| `message.model` | | `"claude-sonnet-5"` | `messages.model` | |
| `message.role`, `message.type` | | `"assistant"`, `"message"` | `messages.role` | |
| `message.content[]` | The block: `type` `thinking` / `text` / `tool_use` | `{"type":"text","text":"DONE-1"}` | `content_blocks`; tool_use gives `tool_calls` (`id`, `name`, `input`, plus `caller.type: "direct"`) | one block per line, as in the transcript. `thinking` is `""` with only a `signature`. |
| `message.stop_reason` | | `null` | do NOT write | `null` in 50 of 50 |
| `message.usage.*` | Placeholder usage | `input_tokens 10`, `output_tokens 1`, `cache_creation.ephemeral_1h_input_tokens 13683` | do NOT write | `output_tokens` is 1 on lines whose true total is 47 to 188; input and cache fields are right |
| `message.container`, `.stop_sequence`, `.stop_details`, `.diagnostics`, `.context_management`, `.input_transformations` | API envelope | `null` | raw only | `input_transformations` (array) on 4 lines |
| `request_id` | API request id | `"req_011Cfc5mZmBFxtg4fs781H3d"` | `messages.request_id` | equals transcript `requestId` |
| `timestamp` | | `"2026-10-01T19:38:46.495Z"` | `messages.started_at` | identical to the transcript's |
| `parent_tool_use_id` | Spawning Agent call, when the line came from a sub-agent | `null`, `"toolu_01STiN2Yo7ikCbUoAyR7PvDV"` | session attribution (see 5.0) | |
| `subagent_type`, `task_description` | The sub-agent's type and description, on its lines only | `"general-purpose"`, `"Background sleep probe 1"` | `llm_sessions.agent_type`, `llm_sessions.description` | 19 of 19 lines with a non-null `parent_tool_use_id` |
| `thinking_duration_ms` | How long the thinking block took | `1163`, `51` | `messages.thinking_duration_ms` | 2 lines, 2.1.287; the transcript twin is `thinkingDurationMs` |
| `session_id` | | | `llm_sessions.native_id` | the PARENT's, even on sub-agent lines |
| Not on stdout, present in the transcript | `parentUuid`, `apiBlockIndex`, `perTurnEffort`, `isSidechain`, `cwd`, `entrypoint`, `gitBranch`, `version`, `sessionId`, `userType` | | | so the provisional row has no `events.parent_event_ref`; arrival order is its only order |

### `user` (stdout) — a tool result going back to the model, from the main session or a sub-agent.

22 lines. Feeds `events`, `tool_results`, `content_blocks` (provisional).

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `uuid`, `timestamp` | | | `events.natural_key`, `events.ts` | join to the transcript: 22 of 22 |
| `message.role` | | `"user"` | | |
| `message.content[].type` | `tool_result` (21) or `text` (1) | | `content_blocks.block_type` | the `text` line is a sub-agent's first prompt |
| `message.content[].tool_use_id` | The call answered | `"toolu_01HhQTYUBSt9SXV2m9H5yANL"` | `tool_results.tool_call_ref` | |
| `message.content[].content` | Result: string, or array of `{type:"text",text}` | `"Command running in background with ID: bpgbycntf. Output is…"` | `tool_results.text` (inline up to 4 KB, else `tool_results.blob_ref`) | |
| `message.content[].is_error` | | `false`, `true` | `tool_results.is_error` | 12 lines carry it |
| `tool_use_result` | The transcript's `toolUseResult`, renamed to snake case: an OBJECT on success, a STRING on error | `"Error: Exit code 2\nls: cannot access '/tmp/bgprobe-c-1.done'…"` | `tool_results.details_json`, `exit_code` | the object keys (`agentId`, `outputFile`, `isAsync`, `status`, `backgroundTaskId`, `totalDurationMs`, `toolStats`…) keep their camelCase, so do not run a key transformer |
| `parent_tool_use_id` | | | session attribution | |
| `subagent_type`, `task_description` | | | | 12 lines |
| `session_id` | | | | |
| Not on stdout | `parentUuid`, `promptId`, `sourceToolAssistantUUID`, `toolUseResult` (renamed), `cwd`, `version` | | | |

### `result/success` — the end of a turn: totals and timings. The only `result` subtype observed.

11 lines (all `is_error: false`). Feeds `session_results`, `rollup_session.last_reported_cost_usd`, `errors`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `subtype` | | `"success"` | `session_results.subtype` | `error_max_turns`, `error_during_execution` and others are documented by Anthropic but UNOBSERVED here |
| `is_error` | | `false` | `session_results.is_error` | |
| `api_error_status` | HTTP status when the turn died on an API error | `null` | `session_results.api_error_status`; derive `errors.status_code` | `null` in all 11 |
| `duration_ms` | PER TURN wall time | `9866`, `2373`, `1911` | `session_results.duration_ms` | |
| `duration_api_ms` | CUMULATIVE API time of the process | `28937`, `30689` | `session_results.duration_api_ms` | |
| `ttft_ms` | Time to first token of the turn | `1750`, `2523` | `session_results.ttft_ms` | |
| `ttft_stream_ms` | TTFT measured on the stream | `586`, `2086` | `session_results.ttft_stream_ms` | |
| `time_to_request_ms` | Delay before the request was sent | `53`, `48`, `6` | `session_results.time_to_request_ms` | |
| `first_content_frame_ms` | First content frame | `586`, `2087` | raw only | |
| `queued_turn_count` | Turns waiting | `0` | raw only | 0 in all 11 |
| `num_turns` | Model turns inside this result | `4`, `1`, `2` | `session_results.num_turns` | per result |
| `total_cost_usd` | CUMULATIVE cost of the process | `0.0332133`, `0.3143239` | `session_results.reported_cost_usd`; `rollup_session.last_reported_cost_usd` and `last_reported_at` (the spool's `received_at`) when newer | take the last one |
| `stop_reason` | | `"end_turn"` | `session_results.stop_reason` | |
| `terminal_reason` | | `"completed"` | `session_results.terminal_reason` | |
| `result` | The final text | `"The first word is **pineapple**."`, `"DONE-1 DONE-2 DONE-3"` | `session_results.result_preview` (300 characters; the full text is the session's last assistant event) | |
| `permission_denials[]` | Denied tool calls | `[]` | `session_results.permission_denials_json` | empty in all 11: element shape unobserved |
| `usage.input_tokens` / `output_tokens` / `cache_read_input_tokens` / `cache_creation_input_tokens` | This turn's token totals | `4`, `880`, `33674`, `35862` | raw only | per turn, so they do not sum to the process; the rows come from the transcript |
| `usage.cache_creation.ephemeral_5m_input_tokens` / `.ephemeral_1h_input_tokens` | | `0`, `13960` | raw only | |
| `usage.output_tokens_details.thinking_tokens` | | `135`, `0`, `16` | raw only | |
| `usage.server_tool_use.web_search_requests` / `.web_fetch_requests` | | `0` | raw only | |
| `usage.service_tier`, `.inference_geo`, `.speed`, `.iterations`, `.fallback_credit` | | `"standard"`, `"not_available"`, `"standard"`, `[]`, `null` | raw only | `fallback_credit` on 1 line |
| `modelUsage.<model>.inputTokens` / `outputTokens` / `cacheReadInputTokens` / `cacheCreationInputTokens` / `webSearchRequests` / `costUSD` / `thinkingTokens` | CUMULATIVE per model | haiku: `inputTokens 1211`, `outputTokens 13`, `costUSD 0.001276` | `session_results.model_usage_json` | the haiku entry is a side call (the title generator) that no transcript message shows |
| `modelUsage.<model>.contextWindow` / `.maxOutputTokens` | Model limits | `200000`/`32000` (haiku), `1000000`/`64000` (sonnet-5) | `usage.context_limit` (look up by model) | the ONLY place the context limit is reported: otherwise it is a static table |
| `modelUsage.<model>.canonicalModel` / `.provider` / `.costBasis` | | `"claude-sonnet-5"`, `"firstParty"`, `"list"` | `usage.provider` (maps `firstParty` to `anthropic`) | |
| `subagent_stats.spawned` / `.requested.{background,foreground,unset}` / `.started_in_background` / `.max_depth` / `.spawned_by_subagents` / `.completed` / `.failed` / `.killed.{parent,user,system}` / `.refused.{depth_limit,concurrency_limit,budget}` / `.by_type.<type>` | Sub-agent roll-up of the process | `spawned 3`, `max_depth 2`, `by_type.general-purpose 3` | `session_results.subagent_stats_json` | cumulative; `completed` was 0 in A's first result and 2 in D's: a snapshot at emission |
| `origin.kind` | What woke this turn | `"task-notification"` | `session_results.origin_kind` | absent on the first result of a session; present on 6 later ones. The transcript user record carries the same `origin`. |
| `result_index` | Ordinal of the result | `0` | `session_results.result_seq` | 2.1.287 only; on 2.1.267 the order of arrival is the only ordinal |
| `fast_mode_state`, `fast_mode_disabled_reason` | | `"off"`, `"sdk_opt_in_required"` | raw only | |
| `uuid`, `session_id` | | | `session_results.result_uuid` (part of the key) | |

### `stream_event` — a raw API server-sent event. Only with `--include-partial-messages`; not produced by the orchestrator today.

39 lines, 2.1.287 capture only. Feeds nothing by the design's decision.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `event.type` | SSE kind | `"message_start"`, `"content_block_start"`, `"content_block_delta"`, `"content_block_stop"`, `"message_delta"`, `"message_stop"` | raw only | |
| `event.index` | Block index | `0`, `1` | raw only | |
| `event.delta.type` | `thinking_delta`, `signature_delta`, `input_json_delta`, `text_delta` | | raw only | the `partial_json` strings concatenate to the tool input |
| `event.message.*` (on `message_start`) | Message shell with an initial `usage` | `id`, `model`, `usage.output_tokens 1` | raw only | |
| `event.usage.*` and `event.delta.stop_reason` (on `message_delta`) | The TRUE final usage and stop reason | `output_tokens 188`, `output_tokens_details.thinking_tokens 103`, `stop_reason "tool_use"` | would feed `usage` (provisional) | the only stdout source of final usage, before the transcript is written |
| `event.context_management.applied_edits[]` | Context edits applied | `[]` | raw only | |
| `ttft_ms` (top level, on `message_start`) | Time to first token of this API call | `533`, `478` | `messages.ttft_ms` | |
| `thinking_display` | Thinking display mode | `"updates"` | raw only | |
| `parent_tool_use_id`, `session_id`, `uuid` | | | | `parent_tool_use_id` is `null` on all 39 |

---

## 6. Join keys, in one table

| From | To | Key | Strength |
|---|---|---|---|
| stdout `session_id` | transcript file and `llm_sessions.native_id` | file stem = `sessionId` | exact |
| stdout `assistant` / `user` `uuid` | transcript record `uuid` | equal | 50 of 50, 22 of 22 |
| stdout `assistant.message.id`, `request_id` | transcript `message.id`, `requestId` | equal | exact |
| stdout `parent_tool_use_id` | Agent `tool_use` `id` in the parent file; `.meta.json` `toolUseId` | equal | exact |
| stdout `task_started.task_id` | `agent-<id>.jsonl` and `.meta.json`; XML `<task-id>`; `toolUseResult.agentId` / `backgroundTaskId` | equal | exact |
| stdout `task_started.tool_use_id`, `task_notification.tool_use_id` | XML `<tool-use-id>`; Agent or Bash `tool_use` id | equal | exact |
| stdout `task_updated.patch.end_time` | transcript `queue-operation/enqueue` `timestamp` | within 1 to 3 ms | time-based; exact for dedupe by task id |
| stdout `task_notification.summary` (agent) | XML `<result>` | equal text | exact |
| stdout `task_notification.usage` | XML `<usage>` | `total_tokens` = `subagent_tokens` | exact |
| stdout `result.origin.kind = task-notification` | transcript `user.origin.kind` after a `dequeue` | order | by position |
| stdout `init.messaging_socket_path` | `~/.claude/sessions/<pid>.json` | the pid in the file name | inferred, not verified against a live session |
| `queue-operation/dequeue` | the FIFO head `enqueue` | order within the file | exact (3,052 of 3,052) |
| `queue-operation/remove` | its `enqueue` | equal `content` | 1,892 of 1,925 |
| `remove.commandUuid` | `attachment/queued_command.source_uuid` | equal | 154 of 236 |
| `compact_boundary.uuid` | `user.isCompactSummary` record | `parentUuid` chain, 1 to 4 records on | exact |
| `file-history-delta.messageId` | the assistant record with the Edit/Write `tool_use` | equal | 1,754 of 1,754 (not used: file-history is raw only) |
| `file-history-*.snapshotMessageId` / `snapshot.messageId` | the turn's starting `user` record, whose `promptId` is `turns.prompt_id` | equal | exact (not used: file-history is raw only) |
| `.meta.json` `toolUseId` | Agent `tool_use` in the parent's transcript | equal | 3,123 of 3,146 (rest: parent file not on disk) |
| `.meta.json` `parentAgentId` | parent sub-agent session | equal | 474 of 531 name the file holding the `tool_use`; use `toolUseId` first |
| workflow agent | its `Workflow` tool call | `toolUseResult.runId` / `taskId` = `wf_<runId>` directory = `.json` `taskId` | exact |
| `<output-file>` | `/tmp/claude-1001/…/tasks/<id>.output` | path | symlink to the transcript for agents |
| spill file | its tool call | `toolu_<id>` in the name, or the path in the result text | exact |

---

## Where the earlier proposals landed in `schema.md`

Every proposal this file once made is in the final schema, or was trimmed with it (design §16).

| Source | Column or table |
|---|---|
| several `init` lines per process | the LAST one's facts on `llm_sessions` (`init_tools_json`, `init_mcp_servers_json`, `init_agents_json`, `init_skills_json`, `api_key_source`, `harness_version_last`, `permission_mode`) |
| several `result` lines per process, cumulative cost and API time | `session_results`, unique on `(session_ref, result_uuid)`, with `result_seq` and `origin_kind`; a session's totals are its last row |
| no time on stdout `system/*`, `result` or `rate_limit_event` lines | the spool's `received_at` becomes `session_results.ts`, `rate_limit_samples.received_at` and `background_tasks.started_at` |
| `turn_duration` | `turns.message_count`, `turns.pending_background_agents`, `turns.pending_workflows` |
| scheduled `taskId`, the notification `<task-id>` | `turns.origin_ref` |
| `sessionKind`, registry `kind` | `llm_sessions.session_kind` |
| `last-prompt.lastPrompt` | `llm_sessions.last_prompt_preview` |
| `.meta.json` `requestShape` | `llm_sessions.request_shape` |
| stdout `messaging_socket_path`, registry `pid` | `llm_sessions.os_pid` |
| registry `status`, `statusUpdatedAt`, `updatedAt` | `llm_sessions.liveness`, `llm_sessions.liveness_at`, `llm_sessions.last_activity_at` |
| `compactMetadata` | `compactions.post_tokens`, `duration_ms`, `cumulative_dropped_tokens`, `summary_blob_ref` |
| `cost-state` | `rollup_session.last_reported_cost_usd`, `last_reported_at`; every other field raw only |
| `stop_hook_summary` | `hook_runs.duration_ms`, `hook_runs.prevented_continuation` |
| `remove.reason`, `remove.commandUuid`, `local_command.commandRun`, `agents_killed` | `events` kind `intervention`: `details_json.reason`, `details_json.refId`, subtypes `slash-command`, `kill-agents` |
| notification XML, stdout `task_*` | `background_tasks.is_background`, `summary`, `output_path`, `reported_tokens`, `reported_tool_uses`, `reported_duration_ms`, `notification_count`, `exit_code`; `kind` values `workflow` and `mcp` |
| stdout `result` | `session_results.api_error_status`, `ttft_stream_ms`, `time_to_request_ms` |
| stdout `message_start.ttft_ms`, `thinking_duration_ms` | `messages.ttft_ms`, `messages.thinking_duration_ms` |
| stdout `rate_limit_event` | `rate_limit_samples` |
| `file-history-*` | raw only; the backup files are not captured |
| side files | `sources.kind` values `task-output`, `session-registry` |

## Open questions

1. **Does a transcript line change after it is written?** The stdout `assistant` line has `output_tokens: 1` and `stop_reason: null`, and the transcript line for the same `uuid` shows 188 and `tool_use`. Either the transcript line is written late with final values (then no `raw_records` row past revision 0 appears) or it is rewritten in place (then the new revision has `revision_expected = 1`). ANSWERED 2026-10-01 (design §5.1): the transcript is append-only and each message's lines are written once the message ends, so Claude assistant lines never get a revision past 0.
2. **Which stdout subtypes exist in production that these 5 captures lack?** Never seen: `result/error_*`, `system/api_retry`, `system/compact_boundary`, hook events, `permission_denials` contents, `keep_alive`. The normalizer must treat an unknown `system/<x>` as `schema_drift` and keep the raw line. Worth capturing a session that hits `--max-turns` and one that gets a 429.
3. **`atis-latch.atis`** is a 16-hex value written every turn that never changes inside a file. Its meaning is unknown; kept raw only.
4. **`remove.reason = delivered_to_agent`** (133 records) is inferred to mean a notification routed to a sub-agent's own context. Confirm against a transcript where a nested agent's child finished.
5. **`~/.claude/sessions/<pid>.json`**: ANSWERED by section 4.7. It is the `session-registry` source and fills `llm_sessions.os_pid`, `llm_sessions.liveness`, `llm_sessions.liveness_at`, `llm_sessions.last_activity_at` and `llm_sessions.session_kind`. Still open: whether a pid file can outlive a crashed process (`procStart` is the planned guard), and what the `.key` files hold (not a source, so not read).
6. **Resumed sessions and `cost-state`.** In `2774bd72` the snapshot's token totals are LOWER than the transcript's, while 5 other sessions agree within 1%. A resumed session may restart the count (`startTime` changes). If so `rollup_session.last_reported_cost_usd` for a resumed session needs a per-process sum before it is a fair cross-check.
7. **Journal lines have no timestamps.** Workflow agents get their times only from their own transcripts and the `workflowProgress` entries in `wf_<runId>.json` (`queuedAt`, `startedAt`, epoch ms), which exist only after the workflow finishes.
8. **Corrupt lines.** 6 lines in one session (`70e846f1…`, version 2.1.284) are two records spliced: a `queue-operation/remove` and a sub-agent line cut mid-string by a second record written into the middle (`…"reas{"parentUuid":…`). They are the only parse failures in about 1M records; it looks like two writers on one file. The reader should set `raw_records.parse_error` on the line and, optionally, try to recover the inner record by finding the second `{"parentUuid"` or `{"type"` start.
9. **Counts are a snapshot.** The corpus grows while it is analysed (a sub-agent file that had no transcript at the first scan had one at the second). Counts in this file come from the census unless marked rescan.

## Columns the schema lacks

Resolved 2026-10-01: `workflowProgress[]` per-agent totals map to each workflow agent's own `background_tasks` row (`reported_tokens`, `reported_tool_uses`, `reported_duration_ms`); no new column.


- Per-agent token and tool-call totals from a workflow summary's `workflowProgress[]` (`tokens`, `toolCalls`, `startedAt`, `queuedAt`): no column on `llm_sessions` or `background_tasks` holds a per-agent reported total, so they stay raw only. The agents' own transcripts give exact usage; only the `background_tasks.reported_*` columns take the workflow-wide totals.
