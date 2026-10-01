# Field map: Antigravity CLI (`agy`) to chronicle-llm tables

Status: draft for review, 2026-10-01. Written against `schema.md` and `design.md` (neither edited). Evidence: a full
decode of every conversation database under `~/.gemini/antigravity-cli/` (307 `.db` files, 304 with steps, 73,165
step rows, 35,601 `gen_metadata` rows, 1,223 `executor_metadata` rows), the 175 sub-agent link files, 2,019 message
files, 304 `transcript_full.jsonl` files, `history.jsonl`, and one live `agy -p --output-format stream-json` capture
joined to its database (`tmp/agy-live-stdout.txt`, `tmp/agy-live-changes.json`). Scratch scripts and censuses:
`tmp/fm-agy-*.py`, `tmp/fm-agy-census.json` (every protobuf path, count and value sample), `tmp/fm-agy-census2.json`
(first and last time each path was seen), `tmp/fm-agy-c2.json` (typed tool results per tool).

## 0. How to read this file

**No `.proto` is published.** Field numbers come from raw wire decoding (`tmp/schema-agy-wire.py`). Meanings are
`C` confirmed by a value correlation I ran (stated in the Notes), `I` inferred, or `U` unknown (kept raw).

| Notation | Meaning |
|---|---|
| `metadata.9.3` | protobuf field-number path inside the `metadata` column of `steps`. Repeated fields are written once; a path ending `[]` repeats. |
| `Timestamp` | a message `{1: seconds since epoch, 2: nanos}`. Convert to ms: `1*1000 + 2/1e6`. Written `ts` below. |
| `Duration` | the same two-field shape, as an elapsed time. |
| proto3 zero | a field equal to 0 or empty is OMITTED on the wire. `metadata.20.2` absent on step 0 means 0. Normalizers must default absent ints to 0. |
| `<conv>` | the conversation uuid; `run_id = 'antigravity:<conv>'`. |
| `[bytes]` | opaque, kept in the raw archive, never broken out. |

**Ids used throughout** (derived keys, never invented per read):

| Table row | Key | Source |
|---|---|---|
| `runs` | `antigravity:<conv>` | file name of `conversations/<conv>.db` == `trajectory_meta.cascade_id` == `steps.metadata.20.4` (C: all 307 equal) |
| `events` | `<run_id>:step:<idx>` | `steps.idx`; also `steps.metadata.20.2` (C: equals `idx` for every step; absent when idx = 0) |
| `messages` (API call) | `antigravity:<conv>:gen:<gen idx>` | `gen_metadata.idx`; a step's generation is `steps.metadata.20.3` (C, section 1.7) |
| `turns` | `<run_id>:<execution_id>` | `steps.metadata.12` == `executor_metadata.9` (C) |
| `tool_calls` | `<run_id>:<call_id>`, suffixed `~2`, `~3` for a repeat of the same id in one run | see section 7.2: `call_<n>` ids REPEAT inside one conversation (31 times) and across conversations (628 ids) |
| `errors` | `<run_id>:step:<idx>` for a type-17 step, `<run_id>:gen:<gen idx>` for a failed generation | |
| `background_tasks` | `<run_id>:task-<n>` | `task_details.1` is `<conv>/task-<n>`, `n` = idx of the launching step (C) |

**Versions.** The conversation databases carry NO harness version. It lives outside them (section 8). Eras seen:
`<=1.2.5` (only evidence: one `last-stdin.json` written 2026-09-17), `1.2.7` from 2026-09-22 01:25 UTC,
`1.2.12` from 2026-09-27 18:15 UTC, `1.2.14` from 2026-10-01 19:54 UTC (three conversations). Conversations per era
(by first step time): 200 before the first log, 43 on 1.2.7, 58 on 1.2.12, 3 on 1.2.14. SQLite `user_version` is 1 for all.

**Open mode.** A conversation `.db` with a `-wal` file next to it (about nine today) opens `mode=ro` only; every other
one opens `mode=ro&immutable=1`. Both a cold read and the live capture saw agy recreate empty `-wal`/`-shm` files when a
plain `mode=ro` reader closes, so prefer `immutable=1` or a copy for the cold ones.

## 1. `conversations/<conv>.db`

Seven tables (C: identical in all 307 files):

```sql
steps(idx PK, step_type, status, has_subtrajectory, metadata, error_details, permissions, task_details,
      render_info, step_payload, step_format)          -- has_subtrajectory always 0, step_format always 0
gen_metadata(idx PK, data, size)                        -- one row per model request, size == length(data)
executor_metadata(idx PK, data)                         -- one row per finished turn (execution)
trajectory_meta(trajectory_id PK, cascade_id, trajectory_type, source)   -- one row; type always 4, source always 17
trajectory_metadata_blob(id PK 'main', data)            -- one row
parent_references(idx PK, data)                         -- 0 rows in every file
battle_mode_infos(idx PK, data)                         -- 0 rows in every file
```

Row identity for `raw_records`: `sub_table` is the table name; `pos` is `idx` for `steps`, `gen_metadata`,
`executor_metadata`, and 0 for the two single-row tables. `record_type` is `step/<step_type>`, `gen`, `executor`,
`trajectory-meta`, `trajectory-blob`.

### 1.1 `steps.step_type` and `steps.status`

Step types in the corpus (no other value exists):

| `step_type` | Name | Count | `steps.metadata.3` source | Becomes |
|---|---|---|---|---|
| 14 | USER_INPUT | 477 | 4 (USER_EXPLICIT) | `events` kind `user-message`, a `turns` boundary |
| 15 | PLANNER_RESPONSE | 35,492 | 2 (MODEL) | `events` kind `assistant-block`, one `messages` + `usage` row, `content_blocks` |
| 132 | GENERIC (one tool call and its result) | 34,402 | 2 (MODEL) | `events` kind `tool-result`, `tool_calls`, `tool_results` |
| 17 | ERROR_MESSAGE | 492 | 5 (SYSTEM) | `events` kind `error`, `errors` |
| 23 | CHECKPOINT (context compaction) | 151 | 5 (SYSTEM) | `events` kind `compaction`, `compactions`, one `usage` row |
| 101 | SYSTEM_MESSAGE | 2,151 | 5 (SYSTEM) | `events` kind `system`, `turns`, `background_tasks`, `hook_runs` |

Status values (`steps.status` always equals `step_payload.1.4`, C: 73,165 of 73,165; `steps.step_type` equals
`step_payload.1`, C). The live capture and the final rows give the transition history in `metadata.26`.

| Status | Name | Terminal | Seen in cold DBs | How I know | Becomes |
|---|---|---|---|---|---|
| 1 | PENDING | no | never | live: a tool step is created at 1, then 2 | `tool_calls.status = 'pending'` |
| 2 | RUNNING | no | never | live: tool 1 then 2 then 3 | `'running'` |
| 8 | GENERATING | no | never | live: planner 8 then 3, the text streams in `step_payload` while at 8 | provisional message |
| 9 | WAITING for approval | no | only inside a history | final rows hold `1,2,9,2,3` (6 steps) | time in 9 is user wait |
| 3 | DONE | yes | 72,111 | | `'ok'` |
| 4 | INVALID | yes | 9 (all type 132, history `1,4`) | the tool name does not exist (`git status`, `mcp_dungeonmaster_dungeonmaster_bash`) or an argument is missing (`missing property 'ToolName'`); `error_details` present | `'error'`, cause `invalid-tool` |
| 5 | CLEARED | yes | 150 type 15, 141 type 132, 5 type 14, 9 type 101, 1 type 23, ALL in `fe62b455` idx 0 to 305 | I: the step keeps only `{1,4,5}` of its payload; the body (`20`, `19`, `140`, `30`, `114`) is stripped; history still ends in 3 (or 7) | NOT a new result: keep the earlier row (section 9) |
| 6 | CANCELED | yes | 116 type 132 (102 `run_command` with `task_details`, 10 `run_command` without, 3 `call_mcp_tool`, 1 `manage_task`); history `1,2,6` | I: the final transition is 6, completion time `metadata.8` is set, the model carried on (the next step exists). The earlier fieldmap called this "RUNNING never finalized"; that is wrong, it is terminal | `'interrupted'` |
| 7 | ERROR | yes | 623 type 132 (history `1,2,7`), 2 of type 132 with col 5 | `error_details` populated | `'error'`, `'denied'` by cause (section 7.5) |

Complete (status column, history) pairs in the corpus: 14 `(3|3)` 472; 14 `(5|3)` 5; 15 `(3|8,3)` 35,342; 15 `(5|8,3)` 150;
17 `(3|3)` 492; 23 `(3|3)` 150; 23 `(5|3)` 1; 101 `(3|3)` 2,142; 101 `(5|3)` 9; 132 `(3|1,2,3)` 33,507;
132 `(3|1,2,9,2,3)` 6; 132 `(4|1,4)` 9; 132 `(5|1,2,3)` 139; 132 `(5|1,2,7)` 2; 132 `(6|1,2,6)` 116; 132 `(7|1,2,7)` 623.

**The non-terminal set to re-read is `{0, 1, 2, 8, 9}`.** A cold file has none of them, so a `status IN (1,2,8,9)` row
means agy is still writing (or crashed).

### 1.2 `steps.metadata` (identical envelope on every type; also the bytes of `step_payload.5`)

C: `step_payload.5` is byte-identical to the `metadata` column for 73,165 of 73,165 rows. So the envelope is read from
the column and `step_payload.5.*` is the same data (not repeated below).

Count in corpus: every step. Versions: `1.2.5?` to `1.2.14`. Feeds: `events`, `messages`, `turns`, `tool_calls`,
`usage`, `runs`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `metadata.1` | `Timestamp` the step row was created | `1790884517` s `165045583` ns | `events.ts`; `tool_calls.requested_at` (type 132); `messages.started_at` (type 15) | present on every step; for a planner step this is when the request started |
| `metadata.3` | source enum | `4` user, `2` model, `5` system | `events.is_meta` (always 0, see Notes); `turns.origin` hint | C: type 14 always 4, 15 and 132 always 2, 17/23/101 always 5. `transcript_full.jsonl` spells them `USER_EXPLICIT`, `MODEL`, `SYSTEM`. Every type-101 step is shown to the model, so `is_meta = 0`; only a message file with `hideFromUser` sets `is_meta = 1` |
| `metadata.4` | ToolCallMetadata: the call this step is | `{1:'call_872251',2:'run_command',3:'{"CommandLine":"ls -la"}'}` | see `.4.*` | type 132 only (34,402 of 34,402) |
| `metadata.4.1` | call id | `call_872251`, `call_778352`, `call_391817` | `tool_calls.native_call_id`; `tool_calls.tool_call_id` (key, with the `~n` rule) | NOT unique: see 7.2 |
| `metadata.4.2` | tool name | `run_command`, `view_file`, `call_mcp_tool` | `tool_calls.tool_name` | for `call_mcp_tool` the real tool is in the args (section 1.5) |
| `metadata.4.3` | arguments as a JSON string | `{"CommandLine":"ls -la packages/local-eslint/src/g…` | `tool_calls.input_json` / `input_blob_hash` / `input_summary` | includes UI labels `toolAction` and `toolSummary`, strip them from `input_json` |
| `metadata.4.7.2.1` | thought signature bytes for this call | `0169147d136670d6dd1e9bfe57540e0928489b06…` | raw only | opaque; 34,177 rows; Gemini thought signature |
| `metadata.6` | `Timestamp`: model finished (type 15) or tool execution began (type 132) | | `messages` generation end; `tool_calls.started_at` fallback | for a tool step it equals the `RUNNING` transition only when no permission wait happened; prefer `metadata.26` status 2 |
| `metadata.7` | `Timestamp`, equals `.6` in every sampled row | | raw only | I: end of the model/exec start; redundant |
| `metadata.8` | `Timestamp` completed | | `events` completion; `messages.completed_at`; `tool_calls.completed_at`; `usage.ts` | C (live): stdout `duration_seconds` == `metadata.8` minus `metadata.1` (to the millisecond, steps 1 to 10). Absent on user inputs except 3 rows |
| `metadata.9` | ModelUsageStats | see section 1.4 | `usage.*` | type 15 only |
| `metadata.11` | model enum number | `1319`, `1318`, `1322`, `1036`, `1026` | `usage.model` via enum map (section 1.4) | equals `metadata.9.1` (C) |
| `metadata.12` | execution id (the turn) | `4e0eba7a-71e5-41fc-b53a-6d504c147d24` | `events.turn_id`, `turns.turn_id` | C: equals `executor_metadata.9` and `gen_metadata.4`; absent on 14 rows with no turn |
| `metadata.20.1` | trajectory id | `af1d3b62-4a1c-47a7-9fb4-905783ae00ec` | raw only | C: equals `trajectory_meta.trajectory_id` |
| `metadata.20.2` | this step's `idx` | `1`, `3`, `5` | key check | C: equals `idx` in every step |
| `metadata.20.3` | the generation (`gen_metadata.idx`) that produced this step | `0`, `1`, `2` | `events.message_id = '<conv>:gen:<20.3>'` | C: for every type 15 and 132 step, and 100% match to the `gen_metadata.2` list. For 14, 17, 23 and 101 it is the count of generations so far, not an owner |
| `metadata.20.4` | conversation id | `7b87f551-f82a-4c08-af52-dea8303cb855` | `runs.native_id` check | |
| `metadata.26[]` | repeated `{1: status, 2: Timestamp}`, the full transition history | planner `8,3`; tool `1,2,3`; with approval `1,2,9,2,3` | `tool_calls.started_at` (status 2 ts); `tool_calls.waiting_ms` PROPOSED (9 to 2 gap) | C: the FINAL row holds the whole list (the live sampler saw one entry mid-flight). `metadata.8 - metadata.1` equals the last entry |
| `metadata.28` | summarizer ModelUsageStats | type 23 only: `{2:{2:3104,3:3041,5:56872,6:24,7:'bot-…',9:1383,10:1658}}` | `usage.*` for the compaction call | section 1.6; `28.4` is a hash string (`3052bf6b99929a5c`), U |
| `metadata.29` | the provider's own tool call id and name, when the model is Claude | `{1:'toolu_vrtx_01RWE1s9…',2:'run_command',3:'{…}'}` | `tool_calls.native_call_id` alternative | 5 rows, first seen 2026-09-22 (1.2.7); `4.1` stays `call_<n>`; keep `4.1` as the key |
| `metadata.32` | `Timestamp`, equals `.8` within ms | | raw only | present on 34,393 of 34,402 type-132 and 35,492 type-15 rows; I: UI render time |
| `metadata.33` | int `1` | `1` | raw only | 1,244 type-101 rows (those whose `114.4` carries a sender); U |
| `metadata.34[]` | repeated policy decision `{3: arg ctx, 4: 'allow'\|'deny', 5: message}` | `allow` ×37,386, `deny` ×183 | `hook_runs` (deny only, section 7.6) | 0, 1 or 2 per step. The `deny` text is the pre-tool hook's refusal (`🛑 New code quality violations detected:…`, `BLOCKED: Native search tools are disabled…`). `34.3` (`{1:'CommandLine',2:{3:'cd worktrees/…'}}`) appears on 5 rows |
| `metadata.38` | int | `1` (32,003), `3` (2,395) | `tool_calls.tool_server` hint | C: `3` for all `call_mcp_tool` except one, `1` for built-ins; I: tool provider class |

Drift: `metadata.29` and `34.3` first appear 2026-09-22 01:31 UTC (1.2.7). Nothing in the envelope vanished.

### 1.3 `steps` type 14: USER_INPUT

Count 477 (472 DONE, 5 CLEARED). Absent from some conversations (a child's first step is a type 101 in 4 files).
Versions all. Feeds `events` (kind `user-message`), `turns` (origin `user`; a child's first input is the parent's
prompt, origin `queued`).

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `step_payload.19.2` | the raw user text | `Run \`echo hi\` then reply with one word.` | `events.text_preview`, `content_blocks` text (`blob_hash` when over 4 KB) | present on 472; absent on the 5 CLEARED rows. `transcript_full.jsonl` wraps it in `<USER_REQUEST>…</USER_REQUEST>`; the DB text is unwrapped |
| `step_payload.19.3` / `.19.3.1` | the same text in a wrapper message | `19.3.1` equals `19.2` | raw only | C: `19.3.1` equals `19.2` on 374 rows; `19.3.2` empty on 4 rows (media, U) |
| `step_payload.19.4` | empty string | | raw only | 301 rows |
| `step_payload.19.12` | per-turn run configuration snapshot (first turn of a run) | `{1:{1:1320,13:{42:{2:['command(*)',…]}},46:{…},57:{…}},12:'file:///home/…'}` | raw only | 301 rows. Large, repeated every turn; the archive dedupes by hash. Sub-paths: `.1.1` model enum, `.1.13.42.2` allow-list rules (`command(*)`, `mcp(*)`, `read_file(<path>)`), `.1.15.1` model enum, `.1.42.11` the system-info string, `.1.46.2/3/4/5/6/7/8/11` prompt section names, enabled tools (`view_file`, `run_command`…), message-delivery and stop-check hooks, `.1.57.1.5` skill names, `.1.57.2.2` sub-agent type names, `.12` workspace folder URI, `.3.17` int `1` |
| `step_payload.19.13` | the same snapshot on later turns | 173 rows | raw only | same shape as `19.12`; `19.12.1.13.54` vanished after 2026-09-22 05:49 (1.2.7) |
| `step_payload.19.18.3.1` | `{1: 0, 3: 1}` | | raw only | 301 rows, U |

The `step_payload.1/.4/.5` triplet and `metadata.*` follow section 1.2. `error_details`, `permissions`,
`task_details`, `render_info` are NULL on every type-14 row (C: 477 of 477).

### 1.4 `steps` type 15: PLANNER_RESPONSE (and its usage)

Count 35,492 (35,342 DONE, 150 CLEARED). Versions all. Feeds `messages`, `usage`, `events`, `content_blocks`, `tool_calls`
(through `20.7`).

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `step_payload.20.1` | assistant text | `I have started the ward checks for \`packages/local…` | `content_blocks` text (`block_type 'text'`), `events.text_preview` | only 2,235 of 35,342 DONE planner steps have text (a step that only calls tools has none) |
| `step_payload.20.8` | the same text again | | raw only | C: 2,226 equal `20.1`; 9 rows have `20.1` only |
| `step_payload.20.3` | model thinking summary | `**Prioritizing Tool Usage**\n\nI'm focusing intent…` | `content_blocks` `'thinking'` | 6,740 rows; text, not just a signature (unlike Claude's empty thinking) |
| `step_payload.20.11` | `Duration` spent thinking | `{1:3,2:36956385}` | raw only | 6,740 rows, always with `20.3` |
| `step_payload.20.6` | provider message id | `bot-61cf1612-fe15-4e5d-b64f-c4e314d9183b` | `messages.message_id` suffix: native id | C: equals `metadata.9.7` (35,342 of 35,351 comparable) |
| `step_payload.20.7[]` | one tool call the model made | `{1:'call_872251',2:'run_command',3:'{"CommandLine":…}'}` | `tool_calls` + `content_blocks` `'tool_use'` | 34,261 calls in 34,079 steps (0 to 9 per step). `.7.1` id, `.7.2` name, `.7.3` args JSON, `.7.7.2.1` thought signature bytes (34,036). Joins to the type-132 step by call id, see 7.2 |
| `step_payload.20.12` | stop reason enum | `2` (35,319), `18` (12), `17` (9), `16` (1), `14` (1) | `messages.stop_reason`: `'tool_use'` when `20.7` is non-empty, `'end_turn'` when `2` without calls, `'agy:<n>'` otherwise | I: 2 is normal. `17` follows a tool step; `18` is followed by an error step or a user turn. Meaning of 14 to 18 UNCONFIRMED, so the raw number stays |
| `step_payload.20.13[]` | web citation `{1:{1:{1:start,2:end,3:url}},2:snippet}` | url of a GitHub file | raw only | 1 row |
| `step_payload.20.14` | thought signature | `EuQECpIBCBIQAhgC…` (base64-looking) or `{2:{1:bytes}}` | raw only | 1,242 rows; opaque |
| `metadata.9` | ModelUsageStats (below) | | `usage` | the only per-call usage; also repeated in `gen_metadata.1.4` (C: all six numeric fields equal for 35,492 of 35,492) |

**`metadata.9` ModelUsageStats and the normalised `usage` row.** This is the translation the harness definition's `usage` part declares.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `metadata.9.1` | model enum number | `1319`, `1318`, `1322`, `1036`, `1026`, `1035`, `1073`, `1320` | `usage.model` through the enum map below | |
| `metadata.9.2` | input tokens, UNCACHED | `19005`, `3524`, `4078` | `usage.input_tokens` | C (live): equals stdout `usage.input_tokens`. A call with `9.5` of 16,277 shows `9.2` of 3,524, so the prompt was 19,801 |
| `metadata.9.3` | output tokens, including reasoning | `208`, `186`, `423` | `usage.output_tokens` | C: `9.3 == 9.9 + 9.10` for 35,492 of 35,492 |
| `metadata.9.4` | cache WRITE tokens | never present | `usage.cache_write_tokens = 0`, `cache_write_5m/1h = NULL` | C: absent in every row, Gemini and Claude alike. agy cannot tell us cache writes |
| `metadata.9.5` | cache READ tokens | `16277`, `16265`, `20378` | `usage.cache_read_tokens` (0 when absent) | absent on 1,626 rows; stdout `cache_read_tokens` equals it |
| `metadata.9.6` | provider id | `24` (35,440), `26` (52) | `usage.provider`: `24` is `'google'`, `26` is `'anthropic'` | C: 26 only on the `claude-*` models |
| `metadata.9.7` | provider message id | `bot-d8b3c696-5eab-49cb-8a8d-737c5157c264` | `messages.message_id` suffix: native id in `details` | |
| `metadata.9.8` | `{1:'sessionID', 2:'-3750763034362895579'}` | | raw only | |
| `metadata.9.9` | thinking (reasoning) tokens | `11`, `12`, `7` | `usage.reasoning_tokens` (0 when absent) | absent on 2,129 rows |
| `metadata.9.10` | response (visible output) tokens | `82`, `80`, `87` | raw only | `usage.output_tokens` already contains it |
| `metadata.9.11` | provider response id | `MfeuaqjgLMqf-8YPxZbomQE`, `prq-atjEIOScqtsPhoCwaA` | `messages.request_id` | a string; the decoder's guessed sub-paths `9.11.5`..`9.11.15` are string bytes mis-read as messages (99 rows), ignore |

Derived columns for `usage`:

| `usage` column | Derivation |
|---|---|
| `message_id` | `antigravity:<conv>:gen:<metadata.20.3>` |
| `ts` | `metadata.8` |
| `model` | `gen_metadata.1.19` of the same generation (`gemini-3.8-flash`, `claude-opus-4-6-thinking`); fall back to the enum map |
| `input_tokens` | `9.2` |
| `cache_read_tokens` | `9.5 or 0` |
| `cache_write_tokens` | `0` |
| `output_tokens` | `9.3` (reasoning is inside it) |
| `reasoning_tokens` | `9.9 or 0` |
| `context_tokens` | `9.2 + 9.5` (what the model saw). agy's own gauge `gen_metadata.1.9.10.1` is about 7,000 higher (26,428 against 19,005 on the first live call) and stays raw |
| `context_limit` | `gen_metadata.1.9.10.4` (`256000` for 34,116 rows, `128000` for 1,430, `160000` for 55) |
| `est_cost_usd` | `pricing` by model name; `gemini-3.8-flash-tiered` (enum 1322) is a tiered price |
| `service_tier`, `speed`, `web_*`, `prompt_eval_ms`, `eval_ms` | NULL |

Model enum map (C: from joining `metadata.9.1` to `gen_metadata.1.19`, all 35,492 steps):
`1319` and `1318` and `1320` to `gemini-3.8-flash`; `1322` to `gemini-3.8-flash-tiered`; `1036` to `gemini-3.1-pro-low`;
`1073` to `gemini-3.6-flash`; `1026` to `claude-opus-4-6-thinking`; `1035` to `claude-sonnet-4-6`. The reasoning effort
lives on the turn: `executor_metadata.10.1.28` is `gemini-3.8-flash-low` or `-medium` or `-high` (section 1.8).

stdout `total_tokens` equals `input_tokens + output_tokens` and EXCLUDES cache reads (C: 3,524 + 186 = 3,710). Do not
store it.

### 1.5 `steps` type 132: GENERIC (one tool call with its result)

Count 34,402. Versions all. Feeds `events` (kind `tool-result`), `tool_calls`, `tool_results`, `file_touches`,
`background_tasks`, `hook_runs`, `errors` (no). Tool mix: `view_file` 14,017, `run_command` 6,955, `manage_task` 6,499,
`replace_file_content` 2,985, `call_mcp_tool` 2,375, `write_to_file` 538, `schedule` 327, `manage_subagents` 275,
`send_message` 186, `invoke_subagent` 159, `search_web` 34, `list_resources` 21, `list_dir` 17, `define_subagent` 4,
`ask_question` 3, `find_by_name` 2, `read_url_content` 2, and 3 invalid names.

Envelope: section 1.2. Result and payload:

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `step_payload.140.1[]` | the arguments as repeated `{1: key, 2: value}` strings | `Cwd`, `WaitMsBeforeAsync`, `toolAction`, `toolSummary`, `CommandLine` | `tool_calls.input_json` (rebuild from `metadata.4.3`, which is the same data as JSON) | 34,259 rows; `toolAction`/`toolSummary` are UI labels in 34,398 steps (`Running tests`, `Run ward e2e tests`), drop them. Keys by tool (C): `run_command`: `CommandLine`, `Cwd`, `WaitMsBeforeAsync`, `IsDaemon`, `RunPersistent`, `RequestedTerminalID`; `view_file`: `AbsolutePath`, `StartLine`, `EndLine`, `ContentOffset`; `replace_file_content`: `TargetFile`, `TargetContent`, `ReplacementContent`, `StartLine`, `EndLine`, `AllowMultiple`, `Description`, `Instruction`; `write_to_file`: `TargetFile`, `CodeContent`, `Overwrite`, `Description`, `ArtifactMetadata`; `call_mcp_tool`: `ServerName`, `ToolName`, `Arguments`; `manage_task`: `Action`, `TaskId`, `Input`; `schedule`: `Prompt`, `DurationSeconds`, `TimerCondition`, `CronExpression`; `send_message`: `Recipient`, `Message`; `invoke_subagent`: `Subagents[]{TypeName, Role, Prompt, Model, Workspace}`; `manage_subagents`: `Action`, `ConversationIds[]`; `search_web`: `query`; `list_dir`: `DirectoryPath`; `ask_question`: `questions[]` |
| `step_payload.140.2.1` | result text shown to the model | `\nThe command exited with code 0.\nOutput:\npackag…` | `tool_results.text_preview`, `blob_hash`, `shape 'text'` | 33,790 rows; for `run_command` it embeds the exit code. Not always the full output: `output.txt` (below) is the full copy when the output was spilled (C: 46 of 94 sampled differ) |
| `step_payload.140.2.2[]` | result key/values | `{1:'task_id',2:'0199dc7f-…/task-241'}`, `tool_name`, `task_description`, `killed_conversation_ids` | `tool_results.details_json` | 6,396 rows (`manage_task`, `manage_subagents`) |
| `step_payload.140.2.3` | render card `{1 title, 2 body, 5 verb, 6 icon, 7 kind}` | `Root Agent`, `Messaged`, `send`; `Checked task`, `timer` | `tool_results.shape 'object'`; duplicate of `render_info` | 7,242 rows (`send_message`, `manage_task`, `manage_subagents`, `schedule`); 818 carry a body |
| `step_payload.140.2.4` | image result `{1: mime, 5: file path}` | `image/png`, `/home/…/brain/28…` | `content_blocks` `'image'` with `mime`; `artifacts` | 10 rows |
| `step_payload.140.2.6` | typed result: a `google.protobuf.Any` of `gemini_coder.Step` | `{1:'type.googleapis.com/gemini_coder.Step', 2:{…}}` | see below | 26,516 rows |
| `step_payload.140.2.7` | file URI of the spilled output | `file:///home/…/brain/<conv>/.system_generated/steps/2/output.txt` | `tool_results.persisted_path` | 20,117 rows; the file is the Claude `tool-results/` analogue |
| `step_payload.31.2` / `.31.3` | error text (the same twice) | `invalid arguments:\n- missing property 'ToolName'`, `tool call denied by pre-tool hook: 🛑 New code qua…` | `tool_results.text_preview`, `tool_calls.cause` | 632 rows, equal to the `error_details` column (C) |
| `step_payload.133`, `.147` | permission-request side data | `133.2.1 = {1:'read_file',2:'/home/…/.claude/statusline-command.sh'}`; `147.2.1 = <conv>` | raw only | 3 and 6 rows, U |
| `step_payload.148` | async command descriptor | `{1:'<conv>/task-42',2:'file://…/tasks/task-42.log',4:'npm run ward -- …',7:'Run ward checks'}` | equals the `task_details` column | 1,634 rows (C) |

**Typed result `140.2.6.2` (the embedded `gemini_coder.Step`).** Field `1` is the embedded step type, `4` its status
(3 or 7), `5` a copy of the metadata plus `.30` tool summary label and `.31` tool action label (a label, such as
`Listing directory contents`), `31` an error message, and ONE body at a field number that depends on the type:

| Tool | Embedded type (`.1`) | Body field | Body fields (path under `140.2.6.2`) | Maps to |
|---|---|---|---|---|
| `run_command` | 21 | `28` | `.28.2` cwd, `.28.6` EXIT CODE (explicit 0 on 5,774; absent on async and error rows), `.28.12` WaitMsBeforeAsync in ms, `.28.17/.18` terminal ids (`term-status`, `dm-walkthrough`), `.28.21` combined output, `.28.23` and `.28.25` the command line, `.28.26` output after an async completion, `.28.28` and `.28.35` int flags, `.28.31` shell (`bash`), `.31.2` error (`context canceled`, `failed to use persistent terminal…`) | `tool_results.exit_code`, `details_json` {cwd, wait_ms, terminal, shell}; `tool_results.text_preview` |
| `view_file` | 8 | `14` | `.14.1` file URI, `.14.2` start line, `.14.3` end line, `.14.4` content, `.14.11` and `.14.20` line counts, `.14.12` byte size, `.14.15` image `{1 mime,5 path}`, `.14.17` and `.14.18` skill link (`antigravity-guide`, `orchestrate`) when a skill file is read | `file_touches` (`op 'read'`); `details_json` {bytes, total lines} |
| `replace_file_content`, `write_to_file` | 5 | `10` | `.10.28.1` lines ADDED, `.10.28.2` lines REMOVED (C: matches the diff, +8 −2 on a 37-line replacement of 31), `.10.13.9` `target content not found in file` on failure, `.10.15` fuzzy-match diagnostic, `.10.26` the description, `.10.23` artifact metadata `{2 summary}` (10 rows) | `file_touches.lines_added`, `lines_removed` (`op 'edit'`, or `'create'` for `write_to_file` with `Overwrite=false`, else `'write'`) |
| `call_mcp_tool` | 38 | `47` | `.47.1` server name (`dungeonmaster_dungeonmaster`), `.47.2` `{1 call id, 2 tool name, 3 args JSON}`, `.47.3` result JSON text, `.47.8` spilled output URI | `tool_calls.tool_server = .47.1`; `tool_name` becomes `mcp__<server>__<tool>`; `tool_results.shape 'mcp-blocks'` |
| `invoke_subagent` | 127 | `143` | `.143.9[]` `{1 typeName, 2 role, 3 prompt, 4 int, 7 model enum, 8 int}`, `.143.10[]` `{1 child conversation id, 2 log URI, 3 workspace URI}` | `tool_calls.spawned_run_id` (the first child; one call can create several); `runs` |
| `search_web` | 33 | `42` | `.42.1` query, `.42.5` answer text, `.42.6.1`, `.42.7` ints | `tool_results.text_preview` |
| `list_dir` | 9 | `15` | `.15.1` directory URI, `.15.3[]` entries `{1 name, 2 is dir, 4 size}` | `file_touches` `'read'` (optional) |
| `list_resources` | 51 | `62` | `.62.1` server | raw only |
| `ask_question` | 138 | `154` | `.154.1` `{1 question, 2[] {1 id, 2 option}, 4, 6}` | raw only |
| `read_url_content` | 31 | `40` | `.40.1` url, `.40.2` page object, `.40.6` local copy path | raw only |
| `manage_task`, `send_message`, `schedule`, `manage_subagents`, `define_subagent`, `find_by_name` | none | none | the result is in `140.2.1`/`140.2.2`/`140.2.3` only | |

Failure and the status column: section 7.5. Timing for the tool: `requested_at = metadata.1`,
`started_at` = the status-2 entry of `metadata.26`, `completed_at = metadata.8`,
`latency_ms = completed_at - started_at`. Check (live, step 6 `sleep 5`): 2 at +0.033 s, done at +5.476 s.

**`error_details` column** (NULL except where noted). Count 632 rows (623 status 7, 9 status 4), all type 132.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `error_details.2` | error text | `declaring permissions: cortex tool view_file: convert tool call for permissions: model output error: invalid tool call e…`, `tool call denied by pre-tool hook: BLOCKED: Native search tools…`, `MCP tool call to server "dungeonmaster_dungeonmaster" timed out after 3m0s…` | `tool_results.text_preview`; classifies `tool_calls.cause` (7.5) | |
| `error_details.3` | the same text | | raw only | C: equals `.2` in all 632 |

**`task_details` column** (async or timer step). Count 1,634 (1,230 `run_command` DONE, 302 `schedule`, 102 `run_command` CANCELED).

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `task_details.1` | task id `<conv>/task-<step idx>` | `00b6776a-5abc-4011-9059-a6ac20450bd0/task-42` | `background_tasks.task_id` (`<run_id>:task-42`); `tool_calls.background_task_id` | C: the number is the launching step's idx |
| `task_details.2` | URI of the task's log file | `file:///home/…/brain/<conv>/.system_generated/tasks/task-42.log` | `tool_results.persisted_path`; `artifacts` | |
| `task_details.4` | command line | `npm run ward -- -- packages/local-eslint…` | `background_tasks` description; `tool_calls.input_summary` | |
| `task_details.7` | short description | `Run ward checks` | `background_tasks.result_preview` seed | |

**`render_info` column.** Count 7,242, the UI card for `send_message`, `manage_task`, `manage_subagents`, `schedule`.
Fields: `.1` title (`Root Agent`), `.2` body (818 rows), `.5` verb (`Messaged`, `Found`, `Checked task`, `Killed task`),
`.6` icon (`send`, `robot_2`, `task_alt`, `timer`), `.7` kind (`subagents`, `timers`, `schedules`; 597 rows).
Maps: `raw only` (a UI label; the same data is in `140.2.3`).

**`permissions` column.** Count 3 (all type 132): `{2:{1:{1:'read_file',2:'/home/…/.claude/statusline-command.sh'},2:1,5:'read_file',6:'/home/…'}}`.
Maps: `raw only` (a one-off permission request, 3 rows).

### 1.6 `steps` type 23: CHECKPOINT (compaction)

Count 151 (150 DONE with a body, 1 CLEARED). Versions all; `30.28` and `30.29` first appear 2026-09-27 18:32 UTC (1.2.12).
Feeds `compactions`, `usage` (the summarizer call), `events` (kind `compaction`), `background_tasks` (state carried).

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `step_payload.30.5` | the compaction summary (markdown) | `### 1. Outstanding User Requests\n- **Implement ES…` | `compactions.summary_blob_hash`; `content_blocks` text | 150 rows |
| `step_payload.30.12` | this checkpoint's own step idx | `207`, `35`, `315` | key check | C: equals `metadata.20.2`. The earlier map called it "covers up to"; it does not |
| `step_payload.30.15` | URI of the transcript file at the time | `file:///home/…/brain/<conv>/.system_generated/logs/…` | raw only | 28 rows |
| `step_payload.30.19` | the original user prompt, repeated | `You are the Batch Worker subagent for Phase 1 of t…` | raw only | 297 values in 150 rows |
| `step_payload.30.14[]` | artifacts `{1 name, 3 URI, 4 msg, 6 msg}` | `recipes-architecture-plan`, `set-25-status` | raw only | 30 entries |
| `step_payload.30.21[]` | background tasks still open `{1 task id, 2 tool, 3 description, 4 command, 6 step idx, 7 log URI}` | `0510aa41-…/task-370`, `run_command` | `background_tasks` hint | 40 entries |
| `step_payload.30.26[]` | accumulated state `{1 key, 2 label, 4 payload Any}` | keys `background_tasks`, `file_diffs`, `skill_used`, `active_goal` | raw only | 259 entries |
| `step_payload.30.1`, `.11`, `.20`, `.24`, `.25`, `.27`, `.28`, `.29` | counters and hashes | `30.27` `0` ×124, `30.28` `b5d23c6ed2864d379743547f99455e96` | raw only | U; `30.28`/`30.29` are 1.2.12+ |
| `metadata.28.2` | usage of the summarizer call | `{2:3104, 3:3041, 5:56872, 6:24, 7:'bot-d6ebdff2-…', 9:1383, 10:1658}` | `usage` row: `message_id = <conv>:ckpt:<idx>`, `input_tokens = 28.2.2`, `output_tokens = 28.2.3`, `cache_read_tokens = 28.2.5`, `reasoning_tokens = 28.2.9` | C: same shape as `metadata.9`; there is NO model field (`28.2.1` absent). Use the model of the preceding planner step and mark the `messages` row `is_synthetic = 0`. `provider` from `28.2.6` |

`compactions.trigger` is NULL (nothing on the row says auto or manual). `compactions.pre_tokens` is derived: the
`context_tokens` of the last planner step before the checkpoint (there is no field).

### 1.7 `gen_metadata` (one row per model request)

Count 35,601 rows (35,492 matched to a planner step, 109 failed requests with no planner step, see 1.9). Versions all.
Feeds `messages`, `usage` (model, limit), `errors`, `turns`. The `data` column is a protobuf message; field `2` is a
PACKED list of varints, so a generic decoder mis-reads it (`gen_metadata.2` shows as 600 phantom paths): decode field
2 as packed varints.

C: a generation's step list (`data.2`) contains every type-15 and type-132 step whose `metadata.20.3` equals this row's
`idx` (35,492 of 35,492 planner steps and 34,402 of 34,402 tool steps), plus 42 type-17 steps.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `data.1.19` | MODEL NAME | `gemini-3.8-flash`, `gemini-3.1-pro-low`, `claude-opus-4-6-thinking` | `messages.model`, `usage.model` | 35,492 rows (absent on failed requests); no effort suffix |
| `data.1.3` / `data.1.4.1` / `data.1.17.2.1` | model enum | `1319` | `usage.model` fallback | same enum as `metadata.9.1` |
| `data.1.4` | ModelUsageStats, the same as `metadata.9` | | `usage` check | C: equal on 35,492 of 35,492 rows |
| `data.1.17.2` | usage again (`.1`..`.11`) | | raw only | |
| `data.1.17.3` | error text for a failed request | `request failed: Post "https://daily-cloudcode-pa.g…`, `RESOURCE_EXHAUSTED (code 429): Individual quota re…` | `errors.message` | 516 entries in 131 rows |
| `data.1.17.4` | request hash | `60939bc57037d1e7` | raw only | 35,492 rows |
| `data.1.17.5` | error kind int | `1` (468), `3` (48) | `errors.kind` hint | U |
| `data.1.17.7[]` | retry info `{1: int, 2: hash}` | | raw only | 85 rows |
| `data.5` | top-level request error | `request failed: Post "https://daily-cloudcode-pa.g…`, `context canceled` | `errors.message` (`kind 'api-error'`) | 122 rows |
| `data.1.9.10.1` | agy's context-window gauge | `47427`, `26428` | raw only | about 7,000 above input plus cache read |
| `data.1.9.10.4` | context window size | `256000`, `128000`, `160000` | `usage.context_limit` | |
| `data.1.9.10.3` | context breakdown (System Prompt, Tools, Chat Messages) | | raw only | last row of each file |
| `data.1.9.1`, `.1.9.2` | ints (`18446744073709551615` ×19,417) | | raw only | U |
| `data.1.11` | `Duration`: model latency | `{1:1,2:767306133}` | `messages.completed_at` minus `started_at`; time to the end of generation | C: equals `metadata.6 - metadata.1` of the planner step. Not time to first token |
| `data.1.12` | `Duration`: post-processing | `{2:230670291}` | raw only | C: equals `metadata.8 - metadata.6` |
| `data.1.14` | int, 1 to 8 | `8`, `3` | raw only | 83 rows, U |
| `data.1.20[]` | key/value strings | `last_step_index`, `model_enum`, `trajectory_id`, `request_id` (`<trajectory>-<n>`), `used_claude`, `used_claude_conservative`, `used_non_gemini_model`, `last_execution_id` | `messages.request_id` ← the `request_id` value; `used_claude` is the Claude flag | 7 entries per row |
| `data.2` | packed varints: the step idxs this generation produced | `0x0102` is steps 1 and 2 | `events.message_id` join | |
| `data.4` | execution id | `2bd87c6d-d720-46b9-8605-52a220a6303f` | `messages.turn_id` | C: equals `steps.metadata.12` |
| `data.8` | 20 bytes | `889cb630a5c5c930f0b18f31f6b18f31f5e99531` | raw only | hash, U |
| `data.10` | int `1` | | raw only | 536 rows, U |
| `data.1.1`, `data.1.2[]`, `data.1.16[]`, `data.3.*` | THE FULL REQUEST SNAPSHOT: system prompt (`1.1`), the whole message list (`1.2`, `{1 bot id, 2 role 2/4/1, 3 content, 4 int, 6 tool call, 7 call id, 11 thinking, 18 step idx, 19 image}`), prompt sections (`1.16`), request config (`3.*`: `3.28` model plus effort, `3.6` token window, `3.57`) | `<Agent System Instructions>\nYou are the Batch Wor…` | raw only (the archive keeps it) | present ONLY in the newest row of a live conversation: the previous row is rewritten without it when the next one lands (section 9). A cold file has it on the last row alone (298 rows). 123 KB to 129 KB per row live |

Drift: `data.10` and `1.2.21` first seen 2026-09-22 and 2026-09-27 (1.2.7, 1.2.12).

### 1.8 `executor_metadata` (one row per finished turn)

Count 1,223. Versions all; `data.18` first seen 2026-09-27 18:16 UTC (1.2.12), `data.13` 2026-09-22 01:28 UTC (1.2.7),
`data.10.1.15` last seen 2026-09-20 (before 1.2.7). The row is written when the turn ENDS (live: at +20.4 s, after the summary
flipped to IDLE) and is never rewritten. Feeds `turns`, `usage` (effort), `errors`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `data.9` | execution id | `4e0eba7a-71e5-41fc-b53a-6d504c147d24` | `turns.turn_id` | C: equals `steps.metadata.12` |
| `data.1` | execution kind enum | `4` (1,091), `2` (103), `1` (29) | `turns.origin` hint | U |
| `data.2` | generations in this execution | `3`, `1` | raw only | C (live): 3 and 1 |
| `data.3` | last step idx of this execution | `8`, `10` | `turns.ended_at` lookup | C (live): steps 0 to 8, then 9 to 10 |
| `data.10.1.28` | model plus reasoning effort | `gemini-3.8-flash-low`, `gemini-3.8-flash-medium`, `gemini-3.1-pro-low` | `runs.model_first` (strip nothing); `usage.reasoning_effort` PROPOSED | C (live): equals the `--model` flag and stdout `init.model` |
| `data.10.1.1`, `.10.1.15.1` | model enum | `1319`, `1320` | raw only | |
| `data.10.1.6` | context window | `65536` | raw only | |
| `data.10.1.13.42.2[]` | permission allow-list rules | `command(*)`, `mcp(*)`, `read_file(<path>)` | raw only | |
| `data.10.1.46` | enabled prompt sections and tools | `identity`, `view_file`, `run_command` | raw only | |
| `data.10.1.43`, `.57`, `.30`, `.32`, `.35`, `.42`, `.21`, `.47`, `.51`, `.58`, `.59` | feature flags, sub-agent types, limits (`58`=`59`=`20000`) | | raw only | U |
| `data.10.2`..`data.10.13` | the run configuration (limits: `10.2.1` 50000, `10.2.5` 256000 or 128000, `10.2.11` 16384; stop-hook text at `10.2.20` and `10.4.23`; `10.12` workspace URI) | `You have been working on the task described above…` | raw only | U |
| `data.11` | 20 bytes | `889cb630…` | raw only | hash |
| `data.12` | the turn's failure text | `execution error: generating and executing: RESOURC…` | `errors` (`kind 'harness-error'`, or `'rate-limit'` for RESOURCE_EXHAUSTED); `turns` end | 29 rows |
| `data.13` | int `1` | | raw only | 70 rows, 1.2.7+ |
| `data.16.1.3` | msg | | raw only | 300 rows, U |
| `data.17` | `17.1`..`17.13`: another copy of the config for the next turn | | raw only | 1,223 rows (904 as messages) |
| `data.18.1[]` | skills `{1 kind enum, 2 name, 3 path, 4, 5, 6 source}` | `agy-customizations`, `antigravity-guide`, source `dungeonmaster` | raw only | 1.2.12+ |

### 1.9 `trajectory_metadata_blob.data` and `trajectory_meta`

Count 307 each, one per file. Written at conversation creation, before any step (live: at +1.6 s); never seen changing.
Feeds `runs`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `trajectory_meta.trajectory_id` | trajectory uuid | `af1d3b62-4a1c-47a7-9fb4-905783ae00ec` | raw only | equals `steps.metadata.20.1` (C) |
| `trajectory_meta.cascade_id` | the conversation id | `7b87f551-…` | `runs.native_id` | C: equals the file name (307 of 307) |
| `trajectory_meta.trajectory_type` | `4` | | raw only | constant |
| `trajectory_meta.source` | `17` | | raw only | constant |
| `data.1.1`, `data.1.2` | workspace folder URIs | `file:///home/brutus-home/projects/codex-of-consentient-craft` | `runs.cwd` (strip `file://`), `runs.repo_path` | 269 rows; absent when no workspace |
| `data.1.3.1`, `.1.3.2` | git repo name and remote | `StupidIncarnate/codex-of-consentient-craft`, `git@github.com:StupidIncarnate/codex-of-consentient-craft.git` | `runs.repo_path` hint (remote only, never stored with a token) | 261 rows |
| `data.1.4` | git branch | `master`, `gateway-pivot` | `runs.git_branch` | 261 rows |
| `data.2` | `Timestamp` the conversation was created | `1790040805` | `runs.started_at` | 307 rows |
| `data.3` | an opaque uuid | `a666067b-cfbd-4313-a87b-0fd2140e27d7` | raw only | C: NOT the trajectory id, NOT any conversation id, NOT the parent's trajectory (the earlier map was wrong); equals `raw_summary.17.3` |
| `data.5` | PARENT conversation id (children only) | `fe62b455-c1c7-46d3-b856-75aac0191f41` | `runs.parent_run_id`; `runs.kind = 'subagent'` | 175 rows; C: equals the `subagents/<child>.json` parent and `summaries.parent_conversation_id` |
| `data.6` | root conversation id | `fe62b455-…` | `runs.spawn_depth` support | C: equals `data.5` for the 175 children, equals the file's OWN id for the 132 roots. Depth is 0 or 1 only |
| `data.7` | workspace URI | `file:///home/…` | `runs.cwd` | 269 rows |
| `data.8` | sub-agent descriptor `{1 typeName, 2 role, 3 initial prompt, 4 int 1, 7 model enum, 8 int}` | `batch_worker`, `Phase 1 ESLint Rules Worker`, `You are the Batch Worker subagent…` | `runs.agent_type = 8.1`, `runs.agent_role = 8.2`, `runs.description = preview of 8.3` | 175 rows; `8.8` is 1, 3 or 4 (U); `8.7` is the model enum (`1319` ×84, `1322` ×47, `1036` ×43) |
| `data.4` | the sub-agent's resolved config (`4.1` typeName, `4.7` config tree, `4.8` description) | `Work subagent for executing code changes…` | raw only | 175 rows |
| `data.10` | sub-agent config (system prompt sections, tool names, model config) | `Identity`, `view_file`, `search_web`, `sandbox` | raw only | 175 rows (9 with a custom system prompt) |
| `data.15` | 20 bytes | | raw only | 132 rows (roots), hash, U |
| `data.17` | int `1` | | raw only | 175 rows |
| `data.18` | project id | `default-cli-project` | raw only | 307 rows; equals `summaries.project_id` |

`parent_references` and `battle_mode_infos` are empty in every file; the drift log still records them as `parsed = false`.

## 2. `conversation_summaries.db`

One SQLite file (WAL), one table `conversation_summaries`. Count 307 rows (one per conversation), `raw_summary` non-NULL in
all. Versions all. **Updated in place** through a conversation's life (the live capture: `step_count` 0 then 1 then 8 then 9
then 11, `status` RUNNING then IDLE then RUNNING then IDLE, `title` filled after the first reply). Feeds `runs`.
`sources.kind = 'sqlite-summaries'`, `raw_records.sub_table = 'conversation_summaries'`, `pos` = the SQLite rowid,
`record_type = 'summary'`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `conversation_id` | conversation uuid, PK | `00b6776a-5abc-4011-9059-a6ac20450bd0` | `runs.native_id` (join key) | |
| `title` | auto-generated title | `Asking For A Joke`, `System And File Operations` | `runs.title` | empty on 178 rows (children, and runs before the first reply) |
| `preview` | first prompt, truncated | `You are a sub-agent on the brands and gateways epic in the repo at /ho…` | `runs.description` fallback | |
| `step_count` | steps written | `4`, `5` | raw only | lags the DB (30 of 304 behind, 4 ahead); never a watermark |
| `last_modified_time` | datetime text | `2026-09-18 00:34:57.158548924+00:00`; `0001-01-01 00:00:00+00:00` for 3 empty conversations | `runs.last_activity_at` | file mtime is later by 30 s median, 36 min max |
| `workspace_uris` | JSON array text | `["file:///home/brutus-home/projects/codex-of-consentient-craft"]` | `runs.workspace_uris_json` | empty string on 38 rows |
| `status` | run status enum | `CASCADE_RUN_STATUS_IDLE` (all cold rows), `CASCADE_RUN_STATUS_RUNNING` (live) | `runs.end_state`: `'running'` for RUNNING, else `'exited'` | the only live signal that a run is open |
| `source` | always empty | `''` | `runs.entrypoint` set to `'agy'` | |
| `project_id` | | `default-cli-project` | raw only | |
| `agent_name` | sub-agent type name | `self`, `prompt-writer`, `batch_worker` | `runs.agent_type` check | 132 empty (roots) |
| `parent_conversation_id` | | `fe62b455-c1c7-46d3-b856-75aac0191f41` | `runs.parent_run_id` | 175 non-empty |
| `nesting_depth` | `0` (132) or `1` (175) | | `runs.spawn_depth` | |
| `battle_id`, `winning_conversation_id`, `group_id` | always empty | | raw only | |
| `not_fully_idle` | 0/1 | `0` ×307 | raw only | live: 1 while a child runs under a finished parent |
| `killed` | 0/1 | `1` ×68 | `runs.end_state = 'killed'` | |
| `last_user_input_time` | datetime text | `2026-09-18 00:34:35.344696413+00:00` | `turns.started_at` hint | `0001-01-01` on 7 rows |
| `last_user_input_step_index` | | `-1` ×289, `2`, `4764` | raw only | |
| `app_data_dir` | | `antigravity-cli` | raw only | |
| `raw_summary` | protobuf of the same data | see below | raw only | 807 bytes typical |

`raw_summary` paths (C: decoded on 307 rows): `1` title, `2` int (5, 4, 3), `3` `Timestamp` last modified, `4` conversation
id, `5` int 1, `7` `Timestamp` created, `9` workspace `{1 uri, 2 uri, 3 {1 repo, 2 remote}, 4 branch}`, `10` `Timestamp`
last user input, `15` title history, `16` int, `17` the trajectory-metadata block (`17.2` created, `17.3` the opaque
uuid, `17.4`/`17.8` descriptor, `17.5` parent, `17.6` root, `17.7` workspace, `17.18` project id), `22` `4`, `23` int 0/1.
Maps: `raw only` (every field is a duplicate of a column or of `trajectory_metadata_blob`).

## 3. `brain/<conv>/.system_generated/`

### `subagents/<child>.json` — the parent's link to one child (written when the sub-agent is spawned, rewritten when it is killed)

Count 175, one per child. Versions all. Feeds `runs` (parent link), `tool_calls.spawned_run_id`.
`sources.kind = 'subagent-link-json'`, `record_type = 'subagent-link'`, `pos = 0`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `conversationId` | the child | `d0f4641b-0a2c-4c22-8959-b551c8c7f8db` | `runs.native_id` of the child | the file name is the same id |
| `subagentDescriptor.typeName` | | `prompt-writer`, `self`, `batch_worker` | `runs.agent_type` | |
| `subagentDescriptor.role` | | `Track Denominator Rebuilder`, `Fixup Agent` | `runs.agent_role` | |
| `state` | | `SUBAGENT_STATE_ALIVE`, `SUBAGENT_STATE_KILLED` | `runs.end_state` (`'killed'`) | in-place update ALIVE to KILLED: `raw_revisions.expected = 1` |
| `spawnStepIndex` | parent step idx of the `invoke_subagent` step | `591`, `447`, `40` | `runs.spawned_by_tool_call_id` = that step's `metadata.4.1` | C: 175 of 175 resolve to an `invoke_subagent` step |
| `workspaceUris[]` | | `file:///home/…` | `runs.workspace_uris_json` | |

Read it with `trajectory_metadata_blob.5` as the cross-check. The `invoke_subagent` result text (`140.2.1`) also holds
`{conversationId,…}`, and one call can create SEVERAL children (`Subagents[]`), so several child files can share one
`spawnStepIndex`.

### `messages/<uuid>.json` — one inter-agent or task-completion message

Count 2,019, plus `read.json` and an `undelivered/` folder. Versions all. Feeds `agent_messages` PROPOSED,
`events` of the recipient (kind `system`, subtype `agent_message` or `task_notification`), `background_tasks`.
`sources.kind = 'agent-message-json'` PROPOSED, `record_type = 'agent-message'`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `id` | message id; the file name | `eb1c85a4-6747-4c14-9aa0-d4f360413384` | `agent_messages.message_id` | C: equals `step_payload.114.4.1` of the delivering type-101 step |
| `recipient` | recipient conversation | `f3f59f57-f05f-442a-8de1-264085b73ce1` | `agent_messages.recipient_run_id` | |
| `sender` | a conversation id, or `<conv>/task-<n>` for a background task, or `system` | `f3f59f57-…/task-2` | `agent_messages.sender_run_id` / `sender_task_id` | |
| `priority` | | `MESSAGE_PRIORITY_HIGH`, `MESSAGE_PRIORITY_LOW` | `agent_messages.priority` | step side: `114.4.5` is `3` for HIGH, `1` for LOW (I) |
| `timestamp` | RFC 3339 with nanoseconds, UTC | `2026-09-19T09:07:26.272047323Z` | `agent_messages.ts`, `events.ts` | |
| `renderDetails.messageTitle` | | `Run ward e2e tests finished`, `Message from Line Counter (research)` | `agent_messages.title` | 1,990 files |
| `content` | the text | `Task id "f3f59f57-…/task-2" finished with re…` | `agent_messages.text_preview` | 2,016 files |
| `sourceMetadata.tool.conversationId`, `.stepIndex`, `.toolCall.{id,name,argumentsJson,thinkingSignature}` | the tool call that produced it (a `send_message`, or the `run_command` that started a task) | `call_536885`, `send_message` | `agent_messages.source_tool_call_id` | 1,518 files |
| `hideFromUser` | | `true` | `events.is_meta = 1` | 112 files |
| `stepPayload` | base64 protobuf of the delivered step | `CA4gAyoQCgwIlu231QYQoLSbvwEYBJoB…` | raw only | 3 files |

`messages/read.json` is `{<message id>: true}`, rewritten as messages are read (`raw_revisions.expected = 1`);
Maps to: `agent_messages.read_at` PROPOSED (a boolean only, no time). `messages/undelivered/<uuid>` (5 files, empty folder in
the live run) holds a message not yet delivered: `raw only`.

### `logs/transcript_full.jsonl` and `logs/transcript.jsonl` — the harness's own text transcript

Count 304 each, 73,122 lines in `transcript_full` (the databases hold 73,165 steps: 29 error steps and 14 tool steps
never reach it). Versions all. **A diagnostic copy, NOT a source** (`sources` row with `priority 'history'`,
`raw only`): it has no call id, no usage, no model, no execution id and no millisecond time.
`transcript.jsonl` is the same with argument values JSON-quoted (`"CommandLine":"\"ls -la\""`); `chunks/transcript*/` are
the same lines split into files.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `step_index` | `steps.idx` | `0`, `1` | join key | |
| `type` | step type name | `USER_INPUT`, `PLANNER_RESPONSE`, `GENERIC`, `ERROR_MESSAGE`, `CHECKPOINT`, `SYSTEM_MESSAGE` | | |
| `source` | | `USER_EXPLICIT`, `MODEL`, `SYSTEM` | | |
| `status` | | `DONE`, `RUNNING` (1,635), `ERROR` (625), `INVALID` (9) | | async steps stay `RUNNING` forever (stale snapshot); statuses 5 and 6 appear as DONE and RUNNING |
| `created_at` | whole seconds, UTC | `2026-09-19T09:06:29Z` | | |
| `content` | the text; a tool step starts `Created At: <local time with offset>\nCompleted At: …` | | | local time with offset: `2026-10-01T12:55:19-07:00` |
| `thinking` | | | | 6,769 lines |
| `error` | | `API error (attempt 1): RESOURCE_EXHAUSTED (code 429)…` | | 1,097 lines |
| `tool_calls[].name`, `.args.*` | the call, without an id | | | 34,402 |
| `media[].mime_type`, `.uri` | | `image/png` | | 10 lines |

### other files under `.system_generated/` and `brain/<conv>/`

| Path | Count | Meaning | Maps to |
|---|---|---|---|
| `steps/<idx>/output.txt` | 20,185 | full output of tool step `<idx>`; the URI is `140.2.7` | `tool_results.persisted_path`, `artifacts` (`origin 'spill-file'`, read once) |
| `steps/<idx>/content.md` | 1 | | `raw only` |
| `tasks/task-<n>.log` | 1,635 | the output of async command `task-<n>`; the URI is `task_details.2` | `background_tasks.result_preview`, `artifacts` (`'spill-file'`) |
| `terminals/.env` | 17 | terminal environment (may hold secrets) | NEVER read or archived |
| `.tempmediaStorage/*.png`, `.user_uploaded/` | 10 | images | `artifacts` (`'image'`) |
| `scratch/`, `.agents/agents/<type>/*.md`, `brain/<conv>/*.md/.json` | few | files the agent wrote | `raw only`, not read |

## 4. `history.jsonl`, `last-stdin.json`, `log/cli-*.log`

### `history.jsonl` — one line per prompt typed at the interactive prompt

Count 270 lines, from 2026-09-17. `-p` runs are NOT in it (the live capture's conversation is absent). Feeds
`runs.is_interactive`. `sources.kind = 'history-jsonl'` PROPOSED (or `transcript-jsonl`), `record_type = 'history'`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `display` | text typed | `hello`, `joke?`, `/logout` | `raw only` (a preview for debugging) | |
| `timestamp` | ms since epoch | `1789691636365` | `turns.started_at` hint | |
| `workspace` | cwd of the prompt | `/home/brutus-home/projects/codex-of-consentient-craft` | `runs.cwd` fallback | |
| `type` | `slash_command` | | `interventions` (mode-change) optional | 46 lines |
| `conversationId` | | `f3a2f70f-078b-4297-83b1-7cd9412475d4` | `runs.is_interactive = 1` | 235 lines; absent on slash commands |

### `last-stdin.json` — the statusline command's stdin payload (last written)

Count 1 file (written 2026-09-17). `raw only`, but it is the ONLY evidence of the oldest version:
`{"version":"1.2.5","model":{"id":"Gemini 3.8 Flash (Medium)","effort":"medium"},"context_window":{…},"quota":{"3p-5h":{…}}}`.
Feeds `harness_versions` PROPOSED.

### `log/cli-<YYYYMMDD_HHMMSS>.log` — language-server logs (local time in the name)

Count 64. First useful line: `I0927 11:14:41.543353 66 server.go:1635] Language server version: 1.2.7`. Feeds
`harness_versions` PROPOSED. Not otherwise parsed.

## 5. Live stdout: `agy -p --output-format stream-json`

NDJSON, one JSON object per line, three event kinds (C: `tmp/agy-live-stdout.txt`, one run of 4 root steps and one
sub-agent; 0 non-JSON lines in the stream). Text mode (`-p` alone) prints the final text at the end only.
`sources.kind = 'stdout-spool'`, `record_type = 'stdout/init'`, `'stdout/step_update'`, `'stdout/result'`.
The stream has NO timestamps: stamp each line with the server's receive time.

**Join key to the database:** `(conversation_id, step_index)` equals `(cascade_id, steps.idx)` of
`conversations/<conv>.db`. A stdout line has no call id, no message id, no model and no usage on tool steps; those come
from the row. `step_update` is emitted several times per index (`ACTIVE`, then `DONE` or `ERROR`).

### `init` — first line

Count 1 per run. Feeds `run_inits`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `event` | `init` | | record kind | |
| `conversation_id` | the run | `7b87f551-f82a-4c08-af52-dea8303cb855` | `runs.native_id` | |
| `init.model` | requested model plus effort | `gemini-3.8-flash-low` | `run_inits.model`, `runs.model_first` | C: equals `executor_metadata.10.1.28` |
| `init.cwd` | | `/home/brutus-home/projects/codex-of-consentient-craft/tmp/agy-live-ws` | `runs.cwd` | |
| `init.tools[]` | the tool names (58 in this run) | `ask_question`, `run_command`, `view_file`, `call_mcp_tool` | `run_inits.tools_json` | |
| `init.permission_mode` | | `always-proceed` (the `--dangerously-skip-permissions` run) | `run_inits.permission_mode`, `runs.permission_mode` | no database equivalent |
| (none) | harness version | | `run_inits.harness_version` from `harness_versions` | init carries no version |

### `step_update` — one line per step state change

Count 1 per state per step (live: 56 lines for 11 steps; 42 of them carry a `text_delta`). Feeds `events` (provisional),
`messages` (provisional), `tool_calls` (provisional), `usage` (provisional).

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `step_update.conversation_id` | | `7b87f551-…` | join | |
| `step_update.step_index` | | `2` | `events.seq` | |
| `step_update.state` | | `ACTIVE`, `DONE`, `ERROR` | `tool_calls.status` (`'running'`, `'ok'`, `'error'`); `messages.provisional` | ACTIVE covers statuses 1, 2, 8, 9; DONE is 3; ERROR is 7. 4, 5 and 6 never seen on stdout (U) |
| `step_update.step_type` | | `user_input`, `agent_response`, `tool`, `subagent`, `system_message` | `events.kind` | maps to 14, 15, 132, 132 (`invoke_subagent`), 101. `error_message` and `checkpoint` have not been observed (U): an unknown value is a drift row |
| `step_update.tool_name` | | `run_command`, `view_file`, `invoke_subagent` | `tool_calls.tool_name` | equals `metadata.4.2` |
| `step_update.tool_info.name` | | | | same |
| `step_update.tool_info.parameters.*` | the arguments (a subset: no `Cwd`, no UI labels) | `{"CommandLine":"ls -la"}`, `{"AbsolutePath":"/home/…/notes.txt"}` | `tool_calls.input_json` provisional | the row's `metadata.4.3` is the full set |
| `step_update.tool_info.output` | the result | `total 44\r\ndrwxrwsr-x …`, `5 lines, 23 bytes` | `tool_results.text_preview` provisional | for `run_command` it is the raw output, for `view_file` a summary; neither equals `140.2.1` |
| `step_update.tool_info.error.type` | | `TOOL_ERROR` | `tool_calls.cause` hint | |
| `step_update.tool_info.error.message` | | `declaring permissions: cortex tool view_file: …` | `tool_results.text_preview` | equals `error_details.2` |
| `step_update.subagent_info.subagents[].{type_name,role,initial_prompt,conversation_id,log_uri,workspace_uris[]}` | the spawned child | `research`, `Line Counter`, `39687e5e-1dca-465f-b580-1debda6317d3` | `runs` (child, `spawned_by_tool_call_id`), `tool_calls.spawned_run_id` | arrives on the ACTIVE line, BEFORE the child's link file; the earliest pairing |
| `step_update.text_delta` | a chunk of the assistant text | `I have`, ` launched the sub-agent ` | `content_blocks` provisional | the full text is the concatenation of every delta for that index; the DONE line carries the LAST chunk only |
| `step_update.duration_seconds` | | `1.997977314`, `5.475748639` | `tool_calls.latency_ms`, `messages` duration | C: equals `metadata.8 - metadata.1` (live, 10 of 10), so for a tool it includes queue time before RUNNING |
| `step_update.usage.{input_tokens, output_tokens, thinking_tokens, cache_read_tokens, total_tokens}` | on `agent_response` DONE only | `{19005, 208, 0, 0, 19213}` | `usage` provisional | C: equal to `metadata.9.2`, `.3`, `.9`, `.5`; `total_tokens` is input plus output without cache |

### `result` — last line

Count 1 per run. Feeds `run_results`, `cost_snapshots` (no cost, so none).

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `result.conversation_id` | | | join | |
| `result.status` | | `SUCCESS` | `run_results.subtype 'success'`, `is_error 0` | other values not observed (U) |
| `result.response` | the final text (the planner texts after the last tool, joined) | `I have launched the sub-agent… ### Summary of Actions…` | `run_results.result_preview` | |
| `result.duration_seconds` | wall time of the whole run | `23.345944875` | `run_results.duration_ms` | |
| `result.num_turns` | | `1` | `run_results.num_turns` | C: counts user inputs, NOT executor rows (the live run had 2) |
| `result.usage.{input_tokens, output_tokens, thinking_tokens, cache_read_tokens, total_tokens}` | SUM over the ROOT conversation's planner steps only | `{31010, 873, 0, 48800, 31883}` | `run_results.model_usage_json` | C: 31,010 is 19,005 + 3,524 + 4,078 + 4,403; the sub-agent's tokens are NOT included, so a quest total needs every child run |
| (none) | cost, `ttft_ms`, `duration_api_ms`, `terminal_reason`, permission denials, MCP status | | NULL | agy reports none |

## 6. Tables built from all of the above (one row builder per table)

| Table | Row | Built from |
|---|---|---|
| `runs` | one per `conversations/<conv>.db` | section 1.9, section 2, section 3 subagent link, `history.jsonl` |
| `run_inits`, `run_results` | one per `-p` run | section 5 |
| `turns` | one per `executor_metadata` row, plus an open turn for steps whose `metadata.12` has no executor row yet | `steps.metadata.12`, `executor_metadata.9`; `started_at` is the first step's `metadata.1`; `ended_at` the last step's `metadata.8`; `origin` `'user'` when the first step is type 14, `'task-notification'` for a type-101 `task_notification`, `'queued'` for `agent_message` |
| `messages` | one per generation that has a planner step (role `assistant`), one per type-14 step (role `user`), one per type-101 step (role `system`), one per type-23 step (the summarizer call) | 1.4, 1.6, 1.7 |
| `events` | one per step | all step sections; `seq = idx`; `origin 'transcript'`, `'both'` once a stdout line matched |
| `content_blocks` | planner: `thinking` (`20.3`), `text` (`20.1`), one `tool_use` per `20.7`; type 14: `text`; type 132: `tool_result` plus `image` blocks | 1.3 to 1.5 |
| `tool_calls`, `tool_results` | one per type-132 step | 1.5, 7.2 |
| `file_touches` | `view_file` read; `replace_file_content` edit; `write_to_file` create or write | 1.5 |
| `background_tasks` | one per `task_details`, kind `'command'`; one per `schedule` step, kind `'timer'` | 1.5, 3 |
| `usage` | one per planner step, one per checkpoint | 1.4, 1.6 |
| `errors` | each type-17 step, each failed generation, each `executor_metadata.12` | 7.5 |
| `compactions` | one per type-23 step | 1.6 |
| `hook_runs` | each `metadata.34` `deny`, each `Stop hook blocked termination` type-101, each `JSON hook …failed` error | 7.6 |
| `interventions` | none: agy keeps no mid-run queue; a type-14 step after the first in a run is a new turn | |
| `attachments` | none broken out; the context snapshots stay raw | |

## 7. Joins and rules

### 7.1 Type 101: SYSTEM_MESSAGE

Count 2,151 (2,142 DONE, 9 CLEARED). Versions all; `114.4.1.6`..`.12` first seen 2026-09-22 03:40 UTC (1.2.7).
Feeds `turns` (origin), `events` (kind `system`), `background_tasks` (completion), `hook_runs`, `agent_messages`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `step_payload.114.1` | the full text as shown to the model | `[Message] timestamp=2026-09-19T20:59:37Z sender=00b6776a-…/task-42 priority=MESSAGE_PRIORITY_HIGH content=Task id "…` | `events.text_preview`, `content_blocks` | three shapes (C): `task_notification` 1,794; `agent_message` 184; no kind, plain text: `Stop hook blocked termination:…` ×140, and `[Message] … sender=system … [Notice] All your subagents and background tasks have been stopped due to server restart` ×24 |
| `step_payload.114.2.1` | title | `Run ward checks finished`, `Wait for ward completion was canceled` | `agent_messages.title`; `background_tasks.result_preview` | 1,536 rows |
| `step_payload.114.2.4`, `.114.4.11` | int `1` | | raw only | 108 rows each, the LOW-priority ones |
| `step_payload.114.2.10.1` | `Task id "<conv>/task-N" finished with result…` | | `background_tasks.result_preview` | |
| `step_payload.114.3` | message kind | `task_notification`, `agent_message` | `events.subtype` | 1,978 rows |
| `step_payload.114.4.1` | message id (the file under `messages/`) | `39c8f267-a93f-491d-a4ca-e20f9e7723d8` | `agent_messages.message_id` | |
| `step_payload.114.4.2` | recipient conversation | | `agent_messages.recipient_run_id` | |
| `step_payload.114.4.3` | sender `<conv>/task-N` or a conversation id | `00b6776a-…/task-42` | `background_tasks.task_id` (ends it) | |
| `step_payload.114.4.4`, `.114.4.10` | the text, a title card | | raw only | |
| `step_payload.114.4.5` | priority enum | `3` (1,894), `1` (108) | `agent_messages.priority` | I |
| `step_payload.114.4.6` | `Timestamp` of the message | | `background_tasks.ended_at` | |
| `step_payload.114.4.12.1` | the originating tool call `{1 conv, 2 step idx, 3 {1 call id, 2 name, 3 args}}` | `call_812395`, `run_command` | `background_tasks.tool_call_id` | 1,513 rows |

### 7.2 Tool call join: planner `20.7` to its type-132 step

C: of 34,402 type-132 steps, 34,261 join to a planner `20.7` entry by `(conversation, call id)` (name equal 34,241,
arguments equal 34,230); the remaining 141 are the CLEARED steps whose planner body was stripped; 0 planner calls are
missing a tool step. The planner step is always before its tool steps; the tool steps follow it in `20.7` order.

Rules:

1. A tool step belongs to the planner step of the same generation: `tool_calls.message_id = <conv>:gen:<metadata.20.3>`. This
   join needs no call id and is exact.
2. The planner's `20.7` entry supplies the request: `tool_calls.requested_at` is the tool step's `metadata.1`.
3. **`call_<n>` repeats.** 31 call ids occur twice in ONE conversation (a `view_file` at idx 28 and a `run_command`
   at idx 439 share `call_391817`), and 628 of 33,764 ids occur in more than one conversation. So the key is
   `tool_call_id = '<run_id>:<call_id>'`, and the second occurrence in a run (in idx order) becomes `…:<call_id>~2`.
   Pair repeats by order: the k-th planner `20.7` entry with a given id to the k-th type-132 step with that id.
4. A call made by a Claude model carries the provider's id in `metadata.29.1` (`toolu_vrtx_…`); keep `4.1` as the key.
5. A pending call (planner done, tool step at status 1 or 2) is `tool_calls.status = 'pending'` or `'running'`.
6. `call_mcp_tool`: `tool_server` is `ServerName` (`dungeonmaster_dungeonmaster`, not `dungeonmaster`), `tool_name`
   is `mcp__<ServerName>__<ToolName>`. Cross-harness comparison needs a name map (open question 3).
7. `invoke_subagent` result `140.2.1` is JSON with `conversationId`; `spawned_run_id` is the first child, the rest come
   from `subagents/*.json` with the same `spawnStepIndex`.

### 7.3 Turns, messages and the generation join

`messages.message_id = <run_id>:gen:<idx>`; its `native` id is `20.6` (`bot-…`), `request_id` is `metadata.9.11`;
`started_at = metadata.1` of the planner step; `completed_at = metadata.8`; `model = gen_metadata.1.19`; `stop_reason`
from `20.12` (1.4). A generation with no planner step (109 failed requests, 1.7) has no message: it becomes an `errors`
row. A turn is the set of steps sharing `metadata.12`.

### 7.4 `usage` translation, in one place

Input is UNCACHED (`9.2`), cache read is separate (`9.5`), cache write does not exist, reasoning (`9.9`) is INSIDE output
(`9.3`). So `context_tokens = 9.2 + 9.5` and `cache_write_tokens = 0`. Example (live, step 5): `9.2 = 3524`, `9.5 = 16277`,
`9.3 = 186` gives `input 3524`, `cache_read 16277`, `output 186`, `context 19801`. A checkpoint adds its own row from `metadata.28.2`.

### 7.5 Failures to `tool_calls.status` and `cause`

Status first, then the text of `error_details.2`:

| Source | Becomes `status` | `denial_kind` | `cause` | `sub_cause` |
|---|---|---|---|---|
| status 7 and text starts `tool call denied by pre-tool hook:` (183) | `'denied'` | `'hook'` | `hook-denied` | `quality-violations` for `🛑 New code quality…`, `native-search-blocked`, `git-rewrite-blocked`, `jest-blocked` |
| status 7 and text starts `permission check failed for` | `'denied'` | `'permission'` | `permission-denied` | |
| status 7 and text starts `declaring permissions: cortex tool` and contains `invalid_args` (269) | `'error'` | | `invalid-args` | `file-not-found` when it contains `no such file or directory` |
| status 7 and `ContentOffset N exceeds line range size`, `recipient "parent" not found`, `cannot kill task` | `'error'` | | `invalid-args` | |
| status 7 and text starts `calling "tools/call":` (about 50) | `'error'` | | `mcp-error` | `invalid-args` for a zod `invalid_enum_value`/`invalid_type`, `unknown-package` |
| status 7 and `MCP tool call to server … timed out after` | `'error'` | | `timeout` | `mcp` |
| status 7 and `JSON hook "…" failed` | `'error'` | | `hook-error` | |
| status 7 and `Could not successfully apply any edits` or `fallback failed` | `'error'` | | `edit-no-match` | |
| status 4 INVALID | `'error'` | | `invalid-tool` | |
| status 6 CANCELED | `'interrupted'` | | `canceled` | |
| status 3 and `run_command` exit code (`28.6`) not 0 | `'error'` | | `nonzero-exit` | `tool_results.exit_code = 28.6` |
| status 5 CLEARED | unchanged: do not downgrade a recorded `'ok'` | | | |

Other failures: a type-17 step becomes an `errors` row. `24.3.2` text decides `kind`: `API error (attempt N): RESOURCE_EXHAUSTED (code 429)…`
(459) and the final `RESOURCE_EXHAUSTED (code 429): Individual quota reached… Resets in 3h20m10s` (29) are `'rate-limit'`
(`status_code 24.3.7`, the reset text goes to `details_json`); `The stream was interrupted`, `model output must contain either output
text or tool calls`, `Your previous response contained an improperly formatted function call` are `'harness-error'`.
Type-17 fields (count 492): `step_payload.24.3.1` short message, `.24.3.2` the text, `.24.3.3` `HTTP 429 Too Many Requests\nSherlog:…`,
`.24.3.5` JSON body, `.24.3.6` request id `<trajectory>-<n>` (joins to `gen_metadata.1.20.request_id` on 162 of 492; the rest
are retries with no generation row), `.24.3.7` HTTP code, `.24.3.9` title, `.24.3.10[]` `ErrorInfo`/`RetryInfo` JSON, `.24.4`,
`.24.5` int flags; `metadata.8` is present on 463 of 492. All map to `errors.message`/`details_json`.

### 7.6 Hooks

`metadata.34` `deny` entries (183, the hook's refusal text in `34.5`) become `hook_runs` (`hook_event 'PreToolUse'`, `outcome
'blocking-error'`, `tool_call_id`, `output_preview = 34.5`). `allow` entries (37,386) are raw only: they are policy
evaluations, and nothing marks them as a hook. A type-101 whose text starts `Stop hook blocked termination` (140 rows)
becomes `hook_runs` (`'Stop'`, `'blocking-error'`). `error_details` `JSON hook "jsonhook__dungeonmaster-guard_PreToolUse_0_0" failed:
command failed: signal: killed` is `hook_runs` (`'PreToolUse'`, `hook_name 'dungeonmaster-guard'`, `'non-blocking-error'`).

## 8. Version detection

The database, the summaries, the brain files and stdout carry no version. Evidence outside them, in order of trust:
`log/cli-<ts>.log` first lines (`Language server version: 1.2.14`, one line per language-server process, 64 files from
2026-09-21), the statusline stdin `last-stdin.json` (`"version":"1.2.5"`, one sample), nothing for stdout.

Rule: the harness version of a source or record is the version of the newest log whose start time is at or before the
record's `ts` (log file time is local; the corpus machine is UTC-7, so UTC is the name plus 7 h). Before the earliest log it is
`unknown`, assigned the nearest normalizer and logged as `schema_drift` `unknown-harness-version`. Because the logs
rotate, the ingest copies each `(version, first log start)` pair into `harness_versions` (PROPOSED) the first time it
sees it.

Drift observed across eras (C: `tmp/fm-agy-census2.json`, first and last time each path was seen):

| Path | Change | Era |
|---|---|---|
| `executor_metadata.data.13`, `gen_metadata.data.10`, `steps.132.metadata.29`, `.34.3` | appeared | 1.2.7 (2026-09-22) |
| `steps.101.step_payload.114.4.1.6`..`.12` | appeared | 1.2.7 |
| `executor_metadata.data.18`, `gen_metadata.data.1.2.21`, `steps.23.step_payload.30.28`, `.30.29` | appeared | 1.2.12 (2026-09-27) |
| `executor_metadata.data.10.1.15`, `.17.1.15` | last seen 2026-09-20 | before 1.2.7 |
| `steps.14.step_payload.19.12.1.13.54` | last seen 2026-09-22 05:49 | 1.2.7 |
| `steps.132.metadata.29` | Claude-model native tool id | 1.2.7 |

No field changed type.

## 9. In-place updates, `raw_records` and `raw_revisions`

C: the live capture (`tmp/agy-live-changes.json`, 200 ms sampling, so counts are lower bounds): terminal steps never changed
after their final write; `gen_metadata` row N was rewritten when row N+1 landed.

`raw_revisions.expected = 1` for ALL of these; any other change to a stored position is `expected = 0` and a
`schema_drift` `record-rewritten`:

| Source row | In-place change | Why it is expected |
|---|---|---|
| `steps` (any type) with old status in `{1,2,8,9}` | status moves to a terminal one; `metadata` (+ `.8`, `.26`) and `step_payload` rewritten; `error_details` goes from NULL to a blob (status 7 or 4); `task_details` and `render_info` appear | the normal life of a step: planner 8 to 3, tool 1 to 2 to 3, with approval 1,2,9,2,3 |
| `steps` planner at status 8 | `step_payload` rewritten several times with the status unchanged (live idx 10: three payload-only rewrites, then the final `metadata` + payload) | the assistant text streams in; stdout `text_delta` lines are the same chunks |
| `steps` terminal 3 (or 7) to 5 | the body is stripped (`step_payload` loses `20`/`19`/`140`/`30`/`114`; history unchanged) | CLEARED. Keep the earlier revision as the content; never turn an `ok` tool call into a failure |
| `gen_metadata` row N, once row N+1 exists | the row shrinks from about 123 KB to 1 KB: `1.1`, `1.2`, `1.16` and `3.*` (system prompt, message list, config) are removed | live: row 0 written at +5.0 s (123,407 B), rewritten at +13.9 s as row 1 landed (125,718 B) |
| `conversation_summaries` row | `step_count`, `last_modified_time`, `status`, `title`, `killed`, `last_user_input_*`, `raw_summary` | updated on every turn |
| `subagents/<child>.json` | `state` ALIVE to KILLED | killing a child |
| `messages/read.json` | a message id added | a message is read |
| `logs/transcript*.jsonl` | appended; async steps keep a stale `RUNNING` | not rewritten |

Append-only (never revised, C): `executor_metadata` (a row appears when the turn ends), `trajectory_metadata_blob`,
`trajectory_meta`, `messages/<uuid>.json`.

**Watermark** (`sources.watermark_json`): `{maxIdx, openIdx: [steps with status in (1,2,8,9)], maxGenIdx, maxExecIdx}`.
Re-read every `openIdx` row, every row with `idx > maxIdx`, and `gen_metadata` rows with `idx >= maxGenIdx - 1`.
For `gen_metadata` the system-prompt snapshot (`1.1`, `1.2`, `3.*`) is lost for any row the reader did not see while it
was the newest; a live reader that polls the `-wal` and `.db` mtimes will capture most of them, a cold import only the
last one per file. Do not trust `summaries.step_count` or `last_modified_time` for the watermark. Change signal: the
`.db`, `-wal` and `-shm` mtimes of the open conversation plus `conversation_summaries.db-wal`; agy holds no conversation
file open while idle and the WAL is 0 bytes after a checkpoint (checkpointed on CLI exit). Four crashed conversations carry
stale 49 to 62 KB `-wal` files. WAL growth per write was not observed with `fs.watch` (open question 2).

`record_type` values stored on `raw_records`: `step/14`, `step/15`, `step/17`, `step/23`, `step/101`, `step/132`, `gen`,
`executor`, `trajectory-meta`, `trajectory-blob`, `summary`, `subagent-link`, `agent-message`, `history`, `stdout/init`,
`stdout/step_update`, `stdout/result`. Every path in sections 1 to 5 is a `schema_observations` row; the `parsed = 1`
set is the paths the Maps-to columns above read, everything marked `raw only` is `parsed = 0`.

## Proposed schema changes

| Change | Type | Reason |
|---|---|---|
| `harness_versions(harness TEXT, version TEXT, first_seen_at INTEGER, last_seen_at INTEGER, evidence TEXT, PRIMARY KEY (harness, version))` | new table | agy's version lives only in rotating `cli-*.log` files and one statusline file, never in the data. The ingest must copy it before the log is deleted, or old conversations lose their version. Claude Code can use it too (a `version` field per line, summarised) |
| `agent_messages(message_id TEXT PRIMARY KEY, sender_run_id TEXT, sender_task_id TEXT, recipient_run_id TEXT NOT NULL, priority TEXT, ts INTEGER NOT NULL, title TEXT, text_preview TEXT, text_chars INTEGER, blob_hash TEXT, hidden INTEGER NOT NULL DEFAULT 0, source_tool_call_id TEXT, read INTEGER, raw_id INTEGER, normalizer TEXT)` | new table | `messages/*.json` is agy's first-class channel (2,019 files): which agent told which, when, and whether it was read. Neither `messages` (API calls) nor `events` carries a sender, a recipient or a read flag |
| `sources.kind` gains `'agent-message-json'`, `'history-jsonl'`, `'cli-log'` | enum values | three more file kinds to track; `'subagent-link-json'` already exists |
| `usage.reasoning_effort TEXT` | column | agy sets it per turn (`-low`, `-medium`, `-high` on `executor_metadata.10.1.28`) and it changes cost and latency; the model name alone loses it |
| `tool_calls.waiting_ms INTEGER` | column | time spent at status 9 (waiting for user approval): 6 steps today, but it separates user time from tool time in `active_ms` |
| `tool_calls` key rule: `tool_call_id` may end in `~<n>` | convention, no DDL | `call_<n>` ids repeat inside one conversation (31 cases); document in `schema.md` conventions |
| `messages.message_id` for the summarizer call: `<conv>:ckpt:<idx>` | convention, no DDL | a CHECKPOINT carries its own usage but is not a generation |
| `turns.origin` value `'queued'` and `'task-notification'` are used for agy | none | already in the CHECK list; stated for the normalizer |
| `errors.kind` adds `'rate-limit'` use for agy `RESOURCE_EXHAUSTED` | none | already in the list |
| `usage.context_gauge_tokens INTEGER` | optional column | agy's own gauge (`gen_metadata.1.9.10.1`) runs about 7,000 above input plus cache read; only add it if the dashboard must show agy's number |
| `runs.end_state` allows `'killed'` for `summaries.killed` | none | already in the list |

## Open questions

1. **Status 5 and 6 names.** `CLEARED` and `CANCELED` are inferred from behaviour (a body-stripped prefix of one conversation; an async command that
   ends with a completion time and a following step), not from a published enum. A run that deliberately cancels a command and one that clears
   history would settle it.
2. **When is a conversation write visible?** The sampler polled at 200 ms and agy writes the `-wal`; I could not observe `fs.watch` on the `-wal`.
   If `fs.watch` fires per write, the "re-read open rows" rule needs no polling timer; if not, an mtime poll is needed while a run is `RUNNING`.
3. **MCP server names.** agy names the server `dungeonmaster_dungeonmaster` (the `.agents/plugins/dungeonmaster` plugin plus the server); Claude's is
   `dungeonmaster`. Should `tool_server` be normalised (strip the repeated prefix), or kept per harness and mapped in a view?
4. **Stop reason enum.** `20.12 = 2` is normal (35,319 of 35,342); `14`, `16`, `17`, `18` look abnormal but only 23 rows exist.
5. **Cost.** `gemini-3.8-flash-tiered` (enum 1322, 2,698 calls) is priced by a tier threshold we do not know; Anthropic models through agy report no cache
   writes, so the Claude estimate will under-count against Claude Code's own transcripts.
6. **`-p` runs and `history.jsonl`.** `-p` runs write no history line, so `is_interactive` is `0` for them and for every child; confirm with a
   second headless run that no other file marks the entrypoint (the stdout spool is the only marker today).
7. **Retention.** `~/.gemini/antigravity-cli` starts 2026-09-17 and no retention setting was found; `terminals/.env` files may hold secrets and must
   never enter the archive.
8. **Child result tokens.** A `-p` `result.usage` excludes sub-agents. The quest roll-up must therefore sum child runs from their own databases, not
   from the parent's stdout.
