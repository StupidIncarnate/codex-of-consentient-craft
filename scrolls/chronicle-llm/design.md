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
| `manual-test-plan.md` | manual test cases by phase, with the data quality review |
| `followup-home-state-to-db.md` | follow-up: moving the home's JSON files into a `state.db` |

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
| Node version | `engines` moves from `>=14.0.0` to `>=22.16`, the real floor: `node:sqlite` is unflagged from 22.13, its busy-timeout option arrives in 22.16, and `node:zlib` zstd in 22.15. Every phase is tested on Node 22.17 first, which covers the user's other machine on 22.22, then again after an upgrade to Node 24. On 22, `node:sqlite` prints an experimental warning; it is suppressed. Booleans cannot be bound before Node 24.21, so the query module writes 0 and 1. |
| Shape | Properly relational: llm sessions, tool calls, tool results, usage, errors and the rest each in their own table (`schema.md`) |
| What to keep | Everything that looks valuable, so a new feature never needs a re-parse. The rest stays in the raw archive. |
| Retention | Forever, including finished, abandoned and merged quests, inside a per-home storage cap (default 4 GB). Over the cap, detail is evicted oldest-first while trend data stays (§13.1). |
| Raw archive | Append-only segment files per source, zstd-compressed in chunks. `raw_records` indexes each record's position. |
| Artifacts | Content-addressed blobs (images, spilled tool results, large tool input and output). The UI fetches them through an API route. |
| Compression | zstd from `node:zlib`, built in |
| Process | Its own background process, no docker |
| First run | Block the UI while the last 7 days import, then import the rest in the background or while idle, showing progress |
| Which sessions | All of them, every harness we support, interactive sessions included |
| Child stdout | Consumed live, merged with the transcript by id |
| Token-level streaming (`--include-partial-messages`) | Skipped. It complicates the merge for a cosmetic gain. |
| Claude's `cleanupPeriodDays` | Left at the default of 30 days |
| Harnesses in the first version | Claude Code AND Antigravity, built together, so the core is shaped by two very different harnesses (JSONL files vs SQLite rows that update in place) instead of fitted to Claude |
| Naming | Any LLM train of messages, a main session or a sub-agent, is an `llm_session` (table `llm_sessions`). "Session" alone is avoided because it already means Claude's `sessionId`, `quest.sessions[]` and chat sessions. |
| Ids | INTEGER keys inside the database. Every row that leaves it is identified by its deterministic `natural_key`. No UUIDs: random keys scatter B-tree inserts, and long keys in every child row bloated the prototype database (§12.1). The API and UI only ever see natural keys, so a rebuild, which renumbers integers, breaks nothing. |
| Tool-specific facts | They go in `tool_results.details_json`, never a table of their own: git commits and pushes, Edit patch stats, Bash return-code notes, and an agent's ward run through Bash (exit code, per-check status, slow-tests-only). A tool-specific table singles out one tool of one harness, and grows with every tool anyone cares about. A table is only for a fact that EVERY harness produces and that is queried across sessions: `file_touches` (scope drift, any harness's edits), `background_tasks`. A dungeonmaster ward STEP is not a tool fact: its verdict comes from `quest.json` `wardResults[]` through the `work_items` mirror. A tool-specific query that turns out hot gets an expression index on `details_json`, not a table. So there is no `git_operations` table and no ward table (§16). |
| Column and property case | Columns are `snake_case`, the SQL convention. Everything that leaves the database is a `camelCase` JSON object parsed by a zod contract in `@dungeonmaster/shared`, so the server, web and MCP share one type. The conversion happens in exactly one place: chronicle-llm's query module (§9.1). |
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
   local-model calls)                  sessions)                            raw archive + tables          Electron, later the mobile host
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
   "rows for these sessions with `change_seq` > N". A deleted row leaves a `tombstones` row with its own
   `change_seq`. Tombstones are kept 7 days; `meta.tombstone_floor_seq` rises daily, and a reader whose
   cursor is below the floor does a full reload. The display order is a separate column, `events.seq`. The cursor cannot be `seq`,
   because rows change behind it:
   - a stdout row is followed by the transcript copy of the same record
   - transcript lines land between stdout rows
   - a provisional row becomes final
   - a re-normalize rewrites a whole session.

   The server never builds chat entries itself.
4. **Deterministic ids.** Every id comes from the harness's own ids or the record's position, never
   `randomUUID()` or `now()`. Reading twice cannot duplicate, and a corrected row keeps its id, so the
   web's upsert by id simply replaces it.
5. **Order-independent merging.** The result never depends on which source was read first. Live,
   catch-up and re-normalize read in different orders, so the merge rules are fixed:
   - **Which copy owns a shared row:** a message or tool call seen in several files belongs to the record
     with the earliest `ts`. A tie goes to a record that is not a copy, then to the session with the lowest NATURAL key. Integer ids are not used, because they depend on ingest order.
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

### 4.2 LLM sessions and how they link to quests

- **An llm session is a main session or a sub-agent.** A sub-agent is just an llm session with `parent_session_id` and
  `spawned_by_tool_call_id`. Each harness maps its own sub-agent storage onto those two columns, and
  nothing downstream knows how a harness splits its files.
- **Links to quests come from the dispatcher, not from guessing directories.** The dispatcher runs in the
  server, which never writes the database. So it appends every spawn, every exit (code and signal) and
  every queue wait to a dispatch spool, `<home>/data/spool/dispatch.jsonl`. chronicle-llm reads that
  spool as a `first-party` source, which fills `llm_sessions.quest_ref`, `work_item_ref`, `linked_by`, `linked_at`
  and `end_state`. A link is never lost if
  chronicle-llm is down at spawn time, and the raw archive holds it, so the database can always be
  rebuilt. The spool's queue-wait records also explain idle gaps between work items.

  Each spool line is one JSON record, which becomes one `dispatch_events` row:

  | Field | Meaning |
  |---|---|
  | `id` | unique per record, written by the dispatcher (a uuid is fine here: this is the source's own id, not one chronicle-llm invents) |
  | `kind` | `register`, `spawn`, `exit`, `queue-wait-start` or `queue-wait-end` |
  | `ts` | the dispatcher's clock, in ms |
  | `harness`, `nativeSessionId` | the child's harness and the session or conversation id, once known |
  | `guildId`, `questId`, `workItemId`, `role`, `step` | the dungeonmaster work the session belongs to |
  | `osPid` | the child's process id |
  | `exitCode`, `exitSignal` | on `exit` |
  | `waitReason`, `waitedMs` | on queue waits: `slot-limit`, `dependency`, `rate-limit` and so on |
- **Sub-agents inherit their quest link from their parent.** Every llm session carries its own `quest_ref` and
  `work_item_ref` (§4.3); a sub-agent copies its parent's, with `linked_by = 'inherited'`, so no query joins
  through the root. Guild comes from `quests.guild_id`, role and step from `work_items.role` and `step`. A
  sub-agent whose parent link arrives late gets the link copied down its subtree, and that write is itself a
  change. References across sources (a child to its parent, a result to its call, usage to
  its message) carry no foreign keys, because either side can be read first.
- **Existing quests are backfilled from `quest.json`** (`workItems[].sessionId` and `sessions[]`), with
  `linked_by = 'quest-file'`.
- **A message between agents is a send and an arrival, both already in the timeline.** The SEND is the
  sender's tool call (Claude `SendMessage`, agy `send_message` or `invoke_subagent`). The ARRIVAL is one
  `events` row in the RECIPIENT session, kind `agent-message`, subtype the origin kind (`coordinator`,
  `peer`, `task-notification`), its body in `content_blocks`, `is_meta` set when the harness hides it,
  `details_json` holding `{peerSessionKey, messageId, priority, read, deliveryId}`, and `tool_call_ref`
  pointing at the send when it resolves. `events.link_key` joins the two:
  - **Claude** keeps no shared id between send and arrival, so both carry
    `<recipient agentId>:<sha256 of the body text>`, with the "The coordinator sent a message while you
    were working:" wrapper stripped before hashing.
  - **agy** links natively: the message file's `id` equals the delivering step's field `114.4.1`, so both
    carry `antigravity:msg:<message uuid>`.

  Measured (`tmp/agentmsg-*`): a Claude coordinator message arrives a median 0.04 s after its send in the
  user-record form and 10.7 s in the queued-attachment form; an agy `send_message` a median 0.10 s. About 7%
  of Claude sends never arrive, so a reader joins send to arrival with a LEFT JOIN.
- **An arrival is never an intervention.** A `queued_command` or user record whose origin is `human`,
  `peer`, `coordinator` or `task-notification` is recorded once, as its arrival event; a human's mid-turn
  message is an ordinary `user-message` event. What does change a session's course without arriving as a
  message (a queue operation, an interrupt, a rejection or denial, a mode change, a slash command, killed
  agents, a hook block) is an `events` row of kind `intervention`, with its source, reference id and reason
  in `details_json`.
- **Resumed sessions copy earlier records into a new file.** A copy becomes an event in the new session with
  `copied_from_event_ref` pointing at the original, found through the indexed `events.native_uuid`.
  Nothing is counted twice: `messages`, `usage`, `tool_calls` and `tool_results` are all keyed GLOBALLY
  on the harness's own ids, so a copy only adds `events` rows. "Global" means the narrowest scope the
  harness itself keeps unique:
  - **Claude Code:** `claude-code:<message id>` and `claude-code:<toolu id>`, unique across all files.
  - **Antigravity:** `antigravity:<conversation>:<call id>`, because agy reuses `call_<n>` across
    conversations (628 cases seen). Within one conversation a repeat takes the `~<n>` suffix.

### 4.3 Linking rows to quests the moment they exist

**The problem today.** A sub-agent spawns, and for a while nothing knows which quest it belongs to.
Tool calls have the same delay. The browser listens per quest, so it misses or delays those rows.

**The rule.** Every row that belongs to a quest is linkable to it AT INSERT, and the browser
subscribes by quest.
- Each `llm_session` carries `quest_ref` and `work_item_ref` directly, with `linked_by` and `linked_at` saying
  how and when they were set; there is no separate link table. A main session gets them from its
  dispatch-spool `register` record, which the dispatcher writes BEFORE it spawns the child. A sub-agent
  copies its parent's when its link is found.
- The change feed is filtered by quest through those columns.
- When a link arrives late, setting `quest_ref` is itself a change, so subscribers see the session appear
  and load its rows.

**Quests are mirrored into the store.** `quests` and `work_items` tables hold the ids and the few
fields the feed and the command center need: guild, title, status, role, step and timestamps. They are
not a copy of `quest.json`. A first-party source keeps them current from `quest.json` changes.

**How it works.** Settled by research (`tmp/qlink-research-*.py`):

| Today | Measured |
|---|---|
| Sub-agent files are found by a 1 s folder poll, then paired by prompt text | first entry reaches the browser about 1.1 s after the parent's tool call; p90 about 6 s; each nesting level adds another poll |
| Tool calls stream only after the child's init line is written into `quest.json` and a reconcile runs | a late start; the lines are delayed, not lost |
| The server drops a frame naming only a work item when its cache is cold | recovered only by re-subscribing |

| Harness signal | When it arrives |
|---|---|
| Claude `.meta.json` (`toolUseId`, `parentAgentId`, `spawnDepth`) | before the sub-agent file in 90% of cases (2,331 of 2,589), a median 0.09 s earlier. 9% arrive later, mostly background agents. |
| Claude stdout `system/task_started` (`task_id`, `tool_use_id`) | 1–2 lines after the tool call, before the sub-agent file exists. It also fires for background Bash, so it is filtered on `task_type`. |
| agy `brain/<parent>/.system_generated/subagents/<child>.json` | within the same 200 ms as the child database |

The mechanism:
1. **The dispatcher and the chat-spawn path write a `register` record before spawning.** It carries
   guild, quest, work item, role and step. For a fresh Claude spawn they also mint the session id and
   pass `--session-id <uuid>`, so the record names the native id before any file exists, and the
   `llm_sessions` row exists, linked, before its first line. agy has no such flag, so it gets a `spawn`
   record once its id is known. A resume writes `register` with `resumeOf`. The two write sites,
   `spawn-one-agent-layer-broker` and `agentLaunchBroker`, share one spool-append broker.
2. **A sub-agent gets `quest_ref` at insert.** Whichever arrives first among stdout `task_started`,
   `.meta.json`, or the sub-agent file's own path gives its parent. The parent already carries the
   quest, so a stub row is created at once, linked. Prompt-text pairing and the folder poll are gone.
3. **Interactive sessions dungeonmaster did not start** have no `register`. They link through the quest
   mirror's `sessions[]` (`linked_by = 'quest-file'`), or through the `questId` in their own
   `mcp__dungeonmaster__*` tool inputs (`'inferred'`).
4. **Events and tool calls do not carry `quest_ref`.** Per-quest reads join through the llm session,
   using the index on `events(session_ref, change_seq)`. A late link rewrites only session rows, which
   bumps their `change_seq`. Subscribers then load those sessions' rows.
5. **The browser subscribes per quest:** sessions with `quest_ref = Q` and any row of theirs past its
   cursor.

**The quest mirror's feed.** Every quest mutation goes through `questPersistBroker`: a temp file, a
rename, then an `event-outbox.jsonl` line. So a reader that sees an outbox line always reads a complete
file.
- **The outbox is a first-party source.** chronicle-llm tails it and reads the `quest.json` each line
  names into `quests` and `work_items`.
- **It reconciles from the files themselves,** by scanning every quest folder, on start, whenever the
  outbox shrinks (the server truncates it on boot), and on an mtime sweep that catches direct writes.
- **The outbox line gains `guildId` and `folder`,** an additive change, so no directory scan is needed
  to find the file.

### 5.1 How each is read

| | Claude Code | Antigravity |
|---|---|---|
| Change signal | `fs.watch` on each active transcript and its `subagents/` folder | directory events on `conversations/`. The `-wal` file changes on every row change, and is DELETED when agy exits, so watch the directory, not the file. |
| Read rule | from the byte watermark to the last complete newline. A partial last line waits, but once the session has ended and the file has been quiet for a minute, the fragment is archived as a `raw_records` row with `parse_error` set and the watermark moves past it. The watermark is `{byteOffset, lineNo, inode, size, headLen}`. A file counts as REPLACED when its inode changes, its size falls below `byteOffset`, or the hash of its first `headLen` bytes changes. | in one short read transaction: rows with `idx > maxIdx`, plus every row whose status is not terminal (terminal is 3 done, 4 invalid, 5 cleared, 6 cancelled, 7 error; 1 pending, 2 running, 8 streaming and 9 awaiting approval stay open). Re-read the last two `gen_metadata` rows. Do one last read after the `-wal` file disappears. |
| In-place changes | none. Measured append-only: a headless session sampled every 100 ms (182 samples, 44 lines) and this design session's own transcript (27 new lines) showed no written byte ever changing. Claude writes all of one API message's lines AFTER the message finishes, which is why earlier block lines already carry the final usage. So the transcript trails the stream by up to one message, and stdout covers that gap. Each read re-checks a hash of the last 4 KB before the watermark; a mismatch is drift and triggers a re-read. | expected. Tool steps move from pending or running to done or error. Streamed answers are rewritten about every 200 ms. `gen_metadata` row N is rewritten when N+1 lands. A row never changes once its status is terminal. Each change stores the new bytes as a NEW `raw_records` row with a higher `revision` and `revision_expected = 1`; the rows of one position are linked by `(source_ref, sub_table, pos, revision)`, so the old bytes stay readable. |
| Opening | plain file reads | `mode=ro`, never `immutable=1`. A resume can reopen a "closed" conversation at any moment, and `immutable` would hide its writes. A plain read-only open of a closed WAL database leaves empty `-wal`/`-shm` files beside it. That is harmless, and the reader removes only the empty pair it created. |
| Finding children | a new file in `subagents/`, plus `.meta.json`, which can be rewritten, so its directory is watched rather than the file | a new `subagents/*.json` link file or a new `.db`. Not the summaries database, which lags and updates in jumps. |
| Watch budget | Watches are NEVER recursive (`recursive: true` on Linux adds one per directory). The process watches each harness root, each project directory, and each ACTIVE session's file and `subagents/` folder. A watch is dropped after 10 minutes of quiet. A `registered` home watches only what was registered. If a watch fails with `ENOSPC` or `EMFILE`, the process falls back to its startup stat pass on a timer and logs it. This machine already uses 70 of its 128 inotify instances. | the same rule, for `conversations/` and `brain/` |

## 6. Storage

| Store | Holds | Where |
|---|---|---|
| `chronicle.db` | every table in `schema.md` | `<home>/data/chronicle.db` |
| Raw archive, tail | the newest raw records, uncompressed, in `raw_tail` INSIDE `chronicle.db`, written in the same transaction as the rows derived from them | `chronicle.db` |
| Raw archive, sealed | older raw records: shared append-only segment files, zstd level 3 in 1 MB chunks, indexed by `raw_records`. Many sources share one segment, so small sources do not make small files. | `<home>/data/archive/<n>.seg` |
| Blob store | artifacts: images, spilled tool results, tool input and output over 4 KB, compaction summaries. Those under 64 KB are packed into archive segments; larger ones get their own file. | `<home>/data/blobs/ab/cd/<sha256>` |
| Stdout spool | each child's stdout lines with a `received_at`, as the server receives them. Deleted only once fully archived AND sealed (step 6 below). | `<home>/data/spool/<sessionId>.stdout.jsonl` |
| Dispatch spool | spawn, exit and queue-wait records from the dispatcher (§4.2). Deleted only once fully archived AND sealed (step 6 below). | `<home>/data/spool/dispatch.jsonl` |

**How the archive stays consistent with the database.** Segment files live outside SQLite, so they cannot
join a transaction. The design keeps them consistent this way:
1. **New raw records land in `raw_tail`, inside the batch's own transaction.** A crash can never leave a
   row pointing at bytes that were never written.
2. **A sealer moves them out.** It zstd-compresses tail records into a 1 MB chunk, appends the chunk to a
   segment and `fsync`s it. Then, in one transaction, it points `raw_records` at the chunk, deletes those
   `raw_tail` rows, and raises `archive_segments.committed_bytes`.
3. **On start, every segment is truncated to its `committed_bytes`.** That drops any chunk whose
   transaction never committed.
4. **Blobs use the same pattern.** An artifact under 64 KB first lands in `blob_tail` inside the
   batch's transaction, and the sealer packs it into a segment. A larger one is written to a temporary
   file, `fsync`ed and renamed BEFORE the commit that references it, and a sweep removes blob files
   nothing references.
5. **Nothing is stored twice.** A spill file is archived once, as a raw record of its own source, and its
   artifact row points at that record (`location = 'raw'`).
6. **A spool file is deleted only when nothing can bring it back.** The stdout and dispatch spools are the
   ONLY copy of what they hold, so a spool is deleted only after every record from it sits in a SEALED,
   `fsync`ed segment AND the sealing transaction has committed and been followed by a WAL checkpoint. Never
   just after the `raw_tail` commit: with `synchronous=NORMAL` the last commits before a power cut can be
   lost, and the spool is what replays them.

Sizes and speeds from the benchmark are in §12.

## 7. The chronicle-llm process

| Concern | Design |
|---|---|
| Lifetime | A detached background process, one per dungeonmaster home, `persistent` or `parent-bound` by home kind (§7A). It takes an exclusive lockfile BEFORE opening its unix socket, because `unixSocketServe` deletes any existing socket. `dungeonmaster start` and `npm run prod` start it, and Electron main will later. Starting it twice does nothing. It reuses siegelense's lock, pid-plus-ping liveness, heartbeat and signal-teardown pieces. |
| Writing | It holds the only write connection, on its main thread. The server, the CLI and Electron open read-only. MCP never opens the database; it uses the server's HTTP API. |
| Reading in the server | `DatabaseSync` blocks its thread, and a cold query measured up to 735 ms. So the server runs its chronicle reader in a worker thread with its own read-only connection, and every endpoint is paged with a `LIMIT`. Readers go through a query module that `@dungeonmaster/chronicle-llm` exports, never raw SQL, so schema changes stay inside the package. |
| Versions sharing a home | Several repos with different dungeonmaster versions share `~/.dungeonmaster`, and a `persistent` process outlives upgrades. So on start, the server and chronicle-llm exchange `{version, schemaVersion, buildHash}` over the socket. A NEWER server tells an OLDER chronicle-llm to drain and exit, then starts its own. In dogfood, a build-hash mismatch restarts it. Readers check `meta.reader_compat`, which only a non-additive migration raises. Within one compat level, migrations only ADD. |
| Telling readers | After each commit the process sends `{change_seq}` to connected readers over its unix socket, and they read the rows past their cursor. As a fallback when the socket is down, a reader polls `PRAGMA data_version`, which changes whenever another process commits (verified across two processes), on an unref'd timer. The socket also carries control: status, pause, import-older, re-ingest. |
| Discovery | Sources are REGISTERED, not scanned for. The dispatcher registers each session it spawns. Watchers register new sub-agent files and child conversations. A full scan runs only on first run, for a new harness, or for a re-ingest. |
| Queue | `sources.state = 'dirty'` plus an in-memory wake. Many changes to one source coalesce into one flag, which survives restarts. No queue product: there is one writer. |
| Order and fairness | One consumer per source keeps its order. Batches are bounded by record count and bytes. Priority runs `live`, then `recent`, then `history`. |
| History import | A worker thread READS, parses, normalizes and compresses history, then posts finished batches to the main thread. The main thread holds the only connection and commits live work first. It caps each history commit at about 50 ms, so the 250 ms live budget holds. The worker pauses when load per core is above about 0.7, when event-loop lag p99 is above about 100 ms, or on battery (Electron's `powerMonitor`, when present). Node cannot lower one thread's priority, so the throttle is what keeps it gentle. |
| WAL | `journal_size_limit` is 64 MB. The process runs `wal_checkpoint(TRUNCATE)` after 2 s of idle and after each history job, and reports the WAL size in its status. Readers never hold a read transaction across ticks. |
| Exactly-once | Each batch commits its raw records (into `raw_tail`), derived rows, rollups, normalizer state, `change_seq` and the watermark in ONE transaction. Sealing to segments is a separate, crash-safe step (§6). |
| On start | Truncate segments to `committed_bytes`, run `PRAGMA quick_check` if the last shutdown was unclean, run migrations, then compare every registered source with its watermark and mark changed ones dirty |
| Status | `dungeonmaster chronicle status` and the socket's status call report per-source lag, queue depth, the last commit, WAL size, drift count, and the age of the last ingest. When the last ingest is 20 or more days old, it warns: Claude deletes transcripts after 30 days. The command center's health view (§7.6 there) shows the same. |
| Reading the store from the CLI | `dungeonmaster chronicle query "<sql>"` opens the database with `readOnly: true`, refuses any statement but a `SELECT`, a `WITH` query or a read-only `PRAGMA`, and prints one JSON object per row (JSON lines). This is how agents read the store, the data quality review LLM included, because agents get no `Read` of `<home>/data/**` (§13.2). `dungeonmaster chronicle drift` lists open `schema_drift` rows; `--ack <id>` acknowledges one and `--ack-all` every open row (sets `acknowledged_at`). |
| If it fails | Once step 3 removes the old chat path, dispatch must still work without chronicle-llm. The UI then shows "history unavailable" and live output from stdout only, until chronicle-llm is back. |
| First run, and every new harness | Importing is tracked PER HARNESS in `harness_imports` (harness, normalizer set, state, last 7 days done at, history done at, progress). The very first start of a home imports the last 7 days of every supported harness at `recent` priority while the UI shows a blocking progress view, then all older history at `history` priority. **It rolls:** when a user upgrades dungeonmaster and the new version ships a harness package the home has never imported, that harness alone gets the same treatment, last 7 days first, then its history, as soon as its data exists on the machine. A harness whose data appears later, such as agy installed next month, is picked up the same way. Only the very first start blocks the whole UI; a later harness shows its own progress banner and blocks nothing. |
| Bad data | An unreadable record keeps its `raw_records` row with `parse_error` and `parse_error_normalizer` set, and the watermark moves on. A shrunk or replaced file, or an unexpected rewrite, becomes a `schema_drift` row plus a re-ingest of that source, logged in `ingest_jobs`. |
| A harness deletes its files | The source is marked `gone`. Our archive and tables keep everything. |
| Schema changes | Applied automatically at start, before any work (§8.4). This store is not `quest.json`, so the orchestrator's no-migration rule does not apply. |
| Host and mobile later | The process stays on the machine that holds the transcripts, the host. The mobile client talks only to the host's HTTP server. Nothing in the data layer is Electron-specific. Check that the Electron line we target bundles Node 24.15+ with `node:sqlite` and zstd. |
| Parent-bound liveness | A `parent-bound` process holds an inherited pipe from the server that started it, and exits when the pipe closes. No polling. |
| In tests | Jest testbeds run chronicle-llm IN-PROCESS against the testbed's home, so a test does not spawn a background process. e2e lanes run the real process, parent-bound. |

### 7.1 Live stdout

The server owns each child's stdout pipe. It appends every line to the stdout spool, which is cheap, and
which saves stdout for history for the first time. chronicle-llm reads the spool as a `stdout-spool`
source.

1. A stdout record creates or updates its row with `provisional = 1` and `origin = 'stdout'`. The spool file
   itself is deleted only under §6 step 6: every record sealed and the sealing commit checkpointed.
2. The matching transcript record (Claude: same `(session_id, uuid)`; tool calls by `tool_use` id)
   overwrites the final fields (`stop_reason`, the final usage, `parentUuid`, `promptId`) and sets
   `origin = 'both'`.
3. Facts only stdout has go to `llm_sessions` and `session_results`: the LAST `init` line's tool list, MCP
   server status, agents, skills and API key source (`llm_sessions.init_*_json`, `api_key_source`), and each
   `result` line's API duration, time to first token, permission denials, `terminal_reason`, and per-sub-agent
   stats.
4. Claude's `task_started` pairs a sub-agent to its spawning call the moment it starts.
5. A child that dies before its transcript catches up leaves provisional rows. They stay marked
   provisional, and the session's `end_state` says `killed`.

## 7A. Homes: one store per home, and what each home ingests

dungeonmaster runs against several homes on one machine, but every one of them reads the SAME harness
folders (`~/.claude/projects`, `~/.gemini/antigravity-cli`). So a store per home needs a SCOPE per home,
or every worktree and test run would import gigabytes of history it does not need.

| Home | Path | Who uses it | Ingest scope |
|---|---|---|---|
| Dogfood prod | `<repo>/.dungeonmaster/` | `npm run prod` in this repo | `all`: every session of every harness, full history |
| Published install | `~/.dungeonmaster/` | `dungeonmaster start` for every consumer | `all` |
| Dogfood dev | `<repo>/.dungeonmaster-dev/` | `npm session dev` in this repo | `registered`: only sessions this home's dispatcher spawned, and their sub-agents |
| Worktree | the worktree's own dev home, as its server already uses | dev and siege runs inside `worktrees/<name>` | `registered` |
| Tests and siegelense lanes | `/tmp/dm-e2e-<pid>`, `installTestbedCreateBroker` dirs, lane homes | e2e, integration tests, siege walkers | `registered`, with harness roots pointed at the test's own transcript folder |

What follows from that:

1. **Scope is a home setting, and it can be forced.** It lives in `meta` (`home_kind`, `ingest_scope`) and
   is set at first start from how the home was launched. `all` imports history and watches every session
   folder. `registered` watches only the sources the dispatcher registers, so a worktree's store holds only
   its own sessions. Two keys in the HOME config, `<home>/config.json`, override the inference:
   `chronicle.homeKind` (`'prod'` | `'published'` | `'dev'` | `'worktree'` | `'test'` | `'lane'`) and
   `chronicle.ingestScope` (`'all'` | `'registered'`). `meta` records what the process actually used.
2. **Harness roots are configurable, never hard-coded.** Each harness definition resolves its root in this
   order, first match wins:

   | Order | Claude Code | Antigravity |
   |---|---|---|
   | 1. environment | `CLAUDE_CONFIG_DIR` (Claude's own variable) | `DUNGEONMASTER_AGY_ROOT` |
   | 2. home config | `chronicle.harnessRoots.claudeCode` | `chronicle.harnessRoots.antigravity` |
   | 3. default | `~/.claude` | `~/.gemini/antigravity-cli` |

   A test passes its root in directly. Tests and e2e point the roots at their own fake-transcript folder,
   so no test ever reads or writes the real `~/.claude`.
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
- **A per-session assembler (core):** versioned, and it merges the candidates. Most rows come from several
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
| `permission-denied` | a permission rule, auto mode or the user refused the call | `permission-rule`, `auto-mode`, `user-rejected` |
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
   raw records, so rows cannot be re-derived one by one. chronicle-llm instead re-normalizes every session
   that version touched. In one transaction per session, it deletes the session's derived rows and replays its raw
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
   file per version. **`0001-initial` creates every table, index and view in `schema.md`** on an empty
   home, and sets `user_version = 1`. Every later file (`0002-…`) holds only its own DDL and data moves.
   An empty home runs all of them in order, so a fresh install and an upgraded one end in the same
   schema.
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
- Claude: spill files, workflow journals, `.meta.json`, and task-output files.
  Task-output files are capped to their first and last 1 MB, because one measured 3.1 GB.
- agy: CLI logs (for the version), message files and link files.
- The two spools.

**Claude's `~/.claude/file-history/` is NOT captured.** Its pre-edit copies are mostly covered by git and by
the Edit and Write patches already in `tool_results`, they spend storage-cap space, and they often hold
secrets (a copied `.env`). The transcript's `file-history-snapshot` and `file-history-delta` records are
archived raw like every other record, and no table reads them.

Some data exists only while it is being written: agy's `gen_metadata` system prompt shrinks once the
next row lands, agy's version lives only in logs that rotate, and Claude's `/tmp` task output is gone at
reboot. What chronicle-llm was not running to catch is lost, and no table records the gap (§16).

## 9. Reading

| Reader | Reads |
|---|---|
| Chat UI: open, live, reconnect | `timeline` rows for a quest's llm sessions after a cursor, in pages; each work item loads its newest page first |
| View Context | a window of `timeline` around one `tool_call_id` |
| Quest health | `tool_calls`, `tool_call_causes`, `tool_results.details_json` (an agent's ward runs), `work_items` (ward step verdicts from `quest.json` `wardResults[]`), `errors`, rollups (`scrolls/session-health-plan.md`). The headline cost is `usage` × `pricing`, not `cost-state`, which undercounts resumed sessions; `rollup_session.last_reported_cost_usd` keeps the harness's own figure for the cross-check. |
| Timeline | `events`, `tool_calls`, `turns`, with phases derived at query time |
| Command center rows | `rollup_quest` (computed at read time from `rollup_session` over a quest's sessions, a few hundred rows), `llm_sessions` where `end_state = 'running'`, with their `quest_ref` and `work_item_ref` joined to `quests` and `work_items`. Live context is the newest `usage.context_tokens` of each RUNNING session, read at query time. It is not stored in a rollup, because `end_state` changes with no new usage. `usage.context_limit` comes from a model-to-limit statics table, because Claude never reports it. |
| Session liveness | interactive Claude sessions from `~/.claude/sessions/<pid>.json` (a `session-registry` source), dispatched sessions from the dispatch spool |
| Command center global figures | `rollup_hour`, `server_errors`, `model_calls` |
| Trend graphs | `rollup_hour` and `usage` over any window. When a late link, an ownership move or a re-normalize changes a session's role or guild, the session goes on `rollup_dirty`, and a background job re-files its contribution to `rollup_hour`. |
| MCP tools | the server's HTTP API |
| The usage ledger (Claude quota) | `usage`, which retires its own scan of every transcript |
| `session-forensics` | deleted; chronicle-llm replaces it |
| Artifacts | `GET /api/blobs/:hash`, streamed and decompressed. Only allowlisted raster image types render inline. Everything else goes out as `text/plain` or `application/octet-stream` with `X-Content-Type-Options: nosniff`, `Content-Security-Policy: sandbox` and `Content-Disposition: attachment`. Requests with a foreign `Origin` or `Host` are refused, against DNS rebinding. No non-loopback bind until the API has authentication, which the mobile host will need. |
| Latency figures | Claude's p50/p95 and requests in flight exist only on stdout, so they cover dispatched sessions only, never interactive sessions |

### 9.1 The query module: snake_case in, camelCase out

- **One module translates.** `@dungeonmaster/chronicle-llm` exports the query module that every reader
  uses: the server, the CLI, Electron. No other code writes SQL.
- **Each query has a contract.** Each query returns objects parsed by a zod contract in
  `@dungeonmaster/shared/contracts`, with `camelCase` properties. That contract is the type the server
  sends and the web and MCP receive.
- **Rows become contracts in one place.** `tool_call_ref` becomes `toolCallId` (its natural key),
  `started_at` becomes `startedAt` as an ISO string, and so on. The mapping lives in the query module's
  transformers.
- **What goes over the wire:** integer ids never leave the database. Every id on the wire is a natural
  key.

**No ORM: a thin typed module over `node:sqlite`.** It was decided by research and a micro-benchmark,
in `tmp/orm-research-sandbox/`:

| Option | Verdict |
|---|---|
| Drizzle | Rejected. Its `node:sqlite` driver exists only in a 1.0 release candidate whose API breaks in every RC. Its `snake_case` setting was silently ignored in rc.4. Its migrator wants generated SQL folders shipped in the package, and drizzle-kit is 99.6 MB. Bulk inserts ran 5–7× slower than raw. |
| Kysely | Workable, not chosen. There is no official `node:sqlite` dialect, only a single-author community one. A hand-written `Database` interface for 53 tables would duplicate the zod contracts. Inserts ran 1.3–2× slower. |
| **No ORM** | **Chosen.** No dependency. It fits the repo as it is, and it is the fastest: about 170–200k rows/s on both Node 22 and 24. |

The shape of the no-ORM module:
- one gateway wrapper over `node:sqlite`
- a broker caching one `StatementSync` per named query
- a snake→camel row transformer feeding each zod contract
- the migration runner, about 40 lines: sorted `migrations/NNNN-*.ts`, one transaction each, tracked in
  `schema_migrations`.

The proxy fakes one small `DatabaseSync` surface for unit tests. Integration tests use real SQLite in a
testbed.

**A trap:** Node cannot bind booleans before 24.21, so the transformer writes them as 0 and 1 itself.

## 10. Testing

| Level | What proves it |
|---|---|
| Each normalizer | fixture records per harness version, giving exact rows |
| The pipeline | integration tests with `installTestbedCreateBroker`: incremental reads, partial last lines, a call and its result in different batches, file replacement, agy rows updating, crash between batch and commit |
| Parity with today | **shadow mode:** for every quest on disk, the chat entries built from chronicle-llm equal what `chatHistoryReplayBroker` emits today, entry for entry, before the old path is deleted |
| Reference quests | Claude deletes transcripts after 30 days, so the two reference quests are FROZEN at `tmp/chronicle-reference/`, each with its quest folder and a `claude-projects/` tree: `1918a5ee-8bce-4f3d-a4ab-f7ff51f45878` (40 sessions, 52 files, 48.8 MB) and `c8171a64-b937-47ec-85e0-a86767976d8b` (5 sessions, 328 files including sub-agents, 110.8 MB). Tests point their harness root at the frozen tree, never at `~/.claude`. |
| Real-quest counts | the expected counts for quest 1918a5ee are recomputed from the frozen copy with the census script `tmp/q1918-failures-scan.py`. The earlier figures (860 tool results, 98 `is_error` failures, 18 hidden ward reds, 19 `Bash(sed:*)` denials) came from the quest BEFORE it resumed, when it had 28 sessions; the frozen copy has 40, so those numbers are not the test's expectation. |
| Usage | per-quest token totals equal the transcripts' own `cost-state` totals, read by the test from the raw archive |
| The funnel | the existing streaming/replay e2e pair, plus reconnect-from-cursor e2e |
| Performance | the §12 budgets, re-measured on the frozen c8171a64 quest |

## 11. Rollout, by phase

Each phase ships on its own and gets its own round of manual testing (`manual-test-plan.md`), first on
Node 22.17, then again on Node 24.

| Phase | Delivers | No server or web work beyond | Done when |
|---|---|---|---|
| 0 (independent) | Standalone fixes needing no new store: the web upsert without map copying, batched replay frames, the watcher reading a sub-agent's first line only, draining before stopping, the stale lines in `packages/orchestrator/CLAUDE.md`, the three old quests loading again, `engines >=22.16` | | the c8171a64 measurements repeat faster |
| 1 | The parsers and the tables. `@dungeonmaster/chronicle-llm`, `-claude-code` and `-antigravity`, built together: the process and its lock, migration `0001-initial`, the readers, both normalizers, the assembler, the raw archive and sealer, redaction, the drift log, the storage cap and eviction, the import (first run, then rolling per harness), the stdout and dispatch spools, the quest mirror, `dungeonmaster chronicle status`, and the parity script against today's replay. | starting and stopping the process with the server; the server appending to the two spools; `--session-id` on fresh Claude spawns | the tables hold real data from both harnesses and pass the data quality review; the parity check and the quest 1918a5ee counts pass |
| 1b | The migration test (§11.1): migration `0002` adds `messages.effort`, both normalizers bump, and a re-normalize from the archive fills it | | the drift rows for reasoning effort resolve, and the column holds the right values for both harnesses |
| 2 | Server reads: the query module and contracts, the reader worker thread, the change-feed socket, the health endpoints and right panel, the drill-down, View Context, `get-quest-health`. Retires `usage-ledger.json` and its transcript scanner: the quota display and the dispatch hold read `usage` instead (`followup-home-state-to-db.md`). | | the session-health plan's acceptance |
| 3 | The chat UI reads from chronicle-llm. The old replay and emit paths are deleted (§4.1). | | live, reload and reconnect match entry for entry; the e2e pair and reconnect tests pass |
| 4 | The timeline and the command center's figures | | figures cross-check against the transcripts' own `cost-state` (`rollup_session.last_reported_cost_usd`) |
| 5 | First-party sources: command output, server errors, local-model calls. Retires `rate-limits.json` and `rate-limits-history.jsonl`: the CLI appends each status-line reading to `<home>/data/spool/rate-limits.jsonl`, chronicle-llm stores it in `rate_limit_samples`, and the dispatch hold reads the newest sample. | | `err/1h` and backend rates match |
| 6 | The next harness, with zero edits to `@dungeonmaster/chronicle-llm` | | its fixtures pass |

### 11.1 The deliberate drift and migration test

**One field is left untranslated on purpose in phase 1, so we can watch the drift machinery catch it,
and then prove a migration can add a column to a live store.** The field is **reasoning effort**,
chosen because:
- **Both harnesses produce it.** Claude writes `effort` and `perTurnEffort` on assistant records:
  415,632 and 321,322 records in the census. agy puts it as the suffix of `executor_metadata` field
  `10.1.28` on every turn, as in `gemini-3.8-flash-medium`.
- **Nothing in phases 1 to 3 needs it.** Health, linking and the chat UI do not read effort, so holding it
  back breaks nothing.
- **It belongs on one obvious column,** `messages.effort`, so the follow-up is a small migration.
- **It is easy to check by eye** against the raw records: `medium`, `high`, `xhigh`, `low`.

| Step | What happens | What the tester checks |
|---|---|---|
| Phase 1 | Neither normalizer declares the field, and `messages.effort` does not exist in `0001-initial`. agy's model name comes from `gen_metadata` field `1.19` instead of `10.1.28`. | `schema_observations` lists `effort` and `perTurnEffort` (Claude) and the `executor_metadata` path (agy) with `parsed = 0`. `schema_drift` holds `new-path` rows for them. |
| Phase 1b | Migration `0002` adds `messages.effort`. The Claude Code and Antigravity normalizers each bump their version and declare the field. | On start: `user_version` is 2, `schema_migrations` records `0002`, readers waited while `schema_state` was `migrating`, and only sessions touched by the bumped normalizers were re-normalized from the archive (`ingest_jobs` cause `reingest:normalizer-bump`). `messages.effort` matches the raw records. Acknowledging the drift rows clears them, and no new drift appears. |

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
   TEXT id is stored ONCE, as a unique `natural_key` on `llm_sessions`, `messages`, `events` and `tool_calls`.
   Child tables reference the integers. The TEXT ids in `schema.md` stay as the natural keys. The
   prototype repeated long TEXT ids in every child row and every autoindex.
2. **No stored previews of message or tool text.** The prototype stored a 2,000-character preview three
   times, in `events`, `content_blocks` and `tool_results`. That was 887 MB, 32% of the database. Now
   the full text is stored ONCE, inline up to 4 KB in `content_blocks.text` and `tool_results.text`, in a
   blob above that. Previews are computed at read time with `substr()`. The few tables with no other
   text column (`hook_runs`, `attachments` and similar) keep a preview capped at 300 characters.
3. **Small artifacts go into the archive's segments, not files.** 43k artifact files waste 4 KB blocks.
   Only artifacts over 64 KB get their own file.
4. **Readers never hold a read transaction across ticks.** One held open let the WAL grow to 1.07 GB and
   slowed the writer from 19 s to 28 s.
5. **Archive chunks carry a stored length.** Segments are shared across sources, so resuming goes
   through `raw_records(source_ref, sub_table, pos, revision)`.
6. **Claude sub-agent session ids include their parent session:** `claude-code:<sessionId>/<agentId>`. The
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

## 13. Storage cap, secrets and capture: decided (2026-10-01)

### 13.1 The storage cap

| Rule | Detail |
|---|---|
| Default | 4 GB per home, covering `chronicle.db`, the archive and the blobs together |
| Setting | `chronicle.maxStorageBytes` in the HOME config, `<home>/config.json`. That is the machine-level config, separate from a repo's `.dungeonmaster.json`: `~/.dungeonmaster/config.json` for the published install, `<repo>/.dungeonmaster/config.json` for dogfood. It already exists and holds `guilds`, so this adds one key to its contract. |
| Who writes the default | `dungeonmaster init` writes `chronicle.maxStorageBytes: 4294967296` into the home config if the key is absent. It never overwrites a value the user set. |
| Per home | each home has its own cap. Dogfood prod and the published install both keep full stores (§7A), because new work is churned and tested locally before it is published. |

**What 4 GB holds.** The benchmark's per-table sizes give these estimates, which the next prototype pass
measures:
- **Full detail:** about 2–2.5 GB a month at today's usage, after the §12.1 fixes. So 4 GB holds roughly
  6–8 weeks of full detail.
- **Trend data:** roughly 100 MB a month. That is sessions, usage, tool calls with causes and timing,
  errors, and rollups. It lasts years.

**Eviction, oldest first, when a home is over its cap:**

| Tier | Dropped | Kept |
|---|---|---|
| 1 | raw archive records and artifacts whose harness file still exists, so they can be re-read | everything derived |
| 2 | for the oldest sessions: full text (`content_blocks.text`, `tool_results.text`), `events`, attachments, and their archive and artifacts | `llm_sessions`, `messages`, `usage`, `tool_calls` and `tool_call_causes` (names, status, timing), `errors`, rollups |
| 3 | for the oldest sessions: per-call rows | `rollup_session`, `rollup_hour`, `llm_sessions`, `usage` |

- **Never evicted:** `llm_sessions`, `usage` and the rollups, which are what the trend graphs need.
- **Each session's `detail_state`** is `full`, `summarised` or `rolled-up`, so the UI can say "history
  trimmed".
- **A session evicted past tier 1 cannot be re-normalized,** because its raw records are gone.
- **Eviction runs as a low-priority job**, logged in `ingest_jobs` with cause `evict`: one row per tier and
  source or session dropped, carrying `tier`, `bytes_freed` and `source_ref` (tier 1) or `session_ref`
  (tiers 2 and 3).
- **Evicting frees disk through segment compaction.** Evicted records sit inside shared 1 MB chunks, so
  each segment counts its `evicted_bytes`. Once that passes half its stored bytes, a low-priority job
  copies the live records into a new segment, commits the new pointers in one transaction, then deletes
  the old file.
- **Status reports the space used per tier,** from those `ingest_jobs` rows and `meta.storage_bytes_by_tier`.

### 13.2 Secrets are never stored

**One step, no process around it.** Before ANYTHING is written (`raw_tail`, the archive, any table, any
blob), the record's text is scanned and every secret is replaced in place with a plain marker. There is
no deny-list, no purge command, no scanner re-runs, and no tables for any of it.

| Rule | Detail |
|---|---|
| Marker | `REDACTED-SECRET-<kind>`, e.g. `REDACTED-SECRET-api-key`. Letters, digits and hyphens only, so it is safe everywhere: Markdown reads nothing as emphasis, a link, a table cell or HTML; JSON needs no escaping; grep and the shell need no quoting. |
| Kinds | `api-key` (known provider prefixes and high-entropy assignments), `token`, `private-key` (the whole PEM block), `password` (password, secret and token assignments in env, JSON and YAML shapes), `auth-header` (`Authorization` and `Cookie` values), `connection-string` (URLs with credentials) |
| JSON safety | Patterns stop at a quote or a backslash, so a replacement inside a JSON string never breaks the line. A `.env` file read into a tool result or a spill file gets the same treatment as any other text: its values are replaced, its keys kept. |
| No value hash | The marker carries no hash of the secret, because a hash of a short secret can be brute-forced |
| Change detection | `content_hash` hashes the ORIGINAL bytes, so a rewritten source is still noticed. The stored record is the redacted one. |
| Visibility | `raw_records.redactions` counts the replacements in each record, so the data quality review can find them |
| Files | data directories `0700`, files `0600`. Agents get no `Read` of `<home>/data/**`. |
| Trade-off, accepted | A secret the patterns miss stays stored. An improved pattern protects only data stored after it ships; old rows are not rescanned. |

### 13.3 Capture while dungeonmaster is stopped

There is no background service. What matters is transcripts and child stdout, and neither is lost:
- **Transcripts** stay on disk, and chronicle-llm reads them when it next starts. That holds within
  Claude's 30-day window, which is why status warns once the last ingest is 20 or more days old.
- **Child stdout** only exists while the dungeonmaster server runs the child. The server writes the
  stdout spool whether or not chronicle-llm is up.

What is lost while stopped is only side data: agy's shrinking system-prompt snapshots, its rotating
version logs, and Claude's `/tmp` task output after a reboot. It is lost without a record; no table tracks
the gap (§16).

## 14. Settled while writing this

| Question | Answer | Evidence |
|---|---|---|
| Does Claude Code rewrite transcript lines in place? | No. It is append-only, and writes a message's lines once the message ends. | §5.1; the 100 ms probe in `tmp/rewrite-probe.py` |
| Where is Antigravity's version? | Only in its rotating CLI logs, so chronicle-llm copies it into `harness_versions` | `field-maps/antigravity.md` |
| `session-forensics` | Deleted once chronicle-llm replaces it. One transcript parser, not two. | §9 |
| The first-run window | Kept at 7 days. A full 5 GB import takes about 101 s, so the blocking part is seconds and full history follows within minutes. | §12 |
| Can test homes keep off the real `~/.claude`? | Yes. `locationsClaudeConfigDirFindBroker` (shared) honours `CLAUDE_CONFIG_DIR`, and the jest setup sandboxes `HOME` for the fake Claude CLI. chronicle-llm resolves Claude's root through that broker. One fix comes with it: `claudeProjectPathEncoderTransformer` hard-codes `<home>/.claude/projects` and ignores `CLAUDE_CONFIG_DIR`. | `packages/shared/src/brokers/locations/claude-config-dir-find/`, `packages/shared/src/transformers/claude-project-path-encoder/` |
| What do tests read once Claude has deleted the reference transcripts? | The frozen copies at `tmp/chronicle-reference/` (`1918a5ee-…`: 40 sessions, 52 files, 48.8 MB; `c8171a64-…`: 5 sessions, 328 files, 110.8 MB), each with its quest folder and `claude-projects/` tree. Expected counts are recomputed from them with `tmp/q1918-failures-scan.py`. | §10 |

## 15. Review applied (2026-10-01)

A fresh Opus reviewer read all of these docs. What changed:

| Review point | Change | Where |
|---|---|---|
| A cursor on `seq` misses rows that change behind it | change feed: `change_seq` on every row, `tombstones`, socket notify | §4.1, §7 |
| Segment files cannot join a transaction | `raw_tail` in the database, a sealer, `committed_bytes`, write-then-rename blobs | §6 |
| The chat UI needs full text, not 200-character previews | text inline up to 4 KB, a blob above that, previews computed at read time | `schema.md` |
| Resumed copies double-count tool calls | `tool_calls` and `tool_results` keyed globally; `events.native_uuid` | §4.2 |
| Ownership depended on ingest order | order-independent merge rules | §4.1 |
| Session links had no durable write path | the dispatch spool, a first-party source | §4.2 |
| Mixed dungeonmaster versions share one home | version handshake, `reader_compat`, a query module, additive-only within a compat level | §7 |
| Late parent links break foreign keys and rollups | `root_session_id`, no cross-source foreign keys, quest rollups computed at read time | §4.2, §9 |
| The docs contradicted each other | one sub-agent session id recipe, one cause vocabulary, real integer-key DDL, aligned preview sizes, file names fixed | §8.1B, `schema.md`, field maps |
| Source replacement detection was wrong for small files | the `{byteOffset, lineNo, inode, size, headLen}` watermark; partial-line timeout; never `immutable=1` | §5.1 |
| Cause classification sat inside frozen normalizers | a separately versioned classifier and `tool_call_causes` | §8.1A |
| Synchronous reads would block the API | a reader worker thread, paged endpoints | §7 |
| The history worker was a second writer | the worker only prepares batches; one connection commits; 50 ms commit cap | §7 |
| WAL growth | `journal_size_limit`, idle checkpoints | §7 |
| inotify instance limits | non-recursive, idle-expiring watches, a stat fallback | §5.1 |
| Data that exists only while it is written | capture every side file raw from day one, Claude's file-history excepted (§16) | §8.5 |
| Migration snapshots stall large databases | rebuild from the archive; snapshots only for destructive migrations | §8.4 |
| Re-normalizing by row cannot work | re-normalize per session; per-record normalizer plus per-session assembler | §8.1, §8.2 |
| Drift-log noise | `opaqueSubtrees`, a shape cache | §8.3 |
| Gaps the health feature and command center hit | ward verdicts (`tool_results.details_json` and the `work_items` mirror, §16), session liveness, a model context-limit table, stdout-only latency, `chronicle status` | §7, §9 |
| Blob route safety | content-type allowlist and headers, Origin and Host checks, loopback only | §9 |
| Process hosting in tests | in-process mode for jest, parent-bound by inherited pipe, a degraded mode | §7 |
| `rate_limit_samples` key allowed duplicates | keyed on `raw_id` | `schema.md` |

Rejected: the suggestion to defer normalizing `attachments`, `hook_runs`, interventions,
agent messages, `compactions` and stdout `init` facts until a feature reads them. The user
asked for everything valuable to be parsed now, so no new feature needs a re-parse. The raw capture from
day one (§8.5) is kept either way. Claude's file-history was later dropped entirely (§16).

The user decided secrets, capture while stopped, and the storage cap (§13).

## 16. Tables trimmed (2026-10-01)

The user approved trimming the schema to the tables a reader needs. Before: each fact below had a table of
its own. After: five tables are cut and the rest merged into a table that already existed.

| Table | Cut or merged | Where its data went | What is lost |
|---|---|---|---|
| `session_links` | cut | `llm_sessions.quest_ref`, `work_item_ref`, `linked_by` (`'dispatcher'`, `'inherited'`, `'quest-file'`, `'inferred'`), `linked_at`; guild from `quests.guild_id`, role and step from `work_items` | nothing; a sub-agent now carries its own link instead of joining through its root |
| `file_backups` | cut | nowhere: `~/.claude/file-history/` side files are no longer archived; the `file-history-*` transcript records stay in the raw archive only | the harness's pre-edit copies. Git and the Edit and Write patches cover most of them, they cost cap space, and they often hold secrets. |
| `ward_runs` | cut | an agent's ward run through Bash: `tool_results.details_json` `ward.{runId, exitCode, checks, slowTestsOnly}`; a ward step: `work_items.ward_*` from `quest.json` `wardResults[]` | a ward run's own duration and command as a column (still in the tool call and result) |
| `capture_gaps` | cut | nowhere | the record of side data missed while chronicle-llm was stopped, and of watch fallbacks |
| `cost_snapshots` | cut | the headline cost is `usage` × `pricing`; `rollup_session.last_reported_cost_usd` and `last_reported_at` keep the harness's newest figure for the cross-check | each snapshot's history, and the cumulative API, tool and wall durations, line counts and per-model usage of Claude `cost-state` (still in the raw archive; stdout `result` lines keep theirs in `session_results`) |
| `attachment_parts` | merged | `attachments`: one row per part, `part_idx` and `part_kind`, natural key plus `:<idx>` | nothing |
| `evictions` | merged | `ingest_jobs` with cause `'evict'`: `tier`, `bytes_freed`, `session_ref` | nothing |
| `raw_revisions` | merged | `raw_records`: the rows of one position are linked by `(source_ref, sub_table, pos, revision)`; `revision_expected` on the newer row | the separate `seen_at` (the newer row's `ingested_at` stands in) |
| `parse_errors` | merged | `raw_records.parse_error` and `parse_error_normalizer` | more than one failing normalizer per record (only the last is kept) |
| `session_inits` | merged | `llm_sessions`: `init_tools_json`, `init_mcp_servers_json`, `init_agents_json`, `init_skills_json`, `api_key_source`; the version in `harness_version_last`, the mode in `permission_mode` | every init line but the LAST one of a session (still in the raw archive) |
| `agent_messages` | merged | `events` kind `agent-message`: one ARRIVAL row in the recipient session, subtype the origin kind, body in `content_blocks`, `is_meta` for hidden, `details_json` `{peerSessionKey, messageId, priority, read, deliveryId}`, `tool_call_ref` the send; the SEND stays the sender's tool call; `events.link_key` joins them (§4.2) | a message whose arrival was never recorded has no row of its own (the send's tool call still holds it); about 7% of Claude sends |
| `interventions` | merged | `events` kind `intervention`, subtype `enqueue`, `dequeue`, `remove`, `pop-all`, `interrupt`, `user-rejected`, `permission-denied`, `mode-change`, `slash-command`, `kill-agents` or `hook-block`; source, reference id and reason in `details_json`. A message arriving (human, peer, coordinator, task-notification) is its arrival event only, never an intervention | the `steer` kind: a human mid-turn message is a `user-message` event and an agent's is an `agent-message` event |
