# chronicle-llm: manual test plan

Status: draft, 2026-10-01. Nothing here is built yet. This plan follows the phases in `design.md` §11 and the
schema as trimmed in `design.md` §16: `schema.md` lists 40 tables and 2 views, and the twelve tables §16 cut
(`session_links`, `file_backups`, `ward_runs`, `capture_gaps`, `cost_snapshots`, `attachment_parts`, `evictions`,
`raw_revisions`, `parse_errors`, `session_inits`, `agent_messages`, `interventions`) no longer exist. Every case
checks the place that data lives now, and a case for a cut table either moves with its data or asserts the data is
NOT captured.

This plan is for a person, or an agent driving `dungeonmaster siegelense` or a real browser. They exercise the
REAL system with REAL harnesses: real `claude` and `agy` sessions, real files on disk, real restarts and real
crashes. Manual testing finds what written tests miss. Some cases repeat an integration or e2e test on purpose.
Each case says whether it is also automatable.

## Contents

| Section | Area codes |
|---|---|
| Phase 1: the parsers and the tables | PRC, SCH, IMP, LIV, INT, AGY, OUT, MSG, QMR, SRC, DRF, CRA, HOM, VER, CAP, SEC, PRF, ENV, PAR, and the table walk |
| Phase 1-DQ: the data quality review | DQ checklist |
| Phase 1b: the reasoning-effort migration | EFF |
| Phase 2: server reads, quest health, View Context, `get-quest-health`, the usage-ledger retirement | SRV, HLT, API, LDG |
| Phase 3: the chat UI reads from chronicle-llm | FUN, UIS, PRF-05 |
| Phase 4: the timeline and the command center | TL, CC |
| Phase 5: first-party sources, the rate-limits retirement | FP, RLM |
| Node versions | NODE |
| Appendix A, B, C | read-only queries; recipes for sandboxes, crashes, file replacement, inotify, disk full; gaps in the design, each marked resolved or still open |

## How to use this plan

### The verdict

- **Phases 1 and 1b have no server endpoints and no web changes.** Their verdict is the tables in
  `<home>/data/chronicle.db` (opened read-only), the archive files, `dungeonmaster chronicle status`, and the
  harness files on disk. A case passes only when the tables agree with the harness files.
- **From phase 2 on, the browser UI is the verdict** (repo `CLAUDE.md`, "Verification Standards"). A case fails if
  any UI surface broke during it: a blank panel, a frozen spinner, missing rows, a wrong route or a console
  error. It fails even when the tables are right. The tables, the API and the logs explain a failure; they never
  pass a case on their own.
- **Drive the original repro yourself.** Tests going green is not enough. Open the same quest, the same view, and
  watch the expected result happen.

### Every case has

| Field | Meaning |
|---|---|
| ID | `CL-<AREA>-<n>`. The area code is unique across the plan. |
| Node | `both`: run on Node 22.17, then again after the upgrade to Node 24. `22.17`: once is enough. |
| Severity | If it fails. `blocker`: data loss, double counting, a wrong quest link, a stored secret, a broken UI, a process that will not start. `major`: a missed budget, a wrong figure, a late link, a missing row. `minor`: wording, a status field, a cosmetic gap. |
| Automatable | `unit`, `integration`, `e2e`, or `manual-only`. Several can apply. |
| Setup | The environment from the next section, plus exact commands. |
| Steps | What to do, in order. |
| Expect | What you observe when it works: a table row, a status line, a file on disk, or the UI. |
| Failure looks like | What you see when it does not. A short case leaves it out when failure is simply anything other than its Expect. |

### Node rounds

Each phase runs twice (design §3, §11): first on Node 22.17, then after an upgrade to Node 24.

1. Run the phase's cases on Node 22.17. Record each result.
2. Upgrade Node to 24. Run every case marked `both` again, plus `CL-NODE-*`.
3. A case that passes on one version and fails on the other is a blocker.

Checks that apply to every `both` case on each round:
- Boolean columns hold only integer 0 and 1 (Appendix A.20). Node cannot bind booleans before 24.21, so the
  query module writes 0 and 1 itself.
- `node:sqlite` prints no experimental warning on Node 22 (it is suppressed).

### Before anything else: the reference data is frozen

Claude deletes transcripts after 30 days, so the two reference quests this plan measures against are FROZEN at
`tmp/chronicle-reference/` (design §10, §14), each with its quest folder and a `claude-projects/` tree:

| Quest | Frozen copy | Used by |
|---|---|---|
| `1918a5ee-8bce-4f3d-a4ab-f7ff51f45878` | `tmp/chronicle-reference/1918a5ee-.../` with `quest-folder/` and `claude-projects/` (40 sessions, 52 files, 48.8 MB) | the real-quest counts (`CL-PAR-02`), quest health (`CL-HLT-*`), the timeline (`CL-TL-*`) |
| `c8171a64-b937-47ec-85e0-a86767976d8b` | `tmp/chronicle-reference/c8171a64-.../` with `quest-folder/` and `claude-projects/` (5 sessions, 328 files including sub-agents, 110.8 MB) | parity, the open-quest budget (`CL-PRF-05`, `CL-FUN-09`) |

Cases point their harness root at the frozen `claude-projects/` tree (or copy it into the sandbox, Appendix B.2),
never at `~/.claude`.

**Expected counts are derived from the frozen copy, never remembered.** Quest `1918a5ee` kept running after the
first census, so the frozen copy holds more sessions than the census counted:
1. Check the frozen trees are present and unchanged (`du -sb`, file counts against the figures above). Never
   write into them.
2. Re-run `tmp/q1918-failures-scan.py` and the survey, health and timeline scripts beside it against the frozen
   copy. The scan reads `quest-1918-map.json` from its working directory, so re-point that map's transcript paths
   at the frozen `claude-projects/` tree first. Store the output next to the copy as `expected.json`.
3. Every case that compares against the census compares against `expected.json`: "the counts the census script
   gives on the frozen copy". The earlier figures (860 tool results, 98 `is_error` failures, 18 hidden ward reds,
   19 `Bash(sed:*)` denials) came from the quest BEFORE it resumed, when it had 28 sessions. They are not an
   expectation.

## Test environments

Never run a destructive step against the real `~/.claude`, `~/.gemini` or a real dungeonmaster home. Every crash,
truncation, deletion, cap and disk-full case runs in ENV-S or ENV-VM.

| Env | What it is | Home kind / scope | Use for |
|---|---|---|---|
| ENV-S | Sandbox. A fake `HOME` under `/tmp` holding COPIES of the harness data, plus real `claude` and `agy` binaries | `published` / `all`, `persistent` | everything destructive, first runs, imports of copied corpora |
| ENV-D | Dogfood dev: `npm run dev` in this repo | `dev` / `registered`, `parent-bound` | live ingest of dispatched quests against the real harness roots, read-only |
| ENV-P | Dogfood prod: `npm run build && npm run prod` | `prod` / `all`, `persistent` | observation only, never a destructive step |
| ENV-W | A worktree from `mcp__dungeonmaster__create-worktree`, running its own dev server | `worktree` / `registered` | home isolation |
| ENV-L | A siegelense lane: `dungeonmaster siegelense start --spec stack` (fake Claude CLI) | `lane` / `registered` | the automatable UI checks |
| ENV-VM | A throwaway VM with this repo checked out | any | power cuts, inotify limits, disk full |

### ENV-S setup

```bash
export T=$(mktemp -d /tmp/dm-manual-XXXXXX) && chmod 700 "$T"
export SH="$T/home" && mkdir -p "$SH/.claude" "$SH/.gemini"

# Credentials, so the real harnesses can run. Delete $T when finished.
cp -a ~/.claude/.credentials.json ~/.claude/settings.json "$SH/.claude/"
cp -a ~/.claude.json "$SH/" 2>/dev/null || true
# agy: copy config and auth only, never conversations/, brain/, history.jsonl, log/ or scratch/
cp -a ~/.gemini/config "$SH/.gemini/"
mkdir -p "$SH/.gemini/antigravity-cli"
for f in settings.json installation_id bin builtin mcp; do cp -a ~/.gemini/antigravity-cli/$f "$SH/.gemini/antigravity-cli/"; done

# Prove both harnesses run inside the sandbox before going further
HOME="$SH" claude -p 'reply ok'
HOME="$SH" agy -p 'reply ok'
ls "$SH/.claude/projects" "$SH/.gemini/antigravity-cli/conversations"   # both now hold one new session
```

**Corpus copies are real copies, never hardlinks.** `cp -al` shares inodes, so a truncate test would cut the
real transcript. Use `cp -a`:

```bash
cp -a ~/.claude/projects "$SH/.claude/projects"                     # the full Claude corpus, about 5 GB
cp -a ~/.gemini/antigravity-cli/{conversations,brain,conversation_summaries.db,history.jsonl,log} \
      "$SH/.gemini/antigravity-cli/"                                 # the agy corpus
```

Start dungeonmaster in the sandbox from a scratch consumer repo (`npm run check:consumer -- --keep` leaves one
under `/tmp`), never with `init` in this repo:

```bash
cd /tmp/<kept-consumer-dir>
HOME="$SH" dungeonmaster init          # writes $SH/.dungeonmaster/config.json
HOME="$SH" DUNGEONMASTER_PORT=4900 dungeonmaster start
export DM_HOME="$SH/.dungeonmaster" DB="$SH/.dungeonmaster/data/chronicle.db"
```

The fake `HOME` makes `~/.dungeonmaster`, `~/.claude` and `~/.gemini` all resolve inside the sandbox, so the home
is inferred to be a published install. Do not rely on the inference. Two keys in `$SH/.dungeonmaster/config.json`
force it (design §7A rule 1), and `meta` records what the process actually used:

```json
{ "chronicle": { "homeKind": "published", "ingestScope": "all" } }
```

Harness roots are never hard-coded either (design §7A rule 2). Each resolves in this order, first match wins:

| Order | Claude Code | Antigravity |
|---|---|---|
| 1. environment | `CLAUDE_CONFIG_DIR` | `DUNGEONMASTER_AGY_ROOT` |
| 2. home config | `chronicle.harnessRoots.claudeCode` | `chronicle.harnessRoots.antigravity` |
| 3. default | `~/.claude` | `~/.gemini/antigravity-cli` |

In the sandbox the defaults land inside `$SH` because `HOME` is faked. A case that must prove an override sets the
environment variable or the config key, and `CL-HOM-06` and `CL-HOM-07` check both.

Two things still leak out of the sandbox: Claude's task output goes to the real `/tmp/claude-<uid>/` (under its
own new session folders, so nothing real is touched), and the repo's session-global hooks still fire.

### ENV-D, ENV-P, ENV-W

- ENV-D: `npm run dev`. `DM_HOME=$PWD/.dungeonmaster-dev`. Real `claude` writes to the real `~/.claude`;
  chronicle-llm only reads it.
- ENV-P: `npm run build && npm run prod`. `DM_HOME=$PWD/.dungeonmaster`. Read-only observation.
- ENV-W: `mcp__dungeonmaster__create-worktree({ name: 'chronicle-qa' })`, then `npm run dev` inside it.

### Reading the store

Use Appendix A's `q` helper. It opens the database read-only, runs one statement, and closes it, so no read
transaction is ever held (a held one stops WAL checkpoints, design §12.1 rule 4). Never leave an interactive
`sqlite3` shell open inside `BEGIN`.

An agent, the data quality review LLM included, gets no `Read` of `<home>/data/**` (design §13.2). It reads the
store through `HOME="$SH" dungeonmaster chronicle query "<sql>"` (design §7). That command opens the database with
`readOnly: true`, refuses any statement but a `SELECT`, a `WITH` query or a read-only `PRAGMA`, and prints one JSON
object per row. Every `q "..."` in this plan runs the same way through it, one statement per call.

---

# Phase 1: the parsers and the tables

Delivers (design §11): the chronicle-llm process and its lock, migration `0001-initial`, the readers, both
normalizers, the assembler, the raw archive and sealer, redaction, the drift log, the storage cap and eviction, the
import (first run, then rolling per harness through `harness_imports`), the two spools, the quest mirror,
`dungeonmaster chronicle status`, `chronicle query` and `chronicle drift`, and the parity script. The server only
starts and stops the process, appends to the two spools, and passes `--session-id` on fresh Claude spawns.

**Every phase 1 case is checked through the tables, the archive files, `chronicle status` and the harness files.
None uses the browser.** The existing chat UI is unchanged in phase 1 and is not a verdict here.

Done when: the tables hold real data from both harnesses and pass the data quality review (phase 1-DQ), the parity
script passes, and the quest 1918a5ee counts pass.

## 1.1 The process (PRC)

#### CL-PRC-01 · Starting the server starts exactly one chronicle-llm process
- **Node:** both · **Severity:** blocker · **Automatable:** integration, manual-only
- **Setup:** ENV-S, fresh `$SH`.
- **Steps:** 1. `HOME="$SH" DUNGEONMASTER_PORT=4900 dungeonmaster start`. 2. `pgrep -af chronicle`. 3. Start a
  second `dungeonmaster start` on port 4901 against the same home. 4. `pgrep -af chronicle` again.
  5. `ls -la "$DM_HOME/data"`.
- **Expect:** One chronicle-llm process after step 2 and still one after step 4. The second start reports that
  one is already running and exits. The lockfile, the unix socket and the pidfile are inside `$DM_HOME`. `data/`
  is mode `0700`; `chronicle.db` is `0600`.
- **Failure looks like:** two processes, a missing socket (the second start deleted it before taking the lock), or
  files outside the home.

#### CL-PRC-02 · A stale lock from a killed process is taken over
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Setup:** ENV-S, running.
- **Steps:** 1. `kill -9 <chronicle pid>`. 2. Leave the lockfile and pidfile in place. 3. Restart the server.
- **Expect:** The new start sees the pid is dead or does not answer a ping, takes the lock, and starts one process.
  `meta.last_shutdown` read during start was `unclean`, so `PRAGMA quick_check` ran (the process log says so).
- **Failure looks like:** "already running" with no live process, or two processes.

#### CL-PRC-03 · `chronicle status` reports the documented fields
- **Node:** both · **Severity:** minor · **Automatable:** integration
- **Setup:** ENV-S after an import.
- **Steps:** `HOME="$SH" dungeonmaster chronicle status`.
- **Expect:** per-source lag, queue depth, the last commit time, WAL size, drift count, the age of the last
  ingest, and storage used per tier. Each figure agrees with Appendix A.1 and A.12.
- **Failure looks like:** a missing field, or a figure that disagrees with the tables.

#### CL-PRC-04 · The process never re-reads a whole file without a logged reason
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Setup:** ENV-S after the import has finished.
- **Steps:** 1. Restart the server. 2. Run `strace -f -e trace=openat,read -p <chronicle pid> -o $T/strace.txt`
  for one minute while one sandbox `claude` session runs. 3. Read `ingest_jobs` for the period.
- **Expect:** reads start at each source's watermark. Only the active session's files are read. No `reingest:*`
  job unless a file was replaced.
- **Failure looks like:** many transcripts opened and read from byte 0 after a restart (the old watcher's defect).

## 1.2 Migration 0001 and the schema (SCH)

#### CL-SCH-01 · An empty home gets exactly the schema in `schema.md`
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Setup:** ENV-S, fresh.
- **Steps:** 1. Start once. 2. `q "PRAGMA user_version"`. 3. `q "SELECT * FROM schema_migrations"`.
  4. `q "SELECT type, name FROM sqlite_master ORDER BY type, name"`.
- **Expect:** `user_version` is 1. One `schema_migrations` row, `0001-initial`, with a checksum and a duration.
  Every table, index and view in `schema.md` exists, and nothing else: 40 tables and 2 views (`rollup_quest`,
  `timeline`) when this plan was written. None of the twelve tables design §16 trimmed exists (`session_links`,
  `file_backups`, `ward_runs`, `capture_gaps`, `cost_snapshots`, `attachment_parts`, `evictions`, `raw_revisions`,
  `parse_errors`, `session_inits`, `agent_messages`, `interventions`), and neither does `git_operations`.
  `harness_imports` and `rate_limit_samples` exist. `messages` has no `effort` column (phase 1b adds it).
  `PRAGMA journal_mode` is `wal`.
- **Failure looks like:** a missing or extra object, a trimmed table still present, or `user_version` 0.

#### CL-SCH-02 · Readers wait while the schema is not ready
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Setup:** ENV-S.
- **Steps:** Poll `q "SELECT value FROM meta WHERE key='schema_state'"` every 100 ms from before the first start.
- **Expect:** the first value read is `migrating` or `ready`, and it ends at `ready`. No other table is queried
  successfully while it is `migrating`.
- **Failure looks like:** a reader sees a half-built schema.

## 1.3 First run and the rolling import (IMP)

#### CL-IMP-01 · First start imports the last 7 days of every harness first
- **Node:** both · **Severity:** blocker · **Automatable:** integration (fixture corpus); manual-only (real corpus)
- **Setup:** ENV-S with both corpora copied in. Record the census first: `python3 <Appendix B.6> "$SH"` lists
  every session file and its newest record time.
- **Steps:** 1. Start. 2. Every 2 s, run `chronicle status` and `q` A.2 until both harnesses report history done.
- **Expect:** each harness moves `first-run-week`, then `history`, and its `harness_imports` row moves `pending`,
  `recent`, `history`, `done`, with `recent_done_at` and then `history_done_at` set and `progress_json` rising.
  Every session with a record in the last 7 days
  is in `llm_sessions` before any older session is (`ingest_jobs` order, and `min(started_at)` of rows written by
  the `first-run-week` job). The first-run week finishes in under 30 s (`CL-PRF-03`). Progress figures rise
  steadily and end at 100%.
- **Failure looks like:** older sessions imported before recent ones, progress that stalls or goes backwards, or a
  harness never imported.

#### CL-IMP-02 · The full import ends with every session on disk in the store
- **Node:** both · **Severity:** blocker · **Automatable:** integration (fixture corpus)
- **Setup:** after CL-IMP-01.
- **Steps:** compare the Appendix B.6 census with A.3.
- **Expect:** one `llm_sessions` row per main transcript, per `agent-*.jsonl` (keyed
  `claude-code:<sessionId>/<agentId>`), per workflow agent, and per agy `conversations/*.db`. No `sources` row in
  state `error`. `ingest_jobs` for `history` have `finished_at` set and `errors` 0, or each error has a
  `raw_records` row with `parse_error` set that you can explain.
- **Failure looks like:** a count off by any amount. Sub-agent collisions (the prototype hit 12) show up as fewer
  sub-agent sessions than files.

#### CL-IMP-03 · A restart mid-import resumes, it does not restart
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Setup:** ENV-S, full corpus, during the `history` phase of CL-IMP-01.
- **Steps:** 1. Stop the server cleanly. 2. Restart it.
- **Expect:** history import continues from where it stopped. `raw_records` count only grows. No source already
  `idle` goes back to `dirty`. The first-run week is not repeated.
- **Failure looks like:** the import starts over, or rows are duplicated (unique keys would make that an error in
  the log instead).

#### CL-IMP-04 · A harness whose data appears later gets its own import, and blocks nothing
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Setup:** ENV-S with only the Claude corpus. No `$SH/.gemini/antigravity-cli/conversations`.
- **Steps:** 1. Start and let the Claude import finish. 2. Copy the agy corpus in. 3. Run one fresh
  `HOME="$SH" agy -p 'list files here'`.
- **Expect:** agy alone goes through `first-run-week` then `history`: its `harness_imports` row is created and runs
  `pending` to `done`, while the Claude row stays `done`, untouched. Claude sources are not re-read
  (`ingest_jobs` shows no Claude job). The new live agy session is ingested at `live` priority while agy history
  imports.
- **Failure looks like:** agy never picked up until a restart, or Claude re-imported.

#### CL-IMP-05 · A new harness package in an upgrade gets its own rolling import
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Setup:** needs two builds: one without the Antigravity package, one with it (Appendix C, G21). ENV-S with both
  corpora.
- **Steps:** 1. Start the build without agy; let Claude finish. 2. Stop. 3. Start the build with agy.
- **Expect:** as CL-IMP-04, including a new `harness_imports` row for agy only. Only the very first start of the
  home counted as first run.
- **Failure looks like:** a second whole-home first run, or agy history never imported.

#### CL-IMP-06 · A `registered` home imports no history
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Setup:** ENV-D with an empty `.dungeonmaster-dev/data`.
- **Steps:** 1. `npm run dev`. 2. `chronicle status` and A.3.
- **Expect:** no `first-run-week` or `history` jobs. `llm_sessions` is empty until this home dispatches something.
- **Failure looks like:** the dev home imports gigabytes of the user's history.

#### CL-IMP-07 · The staleness warning after 20 days
- **Node:** 22.17 · **Severity:** minor · **Automatable:** unit
- **Setup:** ENV-S, imported. `libfaketime` installed (Appendix C, G19).
- **Steps:** stop; `HOME="$SH" faketime '+21 days' dungeonmaster chronicle status`.
- **Expect:** status warns that the last ingest is 21 days old and Claude deletes transcripts after 30.
- **Failure looks like:** no warning.

## 1.4 Live ingest of a dispatched quest (LIV)

Set up once: a guild in the environment's UI, and a small quest you can approve and run. To force sub-agents,
open the quest's chat and ask: "Spawn a general-purpose Agent that spawns another Agent, which spawns a third that
runs `ls`. In the same message, spawn three Explore agents in parallel." Run Appendix B.3, the first-sighting
probe, for the whole run.

#### CL-LIV-01 · A dispatched session's row exists, linked, before its first line
- **Node:** both · **Severity:** blocker · **Automatable:** integration, e2e
- **Setup:** ENV-D (real Claude), probe running against `.dungeonmaster-dev/data/chronicle.db`.
- **Steps:** 1. Start the quest. 2. When the first work item spawns, read the probe output and A.4.
- **Expect:** a `dispatch_events` row of kind `register` with guild, quest, work item, role and step, BEFORE the
  `spawn` row. The `llm_sessions` row for the session id passed in `--session-id` appears with `quest_ref` and
  `work_item_ref` set, `linked_by = 'dispatcher'`, `linked_at` set, and zero events at first sighting.
- **Failure looks like:** the session first seen with `quest_ref` NULL, or first seen only after its transcript.

#### CL-LIV-02 · Tool calls belong to the quest the moment they are written
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Setup:** as CL-LIV-01.
- **Steps:** as the work item runs, run A.5 every few seconds.
- **Expect:** every `tool_calls` row of the session is reachable from the quest through its session's own
  `llm_sessions.quest_ref` from its first commit (events and tool calls carry no `quest_ref` of their own, design
  §4.3). No row waits on a `quest.json` init line.
- **Failure looks like:** tool calls that only join the quest after a later commit.

#### CL-LIV-03 · Sub-agents at depth 1, 2 and 3 carry the quest at insert
- **Node:** both · **Severity:** blocker · **Automatable:** integration, e2e
- **Setup:** as CL-LIV-01, with the nesting prompt above.
- **Steps:** read the probe output and A.6 for the quest.
- **Expect:** every sub-agent row (`kind = 'subagent'`) has `quest_ref` and `work_item_ref` set at first sighting, copied from its parent
  with `linked_by = 'inherited'`, `spawn_depth` 1, 2 and 3 as spawned, `parent_session_ref` the spawning agent (not the main session, for depth 2 and 3), and
  `spawned_by_tool_call_ref` the `Agent` call whose `toolu_` id is in the child's `.meta.json`. A.16 returns no
  rows. The three parallel Explore agents each link to their own call.
- **Failure looks like:** a sub-agent first seen unlinked, linked to the wrong parent, or linked by prompt text.

#### CL-LIV-04 · A `.meta.json` that lands after the sub-agent file still links correctly
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Setup:** ENV-D. Ask the quest chat for a background agent (`run_in_background: true`); 9% of meta files arrive
  late, mostly for these.
- **Steps:** compare the meta file's mtime with the agent file's first line time; read A.6.
- **Expect:** the session is first created as a stub or linked through stdout `task_started`, then filled in. No
  orphan sub-agent session is left with `is_stub = 1` or `parent_session_ref` NULL.
- **Failure looks like:** an unparented sub-agent, or two sessions for one agent.

#### CL-LIV-05 · Background Bash does not become a sub-agent
- **Node:** both · **Severity:** major · **Automatable:** unit, integration
- **Setup:** ENV-D. Ask the quest chat to run `sleep 20 && echo done` in the background.
- **Expect:** a `background_tasks` row of kind `bash`. No `llm_sessions` row for it, though stdout's
  `task_started` fired.
- **Failure looks like:** a phantom sub-agent session.

#### CL-LIV-06 · Workflow agents link through the Workflow call
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Setup:** ENV-S, a session that runs a `Workflow` tool call (any small workflow script).
- **Expect:** each workflow agent is `kind = 'workflow-agent'`, keyed `claude-code:<sessionId>/<agentId>`, with the
  journal's `label` and phase in `description`. A `background_tasks` row keyed `<session>:task:<taskId>` carries
  the workflow's reported tokens and tool uses.
- **Failure looks like:** journal `result` lines stored as stdout `result` records (`raw_records.record_type` must
  be prefixed `workflow-journal/`).

#### CL-LIV-07 · Links survive chronicle-llm being down at spawn time
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Setup:** ENV-S, a quest ready to start.
- **Steps:** 1. `kill -STOP <chronicle pid>`. 2. Start the quest; let two work items spawn. 3. `kill -CONT`.
- **Expect:** `$DM_HOME/data/spool/dispatch.jsonl` grew while stopped. After `CONT`, every session is linked as in
  CL-LIV-01, with `linked_by = 'dispatcher'`. The spool file is deleted only once every record from it sits in a
  SEALED, `fsync`ed segment AND the sealing transaction has committed and been followed by a WAL checkpoint (design
  §6 step 6): right after the `raw_tail` commit the file is still there (`ls "$DM_HOME/data/spool"`), and it is
  gone after the sealer's checkpoint, with every record in `raw_records`.
- **Failure looks like:** sessions linked only by `quest-file` or not at all, or a spool file deleted while its
  records are still only in `raw_tail`.

#### CL-LIV-08 · Queue waits are recorded
- **Node:** both · **Severity:** minor · **Automatable:** integration
- **Setup:** ENV-D with `orchestration.slotCount` 1 and two quests started together.
- **Expect:** `dispatch_events` holds `queue-wait-start` and `queue-wait-end` with `wait_reason` `slot-limit` and a
  `waited_ms` that matches the gap between the first quest's exit and the second's spawn.
- **Failure looks like:** no queue-wait rows.

#### CL-LIV-09 · Exits fill `end_state`, code and signal
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Setup:** ENV-S, a running work item.
- **Steps:** 1. Let one work item finish normally. 2. `kill -TERM` another child (pid from
  `dispatch_events.os_pid`). 3. `kill -9` a third.
- **Expect:** `exited` with `exit_code` 0; `signalled` with `exit_signal` `SIGTERM`; `killed` with `SIGKILL`.
- **Failure looks like:** `unknown`, or `running` long after the process is gone.

## 1.5 Interactive, chat-spawned and resumed sessions (INT)

#### CL-INT-01 · Interactive sessions dungeonmaster did not start are ingested in an `all` home
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Setup:** ENV-S running. A second terminal in any other directory.
- **Steps:** 1. `HOME="$SH" claude` interactively; ask two questions, one that runs a tool. 2. While it is open,
  read A.7 for that session. 3. Exit; read A.7 again.
- **Expect:** an `llm_sessions` row with `is_interactive = 1`, with `quest_ref`, `work_item_ref` and `linked_by` all NULL,
  its events, tool call and usage. `liveness` moves `busy` → `idle` → `stopped`, from `$SH/.claude/sessions/<pid>.json`. Whether the
  `<pid>.<hash>.key` file beside it is read is CL-SEC-12's question.
- **Failure looks like:** missing session, or liveness stuck at `busy`.

#### CL-INT-02 · An interactive session that names a quest in an MCP call is linked `inferred`
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Setup:** ENV-S with a quest. An interactive sandbox Claude in a repo whose `.mcp.json` points at the sandbox.
- **Steps:** ask it to call `mcp__dungeonmaster__get-quest` with that quest's id.
- **Expect:** `llm_sessions.linked_by = 'inferred'` with `quest_ref` equal to that quest and `linked_at` set.
- **Failure looks like:** no link.

#### CL-INT-03 · A session listed in `quest.json` but not dispatched is linked `quest-file`
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Setup:** ENV-S with the frozen 1918a5ee folder and transcripts copied in (Appendix B.2).
- **Expect:** the `llm_sessions` row of every `workItems[].sessionId` and `sessions[]` id has `quest_ref` set and
  `linked_by = 'quest-file'` (`work_item_ref` too, for a work item's session).
- **Failure looks like:** a work item whose session is not linked.

#### CL-INT-04 · Chat-spawned sessions register before they spawn
- **Node:** both · **Severity:** blocker · **Automatable:** integration, e2e
- **Setup:** ENV-D. Open a quest's chat (ChaosWhisperer) and send a message.
- **Expect:** as CL-LIV-01: a `register` record from `agentLaunchBroker`, `--session-id` used, the row linked at
  first sighting.
- **Failure looks like:** the chat session linked late or not at all.

#### CL-INT-05 · A resumed work item is not counted twice
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Setup:** ENV-S (real Claude). A running quest work item.
- **Steps:** 1. Note the work item's usage total (A.8). 2. `kill -9` its child mid-work. 3. Let the orchestrator
  resume it. 4. Wait for it to finish. 5. Run A.8 and A.9. 6. Run Appendix B.5 (the usage census) over the work
  item's transcript files.
- **Expect:** the resumed file's copied records are `events` rows with `copied_from_event_ref` pointing at the
  originals. `messages`, `usage`, `tool_calls` and `tool_results` gained only rows for new API messages. The usage
  total equals the B.5 census (deduped by `message.id`) exactly. A.9 returns no rows.
- **Failure looks like:** totals above the census. The old bug was 20,260 copied records counted twice.

#### CL-INT-06 · A late original back-fills the copy
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Setup:** ENV-S. Two transcript files of one resumed session, copied into a staging folder.
- **Steps:** 1. Copy the RESUMED file into the sandbox project folder first. 2. After it is ingested, copy the
  original.
- **Expect:** after step 2, every copy's `copied_from_event_ref` is set, `messages.session_ref` moved to the
  original's session (earliest `ts`), and `rollup_dirty` held the session with reason `ownership-moved` until the
  sweeper ran. The final rows equal the rows of a run that read the files in the natural order (Appendix B.11
  diff).
- **Failure looks like:** ownership that depends on read order.

#### CL-INT-07 · `/clear` and compaction hand-offs link through `continued-in`
- **Node:** both · **Severity:** minor · **Automatable:** unit
- **Setup:** ENV-S, an interactive session; run `/clear`, then continue.
- **Expect:** the new session's `forked_from_session_ref` names the old one. A stub created from the old file's
  `continued-in` record is filled in and `is_stub` is 0.
- **Failure looks like:** an unresolved stub.

#### CL-INT-08 · A user interrupt is recorded
- **Node:** both · **Severity:** minor · **Automatable:** unit
- **Setup:** ENV-S interactive Claude; start `sleep 60` and press Esc.
- **Expect:** the call has status `interrupted`, cause `interrupted`, sub-cause `user`; an `events` row of kind
  `intervention`, subtype `interrupt` (design §4.2; there is no `interventions` table).
- **Failure looks like:** the call left `pending` or classified `nonzero-exit`.

#### CL-INT-09 · A `registered` home ignores interactive sessions
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Setup:** ENV-D running; a real interactive `claude` in this repo.
- **Expect:** no row for the interactive session in the dev store.
- **Failure looks like:** the dev home ingests the user's own sessions.

## 1.6 Antigravity (AGY)

#### CL-AGY-01 · A live `agy -p` session is ingested, and rows update in place
- **Node:** both · **Severity:** blocker · **Automatable:** integration (recorded db), manual-only (live)
- **Setup:** ENV-S. Probe B.3 running.
- **Steps:** `HOME="$SH" agy -p --output-format stream-json 'run ls -la, then read README.md, then summarise'`.
- **Expect:** one `llm_sessions` row `antigravity:<conversation uuid>`. During the run, tool calls move
  `pending` → `running` → `ok`. Each status change adds a `raw_records` row at the same `(source_ref, sub_table, pos)` with the
  next `revision` and `revision_expected = 1`, and the old bytes stay readable through their own row. The final
  `tool_calls` count equals the type-132 step count in the db (Appendix B.6). No `raw_records` row has
  `revision_expected = 0`.
- **Failure looks like:** a call stuck at `running` after agy exited, or duplicate calls for one step.

#### CL-AGY-02 · Streamed answer text ends equal to the database
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Setup:** as CL-AGY-01.
- **Expect:** the final `content_blocks.text` of each planner event equals the db's final `step_payload` text, and
  equals the concatenation of every stdout `text_delta` for that step index.
- **Failure looks like:** text truncated to the last chunk, or doubled.

#### CL-AGY-03 · An agy sub-agent links to its parent and keeps its own usage
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Setup:** ENV-S. `HOME="$SH" agy -p --output-format stream-json 'use a research sub-agent to count lines in README.md'`.
- **Expect:** a child `llm_sessions` row with `parent_session_ref` the parent and `spawned_by_tool_call_ref` the
  `invoke_subagent` call named by `brain/<parent>/.system_generated/subagents/<child>.json` `spawnStepIndex`.
  The child's `usage` rows exist in their own right. The parent's stdout `result.usage` excludes the child; the
  store's tree total (A.10) equals parent plus child.
- **Failure looks like:** a parentless child, or the quest total missing the child's tokens.

#### CL-AGY-04 · `call_<n>` reuse does not collide
- **Node:** both · **Severity:** major · **Automatable:** unit
- **Setup:** ENV-S after the agy history import.
- **Steps:** A.11.
- **Expect:** tool call keys are `antigravity:<conv>:call_<n>`. A repeat inside one conversation ends `~2`, `~3`.
  No two conversations share a key.
- **Failure looks like:** fewer agy tool calls than type-132 steps.

#### CL-AGY-05 · The reader leaves agy's files as it found them
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Setup:** ENV-S with a closed conversation db that has no `-wal`/`-shm`.
- **Steps:** 1. `ls -la` the conversations folder. 2. Let chronicle-llm read it (restart forces a stat pass).
  3. `ls -la` again. 4. `HOME="$SH" agy --resume <conv>` (or the CLI's resume form) and add one turn.
- **Expect:** no new `-wal`/`-shm` pair left behind by the reader. The resumed turn is ingested (the db is never
  opened `immutable=1`). The conversation keeps its natural key; no copy rows appear.
- **Failure looks like:** stray empty `-wal`/`-shm` files, or the resume missed.

#### CL-AGY-06 · CLEARED and CANCELED steps are classified right
- **Node:** both · **Severity:** major · **Automatable:** unit
- **Setup:** ENV-S, agy corpus imported (conversation `fe62b455` holds CLEARED steps).
- **Expect:** a step that moved from done to CLEARED (5) keeps its earlier content and stays `ok`. A CANCELED (6)
  step is `cancelled` with cause `cancelled`. An INVALID (4) step is `error` with cause `tool-error`, sub-cause
  `invalid-tool`.
- **Failure looks like:** CLEARED turning an `ok` call into a failure.

#### CL-AGY-07 · The harness version comes from the CLI logs
- **Node:** both · **Severity:** major · **Automatable:** unit
- **Setup:** ENV-S, agy corpus with `log/cli-*.log`.
- **Steps:** `q "SELECT * FROM harness_versions WHERE harness='antigravity'"`.
- **Expect:** `1.2.7`, `1.2.12` and `1.2.14` with `evidence = 'cli-log'`, and `1.2.5` with `statusline`.
  Conversations before the first log carry `unknown`, a `schema_drift` row `unknown-harness-version`, and the
  nearest normalizer. The log file times are local time; check the era boundaries against design: 1.2.7 from
  2026-09-22 01:25 UTC.
- **Failure looks like:** every agy record versioned the same, or boundaries off by the UTC offset.

#### CL-AGY-08 · Rotated logs and shrunk system prompts leave no gap record
- **Node:** both · **Severity:** minor · **Automatable:** integration
- **Setup:** ENV-S. Delete the oldest `log/cli-*.log` copies before the first start; import the agy corpus cold.
- **Expect:** conversations from before the first surviving log carry harness version `unknown`, a `schema_drift`
  row `unknown-harness-version`, and the nearest normalizer (CL-AGY-07). Nothing records the lost window or the
  `gen_metadata` rows never seen while newest: there is no `capture_gaps` table (design §16, §13.3) and no other
  row claims the data was captured. `sqlite_master` holds no gap table.
- **Failure looks like:** a gap table or a row asserting completeness, or a crash on the missing logs.

#### CL-AGY-09 · Interactive vs `-p`
- **Node:** both · **Severity:** minor · **Automatable:** unit
- **Expect:** a conversation named in `history.jsonl` has `is_interactive = 1`; a `-p` conversation and every child
  have 0.

#### CL-AGY-10 · agy killed mid-step
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Setup:** ENV-S. `HOME="$SH" agy -p 'run sleep 30, then echo done'`; `kill -9` agy during the sleep.
- **Expect:** the open step stays non-terminal in the db, and the stale `-wal` stays. The store keeps the call
  `running` and marks `end_state = 'killed'` once the conversation file is quiet. The one last read after the
  `-wal` disappears happens on the next agy start in that folder.
- **Failure looks like:** the call marked `ok`, or the session `running` forever.

#### CL-AGY-11 · A dispatched agy work item links once its id is known
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Setup:** ENV-D, if a role can run on agy; otherwise skip and record "not applicable in this build".
- **Expect:** a `register` record, then a `spawn` record carrying the conversation id. The session is linked at its
  first sighting after the `spawn` record.
- **Failure looks like:** the agy session never linked.

## 1.7 Stdout, the spools and the merge (OUT)

#### CL-OUT-01 · A stdout row becomes final when the transcript arrives
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Setup:** ENV-D, a running work item. Poll A.12 every 200 ms for its session.
- **Expect:** new assistant events first appear with `origin = 'stdout'`, `provisional = 1`. When the transcript
  writes the message (after the message ends), the same `natural_key` becomes `origin = 'both'`,
  `provisional = 0`, and `stop_reason` and the final usage are set. The event count never goes up for the same
  record.
- **Failure looks like:** one stdout row plus one transcript row for the same record.

#### CL-OUT-02 · Stdout never lowers a figure; the transcript wins
- **Node:** both · **Severity:** major · **Automatable:** unit
- **Expect:** for every message with `origin = 'both'`, `usage` equals the transcript's final record per
  `message.id` (B.5). No `usage` row shows a value lower than its provisional value.
- **Failure looks like:** output tokens equal to an early block's partial count.

#### CL-OUT-03 · A child killed mid-message leaves marked provisional rows
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Setup:** ENV-S. A work item asked to write a long answer (for example, "write 3,000 words about X").
- **Steps:** `kill -9` the child (pid from `dispatch_events`) while it is streaming text.
- **Expect:** the partial assistant rows stay `provisional = 1`; `usage.is_partial = 1` for that message;
  `llm_sessions.end_state = 'killed'`, `exit_signal = 'SIGKILL'`. The stdout spool holds every line received
  before the kill.
- **Failure looks like:** the partial message lost, or marked final.

#### CL-OUT-04 · Stdout-only facts land in their tables
- **Node:** both · **Severity:** major · **Automatable:** unit
- **Expect:** each dispatched session's `llm_sessions` row carries the LAST stdout `init` line's facts:
  `init_tools_json`, `init_mcp_servers_json`, `init_agents_json`, `init_skills_json`, `api_key_source`,
  `permission_mode` (the init value wins over the transcript's) and `harness_version_last` (`claude_code_version`).
  A process that printed several `init` lines (a resume) keeps only the last; the earlier ones stay in the raw
  archive. Each `result` line has a `session_results` row (duration, API duration, TTFT, terminal reason,
  permission denials). The session's reported cost is its LAST `session_results` row, and
  `rollup_session.last_reported_cost_usd` and `last_reported_at` hold the newest figure the harness reported (stdout
  `result` or transcript `cost-state`, newest wins). Interactive sessions have no `init_*` values and no
  `session_results` rows.
- **Failure looks like:** missing init facts, facts from the first `init` line of a resumed process, or cost summed
  across cumulative rows.

#### CL-OUT-05 · The server spools stdout while chronicle-llm is down
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Setup:** ENV-S, a running work item.
- **Steps:** 1. `kill -STOP <chronicle pid>` for 60 s. 2. `wc -l $DM_HOME/data/spool/*.stdout.jsonl`. 3. `kill -CONT`.
- **Expect:** spool lines kept growing, each with `received_at`. After `CONT`, every line is archived and its rows
  exist. The spool file is deleted only after its records are sealed, `fsync`ed and checkpointed (design §6 step
  6), so right after `CONT` it is still there and it disappears once the sealer's checkpoint has run.
- **Failure looks like:** stdout lost for the stopped window, or the spool deleted before its records are sealed.

#### CL-OUT-06 · The merge result does not depend on read order
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Setup:** a home that ingested a work item live (ENV-D or ENV-S).
- **Steps:** 1. Dump the session tree with Appendix B.11. 2. `dungeonmaster chronicle rebuild` (it replays the
  archive in `ingest_seq` order, which differs from the live interleaving). 3. Dump again; diff.
- **Expect:** no difference except integer ids and `change_seq`.
- **Failure looks like:** any column that differs. That is a merge rule that depends on order (design §4.1 rule 5).

## 1.7A Agent messages and interventions (MSG)

Design §4.2. A message between agents is a SEND and an ARRIVAL, both already in the timeline. The SEND is the
sender's tool call (Claude `SendMessage`, agy `send_message` or `invoke_subagent`). The ARRIVAL is one `events` row
in the RECIPIENT session with `kind = 'agent-message'`, subtype the origin kind (`coordinator`, `peer`,
`task-notification`), its body in `content_blocks`, `is_meta` set when the harness hides it, and `details_json`
holding `{peerSessionKey, messageId, priority, read, deliveryId}`. `events.link_key` joins the two. An arrival is
never also an intervention; what steers a session without arriving as a message is an `events` row of
`kind = 'intervention'`. There is no `agent_messages` table and no `interventions` table (design §16).

ENV-S, with Appendix A.50 to A.52. Tag each message with a unique `MSGTAG-<n>` so a grep finds it (never a `ZQ`
tag, which belongs to the secret canaries).

#### CL-MSG-01 · A parent's SendMessage to a running child arrives in the child
- **Node:** both · **Severity:** blocker · **Automatable:** integration (fixture), manual-only (live)
- **Setup:** ENV-S, a sandbox Claude session. Ask it: "Spawn a background general-purpose Agent that runs
  `sleep 45 && echo done`, then use SendMessage to tell it `MSGTAG-1 stop and report`." Run it twice: once with the
  message landing while the child is between calls, once while the child is inside a long Bash call. These are the
  two delivery forms, a user record and a queued attachment.
- **Steps:** A.50 for the parent session; A.51 for the child.
- **Expect:**
  - The parent's `SendMessage` is a `tool_calls` row, and its event carries `link_key` =
    `<child agentId>:<sha256 of the body text>`. Compute the sha256 yourself from the body, with the "The
    coordinator sent a message while you were working:" wrapper stripped first, and compare.
  - Exactly one `events` row of kind `agent-message` in the CHILD session (`claude-code:<parent session>/<agentId>`),
    subtype `coordinator`, the same `link_key`, the body in its `content_blocks`, `details_json` with
    `peerSessionKey` equal to the parent's `llm_sessions.natural_key` plus `messageId`, `priority`, `read` and
    `deliveryId`, and `tool_call_ref` equal to the send's tool call. The parent session has no arrival row for it.
  - A.50 returns the send with its arrival, the arrival's `ts` after the send's. The census medians are 0.04 s in
    the user-record form and 10.7 s in the queued-attachment form; record which form each run produced.
  - `is_meta = 1` exactly when the harness hides the message from its own UI.
- **Failure looks like:** the arrival filed under the sender, two arrival rows, a `link_key` hashed over the
  wrapped text so the join misses, or `peerSessionKey` holding a raw id instead of a natural key.

#### CL-MSG-02 · A child's hand-back arrives in the parent
- **Node:** both · **Severity:** blocker · **Automatable:** integration (fixture), manual-only (live)
- **Setup:** as CL-MSG-01. Run 1: let the background child finish, so the parent receives the harness's completion
  notice. Run 2: tell the child to `SendMessage` the parent a note tagged `MSGTAG-2` before it finishes.
- **Steps:** A.50 and A.51 for the parent session.
- **Expect:** each hand-back is one `events` row of kind `agent-message` in the PARENT session. The completion
  notice has subtype `task-notification`; the child's own `SendMessage` has the subtype for its origin kind
  (record which you saw, `peer` or `coordinator`). `peerSessionKey` is the child's `natural_key`. For the
  `SendMessage` form, the child's send joins to the arrival by `link_key`. The `background_tasks` row of the same
  task has `notification_count` above 0. Neither arrival also exists as a `user-message` event or an intervention
  (CL-MSG-05).
- **Failure looks like:** the hand-back filed under the child, or stored twice.

#### CL-MSG-03 · An agy `send_message` links through the message id, in either read order
- **Node:** both · **Severity:** blocker · **Automatable:** integration (recorded db), manual-only (live)
- **Setup:** ENV-S. `HOME="$SH" agy -p --output-format stream-json 'start a sub-agent to count lines in README.md,
  then send it a message saying MSGTAG-3 count package.json too'`.
- **Steps:** A.50 for the parent conversation. Copy the conversation db (B.6's recipe) and read field `114.4.1` of
  the delivering type-101 step. List `brain/<conv>/.system_generated/messages/*.json`. Then repeat on a fresh home
  with the message file copied in BEFORE the conversation db, and again with it copied AFTER.
- **Expect:** one `events` row of kind `agent-message` in the recipient conversation, natural key
  `<recipient session>:msg:<message uuid>`, and `link_key = 'antigravity:msg:<message uuid>'` on both the send's
  event and the arrival. The uuid equals the message file's `id` and the step's field `114.4.1`. `details_json`
  has `peerSessionKey`, `messageId`, `priority`, `read` and `deliveryId`, plus agy's title and the sender's task id
  when present. The census median delay is 0.10 s. The three homes end with the same row, the same key and the same
  columns (B.11 diff).
- **Failure looks like:** two rows for one message (one per source), a key that depends on which source was read
  first, or a missing `link_key` on the send.

#### CL-MSG-04 · Sends that never arrive are read with a LEFT JOIN
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Setup:** ENV-S with the full Claude corpus copy, or at least 30 `SendMessage` calls driven in the sandbox.
- **Steps:** A.50's per-harness census query.
- **Expect:** about 7% of Claude sends have no arrival (with 30 sends, 0 to 6 misses; over the whole corpus within a
  few points of 7%). agy has essentially none. The LEFT JOIN returns every send exactly once, with NULL arrival
  columns where none arrived: no send is dropped, none is duplicated. No arrival row exists for a send that never
  arrived. The send's tool call still holds the message text. From phase 3 on, such a send renders in the chat
  without an error or an endless "waiting".
- **Failure looks like:** a reader that inner-joins and loses 7% of sends, or an invented arrival.

#### CL-MSG-05 · One record, one row: an arrival is never also an intervention
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Steps:** A.52's duplicate check and kind census, over the rows of CL-MSG-01 to CL-MSG-03. Then, in an
  interactive sandbox Claude, type a message while it is running a tool.
- **Expect:** each arrival, of any origin (human, peer, coordinator, task-notification, agy), is exactly one
  `events` row. No second row from the same `raw_id` exists as an `intervention` or as a `user-message`. The
  human's mid-turn message is an ordinary `user-message` event, and no `steer` kind exists anywhere.
  `sqlite_master` has no `agent_messages` and no `interventions`.
- **Failure looks like:** an arrival that also appears as an intervention, or the same message stored in two
  places.

#### CL-MSG-06 · Interventions are events, with their source and reason
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Setup:** ENV-S interactive sandbox Claude, with a permission rule that denies `Bash(sed:*)`.
- **Steps:** drive each kind and read A.52. Type a message mid-turn and let it queue and pop (`enqueue`,
  `dequeue`); remove a queued message (`remove`); clear the queue (`pop-all`); press Esc (`interrupt`,
  CL-INT-08); reject a tool at the permission prompt (`user-rejected`); call `sed -n 1p README.md`
  (`permission-denied`); press Shift+Tab (`mode-change`); run `/clear` (`slash-command`); stop background agents
  (`kill-agents`); run `grep -r foo .` where the dungeonmaster hook blocks it (`hook-block`).
- **Expect:** each action gives one `events` row of `kind = 'intervention'` with that subtype. `details_json` holds
  `source` (`human`, `peer`, `coordinator` or `scheduled`), `refId` and `reason`, plus the new mode, the command
  name or the hook name where it applies. An intervention drawn from a record that already yields an event of
  another kind (a denied call's result) has that event's `natural_key` plus `:intervention`, and the call itself
  still has its `tool_calls` status and `tool_call_causes` row. No subtype outside the list appears.
- **Failure looks like:** a missing intervention, an unlisted subtype (`steer`), or no `details_json`.

#### CL-MSG-07 · Arrivals and interventions survive a rebuild unchanged
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Steps:** dump with B.11 (it includes the `agent-message` and `intervention` rows), run
  `dungeonmaster chronicle rebuild` on a copy of the home, dump again, diff.
- **Expect:** no difference except integer ids and `change_seq`: the same keys, `link_key` values and `details_json`.
- **Failure looks like:** a `link_key` or a key suffix that depends on ingest order.

#### CL-MSG-08 · Two sends with the same body to one recipient (record only)
- **Node:** 22.17 · **Severity:** minor · **Automatable:** manual-only
- **Steps:** tell a running child the same text twice, a few seconds apart; run A.50.
- **Expect:** the design does not say how identical bodies pair (Appendix C, G27). Both sends and both arrivals
  carry the same `link_key`. Record whether A.50 pairs them one to one or crosses them, and whether the
  recipient part of the key for a MAIN-session recipient is the session id or an agent id.

## 1.8 The quest mirror (QMR)

#### CL-QMR-01 · `quests` and `work_items` mirror `quest.json`
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Setup:** any home with quests.
- **Steps:** Appendix B.8 compares every `quest.json` with A.13.
- **Expect:** every quest and work item present; title, status, role, step, `native_session_id` equal.
- **Failure looks like:** missing quests, or stale statuses.

#### CL-QMR-02 · A status change appears within a second
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Setup:** ENV-D. Pause and resume a quest in the UI.
- **Expect:** `quests.status` changes within 1 s of the `event-outbox.jsonl` line.
- **Failure looks like:** the mirror waits for a restart.

#### CL-QMR-03 · Outbox truncation and direct writes are reconciled
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Steps:** 1. Restart the server (it truncates the outbox). 2. Edit one sandbox `quest.json` title by hand
  (ENV-S only) with no outbox line.
- **Expect:** after 1, a reconcile scan (an `ingest_jobs` row) and nothing missing. After 2, the mtime sweep
  updates the title.
- **Failure looks like:** the hand edit never mirrored.

#### CL-QMR-04 · A ward step's verdict is mirrored in `work_items`
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Setup:** ENV-S with the frozen 1918a5ee copy (B.2).
- **Steps:** A.56's first query; compare each ward work item with its `quest.json` `wardResults[]` entry and
  `<questFolder>/ward-results/<id>.json`.
- **Expect:** `ward_result_id`, `ward_run_id`, `ward_exit_code`, `ward_checks_json` (per check, such as
  `{"lint":"pass","unit":"fail"}`) and `ward_slow_tests_only` equal the files. A step whose exit code is non-zero
  while every check passes is the "ward verdict mismatch" of CL-HLT-08. There is no ward table.
- **Failure looks like:** a ward step with NULL `ward_*` columns, or a verdict that differs from its file.

#### CL-QMR-05 · An agent's ward run through Bash lands in `tool_results.details_json`
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Setup:** ENV-S with the frozen 1918a5ee copy, whose sessions run ward through Bash.
- **Steps:** A.56's second query.
- **Expect:** each Bash call that ran ward has `ward.runId`, `ward.exitCode`, `ward.checks` and
  `ward.slowTestsOnly` in its result's `details_json`, written by the classifier. `ward.runId` agrees with
  `npm run ward -- detail <runId>`. A red caused only by slow tests has `slowTestsOnly` true and its call has cause
  `ward-red`, sub-cause `slow-tests-only`. Bash calls that did not run ward have no `ward` key.
- **Failure looks like:** ward facts missing, or kept in a table of their own.

## 1.9 Source lifecycle and bad data (SRC)

All SRC cases run in ENV-S only. Appendix B.4 has the file operations.

#### CL-SRC-01 · The harness deletes its files; nothing is lost
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Steps:** 1. Pick an ingested sandbox session; record A.14 and a B.11 dump. 2. Delete its `.jsonl`, its
  `subagents/` and `tool-results/` folders. (To use Claude's own cleanup instead: set `"cleanupPeriodDays": 1` in
  `$SH/.claude/settings.json`, backdate with `touch -d '3 days ago'`, then start a sandbox `claude`.)
- **Expect:** the sources move to `gone` with `gone_at`. Every derived row stays. The B.11 dump is unchanged.
  Every `raw_records` row of the session is still readable from the archive (Appendix B.7).
- **Failure looks like:** rows deleted, or sources stuck `dirty`/`error`.

#### CL-SRC-02 · A file deleted before it was ever read is not captured, and nothing says it was
- **Node:** both · **Severity:** minor · **Automatable:** integration
- **Steps:** `kill -STOP` the process; start and finish a short sandbox session; delete its file; `kill -CONT`.
- **Expect:** no row anywhere records the lost file: there is no `capture_gaps` table (design §16, §13.3). For a
  source that was registered (it has a `sources` row), the row ends `gone` with `gone_at` and no `raw_records`; for
  an unregistered one, nothing exists at all. Record which you saw. No `llm_sessions` row holds events from the
  missing file.
- **Failure looks like:** a row claiming the session was captured, or a crash on the vanished path.

#### CL-SRC-03 · A replaced file (new inode) is re-ingested without duplicates
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Steps:** `cp f f.new && mv f.new f` on an ingested transcript.
- **Expect:** a `schema_drift` row `file-replaced`, an `ingest_jobs` row `reingest:file-replaced`, and the same
  natural keys as before (B.11 diff empty).
- **Failure looks like:** duplicate events, or the change ignored.

#### CL-SRC-04 · A truncated file is re-ingested
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Steps:** `truncate -s <half> f`.
- **Expect:** `file-replaced` drift and a re-ingest. Rows that came from the cut lines stay (the archive has them);
  nothing is duplicated.
- **Failure looks like:** the watermark beyond the new end, so later appends are never read.

#### CL-SRC-05 · A rewritten head is detected
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Steps:** overwrite the first 100 bytes in place, same inode, same size
  (`dd if=/dev/urandom of=f bs=1 count=100 conv=notrunc`), then append one valid line.
- **Expect:** `head_hash` changes, so `file-replaced` drift plus a re-ingest.
- **Failure looks like:** only the appended line read.

#### CL-SRC-06 · A rewrite just before the watermark is detected
- **Steps:** overwrite bytes 200 before the end in place, then append a line.
- **Expect:** the tail hash check fails: a `record-rewritten` drift row and a re-read.
- **Node:** both · **Severity:** major · **Automatable:** integration

#### CL-SRC-07 · A partial last line waits, then completes into one row
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Steps:** append the first half of a valid record (no newline); wait 5 s; append the rest and a newline.
- **Expect:** no `raw_records` row and no `parse_error` during the wait; exactly one event after.
- **Failure looks like:** a parse error for the half line, or two rows.

#### CL-SRC-08 · A partial last line that never completes is archived with a `parse_error`
- **Steps:** append half a record to a session that has ended; wait 70 s.
- **Expect:** one `raw_records` row with `parse_error` and `parse_error_normalizer` set (the fragment archived as its
  own record); the watermark moved past it; later appended lines are read.
- **Node:** both · **Severity:** major · **Automatable:** integration

#### CL-SRC-09 · A garbage line in the middle
- **Steps:** append `{not json` + newline, then a valid line.
- **Expect:** one `raw_records` row with `parse_error` and `parse_error_normalizer` set; the valid line ingested.
- **Node:** both · **Severity:** major · **Automatable:** unit

#### CL-SRC-10 · Large lines and large files
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Setup:** the sandbox corpus holds a 1.11 MB line and a 25.8 MB file (design census).
- **Expect:** both ingested. The long text sits in a blob, `text_chars` holds the full length. The 25 MB file took
  well under 1 s (`ingest_jobs.bytes_read` / duration). Process memory stayed under 512 MB.
- **Failure looks like:** truncated text, or a memory spike.

#### CL-SRC-11 · Files discovery must ignore
- **Expect:** `*.jsonl.save`, `memory/*.md`, `sessions-index.json` (history only) and task-output symlinks to agent
  files create no sessions.
- **Node:** both · **Severity:** minor · **Automatable:** unit

#### CL-SRC-12 · Spill files are read once and linked
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Setup:** ENV-S. Ask a sandbox Claude to `cat` a 300 KB file.
- **Expect:** `tool_results.persisted_path` set; one `artifacts` row with `origin = 'spill-file'`,
  `location = 'raw'`, pointing at the spill file's own raw record. The spill file's bytes are stored once.
- **Failure looks like:** the spill stored twice (as a raw record and as a blob).

#### CL-SRC-13 · Huge task output is capped
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Setup:** ENV-S. Ask a sandbox Claude to run in the background `yes x | head -c 2000000000`.
- **Expect:** the task-output source archives only the first and last 1 MB. `background_tasks.exit_code` parsed
  from the `[exited with code N]` marker. Memory stays under 512 MB. The file was never hashed whole.
- **Failure looks like:** a 2 GB read.

## 1.10 The drift log (DRF)

#### CL-DRF-01 · An unparsed field is observed and logged
- **Node:** both · **Severity:** major · **Automatable:** unit, integration
- **Setup:** ENV-S. Copy an ingested transcript line, add `"zzProbeField": {"a": 1}`, give it a new `uuid`,
  append it to a sandbox transcript.
- **Expect:** `schema_observations` rows for `zzProbeField` and `zzProbeField.a`, `parsed = 0`; a `schema_drift`
  row `new-path`. The reasoning-effort fields (`effort`, `perTurnEffort`, agy `executor_metadata` `10.1.28`) are
  already there with `parsed = 0` (design §11.1).
- **Failure looks like:** no observation, or the record rejected.

#### CL-DRF-02 · Unknown record type and unknown harness version
- **Steps:** append a line with `"type": "zz-new-type"`; append a valid assistant line with `"version": "9.9.9"`.
- **Expect:** drift rows `unknown-record-type` and `unknown-harness-version`. The 9.9.9 line is normalized by the
  nearest normalizer and its rows exist.
- **Node:** both · **Severity:** major · **Automatable:** unit

#### CL-DRF-03 · A type change is drift
- **Steps:** append a line where `message.usage.output_tokens` is a string.
- **Expect:** a `type-change` drift row; the row is still written (or the record's `raw_records.parse_error` names why not).
- **Node:** both · **Severity:** minor · **Automatable:** unit

#### CL-DRF-04 · Opaque subtrees do not flood the log
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Setup:** after the full import.
- **Steps:** `q "SELECT field_path, COUNT(*) FROM schema_observations GROUP BY field_path ORDER BY 2 DESC LIMIT 20"`.
- **Expect:** tool inputs, `modelUsage.<model>`, MCP arguments and agy protobuf fields appear as `x.*` paths, not
  one path per key. Open drift rows number in the tens, not thousands.
- **Failure looks like:** paths like `input.command`, `input.file_path`, … one per tool argument.

## 1.11 Crashes and restarts (CRA)

ENV-S unless stated. Appendix B.10 has the kill timing helpers.

#### CL-CRA-01 · Server restart mid-quest
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Steps:** stop the server cleanly during a running quest; start it again.
- **Expect:** the `persistent` chronicle-llm keeps its pid. Every stdout line received before the stop is in the
  store. Sessions resumed by the orchestrator follow CL-INT-05.
- **Failure looks like:** a second chronicle-llm process, or a gap in the rows.

#### CL-CRA-02 · chronicle-llm restart mid-quest
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Steps:** stop chronicle-llm cleanly (SIGTERM) while a quest runs; start the server's restart path for it, or
  restart the server.
- **Expect:** dispatch continued while it was down. After restart, the catch-up job (`startup-catch-up`) reads
  only what changed. The rows equal a B.11 dump of the same work read in one go (rebuild a copy, B.11).
- **Failure looks like:** lost lines, or every source re-read.

#### CL-CRA-03 · `kill -9` during a history batch
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Steps:** during CL-IMP-01's history phase, `kill -9` the process 10 times at random moments (B.10 loop),
  restarting each time.
- **Expect:** each restart logs `last_shutdown = unclean` and runs `quick_check` (result `ok`). The final store
  equals a clean import of the same corpus (B.11 summary diff, A.3 counts).
- **Failure looks like:** duplicates, a corrupt database, or a watermark ahead of its rows.

#### CL-CRA-04 · `kill -9` during sealing
- **Node:** both · **Severity:** blocker · **Automatable:** integration (needs a fault point; Appendix C, G8)
- **Steps:** B.10's segment watcher kills the process the moment an `archive/*.seg` file grows.
- **Expect:** on restart, the segment is truncated to `archive_segments.committed_bytes` (`stat -c %s` equals it).
  Every `raw_records` row is readable (B.7 over all rows of the affected segment). The records whose chunk was cut
  are still in `raw_tail`, and the sealer seals them again.
- **Failure looks like:** a `raw_records` row pointing past the end of a segment, or a record in neither place.

#### CL-CRA-05 · `kill -9` while a large blob is written
- **Steps:** ask a sandbox Claude to read a 5 MB image or produce a 1 MB tool output; kill during the write
  (B.10 blob watcher on `data/blobs/`).
- **Expect:** no `artifacts` row points at a missing file. A temporary file left behind is removed by the sweep.
- **Node:** both · **Severity:** major · **Automatable:** integration

#### CL-CRA-06 · Power cut
- **Node:** both · **Severity:** blocker · **Automatable:** manual-only
- **Setup:** ENV-VM with a corpus import running and a quest running.
- **Steps:** hard-reset the VM (`virsh reset`, `multipass stop --force`, or `echo b > /proc/sysrq-trigger` inside
  it). Boot; start the server.
- **Expect:** `quick_check` ok. The store may have lost its last few commits (`synchronous = NORMAL`), but every
  watermark matches its rows, so the lost work is simply read again. No spool file was deleted whose records are
  missing from the store: design §6 step 6 deletes a spool only after its records are sealed, `fsync`ed and
  checkpointed, so the spools the reset left behind are replayed once, with no duplicates. Task output lost from
  `/tmp` in the reboot is recorded nowhere (no gap table, design §16); the session's `background_tasks` row keeps
  its summary and `output_path`, and nothing claims the output was captured.
- **Failure looks like:** a corrupt database, a spool deleted but its stdout missing, a replayed spool that
  duplicates rows, or a segment longer than
  `committed_bytes` that is not truncated.

#### CL-CRA-07 · Parent-bound process exits with its server, even on `kill -9`
- **Node:** both · **Severity:** major · **Automatable:** e2e
- **Setup:** ENV-D.
- **Steps:** 1. Stop `npm run dev` with Ctrl-C. 2. Start it; `kill -9` the server process.
- **Expect:** each time, chronicle-llm exits within a second (its inherited pipe closed). No process left.
- **Failure looks like:** an orphan chronicle-llm.

#### CL-CRA-08 · Persistent process outlives the server
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Setup:** ENV-P.
- **Steps:** `npm run prod:kill`; `pgrep -af chronicle`; `npm run prod`.
- **Expect:** chronicle-llm keeps running through the kill and keeps ingesting interactive sessions; the new server
  connects to it.
- **Failure looks like:** the prod kill script also kills chronicle-llm, or a second one starts.

#### CL-CRA-09 · WAL stays bounded under a stuck reader
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Steps:** during a history import, hold a read transaction for 3 minutes:
  `sqlite3 -readonly "$DB" "BEGIN; SELECT COUNT(*) FROM events;" ` kept open with `.shell sleep 180`. Watch
  `ls -la $DB-wal` and `chronicle status`.
- **Expect:** status reports the WAL growing. Once the reader lets go, the next idle checkpoint truncates it to
  near zero, and it never stays above 64 MB after that.
- **Failure looks like:** a WAL that keeps its size after the reader is gone.

## 1.12 Homes and scopes (HOM)

#### CL-HOM-01 · Each home kind gets its scope and process mode
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Steps:** in ENV-S, ENV-D, ENV-W and ENV-L, read
  `q "SELECT key,value FROM meta WHERE key IN ('home_kind','ingest_scope','process_mode')"`.
- **Expect:** `published/all/persistent`, `dev/registered/parent-bound`, `worktree/registered/parent-bound`,
  `lane/registered/parent-bound`. ENV-P: `prod/all/persistent`.
- **Failure looks like:** a dev or worktree home with scope `all`.

#### CL-HOM-02 · Test and lane homes never touch the real `~/.claude`
- **Node:** both · **Severity:** blocker · **Automatable:** e2e
- **Setup:** ENV-L.
- **Steps:** `strace -f -e trace=openat,inotify_add_watch -p <lane chronicle pid> -o $T/lane.txt` for a whole
  walk; then `grep -c "$HOME/.claude" $T/lane.txt`.
- **Expect:** 0. Every harness path is under the lane's own transcript folder, which the lane points at through
  `CLAUDE_CONFIG_DIR` or `chronicle.harnessRoots` (CL-HOM-07).
- **Failure looks like:** any open or watch on the real roots.

#### CL-HOM-03 · A worktree's store holds only its own sessions
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Setup:** ENV-W while ENV-D also runs.
- **Steps:** dispatch one quest in each. `lsof -p <worktree chronicle pid> | grep chronicle.db`.
- **Expect:** each store holds only its own sessions. The worktree process has only its own `chronicle.db` open.
- **Failure looks like:** sessions from the other home, or a process holding another home's store.

#### CL-HOM-04 · Two homes run side by side without colliding
- **Expect:** ENV-D and ENV-P at once: separate locks, sockets and pids; each status reports its own home.
- **Node:** both · **Severity:** major · **Automatable:** integration

#### CL-HOM-05 · Prod and published each keep a full store
- **Node:** 22.17 · **Severity:** minor · **Automatable:** manual-only
- **Setup:** ENV-P plus a real published install on the same machine (or ENV-S pointed at the real roots
  read-only).
- **Expect:** both stores hold the same sessions (A.3 counts equal), each with its own archive.
- **Failure looks like:** one store missing sessions the other has.

#### CL-HOM-06 · The home kind and ingest scope can be forced
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Setup:** ENV-S, one fresh home per step, with the config written to `$SH/.dungeonmaster/config.json` BEFORE the
  first start and the corpus copied in.
- **Steps:** 1. `chronicle.homeKind: 'dev'`, `chronicle.ingestScope: 'registered'` in a home that would infer
  `published`/`all`. 2. `homeKind: 'published'`, `ingestScope: 'all'`. 3. `homeKind` `'worktree'`, `'test'` and
  `'lane'`, one home each. 4. Neither key set (inference, as CL-HOM-01). After each, read
  `q "SELECT key,value FROM meta WHERE key IN ('home_kind','ingest_scope','process_mode')"`.
- **Expect:** `meta` holds the forced values, and `process_mode` follows the kind (`persistent` for `prod` and
  `published`, `parent-bound` for `dev`, `worktree`, `test` and `lane`). The forced `registered` home imports no
  history (CL-IMP-06) even with the corpus present; the forced `all` home imports it. A forced value wins over what
  the launch would have inferred.
- **Record:** whether editing a key after the first start changes `meta` on restart, and what an invalid value
  (`'banana'`) does (Appendix C, G28).
- **Failure looks like:** the inference winning over a forced key, or `meta` showing a value the process did not use.

#### CL-HOM-07 · Harness roots resolve environment, then home config, then default
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Setup:** ENV-S, one fresh home per step. Copy the corpus to three places: `$SH/.claude` (the default),
  `$T/cfg-claude` (the config root) and `$T/env-claude` (the environment root); the same for agy
  (`$SH/.gemini/antigravity-cli`, `$T/cfg-agy`, `$T/env-agy`).
- **Steps:** 1. Nothing set. 2. `chronicle.harnessRoots.claudeCode` = `$T/cfg-claude` and
  `chronicle.harnessRoots.antigravity` = `$T/cfg-agy`. 3. Also `CLAUDE_CONFIG_DIR=$T/env-claude` and
  `DUNGEONMASTER_AGY_ROOT=$T/env-agy` in the server's environment. After each, read
  `q "SELECT harness, substr(locator, 1, 40) AS root, COUNT(*) FROM sources WHERE kind IN ('transcript-jsonl','sqlite-conversation') GROUP BY 1, 2"`
  and run B.9 on the process. Then dispatch one fresh Claude work item under step 3's environment.
- **Expect:** step 1 reads the defaults, step 2 the config roots, step 3 the environment roots with the config keys
  ignored. B.9 shows no open under a root that lost. The dispatched work item's transcript is found under
  `<CLAUDE_CONFIG_DIR>/projects/<encoded cwd>/` and the session is linked at first sighting (the project-path
  encoder honours `CLAUDE_CONFIG_DIR`, design §14).
- **Failure looks like:** a root read from the wrong level, any open under the real `~/.claude`, or a dispatched
  session written under the environment root but never found because the encoder assumed `<home>/.claude/projects`.

## 1.13 Versions sharing a home (VER)

#### CL-VER-01 · A newer server retires an older persistent process
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Setup:** ENV-S, two builds A (older) and B (newer), both phase 1. Start A; let a quest run.
- **Steps:** stop A's server (chronicle-llm keeps running); start B's server.
- **Expect:** B tells the old process to drain and exit; it finishes its batch and exits; B's process starts. No
  record is lost or duplicated across the switch (A.3, B.11).
- **Failure looks like:** two writers, or the old process killed mid-batch with lost data.

#### CL-VER-02 · An older server meets a newer process
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Steps:** with B's process running, start A's server.
- **Expect:** the design does not say (Appendix C, G15). At minimum: A does not kill B's process, and A's server
  still dispatches. Record what happens.
- **Failure looks like:** an older server replacing a newer writer.

#### CL-VER-03 · Dogfood rebuild restarts the process
- **Node:** both · **Severity:** minor · **Automatable:** manual-only
- **Setup:** ENV-P. Change a chronicle-llm file, `npm run build`, `npm run prod`.
- **Expect:** the build-hash mismatch restarts chronicle-llm (new pid); ingest continues.
- **Failure looks like:** the old code keeps running.

## 1.14 The storage cap and eviction (CAP)

ENV-S with the full Claude corpus. Set a small cap to force each tier. Each run starts from a copy of an imported
home (stop the server, `cp -a "$DM_HOME" "$T/home-imported"`, restore it before each case).

#### CL-CAP-01 · `init` writes the default cap and never overwrites it
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Steps:** 1. `HOME="$SH" dungeonmaster init`; read `$DM_HOME/config.json`. 2. Set `chronicle.maxStorageBytes` to
  `1234567890`; run `init` again. 3. Restart; `q "SELECT value FROM meta WHERE key='max_storage_bytes'"`.
- **Expect:** step 1 writes `4294967296` beside the existing `guilds`. Step 2 leaves `1234567890`. Step 3 reads
  `1234567890`.
- **Failure looks like:** the value reset, or the `guilds` key disturbed.

#### CL-CAP-02 · Invalid cap values
- **Steps:** set the cap to `"4GB"`, then `-1`, then `0`; start each time.
- **Expect:** not specified (G13). It must not crash-loop and must not evict everything. Record the behaviour.
- **Node:** 22.17 · **Severity:** major · **Automatable:** unit

#### CL-CAP-03 · Tier 1: re-readable raw data goes first
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Steps:** set the cap to 80% of the current total (`du -sb $DM_HOME/data`); restart; wait for the `evict` job.
- **Expect:** only `ingest_jobs` rows with `cause = 'evict'` and `tier = 1`, each with `source_ref` and
  `bytes_freed` set (A.55); `raw_records.evicted_at` set only for sources whose harness file still exists; every
  derived row intact (A.3 and A.15 unchanged); total under the cap after compaction. `chronicle status` reports
  space per tier, equal to the sums of `bytes_freed` per tier and to `meta.storage_bytes_by_tier`.
- **Failure looks like:** raw records evicted for a source marked `gone` (that data is now lost for good).

#### CL-CAP-04 · Tier 2: oldest sessions lose their text, keep their figures
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Steps:** set the cap low enough that tier 1 is not enough.
- **Expect:** `ingest_jobs` `evict` rows with `tier = 2` and `session_ref` set (A.55). The oldest sessions have
  `detail_state = 'summarised'`; their `events`, `content_blocks.text`,
  `tool_results.text` and attachments are gone; `llm_sessions`, `messages`, `usage`, `tool_calls`,
  `tool_call_causes`, `errors` and rollups unchanged (A.15 before/after). No newer session is trimmed while an
  older one is still `full`.
- **Failure looks like:** usage or tool-call counts change; a newer session trimmed first.

#### CL-CAP-05 · Tier 3: oldest sessions keep only trend data
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Expect:** `ingest_jobs` `evict` rows with `tier = 3` and `session_ref` set (A.55); `detail_state = 'rolled-up'`;
  per-call rows gone; `rollup_session`, `rollup_hour`, `llm_sessions` and
  `usage` byte-for-byte unchanged (A.15 and A.17 before/after).
- **Failure looks like:** any change in trend data.

#### CL-CAP-06 · Segment compaction frees the disk
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Expect:** segments with `evicted_bytes` over half their stored bytes are rewritten; the old file is deleted;
  `du -sb data/archive` drops; every remaining raw record is readable (B.7 over a sample of 500).
- **Failure looks like:** the database says evicted, but the disk is not freed.

#### CL-CAP-07 · `kill -9` during compaction
- **Steps:** B.10's segment watcher on the NEW segment during compaction.
- **Expect:** after restart, either the old pointers or the new ones hold, never a mix; no unreadable record.
- **Node:** both · **Severity:** blocker · **Automatable:** integration

#### CL-CAP-08 · A cap below the never-evicted floor
- **Steps:** set the cap to 10 MB.
- **Expect:** not specified (G13). It must not delete `usage` or rollups, and status must say the cap cannot be met.
- **Node:** both · **Severity:** major · **Automatable:** integration

#### CL-CAP-09 · Importing a corpus bigger than the cap
- **Steps:** fresh home, cap 1 GB, full 5 GB corpus.
- **Expect:** the import completes with recent sessions `full`. Note whether old history was imported and then
  evicted (churn) or never fully imported (G13).
- **Node:** both · **Severity:** major · **Automatable:** manual-only

#### CL-CAP-10 · Eviction does not slow live ingest
- **Steps:** run CL-PRF-01's live probe while an eviction job runs.
- **Expect:** live p95 still under 250 ms.
- **Node:** both · **Severity:** major · **Automatable:** manual-only

## 1.15 Secrets (SEC)

Design §13.2: before anything is written anywhere, every secret is replaced in place with
`REDACTED-SECRET-<kind>`, where kind is `api-key`, `token`, `private-key`, `password`, `auth-header` or
`connection-string`. There is no deny-list, no purge and no rescan. A secret the patterns miss stays stored; that
is an accepted gap, and the data quality review (DQ-14) hunts for misses.

ENV-S only. Use the fake canaries in Appendix B.12, one per kind. Each canary looks real and carries a unique
`ZQ<n>` tag so a grep finds it anywhere.

#### CL-SEC-01 · Every kind is replaced with its marker before it is written
- **Node:** both · **Severity:** blocker · **Automatable:** unit (patterns), integration (pipeline)
- **Steps:** 1. In a sandbox Claude session, ask it to run `printf` on each B.12 canary in one Bash call, and to
  Write a file holding all of them (make the file over 4 KB, so the tool input lands in a blob). 2. Ask it to Read
  the file back. 3. Repeat step 1 in a sandbox agy session. 4. Wait for the sealer (2 s idle). 5. Run the B.12
  grep over `chronicle.db`, its `-wal`, every segment (decompressed with B.7), every blob file, and the spools.
- **Expect:** zero canary hits. Each place a canary was now reads `REDACTED-SECRET-<kind>` with the right kind:
  the whole PEM block becomes one `private-key` marker; `Authorization: Bearer …` keeps `Authorization:` and loses
  the value; `postgres://u:p@h/db` becomes a `connection-string` marker. Text around the secret is unchanged.
- **Failure looks like:** any canary hit, or a marker of the wrong kind.

#### CL-SEC-02 · Claude's file-history is not captured, and an edited `.env` is redacted everywhere else
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Steps:** in a sandbox repo, create `.env` holding `API_KEY=<canary>`, `DB_PASSWORD=<canary>`,
  `DATABASE_URL=<canary connection string>` and `DEBUG=true`. Ask a sandbox Claude to Edit `.env` (add a line), so
  `$SH/.claude/file-history/` holds a pre-edit copy. Let chronicle-llm run for a minute, then run the B.12 grep and
  `q "SELECT COUNT(*) FROM sources WHERE locator LIKE '%/file-history/%'"`.
- **Expect:** the file-history side files are NOT captured (design §8.5, §16): no `sources` row and no raw record
  for anything under `file-history/`, and no `file_backups` table. The pre-edit copy's canaries are therefore
  nowhere in the store. The transcript's `file-history-snapshot` and `file-history-delta` records ARE archived raw
  like every other record, redacted, and no table reads them (`raw_records.record_type` like `file-history-%`).
  The Edit call's input and result in `tool_calls` and `tool_results` read `API_KEY=REDACTED-SECRET-api-key`,
  `DB_PASSWORD=REDACTED-SECRET-password`, `DATABASE_URL=REDACTED-SECRET-connection-string` and `DEBUG=true`
  unchanged, and the edit has a `file_touches` row with its path and line counts.
- **Failure looks like:** a `file-history/` source read, a canary anywhere in the store, a value kept or a key lost.

#### CL-SEC-03 · JSON lines stay valid after replacement
- **Node:** both · **Severity:** blocker · **Automatable:** unit
- **Steps:** use the B.12 canaries placed inside JSON strings, next to escaped quotes and backslashes. Decompress
  the redacted raw records (B.7) and parse each with `JSON.parse`.
- **Expect:** every redacted record parses. The marker ends at the quote or backslash; nothing after it is eaten.
  No redacted record has a `parse_error` set.
- **Failure looks like:** a record that no longer parses.

#### CL-SEC-04 · `raw_records.redactions` counts the replacements
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Steps:** A.18 for the records from CL-SEC-01 and CL-SEC-02.
- **Expect:** `redacted = 1` and `redactions` equal to the number of canaries in each original line. Records with
  no secret have `redacted = 0` and `redactions = 0`.
- **Failure looks like:** 0 on redacted records, or a count that does not match.

#### CL-SEC-05 · A rewritten source is still detected
- **Steps:** after CL-SEC-01, rewrite the canary line of the sandbox transcript in place with a different canary of
  the same length.
- **Expect:** a `record-rewritten` drift row, because `content_hash` is over the original bytes. The new canary is
  also replaced.
- **Node:** both · **Severity:** major · **Automatable:** unit

#### CL-SEC-06 · Not over-redacted
- **Node:** both · **Severity:** blocker · **Automatable:** unit
- **Expect:** git SHAs, sha256 hashes, uuids, `toolu_` ids, `msg_` ids, base64 image data and long base64 test
  fixtures stay intact. Sample 50 markers (A.18) with their surrounding text and confirm each replaced a secret.
- **Failure looks like:** a replaced id. That breaks joins and natural keys, so it is a blocker.

#### CL-SEC-07 · The marker carries no hash of the secret
- **Steps:** compute sha256, sha1 and md5 of each canary and grep the store for their first 8 hex characters.
- **Expect:** no match. The marker is exactly `REDACTED-SECRET-<kind>`.
- **Node:** 22.17 · **Severity:** major · **Automatable:** unit

#### CL-SEC-08 · A known miss is visible to the review
- **Node:** both · **Severity:** minor · **Automatable:** manual-only
- **Steps:** echo a secret in a shape no pattern knows (`ZQMISS-<32 random hex>` with no `key=` before it).
- **Expect:** it is stored as is; that is the accepted gap. DQ-14's hunt must find it; record whether it did.
- **Failure looks like:** DQ-14 does not find it, so the review's hunt is too narrow.

#### CL-SEC-09 · The spools hold unredacted bytes until archived
- **Steps:** `kill -STOP` chronicle-llm; repeat CL-SEC-01 step 1; grep the stdout spool; `kill -CONT`; grep again.
- **Expect:** the spool is `0600` inside a `0700` folder. After `CONT`, once its records are sealed, `fsync`ed and
  checkpointed (design §6 step 6), it is deleted and the canary is gone. Record that it sat on disk unredacted
  while chronicle-llm was stopped (Appendix C, G11).
- **Node:** both · **Severity:** major · **Automatable:** integration

#### CL-SEC-10 · Files and folders are private
- **Steps:** `stat -c '%a %n' "$DM_HOME"/data "$DM_HOME"/data/* "$DM_HOME"/data/*/*`.
- **Expect:** every directory `700`, every file `600`, including segments, blobs, spools, the WAL and `-shm`.
- **Node:** both · **Severity:** major · **Automatable:** integration

#### CL-SEC-11 · Agents cannot read the store directly
- **Steps:** in a Claude session in a dungeonmaster-initialised repo, ask it to `Read` `$DM_HOME/data/chronicle.db`.
- **Expect:** refused by the hook. Whether direct Bash access (`node`, `sqlite3`) is also refused is not stated;
  record it. The sanctioned way in is `dungeonmaster chronicle query` (CL-SEC-13).
- **Node:** 22.17 · **Severity:** major · **Automatable:** integration

#### CL-SEC-12 · Side files that hold secrets
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Steps:** put a canary in an agy `brain/<conv>/terminals/.env`, and note the `<pid>.<hash>.key` files beside
  `$SH/.claude/sessions/<pid>.json`. Restart; run the B.9 strace and the B.12 grep.
- **Expect:** if these files are read at all, their values are replaced and their keys kept. The design no longer
  says whether they are read; the field maps still say "never read" (G12). Claude's own
  `$SH/.claude/.credentials.json` is never opened.
- **Failure looks like:** a canary or a credential stored.

#### CL-SEC-13 · The sanctioned read path is read-only
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Steps:** run each through `HOME="$SH" dungeonmaster chronicle query "<sql>"`, from a shell and from an agent's
  Bash call: `SELECT COUNT(*) FROM llm_sessions`; a `WITH ... SELECT`; `PRAGMA user_version`; then
  `DELETE FROM events`, `INSERT INTO meta VALUES ('x','y')`, `UPDATE llm_sessions SET kind='x'`, `DROP TABLE events`,
  `PRAGMA journal_mode=DELETE`, `ATTACH DATABASE '/tmp/x.db' AS x`, and `SELECT 1; DROP TABLE events`. Run A.42
  before and after.
- **Expect:** the three read statements print one JSON object per row. Every other statement is refused with a
  clear message, the process keeps running, and the schema dump is unchanged. Text read through it is the redacted
  text.
- **Failure looks like:** any write succeeding, a held read transaction after the command exits, or a canary in its
  output.

## 1.16 Performance and the environment (PRF, ENV)

#### CL-PRF-01 · A live line is visible to a reader in under 250 ms at p95
- **Node:** both · **Severity:** major · **Automatable:** integration, manual-only
- **Steps:** Appendix B.13 appends 200 copied records with new uuids to a sandbox transcript, 1 per second, and
  times each until its event row appears. Also run A.19 after a real ENV-D quest.
- **Expect:** p95 under 250 ms in both.
- **Failure looks like:** p95 above 250 ms.

#### CL-PRF-02 · A pass over unchanged sources takes under 200 ms
- **Steps:** after a full import with nothing running, restart; read the `startup-catch-up` job's duration.
- **Expect:** under 200 ms for the stat pass over every source.
- **Node:** both · **Severity:** major · **Automatable:** integration

#### CL-PRF-03 · The first-run week finishes in under 30 s
- **Steps:** CL-IMP-01; `first-run-week` job duration.
- **Expect:** under 30 s on this machine.
- **Node:** both · **Severity:** major · **Automatable:** manual-only

#### CL-PRF-04 · Memory stays under 512 MB at any corpus size
- **Steps:** during CL-IMP-01, sample `grep VmHWM /proc/<pid>/status` at the end.
- **Expect:** under 512 MB peak, for the main process including its worker thread.
- **Node:** both · **Severity:** major · **Automatable:** manual-only

#### CL-PRF-06 · History import backs off under load
- **Steps:** during the history import, run `stress-ng --cpu $(nproc) --timeout 60s` (or a `yes > /dev/null`
  per core).
- **Expect:** history progress stalls while load per core is above about 0.7 and resumes after. Live ingest
  (CL-PRF-01 probe) keeps its budget.
- **Node:** both · **Severity:** major · **Automatable:** manual-only

#### CL-ENV-01 · Watch exhaustion falls back to the stat pass
- **Node:** both · **Severity:** major · **Automatable:** integration (EMFILE), manual-only (ENOSPC)
- **Steps:** EMFILE: `prlimit --pid <chronicle pid> --nofile=40:40`, then start three sandbox sessions. ENOSPC: in
  ENV-VM, `sysctl fs.inotify.max_user_watches=200` and `fs.inotify.max_user_instances` near the current use, then
  restart and start sessions.
- **Expect:** the process logs the failure (where is Appendix C, G23) and still ingests the sessions through the
  timed stat pass, late but complete, with `chronicle status` showing the lag. No row records the fallback: there
  is no `capture_gaps` table (design §16). When limits recover, record whether it returns to watches.
- **Failure looks like:** sessions never ingested, or a crash.

#### CL-ENV-02 · Watches are not recursive and expire
- **Steps:** `ls -l /proc/<pid>/fd | grep -c inotify` and `cat /proc/<pid>/fdinfo/<inotify fd> | grep -c wd`
  before a session, during it, and 11 minutes after it went quiet.
- **Expect:** watches are added for the active session's file and `subagents/` folder only, and removed after 10
  minutes of quiet. The count never grows with the number of project folders on disk beyond one per folder.
- **Node:** both · **Severity:** major · **Automatable:** integration

#### CL-ENV-03 · Disk full during a batch
- **Node:** both · **Severity:** blocker · **Automatable:** manual-only
- **Setup:** ENV-VM or a small filesystem: `sudo mount -t tmpfs -o size=300m tmpfs $T/small`, then make
  `$DM_HOME/data` a symlink into it before the first start.
- **Steps:** import until the disk fills; then free 100 MB.
- **Expect:** batches fail cleanly (rolled back); the watermark does not move; status and the log say "disk full".
  After space returns, ingest resumes with no gap and no corruption (`quick_check` ok).
- **Failure looks like:** a torn segment, a watermark past its rows, or a crash loop.

#### CL-ENV-04 · Disk full during sealing and blob writes
- **Steps:** as CL-ENV-03, timed so the fill happens while segments seal and a large blob is written.
- **Expect:** `committed_bytes` never exceeds the bytes on disk; no artifact row points at a missing file.
- **Node:** both · **Severity:** blocker · **Automatable:** manual-only

## 1.17 Parity and the real-quest counts (PAR)

#### CL-PAR-01 · The parity script matches today's replay for every quest on disk
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Setup:** ENV-S with the frozen corpus and every quest folder from ENV-P copied in read-only.
- **Steps:** run the parity script (design §11 phase 1; its name is not in the design).
- **Expect:** for every quest, the chat entries built from the tables equal `chatHistoryReplayBroker`'s output, entry
  for entry: same count, same order, same text, same tool status. The three quests that fail today's strict
  contract (`c8171a64`, `1dac5395`, `b4c31633`) are included once phase 0 makes them load.
- **Failure looks like:** any quest with a difference. The script must print the first differing entry.

#### CL-PAR-02 · Quest 1918a5ee gives the census counts
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Setup:** ENV-S with the frozen 1918a5ee copy (B.2), its `claude-projects/` as the harness root.
- **Steps:** 1. Re-derive the counts from the frozen copy with `tmp/q1918-failures-scan.py` and the scripts beside
  it, and store them as `expected.json` ("Before anything else"). 2. Run A.21 on the store.
- **Expect:** A.21 equals `expected.json`: the number of tool results, `is_error` failures, hidden ward reds
  (`ward-red-hidden`), `Bash(sed:*)` permission denials, sessions with at least one failure, and each cause count
  `session-health-plan.md` lists that the scripts reproduce (grep/find hook blocks, `pre-folder-detail`,
  `pre-edit-lint`, `quest-work` refusals, ward reds and how many are slow-tests-only). The numbers are whatever the
  census script gives on the frozen copy, which holds 40 sessions (design §10).
- **Failure looks like:** any count off. Find the differing calls with A.21's detail query.

## 1.18 Walking every table (TBL)

Run this walk once per Node round, on ENV-S after CL-IMP-02 and one live quest (CL-LIV-03), with the agy cases
done. Each row says how to check the table by hand. Appendix A has the full queries; `B.6` is the on-disk census.

### Ingest and provenance

| Table | Check | Correct looks like | Cross-check against |
|---|---|---|---|
| `meta` | `q "SELECT * FROM meta"` | home kind, scope and process mode as CL-HOM-01; `schema_state = ready`; `next_change_seq` above every `change_seq` in the store (A.22); `max_storage_bytes` equal to the config | `$DM_HOME/config.json` |
| `schema_migrations` | `q "SELECT * FROM schema_migrations"` | one row per migration; `version` = `PRAGMA user_version` | `sha256sum` of the shipped migration file vs `checksum` |
| `sources` | A.1 | a row per transcript, sub-agent meta, spill file, journal, agy db, link file, message file, `history.jsonl`, CLI log, session-registry file, spool and the outbox; none in `error`; `gone` only for deleted files | B.6 file counts per kind |
| `archive_segments` | `q "SELECT path, committed_bytes, evicted_bytes, sealed, format_version FROM archive_segments"` | after a clean stop, file size = `committed_bytes` | `stat -c %s <path>` |
| `raw_records` | A.23 | per JSONL source: rows = complete lines up to the watermark; per agy db: one row per step, gen and executor row, plus one per revision (`revision_expected = 1` on agy rewrites, none on Claude, `0` only with a matching drift row); `parse_error` and `parse_error_normalizer` set only on lines that really are broken | `wc -l`; `SELECT COUNT(*) FROM steps` in a copy of the agy db (B.6); the raw line of each parse error (B.7) |
| `raw_tail` | `q "SELECT COUNT(*), SUM(length(bytes)) FROM raw_tail"` | near zero after 2 s idle; no row whose `raw_records.segment_ref` is set | — |
| `schema_observations` | A.24 | every field path in the field maps; reasoning-effort paths `parsed = 0`; opaque data as `x.*` | field maps |
| `schema_drift` | A.24 | `new-path` for the effort fields; every other open row explainable | — |
| `ingest_jobs` | `q "SELECT cause, COUNT(*), SUM(errors) FROM ingest_jobs GROUP BY 1"`; A.55 | `first-run-week`, `history`, `live`, `startup-catch-up`; all finished; `evict` rows only after the CAP cases, one per tier action, and their `bytes_freed` adds up to the drop in `du` | `chronicle status`; `du -sb` before and after |
| `normalizer_state` | `q "SELECT COUNT(*) FROM normalizer_state"` | only sessions still running or with calls awaiting results | A.7 `end_state` |
| `harness_versions` | `q "SELECT * FROM harness_versions"` | every Claude `version` seen in records; agy eras as CL-AGY-07 | B.6 distinct `version` values |
| `harness_imports` | A.2 | one row per harness that has data; `state` `done` after the import, with `recent_done_at` and `history_done_at` set | CL-IMP-01, CL-IMP-04 |

### Sessions and links

| Table | Check | Correct looks like | Cross-check against |
|---|---|---|---|
| `llm_sessions` | A.3, A.6 | one per transcript file and agy db; `root_session_ref = id` for roots; `spawn_depth` matches `.meta.json`; stubs resolved | B.6; `.meta.json` `spawnDepth`, `parentAgentId`, `toolUseId` |
| `quests`, `work_items` | A.13 | equal to every `quest.json` | B.8 |
| `llm_sessions` link columns | `q "SELECT linked_by, COUNT(*), SUM(quest_ref IS NOT NULL), SUM(work_item_ref IS NOT NULL) FROM llm_sessions GROUP BY 1"` | every work item `sessionId` has `quest_ref` and `work_item_ref`; `linked_by` is `dispatcher`, `inherited` (every sub-agent of a linked parent), `quest-file` or `inferred`; interactive sessions with no quest have all three NULL | `quest.json` `workItems[].sessionId`, `sessions[]` |
| `dispatch_events` | `q "SELECT kind, COUNT(*) FROM dispatch_events GROUP BY 1"` | each `spawn` preceded by a `register` and followed by an `exit` | the dispatch spool lines in the archive |
| `llm_sessions` init columns, `session_results` | `q "SELECT s.natural_key, s.init_tools_json IS NOT NULL AS has_init, s.api_key_source, COUNT(r.id) AS results FROM llm_sessions s LEFT JOIN session_results r ON r.session_ref=s.id WHERE s.id IN (SELECT session_ref FROM dispatch_events WHERE session_ref IS NOT NULL) GROUP BY s.id"` | every dispatched Claude session has its LAST init line's facts (`init_*_json`, `api_key_source`) and at least one result row; interactive sessions have neither | stdout spool `init` and `result` lines |

### What happened inside a session

Pick three sessions for these: one main quest session with sub-agents, one interactive session, one agy
conversation. Compare each with B.6's per-file census (`--session <file>`).

| Table | Correct looks like | Cross-check against |
|---|---|---|
| `turns` | one per prompt-bearing user record (Claude) or `executor_metadata` row (agy); `duration_ms` near `system/turn_duration` | grep `"promptId"` changes in the file |
| `messages` | assistant count = distinct `message.id`; user/system count = their records | B.6 |
| `events` | one per record with a `uuid`, plus metadata lines; copies have `copied_from_event_ref`; kinds `agent-message` and `intervention` as CL-MSG-01 to CL-MSG-06 | `wc -l` minus metadata-only lines |
| `content_blocks` | one per `message.content[]` block; `text` NULL exactly when over 4,096 bytes, then `blob_ref` set; `text_chars` = full length | A.25 |
| `tool_calls` | one per distinct `toolu_` id (Claude) or type-132 step (agy); `status` matches the result | B.6 |
| `tool_results` | one per call that got a result; `is_error` matches the record | B.6 |
| `tool_call_causes` | a row for every call whose status is not `ok`, plus soft failures; causes from the §8.1B list only | A.26 |
| `tool_results.details_json` (`ward.*`) | a Bash call that ran ward has `ward.runId`, `exitCode`, `checks`, `slowTestsOnly`; matches ward's own output (CL-QMR-05, A.56) | `npm run ward -- detail <runId>` |
| `file_touches` | absolute paths; one row per (call, path, op) | Edit/Write/Read inputs |
| `background_tasks` | one per background Bash, sub-agent, workflow, agy task | `<task-notification>` records |
| `usage` | one per assistant API message; totals equal B.5 | B.5 census |
| `rollup_session.last_reported_cost_usd` | the newest of the last `cost-state` `totalCostUSD` and the last stdout `result` `total_cost_usd`, with `last_reported_at`; no snapshot history exists (design §16) | the file's last `cost-state` line (B.7 from the archive) and the spool's last `result` |
| `errors` | API errors, rate limits (`RESOURCE_EXHAUSTED` on agy), agy type-17 steps | grep `isApiErrorMessage`, `"type":"system"` error lines |
| `compactions` | one per `compact_boundary` / agy CHECKPOINT | grep `compact_boundary` |
| `events` kind `intervention` | one per queue operation, interrupt, rejection, denial, mode change, slash command, killed agents, hook block; `details_json` `{source, refId, reason}` (CL-MSG-06, A.52) | grep `queue-operation` |
| `hook_runs` | one per hook attachment; agy `deny` entries | grep `hook_` attachment types |
| `attachments` | one row per attachment record, and one row PER PART of an array attachment (`part_idx`, `part_kind`, natural key plus `:<idx>`), each part's text deduped as its own blob | grep `"type":"attachment"` |
| `events` kind `agent-message` | one ARRIVAL per delivered message, in the recipient session: agy one per `messages/*.json` that was delivered (2,019 files in the census); Claude one per delivered `SendMessage` (about 7% of sends never arrive); `link_key` joins the send (CL-MSG-01 to CL-MSG-04, A.50) | `ls brain/*/.system_generated/messages/*.json \| wc -l` |
| `rate_limit_samples` | one per stdout `rate_limit_event` | spool |
| `artifacts`, `blob_tail` | `location` `segment` under 64 KB, `file` above (file exists at `file_path`), `raw` for spill files; `blob_tail` drained when idle | `ls $DM_HOME/data/blobs/*/*/` |
| `rollup_session`, `rollup_hour`, `rollup_dirty` | equal to recomputation (A.17); `rollup_dirty` empty when idle; `rollup_session.last_reported_cost_usd` as in its row above | A.17 |
| `tombstones` | rows only after re-ingests or re-normalizes; `tombstone_floor_seq` rises daily | A.22 |
| `rollup_quest`, `timeline` (views) | `rollup_quest` per quest equals the A.10 sums; `timeline` returns rows in `seq` order | A.10 |

`server_errors` and `model_calls` stay empty until phase 5, and `rate_limit_samples` holds only stdout
`rate_limit_event` rows until phase 5's rate-limits spool. The twelve tables design §16 trimmed and
`git_operations` do not exist: git facts and a Bash ward run live in `tool_results.details_json`, a ward step in
`work_items.ward_*`. Claude's `file-history/` side files are not captured, so no table has a counterpart for them.

---

# Phase 1-DQ: the data quality review

Run after phase 1's import and live cases pass, on ENV-S, and again on the Node 24 round. A person or an LLM reads
the populated tables and judges whether the data makes sense. An LLM reviewer reads the store through
`dungeonmaster chronicle query "<sql>"` (design §7), the read-only path, because agents get no `Read` of
`<home>/data/**` (design §13.2). Each query in Appendix A runs through it; the user can also run the queries and
hand the output over.

Each item has a query in Appendix A and a judgement. Record for each: the query output (trimmed), the verdict, and
for any failure, three example rows with their raw records (B.7).

| # | Question | Query | Pass when |
|---|---|---|---|
| DQ-01 | Is every table that should hold data populated? | A.27 | every phase 1 table non-empty except `server_errors` and `model_calls`; none of the twelve trimmed tables exists; `evict` rows appear in `ingest_jobs` only after an eviction |
| DQ-02 | One session per transcript file and agy db? | A.3 vs B.6 | counts equal per harness and kind |
| DQ-03 | Messages vs usage | A.28 | every non-synthetic assistant message has exactly one `usage` row; no `usage` row without a message; no `usage` on user/system messages |
| DQ-04 | Messages vs events vs content blocks | A.28 | every assistant message has at least one event and one block; events with no blocks are only kinds that carry none (`meta`, `intervention`); every `agent-message` arrival has its body block |
| DQ-05 | Tool calls vs results | A.29 | every non-stub call with status `ok`, `error`, `denied` or `interrupted` has a result; `orphaned` exactly when none; results without a call are stubs only |
| DQ-06 | Causes complete and valid | A.26 | every non-`ok` call has a cause; every cause is in the §8.1B list; `soft_failure` only on `ok` calls |
| DQ-07 | Stubs that never resolved | A.30 | each remaining stub explained: its file deleted before import, or a `continued-in` successor never written |
| DQ-08 | Nulls where values belong | A.31 | no non-stub session without `started_at`; no assistant message without `model`; no non-stub call named `(unresolved)` |
| DQ-09 | Duplicates | A.9, A.32 | each `native_uuid` has one original; no two sessions own the same message text at the same `ts` |
| DQ-10 | Links | A.16, A.33 | every sub-agent's `quest_ref` and `work_item_ref` equal its parent's, with `linked_by = 'inherited'`; no parent cycles; `spawn_depth` = depth in the tree; `dispatcher`, `quest-file` and `inferred` links agree with `quest.json` |
| DQ-11 | Timestamps | A.34 | all times between 2025-01-01 and now + 1 h; `ended_at >= started_at`; no call with negative latency or over 24 h; `events.ts` follows `seq` within each session except across a resume |
| DQ-12 | Durations | A.34 | `turns.duration_ms` near `ended_at - started_at`; `rollup_session.active_ms` no more than the session's wall span |
| DQ-13 | Totals vs the harness's own figures | A.35, B.5, B.7 | per non-resumed root tree: estimated cost (`usage` × pricing, `rollup_session.est_cost_usd`) within 5% of the root's `rollup_session.last_reported_cost_usd` (the haiku title model appears only in the reported figure); output tokens within 1.5% of the transcript's own last `cost-state` record, read from the raw archive with B.7 (`raw_records.record_type = 'cost-state'`), because no table holds it any more; resumed sessions listed separately |
| DQ-14 | Hunt for missed secrets, and for over-redaction | A.18, A.43, B.12 | A.43's hunt over every text column and a sample of decompressed archive records finds no secret-shaped string left (provider prefixes such as `sk-ant-`, `sk-`, `AKIA`, `ghp_`, `xoxb-`, `AIza`; `-----BEGIN`; `Bearer `; `://user:pass@`; long high-entropy strings after `key`, `secret`, `token`, `password`); every hit found is written up as a pattern to add. A sample of 50 `REDACTED-SECRET-` markers were all secrets, not ids. Records with `redactions > 0` are spread as expected (env files, auth headers), not concentrated on one id-like field. Misses are an accepted gap (design §13.2), but each one found is reported. |
| DQ-15 | Drift log sane | A.24, `chronicle drift` | effort fields `parsed = 0` with `new-path` rows; no path flood; every open row understood; `chronicle drift` lists the same open rows as A.24 |
| DQ-16 | Parse errors real | A.23's parse-error query | each `raw_records` row with `parse_error` is a line truly unreadable, and `parse_error_normalizer` names the normalizer that failed |
| DQ-17 | Archive complete and readable | A.23, B.7 | every `raw_records` row is in `raw_tail` or a segment, or `evicted_at` is set; 500 random unredacted records hash to `content_hash` |
| DQ-18 | Value shapes | A.20, A.36 | booleans integer 0/1; every `*_json` passes `json_valid`; every preview at most 300 characters; inline texts at most 4,096 bytes |
| DQ-19 | Natural keys follow the recipes | A.37 | every key matches its pattern in `schema.md` |
| DQ-20 | Rollups equal recomputation | A.17 | zero differing sessions and hours |
| DQ-21 | Will it survive a re-normalize? | B.11 + `chronicle rebuild` on a copy of the home | the dump before and after is equal except integer ids and `change_seq` |
| DQ-22 | Will it survive eviction? | CL-CAP-05 on a copy | `usage`, `llm_sessions` and rollups unchanged; trend sums (A.17 totals) equal |
| DQ-23 | Read three sessions end to end | A.38 (the timeline of one session) next to the transcript in an editor | every user prompt, answer, tool call and result in the file is in the timeline, in order, with no extras; sub-agents appear under the right call |
| DQ-24 | Agent messages join | A.50, A.51 | every `agent-message` arrival sits in the recipient session, its `peerSessionKey` is an existing `llm_sessions.natural_key`, and it has a body block; every send with a `link_key` appears exactly once in the LEFT JOIN; sends without an arrival are the minority (about 7% for Claude, near 0 for agy); `link_key` hashes match a recomputation on 10 samples |
| DQ-25 | Interventions are events, never arrivals | A.52 | every `intervention` has a subtype from the list and `details_json` with `source`; no `raw_id` yields both an `agent-message` and an `intervention`; no `steer` subtype exists |

**The judgement.** The checklist is necessary, not sufficient. For DQ-23 the reviewer reads the rows as a story:
does this session say what the transcript says? Write down anything odd, even if no query flags it.

---

# Phase 1b: the reasoning-effort migration

Design §11.1. Phase 1 left reasoning effort untranslated on purpose. Phase 1b adds `messages.effort` in migration
`0002`, bumps both normalizers, and re-normalizes from the archive. This phase is also where every migration and
version case runs, because it is the first time a real second schema exists.

Setup for all EFF cases: ENV-S with the phase 1 store from the data quality review. Before upgrading, stop the
server and copy the home: `cp -a "$DM_HOME" "$T/home-v1"`. Each case restores from that copy.

#### CL-EFF-01 · Phase 1 baseline: effort is drift, and there is no column
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Steps:** A.39 on the phase 1 store.
- **Expect:** `schema_observations` rows for Claude `effort` and `perTurnEffort` and the agy `executor_metadata`
  `10.1.28` path, all `parsed = 0`, with counts in proportion to the corpus (the census saw 415,632 and 321,322
  Claude records). `schema_drift` `new-path` rows for each. `PRAGMA table_info(messages)` has no `effort`. agy
  `messages.model` came from `gen_metadata` field `1.19`.
- **Failure looks like:** the fields parsed already, or not observed at all.

#### CL-EFF-02 · The upgrade migrates without a hand step, and readers wait
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Steps:** 1. Start the poller from CL-SCH-02. 2. Start the phase 1b build.
- **Expect:** `schema_state` goes `migrating` then `ready`. `PRAGMA user_version` is 2. `schema_migrations` has a
  `0002` row with checksum and duration. `messages.effort` exists. Nothing was asked of the user.
- **Failure looks like:** a prompt, a refusal, or a reader error during the migration.

#### CL-EFF-03 · Only the bumped normalizers' sessions are re-normalized, from the archive
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Steps:** A.40 after the migration; B.11 dumps before (from `home-v1`) and after.
- **Expect:** `ingest_jobs` cause `reingest:normalizer-bump` (G20 notes the spelling). Every Claude and agy session
  re-normalized once, in one transaction each; dungeonmaster first-party sessions untouched. Natural keys and
  integer ids unchanged; no tombstones unless the new normalizer drops a row on purpose. The B.11 diff shows only
  the new `effort` values, the `normalizer` versions and `change_seq`.
- **Failure looks like:** sessions read from the harness files instead of the archive, new ids, or other columns
  changed.

#### CL-EFF-04 · `messages.effort` holds the right values
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Steps:** A.41 samples 20 Claude and 20 agy messages with their raw records.
- **Expect:** Claude: the record's `effort` or `perTurnEffort` (the design does not say which wins when both are
  present and differ; record it). agy: the suffix of `executor_metadata` `10.1.28` of the turn that holds the
  generation, as in `gemini-3.8-flash-medium` → `medium`. Values only `low`, `medium`, `high`, `xhigh`. NULL where
  the raw record has no field (older versions), and on user and system messages.
- **Failure looks like:** a wrong value, or the agy model string stored instead of its suffix.

#### CL-EFF-05 · Sessions whose harness files are gone are re-normalized too
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Setup:** in `home-v1`'s sandbox, delete the files of three ingested sessions before upgrading (CL-SRC-01).
- **Expect:** those sessions have `effort` filled from the archive.
- **Failure looks like:** the gone sessions skipped.

#### CL-EFF-06 · Drift resolves
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Steps:** A.39 again; list the open rows with `HOME="$SH" dungeonmaster chronicle drift`; acknowledge the effort
  rows with `dungeonmaster chronicle drift --ack <id>` (design §7), and on a copy of the home clear every open row
  with `--ack-all`; restart; ingest a new session.
- **Expect:** the effort paths are `parsed = 1`. After `--ack`, each acknowledged row has `acknowledged_at` set
  (A.24) and `chronicle drift` no longer lists it; `--ack-all` leaves no open row. No new drift row for the effort
  paths appears with the new session.
- **Failure looks like:** the rows reappear.

#### CL-EFF-07 · A live quest during the re-normalize
- **Node:** both · **Severity:** major · **Automatable:** manual-only
- **Steps:** start a quest (CL-LIV setup) just before the upgrade starts re-normalizing.
- **Expect:** live rows keep their budget (CL-PRF-01 probe), and the live session ends with no duplicates and
  `effort` filled.
- **Failure looks like:** live ingest stalls for the length of the re-normalize.

#### CL-EFF-08 · `kill -9` during the re-normalize
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Steps:** kill the process three times during the job, restarting each time.
- **Expect:** each session is either fully old or fully new, never half (A.40 per session). The job resumes and
  finishes once.
- **Failure looks like:** a session with some messages re-derived and some missing.

#### CL-EFF-09 · A fresh v2 install equals an upgraded one
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Steps:** start the 1b build on an empty home; compare `sqlite_master` with the upgraded store (A.42).
- **Expect:** identical tables, columns, indexes and views.
- **Failure looks like:** any difference.

#### CL-EFF-10 · A failed migration rolls back and refuses to start
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Setup:** a throwaway build whose `0002` fails half way (for example, a second statement with a syntax error),
  made in ENV-W.
- **Steps:** restore `home-v1`; start that build; start a quest.
- **Expect:** `user_version` stays 1; no `effort` column; `schema_state = 'failed'`; the process log says which
  migration failed and why (G23: the log's location is not in the design); the process does not run. The server
  still dispatches, and the spools keep growing. Then start the good build: it migrates and catches up from the
  spools with nothing lost.
- **Failure looks like:** a half-applied schema, or dispatch blocked.

#### CL-EFF-11 · A downgrade is refused
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Steps:** start the phase 1 build against the migrated v2 store.
- **Expect:** it refuses to write, says a newer version wrote this store, and sets or reports `too-new`. The store is
  unchanged (A.42 and A.3 equal before and after).
- **Failure looks like:** the old build writes rows without `effort`, or "repairs" the schema.

#### CL-EFF-12 · An edited released migration is caught
- **Steps:** a throwaway build whose `0001-initial` file differs by one comment; start it on the v2 store.
- **Expect:** the checksum mismatch is reported and the process refuses to start.
- **Node:** both · **Severity:** major · **Automatable:** unit

#### CL-EFF-13 · Mixed versions on the published home
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Setup:** two scratch consumer repos, one on the phase 1 build and one on 1b, both started with `HOME="$SH"`.
- **Steps:** start the phase 1 repo's server, then the 1b repo's; stop the 1b one; restart the phase 1 one.
- **Expect:** CL-VER-01 on the way up. On the way down, the phase 1 server finds a v2 store: it does not migrate,
  does not write, and still dispatches; its readers stay within `reader_compat` (0002 is additive, so it does not
  raise it).
- **Failure looks like:** two writers, or the phase 1 server corrupting the v2 store.

#### CL-EFF-14 · `chronicle backup` and `chronicle rebuild` on the v2 store
- **Steps:** `chronicle backup`; open the snapshot read-only and run A.3. Then `chronicle rebuild` on a copy and run
  B.11.
- **Expect:** the snapshot equals the store at that moment. The rebuild equals the store (DQ-21).
- **Node:** both · **Severity:** major · **Automatable:** integration

---

# Phase 2: server reads, quest health, View Context, `get-quest-health`

Delivers: the query module and its contracts, the reader worker thread, the change-feed socket, the health
endpoints and right panel, the drill-down, View Context, and the `get-quest-health` MCP tool. It also retires
`usage-ledger.json` and its transcript scanner: the quota display and the dispatch hold read `usage` instead
(design §11, `followup-home-state-to-db.md`; section 2.4). From here on the browser is the verdict.

Setup for the HLT cases: ENV-S with the frozen 1918a5ee copy (Appendix B.2), and a live quest for the cases that
need one. Open the quest in a real browser, or drive it with `dungeonmaster siegelense run` against an ENV-L lane
for the automatable form.

Done when: the session-health plan's acceptance holds, and every number in the UI equals the SQL behind it.

## 2.1 What the server reads, table by table

Each feature reads named tables through the query module. Check each one by putting the UI or API figure next to
the SQL.

| Feature | Reads | Check by hand |
|---|---|---|
| Health counts | `tool_calls`, `tool_results`, `tool_call_causes`, `errors`, `rollup_quest` | A.21 for the quest; the panel's total, rate and per-cause rows equal it |
| Drill-down list | `tool_calls` joined to `tool_call_causes`, `tool_results`, `llm_sessions` and `work_items` through `llm_sessions.quest_ref` and `work_item_ref` | A.44 for one cause: same instances, same order (newest first), same first 300 characters |
| Full error text | `tool_results.text`, or the `artifacts` blob over 4 KB | the expanded text's length equals `tool_results.text_chars` |
| View Context | the `timeline` view, a window around one `tool_call_ref` | A.45: the 40 rows before and 20 after equal the drawer's entries |
| Badges | `work_items` `ward_*`, `tool_results.details_json` `ward.*`, `tool_calls` (refusal runs), `llm_sessions.end_state` | A.46 |
| Cost | `usage` × the harness pricing, `rollup_session` | A.10 `est_cost` |
| Change feed | every change-fed table's `change_seq`, `tombstones` | A.22 before and after an update; the panel moved without a reload |
| Quota display and dispatch hold | `usage`, `rollup_hour` | A.53 (CL-LDG-01, CL-LDG-02) |

#### CL-SRV-01 · Only camelCase contracts and natural keys leave the server
- **Node:** both · **Severity:** major · **Automatable:** unit, integration
- **Steps:** `curl -s localhost:4900/api/quests/<quest>/health | python3 -m json.tool`; then the window endpoint
  `GET /api/llm-sessions/<session>/window?toolCallId=<key>&before=40&after=20`.
- **Expect:** every property is camelCase. Every id is a natural key string (`claude-code:toolu_…`), never an
  integer. `toolCallId` equals `tool_calls.natural_key`. Times are ISO strings.
- **Failure looks like:** an `id: 1234` or a `session_ref` on the wire.

#### CL-SRV-02 · The API stays fast during a heavy import
- **Node:** both · **Severity:** blocker · **Automatable:** manual-only
- **Setup:** ENV-S, fresh home, full corpus, `DUNGEONMASTER_REQUEST_LOG=1` in the server's env.
- **Steps:** during the history import, request `/api/guilds` and the health endpoint 200 times; repeat when idle.
- **Expect:** the `[http]` duration lines show p95 during import within 2× of idle, and no request over 250 ms. The
  reader runs in a worker thread, so a 735 ms cold query never blocks the event loop.
- **Failure looks like:** API requests stalling behind the import.

#### CL-SRV-03 · Every endpoint is paged
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Setup:** the frozen `c8171a64` copy (112 sub-agents).
- **Steps:** request each health and window endpoint with no paging parameters.
- **Expect:** each response is bounded (pages of 50 in the drill-down), and says how to get the next page.
- **Failure looks like:** a response holding every row.

#### CL-SRV-04 · The change feed reaches readers, with and without the socket
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Steps:** 1. With the health panel open on a running quest, trigger a failure (ask the quest's chat to run
  `grep foo`, which the hook blocks). 2. Remove the chronicle-llm socket file from the home while the process
  runs, then trigger another failure.
- **Expect:** 1: the panel's `hook-refusal` count rises within a second, no reload. 2: it still rises, within the
  `PRAGMA data_version` poll interval. Restarting chronicle-llm restores the socket.
- **Failure looks like:** the panel only updates on reload.

#### CL-SRV-05 · Store states show in the UI
- **Node:** both · **Severity:** major · **Automatable:** e2e
- **Steps:** with the health panel open: (a) start the 1b build on a v1 store (`migrating`); (b) start a phase 2
  server on a store from a newer build (`too-new`); (c) a failed migration (CL-EFF-10); (d) chronicle-llm stopped.
- **Expect:** (a) "upgrading data"; (b) read-only data with a notice; (c) and (d) "history unavailable" while
  dispatch still works. No blank panel, no console error, in any of them.
- **Failure looks like:** a spinner forever, or an error stack in the console.

#### CL-SRV-06 · Readers never hold a transaction open
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Steps:** keep two browser tabs on a busy quest for 10 minutes; watch `ls -la $DB-wal` and `chronicle status`.
- **Expect:** the WAL returns to near zero after each idle checkpoint.
- **Failure looks like:** the WAL growing while only readers are attached.

#### CL-SRV-07 · A raised `reader_compat` stops an older reader
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Setup:** needs a throwaway build with a non-additive migration. Skip and record "not applicable" until one
  exists.
- **Expect:** the older server shows a clear "data written by a newer version" state and does not query.

## 2.2 Quest health (HLT)

#### CL-HLT-01 · `get-quest-health` gives quest 1918a5ee's counts
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Steps:** from a Claude session with the sandbox MCP: `get-quest-health({ questId: '1918a5ee-8bce-4f3d-a4ab-f7ff51f45878' })`.
- **Expect:** the summary equals CL-PAR-02 (`expected.json`, the counts the census script gives on the frozen
  copy): tool results, `is_error` failures, hidden ward reds and sed denials; the failure rate; resumes; and a cost
  equal to A.10's `est_cost` for the frozen copy.
- **Failure looks like:** any count different from the SQL and the census.

#### CL-HLT-02 · The MCP output is capped and shaped
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Steps:** call with `sections: ['failures']`; then `cause: 'permission-denied', limit: 5`; then
  `cause: 'hook-refusal', limit: 500`.
- **Expect:** grouped causes with 2 examples each; exactly 5 instances; a capped list that says it was capped. Each
  response stays under the tool-output size that would spill to a file.
- **Failure looks like:** an uncapped dump.

#### CL-HLT-03 · The MCP tool never reads a transcript
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Steps:** save CL-HLT-01's output; `mv "$SH/.claude/projects" "$SH/.claude/projects.away"`; call again; move it
  back.
- **Expect:** byte-identical output, and fast (under 1 s).
- **Failure looks like:** an error or a different answer.

#### CL-HLT-04 · The right panel shows the counts above the coverage summary
- **Node:** 22.17 · **Severity:** blocker · **Automatable:** e2e
- **Steps:** open quest 1918a5ee in the browser; execution phase; right half.
- **Expect:** the health section sits ABOVE the coverage summary. It shows the total failed calls, the rate, one row
  per cause with its count, and badges. Every number equals CL-HLT-01. No console error.
- **Failure looks like:** the panel below the coverage summary, missing causes, or numbers that differ from the MCP.

#### CL-HLT-05 · Counts rise live while a quest runs
- **Node:** both · **Severity:** blocker · **Automatable:** e2e
- **Setup:** ENV-S, a live quest with the panel open.
- **Steps:** in the quest's chat, ask the agent to run `grep -r foo .` (hook refusal), `sed -n 1p README.md`
  (permission denial, if the rule exists in the sandbox settings), and an MCP call with a bad argument.
- **Expect:** each matching cause row rises within a second, marked as still rising. No reload.
- **Failure looks like:** counts that change only on reload.

#### CL-HLT-06 · The drill-down lists every instance, newest first
- **Node:** 22.17 · **Severity:** major · **Automatable:** e2e
- **Steps:** click `hook-refusal`; page through; expand one instance whose error text is over 4 KB.
- **Expect:** pages of 50, newest first. Each instance shows the work item and role, the time, the tool input
  summary and the error preview. Expanding loads the full text (length equals `text_chars`). The total across
  pages equals the cause's count.
- **Failure looks like:** a missing page, a duplicate instance, or a truncated "full" text.

#### CL-HLT-07 · View Context opens on the failed call
- **Node:** 22.17 · **Severity:** blocker · **Automatable:** e2e
- **Steps:** on a drill-down instance, click View Context. Scroll up past the first 40 entries and down past the
  last 20. Repeat on an instance from a sub-agent, and on one from a session whose harness files are gone
  (CL-SRC-01).
- **Expect:** a side drawer over the right half; the quest execution stays visible on the left. The failed call is
  scrolled into view and highlighted. Entries match A.45. Scrolling loads more in each direction. The sub-agent
  and gone-file cases work the same.
- **Failure looks like:** the drawer opens at the bottom, highlights nothing, or is blank for a gone file.

#### CL-HLT-08 · Badges for ward verdict mismatch, refusal loop and killed session
- **Node:** 22.17 · **Severity:** major · **Automatable:** e2e
- **Expect:** on the frozen 1918a5ee: a ward verdict mismatch where a ward run's exit code disagrees with its
  checks; a refusal loop of repeated `quest-work` refusals in a planner session; a killed-session badge where
  `end_state` is `killed`. The expected badges are what the census scripts give on the frozen copy (the earlier
  census had run `a87e3c0a`, exit 1 with every check passing, and 7 `quest-work` refusals in session `97eb9b67`;
  confirm they appear). A.46 agrees.
- **Failure looks like:** a missing badge, or one that A.46 does not support.

#### CL-HLT-09 · Soft failures count as hidden ward reds, not as failed calls
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Steps:** in a live quest, ask the agent to run ward on a failing file piped through `| tail -5`.
- **Expect:** a `ward-red-hidden` instance with sub-cause `ward`. The failed-call rate does not count it. The
  call's result `details_json` carries the `softFailure` and `ward.*` facts (A.56).
- **Failure looks like:** the soft failure missing, or counted twice.

#### CL-HLT-10 · agy failures use the same vocabulary
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Setup:** a quest whose sessions include agy ones (CL-AGY-11), or the agy corpus linked by hand to a sandbox
  quest through `quest.json` `sessions[]`.
- **Expect:** `cancelled`, `tool-error` (`invalid-tool`) and hook refusals from agy show in the same rows as Claude's.
- **Failure looks like:** agy failures missing or under their own names.

#### CL-HLT-11 · An empty or brand-new quest
- **Node:** 22.17 · **Severity:** minor · **Automatable:** e2e
- **Expect:** the panel shows zero failures cleanly; no console error; it fills in as the first session runs.
- **Failure looks like:** a blank panel or an error.

#### CL-HLT-12 · A classifier version bump updates the panel live
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Setup:** a throwaway build whose classifier adds one rule (for example, a new hook name).
- **Expect:** a `reclassify` job re-runs only non-`ok` calls and soft-failure candidates; `rollup_dirty` reason
  `reclassified` drains; the open panel moves the affected counts without a reload.
- **Failure looks like:** a full re-normalize, or a panel stuck on old counts.

## 2.3 The artifact route (API)

`GET /api/blobs/:hash` is not in the phase 2 list in design §11, but View Context's images and over-4 KB texts need
it (Appendix C, G4). Test it whenever it ships.

#### CL-API-01 · An image is served inline, safely
- **Steps:** `curl -sD - -o /tmp/x.png localhost:4900/api/blobs/<png hash>`.
- **Expect:** `Content-Type: image/png`, `X-Content-Type-Options: nosniff`; the body's sha256 equals the hash.
- **Node:** both · **Severity:** major · **Automatable:** integration

#### CL-API-02 · Anything else is served as a download
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Setup:** have a sandbox Claude write and then `cat` (spill) an HTML file with a `<script>` and an SVG with
  `onload`, so both become blobs.
- **Steps:** curl each; open each URL in the browser.
- **Expect:** `text/plain` or `application/octet-stream`, `X-Content-Type-Options: nosniff`,
  `Content-Security-Policy: sandbox`, `Content-Disposition: attachment`. The browser downloads; no script runs.
  SVG is not in the inline allowlist (G22).
- **Failure looks like:** the HTML renders, or the SVG runs its handler.

#### CL-API-03 · A foreign Origin is refused
- **Steps:** `curl -si -H 'Origin: http://evil.example' localhost:4900/api/blobs/<hash>`.
- **Expect:** refused (403), no body.
- **Node:** both · **Severity:** blocker · **Automatable:** integration

#### CL-API-04 · A foreign Host is refused
- **Steps:** `curl -si -H 'Host: evil.example:4900' localhost:4900/api/blobs/<hash>`.
- **Expect:** refused. This is the DNS-rebinding guard.
- **Node:** both · **Severity:** blocker · **Automatable:** integration

#### CL-API-05 · Loopback only
- **Steps:** `ss -ltnp | grep 4900`.
- **Expect:** bound to `127.0.0.1` (or `::1`), not `0.0.0.0`.
- **Node:** both · **Severity:** blocker · **Automatable:** integration

#### CL-API-06 · Bad hashes
- **Steps:** an unknown 64-hex hash; `abc`; `..%2f..%2fetc%2fpasswd`; a valid hash with a trailing `/..`.
- **Expect:** 404, 400, 400, 404. B.9 strace on the server shows no open outside `$DM_HOME/data/blobs` and the
  archive.
- **Node:** both · **Severity:** blocker · **Automatable:** integration

#### CL-API-07 · A large blob streams
- **Steps:** a 200 MB spill file; download it while sampling the server's RSS.
- **Expect:** RSS stays flat (streamed); the download's sha256 equals the hash.
- **Node:** both · **Severity:** major · **Automatable:** manual-only

#### CL-API-08 · Blobs packed in segments and evicted blobs
- **Steps:** fetch a blob under 64 KB (location `segment`) and one evicted by tier 1 (CL-CAP-03).
- **Expect:** the segment blob decompresses to the right hash. The evicted one: not specified (G13); record the
  status code and what the UI shows.
- **Node:** both · **Severity:** major · **Automatable:** integration

## 2.4 Retiring the usage ledger (LDG)

Design §11 phase 2 and `followup-home-state-to-db.md`. Before phase 2, the server's rate-limits poller scans every
transcript into `<home>/usage-ledger.json` (hourly token buckets) through atomic temp-file rewrites that leak
`usage-ledger.json.tmp.*` files. The quota display and the dispatch hold (`dispatchHoldEvaluateBroker`) read it.
Phase 2 deletes that scanner, a second transcript reader, and both readers read `usage` instead: the same numbers
per API message, deduplicated by the global `message.id`.

Setup for every LDG case: ENV-S with the full Claude corpus. Take the BEFORE figures on the last build that still
has the ledger, on this same home: save `$DM_HOME/usage-ledger.json` as `$T/ledger-before.json` and capture the quota
display (5-hour and weekly figures) with a screenshot or B.14. Then stop, switch to the phase 2 build, and start.

#### CL-LDG-01 · The quota display equals what `usage` gives
- **Node:** both · **Severity:** blocker · **Automatable:** e2e, manual-only (the real corpus)
- **Steps:** 1. Open the quota display on the phase 2 build. 2. A.53 for the 5-hour and 7-day windows, and B.5
  over the transcripts that fall in each window. 3. Read the ledger's hourly buckets from `$T/ledger-before.json`
  with python3's `json` module and compare hour by hour with A.53.
- **Expect:** the displayed 5-hour and weekly figures equal A.53; A.53's hourly sums from `usage` equal
  `rollup_hour` for `claude-code`; both equal B.5 (deduped by `message.id`). Where the old ledger differs from
  `usage` for an hour, B.5 decides; record each differing hour and its direction (a scan that summed every
  content-block record overcounts, design §1.1). No blank card, no console error.
- **Failure looks like:** a figure that matches neither B.5 nor the ledger, or a card showing zero while `usage`
  rows exist.

#### CL-LDG-02 · The dispatch hold trips and releases on `usage` figures
- **Node:** both · **Severity:** blocker · **Automatable:** integration, manual-only
- **Setup:** ENV-S, a quest ready to run. Lower the limit the hold compares against so the current window total
  (A.53) sits just under it; record the setting and its value (the design does not name them, G26).
- **Steps:** 1. Run a work item until A.53's window total crosses the limit; watch the hold indicator in the UI and
  `dispatch_events`. 2. Start a second quest. 3. Move the window on (`faketime '+5 hours'`, or wait) so the total
  falls back under the limit.
- **Expect:** the hold trips at the first dispatch decision after the A.53 total crosses the limit, and the UI shows
  it with its reason. The second quest queues: `queue-wait-start` with `wait_reason = 'rate-limit'`, then
  `queue-wait-end` with a matching `waited_ms` when the window rolls. Replaying the same transcripts with the same
  limit gives the same hold decision as the build that still had the ledger (record its decision first).
- **Failure looks like:** a hold that never trips, trips on a number the quota display disagrees with, or never
  releases.

#### CL-LDG-03 · No ledger file, no scanner, no leaked temp files
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Steps:** 1. On a fresh ENV-S home with the phase 2 build, run three quests and an interactive session for an
  hour; `ls "$DM_HOME"`. 2. On a home that already holds `usage-ledger.json` and leaked `usage-ledger.json.tmp.*`
  files (copy the real `~/.dungeonmaster` ones in; about 25 leak today), note their count and mtimes, start the
  phase 2 build and run the quests. 3. `discover({ grep: "usage-ledger" })` and `discover({ grep: "usageLedger" })`.
  4. B.9 strace on the server and every MCP child for 5 minutes.
- **Expect:** a fresh home never gets a `usage-ledger.json` or any `usage-ledger.json.tmp.*`. On the upgraded home
  no ledger file is written or touched and the number of `.tmp.*` files does not grow; whether the old ones are
  deleted is not stated (G26), record it. `discover` finds no reader, writer or transcript scanner for the ledger.
  Nothing but chronicle-llm opens a transcript (CL-CC-09).
- **Failure looks like:** a ledger or temp file appearing, or a transcript opened by the server or an MCP child.

#### CL-LDG-04 · Interactive sessions and resumes count once
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Steps:** note A.53's current-window total. Run an interactive sandbox Claude session with two prompts, and
  CL-INT-05's resumed work item. Read the quota display and A.53 again. Run B.5 over those transcripts.
- **Expect:** the display and A.53 rose by exactly the B.5 total of the new messages. The records a resume copied add
  nothing, repeated content-block usage counts once, and the interactive tokens are included (the old scanner read
  every transcript, so the quota covers sessions dungeonmaster did not start).
- **Failure looks like:** a rise that includes copied records or every content-block line.

#### CL-LDG-05 · The hold while chronicle-llm is down (record only)
- **Node:** 22.17 · **Severity:** major · **Automatable:** manual-only
- **Steps:** `kill -STOP` chronicle-llm; start a quest; wait a minute; `kill -CONT`.
- **Expect:** design §7: dispatch still works without chronicle-llm. Record what the hold does meanwhile (G26): it
  uses its last figure, fails open, or fails closed, and what the quota display shows. After `CONT`, the figures
  are right again.
- **Failure looks like:** dispatch blocked on a stopped chronicle-llm.

---

# Phase 3: the chat UI reads from chronicle-llm

Delivers: the chat UI reads only from chronicle-llm, and the old replay and emit paths are deleted (design §4.1).
Done when live, reload and reconnect match entry for entry, and the e2e pair and reconnect tests pass.

Setup: ENV-D for live work with real Claude; ENV-S for the frozen quests; ENV-L for the automatable forms. Appendix
B.14 captures the rendered entries so two views can be compared entry for entry.

## 3.1 What the chat reads, table by table

| UI | Reads | Check by hand |
|---|---|---|
| A work item's transcript | `timeline` rows for the work item's sessions, paged by `(session_ref, seq)` | A.38 for the session: the rendered entries are the non-meta rows, in order |
| A tool row and its result | `tool_calls`, `tool_results`, `content_blocks` | status and result text equal the row |
| A sub-agent chain | `llm_sessions` (`parent_session_ref`, `spawned_by_tool_call_ref`), its own timeline | A.6: every child under the call that spawned it |
| Live updates | change-fed rows past the cursor; `tombstones` | A.22 cursor arithmetic; a tombstoned key vanishes from the page |
| Provisional entries | `events.provisional`, `origin` | A.12 |
| Trimmed history | `llm_sessions.detail_state` | sessions `summarised` or `rolled-up` show "history trimmed" |

## 3.2 Live, reload and reconnect (FUN)

#### CL-FUN-01 · Live and reload match entry for entry
- **Node:** both · **Severity:** blocker · **Automatable:** e2e
- **Setup:** ENV-D. A quest with nested and parallel sub-agents (the CL-LIV prompt).
- **Steps:** 1. Watch the run live to the end; capture the entries (B.14) for every work item and every expanded
  sub-agent chain. 2. Reload the page; capture again. 3. Diff.
- **Expect:** identical: same entries, same order, same text, same tool statuses, same sub-agent placement, no
  provisional marker left on a finished session.
- **Failure looks like:** any difference. This is the bug class the design exists to end (12 live-vs-replay bugs
  in 150 days).

#### CL-FUN-02 · Reconnect resumes from the cursor
- **Node:** both · **Severity:** blocker · **Automatable:** e2e
- **Steps:** mid-run, set the browser offline (DevTools, Network, Offline) for 30 s while the quest keeps working;
  go back online. At the end, capture and compare with a reload.
- **Expect:** the entries written while offline appear after reconnect, once each. Equal to the reload.
- **Failure looks like:** a hole where the offline period was, or duplicates.

#### CL-FUN-03 · A server restart with the tab open
- **Node:** both · **Severity:** major · **Automatable:** e2e
- **Steps:** restart the server mid-run (ENV-S); leave the tab alone.
- **Expect:** the socket reconnects and continues from its cursor; the final view equals a reload.
- **Failure looks like:** a frozen transcript until a manual reload.

#### CL-FUN-04 · A provisional entry becomes final in place
- **Node:** both · **Severity:** major · **Automatable:** e2e
- **Steps:** watch an assistant entry stream in from stdout, then get its transcript copy.
- **Expect:** one entry that updates in place (stop reason, final usage). No second copy appears, even briefly.
- **Failure looks like:** a flash of a duplicate, or two entries.

#### CL-FUN-05 · Sub-agents appear the moment they start
- **Node:** both · **Severity:** blocker · **Automatable:** e2e
- **Steps:** screen-record the CL-LIV prompt's run. For each sub-agent, note the time its spawning call appears
  and the time its first entry appears.
- **Expect:** each sub-agent's first entry appears within about a second of its first line on disk, at depth 1, 2
  and 3, with no wait on a folder poll. Parallel agents each appear under their own call.
- **Failure looks like:** the old 1.1 s median and 6 s p90 delay, growing with depth.

#### CL-FUN-06 · A killed child's partial message
- **Node:** both · **Severity:** major · **Automatable:** e2e
- **Steps:** CL-OUT-03 with the quest open.
- **Expect:** the partial message stays visible, marked as cut off; the work item shows killed. Reload shows the
  same.
- **Failure looks like:** the partial text vanishes on reload, or the item shows running.

#### CL-FUN-07 · A resumed session shows no duplicated entries
- **Node:** both · **Severity:** blocker · **Automatable:** e2e
- **Steps:** CL-INT-05 with the quest open.
- **Expect:** the records the resume copied are not shown twice. How copies are shown is not specified (G17);
  record what you see.
- **Failure looks like:** the earlier conversation repeated in the resumed session.

#### CL-FUN-08 · A re-normalize while the tab is open
- **Node:** both · **Severity:** major · **Automatable:** e2e
- **Steps:** trigger a re-ingest of a session shown in an open tab (CL-SRC-03 on its file, ENV-S).
- **Expect:** entries are replaced in place by natural key; no duplicates; a row the replay no longer produces
  disappears (tombstone).
- **Failure looks like:** the session shown twice until reload.

#### CL-FUN-09 · The c8171a64-sized quest opens fast and matches the parity script
- **Node:** both · **Severity:** blocker · **Automatable:** e2e
- **Setup:** ENV-S with the frozen `c8171a64` copy. `DUNGEONMASTER_REQUEST_LOG=1`.
- **Steps:** open the quest; capture the WebSocket evidence (siegelense `results --kind ws`) and the entries (B.14).
- **Expect:** CL-PRF-05's budget holds. The WebSocket carries pages, not one frame per transcript line (before: 20,857
  frames and 48.7 MB). The entries equal CL-PAR-01's output for this quest.
- **Failure looks like:** thousands of frames, or tens of seconds of browser CPU.

#### CL-FUN-10 · A cursor older than the tombstone floor does a full reload
- **Node:** both · **Severity:** minor · **Automatable:** integration
- **Steps:** needs a way to raise the floor (G18): run the server under `faketime '+8 days'` with a tab left open
  from before.
- **Expect:** the tab does a full reload of its quest instead of reading the feed; the result equals a fresh load.
- **Failure looks like:** deleted rows still shown.

#### CL-FUN-11 · Two browsers see the same thing
- **Steps:** two browsers on the same quest through a live run; capture both.
- **Expect:** identical captures.
- **Node:** 22.17 · **Severity:** major · **Automatable:** e2e

#### CL-FUN-12 · The old paths are gone
- **Node:** 22.17 · **Severity:** major · **Automatable:** unit
- **Steps:** `discover({ grep: "chatHistoryReplayBroker" })`; read the server-init responder for a replay gate or
  live buffer; check the web for the `now()` timestamp fill and content-based dedupe.
- **Expect:** none of them exist. Every entry's time equals its row's `ts`.
- **Failure looks like:** a second path still emitting entries.

## 3.3 Interactive sessions and store states in the UI (UIS)

#### CL-UIS-01 · Interactive sessions appear in the sessions view
- **Node:** 22.17 · **Severity:** major · **Automatable:** e2e
- **Steps:** CL-INT-01 with the sessions view open.
- **Expect:** the session appears with its title, live status (busy, idle, stopped), and, for CL-INT-02, its quest
  chip.
- **Failure looks like:** the session missing until reload.

#### CL-UIS-02 · First run shows a blocking progress view, then history
- **Node:** both · **Severity:** major · **Automatable:** e2e
- **Steps:** CL-IMP-01 with the browser open from the first second.
- **Expect:** a blocking progress view while the last 7 days import, then the normal UI with recent history, then
  older history filling in behind a progress figure. A later harness (CL-IMP-04) shows its own banner and blocks
  nothing. A `registered` home shows no blocking view. (These UI states are not assigned to a phase in design §11;
  G4.)
- **Failure looks like:** an empty UI with no explanation during import.

#### CL-UIS-03 · "History unavailable" keeps dispatch and live output working
- **Node:** both · **Severity:** blocker · **Automatable:** e2e
- **Steps:** `kill -STOP` chronicle-llm mid-quest; watch for 2 minutes; `kill -CONT`.
- **Expect:** the UI says history is unavailable and shows live output from stdout only; the quest keeps
  dispatching. After `CONT`, history returns without a reload, and the final view equals a reload.
- **Failure looks like:** a dead UI, or dispatch blocked on chronicle-llm.

#### CL-UIS-04 · Trimmed history says so
- **Node:** 22.17 · **Severity:** minor · **Automatable:** e2e
- **Steps:** open a session evicted to `summarised` and one to `rolled-up` (CL-CAP-04, CL-CAP-05).
- **Expect:** each shows "history trimmed" in place of its entries, with its figures intact. No blank panel.
- **Failure looks like:** an empty transcript with no notice.

#### CL-PRF-05 · Opening a quest: first page of every work item in under 300 ms server-side
- **Node:** both · **Severity:** major · **Automatable:** manual-only
- **Steps:** CL-FUN-09; read the `[http]` and WebSocket timings for the open; repeat cold (after a restart) and warm.
- **Expect:** under 300 ms server-side for the first page of every work item. Browser CPU for the open is a small
  fraction of the old 21.5 s (Chrome performance panel).
- **Failure looks like:** over 300 ms.

---

# Phase 4: the timeline and the command center's figures

Done when the figures cross-check against the transcripts' own `cost-state`: the reported cost in
`rollup_session.last_reported_cost_usd`, and the `cost-state` records in the raw archive for tokens.

## 4.1 What the figures read, table by table

| Figure | Reads | Check by hand |
|---|---|---|
| Quest token line "ctx 142k/1M · Σ 3.4M" | newest `usage.context_tokens` per running session, `usage.context_limit`; `rollup_quest` | A.47 |
| TOKENS block per role, estimated cost | `usage` joined through `llm_sessions.work_item_ref` to `work_items.role`, `rollup_session` | A.47 per role; A.35 against `rollup_session.last_reported_cost_usd` |
| Trend graphs | `rollup_hour` | A.17 hourly check; after a late link, `rollup_dirty` drains and the hour moves to the right role and guild |
| Claude latency p50/p95, requests in flight | `session_results`, `messages.ttft_ms` (stdout, dispatched sessions only) | A.48 |
| Error rate over the last hour | `errors` vs API messages | A.48 |
| 5-hour and weekly rate-limit cards | `rate_limit_samples` | A.48 latest sample |
| Liveness of interactive sessions | `llm_sessions.liveness` | A.7 |
| Timeline phases | `tool_calls`, `events`, `turns`, `dispatch_events` (queue waits) | A.49 |

## 4.2 Timeline (TL)

#### CL-TL-01 · Item 21's phases match the measured durations
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Setup:** ENV-S, frozen 1918a5ee.
- **Expect:** the phases `tmp/q1918-timeline-analyze.py` gives on the frozen copy. The earlier census read item 21 as bootstrap 7 s, explore 27 s, edit 133 s, verify (fail) 115 s, fix 25 s, verify (pass)
  100 s, signal 10 s, report 6 s, each within 2 s. The MCP `sections: ['timeline']` text row says the same.
- **Failure looks like:** phases missing or off by more than 2 s.

#### CL-TL-02 · Active time, not wall span
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Expect:** item 2 shows its active time, not its wall span (the earlier census: about 297 s active against a
  134-minute span; take the figures from the timeline script on the frozen copy); the gap is marked as waiting on a
  resume.
- **Failure looks like:** 134 minutes shown as work.

#### CL-TL-03 · Idle gaps carry their reason where one is known
- **Node:** both · **Severity:** minor · **Automatable:** integration
- **Setup:** CL-LIV-08's run.
- **Expect:** the gap between the two quests' work items is marked `slot-limit` with its wait time. Gaps in
  1918a5ee (the earlier census: 72.5 minutes and 13.8 hours; confirm on the frozen copy) show as gaps with no reason, because no queue-wait record existed then.
- **Failure looks like:** gaps hidden, or a reason invented.

#### CL-TL-04 · The UI lanes and the MCP text agree
- **Expect:** each work item's lane in the UI has the same phases and durations as the MCP text rows.
- **Node:** 22.17 · **Severity:** minor · **Automatable:** e2e

## 4.3 The command center (CC)

#### CL-CC-01 · A quest's token line equals the SQL
- **Node:** both · **Severity:** major · **Automatable:** e2e
- **Steps:** with a quest running, hover its token line on the QUESTS row and its RAID lane; run A.47.
- **Expect:** ctx is the highest context among the quest's live sessions, over that model's limit; Σ is the quest's
  total so far (the definition of Σ is not stated, G16; record which token kinds it adds). Hover shows the exact
  figures, and they equal A.47. Amber above 70%, red above 90%; "ctx —" with no live session; "Σ 0" before spend.
- **Failure looks like:** ctx from a finished session, or Σ that matches no query.

#### CL-CC-02 · Live context comes from running sessions only
- **Steps:** let a work item finish; watch the quest's ctx.
- **Expect:** ctx drops to the next running session's figure, or "ctx —", as soon as `end_state` changes, with no
  new usage row.
- **Node:** both · **Severity:** major · **Automatable:** e2e

#### CL-CC-03 · The TOKENS block and cost cross-check against `cost-state`
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Steps:** A.35 over every finished quest in ENV-S; open the TOKENS block for three of them.
- **Expect:** per role totals equal A.47. For non-resumed sessions, cost within 5% of
  `rollup_session.last_reported_cost_usd` (the reported figure includes the title model) and output tokens within
  1.5% of the transcript's own last `cost-state` record, read from the archive with B.7 (no table holds it).
  Resumed sessions differ in the known direction (`cost-state` undercounts them). The UI's estimate equals
  `usage` × pricing, never the reported figure.
- **Failure looks like:** a quest off by more than the tolerance with no resume to explain it.

#### CL-CC-04 · Epic totals add up
- **Expect:** an epic's total and cost equal the sum of its quests' A.47 figures.
- **Node:** 22.17 · **Severity:** minor · **Automatable:** integration

#### CL-CC-05 · Trend graphs survive a late link and eviction
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Steps:** 1. Ingest a session before its link exists (CL-LIV-07's stopped window), then let the link land.
  2. Evict to tier 3 (CL-CAP-05).
- **Expect:** 1: the session's hours move from the unlinked bucket to its role and guild once `rollup_dirty` drains;
  the graph total does not change. 2: the graph is unchanged.
- **Failure looks like:** tokens counted twice or lost across the move.

#### CL-CC-06 · The health view's Claude figures
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Expect:** latency p50/p95 and requests in flight come from dispatched sessions only (A.48), and the view says
  so. The error rate over the last hour equals A.48 and turns red at 5%. The 5-hour and weekly cards equal the
  latest `rate_limit_samples` row.
- **Failure looks like:** interactive sessions mixed into latency, or a rate that matches no query.

#### CL-CC-07 · Liveness of interactive sessions
- **Steps:** start and stop an interactive sandbox Claude; watch its row in the sessions tab.
- **Expect:** busy, idle, then stopped, within a few seconds of each change.
- **Node:** 22.17 · **Severity:** minor · **Automatable:** e2e

#### CL-CC-08 · chronicle-llm's own health in the command center
- **Expect:** the health view shows what `chronicle status` shows: lag, queue depth, WAL size, drift count, storage per
  tier, and the 20-day staleness warning (CL-IMP-07 under `faketime`).
- **Node:** 22.17 · **Severity:** minor · **Automatable:** e2e

#### CL-CC-09 · The quota ledger no longer scans transcripts
- **Steps:** B.9 strace on the server and every MCP child for 5 minutes.
- **Expect:** no open of any transcript by anything but chronicle-llm (CL-LDG-03 is the primary check in phase 2;
  repeat it here with the command center open).
- **Node:** both · **Severity:** major · **Automatable:** integration

---

# Phase 5: first-party sources

Done when `err/1h` and the backend rates match their sources. Phase 5 also retires `rate-limits.json` and
`rate-limits-history.jsonl` (design §11, `followup-home-state-to-db.md`; section 5.2).

## 5.1 What phase 5 fills, table by table

| Table | Correct looks like | Cross-check against |
|---|---|---|
| `llm_sessions` with `harness = 'dungeonmaster'`, `kind = 'command'` | one per ward, commit and riftcarver run | the quest's work items of those kinds |
| `events` with `kind = 'command-line'` | one per output line, in order | the command's own output (`ward-results/`, `riftcarver-results/` in the quest folder) |
| `work_items` `ward_*` columns, for a ward step | exit code and per-check statuses from `wardResults[]` | `npm run ward -- detail <runId>` |
| `server_errors` | one per error, repeats merged by `signature` | the server log |
| `model_calls` | one per local-model call | the gateway's own log |
| `rate_limit_samples` from `<home>/data/spool/rate-limits.jsonl` | one row per status-line reading the CLI appended | the spool lines (CL-RLM-02) |

#### CL-FP-01 · Command output becomes a session
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Steps:** run a quest to its ward step; open the ward work item.
- **Expect:** its output renders from `command-line` events; the separate command-output replay is gone; reload
  equals live.
- **Failure looks like:** the ward output missing after reload.

#### CL-FP-02 · A ward step's verdict agrees with its command output
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Steps:** run a quest through a ward step; compare the work item's `ward_*` columns (A.56) with `ward detail` and
  with the `command-line` events of its command session.
- **Expect:** `ward_run_id`, `ward_exit_code` and `ward_checks_json` match `ward detail`; a red caused only by slow
  tests has `ward_slow_tests_only = 1` (like run `a87e3c0a`); the exit code and checks agree with the output the
  command session shows. There is no `ward_runs` table (CL-QMR-04 is the phase 1 check of the mirror).
- **Failure looks like:** a verdict that differs from the command's own output.

#### CL-FP-03 · Server errors merge by signature and feed `err/1h`
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Steps:** cause the same server error 5 times and a different one once (pick a request that reliably returns
  500 in the build under test); watch the health strip.
- **Expect:** two signatures, ×5 and ×1. The strip's "err/1h" equals
  `q "SELECT COUNT(*) FROM server_errors WHERE ts > (unixepoch()-3600)*1000"`, and falls back after an hour
  (`faketime`).
- **Failure looks like:** 6 separate rows with no merge, or a count that does not move.

#### CL-FP-04 · Local-model calls and backend rates
- **Setup:** only once the orchestrator calls a local backend; until then record "not applicable".
- **Expect:** per-backend TTFT p50/p95 and requests per role per hour equal A.48's `model_calls` queries; errors and
  timeouts counted.
- **Node:** both · **Severity:** major · **Automatable:** integration

#### CL-FP-05 · First-party sources survive crashes like the others
- **Steps:** CL-CRA-03 while a ward step runs.
- **Expect:** the command session's lines are complete and not duplicated.
- **Node:** both · **Severity:** major · **Automatable:** integration

## 5.2 Retiring rate-limits.json and rate-limits-history.jsonl (RLM)

Design §11 phase 5 and `followup-home-state-to-db.md`. Before phase 5, the CLI's status line rewrites
`<home>/rate-limits.json` (at most every 5 s) and appends to `rate-limits-history.jsonl`, and the dispatch hold reads
the first. After phase 5 the CLI appends each reading to `<home>/data/spool/rate-limits.jsonl`, chronicle-llm stores
it in `rate_limit_samples`, and the hold reads the newest sample.

Setup: ENV-S with a real sandbox Claude on dungeonmaster's status line, or hand-made lines appended to the spool,
one per reading.

#### CL-RLM-01 · The CLI appends to the spool, and the old files stop
- **Node:** both · **Severity:** major · **Automatable:** integration
- **Steps:** on an upgraded home, note the mtimes of `rate-limits.json` and `rate-limits-history.jsonl`. Run a
  sandbox Claude session for a few minutes. `ls -la --time-style=full-iso "$DM_HOME" "$DM_HOME/data/spool"` and
  `wc -l` the spool. B.9 on the server, the CLI and an MCP child.
- **Expect:** `rate-limits.jsonl` grows by one line per reading, each with its own time, mode `0600` in a `0700`
  folder. The old two files are not written or rewritten (mtimes unchanged on an upgraded home, absent on a fresh
  one), and nothing opens them. Whether an upgrade removes them or imports their history is not stated (G26);
  record it.
- **Failure looks like:** `rate-limits.json` still rewritten, or the status line writing to both.

#### CL-RLM-02 · Every reading becomes exactly one `rate_limit_samples` row
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Steps:** A.54 against the spool: the counts, then five random lines compared field by field. `kill -STOP`
  chronicle-llm for a minute during the session, then `kill -CONT`.
- **Expect:** one row per spool line, none duplicated by a re-read. `five_hour_utilization`,
  `five_hour_resets_at`, `seven_day_utilization` and `seven_day_resets_at` equal the line's. `received_at` is the
  reading's own time, not ingest time. Readings made while chronicle-llm was stopped are all present after `CONT`,
  and the spool file is deleted only after its records are sealed, `fsync`ed and checkpointed (design §6 step 6).
  Spool-fed rows and stdout `rate_limit_event` rows coexist in the table; record how to tell them apart.
- **Failure looks like:** readings lost across the stopped window, or duplicated rows.

#### CL-RLM-03 · The dispatch hold trips on the newest sample
- **Node:** both · **Severity:** blocker · **Automatable:** integration, manual-only
- **Steps:** 1. Append a reading with five-hour utilization above the hold's limit to the spool and start a quest.
  2. Append a later reading below the limit. 3. Append a reading with an OLDER time and high utilization after the
  newer low one. 4. Replay: feed the readings of the old `rate-limits-history.jsonl` through the spool in order and
  note each decision; compare them with the decisions the build that still had the file made on the same readings.
- **Expect:** 1: the hold trips once the sample lands, the quest queues with `wait_reason = 'rate-limit'`, and the
  UI shows the hold. 2: it releases, with `queue-wait-end` and a matching `waited_ms`. 3: the older reading does
  not re-trip it, because the newest sample by `received_at` still wins; record whether it follows ingest order
  instead (G26). 4: the same decisions as the old build.
- **Failure looks like:** a hold taken from a stale sample, a hold that never trips, or one that never releases.

#### CL-RLM-04 · The hold while chronicle-llm is down (record only)
- **Node:** 22.17 · **Severity:** major · **Automatable:** manual-only
- **Steps:** `kill -STOP` chronicle-llm; append a high reading to the spool; start a quest; later `kill -CONT`.
- **Expect:** dispatch still works (design §7). The newest sample cannot update while the process is stopped:
  record whether the hold uses the stale sample, fails open or fails closed (G26). After `CONT` the hold follows the
  new sample.
- **Failure looks like:** dispatch blocked on chronicle-llm.

#### CL-RLM-05 · The 5-hour and weekly cards still match
- **Node:** both · **Severity:** major · **Automatable:** e2e
- **Steps:** CL-CC-06 again after the retirement; A.54.
- **Expect:** the cards equal the newest `rate_limit_samples` row, with no console error.
- **Failure looks like:** cards stuck on the old file's last value.

---

# Node versions (NODE)

Run once on each version, at the start of each phase's round.

#### CL-NODE-01 · The engines floor
- **Steps:** with Node 22.15 (via `nvm`), install the build and run `dungeonmaster start`.
- **Expect:** a clear refusal naming Node 22.16 as the minimum, before anything is written to the home.
- **Node:** 22.17 · **Severity:** major · **Automatable:** integration

#### CL-NODE-02 · No experimental warning on Node 22
- **Steps:** on 22.17, run `dungeonmaster start`, `dungeonmaster chronicle status`, and watch the server and process
  logs.
- **Expect:** no `ExperimentalWarning: SQLite` line anywhere.
- **Node:** 22.17 · **Severity:** minor · **Automatable:** integration

#### CL-NODE-03 · Booleans are integers on both versions
- **Steps:** A.20 after phase 1's import, on each version.
- **Expect:** only `integer` types, only 0 and 1.
- **Node:** both · **Severity:** blocker · **Automatable:** unit

#### CL-NODE-04 · A store made on 22.17 opens on 24, and the reverse
- **Node:** both · **Severity:** blocker · **Automatable:** integration
- **Steps:** 1. Stop the ENV-S server on 22.17. 2. Switch to Node 24; start. 3. Run A.3, A.22, `PRAGMA quick_check`,
  and B.7 over 200 random raw records. 4. Ingest a new session. 5. Switch back to 22.17 and repeat step 3.
- **Expect:** no migration, no re-import, no drift caused by the switch; every record readable; zstd chunks written
  by either version decompress on the other.
- **Failure looks like:** a store that only one version can read.

#### CL-NODE-05 · Budgets on Node 24
- **Steps:** repeat CL-PRF-01 to CL-PRF-05 on Node 24.
- **Expect:** every budget holds; record both versions' figures side by side.
- **Node:** both · **Severity:** major · **Automatable:** manual-only

---

# Out of scope for now

| Item | Why |
|---|---|
| Electron (the `powerMonitor` battery throttle, Electron main starting the process, the bundled Node line) | no Electron app yet (design §7, §11) |
| The mobile client, a non-loopback bind, API authentication | the mobile host comes later; until then the API is loopback only (CL-API-05) |
| Phase 6, the next harness | its done-when is fixtures passing with zero edits to the core; write its manual cases when its harness is chosen |
| Phase 0's standalone fixes | measured by repeating the c8171a64 replay measurements, before chronicle-llm exists |
| Token-level streaming (`--include-partial-messages`) | skipped by design §3 |
| Moving the home's JSON files into `state.db` (the outbox, `dispatch-state.json`, `quest.json`) | a follow-up (`followup-home-state-to-db.md`); only its two retirements marked "with chronicle-llm" are tested here (LDG, RLM) |

---

# Appendix A: read-only queries

### A.0 The `q` helper

Opens the store read-only, runs one statement, closes it. Nothing is held open between calls.

```bash
q() { node --no-warnings -e '
const { DatabaseSync } = require("node:sqlite");
const db = new DatabaseSync(process.argv[1], { readOnly: true });
console.table(db.prepare(process.argv[2]).all());
db.close();' "$DB" "$1"; }

# JSON lines instead of a table, for diffs and long text
qj() { node --no-warnings -e '
const { DatabaseSync } = require("node:sqlite");
const db = new DatabaseSync(process.argv[1], { readOnly: true });
for (const row of db.prepare(process.argv[2]).iterate()) console.log(JSON.stringify(row));
db.close();' "$DB" "$1"; }
```

Write each statement on one line inside `q "..."`; SQL single quotes are fine inside the shell's double quotes.
Placeholders: `<QUEST_ID>`, `<WORK_ITEM_ID>`, `<SESSION_KEY>` (a natural key such as `claude-code:<uuid>`),
`<CAUSE>`, `<TOOL_CALL_KEY>`.

### A.1 Sources by harness, kind and state

```sql
SELECT harness, kind, state, priority, COUNT(*) AS n, SUM(gone_at IS NOT NULL) AS gone FROM sources GROUP BY 1,2,3,4 ORDER BY 1,2;
```

### A.2 Import progress

```sql
SELECT key, value FROM meta WHERE key IN ('first_run_state','history_import_progress','last_full_scan_at');
SELECT cause, COUNT(*) AS jobs, MIN(started_at) AS first_start, MAX(finished_at) AS last_finish, SUM(records_read) AS records, SUM(errors) AS errors FROM ingest_jobs GROUP BY cause;
```

Per-harness import state (design §7):

```sql
SELECT harness, state, normalizer_set, recent_done_at, history_done_at, progress_json FROM harness_imports;
```

### A.3 Sessions by harness and kind

```sql
SELECT harness, kind, is_stub, detail_state, COUNT(*) AS n FROM llm_sessions GROUP BY 1,2,3,4 ORDER BY 1,2;
```

### A.4 A quest's dispatch records

```sql
SELECT kind, ts, native_session_id, work_item_id, role, step, os_pid, exit_code, exit_signal, wait_reason, waited_ms FROM dispatch_events WHERE quest_id = '<QUEST_ID>' ORDER BY ts;
```

### A.5 A quest's newest tool calls

```sql
SELECT s.natural_key AS session, tc.natural_key AS call, tc.tool_name, tc.status, tc.change_seq FROM tool_calls tc JOIN llm_sessions s ON s.id = tc.session_ref JOIN quests q ON q.id = s.quest_ref WHERE q.natural_key = '<QUEST_ID>' ORDER BY tc.requested_at DESC LIMIT 30;
```

### A.6 A quest's session tree

```sql
SELECT s.natural_key, s.kind, s.spawn_depth, p.natural_key AS parent, tc.natural_key AS spawned_by, s.quest_ref IS NOT NULL AS has_quest, s.linked_by, s.is_stub, s.end_state FROM llm_sessions s LEFT JOIN llm_sessions p ON p.id = s.parent_session_ref LEFT JOIN tool_calls tc ON tc.id = s.spawned_by_tool_call_ref WHERE s.quest_ref = (SELECT id FROM quests WHERE natural_key = '<QUEST_ID>') ORDER BY s.started_at;
```

### A.7 One session at a glance

```sql
SELECT natural_key, kind, is_interactive, liveness, liveness_at, end_state, exit_signal, started_at, last_activity_at, (SELECT COUNT(*) FROM events e WHERE e.session_ref = s.id) AS events, (SELECT COUNT(*) FROM tool_calls t WHERE t.session_ref = s.id) AS calls, (SELECT COUNT(*) FROM usage u WHERE u.session_ref = s.id) AS usage_rows FROM llm_sessions s WHERE natural_key = '<SESSION_KEY>';
```

### A.8 Usage for one work item, resumes included

```sql
SELECT COUNT(*) AS msgs, SUM(u.input_tokens) AS input, SUM(u.cache_read_tokens) AS cache_read, SUM(u.cache_write_tokens) AS cache_write, SUM(u.output_tokens) AS output FROM usage u JOIN llm_sessions s ON s.id = u.session_ref WHERE s.work_item_ref = (SELECT id FROM work_items WHERE natural_key = '<WORK_ITEM_ID>');
```

### A.9 Copies that lost their original (expect no rows)

```sql
SELECT native_uuid, COUNT(*) AS rows, SUM(copied_from_event_ref IS NULL) AS originals FROM events WHERE native_uuid IS NOT NULL GROUP BY native_uuid HAVING originals <> 1 LIMIT 20;
```

### A.10 A quest's totals two ways

```sql
SELECT * FROM rollup_quest WHERE quest_id = '<QUEST_ID>';
SELECT SUM(u.input_tokens) AS input, SUM(u.cache_read_tokens) AS cache_read, SUM(u.cache_write_tokens) AS cache_write, SUM(u.output_tokens) AS output, ROUND(SUM(u.est_cost_usd), 2) AS est_cost FROM usage u JOIN llm_sessions s ON s.id = u.session_ref WHERE s.quest_ref = (SELECT id FROM quests WHERE natural_key = '<QUEST_ID>');
```

### A.11 Antigravity call keys

```sql
SELECT COUNT(*) AS agy_calls, SUM(natural_key LIKE '%~%') AS repeats FROM tool_calls WHERE natural_key GLOB 'antigravity:*';
SELECT natural_key FROM tool_calls WHERE natural_key GLOB 'antigravity:*~*' LIMIT 10;
SELECT native_call_id, COUNT(DISTINCT session_ref) AS conversations FROM tool_calls WHERE natural_key GLOB 'antigravity:*' GROUP BY 1 HAVING conversations > 1 LIMIT 5;
```

The last query is expected to return rows: `call_<n>` repeats across conversations, and the keys still differ.

### A.12 Provisional and merged rows of one session

```sql
SELECT e.natural_key, e.kind, e.origin, e.provisional, m.stop_reason, u.output_tokens, u.provisional AS usage_provisional, u.is_partial FROM events e LEFT JOIN messages m ON m.id = e.message_ref LEFT JOIN usage u ON u.message_ref = e.message_ref WHERE e.session_ref = (SELECT id FROM llm_sessions WHERE natural_key = '<SESSION_KEY>') ORDER BY e.seq DESC LIMIT 20;
```

### A.13 The quest mirror

```sql
SELECT q.natural_key AS quest, q.status, q.title, w.natural_key AS work_item, w.role, w.step, w.status AS item_status, w.native_session_id FROM quests q LEFT JOIN work_items w ON w.quest_ref = q.id ORDER BY q.natural_key, w.created_at;
```

### A.14 The sources behind one session

```sql
SELECT natural_key, kind, locator, state, gone_at, watermark_json FROM sources WHERE session_ref = (SELECT id FROM llm_sessions WHERE natural_key = '<SESSION_KEY>');
```

### A.15 A snapshot of what eviction must not change

```sql
SELECT (SELECT COUNT(*) FROM llm_sessions) AS sessions, (SELECT COUNT(*) FROM messages) AS messages, (SELECT COUNT(*) FROM usage) AS usage_rows, (SELECT SUM(output_tokens) FROM usage) AS output, (SELECT SUM(cache_read_tokens) FROM usage) AS cache_read, (SELECT COUNT(*) FROM tool_calls) AS calls, (SELECT COUNT(*) FROM tool_call_causes) AS causes, (SELECT COUNT(*) FROM errors) AS errors, (SELECT SUM(output_tokens) FROM rollup_hour) AS hour_output, (SELECT SUM(tool_failures) FROM rollup_session) AS session_failures;
```

Tier 1 changes none of these. Tier 2 changes none of these. Tier 3 lowers `calls` and `causes` only.

### A.16 Sub-agents whose quest differs from their root's (expect no rows)

```sql
SELECT s.natural_key, s.quest_ref, r.quest_ref AS root_quest_ref FROM llm_sessions s JOIN llm_sessions r ON r.id = s.root_session_ref WHERE r.quest_ref IS NOT NULL AND (s.quest_ref IS NULL OR s.quest_ref <> r.quest_ref);
SELECT s.natural_key, s.linked_by FROM llm_sessions s JOIN llm_sessions r ON r.id = s.root_session_ref WHERE s.id <> r.id AND r.quest_ref IS NOT NULL AND s.quest_ref = r.quest_ref AND COALESCE(s.linked_by, '') <> 'inherited' LIMIT 20;
```

The second query lists sub-agents linked some other way than `inherited`; expect only sessions that `quest.json`
names itself (`quest-file`).

### A.17 Rollups against recomputation (expect no rows, and equal totals)

```sql
SELECT rs.session_ref, rs.output_tokens, COALESCE(u.o, 0) AS recomputed FROM rollup_session rs LEFT JOIN (SELECT session_ref, SUM(output_tokens) AS o FROM usage GROUP BY session_ref) u ON u.session_ref = rs.session_ref WHERE rs.output_tokens <> COALESCE(u.o, 0) LIMIT 20;
SELECT rs.session_ref FROM rollup_session rs JOIN llm_sessions s ON s.id = rs.session_ref LEFT JOIN (SELECT session_ref, COUNT(*) AS n, SUM(status <> 'ok') AS f FROM tool_calls GROUP BY 1) t ON t.session_ref = rs.session_ref WHERE s.detail_state <> 'rolled-up' AND (rs.tool_calls <> COALESCE(t.n, 0) OR rs.tool_failures <> COALESCE(t.f, 0)) LIMIT 20;
SELECT h.hour_start, h.o AS rolled, u.o AS recomputed FROM (SELECT hour_start, SUM(output_tokens) AS o FROM rollup_hour GROUP BY 1) h LEFT JOIN (SELECT (ts / 3600000) * 3600000 AS hour_start, SUM(output_tokens) AS o FROM usage GROUP BY 1) u USING (hour_start) WHERE h.o <> COALESCE(u.o, 0) LIMIT 20;
SELECT (SELECT SUM(output_tokens) FROM rollup_hour) AS hour_total, (SELECT SUM(output_tokens) FROM usage) AS usage_total, (SELECT COUNT(*) FROM rollup_dirty) AS dirty;
```

### A.18 Redaction counts and markers in context

```sql
SELECT COUNT(*) AS records, SUM(redactions) AS markers FROM raw_records WHERE redacted = 1;
SELECT record_type, COUNT(*) AS records, SUM(redactions) AS markers FROM raw_records WHERE redactions > 0 GROUP BY 1 ORDER BY 3 DESC LIMIT 20;
SELECT substr(text, max(1, instr(text, 'REDACTED-SECRET-') - 60), 140) AS around FROM content_blocks WHERE text LIKE '%REDACTED-SECRET-%' ORDER BY random() LIMIT 25;
SELECT substr(text, max(1, instr(text, 'REDACTED-SECRET-') - 60), 140) AS around FROM tool_results WHERE text LIKE '%REDACTED-SECRET-%' ORDER BY random() LIMIT 25;
```

### A.19 Live lag, last hour

`user` records (tool results) are written as they happen, so `ingested_at - ts` approximates file-write-to-row.
Assistant lines are written after the message ends, so they are left out.

```sql
WITH d AS (SELECT r.ingested_at - r.ts AS lag FROM raw_records r JOIN sources s ON s.id = r.source_ref WHERE s.kind = 'transcript-jsonl' AND r.record_type = 'user' AND r.ts IS NOT NULL AND r.ingested_at > (unixepoch() - 3600) * 1000) SELECT COUNT(*) AS n, (SELECT lag FROM d ORDER BY lag LIMIT 1 OFFSET (SELECT COUNT(*) * 95 / 100 FROM d)) AS p95_ms FROM d;
```

### A.20 Booleans are integers

```sql
SELECT 'tool_results.is_error' AS col, typeof(is_error) AS t, COUNT(*) FROM tool_results GROUP BY 2 UNION ALL SELECT 'events.provisional', typeof(provisional), COUNT(*) FROM events GROUP BY 2 UNION ALL SELECT 'llm_sessions.is_interactive', typeof(is_interactive), COUNT(*) FROM llm_sessions GROUP BY 2 UNION ALL SELECT 'usage.is_partial', typeof(is_partial), COUNT(*) FROM usage GROUP BY 2 UNION ALL SELECT 'raw_records.redacted', typeof(redacted), COUNT(*) FROM raw_records GROUP BY 2;
SELECT (SELECT COUNT(*) FROM tool_results WHERE is_error NOT IN (0, 1)) + (SELECT COUNT(*) FROM events WHERE provisional NOT IN (0, 1)) + (SELECT COUNT(*) FROM llm_sessions WHERE is_stub NOT IN (0, 1)) AS bad_booleans;
```

### A.21 Quest 1918a5ee's counts (compare with `expected.json`)

```sql
WITH q AS (SELECT s.id FROM llm_sessions s WHERE s.quest_ref = (SELECT id FROM quests WHERE natural_key = '1918a5ee-8bce-4f3d-a4ab-f7ff51f45878')), c AS (SELECT tc.tool_name, tc.input_summary, tc.input_json, tr.is_error, tcc.cause, tcc.sub_cause FROM tool_calls tc LEFT JOIN tool_results tr ON tr.tool_call_ref = tc.id LEFT JOIN tool_call_causes tcc ON tcc.tool_call_ref = tc.id WHERE tc.session_ref IN (SELECT id FROM q)) SELECT SUM(is_error IS NOT NULL) AS tool_results, SUM(is_error = 1) AS is_error, SUM(cause = 'ward-red-hidden') AS hidden_ward_reds, SUM(cause = 'permission-denied' AND tool_name = 'Bash' AND (input_summary LIKE 'sed %' OR input_json LIKE '%"command":"sed %')) AS sed_denials FROM c;
WITH q AS (SELECT s.id FROM llm_sessions s WHERE s.quest_ref = (SELECT id FROM quests WHERE natural_key = '1918a5ee-8bce-4f3d-a4ab-f7ff51f45878')) SELECT tcc.cause, tcc.sub_cause, COUNT(*) AS n FROM tool_call_causes tcc JOIN tool_calls tc ON tc.id = tcc.tool_call_ref WHERE tc.session_ref IN (SELECT id FROM q) GROUP BY 1, 2 ORDER BY 3 DESC;
```

When a count is off, list the call keys for that cause with `qj` and diff them against the `toolu_` ids in
`tmp/q1918-failures.json`, regenerated from the frozen copy first (the file on disk may predate the quest's resume). The sed rule can match a call whose command only contains `sed` later in a pipeline;
the census's id list is the truth.

### A.22 The change feed's counters

```sql
SELECT (SELECT value FROM meta WHERE key = 'next_change_seq') AS next_seq, (SELECT value FROM meta WHERE key = 'tombstone_floor_seq') AS floor, (SELECT MAX(change_seq) FROM events) AS events_max, (SELECT MAX(change_seq) FROM tool_calls) AS calls_max, (SELECT MAX(change_seq) FROM llm_sessions) AS sessions_max, (SELECT COUNT(*) FROM tombstones) AS tombstones, (SELECT MIN(change_seq) FROM tombstones) AS oldest_tombstone;
```

`next_seq` is above every maximum; the oldest tombstone is at or above the floor.

### A.23 Where every raw record lives

```sql
SELECT s.kind, COUNT(*) AS records, SUM(r.segment_ref IS NOT NULL) AS sealed, SUM(t.raw_id IS NOT NULL) AS in_tail, SUM(r.evicted_at IS NOT NULL) AS evicted, SUM(r.segment_ref IS NULL AND t.raw_id IS NULL AND r.evicted_at IS NULL) AS nowhere FROM raw_records r JOIN sources s ON s.id = r.source_ref LEFT JOIN raw_tail t ON t.raw_id = r.raw_id GROUP BY 1;
SELECT COUNT(*) AS lines, MAX(pos) + 1 AS last_line FROM raw_records WHERE revision = 0 AND source_ref = (SELECT id FROM sources WHERE locator = '<ABSOLUTE PATH>');
SELECT raw_id, parse_error_normalizer, substr(parse_error, 1, 120) AS why FROM raw_records WHERE parse_error IS NOT NULL ORDER BY random() LIMIT 50;
SELECT revision_expected, COUNT(*) AS records FROM raw_records WHERE revision > 0 GROUP BY 1;
```

`nowhere` must be 0. For one JSONL file, `lines` equals `wc -l` of that file (complete lines only). The third query
lists parse errors (DQ-16). The fourth counts rewrites: agy rows are `revision_expected = 1`, and a `0` needs a
drift row.

### A.24 Drift and unparsed fields

```sql
SELECT harness, record_type, field_path, value_type, count FROM schema_observations WHERE parsed = 0 ORDER BY count DESC LIMIT 40;
SELECT kind, harness, COUNT(*) FROM schema_drift WHERE acknowledged_at IS NULL GROUP BY 1, 2;
SELECT kind, harness, record_type, field_path, substr(detail, 1, 120) AS detail FROM schema_drift WHERE acknowledged_at IS NULL ORDER BY first_seen_at DESC LIMIT 30;
```

### A.25 The 4 KB inline rule

```sql
SELECT 'content_blocks' AS t, SUM(text IS NOT NULL AND length(CAST(text AS BLOB)) > 4096) AS too_long_inline, SUM(text IS NULL AND blob_ref IS NULL AND block_type IN ('text', 'thinking')) AS missing_text, SUM(text IS NOT NULL AND text_chars <> length(text)) AS wrong_chars FROM content_blocks UNION ALL SELECT 'tool_results', SUM(text IS NOT NULL AND length(CAST(text AS BLOB)) > 4096), SUM(text IS NULL AND blob_ref IS NULL), SUM(text IS NOT NULL AND text_chars <> length(text)) FROM tool_results;
```

`missing_text` may count rows of `summarised` sessions only.

### A.26 Causes complete and from the vocabulary

```sql
SELECT tc.status, tcc.cause, COUNT(*) AS n FROM tool_calls tc LEFT JOIN tool_call_causes tcc ON tcc.tool_call_ref = tc.id GROUP BY 1, 2 ORDER BY 1, 3 DESC;
SELECT COUNT(*) AS failed_without_cause FROM tool_calls tc LEFT JOIN tool_call_causes c ON c.tool_call_ref = tc.id WHERE tc.status NOT IN ('ok', 'pending', 'running') AND c.tool_call_ref IS NULL;
SELECT cause, COUNT(*) FROM tool_call_causes WHERE cause NOT IN ('hook-refusal','permission-denied','interrupted','cancelled','ward-red','ward-red-hidden','mcp-refused','nonzero-exit','tool-error','timeout','orphaned') GROUP BY 1;
SELECT COUNT(*) AS soft_on_failed FROM tool_call_causes c JOIN tool_calls tc ON tc.id = c.tool_call_ref WHERE c.soft_failure IS NOT NULL AND tc.status <> 'ok';
```

### A.27 Row counts of every table

Save as `$T/count-tables.mjs` and run `node --no-warnings $T/count-tables.mjs "$DB"`:

```js
import { DatabaseSync } from 'node:sqlite';
const db = new DatabaseSync(process.argv[2], { readOnly: true });
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all();
for (const { name } of tables) {
  console.log(name.padEnd(24), db.prepare(`SELECT COUNT(*) AS n FROM "${name}"`).get().n);
}
db.close();
```

The list holds the tables `schema.md` names and none of the twelve trimmed ones (CL-SCH-01).

### A.28 Messages, usage, events and blocks agree (expect zeros)

```sql
SELECT (SELECT COUNT(*) FROM messages m WHERE m.role = 'assistant' AND m.is_synthetic = 0 AND NOT EXISTS (SELECT 1 FROM usage u WHERE u.message_ref = m.id)) AS assistant_without_usage, (SELECT COUNT(*) FROM usage u WHERE NOT EXISTS (SELECT 1 FROM messages m WHERE m.id = u.message_ref)) AS usage_without_message, (SELECT COUNT(*) FROM usage u JOIN messages m ON m.id = u.message_ref WHERE m.role <> 'assistant' AND m.natural_key NOT LIKE '%:ckpt:%') AS usage_on_non_assistant, (SELECT COUNT(*) FROM messages m JOIN llm_sessions s ON s.id = m.session_ref WHERE m.role = 'assistant' AND s.detail_state = 'full' AND NOT EXISTS (SELECT 1 FROM events e WHERE e.message_ref = m.id)) AS assistant_without_event, (SELECT COUNT(*) FROM events e WHERE e.kind IN ('user-message', 'assistant-block', 'agent-message') AND NOT EXISTS (SELECT 1 FROM content_blocks b WHERE b.event_ref = e.id)) AS message_events_without_blocks;
```

### A.29 Calls and results agree (expect zeros)

```sql
SELECT (SELECT COUNT(*) FROM tool_calls tc WHERE tc.is_stub = 0 AND tc.status IN ('ok', 'error', 'denied', 'interrupted') AND NOT EXISTS (SELECT 1 FROM tool_results r WHERE r.tool_call_ref = tc.id)) AS finished_without_result, (SELECT COUNT(*) FROM tool_calls tc WHERE tc.status = 'orphaned' AND EXISTS (SELECT 1 FROM tool_results r WHERE r.tool_call_ref = tc.id)) AS orphaned_with_result, (SELECT COUNT(*) FROM tool_results r WHERE NOT EXISTS (SELECT 1 FROM tool_calls tc WHERE tc.id = r.tool_call_ref)) AS result_without_call_row;
```

### A.30 Unresolved stubs

```sql
SELECT 'session' AS t, natural_key, kind AS what, started_at AS at FROM llm_sessions WHERE is_stub = 1 UNION ALL SELECT 'call', natural_key, tool_name, requested_at FROM tool_calls WHERE is_stub = 1 LIMIT 100;
```

### A.31 Nulls where values belong (expect zeros)

```sql
SELECT (SELECT COUNT(*) FROM llm_sessions WHERE is_stub = 0 AND started_at IS NULL) AS sessions_no_start, (SELECT COUNT(*) FROM messages WHERE role = 'assistant' AND is_synthetic = 0 AND model IS NULL) AS assistant_no_model, (SELECT COUNT(*) FROM tool_calls WHERE is_stub = 0 AND tool_name = '(unresolved)') AS unresolved_names, (SELECT COUNT(*) FROM usage WHERE model IS NULL OR model = '') AS usage_no_model, (SELECT COUNT(*) FROM llm_sessions WHERE is_stub = 0 AND harness = 'claude-code' AND cwd IS NULL) AS sessions_no_cwd, (SELECT COUNT(*) FROM tool_calls WHERE status IN ('ok', 'error') AND completed_at IS NULL) AS finished_no_end;
```

### A.32 Same text twice in one session (expect no rows)

```sql
SELECT a.session_ref, a.ts, substr(ba.text, 1, 60) AS text FROM events a JOIN events b ON b.session_ref = a.session_ref AND b.id > a.id AND b.ts = a.ts AND b.kind = a.kind JOIN content_blocks ba ON ba.event_ref = a.id JOIN content_blocks bb ON bb.event_ref = b.id AND bb.idx = ba.idx AND bb.text = ba.text WHERE a.copied_from_event_ref IS NULL AND b.copied_from_event_ref IS NULL LIMIT 20;
```

### A.33 The session tree holds together (expect zeros and no rows)

```sql
SELECT COUNT(*) AS roots_not_self FROM llm_sessions WHERE parent_session_ref IS NULL AND root_session_ref <> id AND is_stub = 0;
SELECT COUNT(*) AS split_roots FROM llm_sessions c JOIN llm_sessions p ON p.id = c.parent_session_ref WHERE c.root_session_ref <> p.root_session_ref;
SELECT c.natural_key, c.spawn_depth, p.spawn_depth AS parent_depth FROM llm_sessions c JOIN llm_sessions p ON p.id = c.parent_session_ref WHERE c.spawn_depth <> p.spawn_depth + 1 LIMIT 20;
SELECT w.natural_key, w.native_session_id FROM work_items w WHERE w.native_session_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM llm_sessions s WHERE s.native_id = w.native_session_id AND s.work_item_ref = w.id) LIMIT 20;
```

### A.34 Times and durations (expect zeros)

```sql
SELECT (SELECT COUNT(*) FROM events WHERE ts < 1735689600000 OR ts > (unixepoch() + 3600) * 1000) AS events_bad_ts, (SELECT COUNT(*) FROM llm_sessions WHERE ended_at < started_at) AS end_before_start, (SELECT COUNT(*) FROM tool_calls WHERE latency_ms < 0 OR latency_ms > 86400000) AS bad_latency, (SELECT COUNT(*) FROM turns WHERE duration_ms < 0 OR (ended_at IS NOT NULL AND abs(duration_ms - (ended_at - started_at)) > 60000)) AS odd_turns, (SELECT COUNT(*) FROM rollup_session rs JOIN llm_sessions s ON s.id = rs.session_ref WHERE s.ended_at IS NOT NULL AND rs.active_ms > s.ended_at - s.started_at + 1000) AS active_over_span;
SELECT COUNT(*) AS order_inversions FROM events a JOIN events b ON b.session_ref = a.session_ref AND b.seq = a.seq + 1 WHERE b.ts < a.ts - 60000 AND b.copied_from_event_ref IS NULL;
```

`1735689600000` is 2025-01-01 UTC.

### A.35 Totals against the harness's reported cost

`rollup_session.last_reported_cost_usd` is the harness's own newest cumulative figure (Claude `cost-state`, or stdout
`result`); the headline cost is `usage` × pricing (design §9, §16). No table keeps the `cost-state` token totals, so
the token side of the check is B.7 on the root's last `cost-state` record (`record_type = 'cost-state'`) against the
tree's `out_tokens` here.

```sql
WITH tree AS (SELECT s.root_session_ref AS root, SUM(rs.est_cost_usd) AS est_cost, SUM(rs.output_tokens) AS out_tokens FROM rollup_session rs JOIN llm_sessions s ON s.id = rs.session_ref GROUP BY 1) SELECT r.natural_key, ROUND(rr.last_reported_cost_usd, 4) AS reported_cost, ROUND(t.est_cost, 4) AS est_cost, ROUND(100.0 * (t.est_cost - rr.last_reported_cost_usd) / rr.last_reported_cost_usd, 2) AS pct_diff, t.out_tokens, (SELECT raw_id FROM raw_records WHERE session_ref = r.id AND record_type = 'cost-state' ORDER BY ingest_seq DESC LIMIT 1) AS last_cost_state_raw_id, (SELECT COUNT(*) FROM events e WHERE e.session_ref = r.id AND e.copied_from_event_ref IS NOT NULL) AS copies FROM tree t JOIN llm_sessions r ON r.id = t.root JOIN rollup_session rr ON rr.session_ref = r.id WHERE r.parent_session_ref IS NULL AND rr.last_reported_cost_usd > 0 ORDER BY abs(pct_diff) DESC LIMIT 30;
```

A session with `copies > 0` is a resumed one; `cost-state` undercounts those.

### A.36 Value shapes (expect zeros)

```sql
SELECT (SELECT COUNT(*) FROM tool_calls WHERE input_json IS NOT NULL AND NOT json_valid(input_json)) AS bad_input_json, (SELECT COUNT(*) FROM tool_results WHERE details_json IS NOT NULL AND NOT json_valid(details_json)) AS bad_details_json, (SELECT COUNT(*) FROM events WHERE details_json IS NOT NULL AND NOT json_valid(details_json)) AS bad_event_details_json, (SELECT COUNT(*) FROM llm_sessions WHERE (init_tools_json IS NOT NULL AND NOT json_valid(init_tools_json)) OR (init_mcp_servers_json IS NOT NULL AND NOT json_valid(init_mcp_servers_json)) OR (init_agents_json IS NOT NULL AND NOT json_valid(init_agents_json)) OR (init_skills_json IS NOT NULL AND NOT json_valid(init_skills_json))) AS bad_init_json, (SELECT COUNT(*) FROM sources WHERE NOT json_valid(watermark_json)) AS bad_watermarks, (SELECT COUNT(*) FROM llm_sessions WHERE length(last_prompt_preview) > 300) AS long_prompt_preview, (SELECT COUNT(*) FROM attachments WHERE length(preview) > 300) AS long_attachment_preview, (SELECT COUNT(*) FROM hook_runs WHERE length(output_preview) > 300 OR length(stderr_preview) > 300) AS long_hook_preview, (SELECT COUNT(*) FROM tool_calls WHERE length(input_summary) > 300) AS long_input_summary;
```

### A.37 Natural keys follow the recipes (expect zeros)

```sql
SELECT 'session prefix' AS rule, COUNT(*) AS bad FROM llm_sessions WHERE natural_key NOT GLOB 'claude-code:*' AND natural_key NOT GLOB 'antigravity:*' AND natural_key NOT GLOB 'dungeonmaster:*' UNION ALL SELECT 'claude child has parent', COUNT(*) FROM llm_sessions WHERE harness = 'claude-code' AND kind IN ('subagent', 'workflow-agent', 'fork') AND natural_key NOT GLOB 'claude-code:*/*' UNION ALL SELECT 'claude call', COUNT(*) FROM tool_calls WHERE natural_key GLOB 'claude-code:*' AND natural_key NOT GLOB 'claude-code:toolu_*' AND natural_key NOT GLOB 'claude-code:srvtoolu_*' UNION ALL SELECT 'agy call has conversation', COUNT(*) FROM tool_calls WHERE natural_key GLOB 'antigravity:*' AND natural_key NOT GLOB 'antigravity:*-*-*-*-*:*' UNION ALL SELECT 'event under its session', COUNT(*) FROM events e JOIN llm_sessions s ON s.id = e.session_ref WHERE substr(e.natural_key, 1, length(s.natural_key) + 1) <> s.natural_key || ':' UNION ALL SELECT 'agy arrival key', COUNT(*) FROM events WHERE kind = 'agent-message' AND natural_key GLOB 'antigravity:*' AND natural_key NOT GLOB '*:msg:*' UNION ALL SELECT 'agy arrival link key', COUNT(*) FROM events WHERE kind = 'agent-message' AND natural_key GLOB 'antigravity:*' AND link_key NOT GLOB 'antigravity:msg:*';
```

### A.38 One session's timeline, as text

```sql
SELECT seq, datetime(ts / 1000, 'unixepoch') AS t, kind, subtype, tool_name, tool_status, cause, provisional, substr(replace(text_preview, char(10), ' '), 1, 120) AS preview FROM timeline WHERE session_key = '<SESSION_KEY>' ORDER BY seq, event_ref LIMIT 300;
```

### A.39 Reasoning effort, before and after phase 1b

```sql
SELECT harness, record_type, field_path, parsed, SUM(count) AS seen FROM schema_observations WHERE field_path LIKE '%ffort%' OR field_path LIKE '%10.1.28%' GROUP BY 1, 2, 3, 4;
SELECT kind, harness, field_path, acknowledged_at FROM schema_drift WHERE field_path LIKE '%ffort%' OR field_path LIKE '%10.1.28%';
SELECT name FROM pragma_table_info('messages') WHERE name = 'effort';
```

### A.40 The re-normalize

```sql
SELECT cause, COUNT(*) AS jobs, SUM(sources_read) AS sources, MIN(started_at) AS started, MAX(finished_at) AS finished FROM ingest_jobs WHERE cause LIKE 'reingest:%' GROUP BY 1;
SELECT harness, normalizer, COUNT(*) FROM llm_sessions GROUP BY 1, 2;
SELECT normalizer, COUNT(*) FROM messages GROUP BY 1;
```

After 1b, every Claude and agy message carries the bumped normalizer version; a session with a mix is a half
re-normalize.

### A.41 Effort values against their raw records

```sql
SELECT natural_key, model, effort, raw_id FROM messages WHERE natural_key GLOB 'claude-code:*' AND role = 'assistant' ORDER BY random() LIMIT 20;
SELECT natural_key, model, effort, raw_id FROM messages WHERE natural_key GLOB 'antigravity:*:gen:*' ORDER BY random() LIMIT 20;
SELECT effort, COUNT(*) FROM messages GROUP BY 1;
```

Print each `raw_id` with B.7 and read the field by eye.

### A.42 The schema, for diffs

```sql
SELECT type, name, tbl_name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name;
```

Run it with `qj` into a file for each store, then `diff`.

### A.43 Hunting for missed secrets

```sql
SELECT 'content_blocks' AS src, id, substr(text, 1, 160) AS sample FROM content_blocks WHERE text GLOB '*sk-ant-*' OR text GLOB '*AKIA[A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9]*' OR text GLOB '*ghp_*' OR text GLOB '*xox[bp]-*' OR text GLOB '*AIza*' OR text GLOB '*-----BEGIN*PRIVATE KEY*' OR text LIKE '%Bearer %' OR text GLOB '*://*:*@*' UNION ALL SELECT 'tool_results', tool_call_ref, substr(text, 1, 160) FROM tool_results WHERE text GLOB '*sk-ant-*' OR text GLOB '*AKIA[A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9]*' OR text GLOB '*ghp_*' OR text GLOB '*xox[bp]-*' OR text GLOB '*AIza*' OR text GLOB '*-----BEGIN*PRIVATE KEY*' OR text LIKE '%Bearer %' OR text GLOB '*://*:*@*' UNION ALL SELECT 'tool_calls', id, substr(input_json, 1, 160) FROM tool_calls WHERE input_json GLOB '*sk-ant-*' OR input_json GLOB '*ghp_*' OR input_json GLOB '*-----BEGIN*PRIVATE KEY*' OR input_json LIKE '%Bearer %' OR input_json GLOB '*://*:*@*' LIMIT 200;
```

Many hits will be harmless: docs that mention a prefix, `http://localhost` URLs with an `@` in a path. Read each.
Then run B.12's archive and blob scan with the same patterns, because over-4 KB texts live in blobs.

### A.44 Drill-down instances for one cause

```sql
SELECT tc.natural_key, wi.natural_key AS work_item_id, wi.role, datetime(tc.requested_at / 1000, 'unixepoch') AS at, tc.input_summary, substr(tr.text, 1, 300) AS preview, tr.text_chars FROM tool_call_causes c JOIN tool_calls tc ON tc.id = c.tool_call_ref JOIN llm_sessions s ON s.id = tc.session_ref JOIN quests q ON q.id = s.quest_ref LEFT JOIN work_items wi ON wi.id = s.work_item_ref LEFT JOIN tool_results tr ON tr.tool_call_ref = tc.id WHERE q.natural_key = '<QUEST_ID>' AND c.cause = '<CAUSE>' ORDER BY tc.requested_at DESC LIMIT 50;
```

### A.45 The View Context window

```sql
WITH target AS (SELECT e.session_ref, e.seq FROM events e JOIN tool_calls tc ON tc.id = e.tool_call_ref WHERE tc.natural_key = '<TOOL_CALL_KEY>' ORDER BY e.seq LIMIT 1) SELECT t.seq, t.kind, t.tool_name, t.tool_status, substr(t.text_preview, 1, 80) AS preview FROM timeline t, target WHERE t.session_ref = target.session_ref AND t.seq BETWEEN target.seq - 40 AND target.seq + 20 ORDER BY t.seq, t.event_ref;
```

`seq` is not unique, so the window is approximate at its edges; the drawer must hold at least these rows.

### A.46 The badges

```sql
SELECT w.natural_key AS work_item, w.ward_run_id, w.ward_exit_code, w.ward_checks_json, w.ward_slow_tests_only FROM work_items w JOIN quests q ON q.id = w.quest_ref WHERE q.natural_key = '<QUEST_ID>' AND w.ward_exit_code <> 0 AND w.ward_checks_json NOT LIKE '%fail%';
SELECT tc.natural_key, json_extract(tr.details_json, '$.ward.runId') AS run_id, json_extract(tr.details_json, '$.ward.exitCode') AS exit_code, json_extract(tr.details_json, '$.ward.checks') AS checks FROM tool_results tr JOIN tool_calls tc ON tc.id = tr.tool_call_ref JOIN llm_sessions s ON s.id = tc.session_ref WHERE s.quest_ref = (SELECT id FROM quests WHERE natural_key = '<QUEST_ID>') AND json_extract(tr.details_json, '$.ward.exitCode') <> 0 AND json_extract(tr.details_json, '$.ward.checks') NOT LIKE '%fail%';
SELECT s.natural_key, s.end_state, s.exit_signal FROM llm_sessions s WHERE s.quest_ref = (SELECT id FROM quests WHERE natural_key = '<QUEST_ID>') AND s.end_state IN ('killed', 'signalled');
```

The first query is a ward STEP whose exit code disagrees with its checks, the second the same for a ward run an
agent made through Bash.

For refusal loops, list one session's calls in order (`qj` with `ORDER BY requested_at`) and count the longest run
of the same tool with a non-`ok` status.

### A.47 A quest's token line

```sql
SELECT MAX(u.context_tokens) AS ctx, MAX(u.context_limit) AS ctx_limit FROM usage u JOIN llm_sessions s ON s.id = u.session_ref WHERE s.end_state = 'running' AND s.quest_ref = (SELECT id FROM quests WHERE natural_key = '<QUEST_ID>') AND u.ts = (SELECT MAX(u2.ts) FROM usage u2 WHERE u2.session_ref = u.session_ref);
SELECT wi.role, SUM(u.input_tokens + u.cache_read_tokens + u.cache_write_tokens + u.output_tokens) AS all_tokens, SUM(u.input_tokens + u.output_tokens) AS in_out_tokens, ROUND(SUM(u.est_cost_usd), 2) AS est_cost FROM usage u JOIN llm_sessions s ON s.id = u.session_ref JOIN work_items wi ON wi.id = s.work_item_ref WHERE s.quest_ref = (SELECT id FROM quests WHERE natural_key = '<QUEST_ID>') GROUP BY 1;
```

### A.48 Health view figures

```sql
WITH d AS (SELECT ttft_ms FROM session_results WHERE ts > (unixepoch() - 3600) * 1000 AND ttft_ms IS NOT NULL) SELECT COUNT(*) AS n, (SELECT ttft_ms FROM d ORDER BY ttft_ms LIMIT 1 OFFSET (SELECT COUNT(*) / 2 FROM d)) AS p50, (SELECT ttft_ms FROM d ORDER BY ttft_ms LIMIT 1 OFFSET (SELECT COUNT(*) * 95 / 100 FROM d)) AS p95 FROM d;
SELECT (SELECT COUNT(*) FROM errors WHERE kind IN ('api-error', 'overloaded') AND ts > (unixepoch() - 3600) * 1000) AS errors_1h, (SELECT COUNT(*) FROM messages WHERE role = 'assistant' AND started_at > (unixepoch() - 3600) * 1000) AS api_messages_1h;
SELECT * FROM rate_limit_samples ORDER BY received_at DESC LIMIT 1;
SELECT backend, COUNT(*) AS calls, SUM(status <> 'ok') AS failed FROM model_calls WHERE started_at > (unixepoch() - 3600) * 1000 GROUP BY 1;
```

### A.49 Timeline inputs for one work item

```sql
SELECT datetime(tc.requested_at / 1000, 'unixepoch') AS at, tc.tool_name, substr(tc.input_summary, 1, 80) AS input, tc.status, tc.latency_ms FROM tool_calls tc JOIN llm_sessions s ON s.id = tc.session_ref WHERE s.work_item_ref = (SELECT id FROM work_items WHERE natural_key = '<WORK_ITEM_ID>') ORDER BY tc.requested_at;
```

### A.50 Sends and their arrivals (a LEFT JOIN: about 7% of Claude sends never arrive)

```sql
SELECT tc.natural_key AS send, s.natural_key AS sender, se.link_key, a.natural_key AS arrival, r.natural_key AS recipient, a.subtype, a.is_meta, a.ts - se.ts AS delay_ms, a.tool_call_ref = se.tool_call_ref AS points_at_send FROM events se JOIN tool_calls tc ON tc.id = se.tool_call_ref JOIN llm_sessions s ON s.id = se.session_ref LEFT JOIN events a ON a.link_key = se.link_key AND a.kind = 'agent-message' LEFT JOIN llm_sessions r ON r.id = a.session_ref WHERE se.link_key IS NOT NULL AND se.kind <> 'agent-message' ORDER BY se.ts LIMIT 50;
SELECT CASE WHEN se.link_key LIKE 'antigravity:msg:%' THEN 'antigravity' ELSE 'claude-code' END AS harness, COUNT(DISTINCT se.id) AS sends, COUNT(DISTINCT CASE WHEN a.id IS NULL THEN se.id END) AS no_arrival FROM events se LEFT JOIN events a ON a.link_key = se.link_key AND a.kind = 'agent-message' WHERE se.link_key IS NOT NULL AND se.kind <> 'agent-message' GROUP BY 1;
```

Each send appears once per arrival and once with NULL columns when none arrived; a send listed twice has two
arrivals, which CL-MSG-08 asks about.

### A.51 Arrivals

```sql
SELECT e.subtype, e.is_meta, COUNT(*) AS arrivals, SUM(e.tool_call_ref IS NOT NULL) AS with_send, SUM(EXISTS (SELECT 1 FROM llm_sessions p WHERE p.natural_key = json_extract(e.details_json, '$.peerSessionKey'))) AS peer_resolves FROM events e WHERE e.kind = 'agent-message' GROUP BY 1, 2;
SELECT e.natural_key, s.natural_key AS recipient, json_extract(e.details_json, '$.peerSessionKey') AS sender, e.link_key, (SELECT COUNT(*) FROM content_blocks b WHERE b.event_ref = e.id) AS blocks FROM events e JOIN llm_sessions s ON s.id = e.session_ref WHERE e.kind = 'agent-message' ORDER BY random() LIMIT 20;
```

`peer_resolves` equals `arrivals` once every session is read. For a Claude arrival, recompute `link_key` in python
as `<recipient agentId>:<sha256(body)>` with the wrapper stripped and compare.

### A.52 Interventions, and the double-storage check

```sql
SELECT subtype, json_extract(details_json, '$.source') AS source, COUNT(*) AS n FROM events WHERE kind = 'intervention' GROUP BY 1, 2 ORDER BY 3 DESC;
SELECT subtype, COUNT(*) AS outside_list FROM events WHERE kind = 'intervention' AND subtype NOT IN ('enqueue','dequeue','remove','pop-all','interrupt','user-rejected','permission-denied','mode-change','slash-command','kill-agents','hook-block') GROUP BY 1;
SELECT a.natural_key AS arrival, i.natural_key AS intervention FROM events a JOIN events i ON i.raw_id = a.raw_id AND i.id <> a.id WHERE a.kind = 'agent-message' AND i.kind IN ('intervention', 'user-message') LIMIT 20;
SELECT natural_key, subtype, details_json FROM events WHERE kind = 'intervention' AND natural_key LIKE '%:intervention' LIMIT 20;
```

The second and third queries return no rows. The fourth shows interventions drawn from a record that also yields an
event of another kind.

### A.53 Claude usage per hour, for the quota display and the dispatch hold

```sql
SELECT (u.ts / 3600000) * 3600000 AS hour_start, SUM(u.input_tokens) AS input, SUM(u.cache_read_tokens) AS cache_read, SUM(u.cache_write_tokens) AS cache_write, SUM(u.output_tokens) AS output FROM usage u WHERE u.provider = 'anthropic' AND u.ts >= ((unixepoch() - 7 * 86400) / 3600) * 3600000 GROUP BY 1 ORDER BY 1;
SELECT hour_start, SUM(input_tokens) AS input, SUM(cache_read_tokens) AS cache_read, SUM(cache_write_tokens) AS cache_write, SUM(output_tokens) AS output FROM rollup_hour WHERE harness = 'claude-code' AND hour_start >= ((unixepoch() - 7 * 86400) / 3600) * 3600000 GROUP BY 1 ORDER BY 1;
SELECT SUM(input_tokens + cache_read_tokens + cache_write_tokens + output_tokens) AS five_hour_all_tokens, SUM(input_tokens + output_tokens) AS five_hour_in_out FROM usage WHERE provider = 'anthropic' AND ts >= (unixepoch() - 5 * 3600) * 1000;
```

The first two queries agree hour by hour. The third gives the 5-hour window two ways; compare the one that matches
the token kinds the quota display adds (record which, G26).

### A.54 Rate-limit samples

```sql
SELECT COUNT(*) AS samples, SUM(session_ref IS NULL) AS no_session, MIN(received_at) AS first_at, MAX(received_at) AS last_at FROM rate_limit_samples;
SELECT raw_id, received_at, limit_type, status, utilization, five_hour_utilization, datetime(five_hour_resets_at / 1000, 'unixepoch') AS five_hour_resets, seven_day_utilization, datetime(seven_day_resets_at / 1000, 'unixepoch') AS seven_day_resets FROM rate_limit_samples ORDER BY received_at DESC LIMIT 5;
```

### A.55 Eviction jobs

```sql
SELECT tier, COUNT(*) AS jobs, SUM(bytes_freed) AS bytes_freed, SUM(source_ref IS NOT NULL) AS by_source, SUM(session_ref IS NOT NULL) AS by_session FROM ingest_jobs WHERE cause = 'evict' GROUP BY tier;
```

Tier 1 jobs carry `source_ref`; tier 2 and 3 jobs carry `session_ref`.

### A.56 Ward verdicts, step and Bash run

```sql
SELECT w.natural_key AS work_item, w.role, w.ward_result_id, w.ward_run_id, w.ward_exit_code, w.ward_checks_json, w.ward_slow_tests_only FROM work_items w JOIN quests q ON q.id = w.quest_ref WHERE q.natural_key = '<QUEST_ID>' AND w.ward_result_id IS NOT NULL;
SELECT tc.natural_key, json_extract(tr.details_json, '$.ward.runId') AS run_id, json_extract(tr.details_json, '$.ward.exitCode') AS exit_code, json_extract(tr.details_json, '$.ward.checks') AS checks, json_extract(tr.details_json, '$.ward.slowTestsOnly') AS slow_tests_only, json_extract(tr.details_json, '$.softFailure.kind') AS soft_failure_kind FROM tool_results tr JOIN tool_calls tc ON tc.id = tr.tool_call_ref WHERE json_extract(tr.details_json, '$.ward.runId') IS NOT NULL LIMIT 20;
```

# Appendix B: recipes

### B.1 The sandbox

See "ENV-S setup" above. Remove it with `rm -rf "$T"` when done; it holds copied credentials.

### B.2 Load a frozen quest into the sandbox (from `tmp/chronicle-reference/`)

1. Create a guild in the sandbox UI (any repo path; a kept consumer from `check:consumer` works). Note its id `G`.
2. Stop the server.
3. Copy the quest and its transcripts:
   ```bash
   cp -a tmp/chronicle-reference/<questId>/quest-folder "$DM_HOME/guilds/$G/quests/<questId>"
   cp -a tmp/chronicle-reference/<questId>/claude-projects/. "$SH/.claude/projects/"
   ```
4. Start the server. The quest mirror picks up the folder; the import picks up the transcripts.

Or leave the transcripts in the frozen tree and point the harness root at them: make a root directory whose
`projects` entry is a symlink to the frozen `claude-projects/`, and start the server with `CLAUDE_CONFIG_DIR` set to
that directory (CL-HOM-07). The frozen tree itself is never written to.

### B.3 First-sighting probe

Save as `$T/probe.py`, run `python3 $T/probe.py "$DB" | tee $T/probe.jsonl`. It opens a fresh read-only
connection every 50 ms and prints each session the first time it appears, with whether it already had its quest.

```python
import json, sqlite3, sys, time
db, cursor, seen = sys.argv[1], 0, set()
while True:
    con = sqlite3.connect(f'file:{db}?mode=ro', uri=True)
    rows = con.execute(
        'SELECT natural_key, kind, spawn_depth, quest_ref, linked_by, change_seq, '
        '(SELECT COUNT(*) FROM events e WHERE e.session_ref = s.id) '
        'FROM llm_sessions s WHERE change_seq > ? ORDER BY change_seq', (cursor,)).fetchall()
    con.close()
    for key, kind, depth, quest, linked_by, seq, events in rows:
        cursor = max(cursor, seq)
        if key not in seen:
            seen.add(key)
            print(json.dumps({'t': round(time.time(), 3), 'key': key, 'kind': kind, 'depth': depth,
                              'linked': quest is not None, 'linked_by': linked_by,
                              'events_at_first_sight': events}), flush=True)
    time.sleep(0.05)
```

A pass: every line for a quest's session or sub-agent says `"linked": true`, with `linked_by` `dispatcher` for a
dispatched main session and `inherited` for its sub-agents.

### B.4 File operations for the source cases (ENV-S only)

```bash
F="$SH/.claude/projects/<project>/<session>.jsonl"
cp "$F" "$F.new" && mv "$F.new" "$F"                                   # replace: new inode, same bytes
truncate -s $(( $(stat -c %s "$F") / 2 )) "$F"                         # truncate
dd if=/dev/urandom of="$F" bs=1 count=100 conv=notrunc                 # rewrite the head in place
dd if=/dev/urandom of="$F" bs=1 count=50 seek=$(( $(stat -c %s "$F") - 200 )) conv=notrunc   # rewrite near the end
python3 -c "import sys;l=open(sys.argv[1]).readlines()[-1];h=len(l)//2;open(sys.argv[1],'a').write(l[:h])" "$F"  # half a line
```

For a valid appended line, copy an existing line and give it a new `uuid` (and a new `message.id` for an
assistant line) with a short python edit, so it is a new record rather than a copy.

### B.5 Usage census (deduped by `message.id`)

Save as `$T/usage_census.py`; run `python3 $T/usage_census.py <transcript files...>`.

```python
import json, sys
final = {}
for path in sys.argv[1:]:
    for line in open(path, errors='replace'):
        try:
            r = json.loads(line)
        except ValueError:
            continue
        m = r.get('message') or {}
        if r.get('type') != 'assistant' or not m.get('id') or not m.get('usage') or m.get('model') == '<synthetic>':
            continue
        final[m['id']] = m['usage']          # later lines of one message carry its final usage
keys = ('input_tokens', 'cache_read_input_tokens', 'cache_creation_input_tokens', 'output_tokens')
print(len(final), {k: sum((u.get(k) or 0) for u in final.values()) for k in keys})
```

### B.6 On-disk census

Save as `$T/census.py`; run `python3 $T/census.py "$SH"`. It counts what the store should hold, by kind.

```python
import collections, json, os, sys
home = sys.argv[1]
claude = os.path.join(home, '.claude', 'projects')
agy = os.path.join(home, '.gemini', 'antigravity-cli')
counts, versions = collections.Counter(), collections.Counter()
for root, dirs, files in os.walk(claude):
    for f in files:
        p = os.path.join(root, f)
        if f.endswith('.jsonl') and '/subagents/' in p and f.startswith('agent-'):
            counts['claude subagent transcript'] += 1
        elif f.endswith('.jsonl') and f == 'journal.jsonl':
            counts['claude workflow journal'] += 1
        elif f.endswith('.jsonl') and '/subagents/' not in p and '/tool-results/' not in p:
            counts['claude main transcript'] += 1
        elif f.endswith('.meta.json'):
            counts['claude subagent meta'] += 1
        elif '/tool-results/' in p:
            counts['claude spill file'] += 1
        if f.endswith('.jsonl'):
            for line in open(p, errors='replace'):
                try:
                    v = json.loads(line).get('version')
                except ValueError:
                    continue
                if v:
                    versions[v] += 1
for sub, label, suffix in (('conversations', 'agy conversation db', '.db'),):
    d = os.path.join(agy, sub)
    if os.path.isdir(d):
        counts[label] = sum(1 for f in os.listdir(d) if f.endswith(suffix))
for root, dirs, files in os.walk(os.path.join(agy, 'brain')):
    if root.endswith('/subagents'):
        counts['agy subagent link'] += sum(1 for f in files if f.endswith('.json'))
    if root.endswith('/messages'):
        counts['agy message file'] += sum(1 for f in files if f.endswith('.json') and f != 'read.json')
print(json.dumps(counts, indent=1))
print('claude versions seen:', len(versions))
```

For one file's expected rows (distinct `message.id`, `toolu_` ids, `tool_result` blocks, records with a `uuid`),
extend the loop over that one file; the field maps list the shapes.

For an agy conversation, never open the live `.db` (a reader can leave `-wal`/`-shm` behind). Copy it first:
`cp conv.db $T/conv.db && python3 -c "import sqlite3,sys;c=sqlite3.connect(sys.argv[1]);print(c.execute('SELECT step_type, COUNT(*) FROM steps GROUP BY 1').fetchall())" $T/conv.db`.

### B.7 Print one raw record from the store

Save as `$T/raw.mjs`; run `node --no-warnings $T/raw.mjs "$DB" <raw_id>`. It reads from `raw_tail` or from the
segment chunk, and checks the hash when the record was not redacted. If the segment format adds a header or a
length prefix to each chunk, adjust the offsets to match the shipped format.

```js
import { DatabaseSync } from 'node:sqlite';
import { openSync, readSync, closeSync } from 'node:fs';
import { zstdDecompressSync } from 'node:zlib';
import { createHash } from 'node:crypto';
const [dbPath, rawId] = process.argv.slice(2);
const db = new DatabaseSync(dbPath, { readOnly: true });
const r = db.prepare('SELECT r.*, s.path, t.bytes FROM raw_records r LEFT JOIN archive_segments s ON s.id = r.segment_ref LEFT JOIN raw_tail t ON t.raw_id = r.raw_id WHERE r.raw_id = ?').get(Number(rawId));
db.close();
if (!r) { console.error('no such raw_id'); process.exit(1); }
let bytes;
if (r.bytes) {
  bytes = Buffer.from(r.bytes);
} else if (r.path) {
  const fd = openSync(r.path, 'r');
  const chunk = Buffer.alloc(r.chunk_stored_bytes);
  readSync(fd, chunk, 0, r.chunk_stored_bytes, r.chunk_offset);
  closeSync(fd);
  bytes = zstdDecompressSync(chunk).subarray(r.record_offset, r.record_offset + r.record_len);
} else {
  console.error('evicted at', r.evicted_at); process.exit(2);
}
process.stdout.write(bytes + '\n');
if (!r.redacted) console.error('hash matches:', createHash('sha256').update(bytes).digest('hex') === r.content_hash);
```

To scan the whole archive for a pattern, loop over
`SELECT DISTINCT segment_ref, chunk_offset, chunk_stored_bytes FROM raw_records WHERE segment_ref IS NOT NULL`,
decompress each chunk once, and search it.

### B.8 Quest mirror check

```python
import glob, json, sqlite3, sys
home, db = sys.argv[1], sys.argv[2]
con = sqlite3.connect(f'file:{db}?mode=ro', uri=True)
stored = {k: (t, s) for k, t, s in con.execute('SELECT natural_key, title, status FROM quests')}
con.close()
for path in glob.glob(f'{home}/guilds/*/quests/*/quest.json'):
    q = json.load(open(path))
    got = stored.get(q['id'])
    if got != (q.get('title'), q.get('status')):
        print('MISMATCH', q['id'], 'file:', (q.get('title'), q.get('status')), 'store:', got)
print('checked', len(stored), 'stored quests')
```

### B.9 Watching file access

```bash
strace -f -e trace=openat,inotify_add_watch -o "$T/trace.txt" -p <pid>    # Ctrl-C to stop
python3 -c "import sys;print(sum(sys.argv[2] in l for l in open(sys.argv[1])))" "$T/trace.txt" "$HOME/.claude"
```

The `strace` needs `ptrace` rights over the process (same user; `kernel.yama.ptrace_scope` 0 or 1 with `sudo`).

### B.10 Killing at the right moment

Kill the instant a file grows (`archive/*.seg` for sealing, `blobs/*/*/*` for blob writes):

```python
import glob, os, signal, sys, time
pid, pattern = int(sys.argv[1]), sys.argv[2]
sizes = {p: os.path.getsize(p) for p in glob.glob(pattern)}
while True:
    for p in glob.glob(pattern):
        s = os.path.getsize(p)
        if p not in sizes or s != sizes[p]:
            os.kill(pid, signal.SIGKILL)
            print('killed at', p, s)
            sys.exit(0)
    time.sleep(0.002)
```

Random kills during an import: `for i in $(seq 10); do sleep $((RANDOM % 20 + 5)); kill -9 <pid>; sleep 2; <restart>; done`,
looking the pid up again after each restart. Freeze instead of kill with `kill -STOP` / `kill -CONT`.

These are races, not guarantees. A deterministic fault point in the code would make them exact (G8).

### B.11 A dump for before/after diffs

Integer ids and `change_seq` differ between runs, so dump by natural key:

```bash
for sql in \
 "SELECT session_key, event_key, kind, subtype, tool_call_key, tool_status, cause, provisional, text_preview FROM timeline ORDER BY event_key" \
 "SELECT natural_key, role, model, stop_reason, provisional FROM messages ORDER BY natural_key" \
 "SELECT m.natural_key, u.input_tokens, u.cache_read_tokens, u.cache_write_tokens, u.output_tokens, u.is_partial FROM usage u JOIN messages m ON m.id = u.message_ref ORDER BY 1" \
 "SELECT tc.natural_key, tc.tool_name, tc.status, tc.latency_ms, tr.is_error, tr.text_chars FROM tool_calls tc LEFT JOIN tool_results tr ON tr.tool_call_ref = tc.id ORDER BY 1" \
 "SELECT s.natural_key, s.kind, p.natural_key, s.spawn_depth, s.end_state, s.detail_state, s.linked_by FROM llm_sessions s LEFT JOIN llm_sessions p ON p.id = s.parent_session_ref ORDER BY 1" \
 "SELECT natural_key, kind, subtype, link_key, details_json FROM events WHERE kind IN ('agent-message', 'intervention') ORDER BY natural_key"
do qj "$sql"; done > "$T/dump-$(date +%s).jsonl"
diff "$T/dump-<before>.jsonl" "$T/dump-<after>.jsonl"
```

Add a `WHERE` on a quest's sessions to keep it small.

### B.12 Canaries

Make one fresh set per run, so an old hit can never pass a new test:

```bash
python3 - <<'PY' > "$T/canaries.txt"
import secrets, string
a = string.ascii_letters + string.digits
r = lambda n: ''.join(secrets.choice(a) for _ in range(n))
print('sk-ant-api03-ZQ1' + r(80))                                   # api-key
print('AKIAZQ2' + ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(13)))  # api-key
print('ghp_ZQ3' + r(33))                                            # api-key
print('xoxb-ZQ4-' + r(40))                                          # token
print('DB_PASSWORD=ZQ6' + r(20))                                    # password (env)
print('password: ZQ7' + r(20))                                      # password (yaml)
print('{"secret":"ZQ8' + r(20) + '","next":"keep-me"}')             # password (json)
print('Authorization: Bearer ZQ9' + r(40))                          # auth-header
print('Cookie: session=ZQ10' + r(30))                               # auth-header
print('postgres://admin:ZQ11' + r(16) + '@db.internal:5432/app')    # connection-string
print('{"token":"ZQ12' + r(24) + '\\"tail","next":"keep-me"}')      # JSON edge: escaped quote after the secret
PY
openssl genpkey -algorithm ed25519 > "$T/canary.pem"                # private-key; grep for its second line
```

Grep the places a canary could land. The store's own files:

```bash
for f in "$DB" "$DB-wal" "$DM_HOME"/data/spool/* "$DM_HOME"/data/blobs/*/*/*; do
  [ -f "$f" ] && python3 -c "import sys,re;d=open(sys.argv[1],'rb').read();print(sys.argv[1], len(re.findall(rb'ZQ[0-9]+', d)))" "$f"
done
```

Then the archive, decompressed (B.7's scan loop) with the pattern `ZQ[0-9]+` and the PEM's second line. Each
count must be 0, except where a test leaves a known miss on purpose (CL-SEC-08).

### B.13 Live latency probe

Save as `$T/latency.py`; run `python3 $T/latency.py "$DB" <sandbox transcript> <a user-record line file>`. It
appends 200 copies of one real `user` record with fresh uuids, one per second, and times each until its event row
is visible to a fresh read-only connection.

```python
import json, sqlite3, sys, time, uuid
db, transcript, template_path = sys.argv[1:4]
template = json.loads(open(template_path).read())
session = template['sessionId']
lags = []
for _ in range(200):
    rec = dict(template, uuid=str(uuid.uuid4()), timestamp=time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime()))
    key = f'claude-code:{session}:{rec["uuid"]}'
    with open(transcript, 'a') as f:
        f.write(json.dumps(rec) + '\n')
    t0 = time.time()
    while True:
        con = sqlite3.connect(f'file:{db}?mode=ro', uri=True)
        hit = con.execute('SELECT 1 FROM events WHERE natural_key = ?', (key,)).fetchone()
        con.close()
        if hit or time.time() - t0 > 5:
            break
        time.sleep(0.005)
    lags.append((time.time() - t0) * 1000)
    time.sleep(1)
lags.sort()
print('p50', round(lags[100]), 'ms  p95', round(lags[190]), 'ms  max', round(lags[-1]), 'ms')
```

The probe's own polling adds up to 5 ms.

### B.14 Capturing rendered chat entries

With siegelense (`dungeonmaster siegelense docs --for walking`), or in the browser console:

```js
Array.from(document.querySelectorAll('[data-testid^="CHAT_ENTRY"]')).map((e) => [e.dataset.entryKey ?? '', e.getAttribute('data-testid'), e.innerText.slice(0, 120)])
```

The selector and `entryKey` attribute are placeholders: entry-for-entry comparison needs each rendered entry to
carry its natural key (G17). Until it does, compare by test id and text. Save each capture to a file and `diff`.

### B.15 Power cuts, inotify limits and disk full

| Fault | Safe way | Never |
|---|---|---|
| Power cut | ENV-VM: `virsh reset <vm>`, `multipass stop --force <vm>`, or `echo b > /proc/sysrq-trigger` inside the VM | on the host |
| Too many open files | `prlimit --pid <chronicle pid> --nofile=40:40` (that process only) | `ulimit` in your login shell |
| inotify watches or instances | ENV-VM: `sysctl fs.inotify.max_user_watches=200` and `fs.inotify.max_user_instances=<current + 1>`; or a dedicated OS user on the host, because the limits are per user | lowering the host's limits for your own user (it breaks your editor and other tools) |
| Disk full | `sudo mount -t tmpfs -o size=300m tmpfs "$T/small"` and point `$DM_HOME/data` at it with a symlink before the first start; fill it with `fallocate -l 250M "$T/small/fill"` | filling a real disk |
| Clock jumps | `faketime '+21 days' <command>` (libfaketime) on the sandbox process | changing the system clock |

The inotify limits here are 128 instances and 1,048,576 watches (read on 2026-10-01). libuv shares one inotify
instance per event loop, so watches, not instances, are the limit the process meets first.

---

# Appendix C: gaps found while writing this plan

Things the design did not say how to test, or that looked untestable as written. The design's 2026-10-01 update
(§3, §4.2, §6, §7, §7A, §10, §13, §14, §16) answers some of them. Each gap below is marked **resolved** (with the
design section that answers it), **partly resolved**, or **open**. A case that depended on a resolved gap now asserts
the design's answer; a case that depends on an open gap records the behaviour. Each case names the gaps it needs.

| # | Status | Gap, and what the design says now | Suggested fix (open and partly resolved gaps) |
|---|---|---|---|
| G1 | **Resolved** (§7A rule 1) | How a home's kind and scope are decided. Two keys in the home config, `chronicle.homeKind` and `chronicle.ingestScope`, override the inference, and `meta` records what the process used. `CL-HOM-06` tests it. What a later edit or an invalid value does is G28. | |
| G2 | **Partly resolved** (§7A rule 2, §14) | Harness roots: `CLAUDE_CONFIG_DIR` for Claude (through `locationsClaudeConfigDirFindBroker`), `DUNGEONMASTER_AGY_ROOT` for agy, then `chronicle.harnessRoots.claudeCode` and `.antigravity`, then the defaults. `CL-HOM-07` tests it. Still open: Claude's task output in `/tmp/claude-<uid>/` has no override, so sandbox task output lands in the real `/tmp`. | Resolve the task-output root through the same broker as `CLAUDE_CONFIG_DIR`. |
| G3 | **Resolved** (§7, `schema.md`) | `harness_imports` is in `schema.md` (state, `recent_done_at`, `history_done_at`, `progress_json`). A.2 reads it; CL-IMP-01, 04 and 05 check it. | |
| G4 | **Open** | The first-run blocking view, the later-harness banner, "history unavailable", "upgrading data" and "history trimmed" are not assigned to a phase in §11; neither is `GET /api/blobs/:hash` (§9 describes the route, §11 does not place it). | Put the store-state UI and the blob route in phase 2 or 3 explicitly. |
| G5 | **Resolved** (§10, §14) | The reference data is frozen at `tmp/chronicle-reference/` (`1918a5ee-...`: 40 sessions, 52 files, 48.8 MB; `c8171a64-...`: 5 sessions, 328 files, 110.8 MB). Expected counts are recomputed from the frozen copy with `tmp/q1918-failures-scan.py`; the old 860 / 98 / 18 / 19 are not the expectation. | |
| G6 | **Resolved** (§7, §13.2) | An LLM reads the store through `dungeonmaster chronicle query "<sql>"`: read-only, `SELECT`, `WITH` or read-only `PRAGMA` only, JSON lines out. `CL-SEC-13` tests it. Whether direct Bash access to `node`/`sqlite3` is also refused is still unstated (`CL-SEC-11` records it). | |
| G7 | **Resolved** (§7) | `dungeonmaster chronicle drift` lists open rows; `--ack <id>` acknowledges one and `--ack-all` every open row, setting `acknowledged_at`. `CL-EFF-06` tests it. | |
| G8 | **Open** | No fault-injection points. Crashes during sealing, compaction and blob rename can only be hit by racing a poller (B.10). | A test-only env var naming a point to abort at. |
| G9 | **Open** | Archive integrity cannot be verified for redacted records: `content_hash` is over the original bytes, and nothing hashes the stored bytes. There is no verify or dump command. DQ-17 can only check unredacted records. | Store a hash of the stored bytes too, and ship `dungeonmaster chronicle verify`. |
| G10 | **Resolved** (§6 step 6) | A spool is deleted only after every record from it sits in a SEALED, `fsync`ed segment AND the sealing transaction has committed and been followed by a WAL checkpoint, never just after the `raw_tail` commit. `CL-LIV-07`, `CL-OUT-05`, `CL-CRA-06`, `CL-SEC-09` and `CL-RLM-02` test it. | |
| G11 | **Open** | §13.2 redacts before `raw_tail`, the archive, any table and any blob, but the stdout and dispatch spools (written by the server, before chronicle-llm sees them) are not on that list, and redacted data can survive in SQLite free pages, the WAL and old segment files until they are reused. `CL-SEC-09` will find canaries on disk while chronicle-llm is down. | Redact in the server before it writes a spool, or accept and document it; consider `secure_delete`. |
| G12 | **Open** | The field maps still say deny-listed files are "never read" (`antigravity.md` on `terminals/.env`; the Claude side-files map on `<pid>.<hash>.key` and `skipped_files`), but design §13.2 removed the deny-list and §8.5 lists the side files captured without naming these. Claude's `.credentials.json` is safe only because discovery never walks the config root. `CL-SEC-12` has no expected result. | Decide whether those files are sources; update the field maps. |
| G13 | **Open** | Cap edge cases are unspecified: invalid values, a cap below the never-evicted floor, a first import bigger than the cap (import then evict, or stop), whether a cap change applies without restart, and what `/api/blobs` returns for an evicted artifact. §13.1 is unchanged on these. | One line each in §13.1. |
| G14 | **Open** | Tier 1 evicts raw data "whose harness file still exists", but Claude deletes that file within 30 days, after which the session can never be re-normalized. Tier 1 also cannot tell whether the file changed since. | Prefer tier-1 candidates by how long the harness will keep the file, and re-check the hash before relying on it. |
| G15 | **Open** | What an OLDER server does when a NEWER persistent chronicle-llm is running is not stated (§7 covers only a newer server retiring an older process), nor what the UI shows for `too-new`. `CL-VER-02`, `CL-EFF-13` and `CL-SRV-05`(b) can only record behaviour. | State the rule in §7. |
| G16 | **Partly resolved** (§9, §16) | The headline cost is `usage` x `pricing`; `rollup_session.last_reported_cost_usd` keeps the harness's own figure for the cross-check only, and the `cost-state` token totals are in the raw archive. So "equal to `cost-state`" is no longer an equality target. Still open: which token kinds the command center's Σ adds, and the tolerances (this plan uses 1.5% on output tokens against the archive's `cost-state` records and 5% on cost). | Define Σ and set the tolerances in §9. |
| G17 | **Open** | How the chat shows a resumed session's copied records is not stated, and rendered entries carry no natural key. Entry-for-entry comparison (CL-FUN-01) falls back to text matching. | Put the event's natural key on each rendered entry (a data attribute), and state the copy display rule. |
| G18 | **Open** | The tombstone floor rises only daily, with no control call to force it. CL-FUN-10 needs `faketime` and an 8-day jump. | A control call to run the daily maintenance now. |
| G19 | **Open** | The 20-day staleness warning has no way to be tested except a clock override. CL-IMP-07 needs `libfaketime`. | Accept, or make "now" injectable for status. |
| G20 | **Open** | The re-ingest cause is spelled `reingest:normalizer-bump` in §11.1 and `reingest:<normalizer bump\|...>` in `schema.md`. Queries on `ingest_jobs.cause` miss one spelling. | Pick one. |
| G21 | **Open** | A new harness package arriving in an upgrade can only be tested with a build that leaves one harness package out. CL-IMP-05 needs a special build until phase 6. | A test-only switch to disable a harness package. |
| G22 | **Open** | The inline image allowlist for `/api/blobs` is not listed (§9 says "allowlisted raster image types"). CL-API-02 cannot say SVG is excluded from the design. | List the types (PNG, JPEG, GIF, WebP) and say SVG is never inline. |
| G23 | **Open** | Where chronicle-llm writes its own log is not stated. "Refuses to start, logging why" (CL-EFF-10) and the watch fallback (CL-ENV-01, which no longer leaves a row, §16) have nowhere to look. | Name the log file inside the home, and its rotation. |
| G24 | **Open** | When a Claude record has both `effort` and `perTurnEffort` and they differ, which one fills `messages.effort` is not stated. CL-EFF-04 cannot decide a mismatch. | State the precedence in §11.1. |
| G25 | **Open** | The phase 1 parity script has no name, input or output format. CL-PAR-01 cannot be run the same way twice. | Name it and have it print the first differing entry per quest. |
| G26 | **Open** (new) | The two retirements (§11 phases 2 and 5) are underspecified for testing: how the quota display and the dispatch hold derive their window, limit and token kinds from `usage` and `rate_limit_samples`; which sample is "newest" (by `received_at` or by ingest order); what the hold does while chronicle-llm is down, when §7 says dispatch must still work; and whether an upgrade deletes `usage-ledger.json`, its leaked `.tmp.*` files, `rate-limits.json` and `rate-limits-history.jsonl`, or imports the old history into `rate_limit_samples`. CL-LDG-02, 03, 05 and CL-RLM-01, 03, 04 record the behaviour. | State each in §9 and §11. |
| G27 | **Open** (new) | `events.link_key` for a Claude message is `<recipient agentId>:<sha256 of the body>`, so two sends with the same body to one recipient share a key, and the design does not say how the join pairs them, nor what the recipient part is when the recipient is a main session (it has a session id, not an agent id). CL-MSG-08 records it. | Add the send's own id or position to the key, or state the pairing rule in §4.2. |
| G28 | **Open** (new) | Whether editing `chronicle.homeKind`, `chronicle.ingestScope` or `chronicle.harnessRoots` after the first start takes effect, and what an invalid value does, are not stated (§7A says scope is "set at first start"). CL-HOM-06 records it. | One line each in §7A. |
