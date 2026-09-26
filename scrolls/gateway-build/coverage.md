# Gateway build: adapter coverage map

One row per adapter file under `packages/*/src/adapters/**` (excluding `.test.ts`, `.proxy.ts`, `.stub.ts`), with its fate — `gateway` (replaced by a gateway export), `split` (an outside half moves, an our-logic half stays), `stays` (touches no outside thing directly), or `dead` (no production callers). Built against the real `index.ts` files under `packages/{npm,node,browser,bin}/src/*/`, not the design docs alone.

## Counts per fate

| Fate | Count |
|---|---|
| gateway | 220 |
| split | 43 |
| stays | 83 |
| dead | 3 |
| **total** | **349** |

## Real gaps

Adapters whose fate is `gateway`/`split` but the matching gateway export does not exist anywhere in the real `index.ts` files (`packages/browser`, `packages/npm` wrappers, and `packages/bin/src/claude` are excluded here — see Pending below).

| Adapter | Would-be gateway target | Why it is a real gap |
|---|---|---|
| `packages/orchestrator/src/adapters/process/kill-by-port/process-kill-by-port-adapter.ts` | @dungeonmaster/bin/lsof #listeningPids + bin/kill #killPid | REAL GAP: the composing "list what is on this port, then kill it" function has no home yet (followups.md) |
| `packages/ward/src/adapters/net/kill-port/net-kill-port-adapter.ts` | @dungeonmaster/bin/lsof #listeningPids + bin/kill #killPid | REAL GAP: same composing-function gap as orchestrator's process-kill-by-port-adapter (followups.md); signal/tolerance policy also needs reconciling (child-process-and-bin.md §4) |
| `packages/ward/src/adapters/net/port-in-use/net-port-in-use-adapter.ts` | @dungeonmaster/bin/lsof #listeningPids | REAL GAP: same composing-function gap; "portInUse" convenience export has no home yet |

## Pending — builder still running

Adapters whose gateway target sits in a package that was still being built at the time of this census (`packages/browser`, `packages/npm` wrappers, `packages/bin/src/claude`).

**Update, 2026-09-26:** `packages/browser`, the `packages/npm` wrappers, and `packages/bin/src/claude`
(now `packages/@gateway/bin/src/claude`) are all built — `resolveClaudeCliPath`, `spawnStreamJson` and
`ClaudeNotInstalledError` are real exports there (`scrolls/gateway-build/README.md` section 2). The row
below is left as this census recorded it; only the "pending" reason is now stale.

| Adapter | Would-be gateway target | Note |
|---|---|---|
| `packages/orchestrator/src/adapters/child-process/spawn-stream-json/child-process-spawn-stream-json-adapter.ts` | @dungeonmaster/bin/claude #spawnStreamJson | pending: builder still running (packages/bin/src/claude has no folder yet); settings-file read + --add-dir + env handling stay an orchestrator broker |

## Coverage table

| Adapter | Fate | Gateway export | Note |
|---|---|---|---|
| `packages/cli/src/adapters/child-process/exec/child-process-exec-adapter.ts` | gateway | @dungeonmaster/node/child_process #runFireAndForget | child-process-and-bin.md §3 |
| `packages/cli/src/adapters/crypto/random-uuid/crypto-random-uuid-adapter.ts` | gateway | @dungeonmaster/node/crypto #randomUUID | pass-through of node crypto (node-and-browser.md §4) |
| `packages/cli/src/adapters/fs/append-file/fs-append-file-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #appendFile | fs family — see inventory/node-fs.md mapping table |
| `packages/cli/src/adapters/fs/mkdir/fs-mkdir-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #ensureDir | fs family — see inventory/node-fs.md mapping table |
| `packages/cli/src/adapters/fs/read-file/fs-read-file-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #readFile | fs family — see inventory/node-fs.md mapping table |
| `packages/cli/src/adapters/fs/readdir/fs-readdir-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #readdirIfExists | fs family — see inventory/node-fs.md mapping table |
| `packages/cli/src/adapters/fs/realpath/fs-realpath-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #realpath | fs family — see inventory/node-fs.md mapping table |
| `packages/cli/src/adapters/fs/rename/fs-rename-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #rename | fs family — see inventory/node-fs.md mapping table |
| `packages/cli/src/adapters/fs/stat/fs-stat-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #statIfExists | fs family — see inventory/node-fs.md mapping table |
| `packages/cli/src/adapters/fs/write-file/fs-write-file-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #writeFile | fs family — see inventory/node-fs.md mapping table |
| `packages/cli/src/adapters/process/stdin-read/process-stdin-read-adapter.ts` | gateway | @dungeonmaster/node/process #readStdinToEnd | confirmed real export |
| `packages/cli/src/adapters/readline/question/readline-question-adapter.ts` | gateway | @dungeonmaster/node/readline #question | confirmed real export |
| `packages/cli/src/adapters/typescript/content-diagnostics/typescript-content-diagnostics-adapter.ts` | split | @dungeonmaster/npm/typescript (ts.*) | virtual-file host overrides + ErrorMessage contract mapping stay adapter (npm.md splits table) |
| `packages/config/src/adapters/fs/access/fs-access-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #pathExists | fs family — see inventory/node-fs.md mapping table |
| `packages/config/src/adapters/fs/read-file/fs-read-file-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #readFile | fs family — see inventory/node-fs.md mapping table |
| `packages/config/src/adapters/fs/write-file/fs-write-file-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #writeFile | fs family — see inventory/node-fs.md mapping table |
| `packages/config/src/adapters/path/dirname/path-dirname-adapter.ts` | gateway | @dungeonmaster/node/path #dirname | wrapper deleted; callers import path directly (node-and-browser.md mapping table) |
| `packages/config/src/adapters/path/join/path-join-adapter.ts` | gateway | @dungeonmaster/node/path #join | wrapper deleted; callers import path directly (node-and-browser.md mapping table) |
| `packages/eslint-plugin/src/adapters/eslint-plugin-eslint-comments/load/eslint-plugin-eslint-comments-load-adapter.ts` | gateway | @dungeonmaster/npm/eslint-plugin-eslint-comments | touches npm directly; confirmed real gateway export* |
| `packages/eslint-plugin/src/adapters/eslint-plugin-jest/load/eslint-plugin-jest-load-adapter.ts` | gateway | @dungeonmaster/npm/eslint-plugin-jest | touches npm directly; confirmed real gateway export* |
| `packages/eslint-plugin/src/adapters/eslint/rule-tester/eslint-rule-tester-adapter.ts` | gateway | @dungeonmaster/npm/eslint #RuleTester | confirmed real gateway export* |
| `packages/eslint-plugin/src/adapters/fs/ensure-read-file-sync/fs-ensure-read-file-sync-adapter.ts` | gateway | @dungeonmaster/node/fs #readFileSyncIfExists | fs family — see inventory/node-fs.md mapping table |
| `packages/eslint-plugin/src/adapters/fs/exists-sync/fs-exists-sync-adapter.ts` | gateway | @dungeonmaster/node/fs #existsSync | fs family — see inventory/node-fs.md mapping table |
| `packages/eslint-plugin/src/adapters/fs/read-file-sync/fs-read-file-sync-adapter.ts` | gateway | @dungeonmaster/node/fs #readFileSync | fs family — see inventory/node-fs.md mapping table |
| `packages/eslint-plugin/src/adapters/fs/write-file-sync/fs-write-file-sync-adapter.ts` | gateway | @dungeonmaster/node/fs #writeFileSync | fs family — see inventory/node-fs.md mapping table |
| `packages/eslint-plugin/src/adapters/minimatch/match/minimatch-match-adapter.ts` | gateway | @dungeonmaster/npm/minimatch | confirmed real gateway export* |
| `packages/eslint-plugin/src/adapters/path/join/path-join-adapter.ts` | gateway | @dungeonmaster/node/path #join | wrapper deleted; callers import path directly (node-and-browser.md mapping table) |
| `packages/eslint-plugin/src/adapters/typescript-eslint-eslint-plugin/load/typescript-eslint-eslint-plugin-load-adapter.ts` | gateway | @dungeonmaster/npm/@typescript-eslint/eslint-plugin | touches npm directly; confirmed real gateway export* |
| `packages/hooks/src/adapters/child-process/exec-sync/child-process-exec-sync-adapter.ts` | dead | — | 0 production callers (child-process-and-bin.md §3); delete, do not migrate |
| `packages/hooks/src/adapters/child-process/spawn/child-process-spawn-adapter.ts` | dead | — | 0 production callers (child-process-and-bin.md §3); delete, do not migrate |
| `packages/hooks/src/adapters/debug/debug/debug-debug-adapter.ts` | gateway | @dungeonmaster/npm/debug | confirmed real gateway export=mod |
| `packages/hooks/src/adapters/dungeonmaster-eslint-plugin/get-pre-edit-rules/dungeonmaster-eslint-plugin-get-pre-edit-rules-adapter.ts` | stays | — | pure filter/map over dungeonmasterRuleEnforceOnStatics, no library call (stays-as-adapter.md) |
| `packages/hooks/src/adapters/eslint/calculate-config-for-file/eslint-calculate-config-for-file-adapter.ts` | gateway | @dungeonmaster/npm/eslint #ESLint | flagged: real eslint API call via a passed-in ESLint instance (stays-as-adapter.md flagged section) |
| `packages/hooks/src/adapters/eslint/eslint/eslint-eslint-adapter.ts` | gateway | @dungeonmaster/npm/eslint #ESLint | confirmed real gateway export* |
| `packages/hooks/src/adapters/eslint/is-path-ignored/eslint-is-path-ignored-adapter.ts` | gateway | @dungeonmaster/npm/eslint #ESLint | flagged: real eslint API call via a passed-in ESLint instance |
| `packages/hooks/src/adapters/eslint/linter/eslint-linter-adapter.ts` | gateway | @dungeonmaster/npm/eslint #Linter | confirmed real gateway export* |
| `packages/hooks/src/adapters/eslint/output-fixes/eslint-output-fixes-adapter.ts` | gateway | @dungeonmaster/npm/eslint #ESLint | confirmed real gateway export*; sad-path hole noted in npm.md (no catch around disk write) |
| `packages/hooks/src/adapters/fetch/get-with-status/fetch-get-with-status-adapter.ts` | gateway | @dungeonmaster/node/fetch #fetchWithStatus | fills the gap: fetchWithStatus returns {status, ok, body}, body raw text, never throws on 4xx/5xx |
| `packages/hooks/src/adapters/fetch/patch/fetch-patch-adapter.ts` | gateway | @dungeonmaster/node/fetch #fetchJson | throws on non-2xx, matches fetchJson |
| `packages/hooks/src/adapters/fs/ensure-write/fs-ensure-write-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #writeFileCreatingParent | fs family — see inventory/node-fs.md mapping table |
| `packages/hooks/src/adapters/fs/exists-sync/fs-exists-sync-adapter.ts` | gateway | @dungeonmaster/node/fs #existsSync | fs family — see inventory/node-fs.md mapping table |
| `packages/hooks/src/adapters/fs/read-file/fs-read-file-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #readFile | fs family — see inventory/node-fs.md mapping table |
| `packages/hooks/src/adapters/fs/stat/fs-stat-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #statIfExists | fs family — see inventory/node-fs.md mapping table |
| `packages/hooks/src/adapters/module/require-fresh/module-require-fresh-adapter.ts` | gateway | @dungeonmaster/node/module (createRequire) | moduleGateway.createRequire is real per its own USAGE docstring |
| `packages/hooks/src/adapters/path/join/path-join-adapter.ts` | gateway | @dungeonmaster/node/path #join | wrapper deleted; callers import path directly (node-and-browser.md mapping table) |
| `packages/hooks/src/adapters/path/resolve/path-resolve-adapter.ts` | gateway | @dungeonmaster/node/path #resolve | wrapper deleted; callers import path directly (node-and-browser.md mapping table) |
| `packages/hooks/src/adapters/process/hook-lint-ignored-paths/process-hook-lint-ignored-paths-adapter.ts` | gateway | @dungeonmaster/node/process #getEnv | MOVED OUT of stays-as-adapter.md: reads process.env directly, a Node global |
| `packages/hydration-recipes/src/adapters/dm-http/request/dm-http-request-adapter.ts` | split | @dungeonmaster/node/fetch #fetchWithStatus | target.request branch stays our logic; the fetch fallback branch now has a home in fetchWithStatus's {status, ok, body} shape |
| `packages/hydration-recipes/src/adapters/dm-http/response-unwrap/dm-http-response-unwrap-adapter.ts` | stays | — | pure envelope-unwrapping guard, no library call (stays-as-adapter.md) |
| `packages/hydration-recipes/src/adapters/dm-jsonl/append/dm-jsonl-append-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #appendLinesCreatingParent | node-fs.md §2 mapping table |
| `packages/hydration-recipes/src/adapters/fetch/json/fetch-json-adapter.ts` | gateway | @dungeonmaster/node/fetch #fetchJson | throws on non-2xx naming method/url/status/body, matches fetchJson |
| `packages/hydration-recipes/src/adapters/fs/append-file/fs-append-file-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #appendFile | fs family — see inventory/node-fs.md mapping table |
| `packages/hydration-recipes/src/adapters/fs/rename/fs-rename-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #rename | fs family — see inventory/node-fs.md mapping table |
| `packages/hydration-recipes/src/adapters/fs/rm/fs-rm-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #rm | fs family — see inventory/node-fs.md mapping table |
| `packages/hydration-recipes/src/adapters/fs/write-file/fs-write-file-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #writeFile | fs family — see inventory/node-fs.md mapping table |
| `packages/hydration-recipes/src/adapters/fs/write-text/fs-write-text-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #writeFileCreatingParent | fs family — see inventory/node-fs.md mapping table |
| `packages/hydration/src/adapters/fetch/post/fetch-post-adapter.ts` | gateway | @dungeonmaster/node/fetch #fetchWithStatus | fills the gap: never throws on 4xx/5xx, returns {status, ok, body}, and walks .cause to the deepest error the same way |
| `packages/hydration/src/adapters/fs/ensure-write/fs-ensure-write-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #writeFileCreatingParent | fs family — see inventory/node-fs.md mapping table |
| `packages/hydration/src/adapters/typescript/program-diagnostics/typescript-program-diagnostics-adapter.ts` | split | @dungeonmaster/npm/typescript (ts.*) | repo-root resolution + TypeDiagnostic contract mapping stay adapter (npm.md splits table) |
| `packages/mcp/src/adapters/fs/glob/fs-glob-adapter.ts` | gateway | @dungeonmaster/npm/glob#glob | fs family — see inventory/node-fs.md mapping table |
| `packages/mcp/src/adapters/fs/mkdir/fs-mkdir-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #ensureDir | fs family — see inventory/node-fs.md mapping table |
| `packages/mcp/src/adapters/fs/read-file-if-exists/fs-read-file-if-exists-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #readFileIfExists | fs family — see inventory/node-fs.md mapping table |
| `packages/mcp/src/adapters/fs/read-file/fs-read-file-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #readFile | fs family — see inventory/node-fs.md mapping table |
| `packages/mcp/src/adapters/fs/readdir-if-exists/fs-readdir-if-exists-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #readdirIfExists | fs family — see inventory/node-fs.md mapping table |
| `packages/mcp/src/adapters/fs/readdir/fs-readdir-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #readdirIfExists | fs family — see inventory/node-fs.md mapping table |
| `packages/mcp/src/adapters/fs/stat/fs-stat-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #statIfExists | fs family — see inventory/node-fs.md mapping table |
| `packages/mcp/src/adapters/fs/write-file/fs-write-file-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #writeFile | fs family — see inventory/node-fs.md mapping table |
| `packages/mcp/src/adapters/glob/find/glob-find-adapter.ts` | gateway | @dungeonmaster/npm/glob #glob | winning shape per npm.md glob design (required ignore list, no v7 fallback) |
| `packages/mcp/src/adapters/orchestrator/bootstrap/orchestrator-bootstrap-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator barrel — not an outside call (stays-as-adapter.md) |
| `packages/mcp/src/adapters/orchestrator/create-quest/orchestrator-create-quest-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator barrel — not an outside call (stays-as-adapter.md) |
| `packages/mcp/src/adapters/orchestrator/create-worktree/orchestrator-create-worktree-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator barrel — not an outside call (stays-as-adapter.md) |
| `packages/mcp/src/adapters/orchestrator/get-agent-prompt/orchestrator-get-agent-prompt-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator barrel — not an outside call (stays-as-adapter.md) |
| `packages/mcp/src/adapters/orchestrator/get-blight-checklist/orchestrator-get-blight-checklist-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator barrel — not an outside call (stays-as-adapter.md) |
| `packages/mcp/src/adapters/orchestrator/get-next-step/orchestrator-get-next-step-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator barrel — not an outside call (stays-as-adapter.md) |
| `packages/mcp/src/adapters/orchestrator/get-quest-planning-notes/orchestrator-get-quest-planning-notes-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator barrel — not an outside call (stays-as-adapter.md) |
| `packages/mcp/src/adapters/orchestrator/get-quest-summary/orchestrator-get-quest-summary-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator barrel — not an outside call (stays-as-adapter.md) |
| `packages/mcp/src/adapters/orchestrator/get-quest-work/orchestrator-get-quest-work-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator barrel — not an outside call (stays-as-adapter.md) |
| `packages/mcp/src/adapters/orchestrator/get-quest/orchestrator-get-quest-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator barrel — not an outside call (stays-as-adapter.md) |
| `packages/mcp/src/adapters/orchestrator/get-server-config/orchestrator-get-server-config-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator barrel — not an outside call (stays-as-adapter.md) |
| `packages/mcp/src/adapters/orchestrator/handle-signal-back/orchestrator-handle-signal-back-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator barrel — not an outside call (stays-as-adapter.md) |
| `packages/mcp/src/adapters/orchestrator/list-guilds/orchestrator-list-guilds-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator barrel — not an outside call (stays-as-adapter.md) |
| `packages/mcp/src/adapters/orchestrator/list-quests/orchestrator-list-quests-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator barrel — not an outside call (stays-as-adapter.md) |
| `packages/mcp/src/adapters/orchestrator/modify-quest/orchestrator-modify-quest-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator barrel — not an outside call (stays-as-adapter.md) |
| `packages/mcp/src/adapters/orchestrator/quest-work/orchestrator-quest-work-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator barrel — not an outside call (stays-as-adapter.md) |
| `packages/mcp/src/adapters/orchestrator/record-quest-session/orchestrator-record-quest-session-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator barrel — not an outside call (stays-as-adapter.md) |
| `packages/mcp/src/adapters/orchestrator/start-quest/orchestrator-start-quest-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator barrel — not an outside call (stays-as-adapter.md) |
| `packages/mcp/src/adapters/path/join/path-join-adapter.ts` | gateway | @dungeonmaster/node/path #join | wrapper deleted; callers import path directly (node-and-browser.md mapping table) |
| `packages/mcp/src/adapters/path/resolve/path-resolve-adapter.ts` | gateway | @dungeonmaster/node/path #resolve | wrapper deleted; callers import path directly (node-and-browser.md mapping table) |
| `packages/mcp/src/adapters/shared-package/resolve/find-shared-package-root-layer-adapter.ts` | gateway | @dungeonmaster/node/fs #findUpSync | node-fs.md §2 row 99 |
| `packages/mcp/src/adapters/shared-package/resolve/shared-package-resolve-adapter.ts` | gateway | @dungeonmaster/node/module (resolvePackageRoot) | new curated helper wrapping require.resolve+dirname (node-and-browser.md §2/§4) |
| `packages/orchestrator/src/adapters/child-process/spawn-stream-json/child-process-spawn-stream-json-adapter.ts` | split | @dungeonmaster/bin/claude #spawnStreamJson | pending: builder still running (packages/bin/src/claude has no folder yet); settings-file read + --add-dir + env handling stay an orchestrator broker |
| `packages/orchestrator/src/adapters/child-process/spawn/child-process-spawn-adapter.ts` | dead | — | 0 production callers (child-process-and-bin.md §3); delete, do not migrate |
| `packages/orchestrator/src/adapters/dungeonmaster-config/resolve/dungeonmaster-config-resolve-adapter.ts` | stays | — | forwards to @dungeonmaster/config config-resolve-broker — not an outside call |
| `packages/orchestrator/src/adapters/fs/append-file/fs-append-file-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #appendFile | fs family — see inventory/node-fs.md mapping table |
| `packages/orchestrator/src/adapters/fs/is-accessible/fs-is-accessible-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #pathExists | fs family — see inventory/node-fs.md mapping table |
| `packages/orchestrator/src/adapters/fs/read-file-range/fs-read-file-range-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #readFileFromOffset | fs family — see inventory/node-fs.md mapping table |
| `packages/orchestrator/src/adapters/fs/read-file/fs-read-file-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #readFile | fs family — see inventory/node-fs.md mapping table |
| `packages/orchestrator/src/adapters/fs/read-jsonl/fs-read-jsonl-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #readNonEmptyLines | fs family — see inventory/node-fs.md mapping table |
| `packages/orchestrator/src/adapters/fs/readdir/fs-readdir-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #readdirIfExists | fs family — see inventory/node-fs.md mapping table |
| `packages/orchestrator/src/adapters/fs/readlink/fs-readlink-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #readlinkIfLink | fs family — see inventory/node-fs.md mapping table |
| `packages/orchestrator/src/adapters/fs/rename/fs-rename-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #rename | fs family — see inventory/node-fs.md mapping table |
| `packages/orchestrator/src/adapters/fs/rm/fs-rm-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #rm | fs family — see inventory/node-fs.md mapping table |
| `packages/orchestrator/src/adapters/fs/symlink/fs-symlink-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #symlink | fs family — see inventory/node-fs.md mapping table |
| `packages/orchestrator/src/adapters/fs/walk-files/fs-walk-files-adapter.ts` | gateway | @dungeonmaster/node/fs #walkFilesSync | fs family — see inventory/node-fs.md mapping table |
| `packages/orchestrator/src/adapters/fs/watch-tail/fs-watch-tail-adapter.ts` | gateway | @dungeonmaster/node/fs #tailFile | fs family — see inventory/node-fs.md mapping table |
| `packages/orchestrator/src/adapters/fs/write-file/fs-write-file-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #writeFile | fs family — see inventory/node-fs.md mapping table |
| `packages/orchestrator/src/adapters/git/add-all/git-add-all-adapter.ts` | gateway | @dungeonmaster/bin/git #addAll | confirmed real export in bin/git/index.ts; migration itself deferred to the consumption phase (brief rule 6) — currently unchanged, listed as "stays" in stays-as-adapter.md for that reason |
| `packages/orchestrator/src/adapters/git/branch-delete/git-branch-delete-adapter.ts` | gateway | @dungeonmaster/bin/git #branchDelete | confirmed real export in bin/git/index.ts; migration itself deferred to the consumption phase (brief rule 6) — currently unchanged, listed as "stays" in stays-as-adapter.md for that reason |
| `packages/orchestrator/src/adapters/git/checkout/git-checkout-adapter.ts` | gateway | @dungeonmaster/bin/git #checkout | confirmed real export in bin/git/index.ts; migration itself deferred to the consumption phase (brief rule 6) — currently unchanged, listed as "stays" in stays-as-adapter.md for that reason |
| `packages/orchestrator/src/adapters/git/commit/git-commit-adapter.ts` | gateway | @dungeonmaster/bin/git #commit | confirmed real export in bin/git/index.ts; migration itself deferred to the consumption phase (brief rule 6) — currently unchanged, listed as "stays" in stays-as-adapter.md for that reason |
| `packages/orchestrator/src/adapters/git/current-branch/git-current-branch-adapter.ts` | gateway | @dungeonmaster/bin/git #currentBranch | confirmed real export in bin/git/index.ts; migration itself deferred to the consumption phase (brief rule 6) — currently unchanged, listed as "stays" in stays-as-adapter.md for that reason |
| `packages/orchestrator/src/adapters/git/diff-files/git-diff-files-adapter.ts` | gateway | @dungeonmaster/bin/git #diffFiles | confirmed real export in bin/git/index.ts; migration itself deferred to the consumption phase (brief rule 6) — currently unchanged, listed as "stays" in stays-as-adapter.md for that reason |
| `packages/orchestrator/src/adapters/git/head-sha/git-head-sha-adapter.ts` | gateway | @dungeonmaster/bin/git #headSha | confirmed real export in bin/git/index.ts; migration itself deferred to the consumption phase (brief rule 6) — currently unchanged, listed as "stays" in stays-as-adapter.md for that reason |
| `packages/orchestrator/src/adapters/git/log-name-only/git-log-name-only-adapter.ts` | gateway | @dungeonmaster/bin/git #logNameOnly | confirmed real export in bin/git/index.ts; migration itself deferred to the consumption phase (brief rule 6) — currently unchanged, listed as "stays" in stays-as-adapter.md for that reason |
| `packages/orchestrator/src/adapters/git/push/git-push-adapter.ts` | gateway | @dungeonmaster/bin/git #push | confirmed real export in bin/git/index.ts; migration itself deferred to the consumption phase (brief rule 6) — currently unchanged, listed as "stays" in stays-as-adapter.md for that reason |
| `packages/orchestrator/src/adapters/git/untracked-files/git-untracked-files-adapter.ts` | gateway | @dungeonmaster/bin/git #untrackedFiles | confirmed real export in bin/git/index.ts; migration itself deferred to the consumption phase (brief rule 6) — currently unchanged, listed as "stays" in stays-as-adapter.md for that reason |
| `packages/orchestrator/src/adapters/git/upstream-sha/git-upstream-sha-adapter.ts` | gateway | @dungeonmaster/bin/git #upstreamSha | confirmed real export in bin/git/index.ts; migration itself deferred to the consumption phase (brief rule 6) — currently unchanged, listed as "stays" in stays-as-adapter.md for that reason |
| `packages/orchestrator/src/adapters/git/verify-ref/git-verify-ref-adapter.ts` | gateway | @dungeonmaster/bin/git #verifyRef | confirmed real export in bin/git/index.ts; migration itself deferred to the consumption phase (brief rule 6) — currently unchanged, listed as "stays" in stays-as-adapter.md for that reason |
| `packages/orchestrator/src/adapters/git/worktree-add/git-worktree-add-adapter.ts` | gateway | @dungeonmaster/bin/git #worktreeAdd | confirmed real export in bin/git/index.ts; migration itself deferred to the consumption phase (brief rule 6) — currently unchanged, listed as "stays" in stays-as-adapter.md for that reason |
| `packages/orchestrator/src/adapters/git/worktree-prune/git-worktree-prune-adapter.ts` | gateway | @dungeonmaster/bin/git #worktreePrune | confirmed real export in bin/git/index.ts; migration itself deferred to the consumption phase (brief rule 6) — currently unchanged, listed as "stays" in stays-as-adapter.md for that reason |
| `packages/orchestrator/src/adapters/git/worktree-remove/git-worktree-remove-adapter.ts` | gateway | @dungeonmaster/bin/git #worktreeRemove | confirmed real export in bin/git/index.ts; migration itself deferred to the consumption phase (brief rule 6) — currently unchanged, listed as "stays" in stays-as-adapter.md for that reason |
| `packages/orchestrator/src/adapters/http/readiness-poll/http-readiness-poll-adapter.ts` | split | @dungeonmaster/node/setTimeout, node/fetch (fetch used bare) | exponential-backoff poll loop is our own logic and stays; the raw fetch()/setTimeout() calls move |
| `packages/orchestrator/src/adapters/net/check-port-free/net-check-port-free-adapter.ts` | gateway | @dungeonmaster/node/net #isPortFree | confirmed real export |
| `packages/orchestrator/src/adapters/proc/check-alive/proc-check-alive-adapter.ts` | gateway | @dungeonmaster/node/process #kill | confirmed real export; probe-vs-signal semantics stay at the caller (node-and-browser.md §4) |
| `packages/orchestrator/src/adapters/process/kill-by-port/process-kill-by-port-adapter.ts` | gateway | @dungeonmaster/bin/lsof #listeningPids + bin/kill #killPid | REAL GAP: the composing "list what is on this port, then kill it" function has no home yet (followups.md) |
| `packages/orchestrator/src/adapters/process/signal/process-signal-adapter.ts` | gateway | @dungeonmaster/node/process #kill | confirmed real export |
| `packages/orchestrator/src/adapters/readline/create-interface/readline-create-interface-adapter.ts` | gateway | @dungeonmaster/node/readline #lineReader | confirmed real export; adds an onError param the current bare adapter lacks |
| `packages/orchestrator/src/adapters/timer/set-interval/timer-set-interval-adapter.ts` | gateway | @dungeonmaster/node/setInterval | confirmed real pass-through export |
| `packages/orchestrator/src/adapters/timer/set-timeout/timer-set-timeout-adapter.ts` | gateway | @dungeonmaster/node/setTimeout | confirmed real pass-through export |
| `packages/server/src/adapters/child-process/spawn-long-lived/child-process-spawn-long-lived-adapter.ts` | gateway | @dungeonmaster/node/child_process #spawnLongLived | confirmed real export |
| `packages/server/src/adapters/fs/mkdir/fs-mkdir-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #ensureDir | fs family — see inventory/node-fs.md mapping table |
| `packages/server/src/adapters/fs/read-file-bytes/fs-read-file-bytes-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #readFileBytes | fs family — see inventory/node-fs.md mapping table |
| `packages/server/src/adapters/fs/read-file/fs-read-file-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #readFile | fs family — see inventory/node-fs.md mapping table |
| `packages/server/src/adapters/fs/realpath/fs-realpath-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #realpath | fs family — see inventory/node-fs.md mapping table |
| `packages/server/src/adapters/fs/rm/fs-rm-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #rm | fs family — see inventory/node-fs.md mapping table |
| `packages/server/src/adapters/fs/stat/fs-stat-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #statIfExists | fs family — see inventory/node-fs.md mapping table |
| `packages/server/src/adapters/fs/write-file-base64/fs-write-file-base64-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #writeFileFromBase64 | fs family — see inventory/node-fs.md mapping table |
| `packages/server/src/adapters/fs/write-file-bytes/fs-write-file-bytes-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #writeFileBytes | fs family — see inventory/node-fs.md mapping table |
| `packages/server/src/adapters/fs/write-file/fs-write-file-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #writeFile | fs family — see inventory/node-fs.md mapping table |
| `packages/server/src/adapters/glob/find/glob-find-adapter.ts` | gateway | @dungeonmaster/npm/glob #glob | has dead v7-callback fallback code the gateway drops (npm.md) |
| `packages/server/src/adapters/hono/create-node-web-socket/hono-create-node-web-socket-adapter.ts` | gateway | @dungeonmaster/npm/@hono/node-ws #createNodeWebSocket | confirmed real export* |
| `packages/server/src/adapters/hono/serve/hono-serve-adapter.ts` | gateway | @dungeonmaster/npm/@hono/node-server #serve | confirmed real export* |
| `packages/server/src/adapters/orchestrator/abandon-quest/orchestrator-abandon-quest-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/add-guild/orchestrator-add-guild-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/add-quest/orchestrator-add-quest-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/bootstrap/orchestrator-bootstrap-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/browse-directories/orchestrator-browse-directories-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/clarify/orchestrator-clarify-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/comment-batch/orchestrator-comment-batch-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/delete-quest/orchestrator-delete-quest-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/events-on/orchestrator-events-on-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/find-quest-by-session-id/orchestrator-find-quest-by-session-id-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/find-quest-by-work-item-id/orchestrator-find-quest-by-work-item-id-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/find-quest-path/orchestrator-find-quest-path-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/get-dispatch-state/orchestrator-get-dispatch-state-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/get-guild/orchestrator-get-guild-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/get-orchestration-mode/orchestrator-get-orchestration-mode-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/get-quest-projection/orchestrator-get-quest-projection-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/get-quest-queue/orchestrator-get-quest-queue-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/get-quest-status/orchestrator-get-quest-status-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/get-quest-summary/orchestrator-get-quest-summary-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/get-quest/orchestrator-get-quest-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/get-rate-limits/orchestrator-get-rate-limits-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/get-smoketest-state/orchestrator-get-smoketest-state-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/handle-signal-back/orchestrator-handle-signal-back-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/list-guilds/orchestrator-list-guilds-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/list-quests-full/orchestrator-list-quests-full-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/list-quests-with-skips/orchestrator-list-quests-with-skips-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/list-quests/orchestrator-list-quests-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/load-quest/orchestrator-load-quest-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/merge-quest/orchestrator-merge-quest-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/modify-quest/orchestrator-modify-quest-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/normalize-dispatch-boot/orchestrator-normalize-dispatch-boot-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/outbox-watch/orchestrator-outbox-watch-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/pause-dispatch/orchestrator-pause-dispatch-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/pause-quest/orchestrator-pause-quest-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/play-dispatch/orchestrator-play-dispatch-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/recover-active-quests/orchestrator-recover-active-quests-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/remove-guild/orchestrator-remove-guild-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/replay-chat-history/orchestrator-replay-chat-history-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/resume-quest/orchestrator-resume-quest-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/run-smoketest/orchestrator-run-smoketest-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/start-chat/orchestrator-start-chat-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/start-followup-chat/orchestrator-start-followup-chat-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/start-monitor-watcher/orchestrator-start-monitor-watcher-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/start-quest/orchestrator-start-quest-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/stop-all-chats/orchestrator-stop-all-chats-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/stop-followup-chat/orchestrator-stop-followup-chat-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/orchestrator/update-guild/orchestrator-update-guild-adapter.ts` | stays | — | forwards to @dungeonmaster/orchestrator (barrel or a named broker) — not an outside call (stays-as-adapter.md) |
| `packages/server/src/adapters/process/dev-log/process-dev-log-adapter.ts` | split | @dungeonmaster/node/process #stdout, #getEnv | [dev] prefix/gating stays a server broker |
| `packages/server/src/adapters/web-bundle/dist-path/web-bundle-dist-path-adapter.ts` | split | @dungeonmaster/node/module (resolvePackageRoot) + node/fs #existsSync | stays an adapter-turned-broker per node-and-browser.md §4 |
| `packages/shared/src/adapters/child-process/spawn-capture/child-process-spawn-capture-adapter.ts` | gateway | @dungeonmaster/node/child_process #run | confirmed real export |
| `packages/shared/src/adapters/child-process/spawn-stream-lines/child-process-spawn-stream-lines-adapter.ts` | gateway | @dungeonmaster/node/child_process #streamLines | confirmed real export |
| `packages/shared/src/adapters/child-process/spawn-stream/child-process-spawn-stream-adapter.ts` | gateway | @dungeonmaster/node/child_process #stream | confirmed real export |
| `packages/shared/src/adapters/fast-xml-parser/parse/fast-xml-parser-parse-adapter.ts` | gateway | @dungeonmaster/npm/fast-xml-parser #parseXml | confirmed real export; sad-path hole noted (no catch on malformed XML) |
| `packages/shared/src/adapters/fetch/get/fetch-get-adapter.ts` | gateway | @dungeonmaster/node/fetch #fetchJson | confirmed real export; this is the fuller status+body+cause error shape that wins the drift reconciliation |
| `packages/shared/src/adapters/fs/access/fs-access-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #pathExists | fs family — see inventory/node-fs.md mapping table |
| `packages/shared/src/adapters/fs/exists-sync/fs-exists-sync-adapter.ts` | gateway | @dungeonmaster/node/fs #existsSync | fs family — see inventory/node-fs.md mapping table |
| `packages/shared/src/adapters/fs/mkdir/fs-mkdir-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #ensureDir | fs family — see inventory/node-fs.md mapping table |
| `packages/shared/src/adapters/fs/read-file-sync/fs-read-file-sync-adapter.ts` | gateway | @dungeonmaster/node/fs #readFileSync | fs family — see inventory/node-fs.md mapping table |
| `packages/shared/src/adapters/fs/readdir-with-types/fs-readdir-with-types-adapter.ts` | gateway | @dungeonmaster/node/fs #readdirEntriesSync | fs family — see inventory/node-fs.md mapping table |
| `packages/shared/src/adapters/net/free-port-pair/net-free-port-pair-adapter.ts` | gateway | @dungeonmaster/node/net #freePortPair | confirmed real export |
| `packages/shared/src/adapters/os/homedir/os-homedir-adapter.ts` | split | @dungeonmaster/node/os (homedir) | the DUNGEONMASTER_HOME env override is our own logic and moves into the calling broker |
| `packages/shared/src/adapters/os/user-homedir/os-user-homedir-adapter.ts` | gateway | @dungeonmaster/node/os (homedir) | adapter added nothing over the raw call |
| `packages/shared/src/adapters/path/basename/path-basename-adapter.ts` | gateway | @dungeonmaster/node/path #basename | wrapper deleted; callers import path directly (node-and-browser.md mapping table) |
| `packages/shared/src/adapters/path/dirname/path-dirname-adapter.ts` | gateway | @dungeonmaster/node/path #dirname | wrapper deleted; callers import path directly (node-and-browser.md mapping table) |
| `packages/shared/src/adapters/path/join/path-join-adapter.ts` | gateway | @dungeonmaster/node/path #join | wrapper deleted; callers import path directly (node-and-browser.md mapping table) |
| `packages/shared/src/adapters/path/resolve/path-resolve-adapter.ts` | gateway | @dungeonmaster/node/path #resolve | wrapper deleted; callers import path directly (node-and-browser.md mapping table) |
| `packages/shared/src/adapters/process/cwd/process-cwd-adapter.ts` | gateway | @dungeonmaster/node/process #cwd | confirmed real export |
| `packages/shared/src/adapters/runtime/dynamic-import/runtime-dynamic-import-adapter.ts` | gateway | @dungeonmaster/node/module #dynamicImport | fills the gap: a curated property alongside #resolvePackageRoot on the module gateway object, wrapping the same `import()` expression |
| `packages/siegelense/src/adapters/async/delay/async-delay-adapter.ts` | gateway | @dungeonmaster/node/setTimeout | wraps setTimeout as an awaitable promise; confirmed real pass-through export |
| `packages/siegelense/src/adapters/child-process/spawn-detached/child-process-spawn-detached-adapter.ts` | gateway | @dungeonmaster/node/child_process #spawnDetached | confirmed real export |
| `packages/siegelense/src/adapters/cli-package/bin-resolve/cli-package-bin-resolve-adapter.ts` | split | @dungeonmaster/node/fs #existsSync, #readFileSync | composed bin-path logic stays with siegelense (node-fs.md §2 row 111) |
| `packages/siegelense/src/adapters/cli-package/bin-resolve/package-root-find-layer-adapter.ts` | gateway | @dungeonmaster/node/fs #findUpSync | identical logic to mcp's copy (node-fs.md §3 drift table) |
| `packages/siegelense/src/adapters/crypto/hash/crypto-hash-adapter.ts` | gateway | @dungeonmaster/node/crypto (createHash) | output validated with a zod brand at the call site, not in the gateway |
| `packages/siegelense/src/adapters/dungeonmaster-config/resolve/dungeonmaster-config-resolve-adapter.ts` | stays | — | forwards to @dungeonmaster/config config-resolve-broker (stays-as-adapter.md) |
| `packages/siegelense/src/adapters/error/is-native-error/error-is-native-error-adapter.ts` | gateway | @dungeonmaster/node/util/types #isNativeError | confirmed real export* |
| `packages/siegelense/src/adapters/fetch/http-request/fetch-http-request-adapter.ts` | gateway | @dungeonmaster/node/fetch #fetchJson | confirmed real export |
| `packages/siegelense/src/adapters/fetch/probe/fetch-probe-adapter.ts` | gateway | @dungeonmaster/node/fetch #fetchOk | confirmed real export; isNativeError cross-realm check moves in unchanged |
| `packages/siegelense/src/adapters/fs/append-file/fs-append-file-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #appendFile | fs family — see inventory/node-fs.md mapping table |
| `packages/siegelense/src/adapters/fs/close-fd/fs-close-fd-adapter.ts` | gateway | @dungeonmaster/node/fs #closeSync | fs family — see inventory/node-fs.md mapping table |
| `packages/siegelense/src/adapters/fs/copy-file/fs-copy-file-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #copyFile | fs family — see inventory/node-fs.md mapping table |
| `packages/siegelense/src/adapters/fs/cp/fs-cp-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #copyDirContents | fs family — see inventory/node-fs.md mapping table |
| `packages/siegelense/src/adapters/fs/open-fd/fs-open-fd-adapter.ts` | gateway | @dungeonmaster/node/fs #openForAppendSync | fs family — see inventory/node-fs.md mapping table |
| `packages/siegelense/src/adapters/fs/read-file/fs-read-file-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #readFile | fs family — see inventory/node-fs.md mapping table |
| `packages/siegelense/src/adapters/fs/readdir/fs-readdir-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #readdirIfExists | fs family — see inventory/node-fs.md mapping table |
| `packages/siegelense/src/adapters/fs/readlink/fs-readlink-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #readlinkIfLink | fs family — see inventory/node-fs.md mapping table |
| `packages/siegelense/src/adapters/fs/realpath/fs-realpath-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #realpath | fs family — see inventory/node-fs.md mapping table |
| `packages/siegelense/src/adapters/fs/rename/fs-rename-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #rename | fs family — see inventory/node-fs.md mapping table |
| `packages/siegelense/src/adapters/fs/rm/fs-rm-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #rm | fs family — see inventory/node-fs.md mapping table |
| `packages/siegelense/src/adapters/fs/stat/fs-stat-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #statIfExists | fs family — see inventory/node-fs.md mapping table |
| `packages/siegelense/src/adapters/fs/statfs/fs-statfs-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #diskFreeBytes | fs family — see inventory/node-fs.md mapping table |
| `packages/siegelense/src/adapters/fs/symlink/fs-symlink-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #symlink | fs family — see inventory/node-fs.md mapping table |
| `packages/siegelense/src/adapters/fs/unlink/fs-unlink-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #unlink | fs family — see inventory/node-fs.md mapping table |
| `packages/siegelense/src/adapters/fs/write-file/fs-write-file-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #writeFile | fs family — see inventory/node-fs.md mapping table |
| `packages/siegelense/src/adapters/git/branch-read/git-branch-read-adapter.ts` | gateway | @dungeonmaster/bin/git #currentBranch | reconciled with orchestrator's async copy — sync→async and null-vs-"HEAD" behaviour changes for every caller (followups.md) |
| `packages/siegelense/src/adapters/net/unix-request/net-unix-request-adapter.ts` | gateway | @dungeonmaster/node/net #unixSocketRequest | confirmed real export; contract parsing moves to the caller |
| `packages/siegelense/src/adapters/net/unix-serve/net-unix-serve-adapter.ts` | gateway | @dungeonmaster/node/net #unixSocketServe | confirmed real export; contract parsing moves to the caller |
| `packages/siegelense/src/adapters/npm/install/npm-install-adapter.ts` | gateway | @dungeonmaster/bin/npm #install | confirmed real export in bin/npm/index.ts |
| `packages/siegelense/src/adapters/npm/run-build/npm-run-build-adapter.ts` | gateway | @dungeonmaster/bin/npm #runBuild | confirmed real export in bin/npm/index.ts |
| `packages/siegelense/src/adapters/os/info/os-info-adapter.ts` | split | @dungeonmaster/node/os (cpus/freemem/loadavg/totalmem) | MB conversion stays a siegelense broker |
| `packages/siegelense/src/adapters/os/tmpdir/os-tmpdir-adapter.ts` | gateway | @dungeonmaster/node/os (tmpdir) | confirmed real pass-through export |
| `packages/siegelense/src/adapters/pixelmatch/compare/pixelmatch-compare-adapter.ts` | gateway | @dungeonmaster/npm/pixelmatch | confirmed real export=mod; deliberately no catch (its own header), kept verbatim |
| `packages/siegelense/src/adapters/playwright/session/dom-read-layer-adapter.ts` | stays | — | no outside call — pure source-string builder + our own contract translation (stays-as-adapter.md) |
| `packages/siegelense/src/adapters/playwright/session/init-script-add-layer-adapter.ts` | split | @dungeonmaster/npm/@playwright/test | real Page method call (addInitScript/waitForTimeout/setViewportSize) moves; the ContentText/AdapterResult translation is the our-logic half that stays (stays-as-adapter.md correction #2) |
| `packages/siegelense/src/adapters/playwright/session/key-press-layer-adapter.ts` | stays | — | no outside call — pure source-string builder + our own contract translation (stays-as-adapter.md) |
| `packages/siegelense/src/adapters/playwright/session/key-read-layer-adapter.ts` | stays | — | no outside call — pure source-string builder + our own contract translation (stays-as-adapter.md) |
| `packages/siegelense/src/adapters/playwright/session/listeners-layer-adapter.ts` | stays | — | imports nothing from @playwright/test by design, per its own header (stays-as-adapter.md) |
| `packages/siegelense/src/adapters/playwright/session/paste-layer-adapter.ts` | stays | — | the browser-global references run inside a remote page.evaluate() closure, not this process — excluded from the gateway, needs a lint carve-out (node-and-browser.md §6) |
| `packages/siegelense/src/adapters/playwright/session/playwright-session-adapter.ts` | split | @dungeonmaster/npm/@playwright/test | chromium.launch/browser.newContext/page.on/page.evaluate/page.waitForTimeout move; the BrowserSession facade, ref registry and settle detector are almost entirely our own logic and stay (npm.md splits table) |
| `packages/siegelense/src/adapters/playwright/session/ref-registry-layer-adapter.ts` | split | @dungeonmaster/npm/@playwright/test | chromium.launch/browser.newContext/page.on/page.evaluate/page.waitForTimeout move; the BrowserSession facade, ref registry and settle detector are almost entirely our own logic and stay (npm.md splits table) |
| `packages/siegelense/src/adapters/playwright/session/root-check-layer-adapter.ts` | stays | — | no outside call — pure source-string builder + our own contract translation (stays-as-adapter.md) |
| `packages/siegelense/src/adapters/playwright/session/settle-poll-layer-adapter.ts` | split | @dungeonmaster/npm/@playwright/test | chromium.launch/browser.newContext/page.on/page.evaluate/page.waitForTimeout move; the BrowserSession facade, ref registry and settle detector are almost entirely our own logic and stay (npm.md splits table) |
| `packages/siegelense/src/adapters/playwright/session/settle-wait-layer-adapter.ts` | split | @dungeonmaster/npm/@playwright/test | real Page method call (addInitScript/waitForTimeout/setViewportSize) moves; the ContentText/AdapterResult translation is the our-logic half that stays (stays-as-adapter.md correction #2) |
| `packages/siegelense/src/adapters/playwright/session/storage-read-layer-adapter.ts` | stays | — | same as paste-layer-adapter.ts — page.evaluate() closure runs in the remote browser (node-and-browser.md §6) |
| `packages/siegelense/src/adapters/playwright/session/viewport-set-layer-adapter.ts` | split | @dungeonmaster/npm/@playwright/test | real Page method call (addInitScript/waitForTimeout/setViewportSize) moves; the ContentText/AdapterResult translation is the our-logic half that stays (stays-as-adapter.md correction #2) |
| `packages/siegelense/src/adapters/pngjs/decode/pngjs-decode-adapter.ts` | gateway | @dungeonmaster/npm/pngjs #decodePng | confirmed real export; already-guarded try/catch+cause shape promoted as-is |
| `packages/siegelense/src/adapters/process/is-alive/process-is-alive-adapter.ts` | gateway | @dungeonmaster/node/process #kill | ESRCH classification (isNativeError) is our logic and stays a siegelense broker |
| `packages/siegelense/src/adapters/process/kill-group/process-kill-group-adapter.ts` | gateway | @dungeonmaster/node/process #kill | same note as process-is-alive-adapter.ts |
| `packages/testing/src/adapters/child-process/exec-sync/child-process-exec-sync-adapter.ts` | gateway | @dungeonmaster/node/child_process #runSync | confirmed real export; sync capture wrapper, same not-found/non-zero-exit/timeout handling as `run` |
| `packages/testing/src/adapters/child-process/mocker/child-process-mocker-adapter.ts` | stays | — | mocks child_process.spawn itself via jest.doMock — the one exception the brief's own carve-out covers (child-process-and-bin.md §7) |
| `packages/testing/src/adapters/crypto/random-bytes/crypto-random-bytes-adapter.ts` | gateway | @dungeonmaster/node/crypto (randomBytes) | pass-through, confirmed real |
| `packages/testing/src/adapters/error/is-native-error/error-is-native-error-adapter.ts` | gateway | @dungeonmaster/node/util/types #isNativeError | confirmed real export*, duplicate of siegelense's copy |
| `packages/testing/src/adapters/fs/append-file/fs-append-file-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #appendFile | fs family — see inventory/node-fs.md mapping table |
| `packages/testing/src/adapters/fs/exists-sync/fs-exists-sync-adapter.ts` | gateway | @dungeonmaster/node/fs #existsSync | fs family — see inventory/node-fs.md mapping table |
| `packages/testing/src/adapters/fs/exists/fs-exists-adapter.ts` | gateway | @dungeonmaster/node/fs #existsSync | fs family — see inventory/node-fs.md mapping table |
| `packages/testing/src/adapters/fs/mkdir/fs-mkdir-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #ensureDir | fs family — see inventory/node-fs.md mapping table |
| `packages/testing/src/adapters/fs/queue-metadata-read/fs-queue-metadata-read-adapter.ts` | gateway | @dungeonmaster/node/fs #readJsonFileSync | fs family — see inventory/node-fs.md mapping table |
| `packages/testing/src/adapters/fs/read-file/fs-read-file-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #readFile | fs family — see inventory/node-fs.md mapping table |
| `packages/testing/src/adapters/fs/readdir/fs-readdir-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #readdirIfExists | fs family — see inventory/node-fs.md mapping table |
| `packages/testing/src/adapters/fs/rm/fs-rm-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #rm | fs family — see inventory/node-fs.md mapping table |
| `packages/testing/src/adapters/fs/symlink/fs-symlink-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #symlink | fs family — see inventory/node-fs.md mapping table |
| `packages/testing/src/adapters/fs/unlink/fs-unlink-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #unlink | fs family — see inventory/node-fs.md mapping table |
| `packages/testing/src/adapters/fs/write-file/fs-write-file-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #writeFile | fs family — see inventory/node-fs.md mapping table |
| `packages/testing/src/adapters/jest/isolate-modules/jest-isolate-modules-adapter.ts` | stays | — | testing infra — wraps the jest test-global (jest.isolateModulesAsync/jest.doMock), not an npm import; mirrors the child-process-mocker carve-out |
| `packages/testing/src/adapters/jest/register-mock/jest-register-mock-adapter.ts` | stays | — | argument-addressed dispatch logic only; no direct jest call in this file |
| `packages/testing/src/adapters/jest/register-module-mock/jest-register-module-mock-adapter.ts` | stays | — | body is intentionally empty — the actual jest.mock() is hoisted by the AST transformer, not called here |
| `packages/testing/src/adapters/jest/register-spy-on/jest-register-spy-on-adapter.ts` | stays | — | testing infra — wraps the jest test-global (jest.spyOn), not an npm import; mirrors the child-process-mocker carve-out |
| `packages/testing/src/adapters/jest/require-actual/jest-require-actual-adapter.ts` | stays | — | testing infra — wraps the jest test-global (jest.requireActual), not an npm import; mirrors the child-process-mocker carve-out |
| `packages/testing/src/adapters/msw/http/msw-http-adapter.ts` | gateway | @dungeonmaster/npm/msw | confirmed real export* |
| `packages/testing/src/adapters/msw/server/msw-server-adapter.ts` | gateway | @dungeonmaster/npm/msw/node #setupServer | confirmed real export* |
| `packages/testing/src/adapters/path/dirname/path-dirname-adapter.ts` | split | @dungeonmaster/node/path #dirname | node part -> gateway path pass-through; FilePath contract parsing stays adapter |
| `packages/testing/src/adapters/path/join/path-join-adapter.ts` | split | @dungeonmaster/node/path #join | node part -> gateway path pass-through; FilePath contract parsing stays adapter |
| `packages/testing/src/adapters/path/resolve/path-resolve-adapter.ts` | split | @dungeonmaster/node/path #resolve | node part -> gateway path pass-through; FilePath contract parsing stays adapter |
| `packages/testing/src/adapters/playwright/page-events/playwright-page-events-adapter.ts` | split | @dungeonmaster/npm/@playwright/test | page.on(...) event wiring moves; the NetworkLogEntry contract mapping stays adapter |
| `packages/testing/src/adapters/playwright/test-info-attach/playwright-test-info-attach-adapter.ts` | split | @dungeonmaster/npm/@playwright/test | testInfo.attach(...) call moves; the AdapterResult shape stays adapter |
| `packages/testing/src/adapters/timers/watch/timers-watch-adapter.ts` | stays | — | testing infra — reassigns globalThis.setTimeout/setInterval/clearTimeout/clearInterval THEMSELVES to record arm calls; mirrors the child-process-mocker carve-out, not a caller of the timer |
| `packages/testing/src/adapters/typescript/ast-to-mock-calls/typescript-ast-to-mock-calls-adapter.ts` | split | @dungeonmaster/npm/typescript (ts.*) | the AST walk/factory + our own mock/proxy contracts stay adapter (npm.md typescript split) |
| `packages/testing/src/adapters/typescript/ast-to-module-mock-calls/typescript-ast-to-module-mock-calls-adapter.ts` | split | @dungeonmaster/npm/typescript (ts.*) | the AST walk/factory + our own mock/proxy contracts stay adapter (npm.md typescript split) |
| `packages/testing/src/adapters/typescript/ast-to-proxy-imports/typescript-ast-to-proxy-imports-adapter.ts` | split | @dungeonmaster/npm/typescript (ts.*) | the AST walk/factory + our own mock/proxy contracts stay adapter (npm.md typescript split) |
| `packages/testing/src/adapters/typescript/mock-calls-to-statements/typescript-mock-calls-to-statements-adapter.ts` | split | @dungeonmaster/npm/typescript (ts.*) | the AST walk/factory + our own mock/proxy contracts stay adapter (npm.md typescript split) |
| `packages/testing/src/adapters/typescript/source-file-getter/typescript-source-file-getter-adapter.ts` | split | @dungeonmaster/npm/typescript (ts.*) + node/fs #readFileSync | reads the file directly with fs.readFileSync as a fallback when no ts.Program is available |
| `packages/testing/src/adapters/typescript/source-file-with-prepended-statements/typescript-source-file-with-prepended-statements-adapter.ts` | split | @dungeonmaster/npm/typescript (ts.*) | the AST walk/factory + our own mock/proxy contracts stay adapter (npm.md typescript split) |
| `packages/tooling/src/adapters/fs/read-file/fs-read-file-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #readFile | fs family — see inventory/node-fs.md mapping table |
| `packages/tooling/src/adapters/glob/find/glob-find-adapter.ts` | gateway | @dungeonmaster/npm/glob #glob | hard-coded 4-pattern ignore list is exactly the silent-divergence problem the winning shape avoids (npm.md) |
| `packages/tooling/src/adapters/typescript/parse/typescript-parse-adapter.ts` | split | @dungeonmaster/npm/typescript (ts.*) | the AST walk + LiteralOccurrence/LiteralValue contract mapping stay adapter (npm.md splits table) |
| `packages/ward/src/adapters/crypto/hash-files/crypto-hash-files-adapter.ts` | split | @dungeonmaster/node/crypto (createHash) + node/fs #readFileSync | per-file ENOENT/EISDIR skip, everything else rethrown, stays as ward logic (node-fs.md §2 row 115) |
| `packages/ward/src/adapters/fs/glob-sync/fs-glob-sync-adapter.ts` | gateway | @dungeonmaster/node/fs #globSync | fs family — see inventory/node-fs.md mapping table |
| `packages/ward/src/adapters/fs/mkdir/fs-mkdir-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #ensureDir | fs family — see inventory/node-fs.md mapping table |
| `packages/ward/src/adapters/fs/read-file/fs-read-file-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #readFile | fs family — see inventory/node-fs.md mapping table |
| `packages/ward/src/adapters/fs/read-json-sync/fs-read-json-sync-adapter.ts` | gateway | @dungeonmaster/node/fs #readJsonFileSyncIfExists | fs family — see inventory/node-fs.md mapping table |
| `packages/ward/src/adapters/fs/readdir-dirs/fs-readdir-dirs-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #readdirEntries | fs family — see inventory/node-fs.md mapping table |
| `packages/ward/src/adapters/fs/readdir/fs-readdir-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #readdirIfExists | fs family — see inventory/node-fs.md mapping table |
| `packages/ward/src/adapters/fs/rename/fs-rename-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #rename | fs family — see inventory/node-fs.md mapping table |
| `packages/ward/src/adapters/fs/rm/fs-rm-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #rm | fs family — see inventory/node-fs.md mapping table |
| `packages/ward/src/adapters/fs/stat/fs-stat-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #statIfExists | fs family — see inventory/node-fs.md mapping table |
| `packages/ward/src/adapters/fs/unlink/fs-unlink-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #unlink | fs family — see inventory/node-fs.md mapping table |
| `packages/ward/src/adapters/fs/write-file/fs-write-file-adapter.ts` | gateway | @dungeonmaster/node/fs/promises #writeFile | fs family — see inventory/node-fs.md mapping table |
| `packages/ward/src/adapters/net/kill-port/net-kill-port-adapter.ts` | gateway | @dungeonmaster/bin/lsof #listeningPids + bin/kill #killPid | REAL GAP: same composing-function gap as orchestrator's process-kill-by-port-adapter (followups.md); signal/tolerance policy also needs reconciling (child-process-and-bin.md §4) |
| `packages/ward/src/adapters/net/port-in-use/net-port-in-use-adapter.ts` | gateway | @dungeonmaster/bin/lsof #listeningPids | REAL GAP: same composing-function gap; "portInUse" convenience export has no home yet |
| `packages/ward/src/adapters/os/tmpdir/os-tmpdir-adapter.ts` | gateway | @dungeonmaster/node/os (tmpdir) | confirmed real pass-through export |
| `packages/web/src/adapters/canvas/image-measure/canvas-image-measure-adapter.ts` | split | @dungeonmaster/browser/atob, /Blob, /createImageBitmap, /document | base64->bytes loop + downscale-target math stay a web transformer/broker |
| `packages/web/src/adapters/canvas/image-rescale/canvas-image-rescale-adapter.ts` | split | @dungeonmaster/browser/atob, /Blob, /createImageBitmap, /document | same as canvas-image-measure-adapter.ts |
| `packages/web/src/adapters/clipboard/write/clipboard-write-adapter.ts` | gateway | @dungeonmaster/browser/navigator | wrapper adds nothing over the raw navigator.clipboard.writeText call (node-and-browser.md §4) |
| `packages/web/src/adapters/dom/composer-delete-thumbnail/dom-composer-delete-thumbnail-adapter.ts` | split | @dungeonmaster/browser/document | MOVED OUT of stays-as-adapter.md: touches HTMLElement/DOM Range APIs, a browser global; segment-deletion logic stays adapter |
| `packages/web/src/adapters/dom/composer-insert-image/dom-composer-insert-image-adapter.ts` | split | @dungeonmaster/browser/document | MOVED OUT of stays-as-adapter.md: touches browser globals; ComposerAttachment contract + chatComposerStatics logic stays adapter |
| `packages/web/src/adapters/dom/composer-insert-text/dom-composer-insert-text-adapter.ts` | split | @dungeonmaster/browser/document | MOVED OUT of stays-as-adapter.md: touches browser globals; composerCaretFillerElementTransformer logic stays adapter |
| `packages/web/src/adapters/dom/composer-read/dom-composer-read-adapter.ts` | split | @dungeonmaster/browser/document | MOVED OUT of stays-as-adapter.md: touches HTMLElement/Text/Element browser globals; composerSegmentContract + chatComposerStatics logic stays adapter |
| `packages/web/src/adapters/dom/composer-write/dom-composer-write-adapter.ts` | split | @dungeonmaster/browser/document | segment-building logic stays a web broker (node-and-browser.md §4) |
| `packages/web/src/adapters/elk/layout/elk-layout-adapter.ts` | split | @dungeonmaster/npm/elkjs | node-sizing math + FlowNode/FlowEdge contract parsing + portal handling stay adapter (npm.md splits table) |
| `packages/web/src/adapters/fetch/delete/fetch-delete-adapter.ts` | gateway | @dungeonmaster/browser/fetch #fetchJson | throws on non-ok; matches fetchJson's general shape, though the {error} body message drift is not reconciled |
| `packages/web/src/adapters/fetch/get/fetch-get-adapter.ts` | gateway | @dungeonmaster/browser/fetch #fetchJson | confirmed real export; status-only error richness kept (node-and-browser.md §4) |
| `packages/web/src/adapters/fetch/patch/fetch-patch-adapter.ts` | gateway | @dungeonmaster/browser/fetch #fetchJson | throws on non-ok, matches fetchJson |
| `packages/web/src/adapters/fetch/post-with-status/fetch-post-with-status-adapter.ts` | gateway | @dungeonmaster/browser/fetch #fetchWithStatus | fills the gap: fetchWithStatus returns {status, ok, body}, body raw text, never throws on 4xx/5xx |
| `packages/web/src/adapters/fetch/post/fetch-post-adapter.ts` | gateway | @dungeonmaster/browser/fetch #fetchJson | throws on non-ok, matches fetchJson |
| `packages/web/src/adapters/file/read-data-url/file-read-data-url-adapter.ts` | split | @dungeonmaster/browser/FileReader | promise-wrapping logic stays a web broker |
| `packages/web/src/adapters/indexed-db/draft-images-read/indexed-db-draft-images-read-adapter.ts` | split | @dungeonmaster/browser/indexedDB #openStore, #getAll | confirmed real exports; per-record safeParse stays adapter |
| `packages/web/src/adapters/indexed-db/draft-images-read/migrate-legacy-records-layer-adapter.ts` | split | @dungeonmaster/browser/indexedDB | MOVED OUT of stays-as-adapter.md: touches IDBDatabase, a browser global directly; the migration + isComposerScopeMatchGuard logic stays adapter |
| `packages/web/src/adapters/indexed-db/draft-images-replace/indexed-db-draft-images-replace-adapter.ts` | split | @dungeonmaster/browser/indexedDB #put, #deleteRecord | confirmed real exports |
| `packages/web/src/adapters/mantine/notifications-show/mantine-notifications-show-adapter.ts` | gateway | @dungeonmaster/npm/@mantine/notifications | confirmed real export* |
| `packages/web/src/adapters/mantine/notifications/mantine-notifications-adapter.ts` | gateway | @dungeonmaster/npm/@mantine/notifications | flagged: scan said "no outside call" but line 10 imports Notifications directly (npm.md flagged section) |
| `packages/web/src/adapters/mantine/render/mantine-render-adapter.ts` | gateway | @dungeonmaster/npm/@testing-library/react #render | confirmed real export — the one overridden name, wrapped with MantineProvider |
| `packages/web/src/adapters/react-dom/mount/react-dom-mount-adapter.ts` | split | @dungeonmaster/npm/react-dom/client #createRoot + browser/document | confirmed real exports for both halves; the AdapterResult/Wrapper shape stays adapter |
| `packages/web/src/adapters/rxjs/filter/rxjs-filter-adapter.ts` | gateway | @dungeonmaster/npm/rxjs or npm/rxjs/operators | confirmed real export*; each file just re-exports one rxjs call |
| `packages/web/src/adapters/rxjs/merge/rxjs-merge-adapter.ts` | gateway | @dungeonmaster/npm/rxjs or npm/rxjs/operators | confirmed real export*; each file just re-exports one rxjs call |
| `packages/web/src/adapters/rxjs/of/rxjs-of-adapter.ts` | gateway | @dungeonmaster/npm/rxjs or npm/rxjs/operators | confirmed real export*; each file just re-exports one rxjs call |
| `packages/web/src/adapters/rxjs/subject/rxjs-subject-adapter.ts` | gateway | @dungeonmaster/npm/rxjs or npm/rxjs/operators | confirmed real export*; each file just re-exports one rxjs call |
| `packages/web/src/adapters/rxjs/take/rxjs-take-adapter.ts` | gateway | @dungeonmaster/npm/rxjs or npm/rxjs/operators | confirmed real export*; each file just re-exports one rxjs call |
| `packages/web/src/adapters/rxjs/timeout/rxjs-timeout-adapter.ts` | gateway | @dungeonmaster/npm/rxjs or npm/rxjs/operators | confirmed real export*; each file just re-exports one rxjs call |
| `packages/web/src/adapters/testing-library/act-async/testing-library-act-async-adapter.ts` | gateway | @dungeonmaster/npm/@testing-library/react #act | confirmed real export* (act is a pass-through, not the overridden render) |
| `packages/web/src/adapters/testing-library/act/testing-library-act-adapter.ts` | gateway | @dungeonmaster/npm/@testing-library/react #act | confirmed real export* |
| `packages/web/src/adapters/testing-library/render-hook/testing-library-render-hook-adapter.ts` | gateway | @dungeonmaster/npm/@testing-library/react #renderHook | confirmed real export*; stays a plain pass-through, no provider needed |
| `packages/web/src/adapters/testing-library/wait-for/testing-library-wait-for-adapter.ts` | gateway | @dungeonmaster/npm/@testing-library/react #waitFor | confirmed real export* (reached today only via @testing-library/react's own re-export of @testing-library/dom) |
| `packages/web/src/adapters/websocket/connect/websocket-connect-adapter.ts` | gateway | @dungeonmaster/browser/WebSocket #connect | confirmed real export; existing shape (JSON-parse + readyState guards) promoted as-is; onerror wiring is a sad-path hole to close (node-and-browser.md §5) |
| `packages/web/src/adapters/xhr/post-with-progress/xhr-post-with-progress-adapter.ts` | split | @dungeonmaster/browser/XMLHttpRequest | progress-event wiring + one-settled-promise logic stays a web broker |
| `packages/web/src/adapters/xyflow/edge/xyflow-edge-adapter.ts` | gateway | @dungeonmaster/npm/@xyflow/react | confirmed real export*; "stays whole, not split" per npm.md — no separable wrapper, only the import source changes |
| `packages/web/src/adapters/xyflow/node-handles/xyflow-node-handles-adapter.ts` | gateway | @dungeonmaster/npm/@xyflow/react | confirmed real export*; "stays whole, not split" per npm.md — no separable wrapper, only the import source changes |
| `packages/web/src/adapters/xyflow/react-flow/node-measure-layer-adapter.ts` | gateway | @dungeonmaster/npm/@xyflow/react | confirmed real export*; "stays whole, not split" per npm.md |
| `packages/web/src/adapters/xyflow/react-flow/xyflow-react-flow-adapter.ts` | gateway | @dungeonmaster/npm/@xyflow/react | confirmed real export*; "stays whole, not split" per npm.md |
