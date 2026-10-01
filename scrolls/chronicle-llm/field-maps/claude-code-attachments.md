# Claude Code `attachment` records: field map

Status: draft for review, 2026-10-01. Companion to `schema.md` and `design.md` (neither edited). Scope: every transcript line
with top-level `type: "attachment"`, broken out by `attachment.type`.

Evidence: `tmp/schema-claude-census.json` (buckets `attachment/*`, 326,270 records, 41 types, harness versions 2.1.251 to
2.1.287), plus two direct re-scans of every transcript under `~/.claude/projects/**` (3,700 `.jsonl` files, 1,074,878 records,
5.11 GB; scripts `tmp/fm-claude-att-scan.py` and `tmp/fm-claude-att-scan2.py`, results `tmp/fm-claude-att-scan*.json`). The re-scan
ran while sessions were still writing, so its counts run 0.3 percent above the census (327,216 attachment records). Counts in
the per-type headings are the census's; byte figures are the re-scan's. The census holds exactly 41 types, not the roughly
45 the brief guessed; the re-scan found no type the census lacks.

**Attachments are 27.4 percent of the whole corpus by bytes (1.40 GB of 5.11 GB) and 30.4 percent of its records.** That is
the single biggest reason this map matters: almost all of it is repeated, harness-injected context.

## 1. The envelope every attachment record shares

An attachment line has no `message`, `requestId`, `promptId` or `isMeta`. Its shape is the envelope below plus one
`attachment` object whose `type` selects the schema in section 5.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `type` | Always `"attachment"` | `attachment` | `raw_records.record_type = 'attachment/' + attachment.type`; `events.kind = 'attachment'`, `events.subtype = attachment.type` | one `events` row per record, `is_meta = 1`, `origin = 'transcript'` |
| `uuid` | Record id | `01fdc65d-7638-48db-818c-da8f58001e2a` | key: `events.natural_key = '<session>:<uuid>'`; `attachments.natural_key` and `hook_runs.natural_key` reuse it | 1 to 3 percent of attachment uuids recur in an earlier file (resumed sessions re-write earlier records, so `events.copied_from_event_ref` applies); a re-read must not mint a second row |
| `parentUuid` | The record this one hangs off | `22863870-ef61-4721-b459-7da79f8bed55` | `events.parent_event_ref` | Parent is a `user` record for 91 percent of `total_tokens_reminder`, an earlier attachment (chain) for the rest, an `assistant` (tool_use) record for PreToolUse hooks, a `user` "Stop hook feedback" record for `hook_blocking_error`. This is how an attachment is assigned to a turn: the ones before the first assistant record after a user prompt are that turn's pre-call context |
| `timestamp` | Write time | `2026-09-06T19:28:54.594Z` | `events.ts`, `attachments.ts` (ms epoch) | `queued_command` records carry the ENQUEUE time, not the delivery time (section 5.3) |
| `sessionId` | Session id (the parent's id inside a sub-agent file) | `c48ce942-ba37-4baf-88a7-ae45fde52c12` | `llm_sessions.native_id` for a main file | for a sub-agent file the session is `agentId`, not `sessionId` |
| `session_id` | Snake-case duplicate of `sessionId` | same value | raw only | duplicate. Present on 22,977 of 169,790 `total_tokens_reminder` and 38 of 41 types; appears from 2.1.251 and varies by record, not by version |
| `agentId` | Sub-agent id, only inside `subagents/agent-<id>.jsonl` | `abccc31e1c3ec0bcf`, `a808a8ccdb0962d7b` | `llm_sessions.native_id` (`llm_sessions.kind = 'subagent'`) | 32 of 41 types carry it; 78.5 percent of all attachment records (256,911 of 327,092) are in sub-agent files |
| `isSidechain` | True inside a sub-agent file | `false`, `true` | derived: `llm_sessions.kind` | agrees with `agentId` presence |
| `userType` | Always `external` | `external` | raw only | constant |
| `entrypoint` | How the session was launched | `cli` (158,216), `sdk-cli` (11,574) | `llm_sessions.entrypoint` (first seen) | |
| `cwd` | Working directory | `/home/brutus-home/projects/amalga-victorious` | `llm_sessions.cwd` (first seen) | changes inside a session when the model `cd`s or enters a worktree |
| `gitBranch` | Branch at write time | `refactor`, `master` | `llm_sessions.git_branch` (first seen) | |
| `version` | Claude Code version | `2.1.263`, `2.1.280` | `raw_records.harness_version`, `llm_sessions.harness_version_first/last` | |
| `slug` | The session's plan-file slug | `temporal-honking-cascade` | `llm_sessions.slug` | 21,007 of 169,790 on `total_tokens_reminder`; first seen 2.1.261 |
| `sessionKind` | `bg` for a background session | `bg` | `llm_sessions.session_kind` | 2,565 records, versions 2.1.267 to 2.1.278 only |
| `rendered`, `renderedRole`, `renderedInHumanTurn` | The text the model actually received | see section 3 | see section 3 | |

## 2. How each type routes

Rule for every type: one `events` row, one `attachments` row EXCEPT where the table says `no`. Typed rows are added on top.
`attachments.name` and `.chars` are defined per type in section 5. "blob" means the large text goes in `artifacts` and the row's id in
`attachments.blob_ref`. An array payload becomes one `attachments` row PER PART, each with `part_idx`, `part_kind` and its own
`blob_ref`; a part's `natural_key` is the attachment's key plus `:<idx>`.

| Type | `attachments` row | Typed target | Large payload | Notes |
|---|---|---|---|---|
| `skill_listing` | yes | | blob (`content`) | 22 distinct in 3,687 |
| `deferred_tools_delta` | yes | `errors` for `failedMcpServers[].error` | derived, not stored | |
| `deferred_tools_record` | yes | | raw only | tool schemas |
| `agent_listing_delta` | yes | | blob (`addedLines` joined) | |
| `mcp_instructions_delta` | yes | | blob (`addedBlocks[]`) | 2 distinct blocks |
| `instructions` | yes, one per file | | blob per file | CLAUDE.md |
| `nested_memory` | yes | | blob (`content.content`) | the single biggest type |
| `session_context` | yes | | `gitStatus` blob; `userEmail` NEVER in a preview | PII |
| `environment` | yes | | no | |
| `model` | yes | `llm_sessions.model_first` (cross-check only) | no | |
| `date`, `date_change` | yes | | no | |
| `remote_session_change` | yes | | no | commit and PR attribution lines |
| `output_style`, `output_style_instructions` | yes | | blob for the prompt | |
| `auto_mode` | yes | `llm_sessions.permission_mode`; an `intervention` event (`mode-change`) on change | no | |
| `prompt_snapshot` | yes | | blob of the whole payload | design 3.5 said raw only; the dedupe argument is in section 6 |
| `credential_org` | yes | | no | account identifier, not displayed |
| `total_tokens_reminder` | yes | | no | tiny but 170k rows |
| `hook_success` | no for SubagentStart and PreToolUse; yes for SessionStart | `hook_runs` | stdout blob for SessionStart | |
| `hook_additional_context` | yes | `hook_runs` | one blob per `content[]` element | |
| `hook_non_blocking_error` | no | `hook_runs`, `errors` | no | |
| `hook_blocking_error` | no | `hook_runs`, an `intervention` event (`hook-block`) | no | |
| `queued_command` | no: its event IS the arrival (kind `agent-message`, or `user-message` for a human) | `events`, `content_blocks`, `background_tasks`, `turns.origin` | `content_blocks.blob_ref` for long prompts | an arrival, never an intervention |
| `task_status` | yes | `background_tasks` | no | |
| `task_reminder` | yes | | no | |
| `plan_mode`, `plan_mode_exit`, `plan_mode_reentry` | yes | an `intervention` event (`mode-change`) | no | |
| `goal_status` | yes | | no | |
| `command_permissions` | yes | | no | |
| `edited_text_file` | yes | | blob (`snippet`) | |
| `file` | yes | | blob (`content.file.content`) | |
| `read_truncation_notice` | yes | `tool_results.details_json` | no | |
| `bash_output_audience_note` | yes | | no | |
| `compact_file_reference` | yes | | no | |
| `opened_file_in_ide`, `selected_lines_in_ide` | yes | | selection blob when over 4 KB | |
| `silent_turn_reminder`, `batching_reminder_sent` | yes | | no | |
| `thinking_drop` | yes | | no | cache diagnostics |

## 3. `rendered`, `renderedRole`, `renderedInHumanTurn`: duplication and drift

`rendered` is an array of `{content}` objects holding the exact `<system-reminder>…</system-reminder>` text the model received for that
attachment. It first appears at **2.1.268** (the same version that begins recording environment, model, session context,
instructions, date, remote-session and prompt-snapshot attachments, which earlier versions did not write as attachments at all).
`renderedRole` (`system` or `user`) first appears at **2.1.285**. `renderedInHumanTurn` is only on `queued_command`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `rendered[].content` | The model-visible text, wrapped in `<system-reminder>` | `<system-reminder>\n<total_tokens>14951470 tokens left</total_tokens>\n</system-reminder>` | raw only for template-wrapped types; `attachments.rendered_blob_ref` for flag-only types | it is a fixed template over the attachment fields, so it DUPLICATES them. Verified byte-for-byte for `hook_additional_context` (`'<system-reminder>\n' + hookName + ' hook additional context: ' + content.join('\n') + '\n</system-reminder>'`). Where the attachment holds only flags (`auto_mode`, `plan_mode`, `task_reminder`, `silent_turn_reminder`) the prose exists ONLY here |
| `rendered[]` length | Number of reminder blocks | `1`; `2` for `file` | raw only | `file` has two blocks: the synthetic Read call and its result |
| `renderedRole` | Role the reminder was injected under | `system`, `user` | raw only | `user` for `session_context`, `instructions`, `remote_session_change`; `system` elsewhere. 14,975 of 169,790 `total_tokens_reminder` |
| `renderedInHumanTurn[].content` | Alternate rendering when a background-task event shares a turn with a real user message | `[SYSTEM NOTIFICATION - NOT USER INPUT] … delivered in the same turn as a genuine message` | raw only | 1,262 of 2,043 `queued_command` |

Coverage among records written by 2.1.268 or later (re-scan): rendered is present on every model-visible type and **never** on
`prompt_snapshot`, `deferred_tools_record`, `credential_org`, `command_permissions`, `goal_status`, `hook_non_blocking_error`,
`thinking_drop` (internal bookkeeping the model never sees), nor on `hook_success` except `SessionStart:*` (2,940 of 53,631; the
SubagentStart text reaches the model through `hook_additional_context` instead, and PreToolUse output is a JSON control message).
Records before 2.1.268 have no `rendered`; for those the template must be applied by the normalizer if View Context needs
the text, and `rendered` coverage is the `rendered` column of the table in section 4.

**Duplication cost (re-scan):** `nested_memory` rendered 188 MB beside 233 MB of payload; `hook_additional_context` rendered 53 MB beside 65 MB
of payload; `instructions` 55 MB beside 53 MB; `skill_listing` 23 MB beside 31 MB; `queued_command` 12 MB beside 7 MB.
The raw archive keeps all of it. The derived tables must not.

## 4. Counts, versions and bytes per type

Counts and version ranges are the census's. Bytes are the re-scan's: whole-line bytes per type, the share of all attachment
bytes, how many records sit inside a sub-agent file, and how many records written by 2.1.268 or later carry `rendered`
(present/eligible).

| Type | Records | First version | Last version | First seen | Last seen | MB | Share | In sub-agent files | rendered |
|---|---|---|---|---|---|---|---|---|---|
| `total_tokens_reminder` | 169,790 | 2.1.251 | 2.1.287 | 2026-08-31 | 2026-10-01 | 108.24 | 7.7% | 142,331 | 137414/137676 |
| `hook_success` | 64,603 | 2.1.251 | 2.1.287 | 2026-08-31 | 2026-10-01 | 153.42 | 10.9% | 58,551 | 2940/53631 |
| `output_style` | 27,695 | 2.1.251 | 2.1.287 | 2026-08-31 | 2026-10-01 | 17.25 | 1.2% | 0 | 19448/19710 |
| `nested_memory` | 10,291 | 2.1.251 | 2.1.287 | 2026-08-31 | 2026-10-01 | 437.09 | 31.2% | 9,568 | 8555/8560 |
| `prompt_snapshot` | 5,153 | 2.1.268 | 2.1.287 | 2026-09-10 | 2026-10-01 | 239.89 | 17.1% | 4,734 | 0/5177 |
| `deferred_tools_delta` | 3,774 | 2.1.251 | 2.1.287 | 2026-08-31 | 2026-10-01 | 39.58 | 2.8% | 3,352 | 2644/2651 |
| `skill_listing` | 3,722 | 2.1.251 | 2.1.287 | 2026-08-31 | 2026-10-01 | 57.08 | 4.1% | 3,304 | 2590/2591 |
| `deferred_tools_record` | 3,519 | 2.1.268 | 2.1.287 | 2026-09-10 | 2026-10-01 | 9.90 | 0.7% | 3,140 | 0/3537 |
| `edited_text_file` | 3,460 | 2.1.251 | 2.1.287 | 2026-08-31 | 2026-10-01 | 18.84 | 1.3% | 2,963 | 3050/3057 |
| `hook_additional_context` | 3,408 | 2.1.251 | 2.1.287 | 2026-08-31 | 2026-10-01 | 123.09 | 8.8% | 3,407 | 2406/2406 |
| `environment` | 3,094 | 2.1.268 | 2.1.287 | 2026-09-10 | 2026-10-01 | 6.20 | 0.4% | 2,383 | 3110/3110 |
| `agent_listing_delta` | 2,938 | 2.1.251 | 2.1.287 | 2026-08-31 | 2026-10-01 | 15.88 | 1.1% | 2,534 | 2325/2326 |
| `mcp_instructions_delta` | 2,817 | 2.1.251 | 2.1.287 | 2026-08-31 | 2026-10-01 | 15.39 | 1.1% | 2,584 | 2425/2426 |
| `date` | 2,614 | 2.1.268 | 2.1.287 | 2026-09-10 | 2026-10-01 | 1.52 | 0.1% | 2,381 | 2626/2626 |
| `remote_session_change` | 2,591 | 2.1.268 | 2.1.287 | 2026-09-10 | 2026-10-01 | 2.84 | 0.2% | 2,375 | 2603/2603 |
| `model` | 2,590 | 2.1.268 | 2.1.287 | 2026-09-10 | 2026-10-01 | 2.34 | 0.2% | 2,373 | 2602/2602 |
| `session_context` | 2,580 | 2.1.268 | 2.1.287 | 2026-09-10 | 2026-10-01 | 11.03 | 0.8% | 2,365 | 2592/2592 |
| `instructions` | 2,503 | 2.1.268 | 2.1.287 | 2026-09-10 | 2026-10-01 | 109.89 | 7.8% | 2,286 | 2515/2515 |
| `queued_command` | 2,043 | 2.1.251 | 2.1.287 | 2026-08-31 | 2026-10-01 | 21.21 | 1.5% | 1,020 | 1546/1557 |
| `auto_mode` | 1,594 | 2.1.263 | 2.1.287 | 2026-09-06 | 2026-10-01 | 1.80 | 0.1% | 1,515 | 1575/1575 |
| `credential_org` | 1,379 | 2.1.281 | 2.1.287 | 2026-09-24 | 2026-10-01 | 0.73 | 0.1% | 1,287 | 0/1391 |
| `hook_blocking_error` | 1,131 | 2.1.265 | 2.1.285 | 2026-09-09 | 2026-09-30 | 2.31 | 0.2% | 1,132 | 29/29 |
| `read_truncation_notice` | 645 | 2.1.257 | 2.1.287 | 2026-09-01 | 2026-10-01 | 0.82 | 0.1% | 622 | 476/476 |
| `hook_non_blocking_error` | 615 | 2.1.261 | 2.1.287 | 2026-09-06 | 2026-10-01 | 0.83 | 0.1% | 560 | 0/544 |
| `silent_turn_reminder` | 505 | 2.1.263 | 2.1.287 | 2026-09-06 | 2026-10-01 | 0.44 | 0.0% | 0 | 491/491 |
| `batching_reminder_sent` | 273 | 2.1.263 | 2.1.263 | 2026-09-06 | 2026-09-07 | 0.17 | 0.0% | 0 | - |
| `output_style_instructions` | 221 | 2.1.268 | 2.1.287 | 2026-09-10 | 2026-10-01 | 3.26 | 0.2% | 0 | 226/226 |
| `opened_file_in_ide` | 171 | 2.1.251 | 2.1.287 | 2026-08-31 | 2026-10-01 | 0.12 | 0.0% | 0 | 91/91 |
| `bash_output_audience_note` | 124 | 2.1.263 | 2.1.263 | 2026-09-06 | 2026-09-07 | 0.06 | 0.0% | 0 | - |
| `task_reminder` | 106 | 2.1.267 | 2.1.278 | 2026-09-10 | 2026-09-22 | 0.09 | 0.0% | 1 | 82/82 |
| `plan_mode` | 74 | 2.1.261 | 2.1.286 | 2026-09-05 | 2026-09-30 | 0.12 | 0.0% | 49 | 38/38 |
| `selected_lines_in_ide` | 69 | 2.1.251 | 2.1.285 | 2026-08-31 | 2026-09-30 | 0.14 | 0.0% | 0 | 39/39 |
| `date_change` | 52 | 2.1.252 | 2.1.267 | 2026-09-01 | 2026-09-10 | 0.03 | 0.0% | 40 | - |
| `file` | 29 | 2.1.263 | 2.1.286 | 2026-09-07 | 2026-10-01 | 0.28 | 0.0% | 23 | 24/24 |
| `goal_status` | 27 | 2.1.272 | 2.1.273 | 2026-09-15 | 2026-09-17 | 0.10 | 0.0% | 0 | 0/27 |
| `command_permissions` | 17 | 2.1.263 | 2.1.285 | 2026-09-06 | 2026-09-30 | 0.01 | 0.0% | 5 | 0/13 |
| `task_status` | 17 | 2.1.263 | 2.1.286 | 2026-09-07 | 2026-10-01 | 0.02 | 0.0% | 12 | 16/16 |
| `plan_mode_exit` | 15 | 2.1.261 | 2.1.286 | 2026-09-06 | 2026-10-01 | 0.01 | 0.0% | 3 | 9/9 |
| `compact_file_reference` | 11 | 2.1.280 | 2.1.286 | 2026-09-23 | 2026-10-01 | 0.01 | 0.0% | 7 | 11/11 |
| `thinking_drop` | 9 | 2.1.282 | 2.1.287 | 2026-09-25 | 2026-10-01 | 0.01 | 0.0% | 4 | 0/9 |
| `plan_mode_reentry` | 1 | 2.1.278 | 2.1.278 | 2026-09-20 | 2026-09-20 | 0.00 | 0.0% | 0 | 1/1 |

Drift summary:

- **Added late:** `rendered` and nine new types at 2.1.268 (`environment`, `model`, `session_context`, `instructions`, `date`,
  `remote_session_change`, `prompt_snapshot`, `deferred_tools_record`, `output_style_instructions`); `credential_org` 2.1.281;
  `thinking_drop` 2.1.282; `compact_file_reference` 2.1.280; `goal_status` 2.1.272 to 2.1.273 only; `renderedRole` 2.1.285.
- **Gone:** `date_change` (2.1.252 to 2.1.267) is replaced by `date` (2.1.268 on). `batching_reminder_sent` and
  `bash_output_audience_note` exist only in 2.1.263 (a one-version experiment). `task_reminder` 2.1.267 to 2.1.278. `hook_blocking_error`
  last seen 2.1.285 (1,085 of its 1,131 records are in 2.1.266, in 78 sub-agent sessions; the worst session has 118 repeats, a stop-hook loop).
  `selected_lines_in_ide` last seen 2.1.285.
- **Sub-fields:** listed per type in section 5, each with its first version.

## 5. Per-type field maps

`attachments.ts` is the envelope `timestamp` for every type. `attachments.raw_id` / `.normalizer` are filled for every row and are not repeated.
Examples are real values from the corpus, truncated to 120 characters; emails and the organisation id are `<redacted>`.

### 5.1 Context injected at session and sub-agent start

#### `skill_listing` — The skills the model may call, written once per session at the start and again when the skill set changes.

Census 3,722 records, 2.1.251 to 2.1.287. Feeds `events`, `attachments`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `attachment.type` | Discriminator | `skill_listing` | `attachments.attachment_type` | |
| `attachment.content` | One line per skill: name, description | `- ink-setup: Configure ink (React for CLI) in a Dungeonmaster package…` | `attachments.blob_ref`, `attachments.chars` | 9.7 KB median; 22 distinct values in 3,687 records (0.18 MB distinct of 30.7 MB) |
| `attachment.names[]` | Skill names in this listing | `ink-setup`, `dumpster-create`, `quest-forensics` | `attachments.name` (comma-joined, capped) | |
| `attachment.skillCount` | Number of skills | `25` (1,881), `20` (878), `1` (28) | `attachments.details_json` | |
| `attachment.isInitial` | True for the first listing in a session | `true` (3,683), `false` (39) | `attachments.details_json` | `false` most likely means the skill set changed mid-session |
| `rendered[].content` | See section 3 | `<system-reminder>\nThe following skills are available for use with the Skill tool:…` | raw only | |

#### `deferred_tools_delta` — Which deferred tools (loaded on demand through ToolSearch) appeared, vanished or came back, and MCP server connection state.

Census 3,774 records, 2.1.251 to 2.1.287. Feeds `events`, `attachments`, `errors`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `attachment.type` | Discriminator | `deferred_tools_delta` | `attachments.attachment_type` | |
| `attachment.addedNames[]` | Tool names announced | `CronCreate`, `EnterWorktree`, `mcp__dungeonmaster__ask-user-question` | `attachments.details_json` (counts), `attachments.name` (first few) | usually 80 to 90 names on the first record of a session |
| `attachment.addedLines[]` | Same names as announced lines | `CronCreate` | raw only | duplicate of `addedNames` in practice |
| `attachment.removedNames[]` | Tools withdrawn | `mcp__dungeonmaster__get-syntax-rules`, `mcp__ide__getDiagnostics` | `attachments.details_json` | 13 values, 2.1.263 to 2.1.283 |
| `attachment.readdedNames[]` | Tools restored | `mcp__dungeonmaster__ask-user-question` | `attachments.details_json` | 1 value, 2.1.283 |
| `attachment.wireHiddenNames[]` | Tools hidden from the wire | empty in every sample | raw only | always `[]` |
| `attachment.surfacedNames[]` | Tools surfaced after a ToolSearch | `mcp__claude_ai_Claude_Docs__batch`, `AskUserQuestion` | `attachments.details_json` | from 2.1.273 |
| `attachment.pendingMcpServers[]` | MCP servers still connecting | `dungeonmaster`, `ide` | `attachments.details_json` | 5 values; 476 records carry the (usually empty) array |
| `attachment.needsAuthMcpServers[]` | MCP servers needing auth | empty in every sample | raw only | from 2.1.257 |
| `attachment.failedMcpServers[].name` | MCP server that failed to connect | `dungeonmaster` | `errors.message`, `errors.details_json` | 52 failure entries in 476 records; `errors.kind = 'harness-error'`, `errors.natural_key = '<session>:<pos>:<n>'` |
| `attachment.failedMcpServers[].error` | Failure text | `Connection closed`, `MCP error -32000: Connection closed` | `errors.message` | 18 of 52 carry it; from 2.1.263 |
| `attachment.failedMcpServers[].errorCode` | Failure code | `CONNECTION_CLOSED`, `-32000` | `errors.status_code` when numeric, else `errors.details_json` | |
| `rendered[].content` | The "just became available" block | `The following tools just became available and are ready to use:\nmcp__claude_ai_Claude_Docs__batch…` | `attachments.rendered_blob_ref` | 48 distinct in 2,589; derivable from the name lists |

#### `deferred_tools_record` — The full schemas of the deferred tools in play, written at start (2.1.268 and later). Never shown to the model.

Census 3,519 records, 2.1.268 to 2.1.287. Feeds `events`, `attachments` (row only).

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `attachment.type` | Discriminator | `deferred_tools_record` | `attachments.attachment_type` | |
| `attachment.entries[]` | One object per deferred tool | `{name, description, input_schema, defer_loading}` | raw only (design 3.5) | up to 140 KB; 1,521 records have `entries: []`; 0.6 to 3 MB distinct of 9.9 MB |
| `attachment.entries[].name` | Tool name | `mcp__claude-in-chrome__computer`, `mcp__dungeonmaster__get-quest` | `attachments.name` (count only) | |
| `attachment.entries[].description` | Tool description | `Use a mouse and keyboard to interact with a web browser…` | raw only | |
| `attachment.entries[].input_schema` | JSON schema (draft-07 here, 2020-12 in `prompt_snapshot`) | `{"type":"object","properties":{…}}` | raw only | |
| `attachment.entries[].defer_loading` | Always true | `true` | raw only | |
| `attachment.nameOnlyAnnouncements[]` | Ids of earlier announcement records | `37c28f3c-342e-4ba7-b6a9-d56147c39a86` | raw only | uuids of `deferred_tools_delta` records; from 2.1.273 |
| `attachment.strippedReferences[]` | A tool_use id plus tool name that was stripped | `toolu_01F25cV4oZZgSWxrSkupZqGh\nmcp__dungeonmaster__discover` | raw only | one record, 2.1.268 |

#### `agent_listing_delta` — The sub-agent types the Agent tool offers, written at start and when they change.

Census 2,938 records, 2.1.251 to 2.1.287. Feeds `events`, `attachments`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `attachment.type` | Discriminator | `agent_listing_delta` | `attachments.attachment_type` | |
| `attachment.addedTypes[]` | Agent type names | `claude`, `Explore`, `general-purpose`, `Plan` | `attachments.name` (comma-joined) | each record lists 5 or 6 |
| `attachment.addedLines[]` | One description line per type | `- Explore: Read-only search agent for broad fan-out searches…` | `attachments.blob_ref` (joined) | 2.9 KB median; 15 distinct in 2,948 |
| `attachment.removedTypes[]` | Types withdrawn | empty in every sample | raw only | |
| `attachment.builtInTypes[]` | Which listed types are built in | `claude` | raw only | from 2.1.285 |
| `attachment.isInitial` | First listing of the session | `true` | `attachments.details_json` | always true in the corpus |
| `attachment.showConcurrencyNote` | Whether the "launch several agents at once" note is appended | `true` (2,172), `false` (766) | `attachments.details_json` | |
| `rendered[].content` | `Available agent types for the Agent tool:…` | | raw only | |

#### `mcp_instructions_delta` — The usage instructions that connected MCP servers publish.

Census 2,817 records, 2.1.251 to 2.1.287. Feeds `events`, `attachments`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `attachment.type` | Discriminator | `mcp_instructions_delta` | `attachments.attachment_type` | |
| `attachment.addedNames[]` | Server names | `claude-in-chrome`, `claude.ai Claude Docs` | `attachments.name` (comma-joined) | |
| `attachment.addedBlocks[]` | Instruction text per server | `## claude-in-chrome\n**IMPORTANT: If the Chrome browser tools are defer…` | one `attachments` row per block (`part_idx`, `part_kind = 'mcp-instruction'`, `name` = server, own `blob_ref`) | 3.1 KB each; 2 distinct blocks in 4,817 |
| `attachment.removedNames[]` | Servers withdrawn | always empty | raw only | |
| `rendered[].content` | `# MCP Server Instructions…` | | raw only | |

#### `instructions` — The CLAUDE.md files loaded at session start and again after compaction.

Census 2,503 records, 2.1.268 to 2.1.287. Feeds `events`, `attachments` (one row per file).

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `attachment.type` | Discriminator | `instructions` | `attachments.attachment_type` | |
| `attachment.files[]` | One object per loaded file; always length 1 in the corpus | | one `attachments` row per element, `part_idx` = its index | |
| `attachment.files[].path` | Absolute path | `/home/brutus-home/projects/amalga-victorious/CLAUDE.md` | `attachments.name` (of that part's row) | |
| `attachment.files[].type` | Memory scope | `Project` (every record) | raw only; `attachments.part_kind = 'memory-file'` | |
| `attachment.files[].content` | The file text | `# Project Guidelines\n\n**Critical: scratch files go in `<repoRoot>/tmp`…` | `attachments.blob_ref`, `attachments.chars` (of that part's row) | 19 KB median, 52 KB max; 16 distinct in 2,515 (0.42 MB distinct of 52.9 MB). The raw file content, so it may hold anything |
| `attachment.reason` | Why it was re-sent | `compaction` (3), `session_start` (1) | `attachments.details_json` | 4 records, 2.1.283 to 2.1.286; absent otherwise |
| `attachment.changed` | The content changed since last send | `true` | `attachments.details_json` | 4 records |
| `rendered[].content` | Preamble plus `Contents of <path> (project instructions, checked into the codebase):` plus the content | | raw only | 28 distinct values |

#### `nested_memory` — A CLAUDE.md found in a subdirectory the model just touched, injected as it is first needed.

Census 10,291 records, 2.1.251 to 2.1.287. Feeds `events`, `attachments`. **The single largest type: 437 MB, 31.2 percent of attachment bytes.**

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `attachment.type` | Discriminator | `nested_memory` | `attachments.attachment_type` | |
| `attachment.path` | Absolute path | `/home/brutus-home/projects/codex-of-consentient-craft/packages/CLAUDE.md` | `attachments.name` (full path) | |
| `attachment.displayPath` | Path relative to the cwd | `packages/CLAUDE.md`, `.claude/worktrees/fix-sideglue/CLAUDE.md` | `attachments.details_json` | the same file under a worktree has a different `path`, which is why whole-record dedupe fails (1,154 distinct) while content dedupe works (192) |
| `attachment.content` | Wrapper object | | | |
| `attachment.content.path` | Same as `attachment.path` | | raw only | duplicate |
| `attachment.content.type` | Memory scope | `Project` (every record) | `attachments.details_json` | |
| `attachment.content.content` | The file text | `# CLAUDE.md\n\nThis file provides guidance to Claude Code (claude.ai/code)…` | `attachments.blob_ref`, `attachments.chars` | 233 MB raw, 192 distinct, 8.7 MB distinct |
| `attachment.content.contentDiffersFromDisk` | The file changed after load | `false` (all 10,291) | raw only | never true in the corpus |
| `rendered[].content` | `Contents of <path>:\n\n<content>` | | raw only | 188 MB, derived from path plus content; the largest duplicate in the corpus |

#### `session_context` — Account and git context the model is given: the user's email line and a git status snapshot.

Census 2,580 records, 2.1.268 to 2.1.287. Feeds `events`, `attachments`. **Contains an email address.**

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `attachment.type` | Discriminator | `session_context` | `attachments.attachment_type` | |
| `attachment.context.userEmail` | Sentence naming the account email | `The user's email address is <redacted>. Use it only to identify the user…` | raw only | never copied into a preview or an `attachments` column |
| `attachment.context.gitStatus` | Git status snapshot at session start | `This is the git status at the start of the conversation. Note that thi…` | `attachments.blob_ref`, `attachments.chars` | 2,501 of 2,580 carry it; 571 distinct in 1,082 large ones. Holds file names and recent commit subjects |
| `attachment.reason` | Why it was sent | `session_start` | `attachments.details_json` | 2 records, 2.1.268 only |
| `attachment.changed` | Changed since last send | `true` | `attachments.details_json` | 2 records, 2.1.268 only |
| `rendered[].content` | `As you answer the user's questions, you can use the following context:…` | | raw only | `renderedRole` is `user` |

#### `environment` — The working directory, platform and shell facts the model is given, and updates when they change.

Census 3,094 records, 2.1.268 to 2.1.287. Feeds `events`, `attachments`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `attachment.type` | Discriminator | `environment` | `attachments.attachment_type` | |
| `attachment.snapshot.workingDirectory` | cwd | `/home/brutus-home/projects/amalga-victorious` | `attachments.name` | |
| `attachment.snapshot.isWorktree` | Inside a git worktree | `true` (2,067), `false` (1,027) | `attachments.details_json` | |
| `attachment.snapshot.isGitRepo` | | `true` (all) | raw only | constant |
| `attachment.snapshot.additionalWorkingDirectories[]` | Extra directories | `/home/brutus-home/projects/amalga-victorious/.claude/worktrees/agent-a…` | `attachments.details_json` | 3 values, 2.1.280 |
| `attachment.snapshot.platform` | | `linux` | raw only | constant |
| `attachment.snapshot.shell` | | `bash` | raw only | constant |
| `attachment.snapshot.osVersion` | | `Linux 6.8.0-139-generic`, `Linux 6.8.0-138-generic` | raw only | |
| `attachment.snapshot.scratchpadDirectory` | Per-session scratch dir | `/tmp/claude-1001/-home-brutus-home-projects-amalga-victorious/072f7052…` | `attachments.details_json` | 2,794 of 3,094 |
| `attachment.changes[].field` | Which snapshot field changed (update records) | `workingDirectory`, `scratchpadDirectory` | `attachments.details_json` | 516 records; the arrays are empty (`[]`) in 2,590 |
| `attachment.changes[].from` | The previous value | `/home/brutus-home/projects/codex-of-consentient-craft` | `attachments.details_json` | a mid-session cwd change is the signal that a session entered a worktree |
| `rendered[].content` | `# Environment\nYou have been invoked in the following environment:…` or `# Environment update` | | raw only | 75 distinct |

#### `model` — Which model the session is on and its identity text.

Census 2,590 records, 2.1.268 to 2.1.287. Feeds `events`, `attachments`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `attachment.type` | Discriminator | `model` | `attachments.attachment_type` | |
| `attachment.identity.modelId` | API model id | `claude-sonnet-5`, `claude-opus-5-5[1m]`, `claude-haiku-4-5-20251001` | `attachments.name`; cross-check for `llm_sessions.model_first` | the `[1m]` suffix marks the 1M-context variant and does NOT appear in `message.model` |
| `attachment.identity.marketingName` | Display name | `Sonnet 5`, `Opus 5.5 (1M context)` | `attachments.details_json` | |
| `attachment.identity.knowledgeCutoff` | Cutoff the model is told | `January 2026`, `June 2026` | `attachments.details_json` | |
| `attachment.text` | The sentence given to the model | `You are powered by the model named Sonnet 5. The exact model ID is cla…` | raw only | derived from the identity fields |
| `rendered[].content` | Same text, wrapped | | raw only | |

#### `date` — Today's date, re-sent each day a session spans (2.1.268 and later). Replaces `date_change`.

Census 2,614 records, 2.1.268 to 2.1.287. Feeds `events`, `attachments`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `attachment.type` | Discriminator | `date` | `attachments.attachment_type` | |
| `attachment.date` | ISO date | `2026-09-23`, `2026-09-30` | `attachments.name` | |
| `attachment.changed` | The date differs from the last one | `true` | `attachments.details_json` | 36 records, 2.1.270 to 2.1.286. A `true` most likely marks a session that crossed midnight |
| `rendered[].content` | `Today's date is 2026-09-23.` | | raw only | |

#### `date_change` — The date rolled over mid-session (2.1.252 to 2.1.267, then replaced by `date`).

Census 52 records. Feeds `events`, `attachments`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `attachment.type` | Discriminator | `date_change` | `attachments.attachment_type` | |
| `attachment.newDate` | New ISO date | `2026-09-07`, `2026-09-09` | `attachments.name` | no `rendered` in any version |

#### `remote_session_change` — The commit and PR attribution lines the model must append, plus remote-session state.

Census 2,591 records, 2.1.268 to 2.1.287. Feeds `events`, `attachments`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `attachment.type` | Discriminator | `remote_session_change` | `attachments.attachment_type` | |
| `attachment.commit` | Trailer for commit messages | `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`, `Claude'd it up in here!` | `attachments.details_json` | follows the repo's configured attribution |
| `attachment.pr` | Footer for PR bodies | `🤖 Generated with [Claude Code](https://claude.com/claude-code)`, empty | `attachments.details_json` | |
| `attachment.url` | Remote session URL | `null` (all 2,591) | raw only | never set in this corpus |
| `attachment.managedCommit` | Harness manages commit attribution | `false` (2,521) | raw only | from 2.1.270 |
| `attachment.managedPr` | Harness manages PR attribution | `false` (2,521) | raw only | from 2.1.270 |
| `attachment.sendUserFileHint` | | `false` (all) | raw only | |
| `rendered[].content` | `Attribution for git commits and pull requests you create from here on…` | | raw only | `renderedRole` is `user` |

#### `output_style` — A one-line marker that an output style is active; written before almost every turn.

Census 27,695 records, 2.1.251 to 2.1.287. Feeds `events`, `attachments`. Every record carries the same value.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `attachment.type` | Discriminator | `output_style` | `attachments.attachment_type` | |
| `attachment.style` | Style name (a string here, an object in `output_style_instructions`) | `Plain speech` (all 27,695) | `attachments.name` | 27,388 of 27,789 re-scanned records repeat an identical earlier one in the same file |
| `rendered[].content` | `Plain speech output style is active. Remember to follow the specific guidelines for this style.` | | raw only | |

#### `output_style_instructions` — The full text of the active output style, written at start (2.1.268 and later).

Census 221 records. Feeds `events`, `attachments`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `attachment.type` | Discriminator | `output_style_instructions` | `attachments.attachment_type` | |
| `attachment.style.name` | Style name | `Plain speech` | `attachments.name` | |
| `attachment.style.prompt` | The style's rules text | `# How To Write\n\nThese rules are mandatory for every response. They app…` | `attachments.blob_ref` | 7 KB; 1 distinct value in 226 |
| `rendered[].content` | `# Output Style: <name>\n<prompt>` | | raw only | |

#### `auto_mode` — The permission mode the session is in, with the tool-use steering text for it.

Census 1,594 records, 2.1.263 to 2.1.287. Feeds `events`, `attachments`; derives `llm_sessions.permission_mode` and, on a change, an `intervention` event.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `attachment.type` | Discriminator | `auto_mode` | `attachments.attachment_type` | |
| `attachment.bypass` | Bypass-permissions mode is on | `true` (1,544), `false` (50) | derived: `llm_sessions.permission_mode = 'bypassPermissions'` when true, else `'auto'` | the rendered text says `While bypass permissions mode is active` or `While auto mode is active`; a change of value between records is a second event, kind `intervention`, subtype `mode-change`, key `<attachment event key>:intervention`, the new mode in `details_json` |
| `attachment.autoModeConsentFlow` | | `false` (all) | raw only | |
| `attachment.bashFirst` | Bash-first steering is on | `true` (all) | raw only | |
| `attachment.bashFirstSteer` | Steering strength | `relaxed` (1,566), `strict` (28) | raw only | `strict` only in 2.1.263 |
| `attachment.steerOnly` | | `true` (all) | raw only | |
| `rendered[].content` | The steering prose (3 distinct) | `While bypass permissions mode is active:\n\nYou can do much of your work through the Bash tool…` | `attachments.rendered_blob_ref` | the prose exists only here; `rendered` from 2.1.280 |

#### `prompt_snapshot` — The exact system prompt, and in newer versions the tool definitions, an API call was made with. Never shown to the model.

Census 5,153 records, 2.1.268 to 2.1.287. Feeds `events`, `attachments`. **239.9 MB, 17.1 percent of attachment bytes, 4.7 percent of the whole corpus; 111 distinct payloads in 5,177 records (7.4 MB distinct).** 91 percent are written at the start of a sub-agent session.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `attachment.type` | Discriminator | `prompt_snapshot` | `attachments.attachment_type` | |
| `attachment.systemPrompt[]` | System prompt split into blocks | `You are an agent for Claude Code, Anthropic's official CLI for Claude.`, `__SYSTEM_PROMPT_DYNAMIC_BOUNDARY__` | `attachments.blob_ref` (whole payload) | 4 to 15 blocks; the marker string separates the cacheable prefix from the dynamic tail. 13 distinct large blocks |
| `attachment.tools[]` | Tool definitions sent | `{name, description, schema}` | included in the blob | present on 2,575 of 5,153; 33 distinct descriptions. Only some records list tools, so `tools` absence is not "no tools" |
| `attachment.tools[].name` | Tool name | `Agent`, `Bash`, `Artifact` | included in the blob | 13 to 16 tools per record |
| `attachment.tools[].description` | Tool description text | `Launch a new agent to handle complex, multi-step tasks. Each agent typ…` | included in the blob | 78 MB raw, 0.28 MB distinct |
| `attachment.tools[].schema.*` | `name`, `description`, `input_schema` (JSON schema 2020-12) | `{"type":"object","properties":{"command":…}}` | included in the blob | the bulk of the 240 MB; collapsed here because every child maps the same way |
| `attachment.cliPrefix` | Identity line for the CLI | `You are Claude Code, Anthropic's official CLI for Claude, running within the Claude Agent SDK.` | `attachments.details_json` | 2,575 records; distinguishes the agent-SDK wording from the plain CLI wording |
| `attachment.contextRendering` | How context reminders are placed | `announced` (2,710) | raw only | from 2.1.282 |
| `attachment.echoWireToolInputs` | | `false` (2,710) | raw only | from 2.1.282 |
| `attachment.reminderFold` | | `false` (2,756) | raw only | from 2.1.281 |
| `attachment.keptReminders` | | `true` (1,357) | raw only | from 2.1.282 |
| `attachment.systemTurns` | | `true` (1,357) | raw only | from 2.1.282 |
| `attachment.inlineTools` | | `false` (267) | raw only | from 2.1.282 |
| `attachment.toolChangeHeader` | | `true` (267) | raw only | from 2.1.282 |

The set of present keys is itself version drift: 8 distinct key sets across 5,177 records. Schema drift detection must treat `tools`, `cliPrefix` and the 2.1.281+ flags as optional.

#### `credential_org` — The organisation the session's credentials belong to, written on every turn.

Census 1,379 records, 2.1.281 to 2.1.287. Feeds `events`, `attachments`. **Account identifier, one value in the whole corpus.**

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `attachment.type` | Discriminator | `credential_org` | `attachments.attachment_type` | |
| `attachment.organizationUuid` | Anthropic organisation id | `<redacted>` (a single uuid, 1,379 times) | `attachments.name` | not shown in UI previews; no `rendered` |

#### `total_tokens_reminder` — A countdown line telling the model how many tokens remain of a 15,000,000-token budget, written before most turns.

Census 169,790 records, 2.1.251 to 2.1.287. Feeds `events`, `attachments`. **52 percent of all attachment records, 7.7 percent of their bytes (108 MB, almost all of it envelope).**

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `attachment.type` | Discriminator | `total_tokens_reminder` | `attachments.attachment_type` | |
| `attachment.text` | The reminder text | `<total_tokens>15000000 tokens left</total_tokens>`, `<total_tokens>14951470 tokens left</total_tokens>` | `attachments.details_json` as `{"tokens_left": n}`; no blob | 94 bytes each. Main sessions begin at 15,000,000 (397 of 3,236 files); sub-agent files begin near 14.95M; the series is non-increasing in 3,089 of 3,236 files |
| `rendered[].content` | `<system-reminder>\n<total_tokens>…</total_tokens>\n</system-reminder>` | | raw only | |

### 5.2 Hooks

All four hook types: `attachment.hookEvent`, `.hookName` and `.toolUseID` mean the same thing. `toolUseID` is **a real `toolu_…` id for
PreToolUse and PostToolUse hooks** (all 14,580 toolu-keyed hook records match a `tool_use` block, and a `tool_result`, in the same file) and **a bare
hook-batch uuid for SessionStart, SubagentStart and SubagentStop** (it matches no tool and no record uuid). Every `hook_runs` row
therefore carries `hook_runs.tool_call_ref`, pointing at the `tool_calls` row whose `natural_key` is `'claude-code:' + toolUseID`, only when the id starts with `toolu_`; the uuid goes to `hook_runs.hook_group_id`. A SubagentStart batch is about a dozen `hook_success` records (one per `dungeonmaster-session-snippet <key>`
command) sharing one uuid, followed within 1 to 2 records by one `hook_additional_context` carrying ITS OWN, different uuid.

PreToolUse hook records are written AFTER the `assistant` tool_use record (parent is the assistant record) and before its
`tool_result`, so `tool_calls.latency_ms` (call to result) includes the hook's `durationMs`.

#### `hook_success` — A hook command exited 0.

Census 64,603 records, 2.1.251 to 2.1.287. Feeds `events`, `hook_runs`; `attachments` only for SessionStart. **153 MB, 10.9 percent of attachment bytes; SubagentStart rows are 71 percent of the records and 52 distinct (command, stdout) pairs in 45,845.**

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `attachment.type` | Discriminator | `hook_success` | `hook_runs.outcome = 'success'` | |
| `attachment.hookEvent` | Hook event | `SubagentStart` (45,782), `PreToolUse` (14,244), `SessionStart` (4,575), `PostToolUse` (2) | `hook_runs.hook_event` | |
| `attachment.hookName` | Event plus matcher | `SubagentStart:general-purpose`, `PreToolUse:Bash`, `SessionStart:startup`, `PreToolUse:mcp__dungeonmaster__discover` | `hook_runs.hook_name` | SessionStart matchers: `startup` 4,130, `clear` 404, plus `compact` and `resume`. SubagentStart: `general-purpose`, `workflow-subagent`, `Explore`, `fork` |
| `attachment.toolUseID` | See the section intro | `toolu_011NJTmFcMD2hNng9TwB6ZYh`, `c057d6a1-1a09-4c79-93a1-133dc75e1e4c` | `hook_runs.tool_call_ref` (toolu only); `hook_runs.hook_group_id` (uuid) | |
| `attachment.command` | The hook command line | `dungeonmaster-pre-bash` (7,834), `dungeonmaster-pre-mcp-caller` (6,470), `dungeonmaster-session-snippet ward` (4,132) | `hook_runs.command` | `hook_runs.hook_name` alone cannot tell the 12 snippet hooks of one SubagentStart batch apart |
| `attachment.exitCode` | Process exit code | `0` (all 64,603) | `hook_runs.exit_code` | always 0 here by definition |
| `attachment.durationMs` | Hook wall time | `334`, `161`, `2320` | `hook_runs.duration_ms` | |
| `attachment.stdout` | What the hook printed | SessionStart: raw text `<dungeonmaster-backgroundTasks>\n## Background…`; PreToolUse and SubagentStart: JSON `{"hookSpecificOutput":{…}}` | `hook_runs.output_preview` (300 characters; the table has no text column); the full SessionStart text is `attachments.blob_ref` (next row) | 86 MB raw, 2.5 MB distinct. SubagentStart stdout carries `additionalContext` (a snippet), duplicated by `hook_additional_context`. PreToolUse stdout JSON has `hookEventName`, `updatedInput` (the REWRITTEN tool input, 14,319 times) and rarely `permissionDecision` (`allow`, 5 times) |
| `attachment.content` | Injected text | `''` for SubagentStart and PreToolUse; the snippet text for SessionStart | `attachments.blob_ref` for SessionStart | non-empty on exactly the 4,636 SessionStart records |
| `attachment.stderr` | What the hook printed to stderr | `''` (64,793 of 64,815) | `hook_runs.stderr_preview` | non-empty on 22 records |
| `rendered[].content` | Only on SessionStart | `SessionStart:startup hook success: <dungeonmaster-backgroundTasks>…` | raw only | 2,940 of 53,631 eligible; none for SubagentStart or PreToolUse |

#### `hook_additional_context` — Text a hook asked to inject, delivered to the model (SubagentStart snippets; PostToolUse notes).

Census 3,408 records, 2.1.251 to 2.1.287. Feeds `events`, `attachments` (one row per element), `hook_runs`. **123 MB, 8.8 percent of attachment bytes.**

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `attachment.type` | Discriminator | `hook_additional_context` | `attachments.attachment_type` | |
| `attachment.hookEvent` | | `SubagentStart` (3,406), `PostToolUse` (2) | `hook_runs.hook_event` | row `outcome = 'success'` |
| `attachment.hookName` | | `SubagentStart`, `PostToolUse:Bash` | `attachments.name`, `hook_runs.hook_name` | no matcher suffix on SubagentStart here, unlike `hook_success` |
| `attachment.toolUseID` | | `7a317aed-6049-4a40-838a-8279053588e9`; `toolu_01AqRxCJd5y5LbQVQCFDuVfz` | `hook_runs.tool_call_ref` (toolu only), `hook_runs.hook_group_id` | for SubagentStart it does NOT equal the group id of the preceding `hook_success` records |
| `attachment.content[]` | One string per snippet or note | `<dungeonmaster-worktrees>\n## Worktrees\n\nApplies in any repo…`; `dungeonmaster gateway-sync ran after this npm install:…` | one `attachments` row per element (`part_idx`, `part_kind = 'hook-snippet'`, `name` = snippet tag, own `blob_ref`) | 7 to 15 elements per record, 1 to 2 KB each. 41 distinct elements across 37,928; whole-array hashing finds 3,174 distinct in 3,407 (order varies), so ARRAY-level dedupe fails and ELEMENT-level succeeds (0.07 MB vs 64 MB) |
| `rendered[].content` | `<hookName> hook additional context: ` plus elements joined by newline | | raw only | derivable exactly; 53 MB; 2,308 distinct |

#### `hook_non_blocking_error` — A hook command exited non-zero but the harness carried on. Mostly a broken or missing hook binary.

Census 615 records, 2.1.261 to 2.1.287. Feeds `events`, `hook_runs`, `errors`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `attachment.type` | Discriminator | `hook_non_blocking_error` | `hook_runs.outcome = 'non-blocking-error'` | |
| `attachment.hookEvent` | | `SubagentStart` (354), `PreToolUse` (244), `SessionStart` (15), `SubagentStop` (2) | `hook_runs.hook_event` | |
| `attachment.hookName` | | `SubagentStart:general-purpose`, `PreToolUse:Edit`, `PreToolUse:Write`, `PreToolUse:Bash` | `hook_runs.hook_name` | |
| `attachment.toolUseID` | | `toolu_01CoWpZYxYR29cBpGtD8ZA1F` | `hook_runs.tool_call_ref` (toolu only), `errors.tool_call_ref` | |
| `attachment.command` | | `dungeonmaster-pre-edit-lint` (199), `dungeonmaster-pre-bash` (39), `dungeonmaster-session-snippet consumerGatewayWrapper` (362) | `hook_runs.command` | |
| `attachment.exitCode` | | `1` (557), `127` (36), `134` (22) | `hook_runs.exit_code`; `errors.details_json` | `127` is `command not found` (binary missing from PATH); `134` is a node abort; `1` is the hook's own failure |
| `attachment.durationMs` | | `429`, `9` | `hook_runs.duration_ms` | |
| `attachment.stderr` | Failure text | `Failed with non-blocking status code: Unknown snippet key: consumerGatewayWrapper`; `…/bin/sh: 1: dungeonmaster-pre-bash: not found` | `errors.message` (first line), `hook_runs.output_preview` | 362 of the 615 are one cause: a snippet key the installed hook binary did not know. `errors.kind = 'hook-error'` |
| `attachment.stdout` | | `''` (all 615) | raw only | always empty |
| `rendered` | | absent | | never rendered: the model is not told |

#### `hook_blocking_error` — A hook refused something and its message was fed back to the model. Only ever `SubagentStop`.

Census 1,131 records, 2.1.265 to 2.1.285. Feeds `events`, `hook_runs`, and an `intervention` event.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `attachment.type` | Discriminator | `hook_blocking_error` | `hook_runs.outcome = 'blocking-error'` | |
| `attachment.hookEvent` | | `SubagentStop` (all) | `hook_runs.hook_event` | |
| `attachment.hookName` | | `SubagentStop` | `hook_runs.hook_name` | |
| `attachment.toolUseID` | | `92c9a486-edc0-4490-88ec-2cb837119bff` | `hook_runs.hook_group_id` | a uuid, never a tool id |
| `attachment.blockingError.command` | The hook command | `dungeonmaster-subagent-stop` | `hook_runs.command` | |
| `attachment.blockingError.blockingError` | The message given to the model | `You are ending your turn while a command you started in the background is STILL RUNNING. Your final …` | `hook_runs.output_preview` | the same text is written separately as a `user` record `Stop hook feedback:\n…` just before this attachment, so the two must not both become events that count as user messages; an unbounded loop is visible as 78 sessions, up to 118 repeats |
| `rendered[].content` | `SubagentStop hook blocking error from command: "<cmd>": <message>` | | raw only | only 29 records carry it |

Intervention: a second event, kind `intervention`, subtype `hook-block`, key `<attachment event key>:intervention`,
`details_json` `{source: 'hook', reason: <hook name>}`; the message itself stays in `hook_runs.output_preview`.

### 5.3 Queue, background tasks and modes

#### `queued_command` — Something delivered into a running turn from the queue: a user message typed mid-turn, a background-task completion, or another agent's message.

Census 2,043 records, 2.1.251 to 2.1.287. Feeds `events`, `content_blocks`, `background_tasks`, `turns`. It is an ARRIVAL,
never an intervention, and gets no `attachments` row: its own event is the only record of it. `origin.kind`
`coordinator`, `peer` or `task-notification` (or, with no `origin`, `commandMode = task-notification`) makes the event
kind `agent-message`, subtype that origin kind; `human` (or `commandMode = prompt` with no `origin`) makes it an ordinary
`user-message`, subtype `queued-human`. The paired `queue-operation` lines are the only intervention events.
970 of the 1,024 `queued_command` records in main-session files pair with a `queue-operation` `enqueue` then `remove` of the same
content (54 have no matching queue lines). `attachment.timestamp`, when present, always equals the record `timestamp`, and it equals the
`enqueue` operation's timestamp in 882 of 969 pairs, so treat it as the **enqueue time**, not the moment the model saw it.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `attachment.type` | Discriminator | `queued_command` | `events.kind` (see above) | |
| `attachment.commandMode` | What kind of command | `task-notification` (1,672), `prompt` (134); absent on 237 | `turns.origin`: `task-notification` or `queued`; with no `origin`, decides `events.kind` | |
| `attachment.prompt` | The delivered content | a string (2,042) or an array of content blocks (1, with an image); `<task-notification>\n<task-id>b38rbpsy5</task-id>…` | `content_blocks.text` of the event (blob over 4 KB, `content_blocks.blob_ref`); for an agent message, hashed for `events.link_key` | up to 104 KB; 1,045 distinct in 1,098 large. Array form is a pasted image: the `source.data` base64 goes to `artifacts` with `origin = 'image'` |
| `attachment.prompt[].type` / `.text` / `.source.{type,media_type,data}` | Text block and base64 image block (2.1.280, one record) | `text`, `wolf legs are borked... [Image #24]`, `image/png` | `content_blocks`-style handling: image bytes to `artifacts` | 1 record |
| `attachment.imagePasteIds[]` | Image placeholders in the prompt | `24` | raw only | 1 record |
| `attachment.timestamp` | Enqueue time | `2026-09-06T19:35:36.761Z` | `events.ts` | 1,806 of 2,043 |
| `attachment.source_uuid` | The `user` record this answers or came from | `269f0841-87e7-40e5-9db4-201a7961aa72` | `events.details_json` | 1,390; not found in the same file in the sampled cases |
| `attachment.isMeta` | Harness-generated, not typed | `true` | `events.is_meta` | 251, 2.1.261 to 2.1.286 |
| `attachment.humanTurn` | Delivered inside a real user turn | `true` | `events.details_json` | 78, from 2.1.278; selects the `renderedInHumanTurn` variant |
| `attachment.origin.kind` | Who sent it | `task-notification` (572), `coordinator` (175), `human` (120), `peer` (76) | `events.kind` (`agent-message` for coordinator, peer, task-notification; `user-message` for human) and `events.subtype` | 943 records carry `origin`; absent on older ones, where `commandMode` alone decides |
| `attachment.origin.from` | Sending agent's id | `a545ed9f747073e75` | `events.details_json.peerSessionKey` = `claude-code:<sessionId>/<id>` (the sender is a sub-agent of the same session) | 76 (kind `peer`) |
| `attachment.origin.senderTaskId` | Sender's task id | `a545ed9f747073e75` | `events.details_json` | equals `from` |
| `attachment.origin.name` | Sending agent type | `general-purpose`, `Explore`, `fork` | `events.details_json` | 70 |
| `attachment.origin.body` | The sender's message verbatim | `[Subagent hand-back] The text below is the final report of a subagent…` | `content_blocks.text` of the arrival; hashed for `events.link_key` = `<recipient agentId>:<sha256 of the body>` | 76. The hand-back text is the sub-agent's final report |
| `attachment.origin.handback` | Marks a sub-agent hand-back | `true` | `events.details_json` | 11, 2.1.285 and later |
| `attachment.origin.producer` | What produced the notification | `session-task` | raw only | 572, from 2.1.284 |
| `attachment.delivery_id` | Delivery uuid | `c59d8c0c-9356-4075-89aa-8da5b9b4e1d1` | `events.details_json.deliveryId` | 108, from 2.1.286 |
| `attachment.usage.totalTokens` | Finished task's token total | `146300`, `193665` | `background_tasks.reported_tokens` | 435, from 2.1.280; sub-agent task notifications only |
| `attachment.usage.toolUses` | Tool calls the task made | `37`, `60` | `background_tasks.reported_tool_uses` | |
| `attachment.usage.durationMs` | Task wall time | `483207`, `971314` | `background_tasks.ended_at - started_at` cross-check; `background_tasks.reported_duration_ms` | |
| `rendered[].content` / `renderedInHumanTurn[].content` | `[SYSTEM NOTIFICATION - NOT USER INPUT]…`; `The coordinator sent a message while you were working:…`; `Another Claude session sent a message while you were working:…` | | raw only | 1,545 and 1,262 |

**Parsing a task notification** (`commandMode = 'task-notification'`; the `prompt` string is XML-ish):

| Element | Examples | Maps to |
|---|---|---|
| `<task-id>` | `b38rbpsy5`, `acfccdbe0c2756929` | `background_tasks.natural_key = '<session>:task:<task-id>'` |
| `<tool-use-id>` | `toolu_016yfSqGz2pVMpWKmpqVNG2d` | `background_tasks.tool_call_ref` (the Bash or Agent call whose `natural_key` is `claude-code:<id>`) |
| `<output-file>` | `/tmp/claude-1001/…/tasks/b38rbpsy5.output` | `background_tasks.output_path` |
| `<status>` | `completed` | `background_tasks.status` |
| `<summary>` | `Background command "npm run ward -- --committed --uncommitted 2>&1" completed (exit code 0)`; `Agent "Relax gateway requireStub lint" finished` | `background_tasks.summary`, and the exit code inside it to `background_tasks.exit_code` |
| `<result>` | the sub-agent's final report | `background_tasks.result_preview` (300 characters); the full text is the event's `content_blocks.text` (`content_blocks.blob_ref` over 4 KB) |
| `<note>` | `A task-notification fires each time this agent stops with no live background children…` | raw only |

The same `task-id` can notify more than once (the note says so), so `background_tasks.ended_at` is the LAST notification and
earlier ones are `status`-history only.

#### `task_status` — A reminder that a background task is still running, or has finished, listing its output file.

Census 17 records, 2.1.263 to 2.1.286. Feeds `events`, `attachments`, `background_tasks`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `attachment.type` | Discriminator | `task_status` | `attachments.attachment_type` | |
| `attachment.taskId` | Task id | `a3a9cacfc6c573b45`, `b7opsoqgz` | `background_tasks.natural_key` = `<session>:task:<id>` | |
| `attachment.taskType` | Task kind | `local_agent` (16), `local_bash` (1) | `background_tasks.kind`: `local_agent` to `subagent`, `local_bash` to `bash` | |
| `attachment.description` | Human label | `F20 fix consumer-suite failures (worktree)`, `Scan every R-2 rule` | `background_tasks.description` | |
| `attachment.status` | | `running` (16), `completed` (1) | `background_tasks.status` | a `running` row is a heartbeat, not a start time |
| `attachment.deltaSummary` | Progress line | `Loading get-folder-detail for statics`; `null` | `background_tasks.result_preview` | |
| `attachment.outputFilePath` | Where the task writes output | `/tmp/claude-1001/…/tasks/b7opsoqgz.output` | `background_tasks.output_path` | |
| `attachment.shell.command` | The shell command (bash tasks) | `for r in raw-import-ban platform-globals-ban bin-program-spawn-ban…` | `background_tasks.description` fallback | 1 record, 2.1.286 |
| `attachment.shell.kind` | | `bash` | raw only | |
| `attachment.shell.toolUseId` | The Bash call that started it | `toolu_01SBEnEPmhkhjH8B6DMe9JR3` | `background_tasks.tool_call_ref` | camel-case `toolUseId`, unlike every other type's `toolUseID` |
| `rendered[].content` | `Background agent "<desc>" …` / `Background shell <id> ("<desc>") is still running…` | | raw only | |

#### `task_reminder` — A nudge to use the task-list tools, written when they have not been used for a while.

Census 106 records, 2.1.267 to 2.1.278. Feeds `events`, `attachments`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `attachment.type` | Discriminator | `task_reminder` | `attachments.attachment_type` | |
| `attachment.content[]` | Open task items | `[]` in every record | raw only | always empty |
| `attachment.itemCount` | | `0` | raw only | always 0 |
| `rendered[].content` | `The task tools haven't been used recently. If you're working on tasks that would benefit from tracking progress…` | | `attachments.rendered_blob_ref` | the prose exists only here |

#### `plan_mode` — Plan mode is active; the reminder is re-sent every few turns while it stays on.

Census 74 records, 2.1.261 to 2.1.286. Feeds `events`, `attachments`, and an `intervention` event on the first one.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `attachment.type` | Discriminator | `plan_mode` | `attachments.attachment_type` | |
| `attachment.reminderType` | Full or short reminder | `full` (64), `sparse` (10) | `attachments.details_json` | |
| `attachment.isSubAgent` | The session is a sub-agent | `true` (49), `false` (25) | `attachments.details_json` | |
| `attachment.planFilePath` | Plan file under `~/.claude/plans/` | `/home/brutus-home/.claude/plans/fine-go-plan-this-immutable-gem.md` | `attachments.name`; the intervention event's `details_json` | |
| `attachment.planExists` | Plan file written yet | `false` (61), `true` (13) | `attachments.details_json` | |
| `rendered[].content` | `Plan mode is active. The user indicated that they do not want you to execute yet…` | | raw only | |

Intervention: the FIRST `plan_mode` record after none (or after a `plan_mode_exit`) also makes an event of kind `intervention`,
subtype `mode-change`, key `<attachment event key>:intervention`, `details_json` `{mode: 'plan'}`; repeats are reminders, not changes.

#### `plan_mode_exit` — Plan mode ended.

Census 15 records, 2.1.261 to 2.1.286. Feeds `events`, `attachments`, and an `intervention` event.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `attachment.type` | Discriminator | `plan_mode_exit` | `attachments.attachment_type` | |
| `attachment.planFilePath` | The plan file | `/home/brutus-home/.claude/plans/fine-go-plan-this-immutable-gem.md` | `attachments.name` | |
| `attachment.planExists` | | `true` (8), `false` (7) | `attachments.details_json` | |
| `rendered[].content` | `## Exited Plan Mode\n\nYou have exited plan mode. You can now make edits…` | | raw only | 9 of 15 |

Intervention: an event of kind `intervention`, subtype `mode-change`, `details_json` `{mode: 'plan-off'}`.

#### `plan_mode_reentry` — Plan mode was re-entered after an earlier exit.

Census 1 record, 2.1.278. Feeds `events`, `attachments`, and an `intervention` event.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `attachment.type` | Discriminator | `plan_mode_reentry` | `attachments.attachment_type` | |
| `attachment.planFilePath` | The plan file | `/home/brutus-home/.claude/plans/go-understand-the-orchastrator-graceful-raven.md` | `attachments.name` | |
| `rendered[].content` | `## Re-entering Plan Mode\n\nYou are returning to plan mode after having previously e…` | | raw only | |

Interventions: `kind = 'mode-change'`, `preview = 'plan mode re-entered'`.

#### `goal_status` — The result of a `/goal` check: whether the stated condition was met.

Census 27 records, 2.1.272 to 2.1.273. Feeds `events`, `attachments`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `attachment.type` | Discriminator | `goal_status` | `attachments.attachment_type` | |
| `attachment.condition` | The goal text | `We must implement the tooling described in scrolls/seigelense/siegelense-tooling.md in all its nitty…` | `attachments.name` (capped), blob over 4 KB | up to 6.7 KB |
| `attachment.met` | Goal reached | `false` (23), `true` (4) | `attachments.details_json` | |
| `attachment.reason` | The checker's reason | `insufficient evidence in transcript` | `attachments.details_json` | 21 records |
| `attachment.sentinel` | A sentinel checker ran | `true` | `attachments.details_json` | 6 |
| `attachment.iterations` | Checks run | `2`, `4`, `1` | `attachments.details_json` | only on the 4 `met: true` records |
| `attachment.tokens` | Tokens the goal run used | `8510786`, `159895` | `attachments.details_json` | 4 records |
| `attachment.durationMs` | Goal run wall time | `38525643`, `2102715` | `attachments.details_json` | 4 records |
| `rendered` | | absent | | never rendered |

#### `command_permissions` — The tool allow-list a slash command or skill grants.

Census 17 records, 2.1.263 to 2.1.285. Feeds `events`, `attachments`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `attachment.type` | Discriminator | `command_permissions` | `attachments.attachment_type` | |
| `attachment.allowedTools[]` | Allowed tool patterns | `Read`, `WebFetch(domain:platform.claude.com)`; `[]` on 15 | `attachments.details_json` | |
| `rendered` | | absent | | never rendered |

### 5.4 Files and tool results

#### `edited_text_file` — A file the model had read changed on disk since; the harness reports the changed lines.

Census 3,460 records, 2.1.251 to 2.1.287. Feeds `events`, `attachments`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `attachment.type` | Discriminator | `edited_text_file` | `attachments.attachment_type` | |
| `attachment.filename` | Absolute path | `/home/brutus-home/projects/amalga-victorious/src/components/pages/Buil…` | `attachments.name`; `file_touches.path` (`source = 'attachment'`, `op = 'edit'`, `tool_call_ref` NULL) | |
| `attachment.displayPath` | Relative path | `worktrees/clean-test-baseline/packages/ward/CLAUDE.md` | `attachments.details_json` | 8 records, 2.1.268 to 2.1.273 |
| `attachment.snippet` | Numbered changed lines | `1\t// BuildPage — `/build/:mode`: a player builds a creature out of a b…` | `attachments.preview` (300 characters), `attachments.blob_ref` (the whole snippet) | 1 KB median, 9.6 KB max; almost all distinct (7.1 MB of 7.4 MB) |
| `rendered[].content` | `Note: <file> changed on disk since you last read it. That's usually deliberate…` | | raw only | |

This is the harness noticing a change made OUTSIDE the model's own tool calls (another agent, the user's editor). `file_touches` holds it:
`tool_call_ref` is NULL and `source = 'attachment'`.

#### `file` — A file the harness read on the model's behalf (an `@`-mention) and attached.

Census 29 records, 2.1.263 to 2.1.286. Feeds `events`, `attachments`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `attachment.type` | Discriminator | `file` | `attachments.attachment_type` | |
| `attachment.filename` | Absolute path | `/home/brutus-home/projects/codex-of-consentient-craft/worktrees/gatewa…` | `attachments.name`; `file_touches.path` (`source = 'attachment'`, `op = 'read'`, `tool_call_ref` NULL) | |
| `attachment.displayPath` | Relative path | `packages/orchestrator/src/contracts/smoketest-assertion/smoketest-asse…` | `attachments.details_json` | |
| `attachment.content.type` | Content kind | `text` | raw only | |
| `attachment.content.file.filePath` | Same path | | raw only | duplicate |
| `attachment.content.file.content` | The file text | `/**\n * PURPOSE: Discriminated union describing a single assertion eval…` | `attachments.blob_ref`, `attachments.chars` | 4 KB median, 12.7 KB max |
| `attachment.content.file.numLines` | Lines included | `50`, `139`, `152` | `attachments.details_json` | |
| `attachment.content.file.startLine` | First line included | `1` (all 29) | raw only | |
| `attachment.content.file.totalLines` | Lines in the file | `50`, `139` | `attachments.details_json` | |
| `rendered[]` | Two blocks: `Called the Read tool with the following input: {"file_path":…}` then `Result of calling the Read tool:\n1\t…` | | raw only | the model sees a synthetic Read call; no `tool_use` record exists, so there is no `tool_calls` row |

#### `read_truncation_notice` — A Read result was cut short; the notice names the file and the range shown.

Census 645 records, 2.1.257 to 2.1.287. Feeds `events`, `attachments`, `tool_results`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `attachment.type` | Discriminator | `read_truncation_notice` | `attachments.attachment_type` | |
| `attachment.banner` | The truncation text | `[Truncated: PARTIAL view — /home/brutus-home/projects/amalga-victoriou…` | `attachments.name` (path); `tool_results.details_json` as `truncated` | every banner begins `[Truncated: PARTIAL view — <path>` |
| `attachment.toolUseID` | The Read call | `toolu_01TmPmnFy2arUhmjgvyhSycC` | `attachments.tool_call_ref`, `tool_results.details_json` | all 646 match a `tool_use` in the same file; the parent record is a `user` (the tool_result) record |
| `rendered[].content` | The banner wrapped | | raw only | |

#### `bash_output_audience_note` — A marker that the harness appended an audience note to a Bash result (a one-version experiment).

Census 124 records, 2.1.263 only. Feeds `events`, `attachments`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `attachment.type` | Discriminator | `bash_output_audience_note` | `attachments.attachment_type` | |
| `attachment.toolUseID` | The Bash call | `toolu_01XzZDgiHzJj68DqBoPwbGtY` | `attachments.tool_call_ref` | all 124 match a `tool_use`; the note text itself is not in the record, only the marker |

#### `compact_file_reference` — After compaction, a file read earlier is named so the model can re-read it.

Census 11 records, 2.1.280 to 2.1.286. Feeds `events`, `attachments`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `attachment.type` | Discriminator | `compact_file_reference` | `attachments.attachment_type` | |
| `attachment.filename` | Absolute path | `/home/brutus-home/projects/amalga-victorious/tests/e2e/model-builder-animate.spec.ts`; a `/tmp/claude-…` spill path | `attachments.name` | spill paths here are the `tool-results/` files the compaction dropped |
| `attachment.displayPath` | Relative path | `tests/e2e/model-builder-animate.spec.ts`, `../../../../tmp/claude-1001/…` | raw only | |
| `rendered[].content` | `Note: <file> was read before the last conversation was summarized, but the contents are too large to include…` | | raw only | |

Joins to `compactions` by timestamp proximity within a session (no id links them).

#### `opened_file_in_ide` — The user opened a file in the connected IDE.

Census 171 records, 2.1.251 to 2.1.287. Feeds `events`, `attachments`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `attachment.type` | Discriminator | `opened_file_in_ide` | `attachments.attachment_type` | |
| `attachment.filename` | Absolute path | `/home/brutus-home/projects/amalga-victorious/plans/animation-model.md` | `attachments.name` | |
| `attachment.displayPath` | Relative path | `jest.config.base.js` | raw only | 1 record, 2.1.267 |
| `rendered[].content` | `The user opened the file <path> in the IDE…` | | raw only | 91 of 171 |

#### `selected_lines_in_ide` — The user selected lines in the connected IDE; the harness attaches the selection.

Census 69 records, 2.1.251 to 2.1.285. Feeds `events`, `attachments`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `attachment.type` | Discriminator | `selected_lines_in_ide` | `attachments.attachment_type` | |
| `attachment.ideName` | IDE | `WebStorm` (all 69) | `attachments.details_json` | |
| `attachment.filename` | Absolute path | `/home/brutus-home/projects/codex-of-consentient-craft/packages/web/src…` | `attachments.name` | |
| `attachment.displayPath` | Relative path | `packages/web/src/widgets/guild-session-list/guild-session-list-widget.…` | `attachments.details_json` | |
| `attachment.lineStart`, `attachment.lineEnd` | Selected range | `79`, `84` | `attachments.details_json` | |
| `attachment.content` | The selected text | `  <PixelBtnWidget\n          label={'+' as ButtonLabel}\n          onCli…` | `attachments.preview`, `attachments.blob_ref` over 4 KB | 730 bytes median, 6.4 KB max; the user's own code selection |
| `rendered[].content` | `The user selected the lines 79 to 84 from <path>:…` | | raw only | |

### 5.5 Reminders and diagnostics

#### `silent_turn_reminder` — The model has not messaged the user for a while; it is told to update them.

Census 505 records, 2.1.263 to 2.1.287. Feeds `events`, `attachments`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `attachment.type` | Discriminator | `silent_turn_reminder` | `attachments.attachment_type` | |
| `attachment.text` | The reminder | `The user hasn't heard from you in a while. As you continue, keep them updated when there's something…` | `attachments.details_json` (hash only) | 1 distinct value in 516; 183 bytes. 427 of 516 repeat an earlier identical record within the file. Useful as an event: a long silent stretch |
| `rendered[].content` | Same text, wrapped | | raw only | |

#### `batching_reminder_sent` — The harness injected a "batch your tool calls" prompt (a one-version experiment).

Census 273 records, 2.1.263 only. Feeds `events`, `attachments`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `attachment.type` | Discriminator | `batching_reminder_sent` | `attachments.attachment_type` | |
| `attachment.text` | The prompt text | `First privately list what you need next; then request every item that doesn't depend on another's re…` | `attachments.details_json` | |
| `attachment.model` | The model it was sent to | `claude-fable-5-1` (all 273) | `attachments.name` | |
| `rendered` | | absent | | |

#### `thinking_drop` — A request's extended-thinking blocks were dropped from the prefix, which busts the prompt cache.

Census 9 records, 2.1.282 to 2.1.287. Feeds `events`, `attachments`. Not model-visible; no `rendered`.

| Field path | Meaning in context | Examples | Maps to | Notes |
|---|---|---|---|---|
| `attachment.type` | Discriminator | `thinking_drop` | `attachments.attachment_type` | |
| `attachment.requestId` | API request id | `req_011CfbVqJoBKz3gCQ4HadvMD` | `attachments.details_json`; joins `messages.request_id` | a likely explanation for a cache write that should have been a read, so the natural companion to `usage.cache_write_tokens` (not verified against usage here) |
| `attachment.model` | Model of that request | `claude-opus-5-5`, `claude-sonnet-5-5`, `claude-opus-5-5[1m]` | `attachments.details_json` | |
| `attachment.querySource` | Which loop issued it | `repl_main_thread:outputStyle:custom`, `agent:builtin:general-purpose`, `agent:builtin:fork` | `attachments.details_json` | |
| `attachment.thinkingBlocksSent` | Thinking blocks in the request | `108`, `207`, `1` | `attachments.details_json` | |
| `attachment.thinkingTurnsSent` | Turns holding them | `84`, `156` | `attachments.details_json` | |
| `attachment.newlyDropped.blockCount` | Blocks dropped | `45`, `12`, `1` | `attachments.details_json` | |
| `attachment.newlyDropped.turnCount` | Turns affected | `37`, `10`, `1` | `attachments.details_json` | |
| `attachment.newlyDropped.reason` | Why | `prefix_mismatch` (8), `model_mismatch` (1) | `attachments.details_json` | |
| `attachment.newlyDropped.reasonCounts.{prefix_mismatch,model_mismatch}` | Per-reason counts | `4`, `7` | `attachments.details_json` | grouped: every child maps the same way |
| `attachment.newlyDropped.first.{messageIndex,blockIndex}` | First dropped position | `203`, `0` | `attachments.details_json` | grouped |
| `attachment.newlyDropped.last.{messageIndex,blockIndex}` | Last dropped position | `344`, `0` | `attachments.details_json` | grouped |
| `attachment.blockHashes[]` | Short hashes of dropped blocks | `1jcoad1swgkng`, `2708slydw7hyr` | raw only | |
| `attachment.clientChange.baseline` | What the prefix was compared with | `memory`, `none` | `attachments.details_json` | |
| `attachment.clientChange.callNumber` | Nth API call of the thread | `537`, `1`, `31` | `attachments.details_json` | |
| `attachment.clientChange.firstChangedMessageIndex` | First changed message | `0`, `818`, `-1` | `attachments.details_json` | `-1` means none |
| `attachment.clientChange.kinds` | Kind of change | `messagesHistoryChanged`, `none` | `attachments.details_json` | |
| `attachment.firstReportForThreadInProcess` | | `false` (all 9) | raw only | |

## 6. What is worth a blob, what stays raw-only

Raw copies of every record live in the archive regardless. This section is only about what the DERIVED tables should hold.
Bytes are from the re-scan; "distinct" is the number of different values of that field, which is what content-addressed storage keeps.

| Payload | Raw MB | Distinct values | Distinct MB | Decision |
|---|---|---|---|---|
| `nested_memory` `attachment.content.content` | 233.4 | 192 | 8.7 | **blob**, `attachments.blob_ref` |
| `nested_memory` `rendered[].content` | 188.3 | 789 | 19.8 | raw only; template over path plus content |
| `prompt_snapshot` whole payload | 239.2 | 111 | 7.4 | **blob** of the whole payload (design 3.5 said raw only; 111 distinct values in 5,177 makes one blob per version cheap and answers "what prompt did this session get"); stay raw otherwise |
| `hook_success` `attachment.stdout` | 86.4 | 841 | 2.5 | `hook_runs.output_preview` only; `attachments.blob_ref` for SessionStart text only |
| `hook_additional_context` `content[]` elements | 64.9 | 41 | 0.07 | **blob per element**, one `attachments` row per part |
| `hook_additional_context` `rendered[].content` | 53.0 | 2,308 | 50.9 | raw only; whole-text dedupe fails (element order varies) |
| `instructions` `files[].content` | 52.9 | 16 | 0.4 | **blob per file**, one `attachments` row per part |
| `instructions` `rendered[].content` | 53.8 | 28 | 0.7 | raw only |
| `skill_listing` `content` | 30.7 | 22 | 0.18 | **blob** |
| `session_context` `context.gitStatus` | 2.7 | 571 | 1.4 | blob; email field NEVER stored outside raw |
| `edited_text_file` `snippet` | 7.4 | 1,323 | 7.1 | blob over 4 KB only |
| `queued_command` `prompt` | 7.0 | 1,045 | 6.8 | blob over 4 KB only |
| `deferred_tools_record` `entries` | 9.9 | 1,697 whole-record | 3.2 | raw only |
| `mcp_instructions_delta` `addedBlocks[]` | 6.7 | 2 | 0.0 | **blob per element** |
| `agent_listing_delta` `addedLines[]` | 8.1 | 15 | 0.04 | blob |
| `total_tokens_reminder`, `output_style`, `date`, `model`, `auto_mode`, `silent_turn_reminder` | under 110 | a handful | 0 | metadata only; the envelope is most of the bytes |

After blobbing the large payloads above, what the derived layer keeps is on the order of 35 MB of distinct text for roughly 1.1 GB
of raw attachment bytes. Everything else is `attachments` rows, each at most a name, a char count, a hash and a small
`details_json`.

## Where the earlier proposals landed in `schema.md`

Every proposal this file once made is in the final schema.

| Source | Column |
|---|---|
| a 300-character preview of large text | `attachments.preview`, never filled for `session_context` |
| small per-type fields (`skillCount`, `isInitial`, `bypass`, `isWorktree`, `tokens_left`, `requestId`, `reminderType`, `met`) | `attachments.details_json` |
| the call a `read_truncation_notice`, `bash_output_audience_note` or PostToolUse `hook_additional_context` names | `attachments.tool_call_ref` |
| model-visible text of flag-only types | `attachments.rendered_blob_ref`, with `attachments.rendered_chars` |
| array payloads (`instructions.files[]`, `hook_additional_context.content[]`, `mcp_instructions_delta.addedBlocks[]`) | one `attachments` row per part (`part_idx`, `part_kind`, `name`, `chars`, `blob_ref`; `natural_key` plus `:<idx>`) |
| the hook command, exit code, duration | `hook_runs.command`, `hook_runs.exit_code`, `hook_runs.duration_ms` |
| the `toolUseID` uuid of SessionStart, SubagentStart and SubagentStop | `hook_runs.hook_group_id` |
| PreToolUse stdout `permissionDecision` | `hook_runs.permission_decision` |
| PreToolUse stdout `updatedInput`, the rewritten tool input | `hook_runs.updated_input_blob_ref` |
| failure text of a non-blocking hook error | `hook_runs.stderr_preview` |
| `hook_blocking_error` stop-hook refusals | `events.kind = 'intervention'`, subtype `hook-block` |
| `queued_command` `origin.kind`, `origin.from` | the arrival event's `events.subtype` and `events.details_json.peerSessionKey` |
| `task_status.description`, `<output-file>`, `outputFilePath` | `background_tasks.description`, `background_tasks.output_path` |
| `queued_command.usage.{durationMs,totalTokens,toolUses}` | `background_tasks.reported_duration_ms`, `reported_tokens`, `reported_tool_uses` |
| exit code in a Bash task's `<summary>` | `background_tasks.exit_code` |
| envelope `slug`, `sessionKind` | `llm_sessions.slug`, `llm_sessions.session_kind` |
| the `prompt_snapshot` blob of a session's first snapshot | `llm_sessions.system_prompt_blob_ref` |

`errors` takes `kind = 'harness-error'` for `failedMcpServers` and `'hook-error'` for non-blocking hook failures. A
`goal_status` record gets no `intervention` event (27 records stay in `attachments`).

## Open questions

1. ANSWERED 2026-10-01 (design §4.2, §16): `queued_command` creates NO intervention. It is an arrival, recorded once as its own event (`agent-message`, or `user-message` for a human); the paired `queue-operation` lines stay the `enqueue` and `remove` intervention events, so nothing double-counts.
2. **Where do `edited_text_file` and `file` events live?** Both are file reads or changes with no tool call (3,460 and 29 records). ANSWERED by `schema.md`: `file_touches.tool_call_ref` is nullable and `source = 'attachment'` marks these rows (`edited_text_file` is `op = 'edit'`, `file` is `op = 'read'`). A file changed behind the model's back stays visible as a health signal (two agents on one file).
3. **Is `total_tokens_reminder` a cumulative-spend series?** It counts down from 15,000,000 in 52 percent of all attachment records and is the only per-turn running total the transcript carries. Checking it against summed `usage` would validate both. Not verified here; the series is non-increasing in 3,089 of 3,236 files and the 147 exceptions are unexplained (resumes or compactions are the likely cause).
4. **Does the design's raw-only call on `prompt_snapshot` hold?** It is 4.7 percent of the whole corpus but 111 distinct payloads, and it is the only record of the exact system prompt a role ran under, which `quest-forensics`-style prompt-fit work needs. Section 6 recommends blobbing the whole payload; the cost is about 7 MB.
5. **Pre-2.1.268 context.** Before 2.1.268 none of `environment`, `model`, `session_context`, `instructions`, `date`, `remote_session_change`, `prompt_snapshot` or `output_style_instructions` exist as attachments, and there is no `rendered`. Whether the same text exists elsewhere in those older transcripts (for example as `isMeta` user messages) was not checked; if it does, a normalizer keyed on version must map both shapes to the same `attachments` rows.
6. **Hook-loop detection.** 78 sub-agent sessions in 2.1.266 hit the SubagentStop blocking hook up to 118 times each. `hook_runs` rows make it countable; whether it deserves its own failure `cause` in `tool_call_causes.cause` / `rollup_session.failures_by_cause_json` (the canonical list is design §8.1B, where today a stop-hook refusal is `hook-refusal`) is a design call.
7. **`rendered` for pre-2.1.268 View Context.** If View Context must show the model-visible text for older records, the normalizer needs the templates per type (they are fixed prefix and suffix text, verified exact for `hook_additional_context`). The templates for the other types were read from samples, not exhaustively verified.
8. **Account identifiers.** `credential_org.organizationUuid` and `session_context.context.userEmail` are in the raw archive by necessity. Confirm the archive's access policy before any export path exists; they must stay out of every derived column, preview and UI string.
