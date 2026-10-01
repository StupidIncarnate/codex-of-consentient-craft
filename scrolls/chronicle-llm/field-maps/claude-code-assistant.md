# Claude Code transcripts: `assistant` records

Field map for chronicle-llm. Target tables: `scrolls/chronicle-llm/schema.md`. Design: `scrolls/chronicle-llm/design.md`.
Sources: the census `tmp/schema-claude-census.json` (bucket `assistant`, 600 field paths, 416,182 records, snapshot
2026-10-01 12:39) and a fresh line-by-line scan of `~/.claude/projects/**` (416,482 assistant lines, because live
sessions kept writing). Counts are census counts unless a sentence says "scan" or "deduped". Every one of the 600 census
paths is covered by a row below; the per-tool argument paths (about 450 of the 600) are grouped one row per tool
because every child maps the same way.

### `assistant` — one line per content block of one API message, written to `<session>.jsonl` (main thread) or `<session>/subagents/**/agent-<id>.jsonl` (sidechain), plus synthetic lines the harness writes for API failures.

Count in corpus: 416,182 lines (census), 190,903 distinct `message.id`, 408,837 distinct `uuid`. Harness versions seen: 26,
2.1.251 to 2.1.287 (no assistant line lacks `version`). Feeds: `raw_records`, `events`, `content_blocks`, `messages`,
`usage`, `tool_calls`, `file_touches`, `background_tasks`, `errors`, and `runs` (envelope fields).

Models: `claude-sonnet-5` 255,497 lines, `claude-opus-5` 74,403, `claude-opus-5-5` 48,903, `claude-sonnet-5-5` 35,626,
`claude-fable-5-1` 1,203, `claude-haiku-4-5-20251001` 451, `<synthetic>` 99.

How a line becomes rows (one assistant line):

| Block in the line | `events.kind` | `content_blocks` | Other rows |
|---|---|---|---|
| `thinking`, `text` | `assistant-block` | one row, `idx = apiBlockIndex` | `messages` (once per `message.id`), `usage` (final line only) |
| `tool_use` | `tool-call` | one row, `tool_call_id` set | `tool_calls` (status `pending` until the result), `file_touches` for Read/Edit/Write |
| synthetic (`model = <synthetic>`) | `error` when `isApiErrorMessage`, else `meta` | one `text` row | `messages.is_synthetic = 1`, `errors` row; no `usage` row |

## Envelope fields (top level of the line)

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `type` | Record discriminator; always `assistant` in this bucket (416,182 records in the census) | `assistant` | `raw_records.record_type` | Routing key for the normalizer; not stored elsewhere |
| `uuid` | Id of this transcript line. One line per content block, NOT one per API message | `cffd0060-b8df-4d97-ab07-efba7cd4d955`, `baf1ff9e-…` | key: `events.event_id = <run_id>:<uuid>` | 4,090 uuids (3,868 across files) appear more than once: fork and sub-agent copies of the parent context, up to 9 copies. A copy gets its own `event_id` (its own `run_id`) and sets `events.copied_from_event_id` to the first-seen event |
| `parentUuid` | Previous line in the conversation chain; may be a user, attachment or assistant line | `04bcc615-fbd5-44bd-8c95-8ccb8fe2ba45`, `null` | `events.parent_event_id` (`<run_id>:<parentUuid>`) | Null on 1 record (first line of a sub-agent file). Block k of a message points at block k-1 in 121,469 messages, at the interleaved `tool_result` user line in 25,373 (a tool ran before the stream ended). 3 parents resolve only in another file, 6 not at all (census `orphan_parent_resolution`) |
| `isSidechain` | True for lines written to a sub-agent transcript, false for the main session file | `false` (64,207), `true` (351,975) | derived: `runs.kind` (`true` -> `subagent`/`workflow-agent`, `false` -> `session`) | Perfectly aligned with the path: `<session>.jsonl` is main, `<session>/subagents/agent-<id>.jsonl` and `<session>/subagents/workflows/wf_<id>/agent-<id>.jsonl` are sidechain. Also decides which usage-writing mode the file uses (see "Multi-record pattern") |
| `agentId` | Sub-agent id; present iff `isSidechain` is true | `abccc31e1c3ec0bcf`, `a5cc33e161986e260` | key: `runs.native_id` for a sub-agent run (`run_id = claude-code:<agentId>`) | Equals the file name `agent-<agentId>.jsonl` on every record checked (352,419 of 352,419). Absent on main-thread lines |
| `sessionId` | Session id the line belongs to | `c48ce942-ba37-4baf-88a7-ae45fde52c12`, `0ee658c0-cfba-42fa-81c7-ca71a8c9dd8f` | key: `runs.native_id` for a main run; `runs.parent_run_id` for a sub-agent (`claude-code:<sessionId>`) | Main file: equals the file name on every record. Sub-agent file: the PARENT session (351,760 of 352,112 records equal the parent dir; 352 do not, probably copied lines), so never use it as a sub-agent run key |
| `session_id` | Second session-id field, written in the stream-json style; only on main-thread `cli` lines | `c48ce942-…` (equal), `9d6cc00d-21ee-47d4-b179-8b40463cf7a1` (differs) | raw only | Present on 57,481 records (all `cli`, main thread). Equals `sessionId` on 42,667, DIFFERS on 14,914. In the one differing file inspected, every assistant line (293) carries the same foreign id, and that id is a separate existing transcript. Never use it as a key. Meaning of a differing value is unproven (see Open questions). Absent on every `sdk-cli` and sub-agent line |
| `timestamp` | ISO-8601 UTC, ms. Time this block line was produced, which is block close time, not request start | `2026-09-06T19:28:57.957Z`, `2026-10-01T02:56:10.032Z` | `events.ts`; derived: `messages.started_at` = min over the message's lines, `messages.completed_at` = max; `usage.ts` = the final line's | Within one message the lines are seconds apart (median 1.5 s, p90 6.7 s between first and last block of a multi-block message). Not a request-start time, so time-to-first-token cannot be derived from it |
| `version` | Claude Code version that wrote the line | `2.1.263`, `2.1.283`, `2.1.287` | `raw_records.harness_version`; `runs.harness_version_first/last` | 26 versions in the corpus, 2.1.251 to 2.1.287. Present on every assistant line, so a mid-session upgrade is visible per record |
| `cwd` | Working directory when the line was written | `/home/brutus-home/projects/codex-of-consentient-craft`, `…/worktrees/gateway-pivot` | `runs.cwd` (first seen); derived: `runs.repo_path` | 198 distinct values on main-thread lines. Changes mid-session after `EnterWorktree`, so `runs.cwd` takes the first and later values stay in raw |
| `gitBranch` | Git branch at write time | `master`, `gateway-pivot`, `quest/try-2-paste-images-into-web-chat-render-inline-s-1be07040` | `runs.git_branch` (first seen) | 49 distinct values on main-thread lines. `quest/…-<hash>` branches are dungeonmaster quest worktrees |
| `entrypoint` | How the process was launched | `cli` (362,943), `sdk-cli` (53,239) | `runs.entrypoint`; `runs.is_interactive` = `entrypoint = cli` | `sdk-cli` is the headless SDK launch, the `claude -p` children dungeonmaster spawns. Those lines never carry `session_id` |
| `userType` | Account class | `external` (all 416,182) | raw only | Constant; no analytic value |
| `requestId` | Anthropic API request id of the call that produced this message | `req_011CenjoAz1rfth6LyJaDDAq`, `req_011CevC2VwT9UUMDja3B2e3d` | `messages.request_id` | Constant within a `message.id` and unique to it (190,872 distinct ids, none maps to two messages). Absent on 31 records, all synthetic (the 30 `No response requested.` lines and the lost-connection line) |
| `apiBlockIndex` | Position of this line's block inside the API message's content array | `0`, `1`, `2` | `content_blocks.idx` | Contiguous 0..n-1 per message in 189,979 messages, not in 48 (replayed or dropped lines). Added in 2.1.257. Absent on 2.1.251/252 lines and on synthetic lines (1,459 records): fall back to the line's order inside its message, then the array index. The 50 records holding 2+ blocks all have `apiBlockIndex` 0 and sit alone in their message, so there `idx` is the array index |
| `slug` | Human-readable session nickname | `temporal-honking-cascade`, `floating-yawning-storm`, `happy-tumbling-lark` | PROPOSED: `runs.slug` | 43,872 records, 2.1.261 to 2.1.286, not on every line of a session (sparse). Take the first non-null per run |
| `effort` | Session effort setting when the line was written | `xhigh` (323,205), `medium` (91,422), `high` (1,005) | PROPOSED: `messages.effort` | 415,632 records; absent on 550 records. Present from 2.1.251. `xhigh` and `medium` dominate; with `perTurnEffort` = `xhigh`/`medium`/`high` when a per-turn override was set |
| `perTurnEffort` | Per-turn effort override; null unless the turn changed effort | `null` (236,791), `medium`, `xhigh` | PROPOSED: `messages.effort` (= `perTurnEffort` when non-null, else `effort`) | 321,322 records, 2.1.267 to 2.1.287. When non-null it always equals `effort` in this corpus (1,766 `high`/`high`, 81,906 `medium`/`medium`, 1,912 `xhigh`/`xhigh`). `turnOrigin` and `turnPosition` named in the brief do NOT occur in assistant records here |
| `thinkingDurationMs` | Wall time the model spent thinking, written on the thinking-block line | `1537`, `1117`, `459` | PROPOSED: `content_blocks.duration_ms` (thinking blocks only) | 2.1.287 only (487 in census, 836 by now), always on a record whose only block is `thinking`. The only model-side latency figure in assistant lines |
| `isApiErrorMessage` | Marks a synthetic assistant line that reports an API failure | `true` (69), `false` (30) | `messages.is_api_error` | Only on `<synthetic>` records. `false` is the harness placeholder `No response requested.`, not an error. 2.1.258 to 2.1.286 |
| `error` | Error class of a synthetic API-error line | `rate_limit` (51), `server_error` (18) | `errors.kind` (`rate_limit` -> `rate-limit`; `server_error` + status 529 -> `overloaded`; else `api-error`) | Only with `isApiErrorMessage = true`. 2.1.258 to 2.1.283 |
| `apiErrorStatus` | HTTP status of the failed call | `429` (51), `529` (16), `500` (1) | `errors.status_code` | Absent on the lost-connection record (`server_error` without status). 2.1.258 to 2.1.283 |
| `quotaLimits` and `quotaLimits.*` (status, resetsAt, rateLimitType, overageStatus, overageDisabledReason, isUsingOverage, unifiedRateLimitFallbackAvailable, lowPriorityOffer, lowPriorityMaxWaitSeconds, lowPriorityRetryAfterSeconds, upgradePaths[]) | Rate-limit verdict attached to a `rate_limit` synthetic line. `resetsAt` is epoch SECONDS | `rejected`, `seven_day`, `five_hour`, `1791093600`, `out_of_credits`, `org_level_disabled`, `treatment`, `1200`, `upgrade_plan` | `errors.details_json` (whole object); PROPOSED: `errors.limit_kind` (`rateLimitType`), `errors.resets_at` (`resetsAt` x 1000) | 51 records, 2.1.268 to 2.1.283. `status` and `overageStatus` are `rejected` on all 51; `rateLimitType` `five_hour` 33, `seven_day` 18; `overageDisabledReason` `out_of_credits` 49, `org_level_disabled` 2; `unifiedRateLimitFallbackAvailable` true on 6. `lowPriority*` and `upgradePaths[]` exist only in 2.1.278 (27 and 33 records). The user-facing text (`You've hit your session limit · resets 8:10pm (America/Los_Angeles)`) is in the content block |
| `isAbortedMidStream` | Real-model line cut off mid-stream (presumably a user interrupt) | `true` (7) | PROPOSED: `messages.is_aborted` | 2.1.251 to 2.1.273, 7 records. Real model, `stop_reason` null, `output_tokens` tiny (2). The usage is partial |
| `truncatedAfterOutput` | Synthetic error line reporting a connection lost after output had started | `true` (1) | `errors.details_json` | 1 record, 2.1.261, text `API Error: Connection lost mid-response. The response above may be incomplete.` |
| `sessionKind` | Session kind tag | `bg` (6,483) | derived: `runs.is_interactive = 0` (assumed meaning: background session) | 2.1.267 to 2.1.278 only. Meaning unverified |
| `serverClassifierRequest` | UUID of a server-side classifier request tied to this turn | `c2612212-e3fc-4e33-b0b4-13c09f80ab40`, `5bfec91f-a093-4f61-a839-6aeb81c07920` | raw only | 4,962 records, 2.1.285 to 2.1.287. Design lists `serverClassifierContext` as raw-only; this id is its join key |
| `attributionAgent` | Agent type that produced a sub-agent turn | `general-purpose` (328,293), `fork` (12,087), `Explore` (6,327), `workflow-subagent` (4,518), `Plan` (620), `claude` (56) | `runs.agent_type` (fallback when `agent-<id>.meta.json` is missing) | 351,945 records: sidechain lines only, 30 sidechain lines lack it. 2.1.251 on. `fork` marks a forked-context sub-agent, which is where the copied-uuid lines come from |
| `attributionMcpServer`, `attributionMcpTool` | MCP server and tool this turn is attributed to | `dungeonmaster` / `discover`, `claude-in-chrome` / `tabs_context_mcp` | raw only | 62,631 records. Appears on turns that follow an MCP tool call but is NOT the turn's own tool_use and not its parent's tool_result (checked on 293 records: 25 own, 2 parent, 266 neither). Server name is the display form (`claude.ai Claude Docs`), unlike the tool-name prefix (`claude_ai_Claude_Docs`). Semantics unproven |
| `attributionSkill` | Skill this turn is attributed to | `modeling` (2,008), `update-config`, `loop`, `claude-api` | raw only | 2,050 records, 2.1.263 to 2.1.285 |

## The `message` object

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `message.id` | API message id; shared by every line of the message | `msg_011CenjoD4nGA3AwArdrNooS`, `msg_011CevC2WgcGCz5YJJpiUEed`; synthetic: `201ea344-a7bc-462b-944b-075c73ace973` | key: `messages.message_id = claude-code:<id>`; `usage.message_id` | 190,903 distinct. A synthetic record's id is a bare UUID with no `msg_` prefix. A message copied into fork files shares its id across runs, so the PK is global and the first writer owns the row |
| `message.model` | Model that produced the message | `claude-sonnet-5` (255,497), `claude-opus-5` (74,403), `claude-opus-5-5` (48,903), `claude-sonnet-5-5` (35,626), `claude-haiku-4-5-20251001` (451), `claude-fable-5-1` (1,203), `<synthetic>` (99) | `messages.model`, `usage.model`; `runs.model_first`; `<synthetic>` -> `messages.is_synthetic = 1` | `usage.provider` is `anthropic` for every real model. `<synthetic>` has no price and gets no `usage` row. `claude-fable-5-1` exists only in 2.1.263 (6-7 Sep) |
| `message.role` | Always `assistant` | `assistant` | `messages.role` | Constant |
| `message.type` | API object type | `message` | raw only | Constant |
| `message.stop_reason` | Why generation stopped. Null on snapshot lines and on messages whose final line never arrived | `tool_use` (218,605), `end_turn` (11,293), `null` (186,174), `stop_sequence` (99, synthetic only), `max_tokens` (11) | `messages.stop_reason` (value from the final line) | A non-null value marks a line that carries FINAL usage. `max_tokens` 11 times, all at `output_tokens` 64000 |
| `message.stop_sequence` | Matched stop sequence | `null` (416,083), `""` (99) | raw only | `""` only on synthetic lines, alongside `stop_reason: stop_sequence` |
| `message.stop_details` | Structured stop detail | `null` (416,182) | raw only | Always null in this corpus |
| `message.container` | Code-execution container | `null` (338,260) | raw only | Always null. Key absent in 2.1.251, 2.1.252, 2.1.257, 2.1.259; present from 2.1.258 onward (with those gaps) |
| `message.context_management`, `.applied_edits` | Context-editing result | `null` (338,266), `{"applied_edits": []}` (56) | raw only | Never holds an applied edit. Same key range as `container` (2.1.258+). `applied_edits` is an empty array wherever the object exists |
| `message.diagnostics`, `.cache_miss_reason`, `.cache_miss_reason.type`, `.cache_miss_reason.cache_missed_input_tokens` | Why the prompt cache missed on this call | `null`; `{"cache_miss_reason":{"type":"tools_changed","cache_missed_input_tokens":227056}}`; `{"type":"previous_message_not_found"}` | PROPOSED: `usage.cache_miss_reason`, `usage.cache_missed_tokens` | `diagnostics` is a key on every line (2.1.251+), null on all but 1,001. `type` enum: `messages_changed` 318, `tools_changed` 255, `previous_message_not_found` 199, `unavailable` 117, `system_changed` 77, `model_changed` 35; `cache_miss_reason` itself null on 3. `cache_missed_input_tokens` on 682 (absent for `previous_message_not_found`, `unavailable`) |
| `message.input_transformations[]`, `.type`, `.path`, `.reason` | Edits the harness made to the prompt before sending | `{"type":"thinking_dropped","path":"messages.203.content.0","reason":"prefix_binding_mismatch"}` | raw only (explains cache misses; a candidate for `usage` later) | 2.1.275+. Empty array on 235,298 records; entries only from 2.1.282 (1,774 entries; `prefix_binding_mismatch` 1,760, `model_binding_mismatch` 14), all of `type` `thinking_dropped` |
| `message.content` (array) | The content blocks of this LINE (normally exactly 1) | array of 1 block | see the content-block rows below | Block count per line: 1 on 416,432 of 416,482 scanned, 2 on 43, 3 on 4, 4 on 2, 9 on 1 |

## `message.usage`

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `message.usage` | Token accounting object. Only the FINAL line of a message holds the true totals | object | `usage` row (final line only) | Snapshot lines carry a reduced object (no `server_tool_use`, `output_tokens_details`, `speed`, `iterations`) |
| `message.usage.input_tokens` | UNCACHED input tokens of the call | `2` (411,172), `4` (3,283), `32` (1,060) | `usage.input_tokens` | Tiny because nearly everything is read from or written to cache. Identical on every line of a message. `usage.context_tokens` = input + cache read + cache write; the largest seen is 968,908 |
| `message.usage.cache_read_input_tokens` | Tokens served from the prompt cache | `19124`, `10903`, `0` | `usage.cache_read_tokens` | Identical on every line of a message |
| `message.usage.cache_creation_input_tokens` | Tokens written to the cache (all TTLs) | `31916`, `48250` | `usage.cache_write_tokens` | Equals `ephemeral_5m + ephemeral_1h` on all 408,837 records |
| `message.usage.cache_creation.ephemeral_5m_input_tokens`, `.ephemeral_1h_input_tokens` (and the object itself) | Cache writes split by TTL | `{"ephemeral_1h_input_tokens": 31916, "ephemeral_5m_input_tokens": 0}` | `usage.cache_write_5m_tokens`, `usage.cache_write_1h_tokens` | After uuid dedupe, 1h writes on 259,485 records and 5m on 149,009. Present from 2.1.251 |
| `message.usage.output_tokens` | Generated tokens, thinking included | `231`, `359` (final); `9`, `4` (snapshot) | `usage.output_tokens` | Grows across the lines of a message: the first line carries the stream-start count (2 to 16), the last carries the final one. `thinking_tokens <= output_tokens` on all 223,596 records checked |
| `message.usage.output_tokens_details`, `.thinking_tokens` | Reasoning token count | `{"thinking_tokens": 133}`, `{"thinking_tokens": 0}` | `usage.reasoning_tokens` | Key present on 230,008 lines, all of them final lines; the value is null on the 99 synthetic ones, so `thinking_tokens` is on 229,909. Holds no other key |
| `message.usage.server_tool_use.web_search_requests`, `.web_fetch_requests` (and the object) | Server-side tool call counts | `{"web_search_requests": 0, "web_fetch_requests": 0}` | `usage.web_search_requests`, `usage.web_fetch_requests` | Key on final lines only (230,008, synthetic included); every counter is 0. WebSearch and WebFetch here run client-side as normal `tool_use` blocks, so these never count them |
| `message.usage.service_tier` | API service tier | `standard` (416,083), `null` (99) | `usage.service_tier` | Null only on synthetic lines |
| `message.usage.speed` | Inference speed mode | `standard` (229,909), `null` (99) | `usage.speed` | Final lines only. Never `fast` in this corpus |
| `message.usage.inference_geo` | Inference region | `not_available` (416,083), `null` (99) | raw only | No variation, so nothing to break out |
| `message.usage.iterations[]` and `.cache_creation.ephemeral_*`, `.cache_creation_input_tokens`, `.cache_read_input_tokens`, `.input_tokens`, `.output_tokens`, `.model`, `.type` | Per-iteration usage of a multi-pass call | `[{"input_tokens":2,"output_tokens":235,"cache_read_input_tokens":25242,…,"type":"message","model":null}]` | raw only (each child repeats the top-level totals) | Array of exactly 1 item on 7,235 final lines, 2.1.263 to 2.1.281, and its `output_tokens` equals the top-level value in all 7,235. Empty array `[]` on the final lines of every later version, null on the synthetic lines. `iterations[].model` null in 2.1.280/281. Two or more iterations never occur, so summing them is unnecessary |
| `message.usage.fallback_credit` | Credit granted when the call fell back to another tier or model | `null` (19,288) | raw only | 2.1.285+, always null so far. Watch for a non-null type change |

## `message.content[]` blocks

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `message.content[text].type` | Block discriminator | `text` | `content_blocks.block_type = text` | 45,930 blocks |
| `message.content[text].text` | Assistant prose, or the synthetic error message | `I'll start by reading the project's modeling skill…` | `content_blocks.text_preview` (2,000 chars), `.text_chars`, `.blob_hash` (over 4 KB) | `events.text_preview` takes the same preview. For a synthetic line this text is also `errors.message` |
| `message.content[thinking].type` | Block discriminator | `thinking` | `content_blocks.block_type = thinking` | 124,494 blocks. No `redacted_thinking` block exists in the corpus |
| `message.content[thinking].thinking` | Thinking text. Empty string on 98.4% of blocks | `""`; `Committed as a7756ed82, assigning the remaining slot to th…` | `content_blocks.text_preview`, `.text_chars` (0 when empty) | Non-empty on 2,046 of 124,809 blocks scanned, by version 2.1.257 (13), 2.1.258 (2), 2.1.263 (61), then every version from 2.1.280 (187, 11, 193, 412, 464, 207, 444, 52 up to 2.1.287); the text is a short summary and appears only in some sessions. Size information lives in `output_tokens_details.thinking_tokens` |
| `message.content[thinking].signature` | Opaque base64 signature the API needs to accept the block back | `CAQS4gcKEAgRGAI4AUIIdGhpbmtpbmcSDDKqmlX4ij+TN0BBlh…` | raw only | 472,094,576 characters across 124,809 blocks (about 3.8 KB each), the 471 MB the design names. No analytic value; the archive keeps it |
| `message.content[tool_use].type` | Block discriminator | `tool_use` | `content_blocks.block_type = tool_use` | 245,809 blocks. No server-tool blocks (`server_tool_use`, `web_search_tool_result`, `mcp_tool_use`) occur in assistant lines; the block keys are exactly `type`, `id`, `name`, `input`, `caller` |
| `message.content[tool_use].id` | Tool call id | `toolu_01BhisHarGYzM9x4PL4yNePu` | key: `tool_calls.tool_call_id = <run_id>:<id>`; `tool_calls.native_call_id`; `content_blocks.tool_call_id` | Every id starts `toolu_`. The matching `tool_result` carries the same id in `tool_use_id`. Copies of a line in fork files repeat the id, so `tool_call_id` is unique only per `run_id` |
| `message.content[tool_use].name` | Tool name | `Bash` (84,181), `Read` (70,717), `Edit` (33,352), `mcp__dungeonmaster__discover` (22,846) | `tool_calls.tool_name`; derived: `tool_calls.tool_server` from `mcp__<server>__<tool>` | 208,684 built-in and 37,312 `mcp__*` calls in the scan. Model-invented names occur: `bash`, `python3`, `discover`, `get-architecture`, bare `mcp__dungeonmaster`; keep them as written. 79 distinct names; each is in the per-tool table |
| `message.content[tool_use].caller`, `.caller.type` | Who invoked the tool | `{"type": "direct"}` | raw only | `direct` on all 245,809. A programmatic caller (code-execution) would show a different `type`; watch for it |
| `message.content[tool_use:<Tool>].input` and every `.input.<arg>` child (per-tool table below) | The tool's arguments, as the model wrote them | see the per-tool table | `tool_calls.input_json` (inline under 4 KB, else `input_blob_hash`), `tool_calls.input_summary` | The census splits `tool_use` by tool name. Model-invented argument names appear (`limin`, `new_new_string_placeholder`, `then`, `grand`, `grate`) and are kept raw |

## `tool_use` arguments, one row per tool

79 distinct tool names. The census splits the path by tool name (`message.content[tool_use:Bash].input.command`).
Every child of `.input` lands in `tool_calls.input_json` (inline under 4 KB, else `input_blob_hash`), and a short
`input_summary` (300 characters) is built from the named child. `tool_calls.requested_at` is the line's `timestamp`,
`tool_calls.message_id` is `claude-code:<message.id>`. `tool_server` comes from the `mcp__<server>__<tool>` name; Claude
Docs appears as `claude_ai_Claude_Docs` in the name and `claude.ai Claude Docs` in `attributionMcpServer`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `message.content[tool_use:Bash].input.*` | 84,181 calls, 2.1.251 to 2.1.287; 7 input paths | `cat .claude/skills/modeling/reference/bean-system.…`; `Read bean-system reference`; `320000` | `tool_calls.input_summary` = `description`, else first line of `command`; `run_in_background: true` -> a `background_tasks` row (`kind = bash`) | Children: `command` (84,178), `dangerouslyDisableSandbox` (50), `description` (43,295), `file_path` (3), `query` (2), `run_in_background` (411), `timeout` (19,768). `file_path` (3) and `query` (2) are model-invented arguments. `timeout` on 19,768 calls, `description` on 43,295 |
| `message.content[tool_use:Read].input.*` | 70,717 calls, 2.1.251 to 2.1.287; 4 input paths | `/home/brutus-home/projects/amalga-victorious/src/c…`; `725`; `320` | `file_touches` (`op = read`, `path = file_path`); `tool_calls.input_summary` = path | Children: `file_path` (70,717), `limin` (1), `limit` (14,870), `offset` (13,648). `offset` is int or string. `limin` (1) is a typo argument |
| `message.content[tool_use:Edit].input.*` | 33,352 calls, 2.1.251 to 2.1.287; 5 input paths | `/home/…/src/t…`; `false` (32,870), `true` (477) | `file_touches` (`op = edit`); `lines_added/removed` come from the result (`structuredPatch`), not the call | Children: `file_path` (33,351), `new_new_string_placeholder` (1), `new_string` (33,347), `old_string` (33,352), `replace_all` (33,347). `old_string` and `new_string` can exceed 4 KB -> `input_blob_hash`. `new_new_string_placeholder` (1) is invented |
| `message.content[tool_use:mcp__dungeonmaster__discover].input.*` | 22,846 calls, 2.1.251 to 2.1.287; 8 input paths | `context`: `4`, `15`; `glob`: `packages/server/src/adapters/process`; `grand`: `"StubArgument"` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = dungeonmaster` | Children: `context` (4,850), `glob` (17,167), `grand` (1), `grate` (1), `grep` (11,625), `max_results` (5), `strict` (1,447), `verbose` (6,653) |
| `message.content[tool_use:Write].input.*` | 11,778 calls, 2.1.251 to 2.1.287; 7 input paths | `/home/…/src/t…` | `file_touches` (`op = write`); `content` goes to a blob over 4 KB | Children: `content` (11,776), `description` (1), `file_path` (11,765), `file_text` (2), `old_string` (1), `path` (13), `then` (1). Variants seen: `path` (13, 2.1.284) and `file_text` (2, 2.1.284) used instead of `file_path`/`content`: treat `path` as a fallback for the file path. `description`, `old_string`, `then` are invented |
| `message.content[tool_use:ToolSearch].input.*` | 3,777 calls, 2.1.251 to 2.1.287; 2 input paths | `select:mcp__claude-in-chrome__tabs_context_mcp,…`; `10`, `5` | `tool_calls.input_summary` = `query` | Children: `max_results` (3,776), `query` (3,777). `max_results` missing on 1 call |
| `message.content[tool_use:Agent].input.*` | 3,559 calls, 2.1.251 to 2.1.287; 6 input paths | `Map the add-part and texture flows`; `Explore`, `general-purpose`, `fork`; `sonnet`, `opus`, `haiku`; `worktree` | `runs.description`, `runs.agent_type` (= `subagent_type`) of the SPAWNED run; `tool_calls.spawned_run_id`; `run_in_background: true` (982 of 1,120) -> `background_tasks` (`kind = subagent`); `prompt` -> blob | Children: `description` (3,558), `isolation` (3), `model` (2,169), `prompt` (3,558), `run_in_background` (1,120), `subagent_type` (2,901). `subagent_type` also holds odd values (`sonnet`, `mcp__dungeonmaster…`). `isolation: worktree` only in 2.1.280. The spawned run is linked by `.meta.json.toolUseId` = this call's id |
| `message.content[tool_use:mcp__claude-in-chrome__javascript_tool].input.*` | 2,747 calls, 2.1.258 to 2.1.287; 3 input paths | `action`: `"javascript_exec"`; `tabId`: `1796469734` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = claude-in-chrome` | Children: `action` (2,747), `tabId` (2,747), `text` (2,747) |
| `message.content[tool_use:mcp__claude-in-chrome__computer].input.*` | 1,941 calls, 2.1.258 to 2.1.287; 16 input paths (3 nested) | `action`: `"wait"`, `"screenshot"`; `duration`: `4`, `2`; `ref`: `"ref_8"`, `"ref_93"` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = claude-in-chrome` | Children: `action` (1,941), `coordinate` (537), `duration` (267), `ref` (33), `region` (173), `repeat` (7), `save_to_disk` (39), `scale` (130), `scroll_amount` (9), `scroll_direction` (9), `start_coordinate` (77), `tabId` (1,941), `text` (224) |
| `message.content[tool_use:mcp__dungeonmaster__get-folder-detail].input.*` | 1,925 calls, 2.1.258 to 2.1.287; 1 input path | `folderType`: `"contracts"`, `"transformers"` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = dungeonmaster` | Children: `folderType` (1,922) |
| `message.content[tool_use:mcp__dungeonmaster__get-testing-patterns].input.*` | 1,691 calls, 2.1.257 to 2.1.287; 0 input paths | no safe scalar example (see Notes) | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = dungeonmaster` | No arguments (empty `{}`) |
| `message.content[tool_use:mcp__dungeonmaster__get-architecture].input.*` | 1,595 calls, 2.1.257 to 2.1.287; 0 input paths | no safe scalar example (see Notes) | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = dungeonmaster` | No arguments (empty `{}`) |
| `message.content[tool_use:mcp__claude-in-chrome__browser_batch].input.*` | 967 calls, 2.1.258 to 2.1.280; 30 input paths (29 nested) | no safe scalar example (see Notes) | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = claude-in-chrome` | Children: `actions` (967) |
| `message.content[tool_use:mcp__dungeonmaster__get-project-inventory].input.*` | 679 calls, 2.1.257 to 2.1.287; 1 input path | `packageName`: `"hydration-recipes"`, `"orchestrator"` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = dungeonmaster` | Children: `packageName` (679) |
| `message.content[tool_use:SendMessage].input.*` | 577 calls, 2.1.258 to 2.1.286; 7 input paths | `abc4d4f1222469955`; `message`; `Ask walk explorer to wrap up now` | `tool_calls.input_summary` = `summary`; the recipient agent id is the join to the target run; candidate for `interventions.kind = steer` | Children: `content` (577), `message` (577), `notify_when_idle` (2), `recipient` (577), `summary` (568), `to` (577), `type` (577). Both spellings (`to`/`recipient`, `message`/`content`) are present together on all 577 calls, 2.1.258 to 2.1.286 |
| `message.content[tool_use:mcp__claude-in-chrome__navigate].input.*` | 528 calls, 2.1.258 to 2.1.287; 2 input paths | `tabId`: `1796469734`; `url`: `http://localhost:5173/build/tap` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = claude-in-chrome` | Children: `tabId` (523), `url` (528) |
| `message.content[tool_use:mcp__dungeonmaster__get-project-map].input.*` | 520 calls, 2.1.257 to 2.1.287; 2 input paths (1 nested) | no safe scalar example (see Notes) | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = dungeonmaster` | Children: `packages` (519) |
| `message.content[tool_use:mcp__dungeonmaster__modify-quest].input.*` | 337 calls, 2.1.257 to 2.1.286; 101 input paths (86 nested) | `evidence`: `Re-drove all three fixed races exact`; `flows`: `[{"id": "screenshot-path-server-side`; `nodes`: ` <parameter name="id">thumbnail-in-c` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = dungeonmaster` | Children: `contracts` (16), `designDecisions` (36), `evidence` (1), `flows` (256), `nodes` (1), `observables` (1), `offMapSignoffs` (1), `packagesAffected` (9), `planningNotes` (37), `questId` (337), `siegemasterSignoff` (1), `status` (49), `title` (8), `toolingRequirements` (3), `workItemId` (1) |
| `message.content[tool_use:mcp__dungeonmaster__get-syntax-rules].input.*` | 278 calls, 2.1.257 to 2.1.263; 0 input paths | no safe scalar example (see Notes) | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = dungeonmaster` | No arguments (empty `{}`) |
| `message.content[tool_use:mcp__dungeonmaster__get-quest].input.*` | 172 calls, 2.1.257 to 2.1.287; 5 input paths | `flowId`: `subagent-duration-session-view`; `format`: `"text"`, `"json"`; `packageName`: `"web"`, `"shared"` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = dungeonmaster` | Children: `flowId` (134), `format` (16), `packageName` (35), `questId` (172), `stage` (33) |
| `message.content[tool_use:mcp__dungeonmaster__get-agent-prompt].input.*` | 166 calls, 2.1.257 to 2.1.287; 3 input paths | `agent`: `"siegemaster-walker"`, `"siegemaster"`; `questId`: `"1be07040-b9ec-476c-a439-0b4fbb0123cd"`, `"c8171a64-b937-47ec-85e0-a86767976d8b"`; `workItemId`: `b739c559-48b2-463d-acdd-78654fd9e258` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = dungeonmaster` | Children: `agent` (163), `questId` (161), `workItemId` (59) |
| `message.content[tool_use:TaskStop].input.*` | 151 calls, 2.1.259 to 2.1.287; 2 input paths | `bbcrvnmeg` | join to `background_tasks.task_id` (`<run_id>:<task_id>`) | Children: `shell_id` (1), `task_id` (144). `shell_id` (1) is an older argument name |
| `message.content[tool_use:mcp__dungeonmaster__create-worktree].input.*` | 137 calls, 2.1.263 to 2.1.286; 1 input path | `name`: `brands-gateways` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = dungeonmaster` | Children: `name` (137) |
| `message.content[tool_use:mcp__claude-in-chrome__tabs_context_mcp].input.*` | 136 calls, 2.1.258 to 2.1.287; 1 input path | `createIfEmpty`: `true`, `false` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = claude-in-chrome` | Children: `createIfEmpty` (90) |
| `message.content[tool_use:AskUserQuestion].input.*` | 131 calls, 2.1.251 to 2.1.287; 11 input paths (10 nested) | `Spine fix`; `false` (128), `true` (3) | `tool_calls.input_summary` = first `question`; whole input in `input_json`/blob | Children: `questions` (131). Nested arrays; `preview` on 62 options, `description_detail` on 1 |
| `message.content[tool_use:mcp__claude-in-chrome__read_console_messages].input.*` | 95 calls, 2.1.258 to 2.1.286; 5 input paths | `clear`: `true`; `limit`: `30`, `10`; `onlyErrors`: `false`, `true` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = claude-in-chrome` | Children: `clear` (10), `limit` (71), `onlyErrors` (63), `pattern` (94), `tabId` (95) |
| `message.content[tool_use:mcp__claude-in-chrome__tabs_close_mcp].input.*` | 86 calls, 2.1.258 to 2.1.286; 1 input path | `tabId`: `1796474095` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = claude-in-chrome` | Children: `tabId` (86) |
| `message.content[tool_use:mcp__claude-in-chrome__read_network_requests].input.*` | 66 calls, 2.1.258 to 2.1.287; 4 input paths | `clear`: `true`, `false`; `limit`: `40`, `60`; `tabId`: `1796474003`, `1796474889` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = claude-in-chrome` | Children: `clear` (16), `limit` (21), `tabId` (66), `urlPattern` (44) |
| `message.content[tool_use:mcp__dungeonmaster__get-qa-checklist].input.*` | 59 calls, 2.1.257 to 2.1.278; 3 input paths | `flowId`: `"image-renders-inline"`, `"screenshot-path-server-side"`; `operationItemId`: `"d13931f1-d9a4-4f68-aaa9-47c76204708b"`, `"86b709e5-bfdb-419a-888e-1dd00d590e43"`; `questId`: `"b4c31633-913d-4ea3-912a-76ae0d64bec4"`, `"1dac5395-c828-4472-868c-d4a3425e43a0"` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = dungeonmaster` | Children: `flowId` (3), `operationItemId` (56), `questId` (59) |
| `message.content[tool_use:mcp__dungeonmaster__quest-work].input.*` | 58 calls, 2.1.286 to 2.1.287; 29 input paths (26 nested) | `questId`: `"1918a5ee-8bce-4f3d-a4ab-f7ff51f45878"`; `workItemId`: `"1822e852-89f9-4b6d-9da2-a325fe2fb079"`, `"0f1bf916-3815-43ee-9ae9-45bc525b834b"` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = dungeonmaster` | Children: `payload` (58), `questId` (58), `workItemId` (58) |
| `message.content[tool_use:ListAgents].input.*` | 52 calls, 2.1.261 to 2.1.283; 0 input paths | no safe scalar example (see Notes) | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child | No arguments (empty `{}`) |
| `message.content[tool_use:mcp__claude-in-chrome__find].input.*` | 52 calls, 2.1.258 to 2.1.287; 2 input paths | `tabId`: `1796474095`, `1796473999` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = claude-in-chrome` | Children: `query` (52), `tabId` (52) |
| `message.content[tool_use:mcp__dungeonmaster__signal-back].input.*` | 52 calls, 2.1.257 to 2.1.286; 5 input paths | `operationItemId`: `339d7ed2-43c1-4023-8af8-a0511cb25caf`; `operationStatus`: `"done"`; `questId`: `"1be07040-b9ec-476c-a439-0b4fbb0123cd"`, `"b4c31633-913d-4ea3-912a-76ae0d64bec4"` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = dungeonmaster` | Children: `operationItemId` (52), `operationStatus` (26), `questId` (52), `signal` (52), `workItemId` (52) |
| `message.content[tool_use:SubagentHandback].input.*` | 45 calls, 2.1.285 to 2.1.286; 1 input path | no safe scalar example (see Notes) | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child | Children: `message` (45) |
| `message.content[tool_use:mcp__claude-in-chrome__tabs_create_mcp].input.*` | 40 calls, 2.1.258 to 2.1.280; 0 input paths | no safe scalar example (see Notes) | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = claude-in-chrome` | No arguments (empty `{}`) |
| `message.content[tool_use:mcp__dungeonmaster__get-quest-work].input.*` | 36 calls, 2.1.286 to 2.1.287; 3 input paths | `operationItemId`: `"920b4be7-ec0e-4c2b-ae1a-f0f4fbfe9640"`, `"cdc79b93-3eaa-443e-a6c5-b954f6ffd9ff"`; `questId`: `"1918a5ee-8bce-4f3d-a4ab-f7ff51f45878"`; `workItemId`: `"1822e852-89f9-4b6d-9da2-a325fe2fb079"`, `"0f1bf916-3815-43ee-9ae9-45bc525b834b"` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = dungeonmaster` | Children: `operationItemId` (8), `questId` (36), `workItemId` (28) |
| `message.content[tool_use:CronCreate].input.*` | 31 calls, 2.1.278 to 2.1.286; 4 input paths | `cron`: `"13,43 * * * *"`, `"7,37 * * * *"`; `durable`: `false`; `recurring`: `true`, `false` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child | Children: `cron` (31), `durable` (1), `prompt` (31), `recurring` (31) |
| `message.content[tool_use:WebFetch].input.*` | 26 calls, 2.1.263 to 2.1.287; 2 input paths | `https://docs.claude.com/en/docs/claude-code/settin…` | `tool_calls.input_summary` = `url` | Children: `prompt` (26), `url` (26). Duration is reported on the result side |
| `message.content[tool_use:CronDelete].input.*` | 24 calls, 2.1.280 to 2.1.286; 1 input path | `id`: `"de74aa7f"`, `"3a1292bd"` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child | Children: `id` (24) |
| `message.content[tool_use:mcp__dungeonmaster__ask-user-question].input.*` | 21 calls, 2.1.265 to 2.1.286; 9 input paths (8 nested) | no safe scalar example (see Notes) | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = dungeonmaster` | Children: `questions` (21) |
| `message.content[tool_use:ScheduleWakeup].input.*` | 19 calls, 2.1.267 to 2.1.286; 5 input paths | `delaySeconds`: `1800`, `2700`; `noop`: `true`, `false`; `stop`: `true` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child | Children: `delaySeconds` (15), `noop` (15), `prompt` (14), `reason` (15), `stop` (4) |
| `message.content[tool_use:ExitPlanMode].input.*` | 18 calls, 2.1.261 to 2.1.286; 2 input paths | `/home/brutus-home/.claude/plans/fine-go-plan-this-…` | `input_blob_hash` for `plan` | Children: `plan` (18), `planFilePath` (18). 18 calls |
| `message.content[tool_use:Skill].input.*` | 17 calls, 2.1.263 to 2.1.285; 2 input paths | `modeling`, `loop`, `update-config` | `tool_calls.input_summary` = `skill` | Children: `args` (5), `skill` (17). 17 calls |
| `message.content[tool_use:WebSearch].input.*` | 12 calls, 2.1.263 to 2.1.287; 1 input path | `node:sqlite stable Stability 2 Node.js 26 release …` | `tool_calls.input_summary` = `query` | Children: `query` (12). Duration is reported on the result side |
| `message.content[tool_use:Workflow].input.*` | 10 calls, 2.1.285; 5 input paths (3 nested) | `export const meta = { name: 'bigbang-root-round'…` | `tool_calls.input_blob_hash` (script is large) | Children: `args` (8), `script` (10). 10 calls, all 2.1.285; spawns `workflow-subagent` runs |
| `message.content[tool_use:EnterWorktree].input.*` | 9 calls, 2.1.261 to 2.1.273; 2 input paths | `name`: `"ward-e2e-artifact-cleanup"`, `"siege-chromium-lanes"`; `path`: `/home/brutus-home/projects/codex-of-` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child | Children: `name` (3), `path` (6) |
| `message.content[tool_use:Artifact].input.*` | 7 calls, 2.1.280 to 2.1.282; 6 input paths | `action`: `"read"`; `file_path`: `/tmp/claude-1001/-home-brutus-home-p`; `icon`: `"timeline"` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child | Children: `action` (6), `description` (1), `file_path` (1), `icon` (1), `prompt` (4), `url` (6) |
| `message.content[tool_use:mcp__dungeonmaster__list-guilds].input.*` | 7 calls, 2.1.270 to 2.1.286; 0 input paths | no safe scalar example (see Notes) | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = dungeonmaster` | No arguments (empty `{}`) |
| `message.content[tool_use:EnterPlanMode].input.*` | 6 calls, 2.1.261 to 2.1.286; 0 input paths | no safe scalar example (see Notes) | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child | No arguments (empty `{}`) |
| `message.content[tool_use:mcp__dungeonmaster__get-quest-summary].input.*` | 6 calls, 2.1.258 to 2.1.278; 1 input path | `questId`: `"b4c31633-913d-4ea3-912a-76ae0d64bec4"`, `"1dac5395-c828-4472-868c-d4a3425e43a0"` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = dungeonmaster` | Children: `questId` (6) |
| `message.content[tool_use:mcp__dungeonmaster__run-ward].input.*` | 6 calls, 2.1.266 to 2.1.268; 0 input paths | no safe scalar example (see Notes) | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = dungeonmaster` | No arguments (empty `{}`) |
| `message.content[tool_use:mcp__echo__echo].input.*` | 6 calls, 2.1.283; 1 input path | `note`: `"main-before-cd"`, `"main-after-cd"` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = echo` | Children: `note` (6) |
| `message.content[tool_use:CronList].input.*` | 5 calls, 2.1.278 to 2.1.286; 0 input paths | no safe scalar example (see Notes) | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child | No arguments (empty `{}`) |
| `message.content[tool_use:ExitWorktree].input.*` | 5 calls, 2.1.261 to 2.1.270; 2 input paths | `action`: `"keep"`, `"remove"`; `discard_changes`: `true` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child | Children: `action` (5), `discard_changes` (1) |
| `message.content[tool_use:mcp__claude_ai_Claude_Docs__update].input.*` | 5 calls, 2.1.282; 21 input paths (17 nested) | `engine`: `"prose"` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = claude_ai_Claude_Docs` | Children: `container` (5), `engine` (5), `payload` (5), `ref` (5) |
| `message.content[tool_use:mcp__dungeonmaster__get-server-config].input.*` | 4 calls, 2.1.258 to 2.1.286; 0 input paths | no safe scalar example (see Notes) | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = dungeonmaster` | No arguments (empty `{}`) |
| `message.content[tool_use:mcp__claude-in-chrome__form_input].input.*` | 3 calls, 2.1.263 to 2.1.280; 3 input paths | `ref`: `"ref_53"`, `"ref_27"`; `tabId`: `1796474069`, `1796469839`; `value`: `realistic` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = claude-in-chrome` | Children: `ref` (3), `tabId` (3), `value` (3) |
| `message.content[tool_use:mcp__claude-in-chrome__read_page].input.*` | 3 calls, 2.1.263 to 2.1.280; 3 input paths | `filter`: `"interactive"`; `ref_id`: `"ref_70"`; `tabId`: `1796474083`, `1796469839` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = claude-in-chrome` | Children: `filter` (2), `ref_id` (1), `tabId` (3) |
| `message.content[tool_use:mcp__dungeonmaster__get-quest-status].input.*` | 3 calls, 2.1.258 to 2.1.266; 1 input path | `questId`: `"1be07040-b9ec-476c-a439-0b4fbb0123cd"` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = dungeonmaster` | Children: `questId` (1) |
| `message.content[tool_use:mcp__dungeonmaster__list-quests].input.*` | 3 calls, 2.1.283; 1 input path | `guildId`: `"21523917-83f7-4e23-a6de-8db1cae2ad96"` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = dungeonmaster` | Children: `guildId` (3) |
| `message.content[tool_use:Grep].input.*` | 2 calls, 2.1.280 to 2.1.285; 4 input paths | `-n`: `"true"`; `output_mode`: `"content"`; `path`: `/home/brutus-home/projects/codex-of-` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child | Children: `-n` (2), `output_mode` (2), `path` (2), `pattern` (2) |
| `message.content[tool_use:discover].input.*` | 2 calls, 2.1.285 to 2.1.286; 1 input path | `grep`: `\.css['"]/__mocks__/style-mock/jsdom` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child | Children: `grep` (1) |
| `message.content[tool_use:mcp__claude-in-chrome__get_page_text].input.*` | 2 calls, 2.1.263; 1 input path | `tabId`: `1796469839` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = claude-in-chrome` | Children: `tabId` (2) |
| `message.content[tool_use:mcp__claude-in-chrome__resize_window].input.*` | 2 calls, 2.1.258 to 2.1.263; 3 input paths | `height`: `900`; `tabId`: `1796469734`, `1796469393`; `width`: `1400` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = claude-in-chrome` | Children: `height` (2), `tabId` (2), `width` (2) |
| `message.content[tool_use:mcp__claude_ai_Claude_Docs__guide].input.*` | 2 calls, 2.1.282; 2 input paths (1 nested) | no safe scalar example (see Notes) | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = claude_ai_Claude_Docs` | Children: `items` (2) |
| `message.content[tool_use:mcp__claude_ai_Claude_Docs__read].input.*` | 2 calls, 2.1.282; 9 input paths (5 nested) | `engine`: `"prose"` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = claude_ai_Claude_Docs` | Children: `container` (1), `engine` (1), `payload` (1), `ref` (2) |
| `message.content[tool_use:mcp__dungeonmaster].input.*` | 2 calls, 2.1.266 to 2.1.283; 2 input paths | `glob`: `"packages/ward/src/**"`; `grep`: `gatewayTestingBarrelProxyNamesTransf` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = dungeonmaster` | Children: `glob` (1), `grep` (2) |
| `message.content[tool_use:mcp__webstorm__list_directory_tree].input.*` | 2 calls, 2.1.258; 3 input paths | `directoryPath`: `/home/brutus-home/.claude/projects/-`; `maxDepth`: `1`; `projectPath`: `/home/brutus-home/projects/codex-of-` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = webstorm` | Children: `directoryPath` (2), `maxDepth` (1), `projectPath` (1) |
| `message.content[tool_use:TaskOutput].input.*` | 1 calls, 2.1.259; 3 input paths | `b8req52w5` | join to `background_tasks.task_id` | Children: `block` (1), `task_id` (1), `timeout` (1). 1 call, 2.1.259 |
| `message.content[tool_use:bash].input.*` | 1 calls, 2.1.284; 1 input path | no safe scalar example (see Notes) | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child | Children: `command` (1) |
| `message.content[tool_use:get-architecture].input.*` | 1 calls, 2.1.284; 0 input paths | no safe scalar example (see Notes) | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child | No arguments (empty `{}`) |
| `message.content[tool_use:mcp__claude_ai_Claude_Docs__batch].input.*` | 1 calls, 2.1.282; 14 input paths (12 nested) | no safe scalar example (see Notes) | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = claude_ai_Claude_Docs` | Children: `batch` (1), `container` (1) |
| `message.content[tool_use:mcp__claude_ai_Claude_Docs__create].input.*` | 1 calls, 2.1.282; 13 input paths (10 nested) | `object`: `"utterance"` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = claude_ai_Claude_Docs` | Children: `container` (1), `object` (1), `payload` (1) |
| `message.content[tool_use:mcp__dungeonmaster__get-quest-planning-notes].input.*` | 1 calls, 2.1.287; 1 input path | `questId`: `"1918a5ee-8bce-4f3d-a4ab-f7ff51f45878"` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = dungeonmaster` | Children: `questId` (1) |
| `message.content[tool_use:mcp__webstorm__apply_patch].input.*` | 1 calls, 2.1.284; 2 input paths | `input`: `*** Begin Patch *** Update File: pac`; `projectPath`: `/home/brutus-home/projects/codex-of-` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = webstorm` | Children: `input` (1), `projectPath` (1) |
| `message.content[tool_use:mcp__webstorm__create_new_file].input.*` | 1 calls, 2.1.268; 3 input paths | `pathInProject`: `/tmp/dm-siege-r1-stress-b-2416415/.c`; `projectPath`: `/home/brutus-home/projects/codex-of-` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = webstorm` | Children: `pathInProject` (1), `projectPath` (1), `text` (1) |
| `message.content[tool_use:mcp__webstorm__get_file_problems].input.*` | 1 calls, 2.1.261; 4 input paths | `errorsOnly`: `true`; `filePath`: `packages/web/test/siege-driver/siege`; `projectPath`: `/home/brutus-home/projects/codex-of-` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = webstorm` | Children: `errorsOnly` (1), `filePath` (1), `projectPath` (1), `timeout` (1) |
| `message.content[tool_use:mcp__webstorm__lint_files].input.*` | 1 calls, 2.1.273; 4 input paths (1 nested) | `min_severity`: `"warning"`; `projectPath`: `/home/brutus-home/projects/codex-of-` | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child; `tool_calls.tool_server = webstorm` | Children: `files` (1), `min_severity` (1), `projectPath` (1) |
| `message.content[tool_use:python3].input.*` | 1 calls, 2.1.266; 0 input paths | no safe scalar example (see Notes) | `tool_calls.input_json` / `input_blob_hash`; `tool_calls.input_summary` = the most descriptive child | No arguments (empty `{}`) |

## Multi-record pattern: many lines per `message.id`, and which line holds the final usage

### What the harness writes

Claude Code writes one transcript line per streamed content block, not one per message. All lines of a message share
`message.id` and `requestId`. In the deduped corpus (by `uuid`) there are 190,903 messages across 408,837 lines:

| Lines per `message.id` | Messages |
|---|---|
| 1 | 44,061 |
| 2 | 103,815 |
| 3 | 29,760 |
| 4 | 7,096 |
| 5 | 3,136 |
| 6 to 35 | the remaining 3,000-odd; the largest message has 35 lines |

A typical two-line message is `thinking` then `tool_use`; a three-line message is `thinking`, `text`, `tool_use`; parallel tool
calls add one `tool_use` line each (messages holding 2 tool calls: 19,938; 3: 6,608; up to 11+). `apiBlockIndex` numbers
the blocks 0..n-1.

### The usage on each line is NOT the same

Two writer modes, split exactly by the file type (every message with 2+ lines, deduped scan):

| Mode | Where | Pattern | Messages |
|---|---|---|---|
| Final on every line | main-thread files (`isSidechain` false); also the copied-context prefix of sub-agent files | every line carries the final `output_tokens`, the final `stop_reason`, `server_tool_use`, `output_tokens_details`, `speed`, `iterations` | 22,609 (19,718 main, 2,891 sidechain) |
| Snapshot, then final | sub-agent files, live-written lines | lines 1..n-1 carry a stream-start snapshot: `stop_reason` null, small `output_tokens`, none of the four extra usage keys; only the LAST line carries the final values | 120,400 (all sidechain; zero in a main file) |

Evidence, snapshot-then-final, `…/8f034f53-9da9-4a52-bbb3-4797e0aea650/subagents/agent-a25316c6d73879411.jsonl`:

| Line | `apiBlockIndex` | block | `stop_reason` | `input` | `cache_read` | `cache_write` | `output_tokens` | `output_tokens_details` |
|---|---|---|---|---|---|---|---|---|
| 62 | 0 | tool_use | null | 2 | 51545 | 542 | 16 | absent |
| 64 | 1 | tool_use | null | 2 | 51545 | 542 | 16 | absent |
| 66 | 2 | tool_use | `tool_use` | 2 | 51545 | 542 | 385 | `{"thinking_tokens": 0}` |

Evidence, final on every line, `…/9cc7f66d-d70a-477a-972f-34dd387e02cd.jsonl` lines 45 and 46 (main thread): both read
`output_tokens` 359, `thinking_tokens` 175, `stop_reason` `tool_use`, though line 45 is stamped 20:54:11.197 and line 46
20:54:12.227. The earlier line holds a number that did not exist when its timestamp was taken, so lines of a main-thread
message are back-filled after the stream ends. In 2,318 main-thread messages another line sits between (e.g. lines 40, 41, 43,
45, 47 of `…/8319eb44-fbfa-498b-8e09-61fcde6e4a69.jsonl`, tool results in between, all `output_tokens` 2216), which favours an
in-place rewrite of the earlier lines over a staged write. **Answered 2026-10-01 by direct measurement: the file is append-only; the lines are STAGED and written once the message ends (no written byte changed across 182 samples at 100 ms). See `design.md` §5.1. The `raw_revisions` mapping below does not apply.** A reader tailing the file by byte offset can therefore see an
early copy of a line and later find it changed: assistant lines in main files are the "record rewritten" case in
`raw_revisions` (`expected = 1`).

What is identical on every line of a message, in every mode: `input_tokens`, `cache_read_input_tokens`,
`cache_creation_input_tokens`, both `cache_creation.ephemeral_*` values (checked on all 149,510 in-file multi-line groups:
one distinct tuple each). Only `output_tokens` (and the extra keys) differ. The last line carries the maximum
`output_tokens` in all 149,510 groups. A record has the final shape exactly when `stop_reason` is non-null: across the
deduped lines, `stop_reason` set implies `server_tool_use`, `output_tokens_details`, `speed` and `iterations` are present
(first, middle, last and single positions alike), and a null `stop_reason` implies all four are absent.

### Rule for `usage` and `messages`

One `usage` row per `message.id`, taken from the best line seen so far, where "best" means: non-null `stop_reason`,
then higher `output_tokens`, then later `timestamp`. Write it as an upsert, because a tailing reader meets the snapshot line
first. Do not sum lines (it would multiply the input and cache counts by the line count). Set `messages.stop_reason`,
`messages.completed_at` from the same pass.

Three traps:

1. **Copies across files.** 4,090 uuids appear in several files (fork and sub-agent copies of parent context; 1,232 messages
   appear in 2 files, 209 in 3, up to 9). The copy can be a mid-stream snapshot: uuid `673fe6e9-920a-46f3-9089-c72d9e109295`
   is in 4 files under `…/63f283ce-da1a-4d03-a47b-e7923694446d/subagents/` with `output_tokens` 890 and `stop_reason`
   `tool_use` in 3 copies and `output_tokens` 7 and null in `agent-afcb3375a6dcbeccc.jsonl` line 24. 1,069 duplicated uuids
   differ in usage this way, every one of them snapshot-versus-final. Because `messages.message_id` and `usage.message_id`
   are global keys, the copy must not create a second `usage` row: it only creates an `events` row with
   `copied_from_event_id`, and may improve the existing `usage` row. Counting every file's lines would double or nine-times
   count the forked prefix.
2. **Messages that never get a final line.** 5,206 `message.id` values have no line with a `stop_reason` in any file (2.7%).
   Their `output_tokens` is the stream-start figure (16 or 17 on about 2,750 of them, 2 to 8 on most of the rest), so output is
   understated. Typical case: sub-agent files where a tool ran and its result was written before the stream finished, e.g.
   `…/8f034f53-9da9-4a52-bbb3-4797e0aea650/subagents/agent-a3ca69a67d02ae316.jsonl` lines 61 (`Read`, `output_tokens` 16,
   `stop_reason` null), 62 (its result), 63 (`Bash`, 16, null), 64 (its result). 88 of them are the last line of their file
   (session killed). Row rule: write the `usage` row anyway with `PROPOSED: usage.is_partial = 1`.
3. **In-file replays.** A resumed session writes the same message again with the same uuid inside one file (message
   `msg_011CfKq64E9Mdd6PyDaiV1pn` appears at lines 45-48, 568-571 and 1069-1072 of its file). Dedupe on `uuid` first. Without
   it, 82 messages look as if `output_tokens` decreases.

Other fields on the message level (`model`, `requestId`, `stop_reason` once final) are constant across lines, so
`messages` takes them from the best line. `messages.started_at` is the earliest line `timestamp`, which is the close time of
the first block, so it understates request start by the time to first block.

## Synthetic and rate-limit records

A synthetic record is a line the harness writes itself to show the user something; no API call produced it. Marker:
`message.model = "<synthetic>"` (99 in the census, 106 in the scan counting 7 aborted real-model lines).

Shape, from `…/2774bd72-8d92-4e9d-be35-3d0ae527371a.jsonl` line 1325 (2.1.274):

| Field | Synthetic value | Real value |
|---|---|---|
| `message.id` | bare UUID (`201ea344-a7bc-462b-944b-075c73ace973`) | `msg_011…` |
| `message.model` | `<synthetic>` | a model name |
| `message.stop_reason` / `stop_sequence` | `stop_sequence` / `""` | `tool_use`, `end_turn`, … / null |
| `message.usage` | every token count 0; `service_tier`, `inference_geo`, `speed`, `iterations`, `output_tokens_details` null | real numbers |
| `message.content` | one `text` block | thinking, text, tool_use |
| `requestId` | present on 68 of 99 (the real API errors), absent on 31 | always |
| `effort` | absent | present |

The 99 split into:

| Kind | Count | Text | `isApiErrorMessage` | `error` / `apiErrorStatus` | Extra | Versions |
|---|---|---|---|---|---|---|
| Rate limit | 51 | `You've hit your session limit · resets 8:10pm (America/Los_Angeles)` (33), `You've hit your weekly limit · resets Sep 19, 11pm (America/Los_Angeles)` (18) | true | `rate_limit` / 429 | `quotaLimits` | 2.1.268 to 2.1.283 |
| Overloaded | 16 | `API Error: 529 Overloaded. This is a server-side issue…` | true | `server_error` / 529 | none | 2.1.258 |
| Server error | 1 | `API Error: 500 Internal server error…` | true | `server_error` / 500 | none | 2.1.258 |
| Connection lost | 1 | `API Error: Connection lost mid-response. The response above may be incomplete.` | true | `server_error` / absent | `truncatedAfterOutput: true` | 2.1.261 |
| Placeholder | 30 | `No response requested.` | false | absent | none | 2.1.258 to 2.1.286 |

(51 + 16 + 1 + 1 + 30 = 99.) 77 of the 106 scanned are main-thread, 29 sidechain.

Where the rate limit lives: `quotaLimits` on the line (not in the usage). `rateLimitType` is `five_hour` (33) or `seven_day` (18),
`resetsAt` is epoch seconds (`1791093600`), and the human reset time is only in the text. That is the data a quota ledger
needs.

Mapping:

- `messages`: `is_synthetic = 1`, `is_api_error = isApiErrorMessage`, `model = '<synthetic>'`, `message_id = claude-code:<bare uuid>`.
- No `usage` row (nothing was billed; all counts are 0).
- `errors` row for the 69 lines with `isApiErrorMessage = true`: `error_id = <run_id>:<uuid>`, `kind` from `error` and
  `apiErrorStatus` (`rate_limit` -> `rate-limit`, 529 -> `overloaded`, other -> `api-error`), `status_code`, `message` = the text,
  `details_json` = `quotaLimits` plus `truncatedAfterOutput`.
- `No response requested.`: `events.kind = meta`, `is_meta = 1`; not an error.
- The line sits in the chain like any assistant line (`parentUuid`), so the turn it ends can be tied to the failure.
- A real-model line with `isAbortedMidStream: true` (7, 2.1.251 to 2.1.273) is not synthetic: `stop_reason` null,
  `output_tokens` 2, so the same `usage.is_partial = 1` rule applies, plus `PROPOSED: messages.is_aborted`.

## Version drift

| Version | Change in assistant lines |
|---|---|
| 2.1.251, 2.1.252 | no `apiBlockIndex`; no `message.container`/`context_management`; `usage.iterations`/`server_tool_use`/`output_tokens_details`/`speed` present on about 90% (the final lines) |
| 2.1.257 | `apiBlockIndex`, `effort` appear; `thinking` text starts being non-empty on some blocks |
| 2.1.258 | `message.container`, `context_management`; `isApiErrorMessage`, `error`, `apiErrorStatus`; first synthetic API errors; `SendMessage` tool |
| 2.1.259 | `message.container` etc. absent for this version only |
| 2.1.261 | `slug`; `truncatedAfterOutput` (1 record); `EnterWorktree`, `ExitWorktree`, `EnterPlanMode`, `ExitPlanMode` tools |
| 2.1.263 | `usage.iterations[]` begins holding one item; `attributionSkill`; `Skill` tool |
| 2.1.267 | `perTurnEffort`; `sessionKind: bg` (to 2.1.278); `ScheduleWakeup` |
| 2.1.268 | `quotaLimits` (to 2.1.283); first weekly-limit lines |
| 2.1.275 | `message.input_transformations` key (empty array) |
| 2.1.278 | `quotaLimits.lowPriority*` and `upgradePaths[]` (this version only); `CronCreate`/`CronList` |
| 2.1.281 | last version with a one-item `iterations[]`; later versions write `[]` |
| 2.1.282 | `input_transformations[]` gets entries (`thinking_dropped`); Claude Docs MCP tools |
| 2.1.285 | `usage.fallback_credit` (always null), `serverClassifierRequest`; `Workflow`, `SubagentHandback` tools |
| 2.1.287 | `thinkingDurationMs` |

Not seen in assistant lines of this corpus although the brief named them: `turnOrigin`, `turnPosition`, server tool blocks,
`redacted_thinking`, a non-`standard` `speed`, a non-null `container`, `stop_details`, `fallback_credit`, a non-zero
`server_tool_use`.

## Proposed schema changes

| Proposal | Type | Reason |
|---|---|---|
| `usage.is_partial` | INTEGER NOT NULL DEFAULT 0 | 1 when no line of the message ever carried a `stop_reason` (5,206 messages) or the message was aborted; its `output_tokens` is the stream-start figure and understates output |
| `usage.cache_miss_reason` | TEXT | `message.diagnostics.cache_miss_reason.type` (`tools_changed`, `messages_changed`, `system_changed`, `model_changed`, `previous_message_not_found`, `unavailable`); explains the expensive calls without reading raw |
| `usage.cache_missed_tokens` | INTEGER | `cache_miss_reason.cache_missed_input_tokens`; the exact input that had to be re-written to cache |
| `messages.effort` | TEXT | `perTurnEffort` else `effort` (`medium`, `high`, `xhigh`); a first-order cost and quality dimension, absent from every table |
| `messages.is_aborted` | INTEGER NOT NULL DEFAULT 0 | `isAbortedMidStream`; separates an interrupted stream from a lost one |
| `content_blocks.duration_ms` | INTEGER | `thinkingDurationMs` (2.1.287+); the only model-side latency Claude reports on assistant lines |
| `errors.limit_kind` | TEXT | `quotaLimits.rateLimitType` (`five_hour`, `seven_day`); the quota ledger filters on it |
| `errors.resets_at` | INTEGER | `quotaLimits.resetsAt` x 1000 (ms); the quota window boundary |
| `runs.slug` | TEXT | `slug` (`floating-yawning-storm`); the harness's own session nickname |

Rules that need no new column: key `usage` and `messages` globally on `message.id` and let the first writer own the row
(copies only add `events`); upsert `usage` by the "best line" order above; mark main-file assistant lines as
`raw_revisions.expected = 1`.

## Open questions

1. Is a main-thread assistant line rewritten in place, or are the lines staged and flushed with the final usage? The
   timestamps and the 2,318 interleaved messages favour a rewrite. A byte-diff of a live main-thread file across one
   streaming message would settle it, and decides how often `raw_revisions` fires.
2. What does `session_id` mean when it differs from `sessionId` (14,914 main-thread lines)? In the file inspected the foreign
   id is constant and names a separate transcript, so it is probably the session a transcript was re-keyed from (resume or
   worktree move), but nothing in the transcript says so. Treat as raw until a known case is traced.
3. What do `attributionMcpServer`/`attributionMcpTool` and `attributionSkill` attribute? Not the line's own tool and not
   its parent's result. They may mark turns whose context carries a big MCP or skill payload; if so they would make
   a useful cost-by-source dimension. Kept raw.
4. Who owns a `messages` row whose id appears in several runs (a fork copy)? Proposed: the run whose file has the earliest
   line for that uuid. A fork that was started before its parent finished flushing can hold the only complete copy, so
   ownership should be re-evaluated if a later copy is better.
5. Does `sessionKind: bg` mean a background session? It correlates with 2.1.267 to 2.1.278 only, and with the `Agent`
   `run_in_background` feature. Mapped to `runs.is_interactive = 0` on an assumption.
6. Is non-empty `thinking` text tied to a setting (a "show thinking summaries" option)? 2,046 blocks, in some sessions only.
   The text is a summary and not the raw chain of thought, so it is stored as a preview only.
7. `usage.iterations[]` held one item in 2.1.263 to 2.1.281 and is empty since. If a future version emits two or more, the
   top-level totals may stop being the whole bill; re-check when `iterations` has length above 1.
