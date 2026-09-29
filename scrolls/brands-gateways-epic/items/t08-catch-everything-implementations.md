# T08: Read every catch-everything implementation

| | |
|---|---|
| Phase | Phase 5 — tests and mocking |
| Source | `scrolls/brands-types-tests-rules.md`, order step 10's last sentence (lines 2456-2458) and T5's figures (1846-1851) |
| Needs | T05 |
| Unblocks | T09 |
| Packages touched | any package holding one of the rebuilt list's implementations — not knowable until the list is rebuilt |
| Checks to run | `lint,typecheck,unit,integration`, scoped per file fixed |
| Split | operator splits after the list is rebuilt, 2-4 files per agent |
| Runs alone | no |

## Why

Once T05 replaces hand-made, code-less failures with recorded ones, a test that used to pass against
`new Error('ENOENT: …')` with no `.code` may now fail — because the recorded failure carries a real
`.code`, and the implementation under test only ever checked `catch { ... }` with no code-based
narrowing. Of 92 implementations tested with a code-less error, 64 catch errors themselves, and 58 of
those catch everything — the only shape that passes a test built on an invented, code-less failure. Some
of those 58 are correct today (a cache that should start fresh on any unreadable state), and some are
wrong (a user's own settings file, where "start fresh" silently discards what the user wrote —
`settings-permissions-add-broker.ts` is the source doc's own example of this).

## Current state

The source doc's own lists (`tmp/lint-audit-1.tsv`, `lint-audit-2.tsv`, `lint-audit-3.tsv`,
`lint-audit-new-rules.tsv`, `teaching-text-audit.tsv`, and whatever produced the 92/64/58 figures) live in
`tmp/` **of the main checkout**, not this worktree. Checked 2026-09-26: this worktree's own `tmp/`
directory holds a different set of files entirely (`branch-files.txt`, `branch-ward.log`,
`gateway-shape-measure.config.js`, `platform-globals-measure.mjs`, `raw-import-measure-results.json`,
`restructure/`, `node16-probe/`, `adapters-fresh/`, `gateway-scaffold/`, none of the audit `.tsv` files
the source doc names). This confirms the item description's own claim: the list has to be rebuilt here,
it does not carry over from the main checkout's worktree-local `tmp/`.

## Work

1. **Rebuild the list.** Find every function that: (a) has a colocated test staging a hand-made,
   code-less `Error` as its only failure case, and (b) itself contains a `catch` block that does not
   narrow on the error's `.code`, `.errno`, `.syscall`, or an instance check — i.e. it catches everything.
   A `python3` `os.walk` plus a regex pass over `*.test.ts`/`*.integration.test.ts` files for a
   `new Error(` with no adjacent `code:`/`.code` in the same stage, cross-referenced against the sibling
   implementation file's own `catch` blocks, is a reasonable starting approach — this is analysis work,
   and the exact method is left to the executing agent's judgement, since the source doc's own method
   (whatever produced `lint-audit-*.tsv`) is not preserved here.

2. **For each implementation found, decide whether "catch everything, treat as absent/default" is
   correct or wrong for that data**, using the source doc's own worked distinction:
   - **Correct**: a cache, a derived/regenerable file, anything where starting fresh loses nothing a user
     put there. "Unreadable means start fresh" is right for a cache.
   - **Wrong**: a user's own settings file, or anything a person wrote by hand that the code would
     silently discard on any parse or read failure. `settings-permissions-add-broker.ts` is the doc's own
     named example of this — confirm it still exists at that name/path before treating it as a worked
     example; if Phase 2 or Phase 4 renamed or moved it, use its successor.

3. **Fix the ones that should not catch everything.** Narrow the `catch` to the specific failure it
   should treat as "absent" (e.g. `ENOENT` only), and let every other error propagate. Update each
   implementation's test to stage the recorded failure it should tolerate AND a second, different failure
   it should now let through (asserting the propagation, not just the tolerance) — this is what proves
   the fix actually narrows the catch rather than just changing which invented error the test uses.

4. **Leave the ones that are correct alone**, but confirm their test now stages a recorded failure (T05's
   job) rather than a hand-made one, even where the catch-everything behaviour itself is right.

5. **Split the fix work** into batches of 2-4 files per agent once the list exists, grouped by package.

## Lint rules this item adds or changes

None — this is a manual read-and-fix pass, not a lint rule. Do not try to write a rule that detects
"wrong" catch-everything automatically; the doc is explicit that this needs a human (or model) judgement
call per implementation (cache vs. user settings), not a structural check.

## Teaching text this item changes

None directly.

## Done when

- A fresh, dated list of catch-everything implementations tested only against a code-less error exists
  (even if only as this item's own working notes, not a committed file — the CLAUDE.md comment
  discipline rule against recording counts that grow applies to any note the agent leaves behind: record
  file paths and what was decided, not a running tally).
- Every implementation on the list has been read and a decision made: correct as-is, or narrowed.
- Every "wrong" one has been narrowed, with a test proving both the narrowed tolerance and the now-visible
  propagation of other errors.
- `npm run ward -- --uncommitted` exits 0 on every touched file.

## Traps

- This item needs T05 done first — T05 is what makes recorded failures available to stage; T08 leans on
  those same stubs to build the "second, different failure" test case for each narrowed catch.
- Do not try to fix every catch-everything implementation in one pass — split by package, 2-4 files per
  agent, per the dispatching rule in `CLAUDE.md`.
- A file this item touches may have moved during Phase 2 or Phase 4 (adapter deletion, brand migration);
  if the doc's named example (`settings-permissions-add-broker.ts`) is gone, find its successor by what it
  does (reads a user's own settings), not by grep for the old name.

## Concessions made while executing

<Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table.>

## Plan

Written 2026-09-29 by a planning agent. Method: a `python3` walk over every `*.test.ts`, `*.proxy.ts` and
implementation file under `packages/`, joining code-less `new Error(` staging (a wrapper proxy's `error:`
parameter, a `throw new Error('ENOENT')` inside a proxy or test `implement`, `mockRejectedValue`) to the `catch`
blocks that do not read `.code`, `.errno`, `.syscall`, use `instanceof`, or rethrow. Every line cited was opened.

### State against the item's "Current state"

- T05 is done in every package (EPIC log lines 950 and 953; SD11 recorded the scripted `FsErrorStub` and
  `FileMissingErrorStub` swaps). The EPIC T05 row's "Not yet swept" text is stale. T08 is unblocked.
- The named example is fixed. `packages/mcp/src/brokers/settings/permissions-add/settings-permissions-add-broker.ts`
  reads through `readJsonFileIfExists`, whose `null` means ENOENT only; its test stages
  `FsErrorStub({ code: 'EACCES', ... })` and `new SyntaxError(...)` and asserts the rejection (test lines 555-577).
  No work left there.
- Reference narrowing to copy: `packages/orchestrator/src/responders/orchestration/startup-recovery/recover-guild-layer-responder.ts`
  (line 215, `catch (error: unknown)` tolerating ENOENT only, tested with `FileMissingErrorStub` and a
  permission `FsErrorStub`). The guard is `isFsError` from `#gateway/node/fs/is-fs-error/is-fs-error`.
- `ban-invented-failures` flags only a hand-made `Error` handed to a mock's `rejects`/`throws`. A wrapper proxy's
  `error:` parameter and a `throw` inside an `implement` are not flagged, so the code-less staging that remains
  is in those two shapes.

### Decision rule used

Read-only derived views (architecture scanners, logs, caches) lose nothing on a swallowed failure: KEEP the
catch, swap the staging to a recorded stub. A catch that hides a failure of a directory or file a person owns, or
polls forever on it, is NARROWED to ENOENT with a test for the tolerated failure (`FileMissingErrorStub`) and a
test that a different failure (`FsErrorStub({ code: 'EACCES', ... })`) is let through.

### Sites that become a narrowed catch

| Site | Becomes |
|---|---|
| `packages/orchestrator/src/brokers/quest/monitor-jsonl-watcher/scan-subagents-dir-layer-broker.ts` line 96 (`catch { return; }` around `readdir`) | ENOENT only; other errors reach the callers' `.catch` at `quest-monitor-jsonl-watcher-broker.ts` lines 152 and 165, which write to stderr. Line 131 (per-file read or normalize, "non-fatal") stays. |

That is the only catch-everything found that both hides a person-owned location and has code-less staging.

### Sites that stay, with the reason

- Shared architecture scanners, `catch { return [] }` / `catch { return undefined }` (read-only derived views, nothing is lost):
  `packages/shared/src/brokers/architecture/{boot-tree/list-dir-entries-layer-broker.ts, boot-tree/read-file-contents-layer-broker.ts, edge-graph/safe-readdir-layer-broker.ts, edge-graph/read-file-layer-broker.ts, event-bus/safe-readdir-layer-broker.ts, event-bus/read-file-layer-broker.ts, import-edges/safe-readdir-layer-broker.ts, import-edges/read-source-layer-broker.ts, orphan-detect/safe-readdir-layer-broker.ts, orphan-detect/read-source-text-layer-broker.ts, package-e2e-eligible-detect/safe-readdir-layer-broker.ts, package-e2e-eligible-detect/read-file-optional-layer-broker.ts, package-inventory/safe-readdir-layer-broker.ts, package-inventory/read-package-description-layer-broker.ts, package-type-detect/safe-readdir-layer-broker.ts, package-type-detect/read-file-optional-layer-broker.ts, state-writes/safe-readdir-layer-broker.ts, state-writes/read-source-file-layer-broker.ts, widget-tree/safe-readdir-layer-broker.ts, widget-tree/read-widget-source-layer-broker.ts, ws-edges/safe-readdir-layer-broker.ts, ws-edges/read-file-layer-broker.ts, ws-gateway/safe-readdir-layer-broker.ts, ws-gateway/read-file-layer-broker.ts}`. Only their staging changes (batches S1 to S7).
- `packages/hooks/src/brokers/eslint/is-path-ignored/eslint-is-path-ignored-broker.ts` line 25: ESLint's own "outside of base path" error has no `code`, so there is nothing to narrow on and no recorded stub to build. Test line 51 stays hand-made. OPERATOR: record a concession beside 13 (a library error with no code, comment at the catch says so).
- Log-and-continue catches (the failure is written to stderr or `onError`, not treated as absent): `packages/@gateway/node/src/child_process/stream-lines/stream-lines.ts`, `packages/testing/src/brokers/network-record/{playwright/network-record-playwright-broker.ts, capture/network-record-capture-broker.ts}`, `packages/web/src/widgets/{chat-input/chat-input-widget.tsx, react-flow-diagram/react-flow-diagram-widget.tsx}`, orchestrator `create-sync-handler-layer-broker.ts`, `spawn-batch-layer-broker.ts`, `quest-outbox-watch-broker.ts`, `quest-node-dispatch-runner-broker.ts`, `chat-spawn-broker.ts`, `create-terminal-handler-layer-broker.ts`, server `ws-event-relay-broadcast-broker.ts`, `server-init-responder.ts`, siegelense `step-dispatch-broker.ts`, `driver-handle-request-broker.ts`, `driver-serve-layer-responder.ts`, `lane-teardown-broker.ts`, `browser-session-launch-broker.ts`, `run-execute-broker.ts`, `profile-solo-read-layer-broker.ts`. Their opaque `new Error('boom')` stages stay: no Node `code` exists to invent.
- `packages/testing/src/middleware/child-process-mock/child-process-mock-middleware.test.ts`, `mock-register-middleware.test.ts`, `packages/testing/src/contracts/mock-process-behavior/mock-process-behavior-contract.test.ts`: test the mock API, the error is a value passed through. Same reason as concession 13; OPERATOR: extend 13 to name these three.
- Server `quest-summary-responder.ts` line 38 and `quest-projection-responder.ts` line 40 map every error to a 404. Not data loss; a typed not-found error from orchestrator is a separate design. Reported, not fixed here.
- `packages/web/src/state/comment-queue/comment-queue-state.ts` line 49 (`catch { return [] }`): an unreadable or disabled `localStorage` cannot be read back either way. Kept; staging swapped (batch W1).

### Batches

Files listed are each agent's complete scope. Add a proxy or stub named here only if the batch says so. Checks for
every batch: `npm run ward -- --only lint,typecheck,unit -- <the batch's files>`.

**Wave 1 (disjoint packages, all run side by side; shared batches run one at a time or as named-disjoint lists, rule 9):**

| Batch | Files | Change | Gate also on |
|---|---|---|---|
| S1 | `packages/shared/src/brokers/architecture/import-edges/safe-readdir-layer-broker.test.ts`, `.../ws-gateway/safe-readdir-layer-broker.test.ts`, `.../event-bus/safe-readdir-layer-broker.test.ts`, `.../ws-edges/safe-readdir-layer-broker.test.ts` | `error: new Error('ENOENT')` becomes `FileMissingErrorStub({ path: dirPath })` | shared |
| S2 | `.../edge-graph/safe-readdir-layer-broker.test.ts`, `.../package-type-detect/safe-readdir-layer-broker.test.ts`, `.../package-e2e-eligible-detect/safe-readdir-layer-broker.test.ts`, `.../state-writes/safe-readdir-layer-broker.test.ts` | same | shared |
| S3 | `.../package-inventory/safe-readdir-layer-broker.test.ts`, `.../orphan-detect/safe-readdir-layer-broker.test.ts` (line 19, `setupReaddirThrows`), `.../widget-tree/safe-readdir-layer-broker.test.ts` (line 36, a `throw` inside an implement), `.../boot-tree/list-dir-entries-layer-broker.test.ts` | same | shared |
| S4 | `.../boot-tree/call-chain-lines-render-layer-broker.proxy.ts` (33), `.../boot-tree/architecture-boot-tree-broker.proxy.ts` (48), `.../boot-tree/responder-lines-render-layer-broker.proxy.ts` (41), `.../widget-node-render/architecture-widget-node-render-broker.proxy.ts` (21) | `throw new Error('ENOENT')` becomes `throw FileMissingErrorStub({ path })` | shared, plus the composers of these proxies (`discover` for the imports; mcp, orchestrator, siegelense, ward and cli import some shared architecture proxies) |
| S5 | `.../package-type-detect/architecture-package-type-detect-broker.proxy.ts` (159, 172, 174), `.../package-type-detect/read-package-cli-content-layer-broker.proxy.ts` (68), `.../package-inventory/architecture-package-inventory-broker.proxy.ts` (189, 240, 297, 309), `.../package-inventory/count-files-recursive-layer-broker.test.ts` (54) | same | shared and the composers as S4 |
| S6 | `.../orphan-detect/list-walked-folder-files-layer-broker.test.ts` (35), `.../orphan-detect/walk-reachable-files-layer-broker.test.ts` (22), `.../orphan-detect/architecture-orphan-detect-broker.test.ts` (36), `.../orphan-detect/find-startup-files-layer-broker.test.ts` (72) | same | shared |
| S7 | `.../state-writes/list-source-files-layer-broker.test.ts` (90), `.../state-writes/state-dirs-find-layer-broker.proxy.ts` (41), `.../binding-flow-trace/architecture-binding-flow-trace-broker.proxy.ts` (18), `.../orchestrator-method-extract/architecture-orchestrator-method-extract-broker.proxy.ts` (14) | same; the last two stage a code-less "file not found", also `FileMissingErrorStub` | shared and the composers as S4 |
| O1 | `packages/orchestrator/src/brokers/quest/monitor-jsonl-watcher/scan-subagents-dir-layer-broker.ts`, `.../scan-subagents-dir-layer-broker.test.ts` (line 125), `.../scan-subagents-dir-layer-broker.proxy.ts` (`setupSubagentDirMissing`), `.../quest-monitor-jsonl-watcher-broker.test.ts` (line 252) | narrow line 96 to ENOENT with `isFsError`; tests stage `FileMissingErrorStub` (tolerated) and `FsErrorStub({ code: 'EACCES' })` (the scan rejects; through the watcher, `stderr` receives `[monitor-watcher] subagent scan failed`) | orchestrator (`quest-monitor-watcher-start-broker.proxy.ts` composes the watcher proxy) |
| V1 | `packages/server/src/brokers/image/serve/image-serve-broker.test.ts` (101), `packages/server/src/responders/image/serve/image-serve-responder.test.ts` (85, 128), `packages/server/src/brokers/session/list/session-list-broker.test.ts` (125, 163) | ENOENT stages become `FileMissingErrorStub`; `read failed` becomes `FsErrorStub({ code: 'EACCES' })`; `stat failed` becomes `FileMissingErrorStub` (the file went away after the listing) | server, and orchestrator if a touched proxy is composed there |
| V2 | `packages/server/src/responders/quest/summary/quest-summary-responder.test.ts` (56), `.../projection/quest-projection-responder.test.ts` (56), `packages/server/src/transformers/error-format-reason/error-format-reason-transformer.test.ts` (14) | `cause: new Error('ENOENT...')` becomes `FileMissingErrorStub()` (asserted reason text follows the stub's message) | server |
| Z1 | `packages/siegelense/src/brokers/driver/heartbeat-tick/driver-heartbeat-tick-broker.test.ts` (130), `.../step/dispatch/step-dispatch-broker.test.ts` (684, 839), `.../run/execute/run-execute-broker.test.ts` (1145), `.../run/execute/run-execute-step-layer-broker.test.ts` (198) | code-less EACCES and ENOSPC stages become `FsErrorStub({ code })`; catches stay | siegelense |
| M1 | `packages/mcp/src/brokers/file/scanner/file-scanner-broker.test.ts` (917) | `new Error('EACCES: permission denied')` becomes `FsErrorStub({ code: 'EACCES', ... })`; the asserted regex follows the stub's message | mcp |

**Wave 2 (needs the new stub from G1a, then web; the @gateway batches run beside wave 1):**

| Batch | Files | Change | Gate also on |
|---|---|---|---|
| G1a | `packages/@gateway/browser/src/localStorage/read-item/read-item.test.ts`, `.../write-item/write-item.test.ts`, NEW `.../write-item/storage-quota-error.stub.ts` and its `.stub.test.ts` | replace `Object.assign(new Error('access denied'), { name: 'SecurityError' })` with `StorageDisabledErrorStub`; the new stub is `Object.assign(new Error('quota exceeded'), { name: 'QuotaExceededError' })` | @gateway/browser, and web (composes the browser proxies) |
| G1b | `.../localStorage/remove-item/remove-item.test.ts`, `.../clear/clear.test.ts`, `.../keys/keys.test.ts` | same, `StorageDisabledErrorStub` | @gateway/browser, web |
| G2 | `packages/@gateway/node/src/fs/tail-file/tail-file.test.ts` (202, 219, 250, 255, 266, 286, 298, 349, 412, 419), `packages/@gateway/node/src/process/chdir/chdir.test.ts` (26) | code-less ENOENT and EACCES stages become `FileMissingErrorStub` and `FsErrorStub({ code: 'EACCES' })`; `expect(onError).toHaveBeenNthCalledWith(1, { error: new Error(...) })` at 255 follows the stub value | @gateway/node, then every package composing `tailFileProxy` (`discover`) |
| G3 | `packages/@gateway/npm/src/glob/glob/glob.test.ts` (125), `packages/@gateway/npm/src/eslint/eslint/eslint.test.ts` (172) | EACCES becomes `FsErrorStub`; `no such file` becomes `FileMissingErrorStub`; both impls rethrow, so nothing is narrowed | @gateway/npm |
| W1 | `packages/web/src/state/comment-queue/comment-queue-state.test.ts` (145, 158, 174, 191, 208, 221, 279), `packages/web/src/state/comment-queue/comment-queue-state.proxy.ts` (76) | hand-made `SecurityError` and `QuotaExceededError` become `StorageDisabledErrorStub` and the new quota stub; needs G1a first | web |

**Optional residue (propagation tests, not catch-everything; run last, fold into a T05 follow-up if skipped):** hydration
`op-filter-apply-layer-broker.test.ts` (28), `op-update-apply-layer-broker.test.ts` (152), `op-attach-apply-layer-broker.test.ts` (75),
`op-create-apply-layer-broker.test.ts` (214), `plan-run-broker.test.ts` (397) stage `connect ECONNREFUSED` code-less; each impl wraps the cause in
a `Hydration*FailedError` and rethrows. `ConnectionRefusedErrorStub` exists under `@gateway/node/src/net/connection-refused-error/`.

### Run order and side-by-side

- Wave 1 all packages are disjoint from each other: shared (S1 to S7), orchestrator (O1), server (V1, V2), siegelense (Z1), mcp (M1). Shared's seven batches touch disjoint file lists; run them two at a time at most, since every one gates on the same shared unit run.
- G1a, G1b, G2, G3 run beside wave 1. W1 waits for G1a.
- One shared unit run after S1 to S7, and one after G1a/G1b for web.

### Outside the premise (reported, not planned)

- `packages/orchestrator/src/brokers/quest/orchestration-loop/quest-orchestration-loop-broker.ts` line 80: `catch { return fallbackSlotCount; }` around `configResolveBroker`, the user's own `.dungeonmaster.json`. A malformed or unreadable config silently becomes the default slot count. No test stages a failure there, so it is not on the list; it is the same class as the item's named example and wants an operator decision.
- Catch-everything implementations with no failure staged anywhere in their test or proxy (about 90 files by the scan, for example orchestrator `guild-list-broker.ts`, `dispatch-state-read-broker.ts`, `usage-ledger-read-broker.ts`, ward `storage-load-broker.ts`, `storage-prune-broker.ts`): the item's premise is code-less staging, so they are out.

### Operator decisions (2026-09-29 afternoon)

| # | Decision |
|---|---|
| D1 | Concession 24 (EPIC): `packages/hooks/src/brokers/eslint/is-path-ignored/eslint-is-path-ignored-broker.test.ts` may stage ESLint's own code-less "outside of base path" error; the catch stays. |
| D2 | Concession 13 is extended to the three testing tests this plan lists as mock-API pass-through keeps. |
| D3 | New batch **O2**: `packages/orchestrator/src/brokers/quest/orchestration-loop/quest-orchestration-loop-broker.ts:80` answers the fallback slot count only when the config is absent (the not-found error `configResolveBroker` raises; read it to name it); any other failure (malformed JSON, EACCES) propagates. Its test stages a recorded failure and asserts the rejection. Files: the broker, its test, its proxy. Runs beside O1 only if the files are disjoint; otherwise after it. |
