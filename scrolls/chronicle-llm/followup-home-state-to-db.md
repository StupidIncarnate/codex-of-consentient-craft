# Follow-up: move dungeonmaster's home files into databases

Status: follow-up proposal, 2026-10-01. Not part of chronicle-llm's first phases, except the two
retirements marked "with chronicle-llm" below.

## Why

The home folder (`~/.dungeonmaster`, or `<repo>/.dungeonmaster` in dogfood) holds a mix of JSON and JSONL
files. Each exists only because there was no database:
- **Change notification is homemade.** An append-only outbox file stands in for a change feed.
- **Writes leak temp files.** Atomic rewrites are temp-file-plus-rename, and they leave files behind:
  about 25 `usage-ledger.json.tmp.*` files sit in `~/.dungeonmaster` today.
- **A second transcript reader exists** (the usage ledger), the kind of reader that caused the 5.1 GB
  MCP incident.

Once chronicle-llm brings SQLite, each home can be one `data/` folder holding databases, with no loose
state files. That also isolates the homes from each other.

## What each file is, and where it goes

| File | What it is | Writers | Readers | Fate |
|---|---|---|---|---|
| `usage-ledger.json` (+ leaked `.tmp.*` files) | Claude quota accounting: hourly token buckets, built by scanning every transcript | the server's rate-limits poller | the dispatch hold, the quota display | **Retired with chronicle-llm, phase 2.** `usage` holds the same numbers per API message, deduplicated correctly. Its scanner, the second transcript reader, is deleted. |
| `rate-limits.json` | Claude's latest rate-limit reading from the status line, rewritten at most every 5 s | the CLI (status line) | the dispatch hold (`dispatchHoldEvaluateBroker`) | **Retired with chronicle-llm, phase 5.** The CLI appends each reading to `<home>/data/spool/rate-limits.jsonl`, and chronicle-llm stores it in `rate_limit_samples`. The hold reads the newest sample. |
| `rate-limits-history.jsonl` | append-only history of those readings, kept for trend analysis | the CLI | nothing yet | **Retired with chronicle-llm, phase 5:** that history is `rate_limit_samples`. |
| `event-outbox.jsonl` | a homemade change feed. `quest.json` is written by several processes (the server and every agent's MCP child), so each write appends `{questId, timestamp}` here and the other processes tail it. Truncated on server boot. | every process that writes a quest | the server's watchers and queue; chronicle-llm's quest mirror in phase 1 | **Follow-up:** replaced by a change table in `state.db` |
| `dispatch-state.json` | play or pause, plus the rate-limit hold | the server | the dispatcher | **Follow-up:** one row in `state.db` |
| `guilds/<id>/quests/<folder>/quest.json`, `ward-results/`, `riftcarver-results/`, `planned-work/` | the quests themselves | the server, MCP children | everything | **Follow-up:** tables in `state.db` |
| `config.json` | guilds, `chronicle.*` settings | the user, `init`, the server | everything | **Stays a file.** It is config a person edits by hand, and it is read before any database exists. |
| `siegelense/` | lane registry and instance homes | siegelense | siegelense | out of scope |

## Why a second database, and not `chronicle.db`

| `chronicle.db` | `state.db` (proposed) |
|---|---|
| DERIVED: rebuildable from the raw archive at any time | PRIMARY: quests, dispatch state and guilds exist nowhere else |
| one writer, the chronicle-llm process | many writers: the server, every MCP child, the CLI. Each write is tiny, and SQLite queues the writers (WAL, `busy_timeout`). |
| ingest batches hold the write lock for up to 50 ms | a quest write must never wait behind an ingest batch |

Putting primary data in a store whose recovery path is "wipe and rebuild" would lose it. So app state
gets its own small database. chronicle-llm reads `state.db` read-only: its quest mirror then reads
`state.db` changes instead of tailing the outbox.

## The shape

- **Location:** `<home>/data/state.db`, WAL mode, with its own numbered migrations. These are the same
  runner and rules as chronicle-llm's §8.4, and the orchestrator's no-migration rule is revisited here.
- **Tables:** `guilds`, `quests`, `work_items`, `operations`, `ward_results`, `riftcarver_results`,
  `planned_work`, `dispatch_state`, and `changes` (`change_seq`, table, natural key, at), which replaces
  the outbox.
- **Readers learn of changes** through `PRAGMA data_version` plus `changes` rows past their cursor. This is
  the same mechanism as chronicle-llm.
- **Agents stop reading `quest.json` directly.** The dogfood home lives in the repo so Claude can Read
  quest files. After the move, agents read through the MCP tools, or through a read-only
  `dungeonmaster state query`, the twin of `chronicle query`.

## Open questions for when this is picked up

1. **Migrating existing quests:** a one-time import of every `quest.json` into `state.db` on first start,
   keeping the files as a backup for one release?
2. **Writers in MCP children:** each MCP child opens `state.db` for writing only while a tool call runs,
   never holding a connection or a watcher open. This is the poller incident's rule.
3. **A human-readable view:** `dungeonmaster quest show <id>` prints what `quest.json` shows today.
