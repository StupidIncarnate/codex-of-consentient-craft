# A01: Delete the adapters the trials left without callers

| | |
|---|---|
| Phase | Phase 2 — delete every adapter |
| Source | `scrolls/gateway/followup-sustainability.md` "Also" step 1 (lines 342-344); `scrolls/gateway-build/stays-as-adapter.md` (dead-code corrections); `scrolls/gateway-build/coverage.md` "dead" fate rows |
| Needs | [P0-1](p0-1-baseline-ward.md) |
| Unblocks | nothing directly, but shrinks every per-package item's file count |
| Packages touched | cli, config, hooks, mcp, orchestrator, server, siegelense, testing, tooling |
| Checks to run | lint, typecheck, unit |
| Split | 2 to 4 files per agent, one agent per package group below |
| Runs alone | no — but two agents may not both touch the same package at once |

## Why

The source doc says: "Delete the adapters the trials already left without callers, such as mcp's `path/join` and
`fs-read-file` adapters and siegelense's `git-branch-read-adapter.ts`. They were kept only because the trial rules
forbade deleting an adapter." `coverage.md`'s own "dead" fate count is only 3 (two in `hooks`, one in
`orchestrator`). Both of those source counts are stale or incomplete — this item's own census, run fresh against
the real files, found a materially longer list, and found that two of the doc's three named examples are wrong.

## Current state

Census method: for every adapter file in every package, two independent checks were run 2026-09-26 — (1) resolve
every `import`/`export … from` specifier in every `.ts`/`.tsx` file under `packages/**` back to a real file, and
list adapters whose only resolvable reference is their own colocated `.test.ts`/`.proxy.ts`/`.stub.ts`; (2) a
whole-file text search for the adapter's exact exported const name, scoped to files inside the SAME package (many
adapters across different packages share an identical export name, such as `fsWriteFileAdapter`, so a same-name hit
in another package is not a real caller and was excluded). Every result below cleared both checks, and every
leftover textual hit was opened and confirmed to be a comment (a `PURPOSE`/`USAGE` docstring mentioning the name),
not a real import.

**Confirmed dead — zero real callers anywhere in the repo, only their own colocated test file:**

| Package | Path |
|---|---|
| cli | `packages/cli/src/adapters/crypto/random-uuid/crypto-random-uuid-adapter.ts` |
| cli | `packages/cli/src/adapters/fs/realpath/fs-realpath-adapter.ts` |
| config | `packages/config/src/adapters/fs/access/fs-access-adapter.ts` |
| config | `packages/config/src/adapters/fs/write-file/fs-write-file-adapter.ts` |
| hooks | `packages/hooks/src/adapters/child-process/exec-sync/child-process-exec-sync-adapter.ts` |
| hooks | `packages/hooks/src/adapters/child-process/spawn/child-process-spawn-adapter.ts` |
| hooks | `packages/hooks/src/adapters/debug/debug/debug-debug-adapter.ts` |
| hooks | `packages/hooks/src/adapters/eslint/linter/eslint-linter-adapter.ts` |
| hooks | `packages/hooks/src/adapters/fs/stat/fs-stat-adapter.ts` |
| mcp | `packages/mcp/src/adapters/fs/glob/fs-glob-adapter.ts` |
| mcp | `packages/mcp/src/adapters/fs/readdir/fs-readdir-adapter.ts` |
| orchestrator | `packages/orchestrator/src/adapters/child-process/spawn/child-process-spawn-adapter.ts` |
| orchestrator | `packages/orchestrator/src/adapters/http/readiness-poll/http-readiness-poll-adapter.ts` |
| orchestrator | `packages/orchestrator/src/adapters/process/kill-by-port/process-kill-by-port-adapter.ts` |
| server | `packages/server/src/adapters/child-process/spawn-long-lived/child-process-spawn-long-lived-adapter.ts` |
| server | `packages/server/src/adapters/fs/write-file/fs-write-file-adapter.ts` |
| server | `packages/server/src/adapters/orchestrator/recover-active-quests/orchestrator-recover-active-quests-adapter.ts` |
| siegelense | `packages/siegelense/src/adapters/git/branch-read/git-branch-read-adapter.ts` |
| testing | `packages/testing/src/adapters/fs/queue-metadata-read/fs-queue-metadata-read-adapter.ts` |
| tooling | `packages/tooling/src/adapters/fs/read-file/fs-read-file-adapter.ts` |
| tooling | `packages/tooling/src/adapters/glob/find/glob-find-adapter.ts` |

That is 21 files, not 3. `hooks`'s two (`child-process-exec-sync-adapter.ts`, `child-process-spawn-adapter.ts`) and
`orchestrator`'s one (`child-process-spawn-adapter.ts`) match `coverage.md`'s "dead" rows exactly. The other 18 are
this item's own finding, not named as dead in any source doc.

**Two of the source doc's three named examples are FALSE — confirmed by the same two checks:**

- `mcp`'s `path-join-adapter.ts` (export `pathJoinAdapter`) **has a real caller**:
  `packages/mcp/src/brokers/agents/plugin-create/agents-plugin-create-broker.ts:17,30,43,46` imports and calls it
  three times. Do not delete it here — it is [A09](a09-adapters-mcp.md)'s ordinary "gateway" migration (switch the
  caller to `@dungeonmaster/node/path`'s `join`), not a dead-code deletion.
- `mcp`'s `fs-read-file-adapter.ts` (export `fsReadFileAdapter`) **has real callers** — at least seven files under
  `packages/mcp/src/brokers/**`, `packages/mcp/src/statics/**` and `packages/mcp/src/transformers/**` import it
  (for example `packages/mcp/src/brokers/file/scanner/file-scanner-broker.ts`). Do not delete it here — it too is
  [A09](a09-adapters-mcp.md)'s job.
- `siegelense`'s `git-branch-read-adapter.ts` (export `gitBranchReadAdapter`) genuinely has zero callers — this one
  claim in the source doc is confirmed true, and it is in the table above.

Report this discrepancy (2 of 3 named examples false) in your CHANGED/DECISIONS section — it is exactly the kind of
stale source claim EPIC.md asks to surface.

**One more discrepancy worth flagging while you are in these files:** `orchestrator`'s
`process-kill-by-port-adapter.ts` is listed in `coverage.md` with fate `gateway` and a note calling it a "REAL GAP"
still needing `scrolls/gateway/followup-sustainability.md` item 32's port-kill broker — implying it is actively
used and waiting on a gateway replacement. This census found it has **zero real callers today** — it is unwired
dead code, not an in-use adapter waiting on a migration target. Delete it here; tell
[A03](a03-port-kill-broker.md)'s agent that orchestrator's real "kill what's on this port" caller (if one exists)
uses a different code path than this adapter, and to verify that directly rather than assuming this file's
deletion removes live functionality.

Similarly, `server`'s `orchestrator-recover-active-quests-adapter.ts` is filed in `coverage.md` as a "stays"
forwarder into `@dungeonmaster/orchestrator`'s barrel, alongside the other 46 server orchestrator forwarders
[A02](a02-forwarder-adapters.md) handles. This census found it has zero callers in `server` today. Delete it here,
as ordinary dead code, rather than leaving it for A02 to redirect a caller that does not exist — but tell
[A02](a02-forwarder-adapters.md)'s agent so its own count of "47 forwarders in `server/src/adapters/orchestrator/`"
is read as 46 real forwarders plus this one dead file, not 47 forwarders needing redirection.

## Work

1. For each file in the table above, confirm the finding yourself before deleting: `discover` or `Read` the file,
   then search (via a `python3` os.walk + regex one-liner — Bash `grep`/`find` and native Grep/Glob are blocked by
   hooks) for its exported const name across its own package's `src/`. Confirm zero hits outside its own
   `.test.ts`/`.proxy.ts`/`.stub.ts`.
2. Delete the adapter file, its colocated `.test.ts`, `.proxy.ts` (if any) and `.stub.ts` (if any). Delete the
   now-empty wrapper folder.
3. If the deleted adapter's folder was the last thing under its parent domain folder (for example the whole
   `adapters/debug/` folder in `hooks`), delete that empty folder too.
4. Do not touch any barrel, `package.json`, or caller file — by construction these adapters have no caller, so
   nothing else should need editing. If your scoped ward run shows an error in another file after your deletion,
   stop and re-verify your census before assuming the file really had no caller.

## Done when

- Every file in the "Confirmed dead" table above is deleted, along with its colocated test/proxy/stub and any
  now-empty folder.
- Neither `mcp/src/adapters/path/join/path-join-adapter.ts` nor
  `mcp/src/adapters/fs/read-file/fs-read-file-adapter.ts` was touched by this item.
- `npm run ward -- --only lint,typecheck,unit -- <every path you deleted, plus its parent folder>` exits 0 (a
  deletion shows as a pass with 0 files where ward would have found something to check — confirm no OTHER file
  references what you removed by re-running the census check from Work step 1 after deleting).

## Traps

- A file can look unused from one search angle and still have a real caller reached through a re-export barrel
  (`export { fooAdapter } from './foo-adapter'`). Match BOTH `import … from` and `export … from` when censusing —
  the first census pass in this item's own research missed several real callers by matching only `import` and had
  to be redone.
- Do not trust a fate label alone. `coverage.md` marks `process-kill-by-port-adapter.ts` "gateway" (implying live,
  migratable) and it is actually dead; conversely `path-join-adapter.ts` and `fs-read-file-adapter.ts` are named as
  dead in the source prose and are actually alive. Verify with a real search every time, in either direction.

## Concessions made while executing

<!-- Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table. -->

- The `testing` row was wrong. `packages/web/test/harnesses/claude-mock/claude-mock.harness.ts` and `ward-mock.harness.ts` import `fs-queue-metadata-read-adapter` through `@dungeonmaster/testing/adapters/fs/queue-metadata-read`. It was left in place for A14 (row FS-2).
