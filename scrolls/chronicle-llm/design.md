# chronicle-llm: design

Status: draft for review, 2026-10-01. Nothing here is built.

chronicle-llm is the data layer for everything agents do. It reads every LLM harness's transcripts in each
harness's own format and translates them into one set of relational tables. It keeps a raw archive and
serves every reader from those tables: the chat UI, quest health, the timeline, the command center, MCP,
and consumption and failure trend graphs.

## The documents

| Document | Holds |
|---|---|
| `design.md` (this file) | why, the decisions, the architecture, the process, the rollout |
| `schema.md` | the SQL for every table |
| `field-maps/claude-code-*.md` | every Claude Code field seen, what it means, examples, and the column it lands in |
| `field-maps/antigravity.md` | the same for Antigravity |
| `scrolls/session-health-plan.md` | the first feature built on chronicle-llm: quest health |

Evidence these docs rest on is under `tmp/`:

| File | Holds |
|---|---|
| `schema-claude-census.json` | every Claude Code record type and field path: 3,696 files, about 1.07M records |
| `schema-agy-fieldmap.json`, `agy-live-changes.json` | the decoded Antigravity fields, and a live write trace |
| `stream-explore-stdout.jsonl`, `agy-live-stdout.txt` | captured stdout streams from both harnesses |
| `arch-open-*` | the quest-open replay measurements |
| `bench-chronicle-results.json` | the `node:sqlite` ingest benchmark |
| `q1918-*` | the quest 1918a5ee failure, timeline and health census |

## 1. Why we are building it

### 1.1 What we measured

| Finding | Measurement |
|---|---|
| **Re-parsing has stopped scaling.** Opening a quest replays every transcript of every work item over the WebSocket, one frame per line, on every connect. | Quest c8171a64 (103.6 MB of transcript, 112 sub-agents): 20,857 frames and 48.7 MB, with 6.0 s and 808 MB on the server. The browser then spends about 21.5 s of CPU, because it copies a whole map per frame. |
| **Live and reload disagree, again and again.** One shared transformer has about ten hand-written emitters, each with its own reader. The server reconciles live and replay with a gate, a buffer and a drop rule. | At least 12 live-vs-replay bugs in 150 days, the latest `a28e4b25b` on 2026-10-01 |
| **The live watcher has its own defects.** | It re-reads every transcript from byte 0 on every restart and resume. It reads unpaired sub-agent files in full every second. It drops a session's last lines when it stops. `tailFile` positions are not byte-exact. |
| **The command center needs figures across all quests and over time windows.** Per-quest files cannot answer them. | `scrolls/command-center.md` §1, §7.6, §10: tokens, context and cost on every quest row across all guilds; `err/1h`, local-model p50/p95, requests per role per hour, the 5h/7d quota |
| **Harnesses delete their own history.** | Claude Code keeps 30 days by default. The oldest record on disk is 2026-08-31, and 165 sessions listed in old `sessions-index.json` files have no transcript left. |
| **Harnesses change their formats constantly.** | About 36 Claude Code versions in 30 days, with fields added, removed and changing type (census §drift) |
| **Harnesses store sub-agents differently.** | Claude writes separate files with a `.meta.json` beside each. Antigravity writes separate conversation databases, with link files under `brain/`. |
| **Usage is easy to double-count.** | Claude repeats usage on every content-block record of one API message. Summing every record gives 104B cached input tokens against the true 53B. Resumed sessions also copy 20,260 earlier records into new files. |
| **Three of the biggest quests no longer load.** | c8171a64, 1dac5395 and b4c31633 fail the current strict contract on old `*Signoff` keys |

### 1.2 Rules we inherit from past incidents

The rate-limits poller once ran inside every MCP child and overlapped its own scans of
`~/.claude/projects`. One child reached 5.1 GB and about 2,000 open transcript files (fixed in
`3e59959e7` and `94803b8a5`). So:

1. No transcript work in MCP children or dispatched agents, ever.
2. One pass at a time over any source. A throttle is stamped when a pass ENDS.
3. Read from a saved position; never re-read a whole file without a logged reason.
4. No new polling timers. Any timer that does exist is `.unref()`-ed.
5. Memory held is bounded, and never grows with transcript size.

## 2. What it must do

1. Read every transcript source we support, in its own format, into ONE set of our own tables. The rest of
   the system reads only those tables, never a transcript.
2. Read each source once, from a saved watermark. Re-read only when we choose to: a normalizer version
   bump, a wiped index, or a source that was replaced.
3. Ingest every session, not only quest sessions, including the user's own interactive ones.
4. On first run, or when a new source is added, import ALL existing history.
5. Keep a raw archive of every record and every tool artifact, so history outlives the harness's own
   cleanup and its in-place rewrites.
6. Detect format drift, and log every field we do not parse yet.
7. Keep every transcript translation version working for years. Users will feed in old transcripts.
8. Merge each child's live stdout with its transcript into one record.
9. Make live and history the same query, so they cannot disagree.
10. Keep everything forever, for consumption and failure trend graphs.
11. Run as its own process with no docker, and never slow the API.
12. Fit the later moves to an Electron app, then a mobile client talking to a host machine.

## 3. Decisions

| Question | Decision |
|---|---|
| Name | The core package is `@dungeonmaster/chronicle-llm`. Each harness is `@dungeonmaster/chronicle-llm-<harness>`. |
| Store | SQLite through `node:sqlite`, one database per dungeonmaster home: `<home>/data/chronicle.db`, in WAL mode |
| Node version | 24.15 or later, where `node:sqlite` is a release candidate. `engines` moves from `>=14.0.0` to `>=24.15`. |
| Shape | Properly relational: runs, tool calls, tool results, usage, errors and the rest each in their own table (`schema.md`) |
| What to keep | Everything that looks valuable, so a new feature never needs a re-parse. The rest stays in the raw archive. |
| Retention | Forever, including finished, abandoned and merged quests |
| Raw archive | Append-only segment files per source, zstd-compressed in chunks. `raw_records` indexes each record's position. |
| Artifacts | Content-addressed blobs (images, spilled tool results, large tool input and output). The UI fetches them through an API route. |
| Compression | zstd from `node:zlib`, built in |
| Process | Its own background process, no docker |
| First run | Block the UI while the last 7 days import, then import the rest in the background or while idle, showing progress |
| Which sessions | All of them, every harness we support, interactive sessions included |
| Child stdout | Consumed live, merged with the transcript by id |
| Token-level streaming (`--include-partial-messages`) | Skipped. It complicates the merge for a cosmetic gain. |
| Claude's `cleanupPeriodDays` | Left at the default of 30 days |
| Harnesses in the first version | Claude Code, then Antigravity |
| How harnesses plug in | One package per harness, declaring a definition against one contract, with versioned normalizers from day one |

## 4. The architecture

```
 harness files (read-only)            chronicle-llm process (one per home)                          readers
 ─────────────────────────            ─────────────────────────────────────                          ───────
 ~/.claude/projects/**  ─┐                                                                           HTTP server
 ~/.gemini/antigravity-cli/** ─┤      watchers ─► sources.state = dirty ─► consumer, one per source     ├─ WebSocket: rows after a cursor
 <home>/data/spool/*.stdout ─┤        (fs.watch;     (the queue, in      read batch from watermark      ├─ health, timeline, command center
 dungeonmaster first-party ──┘         dispatcher     the database)      ─► harness normalizer           ├─ GET /api/... for MCP and the CLI
   (commands, server errors,           registers                         ─► ONE transaction:              └─ artifacts by hash
   local-model calls)                  runs)                                raw archive + tables          Electron, later the mobile host
                                                                            + rollups + watermark
                                                                         ─► readers see PRAGMA data_version change
                                         <home>/data/chronicle.db  ·  <home>/data/archive/  ·  <home>/data/blobs/
```

### 4.1 The one funnel

Live and history must be the same thing, by construction:

1. **One reader per source.** Only the chronicle-llm process reads transcripts.
2. **One normalized store.** Every chat entry the UI shows is a row in `events` with its `content_blocks`
   and `tool_calls`.
3. **One query, over a change feed.** Every commit takes the next `change_seq` (from `meta`), and every
   row it inserts or updates carries that number. Opening a quest, live updates and reconnects all read
   "rows for these runs with `change_seq` > N". A deleted row leaves a `tombstones` row with its own
   `change_seq`. The display order is a separate column, `events.seq`. The cursor cannot be `seq`,
   because rows change behind it:
   - a stdout row is followed by the transcript copy of the same record
   - transcript lines land between stdout rows
   - a provisional row becomes final
   - a re-normalize rewrites a whole run.

   The server never builds chat entries itself.
4. **Deterministic ids.** Every id comes from the harness's own ids or the record's position, never
   `randomUUID()` or `now()`. Reading twice cannot duplicate, and a corrected row keeps its id, so the
   web's upsert by id simply replaces it.
5. **Order-independent merging.** The result never depends on which source was read first. Live,
   catch-up and re-normalize read in different orders, so the merge rules are fixed:
   - **Which copy owns a shared row:** a message or tool call seen in several files belongs to the record
     with the earliest `ts`. A tie goes to a record that is not a copy, then to the lowest `run_id`.
     Ownership can move when an earlier record arrives late, and the rollups are adjusted by the
     difference.
   - **Which source wins a column:** the transcript wins every column both sources fill. Stdout only fills
     columns that are still NULL, and never lowers a usage figure.

When chronicle-llm reaches the chat UI (rollout step 3), dungeonmaster DELETES:
- `chatHistoryReplayBroker` and its three pre-scan passes
- the per-session JSONL watcher's entry emitting, and its 1-second sub-agent folder poll
- the replay gate, live buffer and drop rule in `server-init-responder`
- the about ten hand-built `chat-output` emit sites
- the separate command-output replay
- the web's own patches: the `now()` timestamp fill, the content-based dedupe, and the twin-Task dedupe.

### 4.2 Runs and how they link to quests

- **A run is a session or a sub-agent.** A sub-agent is just a run with `parent_run_id` and
  `spawned_by_tool_call_id`. Each harness maps its own sub-agent storage onto those two columns, and
  nothing downstream knows how a harness splits its files.
- **Links to quests come from the dispatcher, not from guessing directories.** The dispatcher runs in the
  server, which never writes the database. So it appends every spawn, every exit (code and signal) and
  every queue wait to a dispatch spool, `<home>/data/spool/dispatch.jsonl`. chronicle-llm reads that
  spool as a `first-party` source, which fills `run_links` and `runs.end_state`. A link is never lost if
  chronicle-llm is down at spawn time, and the raw archive holds it, so the database can always be
  rebuilt. The spool's queue-wait records also explain idle gaps between work items.
- **Sub-agents inherit their quest link through `runs.root_run_id`.** Only root runs carry a
  `run_links` row, and every query joins through the root. A sub-agent whose parent link arrives late
  needs no re-linking. References across sources (a child to its parent, a result to its call, usage to
  its message) carry no foreign keys, because either side can be read first.
- **Existing quests are backfilled from `quest.json`** (`workItems[].sessionId` and `sessions[]`), with
  `linked_by = 'quest-file'`.
- **Resumed sessions copy earlier records into a new file.** A copy becomes an event in the new run with
  `copied_from_event_id` set, found through the indexed `events.native_uuid`. Nothing is counted twice:
  `messages`, `usage`, `tool_calls` and `tool_results` are all keyed GLOBALLY on the harness's own ids
  (`<harness>:<message id>`, `<harness>:<tool call id>`), so a copy only adds `events` rows.

## 5. How each harness maps

`field-maps/` holds every field. This is the shape:

| Concept | Claude Code | Antigravity |
|---|---|---|
| Run | `<project>/<sessionId>.jsonl` | `conversations/<uuid>.db` |
| Sub-agent | `<session>/subagents/agent-<id>.jsonl`, linked by `agent-<id>.meta.json` (`toolUseId`, `parentAgentId`, `spawnDepth`, `agentType`). Also workflow agents under `subagents/workflows/wf_*/` with a `journal.jsonl`. Up to depth 3. | its own conversation `.db`, linked by `brain/<parent>/.system_generated/subagents/<child>.json` (`spawnStepIndex`) and `trajectory_metadata_blob` field 5. Depth 1. |
| Ordered record | one JSON line, keyed by `uuid`; metadata lines have no timestamp, so the line number orders them | one `steps` row, keyed by contiguous `idx` |
| API message | several lines sharing `message.id`, one per content block; only the FINAL line's usage is true | one PLANNER_RESPONSE step (type 15) plus its `gen_metadata` row |
| Tool call | a `tool_use` block, id `toolu_…`; the spawn tool is named `Agent` | a call `{call_id, name, args}` inside the planner step (`20.7`), plus one GENERIC step (type 132) per call |
| Tool result | a `tool_result` block plus `toolUseResult`, an object on success and an `Error: …` string on failure | the result text `140.2.1`, a typed result `140.2.6`, and `error_details` |
| Failure | `is_error`, `toolDenialKind`, synthetic `rate_limit` records | status 7, `error_details`, ERROR_MESSAGE steps (type 17) |
| Usage | the final line's `message.usage` per `message.id`; cumulative `cost-state` snapshots | `metadata.9` on planner steps: input is UNCACHED, with cache read apart and reasoning inside output |
| Timing | timestamps; only `Agent`, `WebFetch`, `WebSearch` and Artifact reads report a duration | created `metadata.1`, completed `.8`, model latency `gen_metadata.1.11` |
| Compaction | `compact_boundary`, `isCompactSummary` | CHECKPOINT steps (type 23) |
| Spilled payloads | `tool-results/` files beside the transcript: 1,315 files, 874 MB | `brain/` scratch folders |
| Live stdout | `--output-format stream-json`, joined on `(session_id, uuid)` | `agy -p --output-format stream-json`: `init`, `step_update`, `result`, joined on `(conversation_id, step_index)` |

### 5.1 How each is read

| | Claude Code | Antigravity |
|---|---|---|
| Change signal | `fs.watch` on each active transcript and its `subagents/` folder | directory events on `conversations/`. The `-wal` file changes on every row change, and is DELETED when agy exits, so watch the directory, not the file. |
| Read rule | from the byte watermark to the last complete newline. A partial last line waits, but once the run has ended and the file has been quiet for a minute, the fragment goes to `parse_errors` and the watermark moves past it. The watermark is `{byteOffset, lineNo, inode, size, headLen}`. A file counts as REPLACED when its inode changes, its size falls below `byteOffset`, or the hash of its first `headLen` bytes changes. | in one short read transaction: rows with `idx > maxIdx`, plus every row whose status is not terminal (terminal is 3 done, 4 invalid, 5 cleared, 6 cancelled, 7 error; 1 pending, 2 running, 8 streaming and 9 awaiting approval stay open). Re-read the last two `gen_metadata` rows. Do one last read after the `-wal` file disappears. |
| In-place changes | none. Measured append-only: a headless session sampled every 100 ms (182 samples, 44 lines) and this design session's own transcript (27 new lines) showed no written byte ever changing. Claude writes all of one API message's lines AFTER the message finishes, which is why earlier block lines already carry the final usage. So the transcript trails the stream by up to one message, and stdout covers that gap. Each read re-checks a hash of the last 4 KB before the watermark; a mismatch is drift and triggers a re-read. | expected. Tool steps move from pending or running to done or error. Streamed answers are rewritten about every 200 ms. `gen_metadata` row N is rewritten when N+1 lands. A row never changes once its status is terminal. Each is a `raw_revisions` row with `expected = 1`. |
| Opening | plain file reads | `mode=ro`, never `immutable=1`. A resume can reopen a "closed" conversation at any moment, and `immutable` would hide its writes. A plain read-only open of a closed WAL database leaves empty `-wal`/`-shm` files beside it. That is harmless, and the reader removes only the empty pair it created. |
| Finding children | a new file in `subagents/`, plus `.meta.json`, which can be rewritten, so its directory is watched rather than the file | a new `subagents/*.json` link file or a new `.db`. Not the summaries database, which lags and updates in jumps. |
| Watch budget | Watches are NEVER recursive (`recursive: true` on Linux adds one per directory). The process watches each harness root, each project directory, and each ACTIVE run's file and `subagents/` folder. A watch is dropped after 10 minutes of quiet. A `registered` home watches only what was registered. If a watch fails with `ENOSPC` or `EMFILE`, the process falls back to its startup stat pass on a timer and logs it. This machine already uses 70 of its 128 inotify instances. | the same rule, for `conversations/` and `brain/` |

## 6. Storage

| Store | Holds | Where |
|---|---|---|
| `chronicle.db` | every table in `schema.md` | `<home>/data/chronicle.db` |
| Raw archive, tail | the newest raw records, uncompressed, in `raw_tail` INSIDE `chronicle.db`, written in the same transaction as the rows derived from them | `chronicle.db` |
| Raw archive, sealed | older raw records: shared append-only segment files, zstd level 3 in 1 MB chunks, indexed by `raw_records`. Many sources share one segment, so small sources do not make small files. | `<home>/data/archive/<n>.seg` |
| Blob store | artifacts: images, spilled tool results, tool input and output over 4 KB, compaction summaries. Those under 64 KB are packed into archive segments; larger ones get their own file. | `<home>/data/blobs/ab/cd/<sha256>` |
| Stdout spool | each child's stdout lines with a `received_at`, as the server receives them. Deleted once fully archived. | `<home>/data/spool/<sessionId>.stdout.jsonl` |
| Dispatch spool | spawn, exit and queue-wait records from the dispatcher (§4.2). Deleted once fully archived. | `<home>/data/spool/dispatch.jsonl` |

**How the archive stays consistent with the database.** Segment files live outside SQLite, so they cannot
join a transaction. The design keeps them consistent this way:
1. **New raw records land in `raw_tail`, inside the batch's own transaction.** A crash can never leave a
   row pointing at bytes that were never written.
2. **A sealer moves them out.** It zstd-compresses tail records into a 1 MB chunk, appends the chunk to a
   segment and `fsync`s it. Then, in one transaction, it points `raw_records` at the chunk, deletes those
   `raw_tail` rows, and raises `archive_segments.committed_bytes`.
3. **On start, every segment is truncated to its `committed_bytes`.** That drops any chunk whose
   transaction never committed.
4. **Blob files use the same pattern.** Each is written to a temporary name, `fsync`ed and renamed BEFORE
   the commit that references it. A sweep removes blob files that nothing references.

Sizes and speeds from the benchmark are in §12.

## 7. The chronicle-llm process

| Concern | Design |
|---|---|
| Lifetime | A detached background process, one per dungeonmaster home, `persistent` or `parent-bound` by home kind (§7A). It takes an exclusive lockfile BEFORE opening its unix socket, because `unixSocketServe` deletes any existing socket. `dungeonmaster start` and `npm run prod` start it, and Electron main will later. Starting it twice does nothing. It reuses siegelense's lock, pid-plus-ping liveness, heartbeat and signal-teardown pieces. |
| Writing | It holds the only write connection, on its main thread. The server, the CLI and Electron open read-only. MCP never opens the database; it uses the server's HTTP API. |
| Reading in the server | `DatabaseSync` blocks its thread, and a cold query measured up to 735 ms. So the server runs its chronicle reader in a worker thread with its own read-only connection, and every endpoint is paged with a `LIMIT`. Readers go through a query module that `@dungeonmaster/chronicle-llm` exports, never raw SQL, so schema changes stay inside the package. |
| Versions sharing a home | Several repos with different dungeonmaster versions share `~/.dungeonmaster`, and a `persistent` process outlives upgrades. So on start, the server and chronicle-llm exchange `{version, schemaVersion, buildHash}` over the socket. A NEWER server tells an OLDER chronicle-llm to drain and exit, then starts its own. In dogfood, a build-hash mismatch restarts it. Readers check `meta.reader_compat`, which only a non-additive migration raises. Within one compat level, migrations only ADD. |
| Telling readers | After each commit the process sends `{change_seq}` to connected readers over its unix socket, and they read the rows past their cursor. As a fallback when the socket is down, a reader polls `PRAGMA data_version`, which changes whenever another process commits (verified across two processes), on an unref'd timer. The socket also carries control: status, pause, import-older, re-ingest. |
| Discovery | Sources are REGISTERED, not scanned for. The dispatcher registers each run it spawns. Watchers register new sub-agent files and child conversations. A full scan runs only on first run, for a new harness, or for a re-ingest. |
| Queue | `sources.state = 'dirty'` plus an in-memory wake. Many changes to one source coalesce into one flag, which survives restarts. No queue product: there is one writer. |
| Order and fairness | One consumer per source keeps its order. Batches are bounded by record count and bytes. Priority runs `live`, then `recent`, then `history`. |
| History import | A worker thread READS, parses, normalizes and compresses history, then posts finished batches to the main thread. The main thread holds the only connection and commits live work first. It caps each history commit at about 50 ms, so the 250 ms live budget holds. The worker pauses when load per core is above about 0.7, when event-loop lag p99 is above about 100 ms, or on battery (Electron's `powerMonitor`, when present). Node cannot lower one thread's priority, so the throttle is what keeps it gentle. |
| WAL | `journal_size_limit` is 64 MB. The process runs `wal_checkpoint(TRUNCATE)` after 2 s of idle and after each history job, and reports the WAL size in its status. Readers never hold a read transaction across ticks. |
| Exactly-once | Each batch commits its raw records (into `raw_tail`), derived rows, rollups, normalizer state, `change_seq` and the watermark in ONE transaction. Sealing to segments is a separate, crash-safe step (§6). |
| On start | Truncate segments to `committed_bytes`, run `PRAGMA quick_check` if the last shutdown was unclean, run migrations, then compare every registered source with its watermark and mark changed ones dirty |
| Status | `dungeonmaster chronicle status` and the socket's status call report per-source lag, queue depth, the last commit, WAL size, drift count, and the age of the last ingest. When the last ingest is 20 or more days old, it warns: Claude deletes transcripts after 30 days. The command center's health view (§7.6 there) shows the same. |
| If it fails | Once step 3 removes the old chat path, dispatch must still work without chronicle-llm. The UI then shows "history unavailable" and live output from stdout only, until chronicle-llm is back. |
| First run | Import the last 7 days at `recent` priority while the UI shows a blocking progress view, then everything older at `history` priority. Progress lives in `meta`. |
| Bad data | An unreadable record becomes a `parse_errors` row and the watermark moves on. A shrunk or replaced file, or an unexpected rewrite, becomes a `schema_drift` row plus a re-ingest of that source, logged in `ingest_jobs`. |
| A harness deletes its files | The source is marked `gone`. Our archive and tables keep everything. |
| Schema changes | Applied automatically at start, before any work (§8.4). This store is not `quest.json`, so the orchestrator's no-migration rule does not apply. |
| Host and mobile later | The process stays on the machine that holds the transcripts, the host. The mobile client talks only to the host's HTTP server. Nothing in the data layer is Electron-specific. Check that the Electron line we target bundles Node 24.15+ with `node:sqlite` and zstd. |
| Parent-bound liveness | A `parent-bound` process holds an inherited pipe from the server that started it, and exits when the pipe closes. No polling. |
| In tests | Jest testbeds run chronicle-llm IN-PROCESS against the testbed's home, so a test does not spawn a background process. e2e lanes run the real process, parent-bound. |

### 7.1 Live stdout

The server owns each child's stdout pipe. It appends every line to the stdout spool, which is cheap, and
which saves stdout for history for the first time. chronicle-llm reads the spool as a `stdout-spool`
source.

1. A stdout record creates or updates its row with `provisional = 1` and `origin = 'stdout'`.
2. The matching transcript record (Claude: same `(session_id, uuid)`; tool calls by `tool_use` id)
   overwrites the final fields (`stop_reason`, the final usage, `parentUuid`, `promptId`) and sets
   `origin = 'both'`.
3. Facts only stdout has go to `run_inits` and `run_results`: the tool list, MCP server status, API
   duration, time to first token, permission denials, `terminal_reason`, and per-sub-agent stats.
4. Claude's `task_started` pairs a sub-agent to its spawning call the moment it starts.
5. A child that dies before its transcript catches up leaves provisional rows. They stay marked
   provisional, and the run's `end_state` says `killed`.

## 7A. Homes: one store per home, and what each home ingests

dungeonmaster runs against several homes on one machine, but every one of them reads the SAME harness
folders (`~/.claude/projects`, `~/.gemini/antigravity-cli`). So a store per home needs a SCOPE per home,
or every worktree and test run would import gigabytes of history it does not need.

| Home | Path | Who uses it | Ingest scope |
|---|---|---|---|
| Dogfood prod | `<repo>/.dungeonmaster/` | `npm run prod` in this repo | `all`: every session of every harness, full history |
| Published install | `~/.dungeonmaster/` | `dungeonmaster start` for every consumer | `all` |
| Dogfood dev | `<repo>/.dungeonmaster-dev/` | `npm run dev` in this repo | `registered`: only runs this home's dispatcher spawned, and their sub-agents |
| Worktree | the worktree's own dev home, as its server already uses | dev and siege runs inside `worktrees/<name>` | `registered` |
| Tests and siegelense lanes | `/tmp/dm-e2e-<pid>`, `installTestbedCreateBroker` dirs, lane homes | e2e, integration tests, siege walkers | `registered`, with harness roots pointed at the test's own transcript folder |

What follows from that:

1. **Scope is a home setting.** It lives in `meta` and is set at first start from how the home was
   launched. `all` imports history and watches every session folder. `registered` watches only the
   sources the dispatcher registers, so a worktree's store holds only its own runs.
2. **Harness roots are configurable, never hard-coded.** Each harness definition resolves its roots from
   an override first (`CLAUDE_CONFIG_DIR` for Claude Code, a matching override for agy, or a root a test
   passes in), then the default. Tests and e2e point the roots at their own fake-transcript folder, so no
   test ever reads or writes the real `~/.claude`.
3. **Dogfood prod and the published install read the same transcripts.** If both run on one machine, each
   home keeps its own full store and archive. That doubles the disk used, which is accepted for now.
4. **One chronicle-llm process per home, bound to how the home lives.**
   - **`persistent`,** for prod and published homes: it outlives server restarts.
   - **`parent-bound`,** for dev, worktree, test and lane homes: it exits when the server that started it
     exits. Siege's `cleanup` steps and test teardown therefore leave no process behind.

   The lockfile, socket and pidfile all live inside the home, so homes never collide.
5. **Nothing reads another home's store.** A worktree server opens only its own `chronicle.db`.

## 8. Drift, versions and migrations

### 8.1 Harness packages

Each harness differs in where its files live, how its version is read, how tokens add up, how
sub-agents link, and how a failure is marked. So each is its own package that DECLARES those things
against one contract.

| Package | Holds |
|---|---|
| `@dungeonmaster/chronicle-llm` | the store, migrations, the pipeline and process, the shared readers (JSONL tail, SQLite rows), the canonical row contracts, the harness contract, the fixture test kit |
| `@dungeonmaster/chronicle-llm-claude-code` | Claude Code's definition |
| `@dungeonmaster/chronicle-llm-antigravity` | Antigravity's definition |
| later: `-codex`, `-gemini`, `-opencode`, `-ollama`, … | one each |

The repo bans exported classes outside `errors/`, so the "abstract class" is a types-only contract,
`harnessDefinitionContract`. Each harness package exports ONE definition object typed by it, and
chronicle-llm's brokers take a definition as input.

The work splits in two:
- **A per-record normalizer (harness package):** pure, one raw record in, candidate rows out. Its
  fixtures are a record and the rows it must produce.
- **A per-run assembler (core):** versioned, and it merges the candidates. Most rows come from several
  records and sources: the final usage line, stdout plus transcript, a call plus its result, a
  `.meta.json` link. The assembler applies the merge rules in §4.1, so they live in one place for every
  harness.

| Part | Declares | Claude Code | Antigravity |
|---|---|---|---|
| `id` | the harness name | `claude-code` | `antigravity` |
| `discovery` | roots, source kinds, side files, change signals | `~/.claude/projects/**`; `.meta.json`, `tool-results/`, workflow journals; `fs.watch` | `conversations/*.db`, `brain/*/.system_generated/subagents/*.json`, `conversation_summaries.db`; directory events |
| `readers` | which shared reader each source kind uses | JSONL tail | SQLite rows with re-read of open rows |
| `detectVersion` | the harness version of a record or source | the `version` field on each line | not in the data at all: only in agy's rotating `cli-*.log` files, so chronicle-llm copies it into `harness_versions` before the logs rotate away |
| `normalizers` | the versioned translation units (§8.2) | | |
| `usage` | raw usage to canonical usage, and context size | final record per `message.id`; 5m and 1h cache writes | uncached input plus cache read; reasoning inside output |
| `pricing` | price per model, or none | Anthropic prices | Google prices |
| `subagents` | how a child links to its parent and spawning call | `.meta.json` `toolUseId`, then `toolUseResult.agentId`, then stdout `task_started` | the `brain/` link file, then `trajectory_metadata_blob` field 5 |
| `failures` | the raw failure FLAGS: is it an error, a denial, an interrupt, a cancel | `is_error`, `toolDenialKind`, interrupt markers | status 7, status 6, `error_details`, step type 17 |
| `stdout` | how its live stream joins its transcript | `(session_id, uuid)` | `(conversation_id, step_index)` |
| `fixtures` | real records per harness version, with the rows they must produce | | |

### 8.1A Failure causes are classified separately

Which CAUSE a failure has (§8.1B) is a judgement that improves often: a new hook name, a new ward output
shape. If it sat inside the frozen normalizers, every improvement would mean re-normalizing the whole
corpus. So a separately versioned classifier writes `tool_call_causes`. When the classifier's version
changes, it re-runs only over calls whose status is not `ok`, plus soft-failure candidates (ward, jest
and tsc commands that exited 0), reading their text from the row, the blob or the archive.
`soft_failure` lives in that table too.

### 8.1B The failure cause vocabulary

One list, used by every harness, the health feature and the field maps:

| `cause` | Meaning | `sub_cause` |
|---|---|---|
| `hook-refusal` | a PreToolUse hook blocked the call, dungeonmaster's own `pre-*` hooks included | the hook name |
| `permission-denied` | a permission rule or the user refused the call | `permission-rule`, `user-rejected` |
| `interrupted` | the user or the harness interrupted the call | `user`, `harness` |
| `cancelled` | the harness cancelled the call (agy status 6) | |
| `ward-red` | a ward run exited non-zero | the failing checks, or `slow-tests-only` |
| `ward-red-hidden` | a ward, jest or tsc run exited 0 but its output reports a failing check | `ward`, `jest`, `tsc` |
| `mcp-refused` | an MCP tool returned an error: `{"success":false}`, a zod message, or `isError` | the tool name plus the first error path |
| `nonzero-exit` | any other shell command exited non-zero | the program name |
| `tool-error` | the tool's own error: file too large, file not found, bad argument | a short normalised code |
| `timeout` | the call ran past its time limit | |
| `orphaned` | the call never got a result | |

### 8.2 Normalizer versions

1. **A normalizer is a numbered, frozen unit:** `{ id, version, handlesHarnessVersions, declaredFields,
   normalize }`. A new harness format gets a new normalizer version, or a version-gated branch. An old
   normalizer is never edited to suit a new format.
2. **Every derived row records the normalizer that produced it,** beside its `raw_id`.
3. **A fix bumps the version, and the unit of re-normalizing is the RUN.** A row can come from several
   raw records, so rows cannot be re-derived one by one. chronicle-llm instead re-normalizes every run
   that version touched. In one transaction per run, it deletes the run's derived rows and replays its raw
   records in their original order, `raw_records.ingest_seq`, then logs the cause.
4. **Fixtures are the regression net.** Each harness package keeps real records from every harness
   version it supports, taken from the census, with the rows they must produce. A version with no fixture
   cannot claim support.
5. **An unknown harness version** uses the nearest normalizer and raises `schema_drift`.

### 8.3 The drift log

- **Field paths we did not read are recorded.** For every raw record, chronicle-llm records each field
  path it saw but no normalizer declared, in `schema_observations`, per harness, harness version and
  record type.
- **Changes become drift rows.** A new path, a vanished path, a changed type, an unknown record type, or
  an unexpected rewrite becomes a `schema_drift` row.
- **Noise control.** Keys that hold data rather than structure would flood the log: tool `input.*`,
  `modelUsage.<model>`, MCP arguments, agy protobuf fields. So each harness declares `opaqueSubtrees`,
  recorded as `x.*`. A cache of record SHAPES skips any shape already seen, and observations are
  upserted once per key per batch.
- **Who sees it:** the health view and an MCP tool show unacknowledged drift.
- **Recovery:** the raw archive holds the data, so once a normalizer learns a field, a version bump
  re-normalizes from the archive.

### 8.4 Database schema migrations

The store's own schema changes as chronicle-llm evolves. A user who upgrades and starts their instance
must never need to do anything by hand.

1. **Forward-only, numbered migrations** live in `@dungeonmaster/chronicle-llm`'s `migrations/` folder, one
   file per version (`0001-initial.ts`, `0002-…`). Each file holds its DDL and any data moves.
2. **They run automatically at start.** The chronicle-llm process compares `PRAGMA user_version` with the
   newest migration it ships, BEFORE it accepts any work. It applies each missing migration in its own
   transaction, sets `user_version`, and records it in `schema_migrations` (version, name, checksum,
   applied_at, duration).
3. **Recovery comes from the archive, not from snapshots.** The raw archive and the spools hold
   everything, so `dungeonmaster chronicle rebuild` can always rebuild the database from scratch. A
   `VACUUM INTO` snapshot of a many-GB database would stall ingest for minutes and need two to three
   times its size in free disk. So a snapshot is taken only before a migration marked `destructive`. A
   failed migration rolls back its own transaction, and the process refuses to start, logging why. The
   fix is then a corrected migration, or a rebuild. `dungeonmaster chronicle backup` takes a snapshot on
   demand.
4. **Readers wait for readiness.** The server and other readers read `meta.schema_state`. While it is
   `migrating`, they show "upgrading data" rather than query a half-changed schema.
5. **A downgrade is refused.** If `user_version` is newer than any migration the installed code knows, a
   newer version wrote this store. The process refuses to write and says so; readers stay read-only.
6. **Schema migrations are not re-normalizing.** A migration changes tables. A normalizer bump re-derives
   rows from the raw archive. A migration that adds a column the normalizers must fill marks the affected
   sources for re-normalization; the migration itself never re-parses.
7. **The archive format is versioned separately.** Each segment file starts with a header naming its
   format version, so an old segment stays readable after the format changes.
8. **Migrations are tested from every released schema.** The test kit keeps a fixture database for each
   past `user_version`, migrates each one to the latest, and asserts the result equals a fresh database
   built at the latest version.

### 8.5 What is captured from day one

Every side file is archived raw from the first version, even where no table reads it yet, so nothing is
lost while normalizers catch up:
- Claude: file-history backups, spill files, workflow journals, `.meta.json`, and task-output files.
  Task-output files are capped to their first and last 1 MB, because one measured 3.1 GB.
- agy: CLI logs (for the version), message files and link files.
- The two spools.

Some data exists only while it is being written: agy's `gen_metadata` system prompt shrinks once the
next row lands, agy's version lives only in logs that rotate, and Claude's `/tmp` task output is gone at
reboot. What chronicle-llm was not running to catch is recorded in `capture_gaps`, so the UI can say what
was lost and when.

## 9. Reading

| Reader | Reads |
|---|---|
| Chat UI: open, live, reconnect | `timeline` rows for a quest's runs after a cursor, in pages; each work item loads its newest page first |
| View Context | a window of `timeline` around one `tool_call_id` |
| Quest health | `tool_calls`, `tool_call_causes`, `errors`, `ward_runs`, rollups (`scrolls/session-health-plan.md`). The headline cost is `usage` × `pricing`, not `cost-state`, which undercounts resumed sessions. |
| Timeline | `events`, `tool_calls`, `turns`, with phases derived at query time |
| Command center rows | `rollup_quest` (computed at read time from `rollup_run` over a quest's runs, a few hundred rows), `runs` where `end_state = 'running'`, `run_links`. Live context is the newest `usage.context_tokens` of each RUNNING run, read at query time. It is not stored in a rollup, because `end_state` changes with no new usage. `usage.context_limit` comes from a model-to-limit statics table, because Claude never reports it. |
| Session liveness | interactive Claude sessions from `~/.claude/sessions/<pid>.json` (a `session-registry` source), dispatched runs from the dispatch spool |
| Command center global figures | `rollup_hour`, `server_errors`, `model_calls` |
| Trend graphs | `rollup_hour` and `usage` over any window |
| MCP tools | the server's HTTP API |
| The usage ledger (Claude quota) | `usage`, which retires its own scan of every transcript |
| `session-forensics` | deleted; chronicle-llm replaces it |
| Artifacts | `GET /api/blobs/:hash`, streamed and decompressed. Only allowlisted raster image types render inline. Everything else goes out as `text/plain` or `application/octet-stream` with `X-Content-Type-Options: nosniff`, `Content-Security-Policy: sandbox` and `Content-Disposition: attachment`. Requests with a foreign `Origin` or `Host` are refused, against DNS rebinding. No non-loopback bind until the API has authentication, which the mobile host will need. |
| Latency figures | Claude's p50/p95 and requests in flight exist only on stdout, so they cover dispatched runs only, never interactive sessions |

## 10. Testing

| Level | What proves it |
|---|---|
| Each normalizer | fixture records per harness version, giving exact rows |
| The pipeline | integration tests with `installTestbedCreateBroker`: incremental reads, partial last lines, a call and its result in different batches, file replacement, agy rows updating, crash between batch and commit |
| Parity with today | **shadow mode:** for every quest on disk, the chat entries built from chronicle-llm equal what `chatHistoryReplayBroker` emits today, entry for entry, before the old path is deleted |
| Real-quest counts | quest 1918a5ee gives 860 tool results, 98 `is_error` failures, 18 hidden ward reds, 19 `Bash(sed:*)` denials |
| Usage | per-quest token totals equal the transcripts' own `cost-state` totals |
| The funnel | the existing streaming/replay e2e pair, plus reconnect-from-cursor e2e |
| Performance | the §12 budgets, re-measured on the c8171a64-sized quest |

## 11. Rollout: each step ships on its own

| Step | Delivers | Done when |
|---|---|---|
| 0 | Standalone fixes that need no new store: the web upsert without map copying, batched replay frames, the watcher reading a sub-agent's first line only, draining before stopping, the stale lines in `packages/orchestrator/CLAUDE.md`, the three old quests loading again, Node 24 and `engines` | the c8171a64 measurements repeat faster |
| 1 | `chronicle-llm` and `chronicle-llm-claude-code`: the process, the store, the archive, the drift log, first-run import, the stdout spool. Shadow mode only; the UI is unchanged. | the parity check and the real-quest counts pass |
| 2 | Quest health on top: `get-quest-health`, the right panel, the drill-down, View Context | the session-health plan's acceptance |
| 3 | The chat UI reads from chronicle-llm; the old replay and emit paths are deleted (§4.1) | the e2e pair and reconnect-from-cursor pass |
| 4 | The timeline, durations and the command center's rollups | |
| 5 | First-party sources: command output, server errors, local-model calls | |
| 6 | `chronicle-llm-antigravity` | its fixtures pass, and a live agy run appears in the UI |

## 12. Performance

Measured with a throwaway `node:sqlite` prototype of this schema, over the WHOLE Claude Code corpus:
5.13 GB, 3,704 files, 1.076M records. It ran on Node 22.17, not 24. Raw numbers are in
`tmp/bench-chronicle-results.json`, and the scripts are beside it.

| Measure | Result |
|---|---|
| Full-corpus import | 101 s wall, 50.7 MB/s, 10.6k records/s, on one core. 88.6 s user and 14.0 s system CPU. Peak memory 393 MB. |
| CPU per GB | about 20–25 s. Parsing is 17%, zstd 14%, commits 16%, sha256 4%. |
| One 25 MB file | 0.25–0.36 s |
| Nothing changed since the last pass | 80 ms to stat all 3,704 sources |
| 1,000 new lines (5.9 MB) on one file | 140–170 ms |
| Batch size | 500 and 5,000 records per transaction perform the same |
| zstd level 3 vs 9 | 4.13:1 vs 4.31:1. Level 9 costs 1.7x the CPU for 4% less space, so **level 3**. 1 MB chunks give 4.39:1. |
| Timeline page of 200 rows | 0.83 ms warm, 6.6 ms cold |
| ±40-row window around one tool call | 0.19 ms warm, 4.8 ms cold |
| Failures by cause, one session tree | 0.25 ms warm. The biggest tree, 25.5k calls, takes 5.4 ms warm and 735 ms cold. |
| Tokens by model per hour, 30 days | 1.9 ms from `rollup_hour`, against 108 ms from `usage`. The rollup is worth keeping. |
| One raw record from the archive | 0.44 ms warm, 1.2 ms cold. All 200 sampled records matched their hash. |
| Reader during a write | no errors, no busy results. p50 0.43–0.49 ms, p95 about 0.9 ms. The writer was not slowed. |
| Usage dedupe | keying on the global `message.id` matched the true totals exactly. Summing every line overcounts output tokens by 31% and cache reads by 2x. |

### 12.1 Storage, and the rules it forces

| Store | Per GB of raw input, as prototyped |
|---|---|
| `chronicle.db` | 543 MB, of which indexes are 19% |
| Archive | 237 MB (zstd 4.2:1) |
| Artifacts | 51 MB, but 89 MB on disk because of 4 KB blocks |
| **Total** | **about 830 MB, 83% of raw** |

The corpus spans about 31 days, roughly 165 MB a day. A straight-line year is about 60 GB of raw
transcript, about 50 GB stored as prototyped. The fixes below were chosen because they make the system
healthier and are clear-cut:

1. **Integer keys inside the database.** Every table gets an `INTEGER` primary key. The deterministic
   TEXT id is stored ONCE, as a unique `natural_key` on `runs`, `messages`, `events` and `tool_calls`.
   Child tables reference the integers. The TEXT ids in `schema.md` stay as the natural keys. The
   prototype repeated long TEXT ids in every child row and every autoindex.
2. **One preview, capped short.** The prototype stored a 2,000-character preview three times, in
   `events`, `content_blocks` and `tool_results`. That was 887 MB, 32% of the database. Previews
   become 200 characters on `events` and `tool_results` and 300 on `content_blocks`. Anything longer is
   read from the blob or the archive. That saves about 650 MB (23%).
3. **Small artifacts go into the archive's segments, not files.** 43k artifact files waste 4 KB blocks.
   Only artifacts over 64 KB get their own file.
4. **Readers never hold a read transaction across ticks.** One held open let the WAL grow to 1.07 GB and
   slowed the writer from 19 s to 28 s.
5. **Archive chunks carry a stored length,** and `archive_segments` is indexed on `source_id`, both for
   resuming.
6. **Claude sub-agent run ids include their parent session:** `claude-code:<sessionId>/<agentId>`. The
   same `agent-<id>.jsonl` name appears under two sessions, and every workflow `journal.jsonl` shares a
   basename. The prototype hit 12 collisions.

With fixes 1–3, the expected total is roughly 40–50% of raw, about 25–30 GB a year at today's rate. That
is an estimate; the next prototype pass measures it.

### 12.2 Budgets the implementation must meet

| Path | Budget |
|---|---|
| A live line, file write to row visible to a reader | under 250 ms at p95 |
| Opening a quest: the first page of every work item | under 300 ms server-side, for a c8171a64-sized quest |
| A pass over unchanged sources | under 200 ms |
| First run: the last 7 days | under 30 s on this machine |
| Memory of the chronicle-llm process | under 512 MB, at any corpus size |

## 13. Questions still open

1. **Disk budget:** keeping everything forever is about 25–30 GB a year at today's usage, once the
   storage fixes in §12.1 land. This machine has 44 GB free. Do we add a per-home disk cap, which would
   prune the raw archive of the oldest records whose harness file still exists, keeping all tables? Or
   accept the growth?
2. **Dogfood prod and the published install on one machine:** accept two full stores, or let one home
   declare `ingest_scope = all` and the other `registered`?
3. **Capturing while dungeonmaster is stopped:** sessions run while no chronicle-llm process is up lose
   their stdout, agy's shrinking system prompts and versions, and Claude's `/tmp` task output for good
   (§8.5). Do we offer an optional `dungeonmaster chronicle install-service`, a systemd user unit or a
   launchd agent, for persistent homes? Without it, `capture_gaps` records what was missed.
4. **Secrets in a keep-forever archive.** Transcripts and Claude's file-history backups hold secrets: an
   edited `.env` is copied whole. The proposal has four parts:
   - **A deny-list before archiving:** side files matching `.env*`, `*.pem`, `id_*`, `credentials*`, and
     agy's `terminals/.env`. Each keeps only a hash stub marked `redacted`.
   - **A secret scanner** that redacts derived columns and previews.
   - **A `dungeonmaster chronicle purge --pattern` command** that rewrites the affected archive chunks and
     leaves a tombstone. This is a deliberate exception to "keep everything".
   - **Locked-down files:** data directories `0700`, files `0600`.

   Also, agents get no `Read` of `<home>/data/**`. That matters in dogfood, where the home sits inside the
   repo. Is the purge exception acceptable, and is the deny-list right?

## 14. Settled while writing this

| Question | Answer | Evidence |
|---|---|---|
| Does Claude Code rewrite transcript lines in place? | No. It is append-only, and writes a message's lines once the message ends. | §5.1; the 100 ms probe in `tmp/rewrite-probe.py` |
| Where is Antigravity's version? | Only in its rotating CLI logs, so chronicle-llm copies it into `harness_versions` | `field-maps/antigravity.md` |
| `session-forensics` | Deleted once chronicle-llm replaces it. One transcript parser, not two. | §9 |
| The first-run window | Kept at 7 days. A full 5 GB import takes about 101 s, so the blocking part is seconds and full history follows within minutes. | §12 |
| Can test homes keep off the real `~/.claude`? | Yes. `locationsClaudeConfigDirFindBroker` (shared) honours `CLAUDE_CONFIG_DIR`, and the jest setup sandboxes `HOME` for the fake Claude CLI. chronicle-llm resolves Claude's root through that broker. One fix comes with it: `claudeProjectPathEncoderTransformer` hard-codes `<home>/.claude/projects` and ignores `CLAUDE_CONFIG_DIR`. | `packages/shared/src/brokers/locations/claude-config-dir-find/`, `packages/shared/src/transformers/claude-project-path-encoder/` |

## 15. Review applied (2026-10-01)

A fresh Opus reviewer read all of these docs. What changed:

| Review point | Change | Where |
|---|---|---|
| A cursor on `seq` misses rows that change behind it | change feed: `change_seq` on every row, `tombstones`, socket notify | §4.1, §7 |
| Segment files cannot join a transaction | `raw_tail` in the database, a sealer, `committed_bytes`, write-then-rename blobs | §6 |
| The chat UI needs full text, not 200-character previews | text inline up to 4 KB, a blob above that, previews computed at read time | `schema.md` |
| Resumed copies double-count tool calls | `tool_calls` and `tool_results` keyed globally; `events.native_uuid` | §4.2 |
| Ownership depended on ingest order | order-independent merge rules | §4.1 |
| Run links had no durable write path | the dispatch spool, a first-party source | §4.2 |
| Mixed dungeonmaster versions share one home | version handshake, `reader_compat`, a query module, additive-only within a compat level | §7 |
| Late parent links break foreign keys and rollups | `root_run_id`, no cross-source foreign keys, quest rollups computed at read time | §4.2, §9 |
| The docs contradicted each other | one sub-agent run id recipe, one cause vocabulary, real integer-key DDL, aligned preview sizes, file names fixed | §8.1B, `schema.md`, field maps |
| Source replacement detection was wrong for small files | the `{byteOffset, lineNo, inode, size, headLen}` watermark; partial-line timeout; never `immutable=1` | §5.1 |
| Cause classification sat inside frozen normalizers | a separately versioned classifier and `tool_call_causes` | §8.1A |
| Synchronous reads would block the API | a reader worker thread, paged endpoints | §7 |
| The history worker was a second writer | the worker only prepares batches; one connection commits; 50 ms commit cap | §7 |
| WAL growth | `journal_size_limit`, idle checkpoints | §7 |
| inotify instance limits | non-recursive, idle-expiring watches, a stat fallback | §5.1 |
| Data that exists only while it is written | capture every side file raw from day one; `capture_gaps` | §8.5 |
| Migration snapshots stall large databases | rebuild from the archive; snapshots only for destructive migrations | §8.4 |
| Re-normalizing by row cannot work | re-normalize per run; per-record normalizer plus per-run assembler | §8.1, §8.2 |
| Drift-log noise | `opaqueSubtrees`, a shape cache | §8.3 |
| Gaps the health feature and command center hit | `ward_runs`, session liveness, a model context-limit table, stdout-only latency, `chronicle status` | §7, §9 |
| Blob route safety | content-type allowlist and headers, Origin and Host checks, loopback only | §9 |
| Process hosting in tests | in-process mode for jest, parent-bound by inherited pipe, a degraded mode | §7 |
| `rate_limit_samples` key allowed duplicates | keyed on `raw_id` | `schema.md` |

Rejected: the suggestion to defer normalizing `attachments`, `hook_runs`, `interventions`,
`agent_messages`, `file_backups`, `compactions` and `run_inits` until a feature reads them. The user
asked for everything valuable to be parsed now, so no new feature needs a re-parse. The raw capture from
day one (§8.5) is kept either way.

Waiting on the user: secrets and purge, capture while stopped, and disk budget (§13).
