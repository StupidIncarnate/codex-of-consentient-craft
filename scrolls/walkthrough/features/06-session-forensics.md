# Session forensics — walkthrough

Case prefix: `SF` · Packages: `session-forensics` · Main sources: `packages/session-forensics/src/`,
`.claude/commands/quest-forensics.md`

## What changed

`session-forensics` is a read-only CLI that digests Claude Code session transcripts and quest sign-off ledgers for
post-mortem analysis. It has exactly five subcommands — `summary`, `buckets`, `gaps`, `coverage`, `quest` — and
exactly two flags — `--minutes` (on `buckets` only) and `--floor-seconds` (on `gaps` only). Nothing else exists: no
`timeline`, `text`, `errors`, `result`, `grep`, or `subagents` command, whatever a prompt file might wish for. Recent
work (`403b1d433`) added `--minutes`/`--floor-seconds` and the `quest` command's per-work-item index. Before that
(`1a17cf580`, `1af9d4dc9`, `ec021e9cc`, `aadbf837b`, `23afb3fa8`, `9939caa87`, `c4046e157`) retired the old
sign-off-track shape on quest flows in favor of a three-way `met`/`cant-meet`/`unmet` unit-mark vocabulary, added a
`human-check` verification method that counts toward no track's denominator, and wired `coverage`'s counts to real
per-track marks pulled off `workItem.observations[]`. The `/quest-forensics` slash command is the heavyweight
orchestrator that drives this CLI across many sub-agents for a full post-mortem.

## How to reach it

| Surface | How to reach it | Notes |
|---|---|---|
| CLI, primary | `npx dungeonmaster-session-forensics <command> <target>`, from the repo root | Resolves through the workspace `bin` entry. Confirmed working in this checkout with no extra `npm link` step. |
| CLI, fallback | `node packages/session-forensics/dist/bin/session-forensics-entry.js <command> <target>` | Use if `npx` doesn't resolve in your shell. Identical behavior — both call `StartSessionForensics()`. |
| Slash command | `/quest-forensics <questId>` | Dispatches an orchestration loop of `opus` sub-agents (Phase 1: one analyzer per work item; Phase 2: one per flow). Expensive — see Table 8. |

## Setup

1. Confirm the package is built: `ls packages/session-forensics/dist/bin/` should show `session-forensics-entry.js`.
   If missing or stale, `npm run build --workspace=@dungeonmaster/session-forensics` (this is read-only analysis —
   never build to "fix" a forensics result; a missing `dist/` means stop and say so, per the slash command's own
   Step 1).
2. Run every command from the **repo root**. `coverage` and `quest` resolve a quest id through
   `questFindBroker`, which joins `process.cwd()` directly — no upward walk to find the repo root the way
   `cwdResolveBroker` does elsewhere in this codebase (see Known open items). Running from a package subdirectory
   silently returns blank output instead of an error.
3. Find a live quest id to test against:
   ```bash
   python3 -c "
   import json, os
   base = '.dungeonmaster/guilds'
   for guild in os.listdir(base):
       qdir = os.path.join(base, guild, 'quests')
       if not os.path.isdir(qdir): continue
       for qid in os.listdir(qdir):
           path = os.path.join(qdir, qid, 'quest.json')
           if not os.path.exists(path): continue
           d = json.load(open(path))
           wi = d.get('workItems', [])
           print(qid, 'status=', d.get('status'), 'workItems=', len(wi), 'withSession=', len([w for w in wi if w.get('sessionId')]))
   "
   ```
   The rows below use quest and session ids that were live in this repo's own `.dungeonmaster/guilds/` on
   2026-09-23. If any has since been cleaned up, re-run the snippet above and swap in a fresh id — same shape,
   same expectations. No `.dungeonmaster-dev/guilds/` quests existed at the time this doc was written; if you need
   one, `npm run dev` and drive a quest to completion, or use a `siegelense` seed per `01-siegelense.md`.
4. **Integration tests write real fixtures under `~/.claude/projects/`.** `realTranscriptHarness` (used by
   `session-forensics-flow.integration.test.ts`) creates `~/.claude/projects/session-forensics-flow-integration-test-*`
   directories and deletes them in its own `afterEach`. A crashed test run can leave one behind — if you see a stray
   `session-forensics-flow-integration-test-*` directory under your real `~/.claude/projects/`, it is safe to delete.
5. Real quest ids below live under `.dungeonmaster/guilds/21523917-83f7-4e23-a6de-8db1cae2ad96/quests/`:
   - `QUEST_LEGACY` = `b4c31633-913d-4ea3-912a-76ae0d64bec4` — paused, 11 work items, real multi-megabyte transcripts,
     but its flows carry a **pre-migration schema** (see SF-29).
   - `QUEST_VALID` = `e87996cb-b86e-4bec-97bc-3e6f0b299542` — `review_observables`, flows validate against the
     current schema, `coverage` renders real tables.
   - `QUEST_GHOST` = `f1429e0d-4205-4afb-9000-ef623ba32802` — `approved`, one `bughunt` work item whose `sessionId`
     no longer resolves to a transcript file on disk.

## Test cases

### 1. Bare CLI and argv parsing

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| SF-01 | `npx dungeonmaster-session-forensics` (no args) | Usage block on stdout: `usage: session-forensics <command> <target>` then one line per command (`summary`, `buckets`, `gaps`, `coverage`, `quest`), then `buckets --minutes <n>` and `gaps --floor-seconds <n>`. Exit code 0. | `integration` — `session-forensics-flow.integration.test.ts` (`EMPTY: {argv: []}`) | P3 | |
| SF-02 | `npx dungeonmaster-session-forensics --help` | Same usage block as SF-01 — `--help` is not a recognized command, so it falls through to the same path as any unknown word. Exit 0, not an error. | `none` | P2 | |
| SF-03 | `npx dungeonmaster-session-forensics frobnicate some-target` | Same usage block. Unknown commands never error. | `integration` — same file (`INVALID: {argv: [unknown-command, target]}`) | P3 | |
| SF-04 | `npx dungeonmaster-session-forensics summary` (no target) | Same usage block — a known command with a missing target is treated identically to an unknown command. | `integration` — same file (`EMPTY: {argv: [summary]}`) | P3 | |
| SF-05 | `npx dungeonmaster-session-forensics summary ""` (empty string target) | **Not** the usage block. Prints a raw pretty-printed Zod error array to stderr (`"too_small"`, `"String must contain at least 1 character(s)"`) and sets exit code 1. See Known open items #1 — every other invalid-input case above returns the clean usage block; this one does not. | `integration` — `start-session-forensics.integration.test.ts` (`ERROR: {argv naming an empty target}`) asserts this exact stderr text | P2 | |
| SF-06 | `npx dungeonmaster-session-forensics coverage QUEST_VALID --format json` (an unrecognized flag) | Identical output to running `coverage QUEST_VALID` with no flags — unrecognized flags are silently ignored, never an error. Confirmed live. | `none` | P3 | |
| SF-07 | `npx dungeonmaster-session-forensics summary <any real session id> --minutes 5` (a flag from the wrong command) | Identical output to `summary` with no flags. `--minutes`/`--floor-seconds` are parsed unconditionally by the flow, then only threaded into the responder for their own command — a flag from another command is silently dropped. | `none` | P3 | |

### 2. `summary <target>`

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| SF-08 | `npx dungeonmaster-session-forensics summary made-up-session-id-xyz` | All-zero render: `Lines in the transcript  0`, `Session started          (nothing in the file was timestamped)`, `Models used` (blank), all six token lines `0`, `Tool calls the model made (0 in total)` with no rows, `Sub-agents started       0`. Exit 0 — an unresolvable id is never an error. | `integration` — both integration test files assert this exact block for a ghost target | P3 | |
| SF-09 | `npx dungeonmaster-session-forensics summary <bughunt session id from QUEST_GHOST>` | Same all-zero render as SF-08 — a real session id whose work item never actually dispatched (`Transcript size 0 bytes` in the `quest` command's own view of it) resolves no differently than a fully made-up id. | `none` | P2 | |
| SF-10 | `npx dungeonmaster-session-forensics summary <the codeweaver session id from QUEST_LEGACY, work item 3>` | Real numbers: nonzero `Lines in the transcript`, a real `Session started`/`Session ended` pair, `Ran for N.N minutes`, `Models used` naming a real model (e.g. `claude-opus-5x50`), all six token lines nonzero with `Total fed into the model` = the sum of the three "fed in" lines, a tool-call histogram sorted by count descending then name ascending, real `Bytes returned by tools`, and a nonzero `Sub-agents started`. | `none` — no test exercises a real multi-megabyte transcript | P1 | |
| SF-11 | `npx dungeonmaster-session-forensics summary agent-<one of that session's own sub-agent ids>` — get the id via `ls` on `~/.claude/projects/<encoded-cwd-or-worktree>/<sessionId>/subagents/` | Same shape as SF-10 but scoped to just that sub-agent's own turns — smaller numbers, its own `Models used` (often `claude-sonnet-5` even when the parent ran opus). No parent session id is needed on the command line; the CLI scans every project directory for the `agent-<id>.jsonl` file itself. | `none` | P1 | |
| SF-12 | Look for a `<synthetic>` entry in `Models used` on a long real session (e.g. the `QUEST_LEGACY` chaoswhisperer session, work item 1) | `Models used` can legitimately list more than one model, including a `<synthetic>x1` entry alongside the real model — this is real transcript content, not a bug. Note it, don't file it. | `none` | P3 | |

### 3. `buckets <target> [--minutes <n>]`

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| SF-13 | `npx dungeonmaster-session-forensics buckets made-up-session-id-xyz` | Header row only: `Window (UTC)        Replies  Tool calls   Tokens out     Tokens in  Bytes from tools  Busiest tools`. No data rows. | `integration` — `session-forensics-flow.integration.test.ts` (`buckets, target resolving to no transcript`) | P3 | |
| SF-14 | `npx dungeonmaster-session-forensics buckets <QUEST_LEGACY codeweaver session id>` (default 15-minute window) | Header, then one row per 15-minute UTC window the session touched, each column right-aligned, `Busiest tools` a comma-joined `name x count` list of the top 4 tools in that window. | `none` | P1 | |
| SF-15 | Same target, add `--minutes 5` | Narrower windows — more rows than SF-14 over the same session, each window's numbers summing correctly across the split. | `integration` — same file, synthetic 10-minute-apart records split into two 5-minute buckets | P2 | |
| SF-16 | Same target, `--minutes 0` | Rejected: `.positive()` on `bucketMinutesContract` refuses zero. Falls back to the usage block from Table 1, not an error message naming the flag. | `unit` — `bucket-minutes-contract.test.ts` | P2 | |
| SF-17 | Same target, `--minutes -3` | Rejected the same way — usage block. | `integration` — `session-forensics-flow.integration.test.ts` (`--floor-seconds, -5` covers the sibling flag; confirm `--minutes` negative the same way live) | P2 | |
| SF-18 | Same target, `--minutes abc` | Rejected the same way — usage block. `z.coerce.number()` turns `'abc'` into `NaN`, which fails validation. | `integration` — same file (`--minutes, abc`) | P2 | |
| SF-19 | Same target, `--minutes` as the very last argument (no value after it) | **Not** rejected. `argv[minutesIndex + 1]` is `undefined`, which the flow treats identically to the flag being absent — falls back silently to the 15-minute default. No usage block, no error. Confirm this is the intended UX (see Known open items #5). | `none` | P2 | |
| SF-20 | `npx dungeonmaster-session-forensics buckets agent-<a sub-agent id>` | Buckets scoped to just that sub-agent's own turns, same column shape as SF-14. | `none` | P3 | |

### 4. `gaps <target> [--floor-seconds <n>]`

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| SF-21 | `npx dungeonmaster-session-forensics gaps made-up-session-id-xyz` | All-zero report: the three header/explanation lines, `Minutes in  Gap      Sub-agents running`, no gap rows, then `Ran for 0.0 minutes`, `Spent in gaps 0.0 minutes (0.0%)`, both sub-lines `0.0 minutes (0.0%)`. | `integration` — `session-forensics-flow.integration.test.ts` (`gaps, target resolving to no transcript`) | P3 | |
| SF-22 | `npx dungeonmaster-session-forensics gaps <QUEST_LEGACY codeweaver session id>` (default floor 120s) | At least one gap line in the form `N.Nm Ns  <names>`, where `<names>` is either a `;`-joined list of live `agent-*` ids or the literal marker `*** NOTHING RUNNING ***`. Totals: `Spent in gaps` = blocked + idle minutes: `waiting on a sub-agent` covers gaps naming an agent, `nothing running at all` covers `*** NOTHING RUNNING ***` gaps. Percentages sum to the "Spent in gaps" percentage. | `none` | P1 | |
| SF-23 | Same target, add `--floor-seconds 30` | More/shorter gap lines than SF-22 — a lower floor catches pauses the default 120s floor would drop. | `integration` — `session-forensics-flow.integration.test.ts` (90-second gap, floor 30, one row) | P2 | |
| SF-24 | Same target, `--floor-seconds 0` | Rejected (`.positive()`) — usage block. | `unit` — `gap-floor-seconds-contract.test.ts` | P2 | |
| SF-25 | Same target, `--floor-seconds -5` | Rejected — usage block. | `integration` — `session-forensics-flow.integration.test.ts` (`--floor-seconds, -5`) | P2 | |
| SF-26 | Same target, `--floor-seconds abc` | Rejected — usage block. | `unit` — `gap-floor-seconds-contract.test.ts` | P2 | |
| SF-27 | Same target, `--floor-seconds 3.5` (non-integer) | Rejected — `.int()` refuses a fraction. Usage block. | `unit` — `gap-floor-seconds-contract.test.ts` | P2 | |
| SF-28 | `npx dungeonmaster-session-forensics gaps agent-<a sub-agent id>` | Own gap report for that sub-agent alone. If it dispatched no further sub-agents of its own, expect zero gap rows even over a multi-minute run (its own pauses just never cleared the 120s floor, or it never went quiet without a nested agent running). | `none` | P3 | |

### 5. `coverage <questId>`

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| SF-29 | `npx dungeonmaster-session-forensics coverage made-up-quest-id-000` | **Blank output** — a single trailing newline, nothing else. Exit code 0. No "quest not found" message anywhere. | `integration` — `quest-find-broker.test.ts` covers the broker; the CLI-level silence is worth confirming live | P2 | |
| SF-30 | `npx dungeonmaster-session-forensics coverage QUEST_LEGACY` | **Same blank output as SF-29**, despite `QUEST_LEGACY`'s `quest.json` genuinely holding 2 flows on disk. See Known open items #2 — this is a real repo quest whose flow nodes carry pre-migration `codeweaverSignoff`/`flowriderSignoff` keys that the current (`.strict()`) `flowNodeContract` rejects; `questLoadBroker`'s `safeParse` swallows the failure and returns `flows: []` with nothing surfaced to the user. | `none` | P1 | |
| SF-31 | `npx dungeonmaster-session-forensics coverage QUEST_VALID` | One block per flow: `Flow <flowId>`, then the header line `  sign-off track         REQUIRED  marked        met     can't meet    unmet    unmarked`, then one row each for `codeweaver`, `flowrider`, `siegemaster` with `owed = signed + unsigned` and `signed = met + cantMeet + unmet` holding on every row. Ends in the 3-line caveat block starting `These counts can be too high.` and naming `get-quest-work({questId, operationItemId})`. | `unit` — `track-coverage-contract.test.ts` (the balance refinements), `coverage-to-text-transformer` has no dedicated `.test.ts` file among its siblings — check for one before marking this fully covered | P1 | |
| SF-32 | `npx dungeonmaster-session-forensics coverage <the QUEST_LEGACY codeweaver session id>` (a session id passed where a quest id belongs) | Same blank output as SF-29 — `questIdContract` is just `z.string().min(1)`, so a well-formed session id is a syntactically valid quest id that simply never resolves. No type-level protection catches this mix-up. | `none` | P3 | |
| SF-33 | `cd packages/session-forensics && npx dungeonmaster-session-forensics coverage QUEST_VALID` (repo subdirectory, not root) | Blank output, even though the exact same command from the repo root (SF-31) renders real tables. Confirmed live. See Known open items #3. `cd` back to the repo root afterward. | `none` | P1 | |

### 6. `quest <questId>`

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| SF-34 | `npx dungeonmaster-session-forensics quest made-up-quest-id-000` | Blank output, exit 0 — same silent-miss behavior as `coverage`. | `integration` — `quest-index-load-broker.test.ts` | P3 | |
| SF-35 | `npx dungeonmaster-session-forensics quest QUEST_LEGACY` | `User request: <the real user request text>`, blank line, then one block per work item: `Work item N — <role> (<status>)`, `Work item id`, `Session id` (or `(none)` for a `spawnerType: command` item like `riftcarver`), `Wall clock` (`N.N minutes`, or `(not completed)`), `Operation`, `Flows`, `Packages`, `Transcript size` (thousands-separated bytes), `Sub-agents`, `Ward/riftcarver` (e.g. `ward exit 0 (full)`, `riftcarver green (exit 0)`, or `(none)`). Confirm this matches `.claude/commands/quest-forensics.md`'s own description of Step 1's index. **Unaffected by SF-30's flow-schema problem** — `quest` never reads `flows`. | `none` | P1 | |
| SF-36 | `npx dungeonmaster-session-forensics quest QUEST_VALID` | Same shape as SF-35. Find a work item with `status: pending` and a real (nonzero-byte) transcript — expect `Wall clock  (not completed)` even though real transcript activity exists, because wall clock is `completedAt - startedAt` off the work item record, not derived from the transcript. Compare this "not completed" wall clock against that same session's own `Ran for N.N minutes` line from `summary` (SF-10-style) — the two numbers are allowed to disagree; they measure different things (work-item lifecycle vs. transcript activity window). | `none` | P2 | |
| SF-37 | `npx dungeonmaster-session-forensics quest QUEST_GHOST` | One work item block whose `Session id` is a real id but `Transcript size` reads `0 bytes` and `Sub-agents` reads `0` — the id never resolved to a file on disk. `Wall clock` reads `(not completed)` since the work item's `status` is `pending`. | `none` | P1 | |

### 7. Coverage semantics — fixture-driven (verifyByHuman, unmet, per-track marks)

None of the live quests in this repo happen to carry a `verifyByHuman` observable, so this table builds a small
throwaway quest under the OS `/tmp` (never `<repoRoot>/tmp` — this is fixture data imitating what a test harness
seeds, not a scratch note) and points `DUNGEONMASTER_HOME` at it. This exact fixture was run against the real CLI
while writing this doc and the "Expect" column below is its real output.

```bash
mkdir -p /tmp/sf-walkthrough-fixture/guilds/test-guild/quests/verify-by-human-quest
cat > /tmp/sf-walkthrough-fixture/guilds/test-guild/quests/verify-by-human-quest/quest.json <<'EOF'
{
  "flows": [
    {
      "id": "sample-flow", "name": "Sample flow", "flowType": "runtime",
      "entryPoint": "start", "exitPoints": ["done"],
      "nodes": [
        {
          "id": "done", "label": "Done", "type": "terminal", "packages": ["web"],
          "observables": [
            {"id": "human-only-check", "type": "ui-state", "description": "a person judges this by eye", "package": "web", "addedBy": "spec", "verifyByHuman": true},
            {"id": "automated-check", "type": "ui-state", "description": "a test settles this", "package": "web", "addedBy": "spec"}
          ]
        }
      ],
      "edges": []
    }
  ],
  "workItems": [
    {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479", "role": "codeweaver", "status": "complete",
      "spawnerType": "agent", "createdAt": "2026-01-01T00:00:00.000Z", "relatedDataItems": [],
      "observations": [
        {"unitId": "sample-flow:observable:automated-check", "mark": "unmet", "evidence": "packages/web/src/x.test.ts:1 — not yet passing", "at": "2026-01-01T00:00:00.000Z"}
      ]
    }
  ]
}
EOF
DUNGEONMASTER_HOME=/tmp/sf-walkthrough-fixture npx dungeonmaster-session-forensics coverage verify-by-human-quest
# clean up afterward:
rm -rf /tmp/sf-walkthrough-fixture
```

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| SF-38 | Run the fixture above as written | `codeweaver` row: `REQUIRED 2  marked 1  met 0  can't meet 0  unmet 1  unmarked 1`. The flow has 3 signable things (1 terminal + 2 observables) but `REQUIRED` reads 2, not 3 — the `human-only-check` observable (`verifyByHuman: true`) is excluded from every track's denominator, exactly as `trackDenominatorStatics`'s header documents. `unmet` reads 1 for the one observation actually recorded; `unmarked` reads 1 for the terminal node nobody ever marked. | `unit` — `quest-to-units-transformer.test.ts`, `is-track-owed-unit-guard.test.ts` | P2 | |
| SF-39 | Same run, check the `flowrider` and `siegemaster` rows | `flowrider`: `REQUIRED 2  marked 0` — same 2-unit denominator as codeweaver (human-only-check excluded here too), but zero marks because no `flowrider`-role work item exists in the fixture. `siegemaster`: `REQUIRED 9` — codeweaver/flowrider's 2 plus the 7 fixed off-map probe families (`qaOffMapProbeStatics`), all unmarked. Confirms marks are scoped to the matching role's own work items only (`workItem.role === track`), never borrowed from another role's marks on the same unit. | `unit` — `quest-to-coverage-transformer.test.ts` (check it exists alongside its siblings) | P2 | |
| SF-40 | Edit the fixture's `quest.json` to remove the whole `"flows"` key (keep `"workItems"`) and re-run `coverage` | Blank output — `'flows' in questJson` is false, so `questLoadBroker` returns `flows: []` without even attempting to parse, same code path as SF-30's schema failure but a different cause. | `unit` — `quest-load-broker.test.ts` | P3 | |
| SF-41 | Edit the fixture's `quest.json` to remove `"userRequest"` (it was never set — it's already absent) and run `quest verify-by-human-quest` instead of `coverage` | First line reads exactly `User request: (none)`. | `unit` — `quest-index-to-text-transformer.test.ts` (check it exists) | P3 | |

### 8. `/quest-forensics` slash command

Full runs are expensive — Phase 1 dispatches one `opus` sub-agent per work item (a `QUEST_LEGACY`-sized quest is 9),
Phase 2 dispatches one per flow, and both compile with a further `opus` agent. Treat SF-42 as the cheap smoke test;
treat SF-45/SF-46 as "run only if the user asks for a real post-mortem," not as routine walkthrough cases.

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| SF-42 | Step 1 alone: `mkdir -p tmp/quest-forensics/QUEST_LEGACY && npx dungeonmaster-session-forensics quest QUEST_LEGACY > tmp/quest-forensics/QUEST_LEGACY/index.txt`, then read the file back | File is non-empty and byte-identical to SF-35's stdout. This is the exact command Step 1 of the slash command names — confirm it still matches what the command's own prose describes (`userRequest` once at top, one block per work item, etc). Clean up `tmp/quest-forensics/` afterward — it is repo-tracked scratch space per root `CLAUDE.md`. | `none` | P2 | |
| SF-43 | Check the doc's own numbering: read `.claude/commands/quest-forensics.md` and find "Step 6" | **It does not exist.** The file goes `## Step 5 — compile` directly to `# PHASE 2` then `## Step 7 — the coverage baseline`. Flag whether this is a deliberate reserved gap or a doc slip — see Known open items #4. | `none` | P3 | |
| SF-44 | Verify the doc's claim (Step 2, "The tool" table): confirm there is no `timeline`, `text`/`prompts`, `errors`, `result <toolRegex>`, or `grep <regex>` command | Run each as a bare command name against any target, e.g. `npx dungeonmaster-session-forensics timeline some-id` — every one returns the Table 1 usage block, same as any other unknown command. The doc's claim holds. | `none` (covered indirectly by SF-03) | P3 | |
| SF-45 | Full Phase 1 (Steps 1–5) against `QUEST_LEGACY` or another real multi-item quest, following the slash command's own instructions | `scrolls/reports/<questId>/00-POST-MORTEM.md` exists with sections A–I, and one `<NN>-<role>-<slug>.md` report per analyzed work item under the same directory. Heavy — budget real wall-clock time and sub-agent count. | `none` | P3 | |
| SF-46 | Full Phase 2 (Steps 7–10) against a quest with at least one flow that ran all three tracks to completion | `scrolls/reports/<questId>/00-DELIVERY-CHAIN-AUDIT.md` exists with sections A–I, one `chain-<slug>.md` per flow. Section G states plainly whether a middle step is missing. Heavy. | `none` | P3 | |

## Known open items

Found while writing this doc, not yet confirmed on a real walkthrough turn. Promote any confirmed row to
`LEDGER.md`'s "Suspected defects from the exploration" table with a fresh `DEF-NN`.

1. **Empty-string target crashes past the usage block, inconsistently with every other invalid-input path.**
   `SessionForensicsFlow` only guards `target === undefined` (`packages/session-forensics/src/flows/session-forensics/session-forensics-flow.ts:43`), so `target: ''` sails through to `DigestRunResponder`, which calls `sessionIdContract.parse()`/`questIdContract.parse()` — not `.safeParse()` — at `packages/session-forensics/src/responders/digest/run/digest-run-responder.ts:58,65,101`. The resulting `ZodError` is uncaught by the flow and prints as a raw pretty-printed JSON array from `StartSessionForensics`'s top-level catch. This is a *tested*, deliberate-looking behavior (`start-session-forensics.integration.test.ts:50-81` asserts the exact dump), so it may be "working as designed" rather than a bug — but it is a rough CLI moment for a fat-fingered empty argument, worth a product call.
2. **`coverage`/`quest` silently render blank for a quest whose flows fail schema validation, with zero indication anything went wrong.** Confirmed live against a real repo quest: `b4c31633-913d-4ea3-912a-76ae0d64bec4`'s `quest.json` holds 2 real flows whose node objects still carry pre-migration `codeweaverSignoff`/`flowriderSignoff` keys. `flowNodeContract` is `.strict()` (`packages/shared/src/contracts/flow-node/flow-node-contract.ts:44`) and rejects unrecognized keys; `questLoadBroker`'s `flowContract.array().safeParse(questJson.flows)` (`packages/session-forensics/src/brokers/quest/load/quest-load-broker.ts:48-49,54`) swallows that failure and returns `flows: []`. Any quest written before the sign-off-track retirement (commit `9939caa87`) reads as having zero flows, with no warning.
3. **Quest id resolution never walks up from `process.cwd()`.** `questFindBroker` (`packages/session-forensics/src/brokers/quest/find/quest-find-broker.ts:30,33-34`) joins `cwd` directly into its three candidate roots. Every other "find the repo root" path in this codebase (`cwdResolveBroker`, per `packages/shared/CLAUDE.md`) walks upward looking for a marker file; this one does not. Running the CLI from any package subdirectory against a real quest id returns the same silent blank output as an unknown id (confirmed live, SF-33).
4. **`.claude/commands/quest-forensics.md` has no "Step 6."** The file goes from `## Step 5 — compile` (line 196) straight to `# PHASE 2 — the delivery-chain audit` (line 241) and `## Step 7 — the coverage baseline` (line 262). Either intentional or a slip — worth asking the doc's owner.
5. **A dangling `--minutes`/`--floor-seconds` flag with no value silently falls back to the default**, the same non-error path as the flag being entirely absent (`packages/session-forensics/src/flows/session-forensics/session-forensics-flow.ts:47-48`, `56-57`). Plausibly fine — flagged so the walkthrough driver makes the call deliberately rather than by accident.

## Sources

- `packages/session-forensics/src/startup/start-session-forensics.ts` — CLI entry point, argv slicing, top-level catch
- `packages/session-forensics/src/flows/session-forensics/session-forensics-flow.ts` — argv → command/target/flags validation, usage block
- `packages/session-forensics/src/responders/digest/run/digest-run-responder.ts` — command → broker/transformer routing
- `packages/session-forensics/src/contracts/digest-command/digest-command-contract.ts` — the five valid commands
- `packages/session-forensics/src/contracts/bucket-minutes/bucket-minutes-contract.ts`, `.../gap-floor-seconds/gap-floor-seconds-contract.ts` — the two flags' validation
- `packages/session-forensics/src/brokers/transcript/resolve/transcript-resolve-broker.ts` — session/sub-agent id → file path
- `packages/session-forensics/src/brokers/quest/find/quest-find-broker.ts`, `.../quest/load/quest-load-broker.ts`, `.../quest/index-load/quest-index-load-broker.ts` — quest id → quest.json → flows/workItems/operations
- `packages/session-forensics/src/statics/track-denominator/track-denominator-statics.ts`, `src/guards/is-track-owed-unit/is-track-owed-unit-guard.ts` — the coverage denominator rules, including the `human-check` exclusion
- `packages/session-forensics/src/transformers/quest-to-units/quest-to-units-transformer.ts`, `.../quest-to-coverage/quest-to-coverage-transformer.ts` — flow graph → units → per-track coverage
- `packages/session-forensics/src/transformers/coverage-to-text/`, `.../buckets-to-text/`, `.../gap-report-to-text/`, `.../summary-to-text/`, `.../quest-index-to-text/` — every render's exact text shape
- `packages/session-forensics/src/flows/session-forensics/session-forensics-flow.integration.test.ts`, `.../startup/start-session-forensics.integration.test.ts` — the source of truth for exact expected output strings used throughout this doc
- `.claude/commands/quest-forensics.md` — the slash command this CLI serves
- `packages/orchestrator/CLAUDE.md` — "Which directory those files are in" and the transcript line-shape cheat sheet, both referenced by the slash command
