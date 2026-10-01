# chronicle-llm: table schemas

Status: draft for review, 2026-10-01. This is the exact SQLite schema for `<home>/data/chronicle.db`, written
against `node:sqlite` on Node 24.15+, and it is the body of migration `0001-initial`. `design.md` says why each
table exists; §13 there decides the storage cap, eviction and secrets that sections 1 and 2 below carry. The field
maps say which source field fills each column: `field-maps/claude-code-*.md` for Claude
Code (assistant records, attachments, user records and tool results, system/meta records, side files and stdout)
and `field-maps/antigravity.md` for Antigravity.

## Conventions every table follows

### Keys and references

| Rule | Detail |
|---|---|
| Integer storage keys | Every table's key is `id INTEGER PRIMARY KEY`, except: a table that is one row per parent row uses the parent's reference as its key (`tool_results`, `usage`, `tool_call_causes`, `rollup_session`, `normalizer_state`, `raw_tail`, `rollup_dirty`); a table that is one row per raw record uses `raw_id` (`raw_records`, `rate_limit_samples`, `server_errors`); a pure join or dimension table uses a composite key (`meta`, `schema_observations`, `harness_versions`, `rollup_hour`). |
| The writer allocates ids | There is one writer (design §7), so it picks `id = max(id) + 1` itself. A root llm session can then carry its own id in `root_session_ref` in the same `INSERT`. |
| Natural keys | The deterministic TEXT id is stored ONCE, as `natural_key TEXT NOT NULL UNIQUE`, on every table whose rows a reader identifies or another source references. Readers and the web see natural keys; integer ids never leave the database. The recipes are in the next table. |
| Reference columns | A column holding another row's integer id is named `<thing>_ref`. Where `design.md` writes `<thing>_id` for a reference (`root_session_id`, `parent_session_id`, `spawned_by_tool_call_id`, `copied_from_event_id`, `tool_call_id`), the column here is `<thing>_ref`. `raw_id` keeps its name everywhere. |
| No foreign keys across sources | A reference between rows that two sources write (child session to parent session, result to call, usage to message, event to the message or call it shows, a copy to its original, a session to its quest or work item) carries NO `REFERENCES` clause, because either side can be read first (design §4.2). The only foreign keys are inside the ingest bookkeeping (`raw_records`, `raw_tail`, `artifacts`, `blob_tail`), the quest mirror (`work_items` to `quests`) and inside one record's own rows (`content_blocks` to `events`, with `ON DELETE CASCADE`). |
| Stubs | When a row references a session or a tool call that no source has produced yet, the writer inserts a stub for it: its `natural_key`, `is_stub = 1`, and placeholder values for the `NOT NULL` columns (`tool_name = '(unresolved)'`, `kind` from the referencing record). The owning source later fills the stub in place and clears `is_stub`, so the integer id the reference holds stays valid. Only `llm_sessions` and `tool_calls` take stubs. |
| A late original | `events.copied_from_event_ref` and `events.parent_event_ref` stay NULL until the original is read. The writer then back-fills every event whose `native_uuid` matches, through `events_native_uuid`. |
| Re-normalizing keeps ids | Re-normalizing a session (design §8.2) upserts every derived row by its natural key, so integer ids and every reference to them survive. Rows the replay no longer produces are deleted and leave a `tombstones` row. |

### Natural key recipes

`<session>` below is the session's own natural key.

| Rows | `natural_key` |
|---|---|
| `sources` | `'<harness>:<kind>:<first 16 hex of sha256(locator)>'` |
| `llm_sessions` | `'<harness>:<native session id>'`: `claude-code:<sessionId>`, `antigravity:<conversation uuid>`. A Claude sub-agent or workflow agent is `claude-code:<sessionId>/<agentId>`, because one `agent-<id>.jsonl` name can appear under two sessions (design §12.1). A first-party command is `dungeonmaster:command:<command id>`. |
| `messages` | GLOBAL, `'<harness>:<native message id>'`. Claude: `message.id` for an API message, the record `uuid` for a user or system message. agy: `<session>:gen:<idx>` for a generation, `<session>:step:<idx>` for a user or system step. A summarising call that is not a generation is `<session>:ckpt:<idx>` (agy CHECKPOINT steps carry their own usage). |
| `tool_calls` | GLOBAL, `'<harness>:<native call id>'`. Claude: `claude-code:toolu_…`. agy call ids repeat across conversations, so its native id carries the conversation: `antigravity:<conversation uuid>:call_<n>`. |
| `events` | per session: `<session>:<uuid>` (Claude), `<session>:step:<idx>` (agy), `<session>:line:<lineNo>` (a Claude metadata line with no `uuid`, or a first-party command line), `<session>:stdout:<uuid or spool pos>` (a stdout line with no transcript twin, such as `system/task_progress`). An agy agent-message arrival is `<recipient session>:msg:<message uuid>`, whether its message file or its delivering type-101 step is read first. An intervention drawn from a record that already yields an event of another kind is that event's key plus `:intervention`. |
| `turns` | `<session>:turn:<promptId, or the first event's pos>` |
| `background_tasks` | `<session>:task:<native task id>` |
| `errors`, `compactions`, `hook_runs`, `attachments` | `<session>:<pos>[:<n>]`. `<pos>` is the raw record's `pos` when it comes from the session's own transcript, and `<source kind>@<pos>` for any other source (`stdout-spool@412`). `:<n>` (0-based) is added when one record yields several rows of the same table. An error with no session is `<source natural key>:<pos>[:<n>]`. One part of an array attachment is its attachment's key plus `:<idx>` (`<session>:<pos>[:<n>]:<idx>`); a non-array attachment has no `:<idx>`. |
| `dispatch_events` | `dungeonmaster:dispatch:<record id>`, the id the dispatcher writes into each spool line (the spool is deleted once archived, so a line number is not stable) |
| `model_calls` | `dungeonmaster:model-call:<gateway call id>` |
| Tables with no `natural_key` | identified by their parent's natural key in `tombstones`: `tool_results`, `tool_call_causes` by the call; `usage` by the message; `rollup_session` by the session; `content_blocks` as `<event natural key>#<parent_idx>.<idx>` |

### Merging the same fact from several places

| Rule | Detail |
|---|---|
| Global keys | `messages`, `usage`, `tool_calls` and `tool_results` are keyed globally, so a resumed session's copy of an earlier record adds only `events` rows (with `copied_from_event_ref` set). Nothing is counted twice. |
| Repeated native ids | A harness that reuses an id inside ONE session's own (non-copy) records (agy `call_<n>`, 31 cases seen) gets `~<n>` appended for the second and later uses, counting from 2: `antigravity:<conv>:call_7~2`. A copy in another session is not a repeat; it maps onto the original row. |
| Which copy owns a shared row | A message or tool call seen in several sessions belongs (`session_ref`) to the record with the earliest `ts`. A tie goes to a record that is not a copy, then to the session with the lowest `llm_sessions.natural_key` (text order, never the integer id, which depends on ingest order). Ownership moves when an earlier record arrives late; `usage.session_ref` moves with its message, `rollup_session` is adjusted by the difference, and the session is marked in `rollup_dirty`. |
| Which source wins a column | The transcript wins every column both sources fill. Stdout fills only columns that are still NULL, and never lowers a usage figure. A row stdout created has `provisional = 1` until its transcript record is read. |
| Stdout times | stdout `system/*`, `result` and `rate_limit_event` lines carry no time, so the spool stores each line's `received_at` and that is the row's `ts` |

### The change feed

| Rule | Detail |
|---|---|
| One number per commit | Every committing transaction takes `meta.next_change_seq` and increments it. Every row the transaction inserts or updates in a change-fed table gets that number in `change_seq`. |
| Change-fed tables | the ones the chat UI, quest health or the command center read live: `llm_sessions`, `turns`, `messages`, `events`, `content_blocks`, `tool_calls`, `tool_results`, `tool_call_causes`, `usage`, `errors`, `background_tasks`, `dispatch_events`, `rollup_session`. Each has an index on `change_seq`. |
| Reading it | A live cursor reads each change-fed table's rows with `change_seq > N`, a short range scan near the head, and filters them to the sessions it shows. Opening a quest pages `timeline` by `(session_ref, seq)` instead. `events.seq` is display order only and is never a cursor. |
| Deletes | A deleted row of a change-fed table leaves a `tombstones` row with the same transaction's `change_seq`. Tombstones are kept 7 days: once a day the writer deletes older ones and raises `meta.tombstone_floor_seq` to the lowest `change_seq` still kept. A reader whose cursor is below the floor does a full reload instead of reading the feed. |
| Eviction | Eviction (design §13.1) writes no per-row tombstones. It changes the session's `llm_sessions.detail_state`, which gives the session row a new `change_seq`, and a reader reloads that session. |

### Values

| Rule | Detail |
|---|---|
| Times | `INTEGER` milliseconds since the Unix epoch, UTC, named `*_at` or `ts` |
| Durations | `INTEGER` milliseconds, named `*_ms` |
| Tokens and counts | `INTEGER`, never NULL where 0 is the true value |
| Money | `REAL` US dollars, named `*_usd`, always an ESTIMATE from the harness definition's `pricing` unless the column name says `reported` |
| Booleans | `INTEGER` 0 or 1 |
| JSON | `TEXT` holding JSON, named `*_json`, only for small, tool- or harness-specific detail never filtered on |
| Provenance | every derived row carries `raw_id` (the raw record it came from, no foreign key) and `normalizer` (`'<harness>/<normalizer>@<version>'`). Rows the failure classifier writes carry `classifier` (`'<name>@<version>'`) instead. |
| Inline text | A table whose text the UI shows in full (`content_blocks.text`, `tool_results.text`, `tool_calls.input_json`) holds it inline up to 4 KB (4,096 UTF-8 bytes). Above that the column is NULL and `*_blob_ref` holds the whole text. `*_chars` always holds the full length. Such a table stores NO preview; a reader computes one with `substr(text, 1, 300)`. |
| Previews | A table with no inline text column keeps at most one `*_preview` per fact: the first 300 characters, with the full text in its `*_blob_ref` or the raw archive. The same cap holds on every table (`llm_sessions.last_prompt_preview`, `session_results.result_preview`, `background_tasks.result_preview`, `hook_runs.output_preview` and `stderr_preview`, `attachments.preview`). |
| One fact, one table | A `tool_result` content block stores no text; its text is `tool_results.text`. An event stores no text; its text is its content blocks. |
| Blobs | `*_blob_ref INTEGER` names an `artifacts` row; `artifacts.blob_hash` is the content address the API serves (`GET /api/blobs/:hash`) |
| Secrets | Before anything is written (`raw_tail`, the archive, any column, any blob), every secret is replaced in place with `REDACTED-SECRET-<kind>` (`design.md` §13.2). There is no deny-list, no purge and no rescan. `content_hash` hashes the ORIGINAL bytes. |
| Readers | never hold a read transaction across polling ticks; a held snapshot stops WAL checkpoints |
| Pragmas | `journal_mode=WAL`, `synchronous=NORMAL`, `foreign_keys=ON`, `busy_timeout=5000`, `journal_size_limit=67108864`; the schema version is `user_version` |

## 1. Ingest and provenance

```sql
CREATE TABLE meta (
  key   TEXT PRIMARY KEY,        -- 'home_kind' ('prod' | 'published' | 'dev' | 'worktree' | 'test' | 'lane')
                                 -- 'ingest_scope' ('all' | 'registered'), 'process_mode' ('persistent' | 'parent-bound')
                                 --   home_kind and ingest_scope are inferred at first start unless the home config
                                 --   forces them (chronicle.homeKind, chronicle.ingestScope; design §7A)
                                 -- 'schema_state' ('ready' | 'migrating' | 'failed' | 'too-new')
                                 -- 'reader_compat' (raised only by a non-additive migration)
                                 -- 'next_change_seq', 'next_ingest_seq', 'tombstone_floor_seq'
                                 -- 'classifier_version', 'last_shutdown' ('clean' | 'unclean')
                                 -- 'max_storage_bytes': copied at start from the HOME config, <home>/config.json
                                 --   key chronicle.maxStorageBytes (dungeonmaster init writes 4294967296, 4 GB, when
                                 --   absent); the config file is the setting, this is only what the process read
                                 -- 'storage_bytes_by_tier': JSON, bytes used by full / summarised / rolled-up sessions
                                 --   plus the archive and blobs, for status
                                 -- 'first_run_state', 'history_import_progress', 'last_full_scan_at', ...
  value TEXT NOT NULL
);

CREATE TABLE schema_migrations (
  version      INTEGER PRIMARY KEY,   -- equals PRAGMA user_version after it ran
  name         TEXT NOT NULL,         -- '0001-initial'
  checksum     TEXT NOT NULL,         -- hash of the migration file, so an edited released migration is caught
  applied_at   INTEGER NOT NULL,
  duration_ms  INTEGER NOT NULL
);

CREATE TABLE sources (
  id                 INTEGER PRIMARY KEY,
  natural_key        TEXT NOT NULL UNIQUE, -- '<harness>:<kind>:<locator hash>'
  harness            TEXT NOT NULL,      -- 'claude-code', 'antigravity', 'dungeonmaster', ...; a stdout spool takes its child's harness
  kind               TEXT NOT NULL,      -- 'transcript-jsonl' | 'subagent-meta-json' | 'spill-file' | 'workflow-journal'
                                         -- | 'sqlite-conversation' | 'sqlite-summaries' | 'subagent-link-json'
                                         -- | 'agent-message-json' | 'history-jsonl' | 'cli-log'
                                         -- | 'task-output' | 'session-registry'
                                         -- | 'stdout-spool' | 'dispatch' | 'first-party'
                                         -- | 'side-file' (archived raw, no normalizer yet: design §8.5)
  locator            TEXT NOT NULL,      -- absolute path, or 'first-party:<name>'; the dispatch spool is its path
  session_ref            INTEGER,            -- the session this source feeds, once known (NULL for dispatch and first-party)
  watermark_json     TEXT NOT NULL DEFAULT '{}',
                                         -- JSONL and spools: {byteOffset, lineNo, inode, size, headLen}
                                         --   byteOffset is the end of the last complete line read; headLen is how
                                         --   many leading bytes head_hash covers
                                         -- SQLite: {maxIdx, openIdx:[...], maxGenIdx}
                                         -- whole file: {size, mtimeMs}
  head_hash          TEXT,               -- sha256 of the first headLen bytes. headLen is min(size, 65536) when the
                                         -- hash was taken, and grows on later reads while under 65536, after the old
                                         -- prefix is checked. REPLACED when the inode changes, size < byteOffset, or
                                         -- this hash changes (design §5.1).
  tail_hash          TEXT,               -- sha256 of the 4 KB ending at byteOffset, re-checked on every read; a
                                         -- mismatch is drift and triggers a re-read
  content_hash       TEXT,               -- whole-file sources: sha256 of the bytes last archived
  normalizer         TEXT,               -- normalizer that last read it
  state              TEXT NOT NULL DEFAULT 'dirty',   -- 'idle' | 'dirty' | 'reading' | 'error' | 'reingest' | 'gone'
  priority           TEXT NOT NULL DEFAULT 'history', -- 'live' | 'recent' | 'history'
  last_error         TEXT,
  discovered_at      INTEGER NOT NULL,
  last_read_at       INTEGER,
  quiet_since_at     INTEGER,            -- a held partial last line becomes a raw_records row with parse_error set once
                                         -- the session has ended and the file has been quiet a minute
  gone_at            INTEGER             -- the harness deleted the file; our archive still has it
);
CREATE INDEX sources_queue ON sources(state, priority);
CREATE INDEX sources_session   ON sources(session_ref);

CREATE TABLE archive_segments (          -- shared by every source, so small sources do not make small files
  id                 INTEGER PRIMARY KEY,
  path               TEXT NOT NULL UNIQUE, -- <home>/data/archive/<n>.seg
  format_version     INTEGER NOT NULL,   -- also in the segment file header (design §8.4)
  committed_bytes    INTEGER NOT NULL DEFAULT 0,  -- on start, the file is truncated to this length, dropping any
  evicted_bytes      INTEGER NOT NULL DEFAULT 0,  -- bytes of evicted records still inside; past half of stored_bytes the segment is rewritten
                                                  -- chunk whose transaction never committed
  raw_bytes          INTEGER NOT NULL DEFAULT 0,  -- uncompressed bytes of every committed chunk
  first_ingest_seq   INTEGER,
  last_ingest_seq    INTEGER,
  sealed             INTEGER NOT NULL DEFAULT 0,  -- 1 once the segment takes no more chunks
  created_at         INTEGER NOT NULL
);

CREATE TABLE raw_records (
  raw_id             INTEGER PRIMARY KEY,
  ingest_seq         INTEGER NOT NULL UNIQUE,  -- global replay order, from meta.next_ingest_seq at commit; a
                                               -- re-normalize replays a session's records in this order (design §8.2)
  source_ref         INTEGER NOT NULL REFERENCES sources(id),
  session_ref            INTEGER,            -- the session this record fed, when one; no foreign key
  pos                INTEGER NOT NULL,   -- JSONL line number (0-based) | SQLite step idx or rowid | 0 for a whole file
  sub_table          TEXT NOT NULL DEFAULT '',  -- SQLite only: 'steps' | 'gen_metadata' | 'executor_metadata' | 'conversation_summaries' | ...
  revision           INTEGER NOT NULL DEFAULT 0, -- 0 for the first bytes seen at this position; each rewrite adds a
                                                 -- row with the next revision. The rows of one position are linked
                                                 -- by (source_ref, sub_table, pos, revision); the old bytes stay
                                                 -- readable through their own row
  revision_expected  INTEGER,            -- on a row with revision > 0: 1 when the harness is known to update this
                                         -- row (an agy step moving to a terminal status, gen_metadata row N when
                                         -- N+1 lands); 0 is drift. NULL on revision 0
  parse_error        TEXT,               -- set when a normalizer could not read this record (or a held partial last
                                         -- line); the watermark moves on. NULL when it parsed
  parse_error_normalizer TEXT,           -- the normalizer that failed on it, '<harness>/<normalizer>@<version>'
  content_hash       TEXT NOT NULL,      -- sha256 of the ORIGINAL bytes, before redaction, so change detection
                                         -- still sees a rewrite; the stored bytes may differ from it
  redacted           INTEGER NOT NULL DEFAULT 0, -- 1 when secrets were replaced, so the stored bytes differ from the original
  redactions         INTEGER NOT NULL DEFAULT 0, -- how many secrets were replaced with REDACTED-SECRET-<kind>
  segment_ref        INTEGER REFERENCES archive_segments(id), -- NULL while the bytes are still in raw_tail, and
                                                              -- after eviction
  chunk_offset       INTEGER,            -- byte offset of the compressed chunk in the segment
  chunk_stored_bytes INTEGER,            -- compressed chunk length, so a read seeks straight to it
  record_offset      INTEGER,            -- byte offset of the record inside the decompressed chunk
  record_len         INTEGER NOT NULL,
  record_type        TEXT,               -- 'assistant', 'user', 'attachment/skill_listing', 'step/15', 'dispatch/spawn', ...
  harness_version    TEXT,               -- '2.1.287', ...
  ts                 INTEGER,            -- the record's own timestamp, when it has one
  ingested_at        INTEGER NOT NULL,
  evicted_at         INTEGER,            -- tier-1 eviction dropped the bytes; the row stays for provenance
  UNIQUE (source_ref, sub_table, pos, revision)
);
CREATE INDEX raw_records_session  ON raw_records(session_ref, ingest_seq);
CREATE INDEX raw_records_type ON raw_records(record_type, harness_version);
CREATE INDEX raw_records_parse_error ON raw_records(parse_error_normalizer) WHERE parse_error IS NOT NULL;

CREATE TABLE raw_tail (                  -- the newest raw records, uncompressed, written in the batch's own
                                         -- transaction; the sealer moves them into a segment (design §6)
  raw_id             INTEGER PRIMARY KEY REFERENCES raw_records(raw_id),
  bytes              BLOB NOT NULL
);

CREATE TABLE schema_observations (
  harness            TEXT NOT NULL,
  harness_version    TEXT NOT NULL,
  record_type        TEXT NOT NULL,
  field_path         TEXT NOT NULL,      -- 'message.usage.cache_creation.ephemeral_1h_input_tokens'; opaque subtrees as 'input.*'
  value_type         TEXT NOT NULL,      -- 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null' | 'bytes'
  parsed             INTEGER NOT NULL,   -- 1 when a normalizer declares it reads this path
  count              INTEGER NOT NULL,
  first_seen_at      INTEGER NOT NULL,
  last_seen_at       INTEGER NOT NULL,
  example_raw_id     INTEGER,
  PRIMARY KEY (harness, harness_version, record_type, field_path, value_type)
);

CREATE TABLE schema_drift (
  id                 INTEGER PRIMARY KEY,
  harness            TEXT NOT NULL,
  harness_version    TEXT,
  kind               TEXT NOT NULL,      -- 'new-path' | 'vanished-path' | 'type-change' | 'unknown-record-type'
                                         -- | 'unknown-harness-version' | 'record-rewritten' | 'file-replaced'
  source_ref         INTEGER,
  record_type        TEXT,
  field_path         TEXT,
  detail             TEXT NOT NULL,
  example_raw_id     INTEGER,
  first_seen_at      INTEGER NOT NULL,
  acknowledged_at    INTEGER
);
CREATE INDEX schema_drift_open ON schema_drift(acknowledged_at, first_seen_at);

CREATE TABLE ingest_jobs (
  id                 INTEGER PRIMARY KEY,
  cause              TEXT NOT NULL,      -- 'live' | 'startup-catch-up' | 'first-run-week' | 'history'
                                         -- | 'reingest:<normalizer bump|file-replaced|wipe|manual>' | 'reclassify'
                                         -- | 'evict' (low priority, design §13.1): one row per tier per source or
                                         --   session dropped, so status reports space per tier. The cap is
                                         --   chronicle.maxStorageBytes in <home>/config.json (default 4 GB), never a
                                         --   table; meta.max_storage_bytes is the value read at start
  source_ref         INTEGER,            -- set when the job is about one source (evict tier 1: the source whose raw
                                         -- records and artifacts were dropped)
  session_ref        INTEGER,            -- evict tiers 2 and 3: the session trimmed
  tier               INTEGER,            -- cause 'evict' only: 1 raw archive and artifacts whose harness file still
                                         -- exists | 2 full text, events and attachments of the oldest sessions
                                         -- ('summarised') | 3 per-call rows of the oldest sessions ('rolled-up')
  bytes_freed        INTEGER,            -- cause 'evict' only
  started_at         INTEGER NOT NULL,
  finished_at        INTEGER,
  sources_read       INTEGER NOT NULL DEFAULT 0,
  records_read       INTEGER NOT NULL DEFAULT 0,
  bytes_read         INTEGER NOT NULL DEFAULT 0,
  errors             INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX ingest_jobs_evict ON ingest_jobs(tier, started_at) WHERE cause = 'evict';
CREATE INDEX ingest_jobs_session ON ingest_jobs(session_ref) WHERE session_ref IS NOT NULL;

CREATE TABLE normalizer_state (          -- state the assembler carries between batches of one session
  session_ref            INTEGER PRIMARY KEY,
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

CREATE TABLE harness_imports (           -- import progress PER HARNESS, so a harness added later rolls in on its own
                                         -- (design §7 "First run, and every new harness")
  harness            TEXT PRIMARY KEY,
  normalizer_set     TEXT,               -- the normalizers the import ran with, '<normalizer>@<version>,...'
  state              TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'recent' (last 7 days importing)
                                                       -- | 'history' (older history importing) | 'done'
  recent_done_at     INTEGER,            -- the last 7 days finished
  history_done_at    INTEGER,            -- all older history finished
  progress_json      TEXT,               -- {sourcesDone, sourcesTotal, bytesDone, bytesTotal} for the progress view
  updated_at         INTEGER
);
```

The storage cap and secrets (design §13) need no table of their own: the cap is a config value, each eviction is an
`ingest_jobs` row with cause `'evict'`, and secrets are replaced before anything is written.

## 2. LLM sessions and how they link to dungeonmaster

```sql
CREATE TABLE llm_sessions (                      -- an llm session: a main session or a sub-agent; a sub-agent is a session with a parent
  id                     INTEGER PRIMARY KEY,
  natural_key            TEXT NOT NULL UNIQUE,  -- see the recipes
  harness                TEXT NOT NULL,
  native_id              TEXT NOT NULL,  -- Claude sessionId or agentId; agy conversation uuid
  kind                   TEXT NOT NULL,  -- 'main' | 'subagent' | 'fork' | 'workflow-agent' | 'command'
  is_stub                INTEGER NOT NULL DEFAULT 0,  -- referenced, not read yet
  parent_session_ref         INTEGER,        -- no foreign key: the child is often read before its parent
  root_session_ref           INTEGER NOT NULL,  -- the top of this session's tree; its own id for a root. Re-pointed for the
                                            -- whole subtree when a parent link arrives late.
  spawned_by_tool_call_ref INTEGER,      -- the tool call that started this session
  spawn_depth            INTEGER NOT NULL DEFAULT 0,
  quest_ref              INTEGER,        -- the quest this session belongs to (quests.id), set AT INSERT; no foreign key
                                         -- (design §4.3). A main session gets it from the dispatch spool 'register'
                                         -- record, a sub-agent copies its parent's when the parent link is found;
                                         -- setting it late is a change. The guild is quests.guild_id.
  work_item_ref          INTEGER,        -- the work item (work_items.id), set the same way; role and step are
                                         -- work_items.role and work_items.step
  linked_by              TEXT,           -- how quest_ref / work_item_ref were set: 'dispatcher' (the dispatch spool)
                                         -- | 'inherited' (copied from the parent session) | 'quest-file' (backfilled
                                         -- from quest.json workItems[].sessionId and sessions[]) | 'inferred'
  linked_at              INTEGER,        -- when they were set
  agent_type             TEXT,           -- Claude meta agentType; agy subagent typeName
  agent_role             TEXT,           -- agy subagent role
  description            TEXT,           -- the spawning call's description
  title                  TEXT,           -- Claude ai-title/custom-title; agy summaries title
  cwd                    TEXT,
  repo_path              TEXT,           -- cwd resolved to its git root
  workspace_uris_json    TEXT,           -- agy workspace_uris
  git_branch             TEXT,
  entrypoint             TEXT,           -- Claude 'cli' | 'sdk-cli' | ...; agy source
  is_interactive         INTEGER NOT NULL DEFAULT 0,
  is_fork                INTEGER NOT NULL DEFAULT 0,
  forked_from_session_ref    INTEGER,        -- Claude fork-context-ref / continued-in
  harness_version_first  TEXT,
  harness_version_last   TEXT,           -- also the LAST stdout init line's claude_code_version
  model_first            TEXT,
  permission_mode        TEXT,           -- the last stdout init line's value wins over the transcript's
  api_key_source         TEXT,           -- the LAST stdout init line's facts; one process can print several init
  init_tools_json        TEXT,           -- lines and only the last is kept: tool names
  init_mcp_servers_json  TEXT,           -- [{name, status, source}]
  init_agents_json       TEXT,
  init_skills_json       TEXT,
  slug                   TEXT,           -- Claude's own session nickname
  session_kind           TEXT,           -- Claude 'bg' for background sessions
  request_shape          TEXT,           -- Claude sub-agent 'background' | 'foreground'
  os_pid                 INTEGER,        -- joins the harness's live process registry (session-registry source)
  liveness               TEXT,           -- 'busy' | 'idle' | 'stopped' | 'unknown', from the session-registry source
  liveness_at            INTEGER,        -- when the registry last said so
  system_prompt_blob_ref INTEGER,        -- the first prompt snapshot
  last_prompt_preview    TEXT,           -- Claude last-prompt.lastPrompt, first 300 characters
  started_at             INTEGER,
  last_activity_at       INTEGER,
  ended_at               INTEGER,
  end_state              TEXT NOT NULL DEFAULT 'unknown',  -- 'running' | 'exited' | 'signalled' | 'killed'
                                                           -- | 'stopped-by-user' | 'unknown'
  exit_code              INTEGER,        -- from the dispatch spool's exit record
  exit_signal            TEXT,           -- 'SIGTERM', 'SIGKILL', ...
  detail_state           TEXT NOT NULL DEFAULT 'full',  -- 'full' | 'summarised' (tier 2 evicted its text, events and
                                                        -- attachments) | 'rolled-up' (tier 3 evicted its per-call
                                                        -- rows); the UI says "history trimmed" (design §13.1)
  change_seq             INTEGER NOT NULL,
  raw_id                 INTEGER,
  normalizer             TEXT,
  UNIQUE (harness, native_id)
);
CREATE INDEX llm_sessions_parent   ON llm_sessions(parent_session_ref);
CREATE INDEX llm_sessions_root     ON llm_sessions(root_session_ref);
CREATE INDEX llm_sessions_quest    ON llm_sessions(quest_ref);
CREATE INDEX llm_sessions_activity ON llm_sessions(last_activity_at);
CREATE INDEX llm_sessions_repo     ON llm_sessions(repo_path, started_at);
CREATE INDEX llm_sessions_state    ON llm_sessions(end_state);
CREATE INDEX llm_sessions_change   ON llm_sessions(change_seq);

CREATE TABLE quests (                    -- mirror of each quest.json: only what the feed and the command center need
  id                 INTEGER PRIMARY KEY,
  natural_key        TEXT NOT NULL UNIQUE,  -- the quest id
  guild_id           TEXT NOT NULL,
  folder             TEXT NOT NULL,
  title              TEXT NOT NULL,
  status             TEXT NOT NULL,
  quest_type         TEXT,
  worktree_path      TEXT,
  branch_name        TEXT,
  epic_id            TEXT,
  created_at         INTEGER,
  updated_at         INTEGER,
  file_mtime         INTEGER NOT NULL,      -- for the mtime sweep
  change_seq         INTEGER NOT NULL
);
CREATE INDEX quests_guild ON quests(guild_id, status);
CREATE INDEX quests_change ON quests(change_seq);

CREATE TABLE work_items (                -- mirror of quest.json workItems[]
  id                 INTEGER PRIMARY KEY,
  natural_key        TEXT NOT NULL UNIQUE,  -- the work item id
  quest_ref          INTEGER NOT NULL REFERENCES quests(id),
  role               TEXT NOT NULL,
  step               TEXT,
  status             TEXT NOT NULL,
  spawner_type       TEXT,
  native_session_id  TEXT,               -- workItems[].sessionId
  operation_id       TEXT,
  depends_on_json    TEXT,
  retry_count        INTEGER,
  created_at         INTEGER,
  started_at         INTEGER,
  completed_at       INTEGER,
  ward_result_id     TEXT,               -- a ward step: its quest.json wardResults[] entry (the 'wardResults/<id>' ref)
  ward_run_id        TEXT,               -- wardResults[].runId, for 'ward detail <runId>'
  ward_exit_code     INTEGER,            -- wardResults[].exitCode
  ward_checks_json   TEXT,               -- per check status from <questFolder>/ward-results/<id>.json:
                                         -- {"lint":"pass","typecheck":"pass","unit":"fail","e2e":"skip"}; an exit
                                         -- code that disagrees with it is the health "ward verdict mismatch"
  ward_slow_tests_only INTEGER,          -- red only because of the slow-test limit
  change_seq         INTEGER NOT NULL
);
CREATE INDEX work_items_quest ON work_items(quest_ref, status);
CREATE INDEX work_items_change ON work_items(change_seq);

CREATE TABLE dispatch_events (           -- the dispatch spool, one row per record: spawns, exits and queue waits.
                                         -- Spawns fill llm_sessions.quest_ref, work_item_ref, linked_by ('dispatcher')
                                         -- and linked_at; exits fill llm_sessions.end_state, exit_code, exit_signal;
                                         -- queue waits explain idle gaps between work items (design §4.2)
  id                 INTEGER PRIMARY KEY,
  natural_key        TEXT NOT NULL UNIQUE,  -- 'dungeonmaster:dispatch:<record id>'
  kind               TEXT NOT NULL,      -- 'spawn' | 'exit' | 'queue-wait-start' | 'queue-wait-end' | 'register'
  ts                 INTEGER NOT NULL,
  session_ref            INTEGER,            -- the session spawned or exited (a stub until its transcript is read)
  harness            TEXT,               -- the child's harness
  native_session_id      TEXT,               -- the session or conversation id the dispatcher knows
  guild_id           TEXT,
  quest_id           TEXT,
  work_item_id       TEXT,
  role               TEXT,
  step               TEXT,
  os_pid             INTEGER,
  exit_code          INTEGER,
  exit_signal        TEXT,
  wait_reason        TEXT,               -- why the work item waited: 'slot-limit' | 'dependency' | 'rate-limit' | ...
  waited_ms          INTEGER,            -- on 'queue-wait-end'
  change_seq         INTEGER NOT NULL,
  raw_id             INTEGER, normalizer TEXT
);
CREATE INDEX dispatch_events_quest  ON dispatch_events(quest_id, ts);
CREATE INDEX dispatch_events_session    ON dispatch_events(session_ref);
CREATE INDEX dispatch_events_change ON dispatch_events(change_seq);

CREATE TABLE session_results (               -- from a stream-json 'result' line; one process can print several.
                                         -- Cost and API time are CUMULATIVE, so a session's totals are its LAST row.
  id                 INTEGER PRIMARY KEY,
  session_ref            INTEGER NOT NULL,
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
  result_preview     TEXT,               -- first 300 characters; the full text is the session's last assistant event
  permission_denials_json TEXT,
  subagent_stats_json     TEXT,
  model_usage_json        TEXT,
  api_error_status   INTEGER,
  ttft_stream_ms     INTEGER,
  time_to_request_ms INTEGER,
  raw_id             INTEGER, normalizer TEXT,
  UNIQUE (session_ref, result_uuid)
);
```

## 3. What happened inside an llm session

```sql
CREATE TABLE turns (
  id                 INTEGER PRIMARY KEY,
  natural_key        TEXT NOT NULL UNIQUE,  -- '<session>:turn:<promptId or first event pos>'
  session_ref            INTEGER NOT NULL,
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
  change_seq         INTEGER NOT NULL,
  raw_id             INTEGER, normalizer TEXT
);
CREATE INDEX turns_session    ON turns(session_ref, started_at);
CREATE INDEX turns_change ON turns(change_seq);

CREATE TABLE messages (                  -- one API message, or one user/system message; keyed GLOBALLY
  id                 INTEGER PRIMARY KEY,
  natural_key        TEXT NOT NULL UNIQUE,  -- '<harness>:<native message id>'
  session_ref            INTEGER NOT NULL,   -- the OWNING session (earliest ts, then non-copy, then lowest session natural key)
  turn_ref           INTEGER,
  role               TEXT NOT NULL,      -- 'user' | 'assistant' | 'system'
  model              TEXT,
  stop_reason        TEXT,
  request_id         TEXT,
  started_at         INTEGER,
  completed_at       INTEGER,
  is_synthetic       INTEGER NOT NULL DEFAULT 0,  -- Claude '<synthetic>' model records
  is_api_error       INTEGER NOT NULL DEFAULT 0,
  is_aborted         INTEGER NOT NULL DEFAULT 0,  -- the stream was cut off mid-message
  ttft_ms            INTEGER,
  thinking_duration_ms INTEGER,
  provisional        INTEGER NOT NULL DEFAULT 0,  -- seen on stdout, transcript copy not read yet
  change_seq         INTEGER NOT NULL,
  raw_id             INTEGER, normalizer TEXT
);
CREATE INDEX messages_session    ON messages(session_ref, started_at);
CREATE INDEX messages_change ON messages(change_seq);

CREATE TABLE events (                    -- the ordered timeline of a session; what the chat UI renders
  id                 INTEGER PRIMARY KEY,
  natural_key        TEXT NOT NULL UNIQUE,  -- per session: '<session>:<uuid>' | '<session>:step:<idx>' | '<session>:line:<n>' | '<session>:stdout:<id>'
  session_ref            INTEGER NOT NULL,
  seq                INTEGER NOT NULL,   -- display order inside the session; not unique and never a cursor (rows land
                                         -- between others and change behind it); ties break on id
  ts                 INTEGER,
  kind               TEXT NOT NULL,      -- 'user-message' | 'assistant-block' | 'tool-call' | 'tool-result'
                                         -- | 'system' | 'attachment' | 'compaction' | 'command-line' | 'meta' | 'error'
                                         -- | 'agent-message': a message ARRIVING in this (the recipient) session from
                                         --   another agent; the SEND is the sender's tool call (Claude SendMessage,
                                         --   agy send_message / invoke_subagent). Body in content_blocks, is_meta =
                                         --   hidden, tool_call_ref = the send when resolvable
                                         -- | 'intervention': something that changed or steered the session's course
                                         --   that is not a message arriving (a queue operation, an interrupt, a mode
                                         --   change). An arrival is NEVER also an intervention
  subtype            TEXT,               -- record subtype: 'turn_duration', 'skill_listing', step type, and for user
                                         -- records 'system-notification' | 'stop-hook-feedback' | 'queued-human' | 'scheduled'
                                         -- | 'skill-body' | 'local-command' | 'image-hint' | 'fork-boilerplate' | 'workflow-task'.
                                         -- kind 'agent-message': the origin kind, 'coordinator' | 'peer' | 'task-notification'.
                                         -- kind 'intervention': 'enqueue' | 'dequeue' | 'remove' | 'pop-all' | 'interrupt'
                                         -- | 'user-rejected' | 'permission-denied' | 'mode-change' | 'slash-command'
                                         -- | 'kill-agents' | 'hook-block'
  details_json       TEXT,               -- kind 'agent-message': {peerSessionKey, messageId, priority, read, deliveryId}
                                         --   plus agy's title and sender task id when present
                                         --   (peerSessionKey is the sender's llm_sessions.natural_key);
                                         -- kind 'intervention': {source, refId, reason} plus the new mode, the
                                         --   command name or the hook name; source is 'human' | 'peer' |
                                         --   'coordinator' | 'scheduled'
  link_key           TEXT,               -- joins a send's tool-call event to its arrival event in the recipient.
                                         -- Claude has no shared id, so on both:
                                         --   '<recipient agentId>:<sha256 of the body text>' (the body with the
                                         --   "The coordinator sent a message while you were working:" wrapper
                                         --   stripped). agy: 'antigravity:msg:<message uuid>' (the message file id,
                                         --   equal to the delivering step's field 114.4.1). A send with no arrival
                                         --   (about 7% of Claude sends) finds nothing: read it with a LEFT JOIN
  native_uuid        TEXT,               -- Claude record uuid; agy '<conv>:<idx>'. A resumed copy shares its original's.
  message_ref        INTEGER,
  turn_ref           INTEGER,
  parent_event_ref   INTEGER,            -- Claude parentUuid; NULL until the parent is read
  tool_call_ref      INTEGER,
  copied_from_event_ref INTEGER,         -- a resumed session re-writes earlier records; the copy points at the
                                         -- original, back-filled through native_uuid when the original is read late
  is_meta            INTEGER NOT NULL DEFAULT 0,  -- harness-injected context, not shown by default
  origin             TEXT NOT NULL,      -- 'transcript' | 'stdout' | 'both' | 'first-party'
  provisional        INTEGER NOT NULL DEFAULT 0,  -- stdout row, transcript record not read yet
  change_seq         INTEGER NOT NULL,
  raw_id             INTEGER, normalizer TEXT
);
CREATE INDEX events_session_change ON events(session_ref, change_seq);
CREATE INDEX events_session_seq     ON events(session_ref, seq);
CREATE INDEX events_ts          ON events(session_ref, ts);
CREATE INDEX events_native_uuid ON events(native_uuid);
CREATE INDEX events_tool        ON events(tool_call_ref);
CREATE INDEX events_link_key    ON events(link_key);
CREATE INDEX events_change      ON events(change_seq);

CREATE TABLE content_blocks (
  id                 INTEGER PRIMARY KEY,
  event_ref          INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,  -- one record's own rows
  parent_idx         INTEGER NOT NULL DEFAULT -1,  -- a block nested inside a tool_result (images, tool references)
  idx                INTEGER NOT NULL,   -- Claude apiBlockIndex or array index
  block_type         TEXT NOT NULL,      -- 'text' | 'thinking' | 'tool_use' | 'tool_result' | 'image' | 'document' | 'other'
  text               TEXT,               -- inline up to 4 KB; NULL above that (blob_ref) and on 'tool_result' blocks,
                                         -- whose text is tool_results.text
  text_chars         INTEGER,
  blob_ref           INTEGER,            -- full text over 4 KB, or image/document bytes
  mime               TEXT,
  tool_call_ref      INTEGER,
  duration_ms        INTEGER,            -- thinking duration, where reported
  change_seq         INTEGER NOT NULL,
  UNIQUE (event_ref, parent_idx, idx)
);
CREATE INDEX content_blocks_change ON content_blocks(change_seq);

CREATE TABLE tool_calls (                -- keyed GLOBALLY; a resumed copy maps onto the original row
  id                 INTEGER PRIMARY KEY,
  natural_key        TEXT NOT NULL UNIQUE,  -- '<harness>:<native call id>[~<n>]'
  session_ref            INTEGER NOT NULL,   -- the OWNING session
  is_stub            INTEGER NOT NULL DEFAULT 0,  -- a result or child named it before its call was read
  message_ref        INTEGER,
  call_event_ref     INTEGER,
  native_call_id     TEXT NOT NULL,      -- toolu_..., call_<n>
  tool_name          TEXT NOT NULL,      -- 'Bash', 'mcp__dungeonmaster__quest-work', 'run_command', ...; '(unresolved)' on a stub
  tool_server        TEXT,               -- MCP server name, parsed from the tool name
  input_json         TEXT,               -- inline up to 4 KB
  input_blob_ref     INTEGER,            -- the whole input over 4 KB
  input_chars        INTEGER,
  input_summary      TEXT,               -- a derived one-liner (command, path, pattern), first 300 characters
  requested_at       INTEGER NOT NULL,   -- on a stub, the referencing record's ts
  started_at         INTEGER,            -- serialised start, for parallel calls in one turn
  completed_at       INTEGER,
  latency_ms         INTEGER,
  waiting_ms         INTEGER,            -- time waiting on user approval, kept out of active time
  status             TEXT NOT NULL,      -- 'pending' | 'running' | 'ok' | 'error' | 'denied' | 'interrupted' | 'cancelled' | 'orphaned'
  denial_kind        TEXT,               -- Claude toolDenialKind; agy 'hook' | 'permission'
  spawned_session_ref    INTEGER,            -- Agent / invoke_subagent
  background_task_ref INTEGER,
  provisional        INTEGER NOT NULL DEFAULT 0,
  change_seq         INTEGER NOT NULL,
  raw_id             INTEGER, normalizer TEXT
);
CREATE INDEX tool_calls_session    ON tool_calls(session_ref, requested_at);
CREATE INDEX tool_calls_status ON tool_calls(status, requested_at);
CREATE INDEX tool_calls_name   ON tool_calls(tool_name, requested_at);
CREATE INDEX tool_calls_change ON tool_calls(change_seq);

CREATE TABLE tool_results (              -- one per call, keyed GLOBALLY through the call
  tool_call_ref      INTEGER PRIMARY KEY,  -- no foreign key: the call can be in another file
  result_event_ref   INTEGER,
  is_error           INTEGER NOT NULL,
  exit_code          INTEGER,
  interrupted        INTEGER,
  reported_duration_ms INTEGER,          -- only when the harness reports one
  shape              TEXT,               -- 'text' | 'object' | 'error-string' | 'mcp-blocks' | 'image' | 'typed-step'
  text               TEXT,               -- inline up to 4 KB; NULL when blob_ref holds it
  text_chars         INTEGER,
  blob_ref           INTEGER,
  persisted_path     TEXT,               -- Claude spill-file path the harness wrote
  details_json       TEXT,               -- small tool-specific fields (see the field maps), softFailure.{kind, checks, runId};
                                         -- a ward run through Bash adds ward.{runId, exitCode, checks, slowTestsOnly}
                                         -- (checks per check: {"lint":"pass","unit":"fail",...}), written by the
                                         -- classifier because parsing ward output is a judgement that improves
  provisional        INTEGER NOT NULL DEFAULT 0,
  change_seq         INTEGER NOT NULL,
  raw_id             INTEGER, normalizer TEXT
);
CREATE INDEX tool_results_change ON tool_results(change_seq);

CREATE TABLE tool_call_causes (          -- written by the separately versioned failure classifier (design §8.1A),
                                         -- for every call whose status is not 'ok' and every soft-failure candidate.
                                         -- cause vocabulary (design §8.1B):
                                         --   'hook-refusal'      sub_cause: the hook name
                                         --   'permission-denied' sub_cause: 'permission-rule' | 'user-rejected'
                                         --   'interrupted'       sub_cause: 'user' | 'harness'
                                         --   'cancelled'         (agy status 6)
                                         --   'ward-red'          sub_cause: the failing checks, or 'slow-tests-only'
                                         --   'ward-red-hidden'   sub_cause: 'ward' | 'jest' | 'tsc' (exited 0, output fails)
                                         --   'mcp-refused'       sub_cause: the tool name plus the first error path
                                         --   'nonzero-exit'      sub_cause: the program name
                                         --   'tool-error'        sub_cause: a short normalised code
                                         --   'timeout'
                                         --   'orphaned'          (the call never got a result)
  tool_call_ref      INTEGER PRIMARY KEY,
  classifier         TEXT NOT NULL,      -- '<name>@<version>'; a version bump re-runs only these candidates
  cause              TEXT NOT NULL,
  sub_cause          TEXT,
  soft_failure       TEXT,               -- 'ward' | 'jest' | 'tsc' when the harness said ok but the output reports a
                                         -- failing check; NULL otherwise. Counted under 'ward-red-hidden', not in tool_failures.
  change_seq         INTEGER NOT NULL
);
CREATE INDEX tool_call_causes_cause  ON tool_call_causes(cause, sub_cause);
CREATE INDEX tool_call_causes_change ON tool_call_causes(change_seq);

CREATE TABLE file_touches (              -- every file a tool call read or changed, and files changed or attached
                                         -- with no tool call (Claude edited_text_file and file attachments)
  id                 INTEGER PRIMARY KEY,
  session_ref            INTEGER NOT NULL,
  tool_call_ref      INTEGER,            -- NULL when no tool call touched it (source 'attachment')
  path               TEXT NOT NULL,      -- absolute (Claude trackingPath resolved with realParentDir)
  op                 TEXT NOT NULL,      -- 'read' | 'create' | 'edit' | 'write' | 'delete'
  lines_added        INTEGER,
  lines_removed      INTEGER,
  source             TEXT NOT NULL DEFAULT 'tool-result',  -- 'tool-result' | 'bash-diff' | 'input-fallback' | 'attachment'
  attribution        TEXT,               -- 'exact' | 'shared' (other writers shared the checkout)
  raw_id             INTEGER, normalizer TEXT
);
CREATE UNIQUE INDEX file_touches_call ON file_touches(tool_call_ref, path, op) WHERE tool_call_ref IS NOT NULL;
CREATE INDEX file_touches_session  ON file_touches(session_ref);
CREATE INDEX file_touches_path ON file_touches(path);

CREATE TABLE background_tasks (
  id                 INTEGER PRIMARY KEY,
  natural_key        TEXT NOT NULL UNIQUE,  -- '<session>:task:<native task id>'
  session_ref            INTEGER NOT NULL,
  owner_session_ref      INTEGER,            -- the sub-agent session that started it, when not the session (stdout owned_by_subagent)
  tool_call_ref      INTEGER,
  kind               TEXT,               -- 'bash' | 'subagent' | 'workflow' | 'mcp' | 'command' | 'timer' (agy schedule)
  origin             TEXT,               -- 'explicit' | 'timeout' | 'user' | 'message-delivery'
  is_background      INTEGER,
  description        TEXT,
  started_at         INTEGER,
  ended_at           INTEGER,
  status             TEXT,
  summary            TEXT,               -- the notification's <summary> line
  result_preview     TEXT,               -- first 300 characters of the notification <result>
  output_path        TEXT,               -- where the harness wrote the task's output
  exit_code          INTEGER,
  reported_duration_ms INTEGER,
  reported_tokens    INTEGER,
  reported_tool_uses INTEGER,
  notification_count INTEGER,
  change_seq         INTEGER NOT NULL,
  raw_id             INTEGER, normalizer TEXT
);
CREATE INDEX background_tasks_session    ON background_tasks(session_ref, started_at);
CREATE INDEX background_tasks_change ON background_tasks(change_seq);

CREATE TABLE usage (                     -- ONE row per API message, from its final record only; keyed GLOBALLY
  message_ref        INTEGER PRIMARY KEY,  -- no foreign key: stdout and transcript can each write it first
  session_ref            INTEGER NOT NULL,   -- follows messages.session_ref when ownership moves
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
  provisional        INTEGER NOT NULL DEFAULT 0,  -- stdout figures, transcript not read yet; stdout never lowers them
  reasoning_tokens   INTEGER,
  context_tokens     INTEGER NOT NULL,   -- input + cache read + cache write: what the model saw
  context_limit      INTEGER,            -- from the model-to-limit statics table; Claude never reports it
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
  change_seq         INTEGER NOT NULL,
  raw_id             INTEGER, normalizer TEXT
);
CREATE INDEX usage_session    ON usage(session_ref, ts);   -- live context: the newest row of each running session
CREATE INDEX usage_ts     ON usage(ts);
CREATE INDEX usage_model  ON usage(model, ts);
CREATE INDEX usage_change ON usage(change_seq);

CREATE TABLE errors (                    -- failures that are not a tool result
  id                 INTEGER PRIMARY KEY,
  natural_key        TEXT NOT NULL UNIQUE,  -- '<session>:<pos>[:<n>]'
  session_ref            INTEGER,
  ts                 INTEGER NOT NULL,
  kind               TEXT NOT NULL,      -- 'api-error' | 'rate-limit' | 'overloaded' | 'hook-error'
                                         -- | 'harness-error' | 'interrupt'
  status_code        INTEGER,
  message            TEXT,               -- inline up to 4 KB; the rest is in the raw archive
  tool_call_ref      INTEGER,
  limit_kind         TEXT,               -- quota window: 'five_hour' | 'seven_day'
  resets_at          INTEGER,
  details_json       TEXT,               -- e.g. quotaLimits, agy retry info
  change_seq         INTEGER NOT NULL,
  raw_id             INTEGER, normalizer TEXT
);
CREATE INDEX errors_ts     ON errors(ts, kind);
CREATE INDEX errors_session    ON errors(session_ref, ts);
CREATE INDEX errors_change ON errors(change_seq);

CREATE TABLE compactions (
  id                 INTEGER PRIMARY KEY,
  natural_key        TEXT NOT NULL UNIQUE,  -- '<session>:<pos>[:<n>]'
  session_ref            INTEGER NOT NULL,
  ts                 INTEGER NOT NULL,
  trigger            TEXT,               -- 'auto' | 'manual'
  pre_tokens         INTEGER,
  post_tokens        INTEGER,
  duration_ms        INTEGER,
  cumulative_dropped_tokens INTEGER,
  summary_blob_ref   INTEGER,
  raw_id             INTEGER, normalizer TEXT
);
CREATE INDEX compactions_session ON compactions(session_ref, ts);

CREATE TABLE hook_runs (
  id                 INTEGER PRIMARY KEY,
  natural_key        TEXT NOT NULL UNIQUE,  -- '<session>:<pos>[:<n>]'
  session_ref            INTEGER NOT NULL,
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
  updated_input_blob_ref INTEGER,        -- PreToolUse rewrote the tool input; the call that RAN differs from the request
  tool_call_ref      INTEGER,            -- real for Pre/PostToolUse; NULL for session and sub-agent hooks
  output_preview     TEXT,               -- first 300 characters
  stderr_preview     TEXT,               -- first 300 characters
  raw_id             INTEGER, normalizer TEXT
);
CREATE INDEX hook_runs_session  ON hook_runs(session_ref, ts);
CREATE INDEX hook_runs_tool ON hook_runs(tool_call_ref);

CREATE TABLE attachments (               -- context the harness injected: CLAUDE.md, skills, file mentions, reminders.
                                         -- An array attachment (memory files, hook snippets, MCP instructions) is
                                         -- one row PER PART, each part's text deduped as its own blob
  id                 INTEGER PRIMARY KEY,
  natural_key        TEXT NOT NULL UNIQUE,  -- '<session>:<pos>[:<n>]', plus ':<idx>' for one part of an array attachment
  session_ref            INTEGER NOT NULL,
  event_ref          INTEGER,
  ts                 INTEGER,
  attachment_type    TEXT NOT NULL,      -- Claude attachment.type
  part_idx           INTEGER,            -- the part's index in the array; NULL for a non-array attachment
  part_kind          TEXT,               -- 'memory-file' | 'hook-snippet' | 'mcp-instruction' | 'agent-line'
                                         -- | 'system-prompt'; NULL for a non-array attachment
  name               TEXT,               -- for a part: file path, snippet tag, server name
  tool_call_ref      INTEGER,
  preview            TEXT,               -- first 300 characters; never filled for session_context
  chars              INTEGER,
  blob_ref           INTEGER,
  rendered_chars     INTEGER,            -- what the model was actually sent
  rendered_blob_ref  INTEGER,            -- only for types whose text exists only in 'rendered'
  details_json       TEXT,
  raw_id             INTEGER, normalizer TEXT
);
CREATE INDEX attachments_session  ON attachments(session_ref, ts);
CREATE INDEX attachments_type ON attachments(attachment_type, ts);

CREATE TABLE rate_limit_samples (        -- stdout rate_limit_event lines: quota trend data, one per line
  raw_id             INTEGER PRIMARY KEY,
  session_ref            INTEGER,
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
  normalizer         TEXT
);
CREATE INDEX rate_limit_samples_at ON rate_limit_samples(received_at);

CREATE TABLE artifacts (                 -- the content-addressed blob store index
  id                 INTEGER PRIMARY KEY,
  blob_hash          TEXT NOT NULL UNIQUE,  -- sha256 of the uncompressed bytes; the API's :hash
  mime               TEXT,
  raw_bytes          INTEGER NOT NULL,
  stored_bytes       INTEGER NOT NULL,
  location           TEXT NOT NULL,      -- 'tail' (under 64 KB, not sealed yet: blob_tail) | 'segment' (under 64 KB,
                                         -- packed into the archive) | 'file' | 'raw' (the bytes ARE one raw record,
                                         -- such as a spill file archived as its own source)
  segment_ref        INTEGER REFERENCES archive_segments(id),  -- when location = 'segment'
  chunk_offset       INTEGER,
  chunk_stored_bytes INTEGER,
  record_offset      INTEGER,
  file_path          TEXT,               -- when location = 'file': <home>/data/blobs/ab/cd/<sha256>, written,
                                         -- fsync'ed and renamed BEFORE the commit that references it
  raw_id             INTEGER REFERENCES raw_records(raw_id),  -- when location = 'raw'
  redacted           INTEGER NOT NULL DEFAULT 0,  -- secrets in the stored bytes were replaced
  evicted_at         INTEGER,            -- tier-1 or tier-2 eviction dropped the bytes
  origin             TEXT NOT NULL,      -- 'spill-file' | 'image' | 'tool-output' | 'tool-input' | 'text' | 'summary'
                                         -- | 'attachment' | 'system-prompt'
  first_seen_at      INTEGER NOT NULL
);

CREATE TABLE blob_tail (                 -- bytes of small artifacts until the sealer packs them into a segment,
                                         -- the same pattern as raw_tail
  artifact_ref       INTEGER PRIMARY KEY REFERENCES artifacts(id),
  bytes              BLOB NOT NULL
);
```

## 4. Sources dungeonmaster produces itself

```sql
-- Ward, commit and riftcarver output is a session with harness 'dungeonmaster', kind 'command',
-- and its lines are events of kind 'command-line'. A ward step's verdict comes from quest.json wardResults[]
-- through the work_items mirror (ward_exit_code, ward_checks_json, ward_slow_tests_only).
-- The dispatch spool is section 2's dispatch_events.

CREATE TABLE server_errors (             -- one per first-party server-error record
  raw_id             INTEGER PRIMARY KEY,
  signature          TEXT NOT NULL,      -- normalised message + route, so repeats merge (the ×N count)
  ts                 INTEGER NOT NULL,
  route              TEXT,
  status_code        INTEGER,
  message            TEXT NOT NULL,      -- inline up to 4 KB
  normalizer         TEXT
);
CREATE INDEX server_errors_sig ON server_errors(signature, ts);
CREATE INDEX server_errors_ts  ON server_errors(ts);

CREATE TABLE model_calls (               -- calls through our own local-model gateway
  id                 INTEGER PRIMARY KEY,
  natural_key        TEXT NOT NULL UNIQUE,  -- 'dungeonmaster:model-call:<gateway call id>'
  backend            TEXT NOT NULL,      -- 'ollama' | 'llama.cpp'
  model              TEXT NOT NULL,
  role               TEXT,
  session_ref            INTEGER,
  started_at         INTEGER NOT NULL,
  ttft_ms            INTEGER,
  duration_ms        INTEGER,
  input_tokens       INTEGER,
  output_tokens      INTEGER,
  status             TEXT NOT NULL,      -- 'ok' | 'error' | 'timeout'
  error              TEXT,
  raw_id             INTEGER, normalizer TEXT
);
CREATE INDEX model_calls_ts ON model_calls(backend, started_at);
```

## 5. Rollups

The writer updates `rollup_session` and `rollup_hour` inside each batch's transaction. A rebuild recomputes them from the
tables above. Quest figures are not stored: `rollup_quest` is a view over `rollup_session` (design §9), and live context
is read at query time from the newest `usage` row of each running session, because `end_state` changes with no new usage.

```sql
CREATE TABLE rollup_session (
  session_ref            INTEGER PRIMARY KEY,
  input_tokens INTEGER NOT NULL DEFAULT 0, cache_read_tokens INTEGER NOT NULL DEFAULT 0,
  cache_write_tokens INTEGER NOT NULL DEFAULT 0, output_tokens INTEGER NOT NULL DEFAULT 0,
  est_cost_usd       REAL NOT NULL DEFAULT 0,
  peak_context_tokens INTEGER NOT NULL DEFAULT 0,
  last_context_tokens INTEGER NOT NULL DEFAULT 0,
  tool_calls         INTEGER NOT NULL DEFAULT 0,
  tool_failures      INTEGER NOT NULL DEFAULT 0,   -- status not 'ok'; soft failures are not counted here
  failures_by_cause_json TEXT NOT NULL DEFAULT '{}',  -- {"<cause>": n}, 'ward-red-hidden' included
  active_ms          INTEGER NOT NULL DEFAULT 0,   -- model time + tool time, idle gaps excluded
  last_reported_cost_usd REAL,           -- the harness's own cumulative cost, newest wins: Claude cost-state
                                         -- totalCostUSD or stdout result total_cost_usd. A cross-check only; the
                                         -- headline is est_cost_usd (usage x pricing)
  last_reported_at   INTEGER,            -- ts of the record that gave it
  updated_at         INTEGER NOT NULL,
  change_seq         INTEGER NOT NULL
);
CREATE INDEX rollup_session_change ON rollup_session(change_seq);

CREATE TABLE rollup_hour (
  hour_start         INTEGER NOT NULL,   -- UTC hour, ms
  harness            TEXT NOT NULL,
  model              TEXT NOT NULL,
  role               TEXT NOT NULL DEFAULT '',   -- work_items.role through llm_sessions.work_item_ref
  repo_path          TEXT NOT NULL DEFAULT '',
  guild_id           TEXT NOT NULL DEFAULT '',   -- quests.guild_id through llm_sessions.quest_ref
  input_tokens INTEGER NOT NULL DEFAULT 0, cache_read_tokens INTEGER NOT NULL DEFAULT 0,
  cache_write_tokens INTEGER NOT NULL DEFAULT 0, output_tokens INTEGER NOT NULL DEFAULT 0,
  est_cost_usd       REAL NOT NULL DEFAULT 0,
  api_messages       INTEGER NOT NULL DEFAULT 0,
  tool_calls         INTEGER NOT NULL DEFAULT 0,
  tool_failures      INTEGER NOT NULL DEFAULT 0,
  failures_by_cause_json TEXT NOT NULL DEFAULT '{}',
  PRIMARY KEY (hour_start, harness, model, role, repo_path, guild_id)
);

CREATE TABLE rollup_dirty (              -- sessions whose rollup_hour contribution is filed under stale dimensions
  session_ref            INTEGER PRIMARY KEY,
  reason             TEXT NOT NULL,      -- 'late-link' (a quest link or parent arrived, so role and guild changed)
                                         -- | 'ownership-moved' | 'renormalized' | 'reclassified'
  marked_at          INTEGER NOT NULL
);
-- The sweeper recomputes every (hour_start, harness, model) slice a dirty session touched, from usage, tool_calls
-- and tool_call_causes joined through llm_sessions.quest_ref and work_item_ref to quests and work_items, replaces those
-- rollup_hour rows, and
-- deletes the rollup_dirty rows, in one transaction.

-- Quest figures, computed at read time over a quest's sessions (a few hundred rollup_session rows). The query module adds
-- tokens by role and failures by cause from the same join.
CREATE VIEW rollup_quest AS
SELECT q.natural_key             AS quest_id,
       q.guild_id,
       COUNT(*)                  AS sessions,
       SUM(rr.input_tokens)      AS input_tokens,
       SUM(rr.cache_read_tokens) AS cache_read_tokens,
       SUM(rr.cache_write_tokens) AS cache_write_tokens,
       SUM(rr.output_tokens)     AS output_tokens,
       SUM(rr.est_cost_usd)      AS est_cost_usd,
       SUM(rr.tool_calls)        AS tool_calls,
       SUM(rr.tool_failures)     AS tool_failures,
       SUM(rr.active_ms)         AS active_ms,
       MAX(rr.change_seq)        AS change_seq
FROM quests q
JOIN llm_sessions r    ON r.quest_ref = q.id
JOIN rollup_session rr ON rr.session_ref = r.id
GROUP BY q.id;
```

## 6. The change feed and the timeline view

```sql
CREATE TABLE tombstones (                -- a deleted row of a change-fed table
  id                 INTEGER PRIMARY KEY,
  tbl                TEXT NOT NULL,      -- 'events', 'content_blocks', 'tool_calls', ...
  natural_key        TEXT NOT NULL,      -- the deleted row's natural key, or its parent-derived key (conventions)
  session_ref            INTEGER,            -- so a reader can filter to the sessions it shows
  change_seq         INTEGER NOT NULL
);
CREATE INDEX tombstones_change ON tombstones(change_seq);

-- The ordered "what happened" reading the chat UI, View Context and the timeline use. It pages by
-- (session_ref, seq); a live cursor reads the change-fed tables by change_seq and re-reads the rows they touch.
CREATE VIEW timeline AS
SELECT e.session_ref,
       r.natural_key   AS session_key,
       e.seq,
       e.id            AS event_ref,
       e.natural_key   AS event_key,
       e.ts,
       e.kind,
       e.subtype,
       e.origin,
       e.provisional,
       e.is_meta,
       e.change_seq,
       e.message_ref,
       e.tool_call_ref,
       tc.natural_key  AS tool_call_key,
       tc.tool_name,
       tc.status       AS tool_status,
       tc.latency_ms,
       tcc.cause,
       tcc.sub_cause,
       tcc.soft_failure,
       COALESCE(
         (SELECT substr(cb.text, 1, 300) FROM content_blocks cb
           WHERE cb.event_ref = e.id AND cb.text IS NOT NULL
           ORDER BY cb.parent_idx, cb.idx LIMIT 1),
         CASE WHEN e.kind = 'tool-result' THEN substr(tr.text, 1, 300) END
       )               AS text_preview,
       q.natural_key   AS quest_id,
       wi.natural_key  AS work_item_id,
       wi.role
FROM events e
JOIN llm_sessions r                   ON r.id = e.session_ref
LEFT JOIN tool_calls tc       ON tc.id = e.tool_call_ref
LEFT JOIN tool_call_causes tcc ON tcc.tool_call_ref = e.tool_call_ref
LEFT JOIN tool_results tr     ON tr.tool_call_ref = e.tool_call_ref
LEFT JOIN quests q            ON q.id = r.quest_ref
LEFT JOIN work_items wi       ON wi.id = r.work_item_ref;
```

## Index of tables

| Table | Holds |
|---|---|
| `meta` | home settings, process state, and the `next_change_seq` / `next_ingest_seq` counters |
| `schema_migrations` | every migration applied: version, name, checksum, time, duration |
| `sources` | every file or spool chronicle-llm reads, with its watermark, hashes and queue state |
| `archive_segments` | the shared segment files of the sealed raw archive, with `committed_bytes` |
| `raw_records` | one row per raw record (and per revision of one): its position, hash, replay order, where its bytes are, whether a revision was expected, and any parse error |
| `raw_tail` | the bytes of raw records not sealed into a segment yet |
| `schema_observations` | every field path seen per harness, version and record type, parsed or not |
| `schema_drift` | new, vanished or retyped paths, unknown types and versions, rewrites and replaced files |
| `ingest_jobs` | each import, catch-up, re-ingest, re-classify or eviction pass and what it read or freed, per tier |
| `normalizer_state` | what the assembler carries between batches of one session |
| `harness_versions` | every harness version seen, and the evidence for it |
| `harness_imports` | per-harness import state: last 7 days done, history done, progress |
| `llm_sessions` | one per session, sub-agent, fork, workflow agent or first-party command, with its quest and work item link and its last stdout `init` facts |
| `dispatch_events` | the dispatch spool: spawns, exits with code and signal, queue waits |
| `session_results` | stdout `result` lines: durations, TTFT, reported cost, terminal reason, denials |
| `turns` | one per prompt-to-idle turn, with its origin and duration |
| `messages` | one per API message or user/system message, global, with its owning session |
| `events` | the ordered timeline of a session: every chat entry the UI shows, including messages arriving from other agents and interventions (queue operations, interrupts, mode changes) |
| `content_blocks` | the text, thinking, tool-use, tool-result and image blocks of each event |
| `tool_calls` | one per tool call, global: name, input, timing, status, spawned session |
| `tool_results` | one per call: error flag, exit code, full text inline or as a blob |
| `tool_call_causes` | the classifier's failure cause, sub-cause and soft failure per call |
| `file_touches` | every file a tool call read or changed |
| `background_tasks` | background shell commands, sub-agents, workflows and timers |
| `usage` | one per API message from its final record: tokens, context, estimated cost |
| `errors` | failures that are not a tool result: API errors, rate limits, hook and harness errors |
| `compactions` | each context compaction and its token figures |
| `hook_runs` | each hook firing: event, outcome, command, exit code, duration |
| `attachments` | context the harness injected, one row per part of an array attachment |
| `rate_limit_samples` | stdout quota samples |
| `artifacts` | the content-addressed blob index and where each blob's bytes live |
| `blob_tail` | the bytes of small blobs not sealed into a segment yet |
| `server_errors` | dungeonmaster server errors, by signature |
| `model_calls` | calls through the local-model gateway |
| `rollup_session` | per-session token, cost, context, failure and active-time totals, and the harness's last reported cost |
| `rollup_hour` | per-hour totals by harness, model, role, repo and guild |
| `rollup_dirty` | sessions whose `rollup_hour` slices must be recomputed |
| `tombstones` | deleted rows of change-fed tables, for the change feed |
| `rollup_quest` (view) | per-quest totals computed from `rollup_session` through `llm_sessions.quest_ref` |
| `timeline` (view) | events with their call, cause, preview and quest link, in display order |
| `quests` | a mirror of each quest: id, guild, title, status, worktree; fed from the event outbox and quest.json |
| `work_items` | a mirror of each quest's work items: role, step, status, native session id, a ward step's verdict |

## Held back for the migration test

`messages.effort` (reasoning effort: Claude `effort` / `perTurnEffort`, agy's `executor_metadata` field
`10.1.28` suffix) is deliberately NOT in `0001-initial`. Phase 1 leaves those source fields unparsed, so they
must appear in `schema_drift`. Migration `0002` then adds the column, both normalizers bump their version,
and re-normalizing from the archive fills it (`design.md` §11.1).

## Open schema questions

None. Segment compaction after eviction is decided in `design.md` §13.1.
