# chronicle-llm: table schemas

Status: draft for review, 2026-10-01. This is the full SQLite schema for `<home>/data/chronicle.db`,
written against `node:sqlite` on Node 24.15+. `design.md` says why each table exists. The field maps
(`field-map-claude-code.md` and `field-map-antigravity.md`) say which source field fills each column.

## Conventions every table follows

| Rule | Detail |
|---|---|
| Integer keys inside | every table's storage key is an `INTEGER PRIMARY KEY`; the deterministic TEXT ids below are stored once, as a unique `natural_key`, on `runs`, `messages`, `events` and `tool_calls`, and child tables reference the integers. The TEXT ids are written below for readability; the implementation applies this rule (benchmark: `design.md` §12.1). |
| Ids are TEXT and deterministic | `run_id = '<harness>:<native run id>'`. A child id extends its parent's: `event_id = '<run_id>:<native record id or pos>'`. Re-reading a source can never mint a second row. |
| Times | `INTEGER` milliseconds since the Unix epoch, UTC, named `*_at` or `ts` |
| Durations | `INTEGER` milliseconds, named `*_ms` |
| Tokens and counts | `INTEGER`, never NULL where 0 is the true value |
| Money | `REAL` US dollars, named `*_usd`, always an ESTIMATE from `pricing` unless the column name says `reported` |
| Booleans | `INTEGER` 0 or 1 |
| JSON | `TEXT` holding JSON, named `*_json`, only for small, tool- or harness-specific detail never filtered on |
| Provenance | every derived row carries `raw_id` (the raw record it came from) and `normalizer` (`'<harness>/<normalizer>@<version>'`) |
| Large text | never inline past 4 KB. The full text is a blob (`blob_hash`) or the raw archive. The row keeps a `*_preview` capped at 200 characters (300 on `content_blocks`), stored in ONE table per fact, plus `*_chars` |
| Claude sub-agent run ids | `claude-code:<sessionId>/<agentId>`, because one `agent-<id>.jsonl` name can appear under two sessions |
| Readers | never hold a read transaction across polling ticks; a held snapshot stops WAL checkpoints |
| Repeated native ids | a harness that reuses an id inside one run (agy `call_<n>`, 31 cases seen) gets `~<n>` appended for the second and later uses: `<run_id>:call_7~2` |
| API message ids are global | `messages` and `usage` are keyed on the harness's own message id across ALL files. The first file to write a message owns its row; a resumed session's copy only adds `events` rows (`copied_from_event_id`). |
| Compaction calls | a summarising call that is not a generation gets message id `<run_id>:ckpt:<idx>` (agy CHECKPOINT steps carry their own usage) |
| Stdout times | stdout `system/*`, `result` and `rate_limit_event` lines carry no time, so the spool stores each line's `received_at` and that is the row's `ts` |
| Pragmas | `journal_mode=WAL`, `synchronous=NORMAL`, `foreign_keys=ON`, `busy_timeout=5000`, schema version in `user_version` |

## 1. Ingest and provenance

```sql
CREATE TABLE meta (
  key   TEXT PRIMARY KEY,        -- 'home_kind' ('prod' | 'published' | 'dev' | 'worktree' | 'test' | 'lane')
                                 -- 'ingest_scope' ('all' | 'registered'), 'process_mode' ('persistent' | 'parent-bound')
                                 -- 'schema_state' ('ready' | 'migrating' | 'failed' | 'too-new')
                                 -- 'first_run_state', 'history_import_progress', 'last_full_scan_at', ...
  value TEXT NOT NULL
);

CREATE TABLE schema_migrations (
  version      INTEGER PRIMARY KEY,   -- equals PRAGMA user_version after it ran
  name         TEXT NOT NULL,
  checksum     TEXT NOT NULL,         -- hash of the migration file, so an edited released migration is caught
  applied_at   INTEGER NOT NULL,
  duration_ms  INTEGER NOT NULL
);

CREATE TABLE sources (
  source_id          TEXT PRIMARY KEY,   -- '<harness>:<kind>:<locator hash>'
  harness            TEXT NOT NULL,      -- 'claude-code', 'antigravity', 'dungeonmaster', ...
  kind               TEXT NOT NULL,      -- 'transcript-jsonl' | 'subagent-meta-json' | 'spill-file' | 'workflow-journal'
                                         -- | 'sqlite-conversation' | 'sqlite-summaries' | 'subagent-link-json'
                                         -- | 'agent-message-json' | 'history-jsonl' | 'cli-log'
                                         -- | 'task-output' | 'session-registry' | 'file-backup'
                                         -- | 'stdout-spool' | 'first-party'
  locator            TEXT NOT NULL,      -- absolute path, or 'first-party:<name>'
  run_id             TEXT,               -- the run this source feeds, once known
  watermark_json     TEXT NOT NULL DEFAULT '{}',
                                         -- JSONL: {byteOffset, lineNo, inode, size}
                                         -- SQLite: {maxIdx, openIdx:[...], maxGenIdx}
                                         -- whole-file: {hash}
  head_hash          TEXT,               -- hash of the first 64 KB: detects a replaced file
  normalizer         TEXT,               -- normalizer that last read it
  state              TEXT NOT NULL DEFAULT 'dirty',   -- 'idle' | 'dirty' | 'reading' | 'error' | 'reingest' | 'gone'
  priority           TEXT NOT NULL DEFAULT 'history', -- 'live' | 'recent' | 'history'
  last_error         TEXT,
  discovered_at      INTEGER NOT NULL,
  last_read_at       INTEGER,
  gone_at            INTEGER              -- the harness deleted the file; our archive still has it
);
CREATE INDEX sources_queue ON sources(state, priority);
CREATE INDEX sources_run   ON sources(run_id);

CREATE TABLE archive_segments (
  segment_id         INTEGER PRIMARY KEY,
  source_id          TEXT NOT NULL REFERENCES sources(source_id),
  path               TEXT NOT NULL,      -- <home>/data/archive/<source hash>/<n>.seg
  first_pos          INTEGER NOT NULL,
  last_pos           INTEGER NOT NULL,
  raw_bytes          INTEGER NOT NULL,
  stored_bytes       INTEGER NOT NULL,   -- zstd-compressed chunks
  sealed             INTEGER NOT NULL DEFAULT 0,
  format_version     INTEGER NOT NULL,   -- also in the segment file header
  created_at         INTEGER NOT NULL
);
CREATE INDEX archive_segments_source ON archive_segments(source_id, last_pos);

CREATE TABLE raw_records (
  raw_id             INTEGER PRIMARY KEY,
  source_id          TEXT NOT NULL REFERENCES sources(source_id),
  pos                INTEGER NOT NULL,   -- JSONL line number (0-based) | SQLite step idx | 0 for a whole file
  sub_table          TEXT NOT NULL DEFAULT '',  -- SQLite only: 'steps' | 'gen_metadata' | 'executor_metadata' | ...
  content_hash       TEXT NOT NULL,      -- sha256 of the raw bytes
  segment_id         INTEGER NOT NULL REFERENCES archive_segments(segment_id),
  chunk_offset       INTEGER NOT NULL,   -- byte offset of the compressed chunk in the segment
  record_offset      INTEGER NOT NULL,   -- byte offset of the record inside the decompressed chunk
  chunk_stored_bytes INTEGER NOT NULL,   -- compressed chunk length, so a read seeks straight to it
  record_len         INTEGER NOT NULL,
  record_type        TEXT,               -- 'assistant', 'user', 'attachment/skill_listing', 'step/15', ...
  harness_version    TEXT,               -- '2.1.287', ...
  ts                 INTEGER,            -- the record's own timestamp, when it has one
  ingested_at        INTEGER NOT NULL,
  UNIQUE (source_id, sub_table, pos)
);
CREATE INDEX raw_records_type ON raw_records(record_type, harness_version);

CREATE TABLE raw_revisions (            -- a record at the same position changed after we read it
  source_id          TEXT NOT NULL,
  sub_table          TEXT NOT NULL,
  pos                INTEGER NOT NULL,
  old_hash           TEXT NOT NULL,
  new_hash           TEXT NOT NULL,
  old_segment_id     INTEGER NOT NULL,   -- the old bytes stay readable in the archive
  old_record_offset  INTEGER NOT NULL,
  seen_at            INTEGER NOT NULL,
  expected           INTEGER NOT NULL    -- 1 when the harness is known to update this row (an agy step
                                         -- moving to a terminal status); 0 is drift
);

CREATE TABLE schema_observations (
  harness            TEXT NOT NULL,
  harness_version    TEXT NOT NULL,
  record_type        TEXT NOT NULL,
  field_path         TEXT NOT NULL,      -- 'message.usage.cache_creation.ephemeral_1h_input_tokens'
  value_type         TEXT NOT NULL,      -- 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null' | 'bytes'
  parsed             INTEGER NOT NULL,   -- 1 when a normalizer declares it reads this path
  count              INTEGER NOT NULL,
  first_seen_at      INTEGER NOT NULL,
  last_seen_at       INTEGER NOT NULL,
  example_raw_id     INTEGER,
  PRIMARY KEY (harness, harness_version, record_type, field_path, value_type)
);

CREATE TABLE schema_drift (
  drift_id           INTEGER PRIMARY KEY,
  harness            TEXT NOT NULL,
  harness_version    TEXT,
  kind               TEXT NOT NULL,      -- 'new-path' | 'vanished-path' | 'type-change' | 'unknown-record-type'
                                         -- | 'unknown-harness-version' | 'record-rewritten' | 'file-replaced'
  record_type        TEXT,
  field_path         TEXT,
  detail             TEXT NOT NULL,
  example_raw_id     INTEGER,
  first_seen_at      INTEGER NOT NULL,
  acknowledged_at    INTEGER
);

CREATE TABLE parse_errors (
  raw_id             INTEGER NOT NULL REFERENCES raw_records(raw_id),
  normalizer         TEXT NOT NULL,
  error              TEXT NOT NULL,
  at                 INTEGER NOT NULL,
  PRIMARY KEY (raw_id, normalizer)
);

CREATE TABLE ingest_jobs (
  job_id             INTEGER PRIMARY KEY,
  cause              TEXT NOT NULL,      -- 'live' | 'startup-catch-up' | 'first-run-week' | 'history'
                                         -- | 'reingest:<normalizer bump|file-replaced|wipe|manual>'
  started_at         INTEGER NOT NULL,
  finished_at        INTEGER,
  sources_read       INTEGER NOT NULL DEFAULT 0,
  records_read       INTEGER NOT NULL DEFAULT 0,
  bytes_read         INTEGER NOT NULL DEFAULT 0,
  errors             INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE normalizer_state (          -- state a normalizer carries between batches of one run
  run_id             TEXT PRIMARY KEY,
  normalizer         TEXT NOT NULL,
  state_json         TEXT NOT NULL,      -- calls awaiting a result, sub-agents awaiting a parent link, open agy rows
  updated_at         INTEGER NOT NULL
);

CREATE TABLE harness_versions (          -- every harness version seen, and where we learned it
  harness            TEXT NOT NULL,
  version            TEXT NOT NULL,
  first_seen_at      INTEGER NOT NULL,
  last_seen_at       INTEGER NOT NULL,
  evidence           TEXT NOT NULL,      -- 'record-field' (Claude per-line version) | 'cli-log' (agy rotating logs)
                                         -- | 'stdout-init' | 'statusline'
  PRIMARY KEY (harness, version)
);
```

## 2. Runs and how they link to dungeonmaster

```sql
CREATE TABLE runs (
  run_id                 TEXT PRIMARY KEY,
  harness                TEXT NOT NULL,
  native_id              TEXT NOT NULL,  -- Claude sessionId or agentId; agy conversation uuid
  kind                   TEXT NOT NULL,  -- 'session' | 'subagent' | 'fork' | 'workflow-agent' | 'command'
  parent_run_id          TEXT REFERENCES runs(run_id),
  spawned_by_tool_call_id TEXT,          -- the tool call that started this run
  spawn_depth            INTEGER NOT NULL DEFAULT 0,
  agent_type             TEXT,           -- Claude meta agentType; agy subagent typeName
  agent_role             TEXT,           -- agy subagent role
  description            TEXT,           -- the spawning call's description
  title                  TEXT,           -- Claude ai-title/custom-title; agy summaries title
  cwd                    TEXT,
  repo_path              TEXT,           -- cwd resolved to its git root
  workspace_uris_json    TEXT,           -- agy workspace_uris
  git_branch             TEXT,
  entrypoint             TEXT,           -- Claude 'cli' | 'sdk-cli' | ...; agy source
  is_interactive         INTEGER NOT NULL,
  is_fork                INTEGER NOT NULL DEFAULT 0,
  forked_from_run_id     TEXT,           -- Claude fork-context-ref / continued-in
  harness_version_first  TEXT,
  harness_version_last   TEXT,
  model_first            TEXT,
  permission_mode        TEXT,
  slug                   TEXT,           -- Claude's own session nickname
  session_kind           TEXT,           -- Claude 'bg' for background sessions
  request_shape          TEXT,           -- Claude sub-agent 'background' | 'foreground'
  os_pid                 INTEGER,        -- joins the harness's live process registry
  system_prompt_blob_hash TEXT,          -- the first prompt snapshot
  last_prompt_preview    TEXT,
  started_at             INTEGER,
  last_activity_at       INTEGER,
  ended_at               INTEGER,
  end_state              TEXT NOT NULL DEFAULT 'unknown',  -- 'running' | 'exited' | 'signalled' | 'killed'
                                                           -- | 'stopped-by-user' | 'unknown'
  raw_id                 INTEGER,
  normalizer             TEXT,
  UNIQUE (harness, native_id)
);
CREATE INDEX runs_parent   ON runs(parent_run_id);
CREATE INDEX runs_activity ON runs(last_activity_at);
CREATE INDEX runs_repo     ON runs(repo_path, started_at);

CREATE TABLE run_links (                 -- dungeonmaster work a run belongs to
  run_id             TEXT PRIMARY KEY REFERENCES runs(run_id),
  guild_id           TEXT,
  quest_id           TEXT,
  work_item_id       TEXT,
  role               TEXT,               -- codeweaver, chaoswhisperer, ...
  step               TEXT,               -- plan, work, review, ...
  linked_by          TEXT NOT NULL,      -- 'dispatcher' (registered at spawn) | 'inherited' (sub-agent)
                                         -- | 'quest-file' (backfilled from quest.json sessions) | 'inferred'
  linked_at          INTEGER NOT NULL
);
CREATE INDEX run_links_quest ON run_links(quest_id);
CREATE INDEX run_links_item  ON run_links(work_item_id);

CREATE TABLE run_inits (                 -- from a stream-json 'init' line; one process can print several
  run_id             TEXT NOT NULL REFERENCES runs(run_id),
  init_uuid          TEXT NOT NULL,
  init_seq           INTEGER NOT NULL,
  ts                 INTEGER NOT NULL,   -- the spool's received_at
  model              TEXT,
  permission_mode    TEXT,
  harness_version    TEXT,
  api_key_source     TEXT,
  tools_json         TEXT,               -- the tool list
  mcp_servers_json   TEXT,               -- [{name, status, source}]
  agents_json        TEXT,
  skills_json        TEXT,
  raw_id             INTEGER, normalizer TEXT,
  PRIMARY KEY (run_id, init_uuid)
);

CREATE TABLE run_results (               -- from a stream-json 'result' line; one process can print several.
                                         -- Cost and API time are CUMULATIVE, so a run's totals are its LAST row.
  run_id             TEXT NOT NULL REFERENCES runs(run_id),
  result_uuid        TEXT NOT NULL,
  result_seq         INTEGER NOT NULL,
  origin_kind        TEXT,
  ts                 INTEGER NOT NULL,   -- the spool's received_at
  subtype            TEXT,               -- 'success' | 'error_max_turns' | ...
  is_error           INTEGER NOT NULL,
  duration_ms        INTEGER,
  duration_api_ms    INTEGER,
  ttft_ms            INTEGER,
  num_turns          INTEGER,
  reported_cost_usd  REAL,
  stop_reason        TEXT,
  terminal_reason    TEXT,
  result_preview     TEXT,
  permission_denials_json TEXT,
  subagent_stats_json     TEXT,
  model_usage_json        TEXT,
  api_error_status   INTEGER,
  ttft_stream_ms     INTEGER,
  time_to_request_ms INTEGER,
  raw_id             INTEGER, normalizer TEXT,
  PRIMARY KEY (run_id, result_uuid)
);
```

## 3. What happened inside a run

```sql
CREATE TABLE turns (
  turn_id            TEXT PRIMARY KEY,   -- '<run_id>:<promptId or first event pos>'
  run_id             TEXT NOT NULL REFERENCES runs(run_id),
  prompt_id          TEXT,
  origin             TEXT NOT NULL,      -- 'user' | 'queued' | 'scheduled' | 'task-notification' | 'resume' | 'system'
                                         -- | 'sdk' | 'peer' | 'coordinator' | 'workflow'
  origin_ref         TEXT,               -- the scheduled task id or notification task id that started it
  scheduled_task_id  TEXT,
  prompt_index       INTEGER,
  turn_index         INTEGER,
  started_at         INTEGER NOT NULL,
  ended_at           INTEGER,
  duration_ms        INTEGER,            -- Claude system/turn_duration when present, else derived
  message_count      INTEGER,
  pending_background_agents INTEGER,     -- the turn ended with work still running
  pending_workflows  INTEGER,
  raw_id             INTEGER, normalizer TEXT
);
CREATE INDEX turns_run ON turns(run_id, started_at);

CREATE TABLE messages (                  -- one API message, or one user/system message
  message_id         TEXT PRIMARY KEY,   -- '<harness>:<native message id>'; Claude message.id, agy '<conv>:gen:<idx>'
  run_id             TEXT NOT NULL REFERENCES runs(run_id),
  turn_id            TEXT,
  role               TEXT NOT NULL,      -- 'user' | 'assistant' | 'system'
  model              TEXT,
  stop_reason        TEXT,
  request_id         TEXT,
  started_at         INTEGER,
  completed_at       INTEGER,
  is_synthetic       INTEGER NOT NULL DEFAULT 0,  -- Claude '<synthetic>' model records
  is_api_error       INTEGER NOT NULL DEFAULT 0,
  is_aborted         INTEGER NOT NULL DEFAULT 0,  -- the stream was cut off mid-message
  effort             TEXT,               -- Claude perTurnEffort/effort; agy reasoning effort ('low' | 'medium' | 'high' | 'xhigh')
  ttft_ms            INTEGER,
  thinking_duration_ms INTEGER,
  provisional        INTEGER NOT NULL DEFAULT 0,  -- seen on stdout, transcript copy not read yet
  raw_id             INTEGER, normalizer TEXT
);
CREATE INDEX messages_run ON messages(run_id, started_at);

CREATE TABLE events (                    -- the ordered timeline of a run; what the chat UI renders
  event_id           TEXT PRIMARY KEY,   -- '<run_id>:<uuid>' (Claude) | '<run_id>:step:<idx>' (agy)
  run_id             TEXT NOT NULL REFERENCES runs(run_id),
  seq                INTEGER NOT NULL,   -- order inside the run
  ts                 INTEGER,
  kind               TEXT NOT NULL,      -- 'user-message' | 'assistant-block' | 'tool-call' | 'tool-result'
                                         -- | 'system' | 'attachment' | 'queue-op' | 'compaction'
                                         -- | 'command-line' | 'meta' | 'error'
  subtype            TEXT,               -- record subtype: 'turn_duration', 'skill_listing', step type, ...
  message_id         TEXT,
  turn_id            TEXT,
  parent_event_id    TEXT,               -- Claude parentUuid
  tool_call_id       TEXT,
  copied_from_event_id TEXT,             -- a resumed session re-writes earlier records; the copy points at the original
  is_meta            INTEGER NOT NULL DEFAULT 0,  -- harness-injected context, not shown by default
  origin             TEXT NOT NULL,      -- 'transcript' | 'stdout' | 'both' | 'first-party'
  text_preview       TEXT,
  raw_id             INTEGER, normalizer TEXT,
  UNIQUE (run_id, seq)
);
CREATE INDEX events_ts   ON events(run_id, ts);
CREATE INDEX events_tool ON events(tool_call_id);

CREATE TABLE content_blocks (
  event_id           TEXT NOT NULL REFERENCES events(event_id),
  parent_idx         INTEGER NOT NULL DEFAULT -1,  -- a block nested inside a tool_result (images, tool references)
  idx                INTEGER NOT NULL,   -- Claude apiBlockIndex or array index
  block_type         TEXT NOT NULL,      -- 'text' | 'thinking' | 'tool_use' | 'tool_result' | 'image' | 'document' | 'other'
  text_preview       TEXT,
  text_chars         INTEGER,
  blob_hash          TEXT,               -- full text or image bytes
  mime               TEXT,
  tool_call_id       TEXT,
  duration_ms        INTEGER,            -- thinking duration, where reported
  PRIMARY KEY (event_id, parent_idx, idx)
);

CREATE TABLE tool_calls (
  tool_call_id       TEXT PRIMARY KEY,   -- '<run_id>:<native call id>' (toolu_..., call_<n>)
  run_id             TEXT NOT NULL REFERENCES runs(run_id),
  message_id         TEXT,
  call_event_id      TEXT,
  native_call_id     TEXT NOT NULL,
  tool_name          TEXT NOT NULL,      -- 'Bash', 'mcp__dungeonmaster__quest-work', 'run_command', ...
  tool_server        TEXT,               -- MCP server name, parsed from the tool name
  input_json         TEXT,               -- inline when under 4 KB
  input_blob_hash    TEXT,
  input_summary      TEXT,               -- capped at 300 characters
  requested_at       INTEGER NOT NULL,
  started_at         INTEGER,            -- serialised start, for parallel calls in one turn
  completed_at       INTEGER,
  latency_ms         INTEGER,
  waiting_ms         INTEGER,            -- time waiting on user approval, kept out of active time
  status             TEXT NOT NULL,      -- 'pending' | 'running' | 'ok' | 'error' | 'denied' | 'interrupted' | 'cancelled' | 'orphaned'
  denial_kind        TEXT,               -- Claude toolDenialKind
  cause              TEXT,               -- shared failure cause, see design.md
  sub_cause          TEXT,
  spawned_run_id     TEXT,               -- Agent / invoke_subagent
  background_task_id TEXT,
  raw_id             INTEGER, normalizer TEXT
);
CREATE INDEX tool_calls_run    ON tool_calls(run_id, requested_at);
CREATE INDEX tool_calls_status ON tool_calls(status, cause);
CREATE INDEX tool_calls_name   ON tool_calls(tool_name, requested_at);

CREATE TABLE tool_results (
  tool_call_id       TEXT PRIMARY KEY REFERENCES tool_calls(tool_call_id),
  result_event_id    TEXT,
  is_error           INTEGER NOT NULL,
  soft_failure       TEXT,               -- 'ward' | 'jest' | 'tsc': exited 0 but its output reports a failing check
  exit_code          INTEGER,
  interrupted        INTEGER,
  reported_duration_ms INTEGER,          -- only when the harness reports one
  shape              TEXT,               -- 'text' | 'object' | 'error-string' | 'mcp-blocks' | 'image' | 'typed-step'
  text_preview       TEXT,
  text_chars         INTEGER,
  blob_hash          TEXT,
  persisted_path     TEXT,               -- Claude spill-file path the harness wrote
  details_json       TEXT,               -- small tool-specific fields (see the field maps)
  raw_id             INTEGER, normalizer TEXT
);

CREATE TABLE file_touches (              -- every file a tool call read or changed
  tool_call_id       TEXT NOT NULL REFERENCES tool_calls(tool_call_id),
  path               TEXT NOT NULL,
  op                 TEXT NOT NULL,      -- 'read' | 'create' | 'edit' | 'write' | 'delete'
  lines_added        INTEGER,
  lines_removed      INTEGER,
  source             TEXT NOT NULL DEFAULT 'tool-result',  -- 'tool-result' | 'bash-diff' | 'input-fallback'
  attribution        TEXT,               -- 'exact' | 'shared' (other writers shared the checkout)
  PRIMARY KEY (tool_call_id, path, op)
);
CREATE INDEX file_touches_path ON file_touches(path);

CREATE TABLE background_tasks (
  task_id            TEXT PRIMARY KEY,   -- '<run_id>:<native task id>'
  run_id             TEXT NOT NULL REFERENCES runs(run_id),
  tool_call_id       TEXT,
  kind               TEXT,               -- 'bash' | 'subagent' | 'workflow' | 'mcp' | 'command'
  origin             TEXT,               -- 'explicit' | 'timeout' | 'user' | 'message-delivery'
  is_background      INTEGER,
  description        TEXT,
  started_at         INTEGER,
  ended_at           INTEGER,
  status             TEXT,
  summary            TEXT,
  result_preview     TEXT,
  output_path        TEXT,               -- where the harness wrote the task's output
  exit_code          INTEGER,
  reported_duration_ms INTEGER,
  reported_tokens    INTEGER,
  reported_tool_uses INTEGER,
  notification_count INTEGER,
  raw_id             INTEGER, normalizer TEXT
);

CREATE TABLE usage (                     -- ONE row per API message, from its final record only
  message_id         TEXT PRIMARY KEY REFERENCES messages(message_id),
  run_id             TEXT NOT NULL REFERENCES runs(run_id),
  ts                 INTEGER NOT NULL,
  provider           TEXT NOT NULL,      -- 'anthropic' | 'google' | 'ollama' | ...
  model              TEXT NOT NULL,
  input_tokens       INTEGER NOT NULL,   -- UNCACHED input, normalised across harnesses
  cache_read_tokens  INTEGER NOT NULL,
  cache_write_tokens INTEGER NOT NULL,   -- all cache writes
  cache_write_5m_tokens INTEGER,
  cache_write_1h_tokens INTEGER,
  output_tokens      INTEGER NOT NULL,   -- includes reasoning
  is_partial         INTEGER NOT NULL DEFAULT 0,  -- no final record ever arrived, so output is understated
  reasoning_tokens   INTEGER,
  context_tokens     INTEGER NOT NULL,   -- input + cache read + cache write: what the model saw
  context_limit      INTEGER,
  context_gauge_tokens INTEGER,          -- the harness's own context gauge, when it differs (agy)
  cache_miss_reason  TEXT,               -- Claude diagnostics: 'tools_changed' | 'messages_changed' | ...
  cache_missed_tokens INTEGER,
  web_search_requests INTEGER,
  web_fetch_requests  INTEGER,
  service_tier       TEXT,
  speed              TEXT,
  prompt_eval_ms     INTEGER,            -- local models
  eval_ms            INTEGER,            -- local models
  est_cost_usd       REAL,
  raw_id             INTEGER, normalizer TEXT
);
CREATE INDEX usage_ts    ON usage(ts);
CREATE INDEX usage_model ON usage(model, ts);

CREATE TABLE cost_snapshots (            -- Claude cost-state lines and stdout result lines
  run_id             TEXT NOT NULL REFERENCES runs(run_id),
  ts                 INTEGER NOT NULL,
  source             TEXT NOT NULL,      -- 'cost-state' | 'stdout-result'
  reported_cost_usd  REAL,
  api_duration_ms    INTEGER,
  tool_duration_ms   INTEGER,
  api_duration_no_retry_ms INTEGER,
  total_duration_ms  INTEGER,
  lines_added        INTEGER,
  lines_removed      INTEGER,
  process_start_at   INTEGER,
  model_usage_json   TEXT,
  raw_id             INTEGER, normalizer TEXT,
  PRIMARY KEY (run_id, ts, source)
);

CREATE TABLE errors (                    -- failures that are not a tool result
  error_id           TEXT PRIMARY KEY,
  run_id             TEXT REFERENCES runs(run_id),
  ts                 INTEGER NOT NULL,
  kind               TEXT NOT NULL,      -- 'api-error' | 'rate-limit' | 'overloaded' | 'hook-error'
                                         -- | 'harness-error' | 'interrupt'
  status_code        INTEGER,
  message            TEXT,
  tool_call_id       TEXT,
  limit_kind         TEXT,               -- quota window: 'five_hour' | 'seven_day'
  resets_at          INTEGER,
  details_json       TEXT,               -- e.g. quotaLimits
  raw_id             INTEGER, normalizer TEXT
);
CREATE INDEX errors_ts ON errors(ts, kind);

CREATE TABLE compactions (
  compaction_id      TEXT PRIMARY KEY,
  run_id             TEXT NOT NULL REFERENCES runs(run_id),
  ts                 INTEGER NOT NULL,
  trigger            TEXT,               -- 'auto' | 'manual'
  pre_tokens         INTEGER,
  post_tokens        INTEGER,
  duration_ms        INTEGER,
  cumulative_dropped_tokens INTEGER,
  summary_blob_hash  TEXT,
  raw_id             INTEGER, normalizer TEXT
);

CREATE TABLE interventions (
  intervention_id    TEXT PRIMARY KEY,
  run_id             TEXT NOT NULL REFERENCES runs(run_id),
  ts                 INTEGER NOT NULL,
  kind               TEXT NOT NULL,      -- 'enqueue' | 'dequeue' | 'remove' | 'pop-all' | 'interrupt'
                                         -- | 'user-rejected' | 'permission-denied' | 'steer' | 'mode-change'
                                         -- | 'hook-block' | 'slash-command' | 'kill-agents'
  source             TEXT,               -- 'human' | 'peer' | 'coordinator' | 'scheduled'
  source_run_id      TEXT,               -- the sending agent's run, when an agent sent it
  reason             TEXT,
  ref_id             TEXT,
  preview            TEXT,
  raw_id             INTEGER, normalizer TEXT
);

CREATE TABLE hook_runs (
  hook_run_id        TEXT PRIMARY KEY,
  run_id             TEXT NOT NULL REFERENCES runs(run_id),
  ts                 INTEGER NOT NULL,
  hook_event         TEXT NOT NULL,      -- 'PreToolUse' | 'PostToolUse' | 'Stop' | 'SessionStart' | ...
  hook_name          TEXT,
  outcome            TEXT NOT NULL,      -- 'success' | 'blocking-error' | 'non-blocking-error'
  command            TEXT,               -- the hook command; one event can fire many hooks
  exit_code          INTEGER,
  duration_ms        INTEGER,
  hook_group_id      TEXT,               -- shared by the records of one firing (SessionStart etc.)
  permission_decision TEXT,
  prevented_continuation INTEGER,
  updated_input_blob_hash TEXT,          -- PreToolUse rewrote the tool input; the call that RAN differs from the request
  tool_call_id       TEXT,               -- real for Pre/PostToolUse; NULL for session and sub-agent hooks
  output_preview     TEXT,
  stderr_preview     TEXT,
  raw_id             INTEGER, normalizer TEXT
);

CREATE TABLE attachments (               -- context the harness injected: CLAUDE.md, skills, file mentions, reminders
  attachment_id      TEXT PRIMARY KEY,
  run_id             TEXT NOT NULL REFERENCES runs(run_id),
  event_id           TEXT,
  ts                 INTEGER,
  attachment_type    TEXT NOT NULL,      -- Claude attachment.type
  name               TEXT,
  tool_call_id       TEXT,
  preview            TEXT,
  chars              INTEGER,
  blob_hash          TEXT,
  rendered_chars     INTEGER,            -- what the model was actually sent
  rendered_blob_hash TEXT,               -- only for types whose text exists only in 'rendered'
  details_json       TEXT,
  raw_id             INTEGER, normalizer TEXT
);
CREATE INDEX attachments_run  ON attachments(run_id, ts);
CREATE INDEX attachments_type ON attachments(attachment_type, ts);

CREATE TABLE attachment_parts (          -- array attachments (memory files, hook snippets, MCP instructions), deduped per part
  attachment_id      TEXT NOT NULL REFERENCES attachments(attachment_id),
  idx                INTEGER NOT NULL,
  part_kind          TEXT NOT NULL,      -- 'memory-file' | 'hook-snippet' | 'mcp-instruction' | 'agent-line' | 'system-prompt'
  name               TEXT,
  chars              INTEGER,
  blob_hash          TEXT,
  PRIMARY KEY (attachment_id, idx)
);

CREATE TABLE agent_messages (            -- messages agents send each other (agy messages/*.json; Claude SendMessage / peer)
  message_id         TEXT PRIMARY KEY,
  sender_run_id      TEXT,
  sender_task_id     TEXT,
  recipient_run_id   TEXT NOT NULL,
  priority           TEXT,
  ts                 INTEGER NOT NULL,
  title              TEXT,
  text_preview       TEXT,
  text_chars         INTEGER,
  blob_hash          TEXT,
  hidden             INTEGER NOT NULL DEFAULT 0,
  is_read            INTEGER,
  source_tool_call_id TEXT,
  raw_id             INTEGER, normalizer TEXT
);

CREATE TABLE rate_limit_samples (        -- stdout rate_limit_event lines: quota trend data
  run_id             TEXT REFERENCES runs(run_id),
  received_at        INTEGER NOT NULL,
  limit_type         TEXT,
  status             TEXT,
  utilization        REAL,
  resets_at          INTEGER,
  surpassed_threshold REAL,
  is_overage         INTEGER,
  five_hour_utilization REAL,
  five_hour_resets_at INTEGER,
  seven_day_utilization REAL,
  seven_day_resets_at INTEGER,
  raw_id             INTEGER, normalizer TEXT,
  PRIMARY KEY (run_id, received_at)
);

CREATE TABLE file_backups (              -- the harness's pre-edit copy of each file it changed
  run_id             TEXT NOT NULL REFERENCES runs(run_id),
  turn_id            TEXT,
  tool_call_id       TEXT,
  path               TEXT NOT NULL,
  version            INTEGER NOT NULL,
  backup_at          INTEGER,
  blob_hash          TEXT,
  raw_id             INTEGER, normalizer TEXT,
  PRIMARY KEY (run_id, path, version)
);

CREATE TABLE artifacts (                 -- the content-addressed blob store index
  blob_hash          TEXT PRIMARY KEY,   -- sha256 of the uncompressed bytes
  mime               TEXT,
  raw_bytes          INTEGER NOT NULL,
  stored_bytes       INTEGER NOT NULL,
  location           TEXT NOT NULL,      -- 'segment' (under 64 KB, packed into the archive) | 'file'
  segment_id         INTEGER,            -- when location = 'segment'
  chunk_offset       INTEGER,
  record_offset      INTEGER,
  file_path          TEXT,               -- when location = 'file': <home>/data/blobs/ab/cd/<sha256>
  origin             TEXT NOT NULL,      -- 'spill-file' | 'image' | 'tool-output' | 'tool-input' | 'text' | 'summary'
                                         -- | 'file-backup' | 'attachment' | 'system-prompt'
  first_seen_at      INTEGER NOT NULL
);
```

## 4. Sources dungeonmaster produces itself

```sql
-- Ward, commit and riftcarver output is a run with harness 'dungeonmaster', kind 'command',
-- and its lines are events of kind 'command-line'. No extra table.

CREATE TABLE server_errors (
  signature          TEXT NOT NULL,      -- normalised message + route, so repeats merge (the ×N count)
  ts                 INTEGER NOT NULL,
  route              TEXT,
  status_code        INTEGER,
  message            TEXT NOT NULL,
  PRIMARY KEY (signature, ts)
);

CREATE TABLE model_calls (               -- calls through our own local-model gateway
  call_id            TEXT PRIMARY KEY,
  backend            TEXT NOT NULL,      -- 'ollama' | 'llama.cpp'
  model              TEXT NOT NULL,
  role               TEXT,
  run_id             TEXT,
  started_at         INTEGER NOT NULL,
  ttft_ms            INTEGER,
  duration_ms        INTEGER,
  input_tokens       INTEGER,
  output_tokens      INTEGER,
  status             TEXT NOT NULL,      -- 'ok' | 'error' | 'timeout'
  error              TEXT
);
CREATE INDEX model_calls_ts ON model_calls(backend, started_at);
```

## 5. Rollups

The writer updates these inside each batch's transaction. A rebuild recomputes them from the tables above.

```sql
CREATE TABLE rollup_run (
  run_id             TEXT PRIMARY KEY REFERENCES runs(run_id),
  input_tokens INTEGER NOT NULL DEFAULT 0, cache_read_tokens INTEGER NOT NULL DEFAULT 0,
  cache_write_tokens INTEGER NOT NULL DEFAULT 0, output_tokens INTEGER NOT NULL DEFAULT 0,
  est_cost_usd       REAL NOT NULL DEFAULT 0,
  peak_context_tokens INTEGER NOT NULL DEFAULT 0,
  last_context_tokens INTEGER NOT NULL DEFAULT 0,
  tool_calls         INTEGER NOT NULL DEFAULT 0,
  tool_failures      INTEGER NOT NULL DEFAULT 0,
  failures_by_cause_json TEXT NOT NULL DEFAULT '{}',
  active_ms          INTEGER NOT NULL DEFAULT 0,   -- model time + tool time, idle gaps excluded
  updated_at         INTEGER NOT NULL
);

CREATE TABLE rollup_quest (              -- every run linked to the quest, sub-agents included
  quest_id           TEXT PRIMARY KEY,
  guild_id           TEXT,
  input_tokens INTEGER NOT NULL DEFAULT 0, cache_read_tokens INTEGER NOT NULL DEFAULT 0,
  cache_write_tokens INTEGER NOT NULL DEFAULT 0, output_tokens INTEGER NOT NULL DEFAULT 0,
  est_cost_usd       REAL NOT NULL DEFAULT 0,
  live_peak_context_tokens INTEGER NOT NULL DEFAULT 0,  -- highest context among RUNNING runs (dashboard ctx)
  tokens_by_role_json TEXT NOT NULL DEFAULT '{}',
  tool_calls         INTEGER NOT NULL DEFAULT 0,
  tool_failures      INTEGER NOT NULL DEFAULT 0,
  failures_by_cause_json TEXT NOT NULL DEFAULT '{}',
  updated_at         INTEGER NOT NULL
);

CREATE TABLE rollup_hour (
  hour_start         INTEGER NOT NULL,   -- UTC hour, ms
  harness            TEXT NOT NULL,
  model              TEXT NOT NULL,
  role               TEXT NOT NULL DEFAULT '',
  repo_path          TEXT NOT NULL DEFAULT '',
  guild_id           TEXT NOT NULL DEFAULT '',
  input_tokens INTEGER NOT NULL DEFAULT 0, cache_read_tokens INTEGER NOT NULL DEFAULT 0,
  cache_write_tokens INTEGER NOT NULL DEFAULT 0, output_tokens INTEGER NOT NULL DEFAULT 0,
  est_cost_usd       REAL NOT NULL DEFAULT 0,
  api_messages       INTEGER NOT NULL DEFAULT 0,
  tool_calls         INTEGER NOT NULL DEFAULT 0,
  tool_failures      INTEGER NOT NULL DEFAULT 0,
  failures_by_cause_json TEXT NOT NULL DEFAULT '{}',
  PRIMARY KEY (hour_start, harness, model, role, repo_path, guild_id)
);
```

## 6. The timeline view

```sql
-- The ordered "what happened" reading the chat UI, View Context and the timeline use.
CREATE VIEW timeline AS
SELECT e.run_id, e.seq, e.ts, e.kind, e.subtype, e.event_id, e.message_id, e.tool_call_id,
       e.text_preview, tc.tool_name, tc.status AS tool_status, tc.cause, tc.latency_ms,
       rl.quest_id, rl.work_item_id
FROM events e
LEFT JOIN tool_calls tc ON tc.tool_call_id = e.tool_call_id
LEFT JOIN run_links  rl ON rl.run_id = e.run_id;
```
