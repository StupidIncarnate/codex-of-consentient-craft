# Adapters that touch no outside thing — stay adapters

Scope: the `tmp/adapters-fresh/adapters.json` entries with `outside: []` (106 files). Per the
brief, these stay adapters for now (they replace nothing in the gateway). Each row below is
confirmed against the file itself, not just the scan. Grouped by package.

Two corrections to the scan feed this table (rather than `npm.md`):

1. **13 orchestrator `git/*` adapters + 2 siegelense `npm/*` adapters** call `childProcessSpawnCaptureAdapter`
   from `@dungeonmaster/shared/adapters` — the scan recorded `otherPkg: []` for all of them, which
   is wrong; they forward to shared. Corrected below.
2. Three of siegelense's `playwright/session/*` "layer" adapters (`settle-wait-layer-adapter.ts`,
   `init-script-add-layer-adapter.ts`, `viewport-set-layer-adapter.ts`) call real `@playwright/test`
   `Page` methods (`page.setViewportSize`, `page.addInitScript`) — genuine npm calls the scan missed
   because it likely keyed on the folder's own header comment
   (`playwright-session-adapter.ts:3-4`: "the ONLY file in this package allowed to import
   `@playwright/test`"), which these three siblings already contradict. Flagged at the bottom;
   left out of this table and folded into `npm.md`'s playwright split note instead of getting full
   entries here, since their non-Playwright content (the page-side source strings, the
   `ContentText`/`AdapterResult` contracts) is exactly the "our logic" half of that same split.

## eslint-plugin

| Path | Calls instead | Reason it stays |
|---|---|---|
| `src/adapters/eslint-plugin-eslint-comments/load/eslint-plugin-eslint-comments-load-adapter.ts` | nothing of ours — casts the loaded plugin to `EslintPlugin` | **flagged**: touches `eslint-plugin-eslint-comments`, an npm package outside my assigned list — see note below |
| `src/adapters/eslint-plugin-jest/load/eslint-plugin-jest-load-adapter.ts` | nothing of ours | **flagged**: touches `eslint-plugin-jest`, outside my assigned list |
| `src/adapters/typescript-eslint-eslint-plugin/load/typescript-eslint-eslint-plugin-load-adapter.ts` | nothing of ours | **flagged**: touches `@typescript-eslint/eslint-plugin`, outside my assigned list |

## hooks

| Path | Calls instead | Reason it stays |
|---|---|---|
| `src/adapters/dungeonmaster-eslint-plugin/get-pre-edit-rules/dungeonmaster-eslint-plugin-get-pre-edit-rules-adapter.ts` | `@dungeonmaster/shared/statics` (`dungeonmasterRuleEnforceOnStatics`) | pure filter/map over our own statics, no library call |
| `src/adapters/eslint/calculate-config-for-file/eslint-calculate-config-for-file-adapter.ts` | calls `.calculateConfigForFile()` on a passed-in `ESLint` instance | **flagged**: this is a real `eslint` API call (type-only import today, but the method call is runtime) — added to `npm.md`'s eslint mapping table instead of staying here |
| `src/adapters/eslint/is-path-ignored/eslint-is-path-ignored-adapter.ts` | calls `.isPathIgnored()` on a passed-in `ESLint` instance | **flagged**, same as above |
| `src/adapters/process/hook-lint-ignored-paths/process-hook-lint-ignored-paths-adapter.ts` | nothing of ours | reads `process.env` — a Node global, not an npm package; out of this inventory's scope (belongs to whoever inventories `@dungeonmaster/node`) |

## hydration-recipes

| Path | Calls instead | Reason it stays |
|---|---|---|
| `src/adapters/dm-http/response-unwrap/dm-http-response-unwrap-adapter.ts` | nothing outside — a guard (`isHttpStatusSuccessGuard`) plus our own `DmHttpResponse` contract | pure envelope-unwrapping logic, no library call of any kind |

## mcp

All 15 files below are one shape: call the equivalent function on `@dungeonmaster/orchestrator`'s
barrel (`start-orchestrator.ts`), so the MCP tool has a mockable boundary in front of the
orchestrator package. Confirmed against `orchestrator-get-quest-adapter.ts` and
`orchestrator-bootstrap-adapter.ts`, both a one-line forward.

| Path | Calls instead | Reason it stays |
|---|---|---|
| `src/adapters/orchestrator/bootstrap/orchestrator-bootstrap-adapter.ts` | `@dungeonmaster/orchestrator` (`start-orchestrator.ts`) | forwards to another package |
| `src/adapters/orchestrator/create-quest/orchestrator-create-quest-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/create-worktree/orchestrator-create-worktree-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/get-agent-prompt/orchestrator-get-agent-prompt-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/get-blight-checklist/orchestrator-get-blight-checklist-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/get-next-step/orchestrator-get-next-step-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/get-quest/orchestrator-get-quest-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/get-quest-planning-notes/orchestrator-get-quest-planning-notes-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/get-quest-summary/orchestrator-get-quest-summary-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/get-quest-work/orchestrator-get-quest-work-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/get-server-config/orchestrator-get-server-config-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/handle-signal-back/orchestrator-handle-signal-back-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/list-guilds/orchestrator-list-guilds-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/list-quests/orchestrator-list-quests-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/modify-quest/orchestrator-modify-quest-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/quest-work/orchestrator-quest-work-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/record-quest-session/orchestrator-record-quest-session-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/start-quest/orchestrator-start-quest-adapter.ts` | same | forwards to another package |

## orchestrator

**Correction:** every `git/*` adapter below forwards to `@dungeonmaster/shared`'s
`childProcessSpawnCaptureAdapter` — confirmed in `git-current-branch-adapter.ts:15,29-33`,
`git-head-sha-adapter.ts:10,20-24`, `git-verify-ref-adapter.ts:16`, and
`git-worktree-add-adapter.ts:27,55-59` (all four opened directly; the rest share the identical
one-call shape by file size and header pattern). The scan's `otherPkg: []` is wrong for all 13 —
each one is a thin, command-specific composition of shared's spawn adapter, matching
`git-worktree-add-adapter.ts`'s own header: "Reach for this over calling
`childProcessSpawnCaptureAdapter` directly ... never call `child_process` itself outside an
adapter." None of these touch `child_process` (a Node builtin, not npm) directly themselves.

| Path | Calls instead | Reason it stays |
|---|---|---|
| `src/adapters/git/add-all/git-add-all-adapter.ts` | `@dungeonmaster/shared` (`childProcessSpawnCaptureAdapter`) | forwards to shared; fixes the exact git argument order for one command |
| `src/adapters/git/branch-delete/git-branch-delete-adapter.ts` | same | same |
| `src/adapters/git/checkout/git-checkout-adapter.ts` | same | same |
| `src/adapters/git/commit/git-commit-adapter.ts` | same | same |
| `src/adapters/git/current-branch/git-current-branch-adapter.ts` | same | same |
| `src/adapters/git/diff-files/git-diff-files-adapter.ts` | same | same |
| `src/adapters/git/head-sha/git-head-sha-adapter.ts` | same | same |
| `src/adapters/git/log-name-only/git-log-name-only-adapter.ts` | same | same |
| `src/adapters/git/push/git-push-adapter.ts` | same | same |
| `src/adapters/git/untracked-files/git-untracked-files-adapter.ts` | same | same |
| `src/adapters/git/upstream-sha/git-upstream-sha-adapter.ts` | same | same |
| `src/adapters/git/verify-ref/git-verify-ref-adapter.ts` | same | same |
| `src/adapters/git/worktree-add/git-worktree-add-adapter.ts` | same | same — the ONE place the create-branch-vs-attach-existing argument order lives |
| `src/adapters/git/worktree-prune/git-worktree-prune-adapter.ts` | same | same |
| `src/adapters/git/worktree-remove/git-worktree-remove-adapter.ts` | same | same |

*(These 15 rows are exactly the `@dungeonmaster/bin/git` migration candidates the design doc's
"Migration order" step 4 already names — they stay adapters for THIS build phase only because
rule 6 says existing adapters are untouched until a consumption phase.)*

## server

All 41 rows below are the server-side mirror of mcp's forwarders — a thin call into
`@dungeonmaster/orchestrator`, confirmed against `orchestrator-abandon-quest-adapter.ts` and
`orchestrator-list-quests-full-adapter.ts` (the latter forwards to a specific broker,
`quest-list-broker.ts`, rather than the barrel — still "forwards to another package").

| Path | Calls instead | Reason it stays |
|---|---|---|
| `src/adapters/orchestrator/abandon-quest/orchestrator-abandon-quest-adapter.ts` | `@dungeonmaster/orchestrator` (barrel) | forwards to another package |
| `src/adapters/orchestrator/add-guild/orchestrator-add-guild-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/add-quest/orchestrator-add-quest-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/bootstrap/orchestrator-bootstrap-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/browse-directories/orchestrator-browse-directories-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/clarify/orchestrator-clarify-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/comment-batch/orchestrator-comment-batch-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/delete-quest/orchestrator-delete-quest-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/events-on/orchestrator-events-on-adapter.ts` | `@dungeonmaster/orchestrator` (`orchestration-events-state.ts`) | forwards to another package's state module |
| `src/adapters/orchestrator/find-quest-by-session-id/orchestrator-find-quest-by-session-id-adapter.ts` | `@dungeonmaster/orchestrator` (barrel) | forwards to another package |
| `src/adapters/orchestrator/find-quest-by-work-item-id/orchestrator-find-quest-by-work-item-id-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/find-quest-path/orchestrator-find-quest-path-adapter.ts` | `@dungeonmaster/orchestrator` (`quest-find-quest-path-broker.ts`) | forwards to another package's broker |
| `src/adapters/orchestrator/get-dispatch-state/orchestrator-get-dispatch-state-adapter.ts` | `@dungeonmaster/orchestrator` (barrel) | forwards to another package |
| `src/adapters/orchestrator/get-guild/orchestrator-get-guild-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/get-orchestration-mode/orchestrator-get-orchestration-mode-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/get-quest/orchestrator-get-quest-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/get-quest-projection/orchestrator-get-quest-projection-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/get-quest-queue/orchestrator-get-quest-queue-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/get-quest-status/orchestrator-get-quest-status-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/get-quest-summary/orchestrator-get-quest-summary-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/get-rate-limits/orchestrator-get-rate-limits-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/get-smoketest-state/orchestrator-get-smoketest-state-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/handle-signal-back/orchestrator-handle-signal-back-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/list-guilds/orchestrator-list-guilds-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/list-quests/orchestrator-list-quests-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/list-quests-full/orchestrator-list-quests-full-adapter.ts` | `@dungeonmaster/orchestrator` (`quest-list-broker.ts`) | forwards to another package's broker |
| `src/adapters/orchestrator/list-quests-with-skips/orchestrator-list-quests-with-skips-adapter.ts` | `@dungeonmaster/orchestrator` (barrel) | forwards to another package |
| `src/adapters/orchestrator/load-quest/orchestrator-load-quest-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/merge-quest/orchestrator-merge-quest-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/modify-quest/orchestrator-modify-quest-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/normalize-dispatch-boot/orchestrator-normalize-dispatch-boot-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/outbox-watch/orchestrator-outbox-watch-adapter.ts` | `@dungeonmaster/orchestrator` (`quest-outbox-watch-broker.ts`) | forwards to another package's broker |
| `src/adapters/orchestrator/pause-dispatch/orchestrator-pause-dispatch-adapter.ts` | `@dungeonmaster/orchestrator` (barrel) | forwards to another package |
| `src/adapters/orchestrator/pause-quest/orchestrator-pause-quest-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/play-dispatch/orchestrator-play-dispatch-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/recover-active-quests/orchestrator-recover-active-quests-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/remove-guild/orchestrator-remove-guild-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/replay-chat-history/orchestrator-replay-chat-history-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/resume-quest/orchestrator-resume-quest-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/run-smoketest/orchestrator-run-smoketest-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/start-chat/orchestrator-start-chat-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/start-followup-chat/orchestrator-start-followup-chat-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/start-monitor-watcher/orchestrator-start-monitor-watcher-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/start-quest/orchestrator-start-quest-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/stop-all-chats/orchestrator-stop-all-chats-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/stop-followup-chat/orchestrator-stop-followup-chat-adapter.ts` | same | forwards to another package |
| `src/adapters/orchestrator/update-guild/orchestrator-update-guild-adapter.ts` | same | forwards to another package |

## siegelense

**Correction (npm-install/npm-run-build):** both call `@dungeonmaster/shared`'s
`childProcessSpawnCaptureAdapter`, confirmed at `npm-install-adapter.ts:13,26-30` and
`npm-run-build-adapter.ts:16,32-36` — same shape and the same scan miss as orchestrator's `git/*`
adapters above.

**Correction (dungeonmaster-config resolve):** `src/adapters/dungeonmaster-config/resolve/dungeonmaster-config-resolve-adapter.ts`
forwards to `@dungeonmaster/config`'s `config-resolve-broker.ts` — the scan already recorded this
one correctly as `otherPkg`.

| Path | Calls instead | Reason it stays |
|---|---|---|
| `src/adapters/dungeonmaster-config/resolve/dungeonmaster-config-resolve-adapter.ts` | `@dungeonmaster/config` (`config-resolve-broker.ts`) | forwards to another package |
| `src/adapters/npm/install/npm-install-adapter.ts` | `@dungeonmaster/shared` (`childProcessSpawnCaptureAdapter`) | forwards to shared; fixes the `npm install` argument shape |
| `src/adapters/npm/run-build/npm-run-build-adapter.ts` | same | forwards to shared; fixes the `npm run build --workspace=` argument shape |
| `src/adapters/playwright/session/dom-read-layer-adapter.ts` | nothing outside — builds page-side source strings as plain template literals, parses the raw return with our own contracts | pure source-string builder + contract translation; the `page.evaluate(source)` call that actually runs it lives in `playwright-session-adapter.ts`, not here |
| `src/adapters/playwright/session/key-press-layer-adapter.ts` | nothing outside | same shape as `dom-read-layer-adapter.ts` |
| `src/adapters/playwright/session/key-read-layer-adapter.ts` | nothing outside | same shape |
| `src/adapters/playwright/session/listeners-layer-adapter.ts` | nothing outside | explicitly documented (its own header, lines 3-8) as importing **nothing** from `@playwright/test` on purpose, so its own proxy mocks nothing |
| `src/adapters/playwright/session/root-check-layer-adapter.ts` | nothing outside | same shape as `dom-read-layer-adapter.ts` |

## web

| Path | Calls instead | Reason it stays |
|---|---|---|
| `src/adapters/dom/composer-delete-thumbnail/dom-composer-delete-thumbnail-adapter.ts` | nothing of ours | touches `HTMLElement`/DOM Range APIs — a **browser global**, not npm; out of this inventory's scope |
| `src/adapters/dom/composer-insert-image/dom-composer-insert-image-adapter.ts` | our own `ComposerAttachment` contract + `chatComposerStatics` | same — browser globals, out of scope here |
| `src/adapters/dom/composer-insert-text/dom-composer-insert-text-adapter.ts` | our own `composerCaretFillerElementTransformer` | same — browser globals, out of scope here |
| `src/adapters/dom/composer-read/dom-composer-read-adapter.ts` | our own `composerSegmentContract` + `chatComposerStatics` | same — browser globals (`HTMLElement`, `Text`, `Element`), out of scope here |
| `src/adapters/indexed-db/draft-images-read/migrate-legacy-records-layer-adapter.ts` | our own `isLegacyComposerScopeRecordGuard` + `chatComposerStatics` | touches `IDBDatabase` — a browser global, not npm; out of scope here |

## Flagged: scan said "no outside call," but the file really touches something outside

| Path | What it actually touches | Where it's handled |
|---|---|---|
| `packages/hooks/src/adapters/eslint/calculate-config-for-file/eslint-calculate-config-for-file-adapter.ts` | `eslint` (method call on a passed `ESLint` instance) | added to `npm.md`'s eslint mapping table |
| `packages/hooks/src/adapters/eslint/is-path-ignored/eslint-is-path-ignored-adapter.ts` | `eslint` (method call on a passed `ESLint` instance) | added to `npm.md`'s eslint mapping table |
| `packages/eslint-plugin/src/adapters/eslint-plugin-eslint-comments/load/eslint-plugin-eslint-comments-load-adapter.ts` | `eslint-plugin-eslint-comments` (npm) | outside my assigned npm list — noted here only |
| `packages/eslint-plugin/src/adapters/eslint-plugin-jest/load/eslint-plugin-jest-load-adapter.ts` | `eslint-plugin-jest` (npm) | outside my assigned npm list — noted here only |
| `packages/eslint-plugin/src/adapters/typescript-eslint-eslint-plugin/load/typescript-eslint-eslint-plugin-load-adapter.ts` | `@typescript-eslint/eslint-plugin` (npm) | outside my assigned npm list — noted here only |
| `packages/hooks/src/adapters/process/hook-lint-ignored-paths/process-hook-lint-ignored-paths-adapter.ts` | `process.env` (Node global) | not npm — belongs to `@dungeonmaster/node`'s inventory |
| `packages/web/src/adapters/react-dom/mount/react-dom-mount-adapter.ts` | `document.getElementById` (browser global), alongside `react-dom/client` (npm) | npm half in `npm.md`; the global half belongs to `@dungeonmaster/browser`'s inventory |
| `packages/web/src/adapters/mantine/notifications/mantine-notifications-adapter.ts` | `@mantine/notifications` (npm) | moved into `npm.md` in full, not left here |
| `packages/siegelense/src/adapters/playwright/session/settle-wait-layer-adapter.ts` | `@playwright/test` (`Page.addInitScript`, `Page.waitForTimeout` via `settlePollLayerAdapter`) | folded into `npm.md`'s playwright split note |
| `packages/siegelense/src/adapters/playwright/session/init-script-add-layer-adapter.ts` | `@playwright/test` (`Page.addInitScript`) | folded into `npm.md`'s playwright split note |
| `packages/siegelense/src/adapters/playwright/session/viewport-set-layer-adapter.ts` | `@playwright/test` (`Page.setViewportSize`) | folded into `npm.md`'s playwright split note |
