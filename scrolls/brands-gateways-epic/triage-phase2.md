# Phase 2 triage (2026-09-27, planner pass)

Read-only census against the actual tree. Confirms which A03-A19 rows are really untouched, finds several
callers of `@dungeonmaster/shared/adapters` that no landed A12 group or the handoff notes name, and gives
dispatch-ready groups. Method: `python3 os.walk` over every `packages/*/src/adapters/**`, then `discover`
grep per adapter export name for real (non-doc, non-comment) callers.

## Item status table

| ID | Real state | Evidence |
|---|---|---|
| A03 | **ready**, not started | `packages/ward/src/adapters/net/{kill-port,port-in-use}/` both still present; needs G21 (done) |
| A04 cli | **ready**, not started | 12 folders present, exact match to item's batches 1-4 |
| A05 config | **ready**, not started | 3 folders present, exact match |
| A06 eslint-plugin | **ready**, not started + 2 undocumented adapters | 16 folders present (item names 14); `eslint/typed-function-takes-no-args` and `eslint/typed-type-parameter-name` are new since the item was written — already gateway-compliant, need the same "move to transformers/" treatment as batch 4's `eslint-typed-parser-services-adapter.ts` |
| A07 hooks | **ready**, not started | 14 folders present, exact match to batches A-D |
| A08 hydration/-recipes | **ready**, not started (own adapters only) | hydration 3, hydration-recipes 9 folders present, exact match. Three MORE hydration-recipes files import `@dungeonmaster/shared/adapters` directly (not this item's adapters) — see A12 row |
| A09 mcp | **ready now** — deps actually met | A02 mcp done, A12's mcp sweep (M1-M3) done per handoff. 11 folders present, exact match to item's 4 batches |
| A10 orchestrator | **blocked on A03**; overlaps A12 | 35 own-adapter files present, exact match to item's census. The 15 `git/*` rows are THE SAME FILES A12's handoff names as remaining shared-adapter callers — one migration satisfies both, do not dispatch twice |
| A11 server | **ready now** — deps actually met + 1 undocumented adapter | A02/A12 server sweep done. 13 folders present + `zod/first-field-error-message` (not in item, no outside call at all — pure zod parsing, belongs in `transformers/`, not `adapters/`) |
| A12 shared | **active**, phase 2 mostly landed but handoff's own remaining-list is incomplete | See "A12 census" below — found 6 orchestrator files and 3 hydration-recipes files and 2 siegelense files the handoff did not name |
| A13 siegelense | **ready**, not started | 47 folders present, exact match. Conflicts on package with A12's siegelense cleanup group — sequence, don't run concurrently |
| A14 testing | **blocked on G22** (ready to dispatch, unstarted) + 3 undocumented adapters | 27+7 folders present, exact match, plus `mantine/render` (already gateway-compliant — G13 landed it here, no action needed beyond confirming), `msw/ws` (raw `msw`, needs the same swap as msw/http, msw/server), `typescript/ast-to-local-export-names` (still raw `typescript` + relative contract imports, needs the same "split" fate as its TS-1/TS-2 siblings) |
| A15 tooling | **ready now** | 3 folders present, exact match |
| A16 ward | **blocked on A03** | 18 folders present (net/kill-port, net/port-in-use excluded, A03's), exact match to item's 20-file census |
| A17 web | **ready**, not started, 1 fewer file than expected | 35 of item's 38 files present; `clipboard/write/clipboard-write-adapter.ts` is already gone (zero real or doc callers besides the item file itself) — already migrated or dead, not a blocker |
| A18 | **blocked**, needs A04-A17 | untouched, far off |
| A19 | **blocked**, needs A18 | untouched, far off |

## A12 (shared) census — what's really left

**Confirmed dead (zero real callers anywhere), safe to delete straight in phase 3, no caller migration needed:**
- `packages/shared/src/adapters/fast-xml-parser/parse/`
- `packages/shared/src/adapters/fetch/get/`
- `packages/shared/src/adapters/fs/access/`
- `packages/shared/src/adapters/fs/read-file-sync/`
- `packages/shared/src/adapters/net/free-port-pair/`
- `packages/shared/src/adapters/os/homedir/`
- `packages/shared/src/adapters/os/user-homedir/`
- `packages/shared/src/adapters/path/dirname/`
- `packages/shared/src/adapters/child-process/spawn-stream/`

(All hits for these outside their own definition/test files were doc scrolls or code COMMENTS — `ward-spawn-command-statics.ts`'s `childProcessSpawnStreamAdapter` mention and siegelense's `cleanup-run-broker.proxy.ts` mention are both prose, not imports.)

**Still live — real callers, by adapter:**

| Adapter | Real callers (full paths) |
|---|---|
| `child-process/spawn-capture` | `packages/orchestrator/src/adapters/git/{add-all,branch-delete,checkout,commit,current-branch,diff-files,head-sha,log-name-only,push,untracked-files,upstream-sha,verify-ref,worktree-add,worktree-prune,worktree-remove}/*.ts` (15 files — handoff's own list, matches A10's GIT-1..4 batches exactly) |
| `child-process/spawn-stream-lines` | `packages/orchestrator/src/brokers/step-handler/riftcarver/step-handler-riftcarver-broker.ts` (+`.proxy.ts`) — blocked on **F34** |
| `runtime/dynamic-import` | siegelense SL10 scope (below) |
| `path/join` | **orchestrator (NEW, not in handoff):** `brokers/quest/create/quest-create-broker.ts`, `brokers/quest/operations-update/quest-operations-update-broker.ts`, `brokers/quest/route-scope/quest-route-scope-broker.ts`(+`.proxy.ts`), `brokers/quest/run-step/quest-run-step-broker.proxy.ts`, `brokers/quest/work-plan-write/quest-work-plan-write-broker.ts`, `brokers/step-handler/riftcarver/step-handler-riftcarver-broker.proxy.ts`. **siegelense:** `brokers/profile/sample-record/profile-sample-record-broker.ts`, `test/harnesses/driver-fleet/driver-fleet.harness.ts` |
| `path/basename` | orchestrator `brokers/quest/mcp-create/quest-mcp-create-broker.ts` |
| `path/resolve` | hydration-recipes `brokers/guild/directory-ensure/guild-directory-ensure-broker.ts` |
| `fs/mkdir` | orchestrator `quest-create-broker.ts`; hydration-recipes `guild-directory-ensure-broker.ts`; siegelense `brokers/registry/lock-acquire/registry-lock-acquire-broker.ts`, `brokers/prune/run/prune-run-broker.integration.test.ts` |
| `fs/exists-sync` | hydration-recipes `brokers/guild/unique-path-resolve/guild-unique-path-resolve-broker.ts`, `brokers/session/unique-id-resolve/session-unique-id-resolve-broker.ts`; siegelense `brokers/registry/read/registry-read-broker.ts` |
| `process/cwd` | orchestrator `quest-mcp-create-broker.ts` |
| `fs/readdir-with-types` | type-only, 3 files (below) — the only remaining shared-internal use |

**Exact three type-only imports** (handoff said 3, confirmed exactly 3, all identical shape — `type Dirent = ReturnType<typeof fsReaddirWithTypesAdapter>[0]`):
- `packages/shared/src/brokers/architecture/orphan-detect/architecture-orphan-detect-broker.test.ts:5`
- `packages/shared/src/brokers/architecture/orphan-detect/list-walked-folder-files-layer-broker.test.ts:4`
- `packages/shared/src/brokers/architecture/orphan-detect/walk-reachable-files-layer-broker.test.ts:5`

**SL10's own named scope** (todo, dispatched once, stopped before any change — unverified against handoff, but every path below is confirmed present):
- `packages/siegelense/src/brokers/recipe/seed-run/recipe-seed-run-broker.ts` (+`.proxy.ts`)
- `packages/siegelense/src/brokers/recipes/read/recipes-read-broker.ts` (+`.proxy.ts`)
- `packages/siegelense/src/brokers/step/seed/step-seed-broker.ts` (+`.proxy.ts`)
- `packages/siegelense/src/adapters/process/is-alive/process-is-alive-adapter.test.ts` (imports `processCwdAdapterProxy` from `@dungeonmaster/shared/testing`)
- `packages/siegelense/src/brokers/prune/run/prune-run-broker.integration.test.ts`
- `packages/siegelense/test/harnesses/driver-fleet/driver-fleet.harness.ts`
- `packages/siegelense/test/harnesses/seed-home/seed-home.harness.ts`

**NOT in SL10's scope but same shared-adapter barrel (new finding):**
- `packages/siegelense/src/brokers/registry/lock-acquire/registry-lock-acquire-broker.ts` (+`.proxy.ts`) — `fsMkdirAdapter`
- `packages/siegelense/src/brokers/registry/read/registry-read-broker.ts` (+`.proxy.ts`) — `fsExistsSyncAdapter`

**Phase 3 (delete `packages/shared/src/adapters/`, `adapters.ts`, the "Adapter Proxies" block of `testing.ts`, `./adapters` export)** cannot run until every "still live" row above is migrated. Re-run this exact census once more before deleting — do not trust this file's numbers past the next round of commits.

## Dispatch groups (2-6 files each)

Numbered by recommended order. "Deps" names other groups that must land first. "Composing proxies" names
proxies in the SAME package that compose the migrated broker/adapter's proxy and must move together.

**G-A (mcp, A09, batch 1)** — `packages/mcp/src/adapters/fs/{mkdir,read-file-if-exists,read-file,readdir-if-exists}/*.ts`. Deps: none. Package: mcp only.

**G-B (mcp, A09, batches 2-4)** — `packages/mcp/src/adapters/fs/stat/*.ts`, `fs/write-file/*.ts`, `glob/find/*.ts`, `path/join/*.ts`, `path/resolve/*.ts`, `shared-package/resolve/{find-shared-package-root-layer-adapter,shared-package-resolve-adapter}.ts`. Deps: none. Package: mcp only (can run with G-A, same package — sequence, not concurrent, per rule 9).

**G-C (server, A11, batches 1-2)** — `packages/server/src/adapters/fs/{mkdir,read-file-bytes,read-file,realpath,rm,stat,write-file-base64,write-file-bytes}/*.ts`. Deps: none. Package: server only.

**G-D (server, A11, batches 3-4 + new)** — `packages/server/src/adapters/glob/find/*.ts`, `hono/{create-node-web-socket,serve}/*.ts`, `process/dev-log/*.ts` (wide caller list — read every call site first), `web-bundle/dist-path/*.ts`, and NEW: `packages/server/src/adapters/zod/first-field-error-message/*.ts` → move to `transformers/`, update 5 callers: `responders/quest/{chat,clarify,followup,new,user-add}/quest-*-responder.ts` (+ their `.proxy.ts`). Deps: none. Package: server only, sequence after G-C.

**G-E (cli, A04, batches 1-2)** — `packages/cli/src/adapters/fs/{append-file,mkdir,read-file,readdir,rename,stat,write-file}/*.ts`, `process/stdin-read/*.ts`. Deps: none. Package: cli only.

**G-F (cli, A04, batches 3-4)** — `packages/cli/src/adapters/readline/question/*.ts`, `child-process/exec/*.ts`, `typescript/content-diagnostics/*.ts` (trickiest file — virtual-file host), `typescript/tsconfig-compiler-options-locate/*.ts` (recommended: move whole function to `transformers/`). Deps: none. Package: cli only, sequence after G-E.

**G-G (config, A05, single batch)** — `packages/config/src/adapters/fs/read-file/*.ts`, `path/{dirname,join}/*.ts` (both plain pass-throughs, no proxy needed). Composing proxy: `packages/config/src/brokers/config/resolve/config-resolve-broker.proxy.ts`. Deps: none. Package: config only.

**G-H (tooling, A15, single batch)** — `packages/tooling/src/adapters/fs/read-file/*.ts`, `glob/find/*.ts` (check gateway's ignore-list default first), `typescript/parse/*.ts` (split, AST walk stays a broker). Deps: none. Package: tooling only.

**G-I (eslint-plugin, A06, batches 1-2)** — `packages/eslint-plugin/src/adapters/{eslint-plugin-eslint-comments/load,eslint-plugin-jest/load,eslint/rule-tester,typescript-eslint-eslint-plugin/load}/*.ts`, `fs/{ensure-read-file-sync,exists-sync,read-file-sync,write-file-sync}/*.ts`. Deps: none. Package: eslint-plugin only.

**G-J (eslint-plugin, A06, batches 3-5)** — `fs/readdir-sync/*.ts`, `minimatch/match/*.ts`, `path/{join,dirname}/*.ts`, `eslint/typed-parser-services/*.ts` (→ transformers/), `eslint/typed-rule-tester/*.ts` (→ test/harnesses/), plus NEW batch 5: `eslint/typed-function-takes-no-args/*.ts` and `eslint/typed-type-parameter-name/*.ts` (both → transformers/, already gateway-compliant; update callers `brokers/rule/ban-proxy-empty-called-with/rule-ban-proxy-empty-called-with-broker.ts` and `brokers/rule/gateway-return-unknown-not-caller-type/rule-gateway-return-unknown-not-caller-type-broker.ts`, and each `.proxy.ts`). Deps: none. Package: eslint-plugin only, sequence after G-I.

**G-K (hooks, A07, batches A-C)** — `packages/hooks/src/adapters/eslint/{eslint,calculate-config-for-file,is-path-ignored,output-fixes}/*.ts`, `fetch/{get-with-status,patch}/*.ts`, `fs/{ensure-write,exists-sync,read-file}/*.ts`, `module/require-fresh/*.ts`, `path/{join,resolve}/*.ts`. Deps: none. Package: hooks only.

**G-L (hooks, A07, batch D — touches shared)** — `packages/hooks/src/adapters/process/hook-lint-ignored-paths/*.ts`, `packages/hooks/src/adapters/dungeonmaster-eslint-plugin/get-pre-edit-rules/*.ts` → new transformer in `packages/shared/src/transformers/`. Deps: must not run while A12's shared groups (G-Q, G-R below) are in flight — same package. Sequence after A12's shared work settles.

**G-M (hydration, A08 own)** — `packages/hydration/src/adapters/fetch/post/*.ts`, `fs/ensure-write/*.ts`, `typescript/program-diagnostics/*.ts` (test-only). Deps: none. Package: hydration only.

**G-N (hydration-recipes, A08 own, batch A)** — `packages/hydration-recipes/src/adapters/fs/{append-file,rename,rm,write-file}/*.ts`. Deps: none. Package: hydration-recipes only.

**G-O (hydration-recipes, A08 own, batches B-C)** — `fs/write-text/*.ts`, `dm-jsonl/append/*.ts`, `fetch/json/*.ts`, `dm-http/{request,response-unwrap}/*.ts` (error-shape builder moves into `hydration`). Deps: none. Package: hydration-recipes, sequence after G-N.

**G-P (hydration-recipes, A12 extra — shared-adapter cleanup, NOT A08's scope)** — `packages/hydration-recipes/src/brokers/guild/directory-ensure/guild-directory-ensure-broker.ts`(+`.proxy.ts`), `brokers/guild/unique-path-resolve/guild-unique-path-resolve-broker.ts`(+`.proxy.ts`), `brokers/session/unique-id-resolve/session-unique-id-resolve-broker.ts`(+`.proxy.ts`). Deps: none, but same package as G-N/G-O — sequence, don't run concurrently.

**G-Q (shared, A12 — type-only fix)** — the 3 orphan-detect test files above, switch the type import to the gateway's `#gateway/node/fs`-equivalent `Dirent`/`readdirEntriesSync` return type. Deps: none. Package: shared — must run alone (no other agent editing shared).

**G-R (shared+ward, A03)** — new `packages/shared/src/brokers/port/kill-listeners/port-kill-listeners-broker.ts`(+`.proxy.ts`+test), delete `packages/ward/src/adapters/net/{kill-port,port-in-use}/*`, update ward's e2e-artifact teardown caller. Can combine with G-Q in one agent pass (same "shared, alone" constraint, disjoint files). Unblocks A10, A16.

**G-S (siegelense, A12 remaining — SL10 + extras)** — SL10's 7 files above + the 2 extra (`registry/lock-acquire`, `registry/read`). Deps: none. Package: siegelense — must land (or be explicitly held) before A13 starts, since both touch siegelense.

**G-T (orchestrator, A12 remaining + A10's git batches, merged)** — the 15 `git/*` files + their proxies (A10's GIT-1..4), migrated onto `#gateway/bin/git` directly (skip the adapter, skip shared's `childProcessSpawnCaptureAdapter`). Deps: none for the git files themselves; A10's OTHER batches (FS/MISC/TIMER/SPAWN) still wait on A03 (port-kill, unrelated file-wise but same item). Do this as ONE group, not two — do not dispatch A10's git batches separately from A12's git cleanup, they are the same 15 files.

**G-U (orchestrator, A12 extra — 6 files, NOT in handoff)** — `brokers/quest/create/quest-create-broker.ts`(+proxy), `brokers/quest/mcp-create/quest-mcp-create-broker.ts`(+proxy), `brokers/quest/operations-update/quest-operations-update-broker.ts`(+proxy), `brokers/quest/route-scope/quest-route-scope-broker.ts`(+proxy), `brokers/quest/run-step/quest-run-step-broker.proxy.ts` (rework off raw `jest.mock`/`requireActual` on the shared barrel — this one needs a real gateway-proxy composition, not just an import swap), `brokers/quest/work-plan-write/quest-work-plan-write-broker.ts`(+proxy). Deps: none, sequence after/with G-T (same package).

**G-V (orchestrator, riftcarver — blocked on F34)** — `brokers/step-handler/riftcarver/step-handler-riftcarver-broker.ts`(+`.proxy.ts`) off `childProcessSpawnStreamLinesAdapter`/`pathJoinAdapter`, and F35's raw-`spawn`-for-`cp` cleanup in the same proxy file. **Blocked**: `#gateway/node`'s `streamLinesProxy` cannot read back a call's `cwd`/`command` (F34). Gateway change needed first: add a `getOptionsFor`-style read-back to the node child_process stream-lines proxy, matching what F29 gave `run`. Do this group only after that gateway change lands and `@gateway/node` rebuilds.

**G-W (orchestrator, F30 cleanup)** — replace `as never` casts with real stubs in `brokers/quest/get-quest-work/quest-get-quest-work-broker.test.ts` (52 casts), `brokers/quest/get-blight-checklist/quest-get-blight-checklist-broker.test.ts` (37), `brokers/quest/get-quest-work/ward-rows-layer-broker.test.ts` (13). Split per file (3 agents of 1 file each, per the dispatch-size rule). Deps: none, sequence with other orchestrator groups (same package).

**G-X (testing, G22)** — the 7 files G22 owns (`child-process/mocker`, `jest/{isolate-modules,register-mock,register-module-mock,register-spy-on,require-actual}`, `timers/watch`) onto `#gateway/npm/jest__globals` and `#gateway/node`. Deps: none (G02, G03 done). Unblocks A14. Package: testing only.

**G-Y (testing, A14 + 3 new, after G22)** — A14's 27 files in its FS-1..4/MSW/PATH/PW/TS-1..2 batches, plus NEW: `packages/testing/src/adapters/msw/ws/*.ts` → gateway swap like msw/http, msw/server (caller: `responders/endpoint-mock/setup/endpoint-mock-setup-responder.ts`); `packages/testing/src/adapters/typescript/ast-to-local-export-names/*.ts` → split like its TS-1/TS-2 siblings (caller: `middleware/proxy-reexport-names-resolve/proxy-reexport-names-resolve-middleware.ts`); `mantine/render` needs no migration (already gateway-compliant via G13) — just confirm on the way past. Deps: G-X. Package: testing only.

**G-Z (web, A17, 7 sub-batches)** — canvas/DOM/file (8 files), fetch (5), indexedDB (3), misc singles (6 — `clipboard/write` already gone), rxjs (6), testing-library (4, delete outright), xyflow (4, → `widgets/`). Deps: none (G13 already done, so `mantine/render` deletion is unblocked too). Package: web only, split into the item's own sub-batches, run e2e after the xyflow batch.

**G-AA (siegelense, A13, ~10 sub-batches)** — 47 files, split fs (16, 4 batches of 4), misc singles (18, ~4 batches), playwright/session (13, one batch — all four files compose one facade). Deps: G-S must land first (same package). Package: siegelense only.

**G-BB (ward, A16, after A03/G-R)** — 18 files in FS-1..3/MISC/TS-SHAPE batches. Deps: G-R (A03). Package: ward only.

**G-CC (orchestrator, A10 remainder, after A03/G-R and after G-T/G-U/G-V/G-W settle)** — FS-1..3, MISC, TIMER, SPAWN batches (20 files not already covered by G-T/G-U/G-V). Package: orchestrator, sequence last among orchestrator groups.

**G-DD (F10 experiment)** — `packages/testing/ts-jest/published-options.js`: try `moduleResolution: node16` with `diagnostics` on, check it still works with the proxy-mock hoister; keep whichever passes. Package: testing, sequence after G-X/G-Y.

**A18, A19** — after every A04-A17 group above lands; A19 runs alone, repo-wide.

**Phase 3 shared deletion** — after G-P, G-Q, G-R, G-S, G-T, G-U, G-V all land and a fresh census confirms zero callers remain.

## Concurrency (disjoint packages, safe to run together, up to 5 at once)

Wave 1 (no deps, no package conflicts): **G-A/G-B (mcp), G-C/G-D (server), G-E/G-F (cli), G-G (config), G-H (tooling)** — 5 packages, dispatch now.

Wave 2 (no deps, no conflicts with wave 1 or each other): **G-I/G-J (eslint-plugin), G-K (hooks batches A-C), G-M (hydration), G-N/G-O (hydration-recipes own), G-X (testing/G22)** — 5 packages.

Wave 3: **G-Q+G-R (shared, one agent, alone in shared)**, **G-S (siegelense A12 cleanup)**, **G-T+G-U (orchestrator A12+A10-git, one agent, alone in orchestrator)**, **G-Z (web)** — note G-P (hydration-recipes) must wait for G-N/G-O to finish (same package), G-L (hooks batch D) waits for G-Q/G-R to clear shared.

Wave 4: **G-Y (testing, after G-X)**, **G-AA (siegelense A13, after G-S)**, **G-BB (ward, after G-R)**, **G-W (orchestrator F30, after G-T/G-U)**.

Wave 5: **G-V (orchestrator riftcarver, after the F34 gateway fix)**, **G-CC (orchestrator A10 remainder, after G-R)**, **G-DD (F10 experiment)**.

## Gateway gaps blocking work

- **F34 (open, confirmed)**: `@gateway/node`'s `streamLinesProxy` has no call-read-back for `cwd`/`command` — blocks G-V (riftcarver broker migration) and F35's cleanup of the same proxy file (`packages/orchestrator/src/brokers/step-handler/riftcarver/step-handler-riftcarver-broker.proxy.ts` still does `registerMock({ fn: spawn })` on raw `child_process.spawn` for `cp`, plus 2 `as never` casts on `.implement(...)`, confirmed present). Fix: add a `getOptionsFor`-style read-back to the node child_process stream-lines proxy, the same shape F29 added to `run`.
- **F38 (marked open in EPIC.md, but appears already fixed)**: checked all 4 gateway packages' `package.json` (`node`, `bin`, `browser`, `npm`) — every wildcard export entry already lists `types` BEFORE `import`/`require` (order is `<kind>-own-source, gateway-dist, source, types, import, require` in all 12 entries checked). If `npm run build:clean` still prints the esbuild warning, the fix needed is moving `types` to be the absolute FIRST key (ahead of the custom conditions too), not just ahead of `import`/`require`. Needs a real build to confirm either way — not run here (read-only).
- **F10 (todo, unstarted)**: `packages/testing/ts-jest/published-options.js` still sets `diagnostics: false` — confirmed present, line 30. Own experiment group (G-DD).
