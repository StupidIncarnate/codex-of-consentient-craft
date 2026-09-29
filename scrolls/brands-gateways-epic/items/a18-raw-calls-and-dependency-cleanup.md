# A18: Raw outside calls that never had an adapter; drop duplicate package deps

| | |
|---|---|
| Phase | Phase 2 — delete every adapter |
| Source | `scrolls/gateway/followup-sustainability.md` "Also" steps 3 and 4 (lines 350-356); `scrolls/adapters-to-one-place.md` "The one job adapters should do happens at the callers" |
| Needs | [A04](a04-adapters-cli.md)–[A17](a17-adapters-web.md) |
| Unblocks | [A19](a19-adapters-folder-type-gone-caller-rules-on.md) |
| Packages touched | every workspace package |
| Checks to run | lint, typecheck, unit |
| Split | operator splits per package, 2 to 4 files per agent |
| Runs alone | no — each agent takes one package, and two agents never take the same package at once |

## Why

Deleting every adapter (A00-A17) only removes the outside calls that went through one. Code outside `adapters/`
also calls outside packages, Node globals and programs directly — it always did, since "only `adapters/` may
import a package" was cheapest to satisfy by writing ANOTHER adapter, not by routing every call through one. The
three caller-facing lint rules (`raw-import-ban`, `platform-globals-ban`, `bin-program-spawn-ban`) find these, but
[A19](a19-adapters-folder-type-gone-caller-rules-on.md) does not turn them on for real until every package is
clean — this item is what makes them clean.

## Current state

Two known cases, both confirmed 2026-09-26 by reading the files directly:

- **`packages/ward/src/brokers/bundle/build/bundle-build-broker.ts`** spawns `npm` by hand. Confirmed:
  `bundleStatics.buildCommand` (`packages/ward/src/statics/bundle/bundle-statics.ts:26`) is the literal string
  `'npm'`, and the broker calls `childProcessSpawnCaptureAdapter({ command: bundleStatics.buildCommand, args:
  [...bundleStatics.buildArgs, String(tempDir)], cwd: packageRoot })`. This is a real `npm run build --outDir
  <path>` invocation that should go through `#gateway/bin/npm`'s `runScript` instead of a raw `child_process` spawn
  with the command name `'npm'` as a plain string.
- **`packages/web/src/widgets/chat-input/chat-input-widget.tsx`** calls `localStorage.setItem`/`removeItem` in
  three places (`markDraftDispatched`, `clearDraftDispatchedStamp`, `writeTextDraft`). **The source doc's own claim
  here is FALSE and this item corrects it:** it says these calls have "no `try/catch`", but every one of them is
  already wrapped — confirmed by reading the file, lines 146-182: each call sits inside a `try { … } catch {
  // localStorage unavailable }` block. The real problem is different from what the doc claims: **the `catch`
  block is silent** — it swallows a full storage-quota failure with only a comment, which is exactly the shape
  `ban-silent-catch` exists to refuse. The fix GW proposes is still right for a different reason than the one it
  gives: move these calls onto `#gateway/browser/localStorage`'s `writeItem`, which returns the failure as a value
  instead of throwing, so the caller can react to it (or deliberately ignore it) without an empty `catch` block.

Beyond these two, this item is a fresh scan per package — the two above are a STARTING point, not the whole list.

## Work

1. For each workspace package, turn on `raw-import-ban`, `platform-globals-ban` and `bin-program-spawn-ban`
   LOCALLY (uncommitted, not merged) and lint that one package — read
   `packages/eslint-plugin/src/brokers/config/dungeonmaster/config-dungeonmaster-broker.ts` for where the three
   rules are commented out today, and comment them back IN for this scan only. Do not commit this toggle; it is a
   discovery tool for this item, and [A19](a19-adapters-folder-type-gone-caller-rules-on.md) is what turns them on
   for real once every package is clean.
2. For every violation the scan finds: move the raw call onto the matching `#gateway/<kind>/<subpath>` export, the
   same way every adapter migration in A04-A17 did. This is not adapter work — there is no adapter file to delete,
   only a raw import or a raw global use to replace.
3. Fix `bundle-build-broker.ts`: replace the raw `npm` spawn with `#gateway/bin/npm`'s `runScript`, passing the
   same script name and args `bundleStatics` already computes.
4. Fix `chat-input-widget.tsx`: replace the three raw `localStorage` calls with `#gateway/browser/localStorage`'s
   `writeItem`/`removeItem` (or whatever the gateway names them), checking the returned result instead of
   swallowing an exception. Read the gateway's real function names and signatures before writing the caller.
5. Revert the local rule-toggle from step 1 once your package's scan is clean (do not leave the rules on for other
   packages to trip over before their own turn).
6. Once a package imports an outside package ONLY through the gateway (no adapter left, no raw import left), delete
   that package's own `package.json` entry for it — the version now lives in the gateway package alone.
7. Update every affected caller's `.proxy.ts` to compose the gateway wrapper's own `.proxy` file directly, imported
   per file, never through a barrel, per T1/T3.
8. Prove your tests bite: after each file's tests pass, break the new code on purpose and confirm a test goes red;
   report which mutation each test caught.

## Done when

- A repo-wide scan with `raw-import-ban`, `platform-globals-ban` and `bin-program-spawn-ban` turned on finds zero
  violations, in every package.
- `bundle-build-broker.ts` calls `#gateway/bin/npm`'s `runScript`, not a raw `child_process` spawn naming `'npm'`.
- `chat-input-widget.tsx`'s three `localStorage` calls go through `#gateway/browser/localStorage`, with no silent
  `catch`.
- Every package's `package.json` `dependencies`/`devDependencies` lists only the gateway packages and the outside
  packages it still needs directly (a `peerDependencies` case, or a package the gateway itself does not cover) —
  no duplicate entry for something now reached only through `#gateway/npm/*`, `#gateway/node/*`,
  `#gateway/browser/*` or `#gateway/bin/*`.
- `npm run ward -- --only lint,typecheck,unit -- <every file touched, package by package>` exits 0.

## Traps

- **Do not turn the three rules on globally and leave them on** — that is
  [A19](a19-adapters-folder-type-gone-caller-rules-on.md)'s job, done once, after every package (including this
  item's own work) is clean. Turning them on here and leaving them on breaks every OTHER in-flight A0x agent's lint
  run.
- Before touching `platform-globals-ban`'s siegelense carve-out (a global referenced inside a `page.evaluate`
  string, which runs in the driven browser, not this process): that carve-out does not exist yet — it is
  [A19](a19-adapters-folder-type-gone-caller-rules-on.md)'s job to build. If your local toggle in siegelense flags
  a `page.evaluate` string's own global references, that is an expected false positive for now — do not "fix" the
  string, and do not build the carve-out yourself; report it and move on.
- `ban-silent-catch` may ALSO flag `chat-input-widget.tsx`'s existing empty `catch` blocks once it runs over
  `widgets/` — if it already does, this item's fix removes both problems (the raw global AND the silent swallow)
  in one pass; if it does not yet apply there, note that as a finding rather than assuming this item's fix alone
  satisfies every rule that could apply.

## Plan

Written 2026-09-28 by a read-only planning agent, against the `gateway-pivot` working tree while A13 (siegelense) and
A14 (testing) still had their last adapter chunks running. **Re-run the census before dispatching each package** —
other items land in these packages too, and the lists below are only as fresh as that tree.

### How the census was taken

Not a regex. `platform-globals-ban` resolves every identifier through the TypeScript type checker, so the only honest
census is the rule itself. A throwaway Node script (scratchpad, never committed, config file untouched) ran ESLint's
Node API with `overrideConfigFile: true`, the repo's typed parser (`project: true`, `tsconfigRootDir` = repo root),
the same global ignores as `eslint.config.js`, and ONLY these three rules on, over `packages/<pkg>` one package at a
time:

```js
rules: {
  '@dungeonmaster/raw-import-ban': 'error',
  '@dungeonmaster/platform-globals-ban': 'error',
  '@dungeonmaster/bin-program-spawn-ban': 'error',
}
```

This is Work step 1's discovery toggle without editing `config-dungeonmaster-broker.ts`, so no other agent's lint
can trip over it. An implementing agent re-runs the same scan scoped to its own files (or does step 1's local toggle)
to prove its batch clean. On top of the rule output, a Python walk found the spawns `bin-program-spawn-ban` cannot
see (rule finding 1).

All three rules apply to every linted file — production, proxy, stub, test, harness, e2e spec, `bin/`, root barrels,
`vite.config.ts` — because the test config spreads `dungeonmasterCustomRules` too. Only `packages/@gateway/**` is
exempt.

### Rule findings that shape the plan

1. **`bin-program-spawn-ban` is blind to the way callers now spawn.** It only tracks imports from
   `` `${scope}/node/child_process` `` (`@dungeonmaster/node/child_process`) and raw `child_process`; every caller
   imports `#gateway/node/child_process`, so `run({ command: 'git' })` passes. It also resolves a program name only
   from a literal or a same-file const, so `bundleStatics.buildCommand` (another file) is invisible. The scan
   therefore did NOT flag `bundle-build-broker.ts`. Batch **R1** makes the rule also accept the
   `#gateway/node/child_process` source (and should be in before the final repo-wide scan, or "zero violations" is a
   false zero). The hidden spawns a Python walk found are already folded into the package batches below — ward-B01, ward-B09 to ward-B12, ward-B17,
   orchestrator-B52, testing-B02 and web-B109 — each marked with its `#gateway/bin/*` replacement.
   After R1 lands, re-run the census; anything new it finds is added to the plan by the operator.
2. **Aliased imports from a raw module are double-reported.** `import { resolve as resolvePath } from 'path'`
   raises `raw-import-ban` on the statement AND `platform-globals-ban` on `resolve` (the imported name resolves to
   `@types/node`). The second report clears once the specifier moves to a gateway subpath that declares its own
   named export (`#gateway/node/path` does). `#gateway/node/fs` is `export * from 'fs'`, so `promises as fsPromises`
   from it may stay flagged — take those functions from `#gateway/node/fs__promises` instead. If an aliased gateway
   import still reports after the move, that is a rule bug for A19, not something to route around.
3. **Playwright page callbacks are flagged in `web`, not only in siegelense.** Every DOM global inside a
   `page.evaluate` / `locator.evaluate` / `waitForFunction` callback in a web e2e spec or harness is reported (the
   rule resolves `web` to the browser platform, but those callbacks run in the driven page). This is the same false
   positive the item's Traps name for siegelense; A19 builds the carve-out. The files whose ONLY hits are these are
   listed under "Expected false positives" and get no batch. Files with both kinds are in a batch with the note
   "leave the page-callback globals alone".
4. **`module` in `require.main === module` is flagged** (`packages/cli/bin/cli-entry.ts`). It is a CommonJS
   module-scope value exactly like `__dirname`, which the rule already exempts by name. See **C1**.
5. **`zod` is most of the volume.** `#gateway/npm/zod` is `export * from 'zod'` plus `default`, so
   `import { z } from 'zod'` → `import { z } from '#gateway/npm/zod'` is a pure specifier change. Every file whose
   only violation is that import is in its package's `-Z` list, separate from the hand batches.
6. **`ban-silent-catch` on `chat-input-widget.tsx`** was not checked by this census (it is not one of the three
   rules). The web batch that owns that file removes every empty `catch` it touches while moving to
   `#gateway/browser/localStorage`; its agent runs the full lint on the file and reports whether `ban-silent-catch`
   fired before or after.

### Gateway gaps — new wrappers or concessions

Each needs its wrapper (or a recorded concession) BEFORE the package batches tagged "waits on <id>" run. A new
gateway subpath follows the existing shape — `packages/@gateway/<kind>/src/<Subpath>/<Subpath>.ts` barrel, a
`.test.ts`, a `.stub.ts` (`gateway-colocation` has `requireStub: true`), a `.proxy.ts` per wrapped function — and the
kind's own `gateway-<kind>-exports-shape.integration.test.ts` / `gateway-<kind>-(builtin-)globals.integration.test.ts`
must be checked for a subpath list. One agent per gateway package at a time.

**R1 — rule fix (eslint-plugin), before the final scan.**
- `packages/eslint-plugin/src/brokers/rule/bin-program-spawn-ban/rule-bin-program-spawn-ban-broker.ts` — accept
  `${gatewayLocationsStatics.importPrefix}/node/child_process` alongside `${scope}/node/child_process`.
- `packages/eslint-plugin/src/brokers/rule/bin-program-spawn-ban/rule-bin-program-spawn-ban-broker.test.ts` — an
  invalid case importing `run` from `#gateway/node/child_process` with `command: 'git'`.

**C1 — `module` exemption (eslint-plugin; operator may fold into A19's platform-globals-ban work).**
- `packages/eslint-plugin/src/brokers/rule/platform-globals-ban/rule-platform-globals-ban-broker.ts` — add `module`
  to `EXEMPT_NAMES`.
- `packages/eslint-plugin/src/brokers/rule/platform-globals-ban/rule-platform-globals-ban-broker.integration.test.ts`
  — a valid `require.main === module` case.
- Waiting on it:
  - `packages/cli/bin/cli-entry.ts`

**GN1 — process env beyond a single read (`@gateway/node`, chain: one barrel).** `getEnv(name)` only reads one key.
Callers also pass the whole env to a child (`env: { ...process.env, … }`), and tests set and delete keys. Proposed:
`packages/@gateway/node/src/process/env-snapshot/env-snapshot.ts` (+ `.test.ts`, `.proxy.ts`),
`packages/@gateway/node/src/process/set-env/set-env.ts` (+ `.test.ts`, `.proxy.ts`),
`packages/@gateway/node/src/process/delete-env/delete-env.ts` (+ `.test.ts`, `.proxy.ts`), and the barrel
`packages/@gateway/node/src/process/process.ts` + `packages/@gateway/node/src/process/process.test.ts`.
- Waiting on it:
  - `packages/cli/test/harnesses/cli-bin/cli-bin.harness.ts`
  - `packages/cli/test/harnesses/cli-statusline/cli-statusline.harness.ts`
  - `packages/cli/test/harnesses/npm-command-fake/npm-command-fake.harness.ts`
  - `packages/cli/test/harnesses/scaffolded-playwright-config-run/scaffolded-playwright-config-run.harness.ts`
  - `packages/eslint-plugin/src/tmp-environment.integration.test.ts`
  - `packages/hooks/test/harnesses/hook-runner/hook-persistent-runner.harness.ts`
  - `packages/hooks/test/harnesses/hook-runner/hook-runner.harness.ts`
  - `packages/hydration-recipes/src/brokers/recipes-seed/run/recipes-seed-run-broker.integration.test.ts`
  - `packages/hydration-recipes/src/brokers/recipes-seed/run/recipes-seed-run-broker.ts`
  - `packages/hydration-recipes/test/harnesses/file-target/file-target.harness.ts`
  - `packages/hydration-recipes/test/harnesses/live-quest-target/live-quest-target.harness.ts`
  - `packages/mcp/test/harnesses/mcp-server/mcp-server.harness.ts`
  - `packages/orchestrator/src/brokers/agent/spawn-stream-json/agent-spawn-stream-json-broker.ts`
  - `packages/orchestrator/src/flows/orchestration-dispatch/orchestration-dispatch-flow.integration.test.ts`
  - `packages/orchestrator/test/harnesses/git-worktree-fixture/git-worktree-fixture.harness.ts`
  - `packages/orchestrator/test/harnesses/orchestration-environment/orchestration-environment.harness.ts`
  - `packages/orchestrator/test/harnesses/orchestration-quest/orchestration-quest.harness.ts`
  - `packages/orchestrator/test/harnesses/quest-outbox/quest-outbox.harness.ts`
  - `packages/orchestrator/test/harnesses/rate-limits-watcher/rate-limits-watcher.harness.ts`
  - `packages/server/src/brokers/pasted-image/persist/pasted-image-persist-broker.proxy.ts`
  - `packages/server/src/brokers/process/dev-log/process-dev-log-broker.proxy.ts`
  - `packages/server/src/flows/quest/quest-flow.integration.test.ts`
  - `packages/server/src/flows/tooling/tooling-flow.integration.test.ts`
  - `packages/server/test/harnesses/server-app/server-app.harness.ts`
  - `packages/shared/src/brokers/dungeonmaster-home/find/dungeonmaster-home-find-broker.proxy.ts`
  - `packages/shared/src/brokers/locations/claude-config-dir-find/locations-claude-config-dir-find-broker.proxy.ts`
  - `packages/shared/src/brokers/port/resolve/port-resolve-broker.proxy.ts`
  - `packages/siegelense/src/brokers/instance/start/instance-start-broker.ts`
  - `packages/siegelense/src/brokers/lane/boot/lane-boot-broker.proxy.ts`
  - `packages/siegelense/src/brokers/lane/boot/lane-boot-broker.ts`
  - `packages/siegelense/src/brokers/profile/sample-record/profile-sample-record-broker.integration.test.ts`
  - `packages/siegelense/src/brokers/prune/run/prune-run-broker.integration.test.ts`
  - `packages/siegelense/src/flows/driver/driver-flow.integration.test.ts`
  - `packages/siegelense/src/flows/install/install-flow.integration.test.ts`
  - `packages/siegelense/src/flows/siegelense/siegelense-capacity-layer-flow.integration.test.ts`
  - `packages/siegelense/src/flows/siegelense/siegelense-flow.integration.test.ts`
  - `packages/siegelense/src/flows/siegelense/siegelense-prune-layer-flow.integration.test.ts`
  - `packages/siegelense/src/flows/siegelense/siegelense-run-layer-flow.integration.test.ts`
  - `packages/siegelense/src/flows/siegelense/siegelense-snapshots-layer-flow.integration.test.ts`
  - `packages/siegelense/src/flows/siegelense/siegelense-status-layer-flow.integration.test.ts`
  - `packages/siegelense/src/startup/start-install.integration.test.ts`
  - `packages/siegelense/src/startup/start-siegelense-driver.integration.test.ts`
  - `packages/siegelense/src/startup/start-siegelense.integration.test.ts`
  - `packages/siegelense/test/harnesses/driver-fleet/driver-fleet.harness.ts`
  - `packages/siegelense/test/harnesses/evidence-tree/evidence-tree.harness.ts`
  - `packages/siegelense/test/harnesses/npm-command-fake/npm-command-fake.harness.ts`
  - `packages/ward/test/harnesses/bin-resolve/bin-resolve.harness.ts`
  - `packages/web/playwright.config.ts`
  - `packages/web/test/harnesses/environment/environment.harness.ts`

**GN2 — other process members (`@gateway/node`, chain: same barrel as GN1, so run after it or merge).** `chdir`,
`nextTick`, `removeAllListeners`, `emit`, and `on` for a non-signal event (`on` is typed `NodeJS.Signals` today).
Proposed: `packages/@gateway/node/src/process/chdir/chdir.ts`, `.../next-tick/next-tick.ts`,
`.../remove-all-listeners/remove-all-listeners.ts`, `.../emit/emit.ts` (each + `.test.ts`, `.proxy.ts`), and a
widened `packages/@gateway/node/src/process/on/on.ts` (+ its test).
- Waiting on it:
  - `packages/mcp/src/index.proxy.ts`
  - `packages/orchestrator/src/flows/worktree/worktree-flow.integration.test.ts`
  - `packages/orchestrator/test/harnesses/orchestration-environment/orchestration-environment.harness.ts`
  - `packages/server/src/responders/server/init/server-init-responder.proxy.ts`
  - `packages/session-forensics/src/flows/session-forensics/session-forensics-flow.integration.test.ts`
  - `packages/siegelense/src/brokers/profile/sample-record/profile-sample-record-broker.integration.test.ts`
  - `packages/siegelense/src/flows/driver/driver-flow.integration.test.ts`
  - `packages/siegelense/src/flows/siegelense/siegelense-capacity-layer-flow.integration.test.ts`
  - `packages/siegelense/src/responders/siegelense/driver/driver-serve-layer-responder.ts`
  - `packages/testing/src/middleware/child-process-mock/child-process-mock-middleware.ts`
  - `packages/ward/src/startup/start-ward.integration.test.ts`

**GN2a — probably no new wrapper; the batch agent checks first.** `process.stdin.on('data'|'end')` in the hooks
startup files and cli create-package is what `readStdinToEnd` already does; a proxy that spies on the whole
`process` object (`registerSpyOn({ object: process, method: 'exit' })`, `Object.defineProperty(process,
'platform', …)`) composes the matching `#gateway/node/process/<fn>/<fn>.proxy` instead. Only if a file cannot be
expressed that way does it join GN2.
  - `packages/cli/src/brokers/create-package/resolve-request/create-package-resolve-request-broker.ts`
  - `packages/cli/src/responders/cli/create-package/cli-create-package-responder.ts`
  - `packages/cli/src/responders/cli/serve/cli-serve-responder.proxy.ts`
  - `packages/cli/test/harnesses/cli-statusline/cli-statusline.harness.ts`
  - `packages/hooks/src/startup/start-agy-pre-tool-hook.ts`
  - `packages/hooks/src/startup/start-agy-stop-hook.ts`
  - `packages/hooks/src/startup/start-post-ask-question-hook.ts`
  - `packages/hooks/src/startup/start-post-edit-hook.ts`
  - `packages/hooks/src/startup/start-pre-bash-hook.ts`
  - `packages/hooks/src/startup/start-pre-edit-hook.ts`
  - `packages/hooks/src/startup/start-pre-folder-detail-hook.ts`
  - `packages/hooks/src/startup/start-pre-mcp-caller-hook.ts`
  - `packages/hooks/src/startup/start-pre-search-hook.ts`
  - `packages/hooks/src/startup/start-session-snippet-hook.ts`
  - `packages/hooks/src/startup/start-subagent-stop-hook.ts`
  - `packages/hooks/src/startup/start-worktree-create-hook.ts`
  - `packages/hooks/test/harnesses/hook-runner/hook-persistent-worker.ts`
  - `packages/mcp/src/index.proxy.ts`
  - `packages/orchestrator/src/brokers/process/is-alive/process-is-alive-broker.proxy.ts`
  - `packages/session-forensics/src/startup/start-session-forensics.integration.test.ts`
  - `packages/siegelense/src/responders/siegelense/driver/driver-serve-layer-responder.proxy.ts`
  - `packages/ward/src/brokers/command/run/command-run-broker.proxy.ts`

**GN3 — `setImmediate`, `clearImmediate`, `queueMicrotask` (`@gateway/node`).** Mostly tests flushing the event loop
(`await new Promise((resolve) => setImmediate(resolve))`). Proposed: `packages/@gateway/node/src/setImmediate/setImmediate.ts`,
`packages/@gateway/node/src/clearImmediate/clearImmediate.ts`, `packages/@gateway/node/src/queueMicrotask/queueMicrotask.ts`
(each `export const { X } = globalThis;` + `.test.ts` + a `.stub.ts`, mirroring `setTimeout/`), plus
`packages/@gateway/node/src/gateway-node-builtin-globals.integration.test.ts` if it lists the globals.
- Waiting on it:
  - `packages/orchestrator/src/brokers/agent/launch/agent-launch-broker.test.ts`
  - `packages/orchestrator/src/brokers/agent/launch/start-main-tail-layer-broker.test.ts`
  - `packages/orchestrator/src/brokers/agent/spawn-stream-json/agent-spawn-stream-json-broker.proxy.ts`
  - `packages/orchestrator/src/brokers/agent/spawn-stream-json/agent-spawn-stream-json-broker.test.ts`
  - `packages/orchestrator/src/brokers/agent/spawn-unified/agent-spawn-unified-broker.proxy.ts`
  - `packages/orchestrator/src/brokers/agent/spawn-unified/agent-spawn-unified-broker.test.ts`
  - `packages/orchestrator/src/brokers/chat/main-session-tail/chat-main-session-tail-broker.test.ts`
  - `packages/orchestrator/src/brokers/chat/spawn/chat-spawn-broker.test.ts`
  - `packages/orchestrator/src/brokers/chat/stream-process-handle/chat-stream-process-handle-broker.test.ts`
  - `packages/orchestrator/src/brokers/chat/subagent-tail/chat-subagent-tail-broker.test.ts`
  - `packages/orchestrator/src/brokers/quest/monitor-jsonl-watcher/quest-monitor-jsonl-watcher-broker.test.ts`
  - `packages/orchestrator/src/brokers/quest/monitor-jsonl-watcher/scan-subagents-dir-layer-broker.test.ts`
  - `packages/orchestrator/src/brokers/quest/monitor-jsonl-watcher/start-subagent-tail-layer-broker.test.ts`
  - `packages/orchestrator/src/brokers/quest/monitor-watcher-start/quest-monitor-watcher-start-broker.test.ts`
  - `packages/orchestrator/src/brokers/quest/node-dispatch-runner/quest-node-dispatch-runner-broker.test.ts`
  - `packages/orchestrator/src/brokers/quest/outbox-watch/quest-outbox-watch-broker.test.ts`
  - `packages/orchestrator/src/brokers/rate-limits/watch/rate-limits-watch-broker.test.ts`
  - `packages/orchestrator/src/brokers/smoketest/scenario-driver/create-driver-handler-layer-broker.test.ts`
  - `packages/orchestrator/src/brokers/smoketest/scenario-driver/create-driver-poll-tick-layer-broker.test.ts`
  - `packages/orchestrator/src/brokers/smoketest/scenario-driver/smoketest-scenario-driver-broker.test.ts`
  - `packages/orchestrator/src/responders/chat/start/chat-start-responder.test.ts`
  - `packages/orchestrator/src/responders/execution-queue/sync-listener-bootstrap/execution-queue-sync-listener-bootstrap-responder.test.ts`
  - `packages/orchestrator/src/responders/followup-chat/start/followup-chat-start-responder.test.ts`
  - `packages/orchestrator/src/responders/quest/monitor-watcher-start/quest-monitor-watcher-start-responder.test.ts`
  - `packages/orchestrator/src/responders/rate-limits/bootstrap/evaluate-hold-layer-responder.test.ts`
  - `packages/orchestrator/src/responders/rate-limits/bootstrap/rate-limits-bootstrap-responder.test.ts`
  - `packages/orchestrator/src/responders/smoketest/bootstrap-listener/smoketest-bootstrap-listener-responder.test.ts`
  - `packages/siegelense/src/responders/siegelense/driver/driver-serve-layer-responder.test.ts`
  - `packages/testing/src/brokers/timers/watch/timers-watch-broker.test.ts`
  - `packages/testing/src/brokers/timers/watch/timers-watch-broker.ts`

**GN4 — `AbortController`, `Request`, `Response`, raw `fetch` on the node side (`@gateway/node`).** Node has
`AbortController` only under `@gateway/browser`; `fetch` exports only `fetchJson`/`fetchOk`/`fetchWithStatus`.
Proposed: `packages/@gateway/node/src/AbortController/AbortController.ts`, `packages/@gateway/node/src/Request/Request.ts`,
`packages/@gateway/node/src/Response/Response.ts` (globalThis pass-throughs, each + test + stub). For raw `fetch`,
the batch agent first tries `fetchWithStatus`; exporting `fetch` itself is the fallback.
- Waiting on it:
  - `packages/orchestrator/src/brokers/quest/orchestration-loop/quest-orchestration-loop-broker.test.ts`
  - `packages/orchestrator/src/brokers/smoketest/scenario-driver/create-driver-handler-layer-broker.test.ts`
  - `packages/orchestrator/src/brokers/smoketest/scenario-driver/create-driver-poll-tick-layer-broker.test.ts`
  - `packages/orchestrator/src/brokers/smoketest/scenario-driver/smoketest-scenario-driver-broker.ts`
  - `packages/orchestrator/src/brokers/smoketest/scenario-driver/smoketest-sweep-pending-work-items-layer-broker.test.ts`
  - `packages/orchestrator/src/responders/orchestration/resume/orchestration-resume-responder.ts`
  - `packages/orchestrator/src/responders/orchestration/startup-recovery/recover-guild-layer-responder.ts`
  - `packages/orchestrator/src/responders/quest/modify/quest-modify-responder.ts`
  - `packages/server/src/responders/server/init/server-init-responder.proxy.ts`
  - `packages/testing/src/brokers/network-record/capture/network-record-capture-broker.proxy.ts`
  - `packages/testing/src/brokers/network-record/capture/network-record-capture-broker.test.ts`
  - `packages/testing/src/flows/endpoint-mock/endpoint-mock-flow.integration.test.ts`
  - `packages/testing/src/responders/endpoint-mock/listen/endpoint-mock-listen-responder.test.ts`
  - `packages/testing/src/state/msw-server/msw-server-state.test.ts`
  - `packages/testing/src/transformers/msw-response-to-network-entry/msw-response-to-network-entry-transformer.test.ts`

**GN5 — node modules with no subpath: `stream`, `http`, `zlib` (`vm` only in siegelense adapter tests, which the
A13 chunk deletes).** Proposed pass-throughs shaped like `events/` (`import mod = require('<x>'); export = mod;`):
`packages/@gateway/node/src/stream/stream.ts`, `packages/@gateway/node/src/http/http.ts`,
`packages/@gateway/node/src/zlib/zlib.ts` (each + test + stub). Every user is a test harness or proxy.
- Waiting on it:
  - `packages/cli/test/harnesses/cli-statusline/cli-statusline.harness.ts`
  - `packages/hydration-recipes/test/harnesses/instance-stub/instance-stub.harness.ts`
  - `packages/hydration-recipes/test/harnesses/lane-api/lane-api.harness.ts`
  - `packages/hydration/test/harnesses/api-target/api-target.harness.ts`
  - `packages/orchestrator/src/brokers/agent/spawn-unified/agent-spawn-unified-broker.proxy.ts`
  - `packages/web/test/harnesses/transcript-images/transcript-images.harness.ts`

**GB1 — browser timers (`@gateway/browser`).** `@gateway/browser` has no `setTimeout`/`clearTimeout`/`setInterval`/
`clearInterval`. Proposed: those four subpaths under `packages/@gateway/browser/src/`, mirroring `@gateway/node`'s
(each + test + stub). The alternative, `window.setTimeout` through `#gateway/browser/window`, passes the rule today
but is an evasion of it, so it needs a concession if chosen.
- Waiting on it:
  - `packages/web/src/bindings/use-elapsed-tick/use-elapsed-tick-binding.ts`
  - `packages/web/src/bindings/use-quest-chat/use-quest-chat-binding.test.ts`
  - `packages/web/src/bindings/use-quest-projection/use-quest-projection-binding.test.ts`
  - `packages/web/src/bindings/use-quest-summary/use-quest-summary-binding.test.ts`
  - `packages/web/src/state/web-socket-channel/web-socket-channel-state.ts`
  - `packages/web/src/widgets/chat-input/chat-input-widget.test.tsx`
  - `packages/web/src/widgets/chat-panel/chat-panel-widget.tsx`
  - `packages/web/src/widgets/dumpster-raccoon/dumpster-raccoon-widget.tsx`
  - `packages/web/src/widgets/image-overlay/image-overlay-widget.test.tsx`
  - `packages/web/src/widgets/streaming-indicator/streaming-indicator-widget.tsx`

**GB2 — DOM classes and helpers (`@gateway/browser`).** `Text`, `Node`, `Element`, `HTMLElement`, `HTMLImageElement`,
`File`, `Event`, `InputEvent`, `URLSearchParams`, `btoa` — some in production composer brokers and widgets. Proposed:
one globalThis pass-through subpath per name under `packages/@gateway/browser/src/` (each + test + stub). Same
`window.X` alternative and the same concession caveat as GB1.
- Waiting on it:
  - `packages/web/src/bindings/use-elapsed-tick/use-elapsed-tick-binding.test.ts`
  - `packages/web/src/brokers/composer/delete-thumbnail/composer-delete-thumbnail-broker.ts`
  - `packages/web/src/brokers/composer/insert-image/composer-insert-image-broker.ts`
  - `packages/web/src/brokers/composer/insert-text/composer-insert-text-broker.ts`
  - `packages/web/src/brokers/composer/write/composer-write-broker.ts`
  - `packages/web/src/brokers/file/read-data-url/file-read-data-url-broker.test.ts`
  - `packages/web/src/transformers/composer-read/composer-read-transformer.ts`
  - `packages/web/src/widgets/chat-input/chat-input-widget.proxy.tsx`
  - `packages/web/src/widgets/chat-input/chat-input-widget.test.tsx`
  - `packages/web/src/widgets/chat-input/chat-input-widget.tsx`
  - `packages/web/src/widgets/quest-chat/quest-chat-content-layer-widget.test.tsx`
  - `packages/web/src/widgets/quest-chat/quest-chat-content-layer-widget.tsx`
  - `packages/web/src/widgets/subagent-chain/subagent-chain-widget.proxy.tsx`

**GB3 — test-side browser seams (`@gateway/browser`).** `localStorage.clear()` (no wrapper), the `WebSocket` class
(`WebSocket.OPEN`, the gateway exports only `connect`), and proxies that spy on raw `localStorage`/`console`
objects. Proposed: `packages/@gateway/browser/src/localStorage/clear/clear.ts` (+ `.test.ts`, `.proxy.ts`) and the
`localStorage.ts` barrel; for `WebSocket` the batch agent first tries the `connect` proxy, else a `WebSocket` class
pass-through.
- Waiting on it:
  - `packages/web/src/state/comment-queue/comment-queue-state.proxy.ts`
  - `packages/web/src/widgets/app/app-widget.integration.test.tsx`
  - `packages/web/src/widgets/chat-input/chat-input-widget.proxy.tsx`
  - `packages/web/src/widgets/home-content/home-content-widget.proxy.tsx`

**C2 — `tsx` in test harnesses (concession or wrapper).** A harness resolves `tsx/cli` with `require.resolve` or
imports `tsx` to run TypeScript in a child. No `@gateway/npm/tsx` exists. Either add
`packages/@gateway/npm/src/tsx/tsx.ts` (a resolver for the CLI path) or record a concession.
  - `packages/cli/test/harnesses/scaffolded-playwright-config-run/scaffolded-playwright-config-run.harness.ts`
  - `packages/hooks/test/harnesses/hook-runner/hook-runner.harness.ts`

**C3 — `packages/web/vite.config.ts` imports `vite` and `@vitejs/plugin-react`.** Vite loads its own config;
`#gateway/npm/vitejs__plugin-react` exists, `vite` has no subpath. Either add `packages/@gateway/npm/src/vite/vite.ts`
(pass-through) and prove `vite`/`vite build` still load the config through the `#gateway` import map, or record a
concession for this one config file.

**C4 — CSS side-effect imports in `packages/web/src/main.ts`** (`@mantine/core/styles.css`,
`@mantine/notifications/styles.css`, `@xyflow/react/dist/style.css`). A gateway subpath for a stylesheet is not a
shape the gateway has. Recommend a concession (or an `exports` entry per stylesheet in `@gateway/npm`'s
`package.json`, proven under `vite build`). While these stay raw, `web` keeps `@mantine/core`,
`@mantine/notifications` and `@xyflow/react` in its own `dependencies`.

### Wave 0 — GB1 to GB3

Named files, all under `packages/@gateway/browser/src/` unless stated. Timers and `requestAnimationFrame` read
the global at CALL time (a function body in a `<kebab>/` subfolder, the barrel only re-exports), so web's fake
timers and `registerSpyOn` on `globalThis` still control them. DOM classes and `btoa` are load-time
pass-throughs like `Blob`/`atob`. `WebSocket` needs no class pass-through: `connectProxy` gains
`getConnectionCount`, which is what `app-widget.integration.test.tsx` needs.

- GB1 timers: `setTimeout/{setTimeout.ts,setTimeout.test.ts,timeout-handle.stub.ts,timeout-handle.stub.test.ts,set-timeout/set-timeout.ts,set-timeout/set-timeout.test.ts,set-timeout/set-timeout.proxy.ts}`;
  same shape for `clearTimeout/` (`cleared-timeout-handle.stub.ts`, `clear-timeout/`), `setInterval/`
  (`interval-handle.stub.ts`, `set-interval/`), `clearInterval/` (`cleared-interval-handle.stub.ts`,
  `clear-interval/`); `requestAnimationFrame/` (`requestAnimationFrame.ts` becomes a barrel,
  `requestAnimationFrame.test.ts`, `animation-frame-timestamp.stub.ts` import path, new
  `request-animation-frame/{request-animation-frame.ts,.test.ts,.proxy.ts}`)
- GB2 DOM classes: one folder each of `Text`, `Node`, `Element`, `HTMLElement`, `HTMLImageElement`, `File`,
  `Event`, `InputEvent`, `URLSearchParams`, each with `<Name>.ts`, `<Name>.test.ts`, `<kebab>.stub.ts`,
  `<kebab>.stub.test.ts`; `btoa/{btoa.ts,btoa.test.ts,encoded-base64.stub.ts,encoded-base64.stub.test.ts}`
- GB3: `localStorage/clear/{clear.ts,clear.test.ts,clear.proxy.ts}`, `localStorage/localStorage.ts` and
  `localStorage/localStorage.test.ts` (barrel gains `clear`); `WebSocket/connect/connect.proxy.ts` and
  `WebSocket/connect/connect.test.ts` (`getConnectionCount`)
- `gateway-browser-globals.integration.test.ts` (maintained list gains every new folder name)

### Expected false positives — no batch (A19's page-callback carve-out)

Every hit in these files is a DOM global inside a Playwright page callback. Do not edit them for A18.

- `packages/web/src/flows/home/execution-queue-streaming.e2e.ts`
- `packages/web/src/flows/home/guild-creation.e2e.ts`
- `packages/web/src/flows/home/rate-limits-live-update.e2e.ts`
- `packages/web/src/flows/quest-chat/carved-quest-session-cwds.e2e.ts`
- `packages/web/src/flows/quest-chat/composer-paste-draft-reload.e2e.ts`
- `packages/web/src/flows/quest-chat/role-transition-streams-live.e2e.ts`
- `packages/web/src/flows/quest-chat/screenshot-path-renders-in-transcript.e2e.ts`
- `packages/web/src/flows/quest-chat/send-images-chat-route.e2e.ts`
- `packages/web/src/flows/quest-chat/spec-panel-user-request-image.e2e.ts`
- `packages/web/src/flows/quest-chat/subagent-duration-placement.e2e.ts`
- `packages/web/src/flows/quest-chat/warpgate-merge-button-visibility.e2e.ts`
- `packages/web/src/flows/session-view/transcript-broken-image.e2e.ts`
- `packages/web/src/flows/session-view/transcript-image-overlay.e2e.ts`
- `packages/web/src/flows/session-view/transcript-inline-layout.e2e.ts`
- `packages/web/src/flows/session-view/transcript-placeholder-without-bytes.e2e.ts`
- `packages/web/src/flows/session-view/transcript-renders-images.e2e.ts`
- `packages/web/test/harnesses/chat-control/chat-control.harness.ts`
- `packages/web/test/harnesses/comment-box/comment-box.harness.ts`
- `packages/web/test/harnesses/comment-queue-lifecycle/comment-queue-lifecycle.harness.ts`
- `packages/web/test/harnesses/comment-queue-send/comment-queue-send.harness.ts`
- `packages/web/test/harnesses/composer-paste/composer-paste.harness.ts`
- `packages/web/test/harnesses/composer-send/composer-send.harness.ts`
- `packages/web/test/harnesses/execution-row-status/execution-row-status.harness.ts`
- `packages/web/test/harnesses/flow-diagram/flow-diagram.harness.ts`
- `packages/web/test/harnesses/followup/followup.harness.ts`
- `packages/web/test/harnesses/navigation/navigation.harness.ts`
- `packages/web/test/harnesses/sticky-header/sticky-header.harness.ts`
- `packages/web/test/harnesses/subagent-duration-placement/subagent-duration-placement.harness.ts`
- `packages/web/test/harnesses/subagent-launch-order/subagent-launch-order.harness.ts`
- `packages/web/test/harnesses/transcript-images/transcript-images.harness.ts`
- `packages/web/test/harnesses/transcript-inline-layout/transcript-inline-layout.harness.ts`

`packages/siegelense/src/brokers/browser-session/launch/browser-session-launch-broker.ts` also has page-callback hits
(`window`, `navigator`, `Blob`, `ClipboardItem`) beside real ones; it is in a siegelense batch with that note.

### Wave 0 — GN1 to GN5

Named files, all under `packages/@gateway/node/src/`. Written before editing; the total passes the ~60-file line, so
the agent does GN1 to GN4 (about 64 files, in order) and stops at a green point. GN5 is listed and left.

Shape decisions: every timer, process and fetch wrapper is a call-time function in its own wrapper folder (it reads
`process` / `globalThis` when called, never at module load); class globals (`AbortController`, `Request`, `Response`)
are `export const { X } = globalThis` barrels, like `atob`; a same-named type alias next to the value fails `no-redeclare`, so callers name the type through the global. `getEnv`'s positional style
is kept for `setEnv(name, value)` / `deleteEnv(name)`. `envSnapshot()` returns a copy of `process.env`.

**GN1 — process env** (new folders under `process/`, each `<name>.ts`, `<name>.proxy.ts`, `<name>.test.ts`):
- `process/env-snapshot/env-snapshot.ts`, `.proxy.ts` (swaps `process.env` for a staged object, with `restore`), `.test.ts`
- `process/set-env/set-env.ts`, `.proxy.ts`, `.test.ts`
- `process/delete-env/delete-env.ts`, `.proxy.ts`, `.test.ts`

**GN2 — other process members** (same folder shape):
- `process/chdir/chdir.ts`, `.proxy.ts` (`restore` puts the starting directory back), `.test.ts`
- `process/next-tick/next-tick.ts`, `.proxy.ts`, `.test.ts`
- `process/remove-all-listeners/remove-all-listeners.ts`, `.proxy.ts` (reads back `listenerCount`), `.test.ts`
- `process/emit/emit.ts`, `.proxy.ts`, `.test.ts`
- `process/on/on.ts`, `process/on/on.test.ts` (widened to any event name; `on.proxy.ts` is unchanged)
- `process/process.ts`, `process/process.test.ts` (barrel gains the seven new exports)
- GN2a: `readStdinToEnd` and the existing process proxies cover the stdin callers; no new wrapper.

**GN3 — immediates and microtasks** (global folder, barrel + barrel test, one wrapper folder, one stub + stub test):
- `setImmediate/setImmediate.ts`, `setImmediate.test.ts`, `set-immediate/set-immediate.ts`, `.proxy.ts`, `.test.ts`, `immediate-handle.stub.ts`, `immediate-handle.stub.test.ts`
- `clearImmediate/clearImmediate.ts`, `clearImmediate.test.ts`, `clear-immediate/clear-immediate.ts`, `.proxy.ts`, `.test.ts`, `immediate-handle.stub.ts`, `immediate-handle.stub.test.ts`
- `queueMicrotask/queueMicrotask.ts`, `queueMicrotask.test.ts`, `queue-microtask/queue-microtask.ts`, `.proxy.ts`, `.test.ts`, `queued-task.stub.ts`, `queued-task.stub.test.ts`

**GN4 — AbortController, Request, Response, raw fetch:**
- `AbortController/AbortController.ts`, `AbortController.test.ts`, `abort-controller.stub.ts`, `abort-controller.stub.test.ts`
- `Request/Request.ts`, `Request.test.ts`, `request.stub.ts`, `request.stub.test.ts`
- `Response/Response.ts`, `Response.test.ts`, `response.stub.ts`, `response.stub.test.ts`
- `fetch/fetch.ts`, `fetch/fetch.test.ts` (export `fetch`), `fetch/fetch/fetch.ts`, `.proxy.ts`, `.test.ts` (raw fetch, addressed by URL, read back)
- `gateway-node-builtin-globals.integration.test.ts` (adds `AbortController`, `Request`, `Response` to the maintained global list)

**GN5 — stream, http, zlib (listed, left for a later pass):**
- `stream/stream.ts`, `stream.test.ts`, `readable.stub.ts`, `readable.stub.test.ts`
- `http/http.ts`, `http.test.ts`, `http-server.stub.ts`, `http-server.stub.test.ts`
- `zlib/zlib.ts`, `zlib.test.ts`, `gzip-buffer.stub.ts`, `gzip-buffer.stub.test.ts`

### Wave 0 — R1 and C1

Named files (all under `packages/eslint-plugin/src/`). The rules are commented out in
`config-dungeonmaster-broker.ts`, so no committed file's lint changes when these edits land.

- `brokers/rule/bin-program-spawn-ban/rule-bin-program-spawn-ban-broker.ts` and `.test.ts` — R1: accept `#gateway/node/child_process`; a raw name imported from the gateway is the raw positional shape.
- `brokers/rule/bin-program-spawn-ban/report-bin-program-spawn-layer-broker.ts`, `resolve-spawned-program-layer-broker.ts`, `resolve-static-string-layer-broker.ts` (+ `.proxy.ts` for the last) — R1: thread the linted `filename` down to the resolver.
- `brokers/rule/bin-program-spawn-ban/resolve-static-string-layer-broker.test.ts` — R1: imported-statics cases.
- new `brokers/rule/bin-program-spawn-ban/resolve-imported-statics-layer-broker.ts`, `.proxy.ts`, `.test.ts` — R1: reads the relative-import statics file.
- new `transformers/statics-string-property/statics-string-property-transformer.ts` and `.test.ts` — R1: scans a statics file's text for one top-level string property.
- `brokers/rule/platform-globals-ban/rule-platform-globals-ban-broker.ts` and `.integration.test.ts` — C1: `module` joins `EXEMPT_NAMES`.

The bin-wrapped program list stays in `statics/bin-program-home/bin-program-home-statics.ts` (one copy, pinned by its
own test); R1 adds no second list.

### Order and what runs side by side

- **Wave 0** (in parallel, three agents, three packages): R1 + C1 (`eslint-plugin`); GN1 → GN2 → GN3 → GN4 → GN5
  (`@gateway/node`, one agent, in that order — GN1 and GN2 share the process barrel); GB1 → GB2 → GB3
  (`@gateway/browser`, one agent). Concession decisions C2–C4 are the operator's, any time before the batches that
  wait on them.
- **Wave 1+**: the package lists. A18's own rule holds — one agent per package at a time — so packages run side by
  side and a package's batches run one after another. The `-Z` sweep and every batch not tagged "waits on" can start
  in wave 1; a tagged batch starts once its gap is merged.
- Batches inside one package touch disjoint files, so the operator MAY run several at once in one package (EPIC rule
  9, named disjoint lists) — the one hazard is a shared proxy, which the unit grouping below already keeps together.
- `siegelense` and `testing`: nothing before the last A13/A14 chunk is committed; then re-run their census.
- Last: re-run the three-rule scan over every package (after R1), then the dependency removals, then A19.

**Concession to ask for — the size of the sweep batches.** EPIC rule 8 says 2 to 4 files per migration agent. The
`-Z` lists are one mechanical specifier change per file; splitting them into fours makes hundreds of agents for a
one-token edit. Recommend: one agent per package runs its whole `-Z` list (a scripted substitution, then that
package's lint/typecheck/unit on the touched files). If the operator declines, split each `-Z` list in order into
fours. The same argument covers the hand batches whose only entries are an import move with unchanged names (for
example `document` → `import { document } from '#gateway/browser/document'`); the operator may merge those.

### Replacement legend

- Raw imports: `zod` → `#gateway/npm/zod`; `fs`/`node:fs` → `#gateway/node/fs`; `fs/promises` →
  `#gateway/node/fs__promises`; `path`/`node:path` → `#gateway/node/path`; `os`/`node:os` → `#gateway/node/os`;
  `child_process`/`node:child_process` → `#gateway/node/child_process` (a `git`/`npm`/`claude`/`lsof`/`kill`/`cp`
  spawn goes to that program's `#gateway/bin/<program>` wrapper instead); `crypto` → `#gateway/node/crypto`;
  `readline` → `#gateway/node/readline`; `url` → `#gateway/node/url`; `net` → `#gateway/node/net`; `process` →
  `#gateway/node/process`; `util/types` → `#gateway/node/util__types`; `hono` → `#gateway/npm/hono`;
  `hono/utils/http-status` → `#gateway/npm/hono__utils__http-status`; `eslint-plugin-jest` →
  `#gateway/npm/eslint-plugin-jest`; `pngjs` → `#gateway/npm/pngjs`; `@testing-library/react` →
  `#gateway/npm/testing-library__react`; `@testing-library/user-event` → `#gateway/npm/testing-library__user-event`;
  `@mantine/core` → `#gateway/npm/mantine__core`; `react` → `#gateway/npm/react`; `react-router-dom` →
  `#gateway/npm/react-router-dom`; `@playwright/test` → `#gateway/npm/playwright__test`; `@tabler/icons-react` →
  `#gateway/npm/tabler__icons-react`; `@vitejs/plugin-react` → `#gateway/npm/vitejs__plugin-react`.
- Node-side globals (every package except browser-side `web` files): `process.stdout`/`stderr`/`cwd`/`exit`/`pid`/
  `argv`/`execPath`/`platform`/`kill` → the same-named export of `#gateway/node/process`; `process.env.X` →
  `getEnv('X')`; reading `process.exitCode` → `getExitCode()`, assigning it → `setExitCode(n)`;
  `process.on('SIG…')` → `on`; `Buffer` → `#gateway/node/buffer`; `crypto.randomUUID()` → `randomUUID` from
  `#gateway/node/crypto`; `setTimeout`/`clearTimeout`/`setInterval`/`clearInterval`/`console`/`atob` →
  `#gateway/node/<name>`; `URL` → `#gateway/node/url`.
- Browser-side `web` files (everything under `packages/web/src` except `*.e2e.ts`; `packages/web/test/harnesses/**`
  and `*.e2e.ts` are node-side): `document`, `window`, `location`, `navigator`, `console`, `crypto`, `Blob`,
  `ResizeObserver`, `URL`, `atob` → `#gateway/browser/<name>`; `localStorage.getItem`/`setItem`/`removeItem` →
  `readItem`/`writeItem`/`removeItem` from `#gateway/browser/localStorage` (they return a result instead of
  throwing — check it); `Buffer` in a jsdom test → `#gateway/node/buffer`.
- A proxy that spied on the raw global or module now composes the gateway wrapper's own `.proxy` file, imported per
  file (`#gateway/<kind>/<subpath>/<fn>/<fn>.proxy`), never through a barrel — Work step 7.

### Files per package

A package absent here has no violation. `-Z` is the zod sweep; `-Bnn` are hand batches (2 to 4 files, or one
chain where a unit's implementation, proxy and tests must move together). Each line names what the file imports raw
(`imports`), which banned globals it uses (`uses`), and which gap it waits on (`needs`).

#### `cli`

**cli-Z (zod sweep).** Each file's only violation is `import … from 'zod'`; change the specifier to `'#gateway/npm/zod'` and nothing else.

- `packages/cli/src/contracts/build-timestamp/build-timestamp-contract.ts`
- `packages/cli/src/contracts/create-package-args/create-package-args-contract.ts`
- `packages/cli/src/contracts/create-package-request/create-package-request-contract.ts`
- `packages/cli/src/contracts/dependency-map/dependency-map-contract.ts`
- `packages/cli/src/contracts/install-module/install-module-contract.ts`
- `packages/cli/src/contracts/package-json-raw/package-json-raw-contract.ts`
- `packages/cli/src/contracts/package-json/package-json-contract.ts`
- `packages/cli/src/contracts/package-seed/package-seed-contract.ts`
- `packages/cli/src/contracts/scaffold-file/scaffold-file-contract.ts`
- `packages/cli/src/contracts/siegelense-module/siegelense-module-contract.ts`
- `packages/cli/src/contracts/start-server-module/start-server-module-contract.ts`
- `packages/cli/src/contracts/statusline-input/statusline-input-contract.ts`
- `packages/cli/src/contracts/tsconfig-compiler-options-locate-result/tsconfig-compiler-options-locate-result-contract.ts`
- `packages/cli/src/contracts/tsconfig-compiler-options/tsconfig-compiler-options-contract.ts`
- `packages/cli/src/contracts/uuid/uuid-contract.ts`

**cli-B01** — waits on C1

- `packages/cli/bin/cli-entry.ts` — imports `path` · uses `process.argv`, `process.stderr`, `process.exit` · **needs** C1 `module` (CommonJS module-scope value, like `__dirname`)
- `packages/cli/src/brokers/create-package/resolve-request/create-package-resolve-request-broker.ts` — uses `process.stdout` · **needs** GN2a process.stdin

**cli-B02**

- `packages/cli/src/responders/cli/create-package/cli-create-package-responder.proxy.ts` — uses `process.stdout`
- `packages/cli/src/responders/cli/create-package/cli-create-package-responder.ts` — uses `process.stdout` · **needs** GN2a process.stdin
- `packages/cli/src/responders/cli/init/cli-init-responder.proxy.ts` — uses `process.stdout`
- `packages/cli/src/responders/cli/init/cli-init-responder.ts` — uses `process.stdout`

**cli-B03**

- `packages/cli/src/responders/cli/serve/cli-serve-responder.proxy.ts` — uses `process.stdout` · **needs** GN2a process.<object>
- `packages/cli/src/responders/cli/serve/cli-serve-responder.ts` — uses `process.stdout`, `process.platform`
- `packages/cli/src/responders/cli/statusline-tap/cli-statusline-tap-responder.test.ts` — uses `process.stdout`, `process.stderr`
- `packages/cli/src/responders/cli/statusline-tap/cli-statusline-tap-responder.ts` — uses `process.stdout`, `process.stderr`

**cli-B04** — waits on C2, GN1, GN5

- `packages/cli/test/harnesses/cli-bin/cli-bin.harness.ts` — imports `node:child_process`, `node:fs`, `node:os`, `node:path` · uses `setTimeout`, `clearTimeout` · **needs** GN1 process env snapshot (whole `process.env`)
- `packages/cli/test/harnesses/cli-statusline/cli-statusline.harness.ts` — imports `fs`, `path` · uses `process.env.X`, `Buffer`, `process.stdout`, `process.stderr` · **needs** GN5 node `stream`; GN1 process env write/delete (`setEnv`/`deleteEnv`); GN1 process env snapshot (whole `process.env`); GN2a process.<object>
- `packages/cli/test/harnesses/npm-command-fake/npm-command-fake.harness.ts` — imports `path` · uses `process.env.X` · **needs** GN1 process env write/delete (`setEnv`/`deleteEnv`)
- `packages/cli/test/harnesses/scaffolded-playwright-config-run/scaffolded-playwright-config-run.harness.ts` — imports `node:child_process`, `node:fs`, `node:path` · uses `process.execPath`, `setTimeout`, `clearTimeout` · **needs** C2 npm `tsx` (`require.resolve`); GN1 process env snapshot (whole `process.env`)

#### `config`

**config-Z (zod sweep).** Each file's only violation is `import … from 'zod'`; change the specifier to `'#gateway/npm/zod'` and nothing else.

- `packages/config/src/contracts/dev-server-e2e-process/dev-server-e2e-process-contract.ts`
- `packages/config/src/contracts/dungeonmaster-config/dungeonmaster-config-contract.ts`
- `packages/config/src/contracts/file-contents/file-contents-contract.ts`
- `packages/config/src/contracts/file-path/file-path-contract.ts`
- `packages/config/src/contracts/folder-config/folder-config-contract.ts`
- `packages/config/src/contracts/framework-presets/framework-presets-contract.ts`
- `packages/config/src/contracts/framework/framework-contract.ts`
- `packages/config/src/contracts/routing-library/routing-library-contract.ts`
- `packages/config/src/contracts/schema-library/schema-library-contract.ts`

**config-B01**

- `packages/config/src/module-resolution.integration.test.ts` — imports `path`

#### `eslint-plugin`

**eslint-plugin-Z (zod sweep).** Each file's only violation is `import … from 'zod'`; change the specifier to `'#gateway/npm/zod'` and nothing else.

- `packages/eslint-plugin/src/contracts/allowed-import/allowed-import-contract.ts`
- `packages/eslint-plugin/src/contracts/ast-node/ast-node-contract.ts`
- `packages/eslint-plugin/src/contracts/collected-export/collected-export-contract.ts`
- `packages/eslint-plugin/src/contracts/depth-count/depth-count-contract.ts`
- `packages/eslint-plugin/src/contracts/eslint-config/eslint-config-contract.ts`
- `packages/eslint-plugin/src/contracts/eslint-context/eslint-context-contract.test.ts`
- `packages/eslint-plugin/src/contracts/eslint-context/eslint-context-contract.ts`
- `packages/eslint-plugin/src/contracts/eslint-context/eslint-context.stub.ts`
- `packages/eslint-plugin/src/contracts/eslint-plugin-name/eslint-plugin-name-contract.ts`
- `packages/eslint-plugin/src/contracts/eslint-plugin/eslint-plugin-contract.ts`
- `packages/eslint-plugin/src/contracts/eslint-rule-name/eslint-rule-name-contract.ts`
- `packages/eslint-plugin/src/contracts/eslint-rule/eslint-rule-contract.ts`
- `packages/eslint-plugin/src/contracts/eslint-rules/eslint-rules-contract.ts`
- `packages/eslint-plugin/src/contracts/file-metadata-comment/file-metadata-comment-contract.ts`
- `packages/eslint-plugin/src/contracts/file-name/file-name-contract.ts`
- `packages/eslint-plugin/src/contracts/file-path/file-path-contract.ts`
- `packages/eslint-plugin/src/contracts/folder-suggestion/folder-suggestion-contract.ts`
- `packages/eslint-plugin/src/contracts/forbidden-folder-name/forbidden-folder-name-contract.ts`
- `packages/eslint-plugin/src/contracts/gateway-consumer-package-json/gateway-consumer-package-json-contract.ts`
- `packages/eslint-plugin/src/contracts/kebab-case-string/kebab-case-string-contract.ts`
- `packages/eslint-plugin/src/contracts/rule-violation/rule-violation-contract.ts`
- `packages/eslint-plugin/src/contracts/tsconfig-options/tsconfig-options-contract.ts`
- `packages/eslint-plugin/src/contracts/tsestree/tsestree-contract.ts`
- `packages/eslint-plugin/src/contracts/workspace-root-package-json/workspace-root-package-json-contract.ts`

**eslint-plugin-B01**

- `packages/eslint-plugin/src/brokers/rule/enforce-proxy-child-creation/rule-enforce-proxy-child-creation-broker.proxy.ts` — imports `fs`
- `packages/eslint-plugin/src/dungeonmaster-rule-enforce-on.integration.test.ts` — imports `fs`, `path`

**eslint-plugin-B02** — waits on GN1

- `packages/eslint-plugin/src/responders/eslint-plugin/create/eslint-plugin-create-responder.proxy.ts` — imports `eslint-plugin-jest`
- `packages/eslint-plugin/src/tmp-environment.integration.test.ts` — imports `fs`, `path`, `child_process` · **needs** GN1 process env snapshot (whole `process.env`)

#### `hooks`

**hooks-Z (zod sweep).** Each file's only violation is `import … from 'zod'`; change the specifier to `'#gateway/npm/zod'` and nothing else.

- `packages/hooks/src/contracts/agents-hooks-config/agents-hooks-config-contract.ts`
- `packages/hooks/src/contracts/agents-skills-config/agents-skills-config-contract.ts`
- `packages/hooks/src/contracts/agy-pre-tool-decision/agy-pre-tool-decision-contract.ts`
- `packages/hooks/src/contracts/agy-pre-tool-hook-data/agy-pre-tool-hook-data-contract.ts`
- `packages/hooks/src/contracts/agy-stop-decision/agy-stop-decision-contract.ts`
- `packages/hooks/src/contracts/agy-stop-hook-data/agy-stop-hook-data-contract.ts`
- `packages/hooks/src/contracts/agy-transcript-line/agy-transcript-line-contract.ts`
- `packages/hooks/src/contracts/base-hook-data/base-hook-data-contract.ts`
- `packages/hooks/src/contracts/bash-tool-input/bash-tool-input-contract.ts`
- `packages/hooks/src/contracts/child-process/child-process-contract.ts`
- `packages/hooks/src/contracts/claude-settings/claude-settings-contract.ts`
- `packages/hooks/src/contracts/command-output/command-output-contract.ts`
- `packages/hooks/src/contracts/content-change/content-change-contract.ts`
- `packages/hooks/src/contracts/dungeonmaster-hooks-config/dungeonmaster-hooks-config-contract.ts`
- `packages/hooks/src/contracts/edit-tool-input/edit-tool-input-contract.ts`
- `packages/hooks/src/contracts/eslint-instance/eslint-instance-contract.ts`
- `packages/hooks/src/contracts/eslint-options/eslint-options-contract.ts`
- `packages/hooks/src/contracts/eslint-raw-message/eslint-raw-message-contract.ts`
- `packages/hooks/src/contracts/eslint-rule-name/eslint-rule-name-contract.ts`
- `packages/hooks/src/contracts/fetch-get-with-status-result/fetch-get-with-status-result-contract.ts`
- `packages/hooks/src/contracts/file-contents/file-contents-contract.ts`
- `packages/hooks/src/contracts/file-path/file-path-contract.ts`
- `packages/hooks/src/contracts/file-stats/file-stats-contract.ts`
- `packages/hooks/src/contracts/folder-detail-call-lookup/folder-detail-call-lookup-contract.ts`
- `packages/hooks/src/contracts/folder-detail-hook-data/folder-detail-hook-data-contract.ts`
- `packages/hooks/src/contracts/glob-tool-input/glob-tool-input-contract.ts`
- `packages/hooks/src/contracts/grep-tool-input/grep-tool-input-contract.ts`
- `packages/hooks/src/contracts/hook-background-task/hook-background-task-contract.ts`
- `packages/hooks/src/contracts/hook-data/hook-data-contract.ts`
- `packages/hooks/src/contracts/hook-post-edit-responder-result/hook-post-edit-responder-result-contract.ts`
- `packages/hooks/src/contracts/hook-pre-edit-responder-result/hook-pre-edit-responder-result-contract.ts`
- `packages/hooks/src/contracts/hook-session-start-responder-result/hook-session-start-responder-result-contract.ts`
- `packages/hooks/src/contracts/lint-message/lint-message-contract.ts`
- `packages/hooks/src/contracts/lint-result/lint-result-contract.ts`
- `packages/hooks/src/contracts/linter-config/linter-config-contract.ts`
- `packages/hooks/src/contracts/mcp-pre-tool-use-hook-data/mcp-pre-tool-use-hook-data-contract.ts`
- `packages/hooks/src/contracts/mcp-tool-input/mcp-tool-input-contract.ts`
- `packages/hooks/src/contracts/multi-edit-tool-input/multi-edit-tool-input-contract.ts`
- `packages/hooks/src/contracts/partial-eslint-config/partial-eslint-config-contract.ts`
- `packages/hooks/src/contracts/post-tool-use-hook-data/post-tool-use-hook-data-contract.ts`
- `packages/hooks/src/contracts/pre-edit-lint-config/pre-edit-lint-config-contract.ts`
- `packages/hooks/src/contracts/pre-search-hook-data/pre-search-hook-data-contract.ts`
- `packages/hooks/src/contracts/pre-tool-use-hook-data/pre-tool-use-hook-data-contract.ts`
- `packages/hooks/src/contracts/quest-by-session-response/quest-by-session-response-contract.ts`
- `packages/hooks/src/contracts/raw-eslint-config/raw-eslint-config-contract.ts`
- `packages/hooks/src/contracts/rule-config/rule-config-contract.ts`
- `packages/hooks/src/contracts/session-start-hook-data/session-start-hook-data-contract.ts`
- `packages/hooks/src/contracts/subagent-start-hook-data/subagent-start-hook-data-contract.ts`
- `packages/hooks/src/contracts/subagent-stop-hook-data/subagent-stop-hook-data-contract.ts`
- `packages/hooks/src/contracts/tool-input-param-name/tool-input-param-name-contract.ts`
- `packages/hooks/src/contracts/tool-input/tool-input-contract.ts`
- `packages/hooks/src/contracts/tool-response/tool-response-contract.ts`
- `packages/hooks/src/contracts/transcript-line/transcript-line-contract.ts`
- `packages/hooks/src/contracts/transcript-tool-invocation/transcript-tool-invocation-contract.ts`
- `packages/hooks/src/contracts/user-prompt-submit-hook-data/user-prompt-submit-hook-data-contract.ts`
- `packages/hooks/src/contracts/violation-comparison-message/violation-comparison-message-contract.ts`
- `packages/hooks/src/contracts/violation-comparison/violation-comparison-contract.ts`
- `packages/hooks/src/contracts/violation-count/violation-count-contract.ts`
- `packages/hooks/src/contracts/violation-detail/violation-detail-contract.ts`
- `packages/hooks/src/contracts/worktree-create-hook-data/worktree-create-hook-data-contract.ts`
- `packages/hooks/src/contracts/write-tool-input/write-tool-input-contract.ts`

**hooks-B01**

- `packages/hooks/src/brokers/eslint/lint-run-targeted/eslint-lint-run-targeted-broker.ts` — uses `process.stderr`
- `packages/hooks/src/brokers/eslint/lint-run-with-fix/eslint-lint-run-with-fix-broker.ts` — uses `process.stderr`

**hooks-B02**

- `packages/hooks/src/flows/hook-post-ask-question/hook-post-ask-question-flow.integration.test.ts` — uses `process.cwd`
- `packages/hooks/src/flows/hook-post-ask-question/hook-post-ask-question-flow.ts` — uses `process.stderr`
- `packages/hooks/src/flows/hook-post-edit/hook-post-edit-flow.integration.test.ts` — uses `process.cwd`
- `packages/hooks/src/flows/hook-pre-bash/hook-pre-bash-flow.integration.test.ts` — uses `process.cwd`

**hooks-B03**

- `packages/hooks/src/flows/hook-pre-edit/hook-pre-edit-flow.integration.test.ts` — uses `process.cwd`
- `packages/hooks/src/flows/hook-pre-search/hook-pre-search-flow.integration.test.ts` — uses `process.cwd`

**hooks-B04**

- `packages/hooks/src/responders/hook/post-ask-question/hook-post-ask-question-responder.ts` — uses `process.stderr`
- `packages/hooks/src/responders/hook/pre-search/hook-pre-search-responder.test.ts` — uses `process.cwd`

**hooks-B05**

- `packages/hooks/src/startup/start-agy-pre-tool-hook.ts` — uses `process.stderr`, `process.stdout`, `process.exit` · **needs** GN2a process.stdin
- `packages/hooks/src/startup/start-agy-stop-hook.ts` — uses `process.stderr`, `process.stdout`, `process.exit` · **needs** GN2a process.stdin
- `packages/hooks/src/startup/start-post-ask-question-hook.ts` — uses `process.stdout`, `process.exit`, `process.stderr` · **needs** GN2a process.stdin

**hooks-B06**

- `packages/hooks/src/startup/start-post-edit-hook.integration.test.ts` — uses `process.cwd`
- `packages/hooks/src/startup/start-post-edit-hook.ts` — uses `process.stderr`, `process.stdout`, `process.exit` · **needs** GN2a process.stdin
- `packages/hooks/src/startup/start-pre-bash-hook.ts` — uses `process.stderr`, `process.stdout`, `process.exit` · **needs** GN2a process.stdin

**hooks-B07**

- `packages/hooks/src/startup/start-pre-edit-hook.integration.test.ts` — uses `process.cwd`
- `packages/hooks/src/startup/start-pre-edit-hook.ts` — uses `process.stderr`, `process.stdout`, `process.exit` · **needs** GN2a process.stdin
- `packages/hooks/src/startup/start-pre-folder-detail-hook.ts` — uses `process.stderr`, `process.stdout`, `process.exit` · **needs** GN2a process.stdin
- `packages/hooks/src/startup/start-pre-mcp-caller-hook.ts` — uses `process.stderr`, `process.stdout`, `process.exit` · **needs** GN2a process.stdin

**hooks-B08**

- `packages/hooks/src/startup/start-pre-search-hook.ts` — uses `process.stderr`, `process.stdout`, `process.exit` · **needs** GN2a process.stdin
- `packages/hooks/src/startup/start-session-snippet-hook.ts` — uses `process.argv`, `process.stderr`, `process.stdout`, `process.exit` · **needs** GN2a process.stdin
- `packages/hooks/src/startup/start-subagent-stop-hook.ts` — uses `process.stderr`, `process.stdout`, `process.exit` · **needs** GN2a process.stdin
- `packages/hooks/src/startup/start-worktree-create-hook.ts` — uses `process.stderr`, `process.stdout`, `process.exit` · **needs** GN2a process.stdin

**hooks-B09** — waits on GN1

- `packages/hooks/src/transformers/build-folder-types-table/build-folder-types-table-transformer.test.ts` — uses `Buffer`
- `packages/hooks/test/harnesses/fresh-project/fresh-project.harness.ts` — imports `fs`, `os`, `path`
- `packages/hooks/test/harnesses/hook-runner/hook-persistent-runner.harness.ts` — imports `path`, `child_process`, `readline` · uses `process.cwd`, `setTimeout`, `clearTimeout` · **needs** GN1 process env snapshot (whole `process.env`)
- `packages/hooks/test/harnesses/hook-runner/hook-persistent-worker.ts` — imports `readline` · uses `process.stdout`, `process.stderr`, `process.exit`, `process.argv` · **needs** GN2a process.stdin

**hooks-B10** — waits on C2, GN1

- `packages/hooks/test/harnesses/hook-runner/hook-runner.harness.ts` — imports `path`, `url`, `child_process` · uses `process.cwd`, `process.execPath` · **needs** C2 npm `tsx`; GN1 process env snapshot (whole `process.env`)
- `packages/hooks/test/harnesses/transcript/transcript.harness.ts` — imports `fs`, `os`, `path`

#### `hydration`

**hydration-Z (zod sweep).** Each file's only violation is `import … from 'zod'`; change the specifier to `'#gateway/npm/zod'` and nothing else.

- `packages/hydration/src/contracts/build-sequence/build-sequence-contract.ts`
- `packages/hydration/src/contracts/call-index/call-index-contract.ts`
- `packages/hydration/src/contracts/copies-target/copies-target-contract.ts`
- `packages/hydration/src/contracts/extra-verb-name/extra-verb-name-contract.ts`
- `packages/hydration/src/contracts/field-name/field-name-contract.ts`
- `packages/hydration/src/contracts/field-values/field-values-contract.ts`
- `packages/hydration/src/contracts/filter-expect/filter-expect-contract.ts`
- `packages/hydration/src/contracts/http-response/http-response-contract.ts`
- `packages/hydration/src/contracts/hydration-collection/hydration-collection-contract.ts`
- `packages/hydration/src/contracts/hydration-op/hydration-op-contract.ts`
- `packages/hydration/src/contracts/hydration-plan/hydration-plan-contract.ts`
- `packages/hydration/src/contracts/hydration-route/hydration-route-contract.ts`
- `packages/hydration/src/contracts/hydration-routes/hydration-routes-contract.ts`
- `packages/hydration/src/contracts/hydration-run-result/hydration-run-result-contract.ts`
- `packages/hydration/src/contracts/hydration-run-state/hydration-run-state-contract.ts`
- `packages/hydration/src/contracts/hydration-target/hydration-target-contract.ts`
- `packages/hydration/src/contracts/ingredient-config/ingredient-config-contract.test.ts`
- `packages/hydration/src/contracts/ingredient-config/ingredient-config-contract.ts`
- `packages/hydration/src/contracts/ingredient-config/ingredient-config.stub.ts`
- `packages/hydration/src/contracts/ingredient-handle/ingredient-handle-contract.ts`
- `packages/hydration/src/contracts/ingredient-name/ingredient-name-contract.ts`
- `packages/hydration/src/contracts/link-spec/link-spec-contract.ts`
- `packages/hydration/src/contracts/link-values-result/link-values-result-contract.ts`
- `packages/hydration/src/contracts/matched-set/matched-set-contract.ts`
- `packages/hydration/src/contracts/op-attach/op-attach-contract.ts`
- `packages/hydration/src/contracts/op-create/op-create-contract.ts`
- `packages/hydration/src/contracts/op-description/op-description-contract.ts`
- `packages/hydration/src/contracts/op-extra/op-extra-contract.ts`
- `packages/hydration/src/contracts/op-filter/op-filter-contract.ts`
- `packages/hydration/src/contracts/op-remove/op-remove-contract.ts`
- `packages/hydration/src/contracts/op-save-record/op-save-record-contract.ts`
- `packages/hydration/src/contracts/op-set/op-set-contract.ts`
- `packages/hydration/src/contracts/plan-makes-entry/plan-makes-entry-contract.ts`
- `packages/hydration/src/contracts/plan-runs-result/plan-runs-result-contract.ts`
- `packages/hydration/src/contracts/recipe-def/recipe-def-contract.test.ts`
- `packages/hydration/src/contracts/recipe-def/recipe-def-contract.ts`
- `packages/hydration/src/contracts/recipe-manifest/recipe-manifest-contract.ts`
- `packages/hydration/src/contracts/recipe-name/recipe-name-contract.ts`
- `packages/hydration/src/contracts/route-failure/route-failure-contract.ts`
- `packages/hydration/src/contracts/route-plan/route-plan-contract.ts`
- `packages/hydration/src/contracts/row-index/row-index-contract.ts`
- `packages/hydration/src/contracts/row-ref/row-ref-contract.ts`
- `packages/hydration/src/contracts/saved-record-name/saved-record-name-contract.ts`
- `packages/hydration/src/contracts/saved-ref/saved-ref-contract.ts`
- `packages/hydration/src/contracts/seed-step/seed-step-contract.ts`
- `packages/hydration/src/contracts/transition-spec/transition-spec-contract.ts`
- `packages/hydration/src/contracts/type-diagnostic/type-diagnostic-contract.ts`
- `packages/hydration/src/contracts/write-failure/write-failure-contract.ts`

**hydration-B01** — waits on GN5

- `packages/hydration/src/brokers/plan/run/plan-run-broker.test.ts` — uses `setTimeout`
- `packages/hydration/test/harnesses/api-target/api-target.harness.ts` — **needs** GN5 node `http`
- `packages/hydration/test/harnesses/file-target/file-target.harness.ts` — imports `node:fs`, `node:path`

#### `hydration-recipes`

**hydration-recipes-Z (zod sweep).** Each file's only violation is `import … from 'zod'`; change the specifier to `'#gateway/npm/zod'` and nothing else.

- `packages/hydration-recipes/src/contracts/corrupt-schema-args/corrupt-schema-args-contract.ts`
- `packages/hydration-recipes/src/contracts/dm-http-response/dm-http-response-contract.ts`
- `packages/hydration-recipes/src/contracts/dm-quest-outbox-line/dm-quest-outbox-line-contract.ts`
- `packages/hydration-recipes/src/contracts/dm-target/dm-target-contract.ts`
- `packages/hydration-recipes/src/contracts/file-stem/file-stem-contract.ts`
- `packages/hydration-recipes/src/contracts/guild-fields-schema/guild-fields-schema-contract.ts`
- `packages/hydration-recipes/src/contracts/guild-fields/guild-fields-contract.ts`
- `packages/hydration-recipes/src/contracts/guild-listing/guild-listing-contract.ts`
- `packages/hydration-recipes/src/contracts/nested-chain-args/nested-chain-args-contract.ts`
- `packages/hydration-recipes/src/contracts/operation-fields-schema/operation-fields-schema-contract.ts`
- `packages/hydration-recipes/src/contracts/operation-fields/operation-fields-contract.ts`
- `packages/hydration-recipes/src/contracts/quest-advances-one-step-inputs/quest-advances-one-step-inputs-contract.ts`
- `packages/hydration-recipes/src/contracts/quest-fields-schema/quest-fields-schema-contract.ts`
- `packages/hydration-recipes/src/contracts/quest-fields/quest-fields-contract.ts`
- `packages/hydration-recipes/src/contracts/recipe-catalog-entry/recipe-catalog-entry-contract.ts`
- `packages/hydration-recipes/src/contracts/recipe-context/recipe-context-contract.ts`
- `packages/hydration-recipes/src/contracts/recipe-fidelity/recipe-fidelity-contract.ts`
- `packages/hydration-recipes/src/contracts/recipe-input-key/recipe-input-key-contract.ts`
- `packages/hydration-recipes/src/contracts/recipe-manifest/recipe-manifest-contract.ts`
- `packages/hydration-recipes/src/contracts/recipe-name/recipe-name-contract.ts`
- `packages/hydration-recipes/src/contracts/recipe-result/recipe-result-contract.ts`
- `packages/hydration-recipes/src/contracts/recipe-return-name/recipe-return-name-contract.ts`
- `packages/hydration-recipes/src/contracts/session-fields/session-fields-contract.ts`
- `packages/hydration-recipes/src/contracts/session-record/session-record-contract.ts`
- `packages/hydration-recipes/src/contracts/session-with-nested-chain-inputs/session-with-nested-chain-inputs-contract.ts`
- `packages/hydration-recipes/src/contracts/subagent-fields/subagent-fields-contract.ts`
- `packages/hydration-recipes/src/contracts/subagent-record/subagent-record-contract.ts`
- `packages/hydration-recipes/src/contracts/task-description/task-description-contract.ts`
- `packages/hydration-recipes/src/contracts/tool-use-id/tool-use-id-contract.ts`
- `packages/hydration-recipes/src/contracts/transcript-line/transcript-line-contract.ts`
- `packages/hydration-recipes/src/contracts/ward-result-detail-args/ward-result-detail-args-contract.ts`
- `packages/hydration-recipes/src/contracts/work-item-attach-args/work-item-attach-args-contract.ts`
- `packages/hydration-recipes/src/hydration-recipes-exports.integration.test.ts`

**hydration-recipes-B01**

- `packages/hydration-recipes/src/brokers/operation/write-route/operation-write-route-broker.proxy.ts` — uses `crypto`
- `packages/hydration-recipes/src/brokers/operation/write-route/operation-write-route-broker.ts` — uses `crypto`

**hydration-recipes-B02**

- `packages/hydration-recipes/src/brokers/quest/work-item-attach/quest-work-item-attach-broker.proxy.ts` — uses `crypto`
- `packages/hydration-recipes/src/brokers/quest/work-item-attach/quest-work-item-attach-broker.ts` — uses `crypto`
- `packages/hydration-recipes/src/brokers/quest/write-route/quest-write-route-broker.proxy.ts` — uses `crypto`
- `packages/hydration-recipes/src/brokers/quest/write-route/quest-write-route-broker.ts` — uses `crypto`

**hydration-recipes-B03** — waits on GN1

- `packages/hydration-recipes/src/brokers/recipes-seed/run/recipes-seed-run-broker.integration.test.ts` — uses `process.env.X` · **needs** GN1 process env write/delete (`setEnv`/`deleteEnv`)
- `packages/hydration-recipes/src/brokers/recipes-seed/run/recipes-seed-run-broker.ts` — uses `process.env.X` · **needs** GN1 process env write/delete (`setEnv`/`deleteEnv`); GN1 process env snapshot (whole `process.env`)

**hydration-recipes-B04** — waits on GN1, GN5

- `packages/hydration-recipes/src/hydration-recipes-not-shipped.integration.test.ts` — imports `path`
- `packages/hydration-recipes/test/harnesses/file-target/file-target.harness.ts` — imports `fs`, `path` · uses `process.env.X` · **needs** GN1 process env write/delete (`setEnv`/`deleteEnv`); GN1 process env snapshot (whole `process.env`)
- `packages/hydration-recipes/test/harnesses/instance-stub/instance-stub.harness.ts` — uses `Buffer` · **needs** GN5 node `http`
- `packages/hydration-recipes/test/harnesses/lane-api/lane-api.harness.ts` — **needs** GN5 node `http`

**hydration-recipes-B05** — waits on GN1

- `packages/hydration-recipes/test/harnesses/live-quest-target/live-quest-target.harness.ts` — imports `fs`, `path` · uses `process.env.X`, `crypto` · **needs** GN1 process env write/delete (`setEnv`/`deleteEnv`); GN1 process env snapshot (whole `process.env`)

#### `local-eslint`

No violations. Nothing to dispatch.

#### `mcp`

**mcp-Z (zod sweep).** Each file's only violation is `import … from 'zod'`; change the specifier to `'#gateway/npm/zod'` and nothing else.

- `packages/mcp/src/contracts/agent-quest-payload/agent-quest-payload-contract.ts`
- `packages/mcp/src/contracts/buffer-state/buffer-state-contract.ts`
- `packages/mcp/src/contracts/caller-repo-root-source/caller-repo-root-source-contract.ts`
- `packages/mcp/src/contracts/capped-grep-hits/capped-grep-hits-contract.ts`
- `packages/mcp/src/contracts/cli-signal/cli-signal-contract.ts`
- `packages/mcp/src/contracts/coerced-boolean-input/coerced-boolean-input-contract.ts`
- `packages/mcp/src/contracts/content-text/content-text-contract.ts`
- `packages/mcp/src/contracts/content-type/content-type-contract.ts`
- `packages/mcp/src/contracts/create-quest-input/create-quest-input-contract.ts`
- `packages/mcp/src/contracts/create-quest-output/create-quest-output-contract.ts`
- `packages/mcp/src/contracts/create-worktree-input/create-worktree-input-contract.ts`
- `packages/mcp/src/contracts/discover-input/discover-input-contract.ts`
- `packages/mcp/src/contracts/discover-list-item/discover-list-item-contract.ts`
- `packages/mcp/src/contracts/discover-result-item/discover-result-item-contract.ts`
- `packages/mcp/src/contracts/discover-result/discover-result-contract.ts`
- `packages/mcp/src/contracts/discover-tree-result/discover-tree-result-contract.ts`
- `packages/mcp/src/contracts/error-code/error-code-contract.ts`
- `packages/mcp/src/contracts/error-message/error-message-contract.ts`
- `packages/mcp/src/contracts/file-metadata/file-metadata-contract.ts`
- `packages/mcp/src/contracts/file-type/file-type-contract.ts`
- `packages/mcp/src/contracts/file-with-source/file-with-source-contract.ts`
- `packages/mcp/src/contracts/folder-dependency-tree/folder-dependency-tree-contract.ts`
- `packages/mcp/src/contracts/folder-detail-input/folder-detail-input-contract.ts`
- `packages/mcp/src/contracts/folder-name/folder-name-contract.ts`
- `packages/mcp/src/contracts/folder-type/folder-type-contract.ts`
- `packages/mcp/src/contracts/function-name/function-name-contract.ts`
- `packages/mcp/src/contracts/get-agent-prompt-input/get-agent-prompt-input-contract.ts`
- `packages/mcp/src/contracts/get-blight-checklist-input/get-blight-checklist-input-contract.ts`
- `packages/mcp/src/contracts/get-project-inventory-input/get-project-inventory-input-contract.ts`
- `packages/mcp/src/contracts/get-project-map-input/get-project-map-input-contract.ts`
- `packages/mcp/src/contracts/get-quest-input/get-quest-input-contract.ts`
- `packages/mcp/src/contracts/get-quest-planning-notes-input/get-quest-planning-notes-input-contract.ts`
- `packages/mcp/src/contracts/get-quest-status-input/get-quest-status-input-contract.ts`
- `packages/mcp/src/contracts/get-quest-status-result/get-quest-status-result-contract.ts`
- `packages/mcp/src/contracts/get-quest-summary-input/get-quest-summary-input-contract.ts`
- `packages/mcp/src/contracts/get-quest-work-input/get-quest-work-input-contract.ts`
- `packages/mcp/src/contracts/get-server-config-output/get-server-config-output-contract.ts`
- `packages/mcp/src/contracts/grep-hit/grep-hit-contract.ts`
- `packages/mcp/src/contracts/header-info/header-info-contract.ts`
- `packages/mcp/src/contracts/header-text/header-text-contract.ts`
- `packages/mcp/src/contracts/import-path/import-path-contract.ts`
- `packages/mcp/src/contracts/json-rpc-error/json-rpc-error-contract.ts`
- `packages/mcp/src/contracts/json-rpc-request/json-rpc-request-contract.ts`
- `packages/mcp/src/contracts/json-rpc-response/json-rpc-response-contract.ts`
- `packages/mcp/src/contracts/line-index/line-index-contract.ts`
- `packages/mcp/src/contracts/list-quests-input/list-quests-input-contract.ts`
- `packages/mcp/src/contracts/list-quests-result/list-quests-result-contract.ts`
- `packages/mcp/src/contracts/mcp-config/mcp-config-contract.ts`
- `packages/mcp/src/contracts/mcp-permission/mcp-permission-contract.ts`
- `packages/mcp/src/contracts/mcp-server-client/mcp-server-client-contract.ts`
- `packages/mcp/src/contracts/parameter-name/parameter-name-contract.ts`
- `packages/mcp/src/contracts/quest-work-input/quest-work-input-contract.ts`
- `packages/mcp/src/contracts/result-count/result-count-contract.ts`
- `packages/mcp/src/contracts/return-type/return-type-contract.ts`
- `packages/mcp/src/contracts/rpc-id/rpc-id-contract.ts`
- `packages/mcp/src/contracts/rpc-method/rpc-method-contract.ts`
- `packages/mcp/src/contracts/signal-back-input/signal-back-input-contract.ts`
- `packages/mcp/src/contracts/signal-back-result/signal-back-result-contract.ts`
- `packages/mcp/src/contracts/signature-raw/signature-raw-contract.ts`
- `packages/mcp/src/contracts/start-quest-input/start-quest-input-contract.ts`
- `packages/mcp/src/contracts/start-quest-result/start-quest-result-contract.ts`
- `packages/mcp/src/contracts/tool-call-content/tool-call-content-contract.ts`
- `packages/mcp/src/contracts/tool-call-params/tool-call-params-contract.ts`
- `packages/mcp/src/contracts/tool-call-result/tool-call-result-contract.ts`
- `packages/mcp/src/contracts/tool-description/tool-description-contract.ts`
- `packages/mcp/src/contracts/tool-list-result/tool-list-result-contract.ts`
- `packages/mcp/src/contracts/tool-name/tool-name-contract.ts`
- `packages/mcp/src/contracts/tool-registration/tool-registration-contract.ts`
- `packages/mcp/src/contracts/tool-response/tool-response-contract.ts`
- `packages/mcp/src/contracts/tool/tool-contract.ts`
- `packages/mcp/src/contracts/tree-item/tree-item-contract.ts`
- `packages/mcp/src/contracts/tree-node/tree-node-contract.ts`
- `packages/mcp/src/contracts/tree-output/tree-output-contract.ts`
- `packages/mcp/src/contracts/type-name/type-name-contract.ts`

**mcp-B01**

- `packages/mcp/src/brokers/folder-constraints/init/folder-constraints-init-broker.ts` — uses `process.stderr`
- `packages/mcp/src/brokers/settings/permissions-add/settings-permissions-add-broker.proxy.ts` — imports `path`

**mcp-B02** — waits on GN2

- `packages/mcp/src/flows/mcp-server/mcp-server-flow.integration.test.ts` — uses `process.cwd`, `Buffer`
- `packages/mcp/src/index.proxy.ts` — imports `path` · uses `process.stderr` · **needs** GN2a process.<object>; GN2 process.removeAllListeners; GN2 process.emit
- `packages/mcp/src/index.ts` — uses `process.on(signal)`, `process.exit`, `process.stderr`

**mcp-B03** — waits on GN1

- `packages/mcp/src/responders/install/config-create/install-config-create-responder.proxy.ts` — imports `path`
- `packages/mcp/test/harnesses/interaction-flow-source/interaction-flow-source.harness.ts` — imports `fs`, `path`
- `packages/mcp/test/harnesses/mcp-server/mcp-server.harness.ts` — imports `child_process`, `fs`, `path` · uses `clearTimeout`, `setTimeout` · **needs** GN1 process env snapshot (whole `process.env`)

#### `orchestrator`

**orchestrator-Z (zod sweep).** Each file's only violation is `import … from 'zod'`; change the specifier to `'#gateway/npm/zod'` and nothing else.

- `packages/orchestrator/src/contracts/active-agent/active-agent-contract.ts`
- `packages/orchestrator/src/contracts/active-quest-entry/active-quest-entry-contract.ts`
- `packages/orchestrator/src/contracts/active-quest-facade/active-quest-facade-contract.ts`
- `packages/orchestrator/src/contracts/active-session-result/active-session-result-contract.ts`
- `packages/orchestrator/src/contracts/active-smoketest-run/active-smoketest-run-contract.ts`
- `packages/orchestrator/src/contracts/agent-family-name/agent-family-name-contract.ts`
- `packages/orchestrator/src/contracts/agent-id/agent-id-contract.ts`
- `packages/orchestrator/src/contracts/agent-prompt-name/agent-prompt-name-contract.ts`
- `packages/orchestrator/src/contracts/agent-spawn-streaming-result/agent-spawn-streaming-result-contract.ts`
- `packages/orchestrator/src/contracts/agent-step-node/agent-step-node-contract.ts`
- `packages/orchestrator/src/contracts/ask-user-question-input/ask-user-question-input-contract.ts`
- `packages/orchestrator/src/contracts/ask-user-question-tool-input/ask-user-question-tool-input-contract.ts`
- `packages/orchestrator/src/contracts/batch-file-input/batch-file-input-contract.ts`
- `packages/orchestrator/src/contracts/captured-orchestration-emit/captured-orchestration-emit-contract.ts`
- `packages/orchestrator/src/contracts/chat-entry-content/chat-entry-content-contract.ts`
- `packages/orchestrator/src/contracts/chat-line-output/chat-line-output-contract.ts`
- `packages/orchestrator/src/contracts/chat-line-processor/chat-line-processor-contract.ts`
- `packages/orchestrator/src/contracts/chat-line-source/chat-line-source-contract.ts`
- `packages/orchestrator/src/contracts/chat-output-emit-payload/chat-output-emit-payload-contract.ts`
- `packages/orchestrator/src/contracts/clarification-question/clarification-question-contract.ts`
- `packages/orchestrator/src/contracts/claude-model/claude-model-contract.ts`
- `packages/orchestrator/src/contracts/claude-spawn-command/claude-spawn-command-contract.ts`
- `packages/orchestrator/src/contracts/cleanup-answer/cleanup-answer-contract.ts`
- `packages/orchestrator/src/contracts/commit-sha/commit-sha-contract.ts`
- `packages/orchestrator/src/contracts/continuation-context/continuation-context-contract.ts`
- `packages/orchestrator/src/contracts/dag-edge/dag-edge-contract.ts`
- `packages/orchestrator/src/contracts/deleted-count/deleted-count-contract.ts`
- `packages/orchestrator/src/contracts/elapsed-ms/elapsed-ms-contract.ts`
- `packages/orchestrator/src/contracts/enqueued-count/enqueued-count-contract.ts`
- `packages/orchestrator/src/contracts/fail-count/fail-count-contract.ts`
- `packages/orchestrator/src/contracts/followup-depth/followup-depth-contract.ts`
- `packages/orchestrator/src/contracts/inflated-task-notification-content/inflated-task-notification-content-contract.ts`
- `packages/orchestrator/src/contracts/iso-timestamp/iso-timestamp-contract.ts`
- `packages/orchestrator/src/contracts/killable-process/killable-process-contract.ts`
- `packages/orchestrator/src/contracts/lane-capacity/lane-capacity-contract.ts`
- `packages/orchestrator/src/contracts/lane-kill-result/lane-kill-result-contract.ts`
- `packages/orchestrator/src/contracts/lane-manifest-reading/lane-manifest-reading-contract.ts`
- `packages/orchestrator/src/contracts/linked-quest-info/linked-quest-info-contract.ts`
- `packages/orchestrator/src/contracts/max-concurrent/max-concurrent-contract.ts`
- `packages/orchestrator/src/contracts/minted-work-item/minted-work-item-contract.ts`
- `packages/orchestrator/src/contracts/monitorable-process/monitorable-process-contract.ts`
- `packages/orchestrator/src/contracts/next-action/next-action-contract.ts`
- `packages/orchestrator/src/contracts/next-ready-result/next-ready-result-contract.ts`
- `packages/orchestrator/src/contracts/next-step/next-step-contract.ts`
- `packages/orchestrator/src/contracts/node-dispatch-runner/node-dispatch-runner-contract.ts`
- `packages/orchestrator/src/contracts/normalized-stream-line-content-item/normalized-stream-line-content-item-contract.ts`
- `packages/orchestrator/src/contracts/normalized-stream-line/normalized-stream-line-contract.ts`
- `packages/orchestrator/src/contracts/orchestration-callbacks/orchestration-callbacks-contract.ts`
- `packages/orchestrator/src/contracts/orchestration-callbacks/orchestration-callbacks.stub.ts`
- `packages/orchestrator/src/contracts/orchestration-event-envelope/orchestration-event-envelope-contract.ts`
- `packages/orchestrator/src/contracts/orchestration-event-payload-key/orchestration-event-payload-key-contract.ts`
- `packages/orchestrator/src/contracts/orchestration-events-state-facade/orchestration-events-state-facade-contract.ts`
- `packages/orchestrator/src/contracts/orchestration-events-state-module/orchestration-events-state-module-contract.ts`
- `packages/orchestrator/src/contracts/orchestration-loop-summary/orchestration-loop-summary-contract.ts`
- `packages/orchestrator/src/contracts/orchestration-process/orchestration-process-contract.ts`
- `packages/orchestrator/src/contracts/orchestration-slot-data/orchestration-slot-data-contract.ts`
- `packages/orchestrator/src/contracts/orphan-reset-result/orphan-reset-result-contract.ts`
- `packages/orchestrator/src/contracts/pending-clarification-entry/pending-clarification-entry-contract.ts`
- `packages/orchestrator/src/contracts/process-activity/process-activity-contract.ts`
- `packages/orchestrator/src/contracts/process-id-prefix/process-id-prefix-contract.ts`
- `packages/orchestrator/src/contracts/process-pid/process-pid-contract.ts`
- `packages/orchestrator/src/contracts/prompt-text/prompt-text-contract.ts`
- `packages/orchestrator/src/contracts/qa-verification-unit/qa-verification-unit-contract.ts`
- `packages/orchestrator/src/contracts/quest-blueprint/quest-blueprint-contract.ts`
- `packages/orchestrator/src/contracts/quest-cwd-resolution/quest-cwd-resolution-contract.ts`
- `packages/orchestrator/src/contracts/quest-folder-find-result/quest-folder-find-result-contract.ts`
- `packages/orchestrator/src/contracts/quest-get-server-config-result/quest-get-server-config-result-contract.ts`
- `packages/orchestrator/src/contracts/quest-outbox-line/quest-outbox-line-contract.ts`
- `packages/orchestrator/src/contracts/quest-resume-trigger/quest-resume-trigger-contract.ts`
- `packages/orchestrator/src/contracts/quest-work-input/quest-work-input-contract.ts`
- `packages/orchestrator/src/contracts/quest-work-instance/quest-work-instance-contract.ts`
- `packages/orchestrator/src/contracts/quest-work-record-result/quest-work-record-result-contract.ts`
- `packages/orchestrator/src/contracts/quest-work-result/quest-work-result-contract.ts`
- `packages/orchestrator/src/contracts/quest-work-view/quest-work-view-contract.ts`
- `packages/orchestrator/src/contracts/rate-limits-watch-handle/rate-limits-watch-handle-contract.ts`
- `packages/orchestrator/src/contracts/rate-limits-watch-tick-outcome/rate-limits-watch-tick-outcome-contract.ts`
- `packages/orchestrator/src/contracts/rate-limits-watch-tick-result/rate-limits-watch-tick-result-contract.ts`
- `packages/orchestrator/src/contracts/recipe-id/recipe-id-contract.ts`
- `packages/orchestrator/src/contracts/removed-count/removed-count-contract.ts`
- `packages/orchestrator/src/contracts/replacement-entry/replacement-entry-contract.ts`
- `packages/orchestrator/src/contracts/run-step/run-step-contract.ts`
- `packages/orchestrator/src/contracts/scanned-file/scanned-file-contract.ts`
- `packages/orchestrator/src/contracts/scenario-instance/scenario-instance-contract.ts`
- `packages/orchestrator/src/contracts/siegelense-instance-kill-module/siegelense-instance-kill-module-contract.ts`
- `packages/orchestrator/src/contracts/siegelense-lane-provision-module/siegelense-lane-provision-module-contract.ts`
- `packages/orchestrator/src/contracts/signal-gate-result/signal-gate-result-contract.ts`
- `packages/orchestrator/src/contracts/slot-manager-result/slot-manager-result-contract.ts`
- `packages/orchestrator/src/contracts/slot-status/slot-status-contract.ts`
- `packages/orchestrator/src/contracts/smoketest-assertion/smoketest-assertion-contract.ts`
- `packages/orchestrator/src/contracts/smoketest-listener-entry/smoketest-listener-entry-contract.ts`
- `packages/orchestrator/src/contracts/smoketest-placeholder/smoketest-placeholder-contract.ts`
- `packages/orchestrator/src/contracts/smoketest-scenario-meta/smoketest-scenario-meta-contract.ts`
- `packages/orchestrator/src/contracts/smoketest-scenario/smoketest-scenario-contract.ts`
- `packages/orchestrator/src/contracts/smoketest-teardown-check/smoketest-teardown-check-contract.ts`
- `packages/orchestrator/src/contracts/spawn-instruction/spawn-instruction-contract.ts`
- `packages/orchestrator/src/contracts/spawn-options-env-name/spawn-options-env-name-contract.ts`
- `packages/orchestrator/src/contracts/spawn-options-snapshot/spawn-options-snapshot-contract.ts`
- `packages/orchestrator/src/contracts/step-handler-name/step-handler-name-contract.ts`
- `packages/orchestrator/src/contracts/step-handler-result/step-handler-result-contract.ts`
- `packages/orchestrator/src/contracts/step-name/step-name-contract.ts`
- `packages/orchestrator/src/contracts/step-outcome/step-outcome-contract.ts`
- `packages/orchestrator/src/contracts/stream-json-result/stream-json-result-contract.ts`
- `packages/orchestrator/src/contracts/stream-signal/stream-signal-contract.ts`
- `packages/orchestrator/src/contracts/stream-text/stream-text-contract.ts`
- `packages/orchestrator/src/contracts/subagent-file/subagent-file-contract.ts`
- `packages/orchestrator/src/contracts/task-agent-tool-input/task-agent-tool-input-contract.ts`
- `packages/orchestrator/src/contracts/task-agent-tool-prompt/task-agent-tool-prompt-contract.ts`
- `packages/orchestrator/src/contracts/task-notification-data/task-notification-data-contract.ts`
- `packages/orchestrator/src/contracts/tool-input-display/tool-input-display-contract.ts`
- `packages/orchestrator/src/contracts/tool-use-display/tool-use-display-contract.ts`
- `packages/orchestrator/src/contracts/tool-use-id/tool-use-id-contract.ts`
- `packages/orchestrator/src/contracts/transcript-read/transcript-read-contract.ts`
- `packages/orchestrator/src/contracts/unit-current-mark/unit-current-mark-contract.ts`
- `packages/orchestrator/src/contracts/unit-mark-churn-entry/unit-mark-churn-entry-contract.ts`
- `packages/orchestrator/src/contracts/usage-line-shape/usage-line-shape-contract.ts`
- `packages/orchestrator/src/contracts/usage-sample/usage-sample-contract.ts`
- `packages/orchestrator/src/contracts/ward-check-type/ward-check-type-contract.ts`
- `packages/orchestrator/src/contracts/ward-detail-json/ward-detail-json-contract.ts`
- `packages/orchestrator/src/contracts/work-item-assignment/work-item-assignment-contract.ts`
- `packages/orchestrator/src/contracts/work-plan-batch/work-plan-batch-contract.ts`
- `packages/orchestrator/src/contracts/work-plan-codeweaver-unit/work-plan-codeweaver-unit-contract.ts`
- `packages/orchestrator/src/contracts/work-plan-fields/work-plan-fields-contract.ts`
- `packages/orchestrator/src/contracts/work-plan-file-entry/work-plan-file-entry-contract.ts`
- `packages/orchestrator/src/contracts/work-plan-flowrider-unit/work-plan-flowrider-unit-contract.ts`
- `packages/orchestrator/src/contracts/work-plan-payload-codeweaver/work-plan-payload-codeweaver-contract.ts`
- `packages/orchestrator/src/contracts/work-plan-payload-flowrider/work-plan-payload-flowrider-contract.ts`
- `packages/orchestrator/src/contracts/work-plan-payload-siegemaster/work-plan-payload-siegemaster-contract.ts`
- `packages/orchestrator/src/contracts/work-plan-piece/work-plan-piece-contract.ts`
- `packages/orchestrator/src/contracts/work-plan-validation-check/work-plan-validation-check-contract.ts`
- `packages/orchestrator/src/contracts/work-plan-validation-failure/work-plan-validation-failure-contract.ts`
- `packages/orchestrator/src/contracts/work-plan/work-plan-contract.ts`

**orchestrator-B01** — waits on GN3

- `packages/orchestrator/src/brokers/agent-prompt/get/agent-prompt-get-broker.ts` — uses `process.stderr`
- `packages/orchestrator/src/brokers/agent/launch/agent-launch-broker.proxy.ts` — uses `crypto`
- `packages/orchestrator/src/brokers/agent/launch/agent-launch-broker.test.ts` — **needs** GN3 node global `setImmediate`
- `packages/orchestrator/src/brokers/agent/launch/agent-launch-broker.ts` — uses `crypto`, `process.stderr`

**orchestrator-B02** — waits on GN1, GN3

- `packages/orchestrator/src/brokers/agent/launch/start-main-tail-layer-broker.test.ts` — **needs** GN3 node global `setImmediate`
- `packages/orchestrator/src/brokers/agent/spawn-stream-json/agent-spawn-stream-json-broker.proxy.ts` — uses `process.stderr` · **needs** GN3 node global `setImmediate`; GN3 node global `queueMicrotask`
- `packages/orchestrator/src/brokers/agent/spawn-stream-json/agent-spawn-stream-json-broker.test.ts` — **needs** GN3 node global `setImmediate`
- `packages/orchestrator/src/brokers/agent/spawn-stream-json/agent-spawn-stream-json-broker.ts` — **needs** GN1 process env snapshot (whole `process.env`)

**orchestrator-B03** — waits on GN3, GN5

- `packages/orchestrator/src/brokers/agent/spawn-unified/agent-spawn-unified-broker.proxy.ts` — imports `readline` · **needs** GN5 node `stream`; GN3 node global `setImmediate`
- `packages/orchestrator/src/brokers/agent/spawn-unified/agent-spawn-unified-broker.test.ts` — **needs** GN3 node global `setImmediate`

**orchestrator-B04** — waits on GN3

- `packages/orchestrator/src/brokers/chat/main-session-tail/chat-main-session-tail-broker.test.ts` — **needs** GN3 node global `setImmediate`
- `packages/orchestrator/src/brokers/chat/replay-jsonl-read/chat-replay-jsonl-read-broker.ts` — uses `setTimeout`

**orchestrator-B05** — waits on GN3

- `packages/orchestrator/src/brokers/chat/spawn/chat-spawn-broker.proxy.ts` — imports `os`, `path` · uses `crypto`, `process.stderr`
- `packages/orchestrator/src/brokers/chat/spawn/chat-spawn-broker.test.ts` — uses `process.stderr` · **needs** GN3 node global `setImmediate`
- `packages/orchestrator/src/brokers/chat/spawn/chat-spawn-broker.ts` — uses `process.stderr`

**orchestrator-B06** — waits on GN3

- `packages/orchestrator/src/brokers/chat/stream-process-handle/chat-stream-process-handle-broker.proxy.ts` — uses `crypto`
- `packages/orchestrator/src/brokers/chat/stream-process-handle/chat-stream-process-handle-broker.test.ts` — **needs** GN3 node global `setImmediate`
- `packages/orchestrator/src/brokers/chat/stream-process-handle/chat-stream-process-handle-broker.ts` — uses `crypto`, `process.stderr`

**orchestrator-B07** — waits on GN3

- `packages/orchestrator/src/brokers/chat/subagent-tail/chat-subagent-tail-broker.test.ts` — **needs** GN3 node global `setImmediate`
- `packages/orchestrator/src/brokers/chat/subagent-tail/chat-subagent-tail-broker.ts` — uses `process.env.X`, `process.stderr`

**orchestrator-B08**

- `packages/orchestrator/src/brokers/dispatch-hold/reject/dispatch-hold-reject-broker.ts` — uses `process.stderr`
- `packages/orchestrator/src/brokers/guild/add/guild-add-broker.proxy.ts` — uses `crypto`
- `packages/orchestrator/src/brokers/guild/add/guild-add-broker.ts` — uses `crypto`

**orchestrator-B09**

- `packages/orchestrator/src/brokers/process/is-alive/process-is-alive-broker.proxy.ts` — **needs** GN2a process.<object>
- `packages/orchestrator/src/brokers/quest/advance/quest-advance-broker.proxy.ts` — uses `crypto`
- `packages/orchestrator/src/brokers/quest/advance/quest-advance-broker.ts` — uses `crypto`

**orchestrator-B10**

- `packages/orchestrator/src/brokers/quest/build-relay-graph/quest-build-relay-graph-broker.proxy.ts` — uses `crypto`
- `packages/orchestrator/src/brokers/quest/build-relay-graph/quest-build-relay-graph-broker.ts` — uses `crypto`
- `packages/orchestrator/src/brokers/quest/create/quest-create-broker.ts` — uses `crypto`
- `packages/orchestrator/src/brokers/quest/find-quest-path/match-candidates-layer-broker.proxy.ts` — imports `fs/promises`

**orchestrator-B11**

- `packages/orchestrator/src/brokers/quest/get-next-step/build-spawn-instruction-layer-broker.proxy.ts` — uses `process.stderr`
- `packages/orchestrator/src/brokers/quest/hydrate/quest-hydrate-broker.ts` — uses `crypto`

**orchestrator-B12**

- `packages/orchestrator/src/brokers/quest/list/quest-list-broker.proxy.ts` — uses `process.stderr`
- `packages/orchestrator/src/brokers/quest/list/quest-list-broker.test.ts` — uses `process.stderr`
- `packages/orchestrator/src/brokers/quest/list/quest-list-broker.ts` — uses `process.stderr`
- `packages/orchestrator/src/brokers/quest/load/quest-load-broker.proxy.ts` — imports `fs/promises`

**orchestrator-B13** — waits on GN3

- `packages/orchestrator/src/brokers/quest/modify/quest-modify-broker.proxy.ts` — uses `crypto`
- `packages/orchestrator/src/brokers/quest/monitor-jsonl-watcher/quest-monitor-jsonl-watcher-broker.test.ts` — **needs** GN3 node global `setImmediate`
- `packages/orchestrator/src/brokers/quest/monitor-jsonl-watcher/quest-monitor-jsonl-watcher-broker.ts` — uses `process.stderr`
- `packages/orchestrator/src/brokers/quest/monitor-jsonl-watcher/scan-subagents-dir-layer-broker.test.ts` — **needs** GN3 node global `setImmediate`

**orchestrator-B14** — waits on GN3

- `packages/orchestrator/src/brokers/quest/monitor-jsonl-watcher/start-subagent-tail-layer-broker.test.ts` — **needs** GN3 node global `setImmediate`
- `packages/orchestrator/src/brokers/quest/monitor-watcher-start/quest-monitor-watcher-start-broker.test.ts` — **needs** GN3 node global `setImmediate`
- `packages/orchestrator/src/brokers/quest/node-dispatch-loop/spawn-batch-layer-broker.ts` — uses `process.stderr`

**orchestrator-B15** — waits on GN3

- `packages/orchestrator/src/brokers/quest/node-dispatch-loop/spawn-one-agent-layer-broker.proxy.ts` — uses `crypto`, `process.stderr`
- `packages/orchestrator/src/brokers/quest/node-dispatch-loop/spawn-one-agent-layer-broker.ts` — uses `crypto`, `process.stderr`
- `packages/orchestrator/src/brokers/quest/node-dispatch-runner/quest-node-dispatch-runner-broker.test.ts` — **needs** GN3 node global `setImmediate`
- `packages/orchestrator/src/brokers/quest/node-dispatch-runner/quest-node-dispatch-runner-broker.ts` — uses `process.stderr`

**orchestrator-B16** — waits on GN4

- `packages/orchestrator/src/brokers/quest/orchestration-loop/quest-orchestration-loop-broker.proxy.ts` — uses `process.stderr`
- `packages/orchestrator/src/brokers/quest/orchestration-loop/quest-orchestration-loop-broker.test.ts` — **needs** GN4 node global `AbortController`
- `packages/orchestrator/src/brokers/quest/orchestration-loop/quest-orchestration-loop-broker.ts` — uses `process.stderr`
- `packages/orchestrator/src/brokers/quest/orchestration-loop/run-chat-layer-broker.ts` — uses `process.stderr`

**orchestrator-B17** — waits on GN3

- `packages/orchestrator/src/brokers/quest/orphan-reset/quest-orphan-reset-broker.ts` — uses `process.stderr`
- `packages/orchestrator/src/brokers/quest/outbox-watch/quest-outbox-watch-broker.test.ts` — **needs** GN3 node global `setImmediate`
- `packages/orchestrator/src/brokers/quest/pause/quest-pause-broker.ts` — uses `process.stderr`

**orchestrator-B18**

- `packages/orchestrator/src/brokers/quest/queue-sync-listener/create-sync-handler-layer-broker.proxy.ts` — uses `process.stderr`
- `packages/orchestrator/src/brokers/quest/queue-sync-listener/create-sync-handler-layer-broker.ts` — uses `process.stderr`
- `packages/orchestrator/src/brokers/quest/route-scope/mint-next-family-layer-broker.proxy.ts` — uses `crypto`

**orchestrator-B19**

- `packages/orchestrator/src/brokers/quest/route-scope/quest-route-scope-broker.integration.test.ts` — uses `crypto`
- `packages/orchestrator/src/brokers/quest/route-scope/quest-route-scope-broker.proxy.ts` — uses `crypto`
- `packages/orchestrator/src/brokers/quest/route-scope/quest-route-scope-broker.ts` — uses `crypto`
- `packages/orchestrator/src/brokers/quest/user-add/quest-user-add-broker.ts` — uses `crypto`

**orchestrator-B20** — waits on GN3

- `packages/orchestrator/src/brokers/quest/with-modify-lock/quest-with-modify-lock-broker.test.ts` — uses `setTimeout`
- `packages/orchestrator/src/brokers/rate-limits/watch/rate-limits-watch-broker.test.ts` — **needs** GN3 node global `setImmediate`

**orchestrator-B21**

- `packages/orchestrator/src/brokers/smoketest/clear-prior-quests/smoketest-clear-prior-quests-broker.proxy.ts` — imports `fs/promises`
- `packages/orchestrator/src/brokers/smoketest/post-terminal-listener/create-terminal-handler-layer-broker.proxy.ts` — uses `process.stderr`
- `packages/orchestrator/src/brokers/smoketest/post-terminal-listener/create-terminal-handler-layer-broker.ts` — uses `process.stderr`

**orchestrator-B22** — waits on GN3, GN4

- `packages/orchestrator/src/brokers/smoketest/scenario-driver/create-driver-handler-layer-broker.test.ts` — **needs** GN3 node global `setImmediate`; GN4 node global `AbortController`
- `packages/orchestrator/src/brokers/smoketest/scenario-driver/create-driver-handler-layer-broker.ts` — uses `process.stderr`
- `packages/orchestrator/src/brokers/smoketest/scenario-driver/create-driver-poll-tick-layer-broker.test.ts` — **needs** GN3 node global `setImmediate`; GN4 node global `AbortController`
- `packages/orchestrator/src/brokers/smoketest/scenario-driver/create-driver-poll-tick-layer-broker.ts` — uses `process.stderr`

**orchestrator-B23** — waits on GN3, GN4

- `packages/orchestrator/src/brokers/smoketest/scenario-driver/smoketest-scenario-driver-broker.test.ts` — **needs** GN3 node global `setImmediate`
- `packages/orchestrator/src/brokers/smoketest/scenario-driver/smoketest-scenario-driver-broker.ts` — uses `setInterval`, `clearInterval` · **needs** GN4 node global `AbortController`
- `packages/orchestrator/src/brokers/smoketest/scenario-driver/smoketest-sweep-pending-work-items-layer-broker.test.ts` — **needs** GN4 node global `AbortController`

**orchestrator-B24**

- `packages/orchestrator/src/brokers/step-handler/cleanup/step-handler-cleanup-broker.ts` — uses `process.env.X`
- `packages/orchestrator/src/brokers/step-handler/riftcarver/step-handler-riftcarver-broker.proxy.ts` — uses `crypto`
- `packages/orchestrator/src/brokers/step-handler/riftcarver/step-handler-riftcarver-broker.ts` — uses `process.stderr`, `process.env.X`, `crypto`

**orchestrator-B25**

- `packages/orchestrator/src/brokers/step-handler/ward/step-handler-ward-broker.proxy.ts` — uses `crypto`
- `packages/orchestrator/src/brokers/step-handler/ward/step-handler-ward-broker.ts` — uses `process.env.X`, `crypto`

**orchestrator-B26**

- `packages/orchestrator/src/brokers/usage-ledger/scan/fold-batch-layer-broker.proxy.ts` — uses `Buffer`
- `packages/orchestrator/src/brokers/usage-ledger/scan/usage-ledger-scan-broker.proxy.ts` — uses `process.stderr`
- `packages/orchestrator/src/brokers/usage-ledger/scan/usage-ledger-scan-broker.ts` — uses `process.stderr`

**orchestrator-B27**

- `packages/orchestrator/src/brokers/usage-ledger/write/usage-ledger-write-broker.proxy.ts` — uses `process.pid`
- `packages/orchestrator/src/brokers/usage-ledger/write/usage-ledger-write-broker.ts` — uses `process.pid`

**orchestrator-B28**

- `packages/orchestrator/src/brokers/ward/detail/ward-detail-broker.ts` — uses `process.env.X`
- `packages/orchestrator/src/brokers/worktree/ensure-quest-branch/worktree-ensure-quest-branch-broker.proxy.ts` — uses `process.stderr`
- `packages/orchestrator/src/brokers/worktree/ensure-quest-branch/worktree-ensure-quest-branch-broker.ts` — uses `process.stderr`

**orchestrator-B29** — waits on GN1, GN2

- `packages/orchestrator/src/flows/orchestration-dispatch/orchestration-dispatch-flow.integration.test.ts` — **needs** GN1 process env write/delete (`setEnv`/`deleteEnv`); GN1 process env snapshot (whole `process.env`)
- `packages/orchestrator/src/flows/quest/quest-flow.integration.test.ts` — uses `crypto`
- `packages/orchestrator/src/flows/worktree/worktree-flow.integration.test.ts` — uses `process.cwd` · **needs** GN2 process.chdir

**orchestrator-B30** — waits on GN3

- `packages/orchestrator/src/responders/chat/replay/chat-replay-responder.proxy.ts` — uses `crypto`
- `packages/orchestrator/src/responders/chat/replay/chat-replay-responder.ts` — uses `crypto`
- `packages/orchestrator/src/responders/chat/start/chat-start-responder.test.ts` — **needs** GN3 node global `setImmediate`
- `packages/orchestrator/src/responders/chat/start/chat-start-responder.ts` — uses `process.stderr`

**orchestrator-B31**

- `packages/orchestrator/src/responders/comment/batch/comment-batch-responder.proxy.ts` — uses `crypto`
- `packages/orchestrator/src/responders/comment/batch/comment-batch-responder.ts` — uses `crypto`

**orchestrator-B32** — waits on GN3

- `packages/orchestrator/src/responders/execution-queue/sync-listener-bootstrap/execution-queue-sync-listener-bootstrap-responder.test.ts` — **needs** GN3 node global `setImmediate`
- `packages/orchestrator/src/responders/execution-queue/sync-listener-bootstrap/execution-queue-sync-listener-bootstrap-responder.ts` — uses `process.stderr`

**orchestrator-B33** — waits on GN3

- `packages/orchestrator/src/responders/followup-chat/start/followup-chat-start-responder.test.ts` — uses `setTimeout` · **needs** GN3 node global `setImmediate`
- `packages/orchestrator/src/responders/followup-chat/start/followup-chat-start-responder.ts` — uses `crypto`, `process.stderr`

**orchestrator-B34**

- `packages/orchestrator/src/responders/orchestration/merge/orchestration-merge-responder.proxy.ts` — uses `crypto`
- `packages/orchestrator/src/responders/orchestration/merge/orchestration-merge-responder.ts` — uses `crypto`
- `packages/orchestrator/src/responders/orchestration/pause/orchestration-pause-responder.ts` — uses `crypto`

**orchestrator-B35** — waits on GN4

- `packages/orchestrator/src/responders/orchestration/resume/orchestration-resume-responder.proxy.ts` — uses `crypto`, `process.stderr`
- `packages/orchestrator/src/responders/orchestration/resume/orchestration-resume-responder.ts` — uses `crypto` · **needs** GN4 node global `AbortController`
- `packages/orchestrator/src/responders/orchestration/start/orchestration-start-responder.proxy.ts` — imports `child_process`
- `packages/orchestrator/src/responders/orchestration/start/orchestration-start-responder.ts` — uses `crypto`

**orchestrator-B36** — waits on GN4

- `packages/orchestrator/src/responders/orchestration/start/prepare-quest-package-graph-layer-responder.proxy.ts` — imports `fs`, `path`
- `packages/orchestrator/src/responders/orchestration/startup-recovery/recover-guild-layer-responder.proxy.ts` — uses `crypto`
- `packages/orchestrator/src/responders/orchestration/startup-recovery/recover-guild-layer-responder.ts` — uses `process.stderr`, `crypto` · **needs** GN4 node global `AbortController`

**orchestrator-B37**

- `packages/orchestrator/src/responders/process-stale-watch/bootstrap/process-stale-watch-bootstrap-responder.proxy.ts` — uses `process.stderr`
- `packages/orchestrator/src/responders/process-stale-watch/bootstrap/process-stale-watch-bootstrap-responder.ts` — uses `process.stderr`

**orchestrator-B38** — waits on GN3, GN4

- `packages/orchestrator/src/responders/quest/handle-signal-back/quest-handle-signal-back-responder.integration.test.ts` — uses `crypto`
- `packages/orchestrator/src/responders/quest/modify/quest-modify-responder.proxy.ts` — uses `crypto`
- `packages/orchestrator/src/responders/quest/modify/quest-modify-responder.ts` — uses `crypto`, `process.stderr` · **needs** GN4 node global `AbortController`
- `packages/orchestrator/src/responders/quest/monitor-watcher-start/quest-monitor-watcher-start-responder.test.ts` — **needs** GN3 node global `setImmediate`

**orchestrator-B39** — waits on GN3

- `packages/orchestrator/src/responders/rate-limits/bootstrap/evaluate-hold-layer-responder.proxy.ts` — uses `process.stderr`
- `packages/orchestrator/src/responders/rate-limits/bootstrap/evaluate-hold-layer-responder.test.ts` — **needs** GN3 node global `setImmediate`
- `packages/orchestrator/src/responders/rate-limits/bootstrap/evaluate-hold-layer-responder.ts` — uses `process.stderr`

**orchestrator-B40** — waits on GN3

- `packages/orchestrator/src/responders/rate-limits/bootstrap/rate-limits-bootstrap-responder.test.ts` — **needs** GN3 node global `setImmediate`
- `packages/orchestrator/src/responders/rate-limits/bootstrap/rate-limits-bootstrap-responder.ts` — uses `process.env.X`, `process.stderr`

**orchestrator-B41** — waits on GN3

- `packages/orchestrator/src/responders/smoketest/bootstrap-listener/smoketest-bootstrap-listener-responder.test.ts` — **needs** GN3 node global `setImmediate`
- `packages/orchestrator/src/responders/smoketest/bootstrap-listener/smoketest-bootstrap-listener-responder.ts` — uses `process.stderr`
- `packages/orchestrator/src/responders/smoketest/run/enqueue-bundled-suite-layer-responder.ts` — uses `crypto`
- `packages/orchestrator/src/responders/smoketest/run/smoketest-run-responder.ts` — uses `crypto`

**orchestrator-B42**

- `packages/orchestrator/src/startup/start-orchestrator.proxy.ts` — uses `setTimeout`
- `packages/orchestrator/src/statics/codeweaver-planner/codeweaver-planner-statics.test.ts` — uses `Buffer`
- `packages/orchestrator/src/statics/codeweaver-reviewer/codeweaver-reviewer-statics.test.ts` — uses `Buffer`
- `packages/orchestrator/src/statics/codeweaver-worker/codeweaver-worker-statics.test.ts` — uses `Buffer`

**orchestrator-B43**

- `packages/orchestrator/src/statics/declared-value/declared-value-statics.test.ts` — uses `Buffer`
- `packages/orchestrator/src/statics/dumpster-create-prompt/dumpster-create-prompt-statics.test.ts` — uses `Buffer`
- `packages/orchestrator/src/statics/dumpster-hunt-prompt/dumpster-hunt-prompt-statics.test.ts` — uses `Buffer`
- `packages/orchestrator/src/statics/flow-evidence-contract/flow-evidence-contract-statics.test.ts` — uses `Buffer`

**orchestrator-B44**

- `packages/orchestrator/src/statics/flowrider-planner/flowrider-planner-statics.test.ts` — uses `Buffer`
- `packages/orchestrator/src/statics/flowrider-reviewer/flowrider-reviewer-statics.test.ts` — uses `Buffer`
- `packages/orchestrator/src/statics/flowrider-worker/flowrider-worker-statics.test.ts` — uses `Buffer`
- `packages/orchestrator/src/statics/observable-automatability/observable-automatability-statics.test.ts` — uses `Buffer`

**orchestrator-B45**

- `packages/orchestrator/src/statics/recipe-maker/recipe-maker-statics.test.ts` — uses `Buffer`
- `packages/orchestrator/src/statics/sad-path-routing/sad-path-routing-statics.test.ts` — uses `Buffer`
- `packages/orchestrator/src/statics/siege-adversarial-fixer/siege-adversarial-fixer-statics.test.ts` — uses `Buffer`
- `packages/orchestrator/src/statics/siege-adversarial-walker/siege-adversarial-walker-statics.test.ts` — uses `Buffer`

**orchestrator-B46**

- `packages/orchestrator/src/statics/siege-happy-fixer/siege-happy-fixer-statics.test.ts` — uses `Buffer`
- `packages/orchestrator/src/statics/siege-happy-walker/siege-happy-walker-statics.test.ts` — uses `Buffer`
- `packages/orchestrator/src/statics/siege-planner/siege-planner-statics.test.ts` — uses `Buffer`
- `packages/orchestrator/src/statics/siegemaster-reader/siegemaster-reader-statics.test.ts` — uses `Buffer`

**orchestrator-B47**

- `packages/orchestrator/src/statics/standards-review-concerns/standards-review-concerns-statics.test.ts` — uses `Buffer`
- `packages/orchestrator/src/statics/unit-marking/unit-marking-statics.test.ts` — uses `Buffer`
- `packages/orchestrator/src/statics/write-ingredient/write-ingredient-statics.test.ts` — uses `Buffer`

**orchestrator-B48**

- `packages/orchestrator/src/transformers/case-catalog-to-blueprint/case-catalog-to-blueprint-transformer.proxy.ts` — uses `crypto`
- `packages/orchestrator/src/transformers/case-catalog-to-blueprint/case-catalog-to-blueprint-transformer.ts` — uses `crypto`
- `packages/orchestrator/src/transformers/chat-line-process/chat-line-process-transformer.proxy.ts` — uses `crypto`
- `packages/orchestrator/src/transformers/command-chat-output-emit/command-chat-output-emit-transformer.test.ts` — uses `crypto`

**orchestrator-B49**

- `packages/orchestrator/src/transformers/command-line-to-chat-entry/command-line-to-chat-entry-transformer.test.ts` — uses `crypto`
- `packages/orchestrator/src/transformers/command-line-to-chat-entry/command-line-to-chat-entry-transformer.ts` — uses `crypto`
- `packages/orchestrator/src/transformers/family-scopes-mint/family-scopes-mint-transformer.proxy.ts` — uses `crypto`
- `packages/orchestrator/src/transformers/family-scopes-mint/family-scopes-mint-transformer.ts` — uses `crypto`

**orchestrator-B50**

- `packages/orchestrator/src/transformers/map-content-item-to-chat-entry/map-content-item-to-chat-entry-transformer.proxy.ts` — uses `crypto`
- `packages/orchestrator/src/transformers/map-content-item-to-chat-entry/map-content-item-to-chat-entry-transformer.ts` — uses `crypto`
- `packages/orchestrator/src/transformers/parse-assistant-stream-entry/parse-assistant-stream-entry-transformer.proxy.ts` — uses `crypto`
- `packages/orchestrator/src/transformers/parse-assistant-stream-entry/parse-assistant-stream-entry-transformer.ts` — uses `crypto`

**orchestrator-B51**

- `packages/orchestrator/src/transformers/parse-user-stream-entry/parse-user-stream-entry-transformer.proxy.ts` — uses `crypto`
- `packages/orchestrator/src/transformers/parse-user-stream-entry/parse-user-stream-entry-transformer.ts` — uses `crypto`
- `packages/orchestrator/src/transformers/stream-json-to-chat-entry/stream-json-to-chat-entry-transformer.proxy.ts` — uses `crypto`
- `packages/orchestrator/src/transformers/stream-json-to-chat-entry/stream-json-to-chat-entry-transformer.ts` — uses `crypto`

**orchestrator-B52** — waits on GN1, GN2

- `packages/orchestrator/test/harnesses/git-worktree-fixture/git-worktree-fixture.harness.ts` — `run({ command: 'git' })` → #gateway/bin/git `gitRun`; imports `fs`, `path` · uses `process.env.X` · **needs** GN1 process env write/delete (`setEnv`/`deleteEnv`)
- `packages/orchestrator/test/harnesses/home-directory-marker/home-directory-marker.harness.ts` — imports `fs`, `path` · uses `process.pid`
- `packages/orchestrator/test/harnesses/orchestration-environment/orchestration-environment.harness.ts` — imports `fs`, `path` · uses `process.env.X`, `process.cwd`, `setTimeout` · **needs** GN1 process env write/delete (`setEnv`/`deleteEnv`); GN1 process env snapshot (whole `process.env`); GN2 process.chdir
- `packages/orchestrator/test/harnesses/orchestration-quest/orchestration-quest.harness.ts` — `run({ command: 'git' })` → #gateway/bin/git `gitRun`; imports `crypto`, `fs`, `os`, `path` · uses `process.env.X`, `setTimeout` · **needs** GN1 process env write/delete (`setEnv`/`deleteEnv`); GN1 process env snapshot (whole `process.env`)

**orchestrator-B53** — waits on GN1

- `packages/orchestrator/test/harnesses/orchestration-queue/orchestration-queue.harness.ts` — imports `fs`, `path`
- `packages/orchestrator/test/harnesses/planned-work-disk/planned-work-disk.harness.ts` — imports `fs`
- `packages/orchestrator/test/harnesses/quest-outbox/quest-outbox.harness.ts` — imports `fs`, `path` · uses `process.env.X`, `setTimeout` · **needs** GN1 process env write/delete (`setEnv`/`deleteEnv`); GN1 process env snapshot (whole `process.env`)
- `packages/orchestrator/test/harnesses/quest-seed/quest-seed.harness.ts` — imports `fs`, `path`

**orchestrator-B54** — waits on GN1

- `packages/orchestrator/test/harnesses/rate-limits-watcher/rate-limits-watcher.harness.ts` — imports `fs`, `path` · uses `setTimeout`, `process.stderr`, `process.env.X` · **needs** GN1 process env write/delete (`setEnv`/`deleteEnv`); GN1 process env snapshot (whole `process.env`)

#### `server`

**server-Z (zod sweep).** Each file's only violation is `import … from 'zod'`; change the specifier to `'#gateway/npm/zod'` and nothing else.

- `packages/server/src/contracts/chat-output-payload/chat-output-payload-contract.ts`
- `packages/server/src/contracts/comment-batch-body/comment-batch-body-contract.test.ts`
- `packages/server/src/contracts/comment-batch-body/comment-batch-body-contract.ts`
- `packages/server/src/contracts/comment-batch-response/comment-batch-response-contract.ts`
- `packages/server/src/contracts/comment-stale-anchor/comment-stale-anchor-contract.ts`
- `packages/server/src/contracts/dev-log-event-payload/dev-log-event-payload-contract.ts`
- `packages/server/src/contracts/dev-log-line/dev-log-line-contract.ts`
- `packages/server/src/contracts/dev-log-tool-input/dev-log-tool-input-contract.ts`
- `packages/server/src/contracts/directory-browse-body/directory-browse-body-contract.ts`
- `packages/server/src/contracts/file-path/file-path-contract.ts`
- `packages/server/src/contracts/guild-add-body/guild-add-body-contract.ts`
- `packages/server/src/contracts/guild-id-body/guild-id-body-contract.ts`
- `packages/server/src/contracts/guild-id-params/guild-id-params-contract.ts`
- `packages/server/src/contracts/guild-id-query/guild-id-query-contract.ts`
- `packages/server/src/contracts/guild-message-body/guild-message-body-contract.ts`
- `packages/server/src/contracts/guild-update-body/guild-update-body-contract.ts`
- `packages/server/src/contracts/health-response/health-response-contract.ts`
- `packages/server/src/contracts/human-verdict-input/human-verdict-input-contract.ts`
- `packages/server/src/contracts/jsonl-session-line/jsonl-session-line-contract.ts`
- `packages/server/src/contracts/local-image-path-match/local-image-path-match-contract.ts`
- `packages/server/src/contracts/message-body/message-body-contract.ts`
- `packages/server/src/contracts/pasted-image-ordinal/pasted-image-ordinal-contract.ts`
- `packages/server/src/contracts/pasted-image-upload-list/pasted-image-upload-list-contract.ts`
- `packages/server/src/contracts/process-id-params/process-id-params-contract.ts`
- `packages/server/src/contracts/quest-clarify-body/quest-clarify-body-contract.ts`
- `packages/server/src/contracts/quest-get-query/quest-get-query-contract.ts`
- `packages/server/src/contracts/quest-id-params/quest-id-params-contract.ts`
- `packages/server/src/contracts/quest-new-body/quest-new-body-contract.ts`
- `packages/server/src/contracts/quest-projection-params/quest-projection-params-contract.ts`
- `packages/server/src/contracts/quest-riftcarver-detail-params/quest-riftcarver-detail-params-contract.ts`
- `packages/server/src/contracts/quest-summary-params/quest-summary-params-contract.ts`
- `packages/server/src/contracts/quest-user-add-body/quest-user-add-body-contract.ts`
- `packages/server/src/contracts/quest-ward-detail-params/quest-ward-detail-params-contract.ts`
- `packages/server/src/contracts/reconcile-watchers-result/reconcile-watchers-result-contract.ts`
- `packages/server/src/contracts/responder-result/responder-result-contract.ts`
- `packages/server/src/contracts/session-id-params/session-id-params-contract.ts`
- `packages/server/src/contracts/session-summary/session-summary-contract.ts`
- `packages/server/src/contracts/signal-back-input/signal-back-input-contract.ts`
- `packages/server/src/contracts/tool-name/tool-name-contract.ts`
- `packages/server/src/contracts/tooling-smoketest-run-body/tooling-smoketest-run-body-contract.ts`
- `packages/server/src/contracts/user-message/user-message-contract.ts`
- `packages/server/src/contracts/ws-client/ws-client-contract.ts`
- `packages/server/src/contracts/ws-event-data/ws-event-data-contract.ts`
- `packages/server/src/contracts/ws-incoming-message/ws-incoming-message-contract.test.ts`
- `packages/server/src/contracts/ws-incoming-message/ws-incoming-message-contract.ts`
- `packages/server/src/contracts/zod-issue-error/zod-issue-error-contract.ts`

**server-B01**

- `packages/server/src/brokers/local-image/copy/local-image-copy-broker.proxy.ts` — uses `crypto`
- `packages/server/src/brokers/local-image/copy/local-image-copy-broker.ts` — uses `process.stderr`, `crypto`

**server-B02** — waits on GN1

- `packages/server/src/brokers/pasted-image/persist/pasted-image-persist-broker.proxy.ts` — uses `Buffer`, `crypto` · **needs** GN1 process env snapshot (whole `process.env`)
- `packages/server/src/brokers/pasted-image/persist/pasted-image-persist-broker.ts` — uses `crypto`

**server-B03** — waits on GN1

- `packages/server/src/brokers/process/dev-log/process-dev-log-broker.proxy.ts` — uses `process.stdout` · **needs** GN1 process env write/delete (`setEnv`/`deleteEnv`); GN1 process env snapshot (whole `process.env`)
- `packages/server/src/brokers/quest/wait-for-session-stamp/quest-wait-for-session-stamp-broker.ts` — uses `setTimeout`

**server-B04**

- `packages/server/src/flows/directory/directory-flow.ts` — imports `hono`, `hono/utils/http-status`
- `packages/server/src/flows/health/health-flow.ts` — imports `hono`
- `packages/server/src/flows/images/images-flow.integration.test.ts` — imports `hono`
- `packages/server/src/flows/images/images-flow.ts` — imports `hono`, `hono/utils/http-status`

**server-B05**

- `packages/server/src/flows/orchestration-boot/orchestration-boot-flow.ts` — uses `process.stderr`
- `packages/server/src/flows/orchestration/orchestration-flow.ts` — imports `hono`, `hono/utils/http-status`
- `packages/server/src/flows/process/process-flow.ts` — imports `hono`, `hono/utils/http-status`
- `packages/server/src/flows/quest-driven-watchers/quest-driven-watchers-flow.ts` — uses `process.stderr`

**server-B06** — waits on GN1

- `packages/server/src/flows/quest/quest-flow.integration.test.ts` — uses `process.env.X` · **needs** GN1 process env write/delete (`setEnv`/`deleteEnv`); GN1 process env snapshot (whole `process.env`)
- `packages/server/src/flows/quest/quest-flow.ts` — imports `hono`, `hono/utils/http-status` · uses `process.env.X`
- `packages/server/src/flows/rate-limits/rate-limits-flow.ts` — imports `hono`, `hono/utils/http-status`
- `packages/server/src/flows/server/server-flow.ts` — imports `hono`

**server-B07** — waits on GN1

- `packages/server/src/flows/session/session-flow.ts` — imports `hono`, `hono/utils/http-status`
- `packages/server/src/flows/tooling/tooling-flow.integration.test.ts` — **needs** GN1 process env snapshot (whole `process.env`); GN1 process env write/delete (`setEnv`/`deleteEnv`)
- `packages/server/src/flows/tooling/tooling-flow.ts` — imports `hono`, `hono/utils/http-status` · uses `process.env.X`

**server-B08**

- `packages/server/src/responders/quest-driven-watchers/bootstrap/quest-driven-watchers-bootstrap-responder.ts` — uses `setInterval`, `clearInterval`
- `packages/server/src/responders/quest/new/quest-new-responder.proxy.ts` — uses `crypto`
- `packages/server/src/responders/quest/new/quest-new-responder.ts` — uses `crypto`, `process.stderr`

**server-B09** — waits on GN2, GN4

- `packages/server/src/responders/server/init/server-init-responder.proxy.ts` — **needs** GN2 process.removeAllListeners; GN4 node global `Request`
- `packages/server/src/responders/server/init/server-init-responder.test.ts` — uses `setTimeout`
- `packages/server/src/responders/server/init/server-init-responder.ts` — uses `URL`, `process.stdout`, `setInterval`, `process.on(signal)`, `clearInterval`, `process.exit`

**server-B10** — waits on GN1

- `packages/server/test/harnesses/server-app/server-app.harness.ts` — imports `node:fs`, `crypto`, `fs`, `os`, `path`, `zod` · uses `process.env.X`, `setTimeout` · **needs** GN1 process env write/delete (`setEnv`/`deleteEnv`); GN1 process env snapshot (whole `process.env`)

#### `session-forensics`

**session-forensics-Z (zod sweep).** Each file's only violation is `import … from 'zod'`; change the specifier to `'#gateway/npm/zod'` and nothing else.

- `packages/session-forensics/src/contracts/bucket-minutes/bucket-minutes-contract.ts`
- `packages/session-forensics/src/contracts/digest-command/digest-command-contract.ts`
- `packages/session-forensics/src/contracts/gap-floor-seconds/gap-floor-seconds-contract.ts`
- `packages/session-forensics/src/contracts/gap-report/gap-report-contract.ts`
- `packages/session-forensics/src/contracts/iso-timestamp/iso-timestamp-contract.ts`
- `packages/session-forensics/src/contracts/subagent-meta/subagent-meta-contract.ts`
- `packages/session-forensics/src/contracts/subagent-roster-row/subagent-roster-row-contract.ts`
- `packages/session-forensics/src/contracts/subagent-window/subagent-window-contract.ts`
- `packages/session-forensics/src/contracts/time-bucket/time-bucket-contract.ts`
- `packages/session-forensics/src/contracts/token-usage/token-usage-contract.ts`
- `packages/session-forensics/src/contracts/tool-brief/tool-brief-contract.ts`
- `packages/session-forensics/src/contracts/track-coverage/track-coverage-contract.ts`
- `packages/session-forensics/src/contracts/transcript-record-content-block/transcript-record-content-block-contract.ts`
- `packages/session-forensics/src/contracts/transcript-record-tool-input-key/transcript-record-tool-input-key-contract.ts`
- `packages/session-forensics/src/contracts/transcript-record-usage-key/transcript-record-usage-key-contract.ts`
- `packages/session-forensics/src/contracts/transcript-record/transcript-record-contract.ts`
- `packages/session-forensics/src/contracts/transcript-summary/transcript-summary-contract.ts`
- `packages/session-forensics/src/contracts/turn-gap/turn-gap-contract.ts`
- `packages/session-forensics/src/contracts/verification-unit/verification-unit-contract.ts`
- `packages/session-forensics/src/contracts/work-item-index-row/work-item-index-row-contract.ts`

**session-forensics-B01** — waits on GN2

- `packages/session-forensics/src/flows/session-forensics/session-forensics-flow.integration.test.ts` — uses `process.cwd` · **needs** GN2 process.chdir
- `packages/session-forensics/src/startup/start-session-forensics.integration.test.ts` — uses `process.stdout`, `process.argv`, `process.stderr`, `process.exitCode`, `process.exitCode=` · **needs** GN2a process.<object>
- `packages/session-forensics/src/startup/start-session-forensics.ts` — uses `process.argv`, `process.stdout`, `process.stderr`, `process.exitCode=`

**session-forensics-B02**

- `packages/session-forensics/test/harnesses/claude-transcript/claude-transcript.harness.ts` — imports `node:fs`, `node:path` · uses `process.pid`

#### `tooling`

**tooling-Z (zod sweep).** Each file's only violation is `import … from 'zod'`; change the specifier to `'#gateway/npm/zod'` and nothing else.

- `packages/tooling/src/contracts/absolute-file-path/absolute-file-path-contract.ts`
- `packages/tooling/src/contracts/adapter-analysis/adapter-analysis-contract.ts`
- `packages/tooling/src/contracts/adapter-caller/adapter-caller-contract.ts`
- `packages/tooling/src/contracts/adapter-census/adapter-census-contract.ts`
- `packages/tooling/src/contracts/adapter-logic-reason/adapter-logic-reason-contract.ts`
- `packages/tooling/src/contracts/adapter-record/adapter-record-contract.ts`
- `packages/tooling/src/contracts/catch-all-site/catch-all-site-contract.ts`
- `packages/tooling/src/contracts/census-args/census-args-contract.ts`
- `packages/tooling/src/contracts/census-count/census-count-contract.ts`
- `packages/tooling/src/contracts/census-file-kind/census-file-kind-contract.ts`
- `packages/tooling/src/contracts/census-format/census-format-contract.ts`
- `packages/tooling/src/contracts/census-package/census-package-contract.ts`
- `packages/tooling/src/contracts/census-path/census-path-contract.ts`
- `packages/tooling/src/contracts/census-repo-layout/census-repo-layout-contract.ts`
- `packages/tooling/src/contracts/census-root-package/census-root-package-contract.ts`
- `packages/tooling/src/contracts/census-source-entry/census-source-entry-contract.ts`
- `packages/tooling/src/contracts/command-result/command-result-contract.ts`
- `packages/tooling/src/contracts/duplicate-literal-report/duplicate-literal-report-contract.ts`
- `packages/tooling/src/contracts/exit-code/exit-code-contract.ts`
- `packages/tooling/src/contracts/export-name/export-name-contract.ts`
- `packages/tooling/src/contracts/gateway-export/gateway-export-contract.ts`
- `packages/tooling/src/contracts/gateway-implementation/gateway-implementation-contract.ts`
- `packages/tooling/src/contracts/gateway-module-dir/gateway-module-dir-contract.ts`
- `packages/tooling/src/contracts/glob-pattern/glob-pattern-contract.ts`
- `packages/tooling/src/contracts/import-origin/import-origin-contract.ts`
- `packages/tooling/src/contracts/literal-occurrence/literal-occurrence-contract.ts`
- `packages/tooling/src/contracts/literal-type/literal-type-contract.ts`
- `packages/tooling/src/contracts/literal-value/literal-value-contract.ts`
- `packages/tooling/src/contracts/module-specifier/module-specifier-contract.ts`
- `packages/tooling/src/contracts/occurrence-threshold/occurrence-threshold-contract.ts`
- `packages/tooling/src/contracts/outside-call/outside-call-contract.ts`
- `packages/tooling/src/contracts/package-census/package-census-contract.ts`
- `packages/tooling/src/contracts/process-output/process-output-contract.ts`
- `packages/tooling/src/contracts/proxy-catch-all/proxy-catch-all-contract.ts`
- `packages/tooling/src/contracts/source-code/source-code-contract.ts`
- `packages/tooling/src/contracts/source-facts/source-facts-contract.ts`
- `packages/tooling/src/contracts/test-directory-path/test-directory-path-contract.ts`
- `packages/tooling/src/contracts/test-guild-name/test-guild-name-contract.ts`

**tooling-B01**

- `packages/tooling/bin/adapter-census.ts` — uses `process.stderr`, `process.exit`
- `packages/tooling/bin/detect-duplicate-primitives.ts` — uses `process.stderr`, `process.exit`

**tooling-B02**

- `packages/tooling/src/contracts/exec-error/exec-error-contract.test.ts` — uses `Buffer`
- `packages/tooling/src/contracts/exec-error/exec-error-contract.ts` — imports `zod` · uses `Buffer`
- `packages/tooling/src/contracts/exec-error/exec-error.stub.ts` — uses `Buffer`

**tooling-B03**

- `packages/tooling/src/responders/adapter-census/run/adapter-census-run-responder.proxy.ts` — uses `process.stdout`
- `packages/tooling/src/responders/adapter-census/run/adapter-census-run-responder.ts` — uses `process.stdout`

**tooling-B04**

- `packages/tooling/src/responders/primitive-duplicate-detection/run/primitive-duplicate-detection-run-responder.proxy.ts` — uses `process.stdout`
- `packages/tooling/src/responders/primitive-duplicate-detection/run/primitive-duplicate-detection-run-responder.ts` — uses `process.stdout`

**tooling-B05**

- `packages/tooling/src/startup/start-adapter-census.ts` — uses `process.argv`
- `packages/tooling/src/startup/start-primitive-duplicate-detection.ts` — uses `process.argv`

**tooling-B06**

- `packages/tooling/test/harnesses/adapter-census/adapter-census.harness.ts` — imports `path`, `child_process` · uses `process.cwd`
- `packages/tooling/test/harnesses/tooling-runner/tooling-runner.harness.ts` — imports `path`, `child_process` · uses `process.cwd`

#### `shared`

**shared-Z (zod sweep).** Each file's only violation is `import … from 'zod'`; change the specifier to `'#gateway/npm/zod'` and nothing else.

- `packages/shared/src/@types/stub-argument.test.ts`
- `packages/shared/src/@types/stub-argument.type.ts`
- `packages/shared/src/contracts/absolute-file-path/absolute-file-path-contract.ts`
- `packages/shared/src/contracts/adapter-result/adapter-result-contract.ts`
- `packages/shared/src/contracts/add-quest-input/add-quest-input-contract.ts`
- `packages/shared/src/contracts/add-quest-result/add-quest-result-contract.ts`
- `packages/shared/src/contracts/agent-id/agent-id-contract.ts`
- `packages/shared/src/contracts/agent-prompt-result/agent-prompt-result-contract.ts`
- `packages/shared/src/contracts/array-index/array-index-contract.ts`
- `packages/shared/src/contracts/ask-user-question-response/ask-user-question-response-contract.ts`
- `packages/shared/src/contracts/ask-user-question/ask-user-question-contract.ts`
- `packages/shared/src/contracts/assistant-content-block-param/assistant-content-block-param-contract.ts`
- `packages/shared/src/contracts/assistant-stream-line/assistant-stream-line-contract.ts`
- `packages/shared/src/contracts/base-branch-name/base-branch-name-contract.ts`
- `packages/shared/src/contracts/bin-entry/bin-entry-contract.ts`
- `packages/shared/src/contracts/blight-checklist-item-id/blight-checklist-item-id-contract.ts`
- `packages/shared/src/contracts/blight-checklist-item/blight-checklist-item-contract.ts`
- `packages/shared/src/contracts/blight-checklist/blight-checklist-contract.ts`
- `packages/shared/src/contracts/blight-concern/blight-concern-contract.ts`
- `packages/shared/src/contracts/blight-disposition/blight-disposition-contract.ts`
- `packages/shared/src/contracts/blocked-reason/blocked-reason-contract.ts`
- `packages/shared/src/contracts/bucket-start-key/bucket-start-key-contract.ts`
- `packages/shared/src/contracts/bus-emitter-site/bus-emitter-site-contract.ts`
- `packages/shared/src/contracts/bus-subscriber-file/bus-subscriber-file-contract.ts`
- `packages/shared/src/contracts/chat-entry/chat-entry-contract.ts`
- `packages/shared/src/contracts/claude-queue-response/claude-queue-response-contract.ts`
- `packages/shared/src/contracts/comment-batch-entry/comment-batch-entry-contract.ts`
- `packages/shared/src/contracts/comment-text/comment-text-contract.ts`
- `packages/shared/src/contracts/completed-count/completed-count-contract.ts`
- `packages/shared/src/contracts/config-index/config-index-contract.ts`
- `packages/shared/src/contracts/content-text/content-text-contract.ts`
- `packages/shared/src/contracts/contract-name/contract-name-contract.ts`
- `packages/shared/src/contracts/css-font-family/css-font-family-contract.ts`
- `packages/shared/src/contracts/css-pixels/css-pixels-contract.ts`
- `packages/shared/src/contracts/design-decision-id/design-decision-id-contract.ts`
- `packages/shared/src/contracts/design-decision/design-decision-contract.ts`
- `packages/shared/src/contracts/direct-call-edge/direct-call-edge-contract.ts`
- `packages/shared/src/contracts/directory-entry/directory-entry-contract.ts`
- `packages/shared/src/contracts/dispatch-hold/dispatch-hold-contract.ts`
- `packages/shared/src/contracts/dispatch-state/dispatch-state-contract.ts`
- `packages/shared/src/contracts/display-header/display-header-contract.ts`
- `packages/shared/src/contracts/document-block-param/document-block-param-contract.ts`
- `packages/shared/src/contracts/dungeonmaster-home-cwd/dungeonmaster-home-cwd-contract.ts`
- `packages/shared/src/contracts/error-message/error-message-contract.ts`
- `packages/shared/src/contracts/event-bus-context/event-bus-context-contract.ts`
- `packages/shared/src/contracts/event-bus/event-bus-contract.ts`
- `packages/shared/src/contracts/exec-result/exec-result-contract.ts`
- `packages/shared/src/contracts/exit-code/exit-code-contract.ts`
- `packages/shared/src/contracts/extracted-metadata/extracted-metadata-contract.ts`
- `packages/shared/src/contracts/file-bus-edge/file-bus-edge-contract.ts`
- `packages/shared/src/contracts/file-contents/file-contents-contract.ts`
- `packages/shared/src/contracts/file-count/file-count-contract.ts`
- `packages/shared/src/contracts/file-name/file-name-contract.ts`
- `packages/shared/src/contracts/file-path/file-path-contract.ts`
- `packages/shared/src/contracts/file-write-call/file-write-call-contract.ts`
- `packages/shared/src/contracts/floor-name/floor-name-contract.ts`
- `packages/shared/src/contracts/flow-edge-id/flow-edge-id-contract.ts`
- `packages/shared/src/contracts/flow-edge-ref/flow-edge-ref-contract.ts`
- `packages/shared/src/contracts/flow-edge/flow-edge-contract.ts`
- `packages/shared/src/contracts/flow-id/flow-id-contract.ts`
- `packages/shared/src/contracts/flow-node-id/flow-node-id-contract.ts`
- `packages/shared/src/contracts/flow-node-type/flow-node-type-contract.ts`
- `packages/shared/src/contracts/flow-node/flow-node-contract.ts`
- `packages/shared/src/contracts/flow-observable/flow-observable-contract.ts`
- `packages/shared/src/contracts/flow-off-map-signoff/flow-off-map-signoff-contract.ts`
- `packages/shared/src/contracts/flow-recipe-name/flow-recipe-name-contract.ts`
- `packages/shared/src/contracts/flow-recipe/flow-recipe-contract.ts`
- `packages/shared/src/contracts/flow-type/flow-type-contract.ts`
- `packages/shared/src/contracts/flow/flow-contract.ts`
- `packages/shared/src/contracts/folder-config/folder-config-contract.ts`
- `packages/shared/src/contracts/folder-dependency-tree/folder-dependency-tree-contract.ts`
- `packages/shared/src/contracts/folder-type/folder-type-contract.ts`
- `packages/shared/src/contracts/gateway-imports-map/gateway-imports-map-contract.ts`
- `packages/shared/src/contracts/gateway-lint-config/gateway-lint-config-contract.ts`
- `packages/shared/src/contracts/get-quest-input/get-quest-input-contract.ts`
- `packages/shared/src/contracts/get-quest-result/get-quest-result-contract.ts`
- `packages/shared/src/contracts/glob-pattern/glob-pattern-contract.ts`
- `packages/shared/src/contracts/guild-config/guild-config-contract.ts`
- `packages/shared/src/contracts/guild-id/guild-id-contract.ts`
- `packages/shared/src/contracts/guild-list-item/guild-list-item-contract.ts`
- `packages/shared/src/contracts/guild-name/guild-name-contract.ts`
- `packages/shared/src/contracts/guild-path-cwd/guild-path-cwd-contract.ts`
- `packages/shared/src/contracts/guild-path/guild-path-contract.ts`
- `packages/shared/src/contracts/guild/guild-contract.ts`
- `packages/shared/src/contracts/hex-color/hex-color-contract.ts`
- `packages/shared/src/contracts/http-edge/http-edge-contract.ts`
- `packages/shared/src/contracts/identifier/identifier-contract.ts`
- `packages/shared/src/contracts/image-block-param/image-block-param-contract.ts`
- `packages/shared/src/contracts/import-edge/import-edge-contract.ts`
- `packages/shared/src/contracts/import-path/import-path-contract.ts`
- `packages/shared/src/contracts/install-action/install-action-contract.ts`
- `packages/shared/src/contracts/install-context/install-context-contract.ts`
- `packages/shared/src/contracts/install-message/install-message-contract.ts`
- `packages/shared/src/contracts/install-result/install-result-contract.ts`
- `packages/shared/src/contracts/item-with-id/item-with-id-contract.ts`
- `packages/shared/src/contracts/line-count/line-count-contract.ts`
- `packages/shared/src/contracts/mcp-caller-context/mcp-caller-context-contract.ts`
- `packages/shared/src/contracts/method-domain-group/method-domain-group-contract.ts`
- `packages/shared/src/contracts/modify-quest-input/modify-quest-input-contract.ts`
- `packages/shared/src/contracts/modify-quest-result/modify-quest-result-contract.ts`
- `packages/shared/src/contracts/module-path/module-path-contract.ts`
- `packages/shared/src/contracts/network-port/network-port-contract.ts`
- `packages/shared/src/contracts/normalized-line/normalized-line-contract.ts`
- `packages/shared/src/contracts/observable-id/observable-id-contract.ts`
- `packages/shared/src/contracts/observable-origin/observable-origin-contract.ts`
- `packages/shared/src/contracts/operation-item-id/operation-item-id-contract.ts`
- `packages/shared/src/contracts/operation-item/operation-item-contract.ts`
- `packages/shared/src/contracts/operation-plan-id/operation-plan-id-contract.ts`
- `packages/shared/src/contracts/operation-plan-piece-id/operation-plan-piece-id-contract.ts`
- `packages/shared/src/contracts/operation-plan-piece/operation-plan-piece-contract.ts`
- `packages/shared/src/contracts/operation-plan/operation-plan-contract.ts`
- `packages/shared/src/contracts/orchestration-event-type/orchestration-event-type-contract.ts`
- `packages/shared/src/contracts/orchestration-mode/orchestration-mode-contract.ts`
- `packages/shared/src/contracts/orchestration-slot/orchestration-slot-contract.ts`
- `packages/shared/src/contracts/orchestration-status/orchestration-status-contract.ts`
- `packages/shared/src/contracts/outcome-type/outcome-type-contract.ts`
- `packages/shared/src/contracts/package-graph-entry/package-graph-entry-contract.ts`
- `packages/shared/src/contracts/package-json/package-json-contract.ts`
- `packages/shared/src/contracts/package-name/package-name-contract.ts`
- `packages/shared/src/contracts/package-type/package-type-contract.ts`
- `packages/shared/src/contracts/package-type/package-type.stub.ts`
- `packages/shared/src/contracts/pasted-image-media-type/pasted-image-media-type-contract.ts`
- `packages/shared/src/contracts/pasted-image-upload/pasted-image-upload-contract.ts`
- `packages/shared/src/contracts/path-segment/path-segment-contract.ts`
- `packages/shared/src/contracts/piece-id/piece-id-contract.ts`
- `packages/shared/src/contracts/port-kill-listener-result/port-kill-listener-result-contract.ts`
- `packages/shared/src/contracts/process-id/process-id-contract.ts`
- `packages/shared/src/contracts/process-signal/process-signal-contract.ts`
- `packages/shared/src/contracts/project-config/project-config-contract.ts`
- `packages/shared/src/contracts/project-root-cwd/project-root-cwd-contract.ts`
- `packages/shared/src/contracts/qa-checklist-item-id/qa-checklist-item-id-contract.ts`
- `packages/shared/src/contracts/qa-checklist-item/qa-checklist-item-contract.ts`
- `packages/shared/src/contracts/qa-checklist-kind/qa-checklist-kind-contract.ts`
- `packages/shared/src/contracts/qa-checklist/qa-checklist-contract.ts`
- `packages/shared/src/contracts/qa-off-map-family/qa-off-map-family-contract.ts`
- `packages/shared/src/contracts/qa-walk-path/qa-walk-path-contract.ts`
- `packages/shared/src/contracts/quest-blight-ledger-entry/quest-blight-ledger-entry-contract.ts`
- `packages/shared/src/contracts/quest-branch-name/quest-branch-name-contract.ts`
- `packages/shared/src/contracts/quest-comment-id/quest-comment-id-contract.ts`
- `packages/shared/src/contracts/quest-comment/quest-comment-contract.ts`
- `packages/shared/src/contracts/quest-contract-entry-id/quest-contract-entry-id-contract.ts`
- `packages/shared/src/contracts/quest-contract-entry/quest-contract-entry-contract.ts`
- `packages/shared/src/contracts/quest-contract-kind/quest-contract-kind-contract.ts`
- `packages/shared/src/contracts/quest-contract-property/quest-contract-property-contract.ts`
- `packages/shared/src/contracts/quest-contract-status/quest-contract-status-contract.ts`
- `packages/shared/src/contracts/quest-list-item/quest-list-item-contract.ts`
- `packages/shared/src/contracts/quest-list-result/quest-list-result-contract.ts`
- `packages/shared/src/contracts/quest-note-id/quest-note-id-contract.ts`
- `packages/shared/src/contracts/quest-note-kind/quest-note-kind-contract.ts`
- `packages/shared/src/contracts/quest-note/quest-note-contract.ts`
- `packages/shared/src/contracts/quest-package-entry/quest-package-entry-contract.ts`
- `packages/shared/src/contracts/quest-projection/quest-projection-contract.ts`
- `packages/shared/src/contracts/quest-queue-entry/quest-queue-entry-contract.ts`
- `packages/shared/src/contracts/quest-section/quest-section-contract.ts`
- `packages/shared/src/contracts/quest-session/quest-session-contract.ts`
- `packages/shared/src/contracts/quest-source/quest-source-contract.ts`
- `packages/shared/src/contracts/quest-stage/quest-stage-contract.ts`
- `packages/shared/src/contracts/quest-status-metadata/quest-status-metadata-contract.ts`
- `packages/shared/src/contracts/quest-status/quest-status-contract.ts`
- `packages/shared/src/contracts/quest-summary-debt/quest-summary-debt-contract.ts`
- `packages/shared/src/contracts/quest-summary-flow/quest-summary-flow-contract.ts`
- `packages/shared/src/contracts/quest-summary-note-group/quest-summary-note-group-contract.ts`
- `packages/shared/src/contracts/quest-summary-observable/quest-summary-observable-contract.ts`
- `packages/shared/src/contracts/quest-summary-track-counts/quest-summary-track-counts-contract.ts`
- `packages/shared/src/contracts/quest-summary/quest-summary-contract.ts`
- `packages/shared/src/contracts/quest-title/quest-title-contract.ts`
- `packages/shared/src/contracts/quest-type/quest-type-contract.ts`
- `packages/shared/src/contracts/quest-work-item-id/quest-work-item-id-contract.ts`
- `packages/shared/src/contracts/quest/quest-contract.ts`
- `packages/shared/src/contracts/rate-limit-window/rate-limit-window-contract.ts`
- `packages/shared/src/contracts/rate-limits-history-line/rate-limits-history-line-contract.ts`
- `packages/shared/src/contracts/rate-limits-snapshot/rate-limits-snapshot-contract.ts`
- `packages/shared/src/contracts/redacted-thinking-block-param/redacted-thinking-block-param-contract.ts`
- `packages/shared/src/contracts/related-data-item/related-data-item-contract.ts`
- `packages/shared/src/contracts/relative-file-path/relative-file-path-contract.ts`
- `packages/shared/src/contracts/repo-relative-path/repo-relative-path-contract.ts`
- `packages/shared/src/contracts/repo-root-cwd/repo-root-cwd-contract.ts`
- `packages/shared/src/contracts/responder-annotation-map/responder-annotation-map-contract.ts`
- `packages/shared/src/contracts/responder-annotation/responder-annotation-contract.ts`
- `packages/shared/src/contracts/result-stream-line/result-stream-line-contract.ts`
- `packages/shared/src/contracts/riftcarver-result/riftcarver-result-contract.ts`
- `packages/shared/src/contracts/route-metadata/route-metadata-contract.ts`
- `packages/shared/src/contracts/routed-graph-node-key/routed-graph-node-key-contract.ts`
- `packages/shared/src/contracts/routed-graph-outcome-word/routed-graph-outcome-word-contract.ts`
- `packages/shared/src/contracts/routed-graph/routed-graph-contract.ts`
- `packages/shared/src/contracts/search-result-block-param/search-result-block-param-contract.ts`
- `packages/shared/src/contracts/server-route-call-site/server-route-call-site-contract.ts`
- `packages/shared/src/contracts/session-id/session-id-contract.ts`
- `packages/shared/src/contracts/session-list-item/session-list-item-contract.ts`
- `packages/shared/src/contracts/siege-instance-id/siege-instance-id-contract.ts`
- `packages/shared/src/contracts/siege-run-id/siege-run-id-contract.ts`
- `packages/shared/src/contracts/skipped-quest-file/skipped-quest-file-contract.ts`
- `packages/shared/src/contracts/slot-count/slot-count-contract.ts`
- `packages/shared/src/contracts/slot-index/slot-index-contract.ts`
- `packages/shared/src/contracts/smoketest-case-result/smoketest-case-result-contract.ts`
- `packages/shared/src/contracts/smoketest-run-id/smoketest-run-id-contract.ts`
- `packages/shared/src/contracts/smoketest-suite/smoketest-suite-contract.ts`
- `packages/shared/src/contracts/spawner-type/spawner-type-contract.ts`
- `packages/shared/src/contracts/state-writes-result/state-writes-result-contract.ts`
- `packages/shared/src/contracts/step-chunk-size/step-chunk-size-contract.ts`
- `packages/shared/src/contracts/step-name/step-name-contract.ts`
- `packages/shared/src/contracts/stream-json-line/stream-json-line-contract.ts`
- `packages/shared/src/contracts/stream-signal-kind/stream-signal-kind-contract.ts`
- `packages/shared/src/contracts/summary-stream-line/summary-stream-line-contract.ts`
- `packages/shared/src/contracts/system-init-stream-line/system-init-stream-line-contract.ts`
- `packages/shared/src/contracts/tail-file-call/tail-file-call-contract.ts`
- `packages/shared/src/contracts/text-block-param/text-block-param-contract.ts`
- `packages/shared/src/contracts/thinking-block-param/thinking-block-param-contract.ts`
- `packages/shared/src/contracts/timeout-ms/timeout-ms-contract.ts`
- `packages/shared/src/contracts/tool-reference-block-param/tool-reference-block-param-contract.ts`
- `packages/shared/src/contracts/tool-result-block-param/tool-result-block-param-contract.ts`
- `packages/shared/src/contracts/tool-result-content-block-param/tool-result-content-block-param-contract.ts`
- `packages/shared/src/contracts/tool-use-block-param/tool-use-block-param-contract.ts`
- `packages/shared/src/contracts/tooling-requirement-id/tooling-requirement-id-contract.ts`
- `packages/shared/src/contracts/tooling-requirement/tooling-requirement-contract.ts`
- `packages/shared/src/contracts/topological-depth/topological-depth-contract.ts`
- `packages/shared/src/contracts/total-count/total-count-contract.ts`
- `packages/shared/src/contracts/unit-id/unit-id-contract.ts`
- `packages/shared/src/contracts/unit-mark/unit-mark-contract.ts`
- `packages/shared/src/contracts/unit-observation-fields/unit-observation-fields-contract.ts`
- `packages/shared/src/contracts/unit-observation/unit-observation-contract.ts`
- `packages/shared/src/contracts/url-slug/url-slug-contract.ts`
- `packages/shared/src/contracts/usage-bucket/usage-bucket-contract.ts`
- `packages/shared/src/contracts/usage-ledger/usage-ledger-contract.ts`
- `packages/shared/src/contracts/user-input/user-input-contract.ts`
- `packages/shared/src/contracts/user-text-stream-line/user-text-stream-line-contract.ts`
- `packages/shared/src/contracts/user-tool-result-stream-line/user-tool-result-stream-line-contract.ts`
- `packages/shared/src/contracts/verification-track/verification-track-contract.ts`
- `packages/shared/src/contracts/verify-quest-check/verify-quest-check-contract.ts`
- `packages/shared/src/contracts/ward-detail/ward-detail-contract.ts`
- `packages/shared/src/contracts/ward-queue-response/ward-queue-response-contract.ts`
- `packages/shared/src/contracts/ward-result/ward-result-contract.ts`
- `packages/shared/src/contracts/ward-run-id/ward-run-id-contract.ts`
- `packages/shared/src/contracts/web-fetch-call-site/web-fetch-call-site-contract.ts`
- `packages/shared/src/contracts/weighted-tokens/weighted-tokens-contract.ts`
- `packages/shared/src/contracts/widget-context/widget-context-contract.ts`
- `packages/shared/src/contracts/widget-edges/widget-edges-contract.ts`
- `packages/shared/src/contracts/widget-node/widget-node-contract.ts`
- `packages/shared/src/contracts/widget-tree-result/widget-tree-result-contract.ts`
- `packages/shared/src/contracts/work-item-for-upsert/work-item-for-upsert-contract.ts`
- `packages/shared/src/contracts/work-item-payload-key/work-item-payload-key-contract.ts`
- `packages/shared/src/contracts/work-item-status-metadata/work-item-status-metadata-contract.ts`
- `packages/shared/src/contracts/work-item-status/work-item-status-contract.ts`
- `packages/shared/src/contracts/work-item/work-item-contract.ts`
- `packages/shared/src/contracts/ws-edge/ws-edge-contract.ts`
- `packages/shared/src/contracts/ws-message/ws-message-contract.ts`

**shared-B01**

- `packages/shared/src/brokers/architecture/boot-tree/list-dir-entries-layer-broker.proxy.ts` — imports `fs`
- `packages/shared/src/brokers/architecture/boot-tree/read-file-contents-layer-broker.proxy.ts` — imports `fs`
- `packages/shared/src/brokers/architecture/boot-tree/startup-files-find-layer-broker.proxy.ts` — imports `fs`
- `packages/shared/src/brokers/architecture/edge-graph/import-edges-layer-broker.proxy.ts` — imports `fs`

**shared-B02**

- `packages/shared/src/brokers/architecture/edge-graph/list-ts-files-layer-broker.proxy.ts` — imports `fs`
- `packages/shared/src/brokers/architecture/edge-graph/read-file-layer-broker.proxy.ts` — imports `fs`
- `packages/shared/src/brokers/architecture/edge-graph/safe-readdir-layer-broker.proxy.ts` — imports `fs`
- `packages/shared/src/brokers/architecture/event-bus/list-ts-files-layer-broker.proxy.ts` — imports `fs`

**shared-B03**

- `packages/shared/src/brokers/architecture/event-bus/read-file-layer-broker.proxy.ts` — imports `fs`
- `packages/shared/src/brokers/architecture/event-bus/safe-readdir-layer-broker.proxy.ts` — imports `fs`
- `packages/shared/src/brokers/architecture/export-name-resolve/architecture-export-name-resolve-broker.proxy.ts` — imports `fs`
- `packages/shared/src/brokers/architecture/import-edges/architecture-import-edges-broker.proxy.ts` — imports `fs`

**shared-B04**

- `packages/shared/src/brokers/architecture/import-edges/read-source-layer-broker.proxy.ts` — imports `fs`
- `packages/shared/src/brokers/architecture/import-edges/safe-readdir-layer-broker.proxy.ts` — imports `fs`
- `packages/shared/src/brokers/architecture/orphan-detect/architecture-orphan-detect-broker.proxy.ts` — imports `fs`
- `packages/shared/src/brokers/architecture/orphan-detect/find-startup-files-layer-broker.proxy.ts` — imports `fs`

**shared-B05**

- `packages/shared/src/brokers/architecture/orphan-detect/list-walked-folder-files-layer-broker.proxy.ts` — imports `fs`
- `packages/shared/src/brokers/architecture/orphan-detect/read-source-text-layer-broker.proxy.ts` — imports `fs`
- `packages/shared/src/brokers/architecture/orphan-detect/safe-readdir-layer-broker.proxy.ts` — imports `fs`
- `packages/shared/src/brokers/architecture/orphan-detect/walk-reachable-files-layer-broker.proxy.ts` — imports `fs`

**shared-B06**

- `packages/shared/src/brokers/architecture/package-e2e-eligible-detect/read-file-optional-layer-broker.proxy.ts` — imports `fs`
- `packages/shared/src/brokers/architecture/package-e2e-eligible-detect/safe-readdir-layer-broker.proxy.ts` — imports `fs`
- `packages/shared/src/brokers/architecture/package-inventory/architecture-package-inventory-broker.proxy.ts` — imports `fs`
- `packages/shared/src/brokers/architecture/package-inventory/format-folder-content-layer-broker.proxy.ts` — imports `fs`

**shared-B07**

- `packages/shared/src/brokers/architecture/package-inventory/read-package-description-layer-broker.proxy.ts` — imports `fs`
- `packages/shared/src/brokers/architecture/package-inventory/safe-readdir-layer-broker.proxy.ts` — imports `fs`
- `packages/shared/src/brokers/architecture/package-type-detect/architecture-package-type-detect-broker.proxy.ts` — imports `fs`
- `packages/shared/src/brokers/architecture/package-type-detect/find-first-flow-file-recursive-layer-broker.proxy.ts` — imports `fs`

**shared-B08**

- `packages/shared/src/brokers/architecture/package-type-detect/has-responder-create-layer-broker.proxy.ts` — imports `fs`
- `packages/shared/src/brokers/architecture/package-type-detect/read-file-optional-layer-broker.proxy.ts` — imports `fs`
- `packages/shared/src/brokers/architecture/package-type-detect/read-package-cli-content-layer-broker.proxy.ts` — imports `fs`
- `packages/shared/src/brokers/architecture/package-type-detect/safe-readdir-layer-broker.proxy.ts` — imports `fs`

**shared-B09**

- `packages/shared/src/brokers/architecture/source-read/architecture-source-read-broker.proxy.ts` — imports `fs`
- `packages/shared/src/brokers/architecture/state-writes/list-source-files-layer-broker.proxy.ts` — imports `fs`
- `packages/shared/src/brokers/architecture/state-writes/safe-readdir-layer-broker.proxy.ts` — imports `fs`
- `packages/shared/src/brokers/architecture/widget-tree/collect-folder-files-layer-broker.proxy.ts` — imports `fs`

**shared-B10**

- `packages/shared/src/brokers/architecture/widget-tree/list-widget-files-layer-broker.proxy.ts` — imports `fs`
- `packages/shared/src/brokers/architecture/widget-tree/read-widget-source-layer-broker.proxy.ts` — imports `fs`
- `packages/shared/src/brokers/architecture/widget-tree/safe-readdir-layer-broker.proxy.ts` — imports `fs`
- `packages/shared/src/brokers/architecture/ws-edges/list-ts-files-layer-broker.proxy.ts` — imports `fs`

**shared-B11**

- `packages/shared/src/brokers/architecture/ws-edges/read-file-layer-broker.proxy.ts` — imports `fs`
- `packages/shared/src/brokers/architecture/ws-edges/safe-readdir-layer-broker.proxy.ts` — imports `fs`
- `packages/shared/src/brokers/architecture/ws-gateway/list-ts-files-layer-broker.proxy.ts` — imports `fs`
- `packages/shared/src/brokers/architecture/ws-gateway/read-file-layer-broker.proxy.ts` — imports `fs`

**shared-B12** — waits on GN1

- `packages/shared/src/brokers/architecture/ws-gateway/safe-readdir-layer-broker.proxy.ts` — imports `fs`
- `packages/shared/src/brokers/dungeonmaster-home/find/dungeonmaster-home-find-broker.proxy.ts` — **needs** GN1 process env snapshot (whole `process.env`); GN1 process env write/delete (`setEnv`/`deleteEnv`)
- `packages/shared/src/brokers/dungeonmaster-home/find/dungeonmaster-home-find-broker.ts` — uses `process.env.X`

**shared-B13** — waits on GN1

- `packages/shared/src/brokers/install/check/install-check-broker.proxy.ts` — imports `path`
- `packages/shared/src/brokers/locations/claude-config-dir-find/locations-claude-config-dir-find-broker.proxy.ts` — **needs** GN1 process env write/delete (`setEnv`/`deleteEnv`); GN1 process env snapshot (whole `process.env`)
- `packages/shared/src/brokers/locations/claude-config-dir-find/locations-claude-config-dir-find-broker.ts` — uses `process.env.X`

**shared-B14** — waits on GN1

- `packages/shared/src/brokers/port/resolve/port-resolve-broker.proxy.ts` — **needs** GN1 process env write/delete (`setEnv`/`deleteEnv`); GN1 process env snapshot (whole `process.env`)
- `packages/shared/src/brokers/port/resolve/port-resolve-broker.ts` — uses `process.env.X`

**shared-B15**

- `packages/shared/src/contracts/chat-entry/chat-entry.stub.ts` — uses `crypto`
- `packages/shared/src/gateway-workspace-imports-field.integration.test.ts` — imports `fs`, `path`

**shared-B16**

- `packages/shared/src/statics/session-snippet/session-snippet-statics.test.ts` — uses `Buffer`
- `packages/shared/src/transformers/promise-pool/promise-pool-transformer.test.ts` — uses `setTimeout`

#### `ward`

**ward-Z (zod sweep).** Each file's only violation is `import … from 'zod'`; change the specifier to `'#gateway/npm/zod'` and nothing else.

- `packages/ward/src/contracts/bin-command/bin-command-contract.ts`
- `packages/ward/src/contracts/bundle-hash/bundle-hash-contract.ts`
- `packages/ward/src/contracts/check-result/check-result-contract.ts`
- `packages/ward/src/contracts/check-status/check-status-contract.ts`
- `packages/ward/src/contracts/check-type/check-type-contract.ts`
- `packages/ward/src/contracts/cli-arg/cli-arg-contract.ts`
- `packages/ward/src/contracts/duplicate-install-display-text/duplicate-install-display-text-contract.ts`
- `packages/ward/src/contracts/duplicate-install-location/duplicate-install-location-contract.ts`
- `packages/ward/src/contracts/duplicate-install-package-name/duplicate-install-package-name-contract.ts`
- `packages/ward/src/contracts/duplicate-install-violation/duplicate-install-violation-contract.ts`
- `packages/ward/src/contracts/duration-ms/duration-ms-contract.ts`
- `packages/ward/src/contracts/error-entry/error-entry-contract.ts`
- `packages/ward/src/contracts/eslint-json-report-entry/eslint-json-report-entry-contract.ts`
- `packages/ward/src/contracts/eslint-json-report/eslint-json-report-contract.ts`
- `packages/ward/src/contracts/exported-name/exported-name-contract.ts`
- `packages/ward/src/contracts/file-timing/file-timing-contract.ts`
- `packages/ward/src/contracts/gateway-package-name/gateway-package-name-contract.ts`
- `packages/ward/src/contracts/gateway-package-names/gateway-package-names-contract.ts`
- `packages/ward/src/contracts/git-branch-name/git-branch-name-contract.ts`
- `packages/ward/src/contracts/git-relative-path/git-relative-path-contract.ts`
- `packages/ward/src/contracts/glob-pattern/glob-pattern-contract.ts`
- `packages/ward/src/contracts/imported-name/imported-name-contract.ts`
- `packages/ward/src/contracts/installed-package-manifest/installed-package-manifest-contract.ts`
- `packages/ward/src/contracts/installed-package-version/installed-package-version-contract.ts`
- `packages/ward/src/contracts/jest-json-report/jest-json-report-contract.ts`
- `packages/ward/src/contracts/manifest-entry-declaration/manifest-entry-declaration-contract.ts`
- `packages/ward/src/contracts/module-dependency/module-dependency-contract.ts`
- `packages/ward/src/contracts/module-specifier/module-specifier-contract.ts`
- `packages/ward/src/contracts/open-handle-display/open-handle-display-contract.ts`
- `packages/ward/src/contracts/open-handle/open-handle-contract.ts`
- `packages/ward/src/contracts/out-of-memory-report/out-of-memory-report-contract.ts`
- `packages/ward/src/contracts/package-json-raw/package-json-raw-contract.ts`
- `packages/ward/src/contracts/package-json/package-json-contract.ts`
- `packages/ward/src/contracts/passing-test/passing-test-contract.ts`
- `packages/ward/src/contracts/platform-crossing-chain-hop/platform-crossing-chain-hop-contract.ts`
- `packages/ward/src/contracts/platform-crossing-display-text/platform-crossing-display-text-contract.ts`
- `packages/ward/src/contracts/platform-crossing-resolve-cache-key/platform-crossing-resolve-cache-key-contract.ts`
- `packages/ward/src/contracts/platform-crossing-violation/platform-crossing-violation-contract.ts`
- `packages/ward/src/contracts/platform-crossing-walk-memo-key/platform-crossing-walk-memo-key-contract.ts`
- `packages/ward/src/contracts/platform/platform-contract.ts`
- `packages/ward/src/contracts/playwright-json-report/playwright-json-report-contract.ts`
- `packages/ward/src/contracts/project-folder/project-folder-contract.ts`
- `packages/ward/src/contracts/project-result/project-result-contract.ts`
- `packages/ward/src/contracts/raw-output/raw-output-contract.ts`
- `packages/ward/src/contracts/run-filters/run-filters-contract.ts`
- `packages/ward/src/contracts/run-id/run-id-contract.ts`
- `packages/ward/src/contracts/summary-line/summary-line-contract.ts`
- `packages/ward/src/contracts/test-failure/test-failure-contract.ts`
- `packages/ward/src/contracts/test-name-pattern-match/test-name-pattern-match-contract.ts`
- `packages/ward/src/contracts/testing-open-handle-finding/testing-open-handle-finding-contract.ts`
- `packages/ward/src/contracts/tsconfig-json/tsconfig-json-contract.ts`
- `packages/ward/src/contracts/typescript-module-shape/typescript-module-shape-contract.ts`
- `packages/ward/src/contracts/ward-config/ward-config-contract.ts`
- `packages/ward/src/contracts/ward-error-list/ward-error-list-contract.ts`
- `packages/ward/src/contracts/ward-file-detail/ward-file-detail-contract.ts`
- `packages/ward/src/contracts/ward-result/ward-result-contract.ts`
- `packages/ward/src/contracts/ward-summary/ward-summary-contract.ts`

**ward-B01**

- `packages/ward/bin/ward-entry.ts` — uses `process.argv`, `process.stderr`, `process.exit`
- `packages/ward/src/brokers/bundle/build/bundle-build-broker.proxy.ts` — uses `process.pid`
- `packages/ward/src/brokers/bundle/build/bundle-build-broker.test.ts` — uses `process.pid`
- `packages/ward/src/brokers/bundle/build/bundle-build-broker.ts` — `run({ command: bundleStatics.buildCommand })` spawns npm → #gateway/bin/npm `runScript` (A18 step 3); uses `process.pid`

**ward-B02**

- `packages/ward/src/brokers/bundle/hash-files/bundle-hash-files-broker.proxy.ts` — uses `Buffer`
- `packages/ward/src/brokers/check-run/integration/check-run-integration-broker.proxy.ts` — uses `process.pid`
- `packages/ward/src/brokers/check-run/integration/check-run-integration-broker.ts` — uses `process.pid`

**ward-B03**

- `packages/ward/src/brokers/check-run/unit/check-run-unit-broker.proxy.ts` — uses `process.pid`
- `packages/ward/src/brokers/check-run/unit/check-run-unit-broker.test.ts` — uses `process.pid`, `process.env.X`
- `packages/ward/src/brokers/check-run/unit/check-run-unit-broker.ts` — uses `process.pid`

**ward-B04**

- `packages/ward/src/brokers/command/detail/command-detail-broker.proxy.ts` — uses `process.stdout`, `process.stderr`
- `packages/ward/src/brokers/command/detail/command-detail-broker.test.ts` — uses `process.stdout`
- `packages/ward/src/brokers/command/detail/command-detail-broker.ts` — uses `process.stderr`, `process.stdout`

**ward-B05**

- `packages/ward/src/brokers/command/list/command-list-broker.proxy.ts` — uses `process.stdout`, `process.stderr`
- `packages/ward/src/brokers/command/list/command-list-broker.ts` — uses `process.stderr`, `process.stdout`

**ward-B06**

- `packages/ward/src/brokers/command/raw/command-raw-broker.proxy.ts` — uses `process.stdout`, `process.stderr`
- `packages/ward/src/brokers/command/raw/command-raw-broker.test.ts` — uses `process.stdout`, `process.stderr`
- `packages/ward/src/brokers/command/raw/command-raw-broker.ts` — uses `process.stderr`, `process.stdout`

**ward-B07**

- `packages/ward/src/brokers/command/run/command-run-broker.proxy.ts` — uses `process.stdout`, `process.stderr` · **needs** GN2a process.<object>
- `packages/ward/src/brokers/command/run/command-run-broker.test.ts` — uses `process.exitCode=`, `process.exitCode`
- `packages/ward/src/brokers/command/run/command-run-broker.ts` — uses `process.stdout`, `process.exitCode=`, `process.stderr`

**ward-B08**

- `packages/ward/src/brokers/command/run/multi-package-layer-broker.proxy.ts` — uses `process.stderr`
- `packages/ward/src/brokers/command/run/multi-package-layer-broker.ts` — uses `process.stderr`
- `packages/ward/src/brokers/command/run/single-package-layer-broker.proxy.ts` — uses `process.stderr`
- `packages/ward/src/brokers/command/run/single-package-layer-broker.ts` — uses `process.stderr`

**ward-B09**

- `packages/ward/src/brokers/git/detect-default-branch/git-detect-default-branch-broker.proxy.ts` — companion: follows the broker onto the #gateway/bin wrapper's own `.proxy`
- `packages/ward/src/brokers/git/detect-default-branch/git-detect-default-branch-broker.test.ts` — companion: follows the broker onto the #gateway/bin wrapper's own `.proxy`
- `packages/ward/src/brokers/git/detect-default-branch/git-detect-default-branch-broker.ts` — `run({ command: 'git' })` → #gateway/bin/git `detectDefaultBranch`/`gitRun`

**ward-B10**

- `packages/ward/src/brokers/git/detect-origin-default-branch/git-detect-origin-default-branch-broker.proxy.ts` — companion: follows the broker onto the #gateway/bin wrapper's own `.proxy`
- `packages/ward/src/brokers/git/detect-origin-default-branch/git-detect-origin-default-branch-broker.test.ts` — companion: follows the broker onto the #gateway/bin wrapper's own `.proxy`
- `packages/ward/src/brokers/git/detect-origin-default-branch/git-detect-origin-default-branch-broker.ts` — `run({ command: 'git' })` → #gateway/bin/git `detectOriginDefaultBranch`/`gitRun`

**ward-B11**

- `packages/ward/src/brokers/git/diff-committed/git-diff-committed-broker.proxy.ts` — companion: follows the broker onto the #gateway/bin wrapper's own `.proxy`
- `packages/ward/src/brokers/git/diff-committed/git-diff-committed-broker.test.ts` — companion: follows the broker onto the #gateway/bin wrapper's own `.proxy`
- `packages/ward/src/brokers/git/diff-committed/git-diff-committed-broker.ts` — `run({ command: 'git' })` → #gateway/bin/git `diffFiles`/`gitRun`

**ward-B12**

- `packages/ward/src/brokers/git/diff-uncommitted/git-diff-uncommitted-broker.proxy.ts` — companion: follows the broker onto the #gateway/bin wrapper's own `.proxy`
- `packages/ward/src/brokers/git/diff-uncommitted/git-diff-uncommitted-broker.test.ts` — companion: follows the broker onto the #gateway/bin wrapper's own `.proxy`
- `packages/ward/src/brokers/git/diff-uncommitted/git-diff-uncommitted-broker.ts` — `run({ command: 'git' })` → #gateway/bin/git `diffFiles`/`untrackedFiles`/`gitRun`

**ward-B13**

- `packages/ward/src/brokers/workspace/discover/package-read-layer-broker.proxy.ts` — uses `process.stderr`
- `packages/ward/src/brokers/workspace/discover/package-read-layer-broker.ts` — uses `process.stderr`

**ward-B14**

- `packages/ward/src/flows/ward/ward-flow.integration.test.ts` — uses `process.exitCode=`, `process.exitCode`
- `packages/ward/src/flows/ward/ward-flow.ts` — uses `process.stderr`, `process.exitCode=`

**ward-B15**

- `packages/ward/src/responders/ward/detail/ward-detail-responder.proxy.ts` — uses `process.stderr`, `process.stdout`
- `packages/ward/src/responders/ward/detail/ward-detail-responder.ts` — uses `process.stderr`
- `packages/ward/src/responders/ward/list/ward-list-responder.proxy.ts` — uses `process.stderr`, `process.stdout`

**ward-B16**

- `packages/ward/src/responders/ward/raw/ward-raw-responder.proxy.ts` — uses `process.stderr`, `process.stdout`
- `packages/ward/src/responders/ward/raw/ward-raw-responder.ts` — uses `process.stderr`

**ward-B17** — waits on GN1, GN2

- `packages/ward/src/startup/start-ward.integration.test.ts` — uses `process.cwd`, `process.stdout` · **needs** GN2 process.chdir
- `packages/ward/test/harnesses/bin-resolve/bin-resolve.harness.ts` — imports `fs`, `fs/promises`, `path` · uses `process.env.X` · **needs** GN1 process env snapshot (whole `process.env`); GN1 process env write/delete (`setEnv`/`deleteEnv`)
- `packages/ward/test/harnesses/e2e-artifacts/e2e-artifacts.harness.ts` — imports `fs`, `fs/promises`, `path`
- `packages/ward/test/harnesses/git-worktree-fixture/git-worktree-fixture.harness.ts` — `run({ command: 'git' })` → #gateway/bin/git `gitRun`; imports `fs`, `path`

**ward-B18**

- `packages/ward/test/harnesses/ward-runner/ward-runner.harness.ts` — imports `fs`, `path`

#### `web`

**web-Z (zod sweep).** Each file's only violation is `import … from 'zod'`; change the specifier to `'#gateway/npm/zod'` and nothing else.

- `packages/web/src/brokers/elk/layout/elk-layout-broker.proxy.ts`
- `packages/web/src/contracts/animation-interval-ms/animation-interval-ms-contract.ts`
- `packages/web/src/contracts/ascii-art/ascii-art-contract.ts`
- `packages/web/src/contracts/attachment-id/attachment-id-contract.ts`
- `packages/web/src/contracts/bounce-offset-px/bounce-offset-px-contract.ts`
- `packages/web/src/contracts/button-label/button-label-contract.ts`
- `packages/web/src/contracts/button-variant/button-variant-contract.ts`
- `packages/web/src/contracts/byte-length/byte-length-contract.ts`
- `packages/web/src/contracts/chat-complete-payload/chat-complete-payload-contract.ts`
- `packages/web/src/contracts/chat-entry-group/chat-entry-group-contract.ts`
- `packages/web/src/contracts/chat-history-complete-payload/chat-history-complete-payload-contract.ts`
- `packages/web/src/contracts/chat-output-payload/chat-output-payload-contract.ts`
- `packages/web/src/contracts/chat-stream-ended-payload/chat-stream-ended-payload-contract.ts`
- `packages/web/src/contracts/clarification-request-payload/clarification-request-payload-contract.ts`
- `packages/web/src/contracts/comment-anchor/comment-anchor-contract.ts`
- `packages/web/src/contracts/comment-batch-response/comment-batch-response-contract.ts`
- `packages/web/src/contracts/comment-batch-send-result/comment-batch-send-result-contract.ts`
- `packages/web/src/contracts/comment-count/comment-count-contract.ts`
- `packages/web/src/contracts/comment-queue-entry/comment-queue-entry-contract.ts`
- `packages/web/src/contracts/composer-attachment/composer-attachment-contract.ts`
- `packages/web/src/contracts/composer-scope-key/composer-scope-key-contract.ts`
- `packages/web/src/contracts/composer-segment/composer-segment-contract.ts`
- `packages/web/src/contracts/composer-send-payload/composer-send-payload-contract.ts`
- `packages/web/src/contracts/composer-serialized/composer-serialized-contract.ts`
- `packages/web/src/contracts/context-token-count/context-token-count-contract.ts`
- `packages/web/src/contracts/context-token-delta/context-token-delta-contract.ts`
- `packages/web/src/contracts/contract-count/contract-count-contract.ts`
- `packages/web/src/contracts/css-color-override/css-color-override-contract.ts`
- `packages/web/src/contracts/css-dimension/css-dimension-contract.ts`
- `packages/web/src/contracts/css-spacing/css-spacing-contract.ts`
- `packages/web/src/contracts/dependency-label/dependency-label-contract.ts`
- `packages/web/src/contracts/display-file-path/display-file-path-contract.ts`
- `packages/web/src/contracts/display-label/display-label-contract.ts`
- `packages/web/src/contracts/dropdown-option/dropdown-option-contract.ts`
- `packages/web/src/contracts/elapsed-parts/elapsed-parts-contract.ts`
- `packages/web/src/contracts/elk-position-map/elk-position-map-contract.ts`
- `packages/web/src/contracts/error-body/error-body-contract.ts`
- `packages/web/src/contracts/execution-role/execution-role-contract.ts`
- `packages/web/src/contracts/execution-step-status/execution-step-status-contract.ts`
- `packages/web/src/contracts/fetch-post-with-status-result/fetch-post-with-status-result-contract.ts`
- `packages/web/src/contracts/flow-edge-route-map/flow-edge-route-map-contract.ts`
- `packages/web/src/contracts/flow-layout-signature/flow-layout-signature-contract.ts`
- `packages/web/src/contracts/flow-observable-node-data/flow-observable-node-data-contract.ts`
- `packages/web/src/contracts/flow-portal-node-data/flow-portal-node-data-contract.ts`
- `packages/web/src/contracts/form-input-value/form-input-value-contract.ts`
- `packages/web/src/contracts/form-placeholder/form-placeholder-contract.ts`
- `packages/web/src/contracts/formatted-token-label/formatted-token-label-contract.ts`
- `packages/web/src/contracts/formatted-tool-field/formatted-tool-field-contract.ts`
- `packages/web/src/contracts/formatted-tool-input/formatted-tool-input-contract.ts`
- `packages/web/src/contracts/gate-section-key/gate-section-key-contract.ts`
- `packages/web/src/contracts/guild-create-result/guild-create-result-contract.ts`
- `packages/web/src/contracts/human-verdict-response/human-verdict-response-contract.ts`
- `packages/web/src/contracts/icon-button-size/icon-button-size-contract.ts`
- `packages/web/src/contracts/image-data-url/image-data-url-contract.ts`
- `packages/web/src/contracts/image-size/image-size-contract.ts`
- `packages/web/src/contracts/iso-timestamp/iso-timestamp-contract.ts`
- `packages/web/src/contracts/markdown-block/markdown-block-contract.ts`
- `packages/web/src/contracts/markdown-source-line/markdown-source-line-contract.ts`
- `packages/web/src/contracts/markdown-source/markdown-source-contract.ts`
- `packages/web/src/contracts/markdown-span/markdown-span-contract.ts`
- `packages/web/src/contracts/merged-chat-item/merged-chat-item-contract.ts`
- `packages/web/src/contracts/normalized-paste-media-type/normalized-paste-media-type-contract.ts`
- `packages/web/src/contracts/notification-message/notification-message-contract.ts`
- `packages/web/src/contracts/operation-flow-label/operation-flow-label-contract.ts`
- `packages/web/src/contracts/orchestration-dispatch-result/orchestration-dispatch-result-contract.ts`
- `packages/web/src/contracts/orchestration-mode-get-result/orchestration-mode-get-result-contract.ts`
- `packages/web/src/contracts/parsed-tool-input/parsed-tool-input-contract.ts`
- `packages/web/src/contracts/parsed-tool-result/parsed-tool-result-contract.ts`
- `packages/web/src/contracts/pasted-image-draft/pasted-image-draft-contract.ts`
- `packages/web/src/contracts/pixel-coordinate/pixel-coordinate-contract.ts`
- `packages/web/src/contracts/pixel-dimension/pixel-dimension-contract.ts`
- `packages/web/src/contracts/pixel-length/pixel-length-contract.ts`
- `packages/web/src/contracts/plan-section-test-item/plan-section-test-item-contract.ts`
- `packages/web/src/contracts/quest-abandon-result/quest-abandon-result-contract.ts`
- `packages/web/src/contracts/quest-clarify-result/quest-clarify-result-contract.ts`
- `packages/web/src/contracts/quest-delete-result/quest-delete-result-contract.ts`
- `packages/web/src/contracts/quest-followup-response/quest-followup-response-contract.ts`
- `packages/web/src/contracts/quest-followup-stop-result/quest-followup-stop-result-contract.ts`
- `packages/web/src/contracts/quest-list-response/quest-list-response-contract.ts`
- `packages/web/src/contracts/quest-load-failed-payload/quest-load-failed-payload-contract.ts`
- `packages/web/src/contracts/quest-merge-result/quest-merge-result-contract.ts`
- `packages/web/src/contracts/quest-modified-payload/quest-modified-payload-contract.ts`
- `packages/web/src/contracts/quest-modify-response/quest-modify-response-contract.ts`
- `packages/web/src/contracts/quest-new-response/quest-new-response-contract.ts`
- `packages/web/src/contracts/quest-pause-result/quest-pause-result-contract.ts`
- `packages/web/src/contracts/quest-queue-result/quest-queue-result-contract.ts`
- `packages/web/src/contracts/quest-resume-outcome/quest-resume-outcome-contract.ts`
- `packages/web/src/contracts/quest-start-response/quest-start-response-contract.ts`
- `packages/web/src/contracts/rate-limits-get-result/rate-limits-get-result-contract.ts`
- `packages/web/src/contracts/react-flow-node-data/react-flow-node-data-contract.ts`
- `packages/web/src/contracts/react-flow-package-chip/react-flow-package-chip-contract.ts`
- `packages/web/src/contracts/replay-history-message/replay-history-message-contract.ts`
- `packages/web/src/contracts/reset-duration-label/reset-duration-label-contract.ts`
- `packages/web/src/contracts/riftcarver-detail/riftcarver-detail-contract.ts`
- `packages/web/src/contracts/riftcarver-log-line/riftcarver-log-line-contract.ts`
- `packages/web/src/contracts/row-order/row-order-contract.ts`
- `packages/web/src/contracts/scroll-offset-px/scroll-offset-px-contract.ts`
- `packages/web/src/contracts/scroll-position-px/scroll-position-px-contract.ts`
- `packages/web/src/contracts/scroll-threshold-px/scroll-threshold-px-contract.ts`
- `packages/web/src/contracts/section-count/section-count-contract.ts`
- `packages/web/src/contracts/section-label/section-label-contract.ts`
- `packages/web/src/contracts/served-image-content/served-image-content-contract.ts`
- `packages/web/src/contracts/session-filter/session-filter-contract.ts`
- `packages/web/src/contracts/session-resolve-response/session-resolve-response-contract.ts`
- `packages/web/src/contracts/shortened-path-text/shortened-path-text-contract.ts`
- `packages/web/src/contracts/sticky-z-index/sticky-z-index-contract.ts`
- `packages/web/src/contracts/streaming-block-count/streaming-block-count-contract.ts`
- `packages/web/src/contracts/subagent-elapsed-input/subagent-elapsed-input-contract.ts`
- `packages/web/src/contracts/tag-item/tag-item-contract.ts`
- `packages/web/src/contracts/tail-start-index/tail-start-index-contract.ts`
- `packages/web/src/contracts/take-count/take-count-contract.ts`
- `packages/web/src/contracts/task-tool-input/task-tool-input-contract.ts`
- `packages/web/src/contracts/test-id/test-id-contract.ts`
- `packages/web/src/contracts/theme-color-token/theme-color-token-contract.ts`
- `packages/web/src/contracts/theme-scheme-description/theme-scheme-description-contract.ts`
- `packages/web/src/contracts/theme-scheme-name/theme-scheme-name-contract.ts`
- `packages/web/src/contracts/theme-scheme/theme-scheme-contract.ts`
- `packages/web/src/contracts/timeout-ms/timeout-ms-contract.ts`
- `packages/web/src/contracts/toggle-test-id/toggle-test-id-contract.ts`
- `packages/web/src/contracts/token-annotation/token-annotation-contract.ts`
- `packages/web/src/contracts/tool-display-label/tool-display-label-contract.ts`
- `packages/web/src/contracts/tool-input-key/tool-input-key-contract.ts`
- `packages/web/src/contracts/tool-name/tool-name-contract.ts`
- `packages/web/src/contracts/tool-result-display-content/tool-result-display-content-contract.ts`
- `packages/web/src/contracts/tool-result-key/tool-result-key-contract.ts`
- `packages/web/src/contracts/tool-result-part/tool-result-part-contract.ts`
- `packages/web/src/contracts/trailing-thinking-index/trailing-thinking-index-contract.ts`
- `packages/web/src/contracts/transcript-segment/transcript-segment-contract.ts`
- `packages/web/src/contracts/truncated-content/truncated-content-contract.ts`
- `packages/web/src/contracts/unit-churn-step/unit-churn-step-contract.ts`
- `packages/web/src/contracts/unit-churn/unit-churn-contract.ts`
- `packages/web/src/contracts/unit-mark-readout/unit-mark-readout-contract.ts`
- `packages/web/src/contracts/upload-percent/upload-percent-contract.ts`
- `packages/web/src/contracts/upload-progress-post/upload-progress-post-contract.ts`
- `packages/web/src/contracts/ward-detail-line/ward-detail-line-contract.ts`
- `packages/web/src/contracts/ward-detail-response/ward-detail-response-contract.ts`
- `packages/web/src/contracts/ws-url/ws-url-contract.ts`
- `packages/web/src/flows/home/guild-two-route-comparison.e2e.ts`
- `packages/web/src/flows/quest-chat/transcript-replaces-optimistic.e2e.ts`

**web-B01** — waits on GN1

- `packages/web/playwright.config.ts` — imports `os`, `path`, `fs`, `@playwright/test` · uses `process.env.X` · **needs** GN1 process env write/delete (`setEnv`/`deleteEnv`)
- `packages/web/src/bindings/use-agent-output/use-agent-output-binding.ts` — imports `react`
- `packages/web/src/bindings/use-auto-scroll/use-auto-scroll-binding.ts` — imports `react` · uses `ResizeObserver`
- `packages/web/src/bindings/use-comment-queue-sweep/use-comment-queue-sweep-binding.ts` — imports `react`

**web-B02**

- `packages/web/src/bindings/use-comment-queue/use-comment-queue-binding.ts` — imports `react`
- `packages/web/src/bindings/use-directory-browser/use-directory-browser-binding.proxy.ts` — uses `console`
- `packages/web/src/bindings/use-directory-browser/use-directory-browser-binding.ts` — imports `react` · uses `console`
- `packages/web/src/bindings/use-disclosure-anchor/use-disclosure-anchor-binding.ts` — imports `react` · uses `window`

**web-B03**

- `packages/web/src/bindings/use-dispatch-state/use-dispatch-state-binding.proxy.ts` — uses `console`
- `packages/web/src/bindings/use-dispatch-state/use-dispatch-state-binding.ts` — imports `react` · uses `console`

**web-B04** — waits on GB1, GB2

- `packages/web/src/bindings/use-elapsed-tick/use-elapsed-tick-binding.proxy.ts` — uses `document`
- `packages/web/src/bindings/use-elapsed-tick/use-elapsed-tick-binding.test.ts` — uses `document` · **needs** GB2 browser global `Event`
- `packages/web/src/bindings/use-elapsed-tick/use-elapsed-tick-binding.ts` — imports `react` · uses `document` · **needs** GB1 browser global `setInterval`; GB1 browser global `clearInterval`

**web-B05**

- `packages/web/src/bindings/use-guild-detail/use-guild-detail-binding.proxy.ts` — uses `console`
- `packages/web/src/bindings/use-guild-detail/use-guild-detail-binding.ts` — imports `react` · uses `console`

**web-B06**

- `packages/web/src/bindings/use-guilds/use-guilds-binding.proxy.ts` — uses `console`
- `packages/web/src/bindings/use-guilds/use-guilds-binding.test.ts` — uses `console`
- `packages/web/src/bindings/use-guilds/use-guilds-binding.ts` — imports `react` · uses `console`

**web-B07**

- `packages/web/src/bindings/use-orchestration-mode/use-orchestration-mode-binding.proxy.ts` — uses `console`
- `packages/web/src/bindings/use-orchestration-mode/use-orchestration-mode-binding.ts` — imports `react` · uses `console`

**web-B08** — waits on GB1

- `packages/web/src/bindings/use-quest-chat/use-quest-chat-binding.proxy.ts` — uses `crypto`
- `packages/web/src/bindings/use-quest-chat/use-quest-chat-binding.test.ts` — **needs** GB1 browser global `setTimeout`
- `packages/web/src/bindings/use-quest-chat/use-quest-chat-binding.ts` — imports `react` · uses `console`, `crypto`

**web-B09** — waits on GB1

- `packages/web/src/bindings/use-quest-projection/use-quest-projection-binding.proxy.ts` — uses `console`
- `packages/web/src/bindings/use-quest-projection/use-quest-projection-binding.test.ts` — **needs** GB1 browser global `setTimeout`
- `packages/web/src/bindings/use-quest-projection/use-quest-projection-binding.ts` — imports `react` · uses `console`

**web-B10**

- `packages/web/src/bindings/use-quest-queue/use-quest-queue-binding.proxy.ts` — uses `console`
- `packages/web/src/bindings/use-quest-queue/use-quest-queue-binding.ts` — imports `react` · uses `console`

**web-B11** — waits on GB1

- `packages/web/src/bindings/use-quest-summary/use-quest-summary-binding.proxy.ts` — uses `console`
- `packages/web/src/bindings/use-quest-summary/use-quest-summary-binding.test.ts` — **needs** GB1 browser global `setTimeout`
- `packages/web/src/bindings/use-quest-summary/use-quest-summary-binding.ts` — imports `react` · uses `console`

**web-B12**

- `packages/web/src/bindings/use-quests/use-quests-binding.proxy.ts` — uses `console`
- `packages/web/src/bindings/use-quests/use-quests-binding.test.ts` — uses `console`
- `packages/web/src/bindings/use-quests/use-quests-binding.ts` — imports `react` · uses `console`

**web-B13**

- `packages/web/src/bindings/use-rate-limits/use-rate-limits-binding.proxy.ts` — uses `console`
- `packages/web/src/bindings/use-rate-limits/use-rate-limits-binding.ts` — imports `react` · uses `console`

**web-B14**

- `packages/web/src/bindings/use-session-list/use-session-list-binding.proxy.ts` — uses `console`
- `packages/web/src/bindings/use-session-list/use-session-list-binding.test.ts` — uses `console`
- `packages/web/src/bindings/use-session-list/use-session-list-binding.ts` — imports `react` · uses `console`
- `packages/web/src/bindings/use-session-replay/use-session-replay-binding.ts` — imports `react`

**web-B15** — waits on GB2

- `packages/web/src/bindings/use-ward-detail/use-ward-detail-binding.ts` — imports `react`
- `packages/web/src/brokers/composer/delete-thumbnail/composer-delete-thumbnail-broker.test.ts` — uses `document`
- `packages/web/src/brokers/composer/delete-thumbnail/composer-delete-thumbnail-broker.ts` — **needs** GB2 browser global `Text`; GB2 browser global `HTMLImageElement`

**web-B16** — waits on GB2

- `packages/web/src/brokers/composer/insert-image/composer-insert-image-broker.test.ts` — uses `document`
- `packages/web/src/brokers/composer/insert-image/composer-insert-image-broker.ts` — **needs** GB2 browser global `Node`
- `packages/web/src/brokers/composer/insert-text/composer-insert-text-broker.test.ts` — uses `document`
- `packages/web/src/brokers/composer/insert-text/composer-insert-text-broker.ts` — **needs** GB2 browser global `Node`

**web-B17** — waits on GB2

- `packages/web/src/brokers/composer/write/composer-write-broker.test.ts` — uses `document`
- `packages/web/src/brokers/composer/write/composer-write-broker.ts` — **needs** GB2 browser global `Text`

**web-B18** — waits on GB2

- `packages/web/src/brokers/draft-images/load/draft-images-load-broker.ts` — uses `console`
- `packages/web/src/brokers/file/read-data-url/file-read-data-url-broker.test.ts` — uses `Blob` · **needs** GB2 browser global `btoa`

**web-B19**

- `packages/web/src/brokers/image/measure/image-measure-broker.proxy.ts` — uses `Blob`
- `packages/web/src/brokers/image/rescale/image-rescale-broker.proxy.ts` — uses `Blob`

**web-B20**

- `packages/web/src/brokers/pasted-image/attach/pasted-image-attach-broker.proxy.ts` — uses `crypto`
- `packages/web/src/brokers/pasted-image/attach/pasted-image-attach-broker.ts` — uses `crypto`

**web-B21**

- `packages/web/src/brokers/react-root/mount/react-root-mount-broker.test.ts` — uses `document`
- `packages/web/src/brokers/react-root/mount/react-root-mount-broker.ts` — uses `document`

**web-B22**

- `packages/web/src/flows/app/app-flow.tsx` — imports `react-router-dom`
- `packages/web/src/flows/home/guild-creation.e2e.ts` — uses `process.env.X` — leave the page-callback globals alone (FP)
- `packages/web/src/flows/home/home-click-routing.e2e.ts` — imports `crypto`
- `packages/web/src/flows/home/home-flow.tsx` — imports `react-router-dom`

**web-B23**

- `packages/web/src/flows/home/home-session-list-distinct-rows.e2e.ts` — imports `crypto`
- `packages/web/src/flows/home/quest-delete-from-root.e2e.ts` — imports `crypto` · uses `URL`
- `packages/web/src/flows/quest-chat/multi-widget-coexistence.e2e.ts` — uses `URL`

**web-B24**

- `packages/web/src/flows/quest-chat/quest-chat-flow.integration.test.tsx` — imports `react-router-dom`
- `packages/web/src/flows/quest-chat/quest-chat-flow.tsx` — imports `react-router-dom`
- `packages/web/src/flows/quest-chat/ws-reconnect.e2e.ts` — uses `URL`
- `packages/web/src/flows/queue/queue-flow.tsx` — imports `react-router-dom`

**web-B25**

- `packages/web/src/flows/session-view/session-view-flow.integration.test.tsx` — imports `react-router-dom`
- `packages/web/src/flows/session-view/session-view-flow.tsx` — imports `react-router-dom`

**web-B26** — waits on C4

- `packages/web/src/main.test.ts` — imports `path`
- `packages/web/src/main.ts` — **needs** C4 CSS side-effect import
- `packages/web/src/module-resolution.integration.test.ts` — imports `path`

**web-B27**

- `packages/web/src/responders/app/mount/app-mount-responder.proxy.ts` — uses `document`
- `packages/web/src/responders/web-socket-channel/connect/web-socket-channel-connect-responder.ts` — uses `location`

**web-B28** — waits on GB1, GB3

- `packages/web/src/state/comment-queue/comment-queue-state.proxy.ts` — uses `console`, `localStorage.setItem`, `localStorage.getItem` · **needs** GB3 localStorage.clear (no wrapper)
- `packages/web/src/state/comment-queue/comment-queue-state.test.ts` — uses `localStorage.setItem`, `localStorage.getItem`
- `packages/web/src/state/comment-queue/comment-queue-state.ts` — uses `console`
- `packages/web/src/state/web-socket-channel/web-socket-channel-state.ts` — **needs** GB1 browser global `setTimeout`; GB1 browser global `clearTimeout`

**web-B29** — waits on GB2

- `packages/web/src/transformers/composer-caret-filler-element/composer-caret-filler-element-transformer.test.ts` — uses `document`
- `packages/web/src/transformers/composer-read/composer-read-transformer.test.ts` — uses `document`
- `packages/web/src/transformers/composer-read/composer-read-transformer.ts` — **needs** GB2 browser global `Text`; GB2 browser global `Element`

**web-B30**

- `packages/web/src/widgets/app-root/app-root-widget.proxy.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/app-root/app-root-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/app-root/app-root-widget.tsx` — imports `@mantine/core`, `react-router-dom`

**web-B31** — waits on GB3

- `packages/web/src/widgets/app/app-widget.integration.test.tsx` — **needs** GB3 browser `WebSocket` class (gateway exports only `connect`)
- `packages/web/src/widgets/app/app-widget.proxy.tsx` — imports `@testing-library/react`, `@testing-library/user-event`
- `packages/web/src/widgets/app/app-widget.test.tsx` — imports `@testing-library/react`, `react-router-dom`
- `packages/web/src/widgets/app/app-widget.tsx` — imports `react-router-dom`

**web-B32**

- `packages/web/src/widgets/auto-scroll-container/auto-scroll-container-widget.proxy.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/auto-scroll-container/auto-scroll-container-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/auto-scroll-container/auto-scroll-container-widget.tsx` — imports `react`, `@mantine/core`

**web-B33**

- `packages/web/src/widgets/chat-entry-list/chat-entry-list-widget.proxy.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/chat-entry-list/chat-entry-list-widget.test.tsx` — imports `@testing-library/react`, `@testing-library/user-event`
- `packages/web/src/widgets/chat-entry-list/chat-entry-list-widget.tsx` — imports `react`

**web-B34** — waits on GB1, GB2, GB3

- `packages/web/src/widgets/chat-input/chat-input-widget.proxy.tsx` — imports `@testing-library/react` · uses `Blob` · **needs** GB3 localStorage.clear (no wrapper); GB2 browser global `File`
- `packages/web/src/widgets/chat-input/chat-input-widget.test.tsx` — imports `@testing-library/react`, `react-router-dom` · uses `localStorage.getItem`, `localStorage.setItem`, `document` · **needs** GB2 browser global `InputEvent`; GB2 browser global `btoa`; GB1 browser global `setTimeout`
- `packages/web/src/widgets/chat-input/chat-input-widget.tsx` — A18 step 4: every `localStorage` call → #gateway/browser/localStorage `readItem`/`writeItem`/`removeItem`, checking the returned result instead of an empty `catch`; imports `@mantine/core`, `react`, `react-router-dom` · uses `localStorage.setItem`, `localStorage.removeItem`, `localStorage.getItem`, `console`, `Blob` · **needs** GB2 browser global `HTMLImageElement`

**web-B35**

- `packages/web/src/widgets/chat-message/chat-message-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/chat-message/chat-message-widget.tsx` — imports `@mantine/core`, `react`

**web-B36**

- `packages/web/src/widgets/chat-message/image-content-layer-widget.proxy.tsx` — imports `@testing-library/react`, `@testing-library/user-event`
- `packages/web/src/widgets/chat-message/image-content-layer-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/chat-message/image-content-layer-widget.tsx` — imports `@mantine/core`, `react`

**web-B37**

- `packages/web/src/widgets/chat-message/injected-prompt-layer-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/chat-message/injected-prompt-layer-widget.tsx` — imports `@mantine/core`, `react`
- `packages/web/src/widgets/chat-message/thinking-layer-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/chat-message/thinking-layer-widget.tsx` — imports `@mantine/core`, `react`

**web-B38** — waits on GB1

- `packages/web/src/widgets/chat-panel/chat-panel-widget.proxy.tsx` — imports `@testing-library/react`, `@testing-library/user-event`
- `packages/web/src/widgets/chat-panel/chat-panel-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/chat-panel/chat-panel-widget.tsx` — imports `@mantine/core`, `react` · **needs** GB1 browser global `setInterval`; GB1 browser global `clearInterval`

**web-B39**

- `packages/web/src/widgets/comment-popover/comment-popover-widget.proxy.tsx` — imports `@testing-library/react`, `@testing-library/user-event`
- `packages/web/src/widgets/comment-popover/comment-popover-widget.tsx` — imports `react`, `@mantine/core`, `@tabler/icons-react`

**web-B40**

- `packages/web/src/widgets/comment-queue-bar/comment-queue-bar-widget.proxy.tsx` — imports `@testing-library/react`, `@testing-library/user-event`
- `packages/web/src/widgets/comment-queue-bar/comment-queue-bar-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/comment-queue-bar/comment-queue-bar-widget.tsx` — imports `react`, `@mantine/core` · uses `console`

**web-B41**

- `packages/web/src/widgets/context-divider/context-divider-widget.proxy.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/context-divider/context-divider-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/context-divider/context-divider-widget.tsx` — imports `@mantine/core`

**web-B42**

- `packages/web/src/widgets/directory-browser-modal/directory-browser-modal-widget.proxy.tsx` — imports `@testing-library/react`, `@testing-library/user-event`
- `packages/web/src/widgets/directory-browser-modal/directory-browser-modal-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/directory-browser-modal/directory-browser-modal-widget.tsx` — imports `@mantine/core`

**web-B43**

- `packages/web/src/widgets/dispatch-hold-notice/dispatch-hold-notice-widget.proxy.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/dispatch-hold-notice/dispatch-hold-notice-widget.tsx` — imports `@mantine/core`

**web-B44**

- `packages/web/src/widgets/dispatch-toggle/dispatch-toggle-widget.proxy.tsx` — imports `@testing-library/react`, `@testing-library/user-event`
- `packages/web/src/widgets/dispatch-toggle/dispatch-toggle-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/dispatch-toggle/dispatch-toggle-widget.tsx` — uses `console`

**web-B45** — waits on GB1

- `packages/web/src/widgets/dumpster-raccoon/dumpster-raccoon-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/dumpster-raccoon/dumpster-raccoon-widget.tsx` — imports `@mantine/core`, `react` · **needs** GB1 browser global `setInterval`; GB1 browser global `clearInterval`

**web-B46**

- `packages/web/src/widgets/execution-panel/execution-panel-widget.proxy.tsx` — imports `@testing-library/react`, `@testing-library/user-event`
- `packages/web/src/widgets/execution-panel/execution-panel-widget.test.tsx` — imports `@testing-library/react`, `@testing-library/user-event`
- `packages/web/src/widgets/execution-panel/execution-panel-widget.tsx` — imports `react`, `@mantine/core`

**web-B47**

- `packages/web/src/widgets/execution-panel/execution-row-layer-widget.proxy.tsx` — imports `@testing-library/react`, `@testing-library/user-event`
- `packages/web/src/widgets/execution-panel/execution-row-layer-widget.test.tsx` — imports `@testing-library/react`, `@testing-library/user-event`
- `packages/web/src/widgets/execution-panel/execution-row-layer-widget.tsx` — imports `@mantine/core`, `react`

**web-B48**

- `packages/web/src/widgets/execution-panel/execution-row-minted-by-badge-layer-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/execution-panel/execution-row-minted-by-badge-layer-widget.tsx` — imports `@mantine/core`
- `packages/web/src/widgets/execution-panel/execution-row-scope-churn-layer-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/execution-panel/execution-row-scope-churn-layer-widget.tsx` — imports `@mantine/core`

**web-B49**

- `packages/web/src/widgets/execution-panel/execution-row-unit-marks-layer-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/execution-panel/execution-row-unit-marks-layer-widget.tsx` — imports `@mantine/core`
- `packages/web/src/widgets/execution-panel/execution-row-unmet-list-layer-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/execution-panel/execution-row-unmet-list-layer-widget.tsx` — imports `@mantine/core`

**web-B50**

- `packages/web/src/widgets/execution-panel/execution-status-bar-layer-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/execution-panel/execution-status-bar-layer-widget.tsx` — imports `@mantine/core`
- `packages/web/src/widgets/execution-panel/execution-work-item-row-layer-widget.test.tsx` — imports `@testing-library/react`, `@testing-library/user-event`

**web-B51**

- `packages/web/src/widgets/execution-panel/riftcarver-result-detail-layer-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/execution-panel/riftcarver-result-detail-layer-widget.tsx` — imports `@mantine/core`, `react` · uses `console`
- `packages/web/src/widgets/execution-panel/riftcarver-result-row-layer-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/execution-panel/riftcarver-result-row-layer-widget.tsx` — imports `@mantine/core`

**web-B52**

- `packages/web/src/widgets/execution-panel/streaming-bar-layer-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/execution-panel/streaming-bar-layer-widget.tsx` — imports `@mantine/core`
- `packages/web/src/widgets/execution-panel/ward-result-detail-layer-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/execution-panel/ward-result-detail-layer-widget.tsx` — imports `@mantine/core`, `react` · uses `console`

**web-B53**

- `packages/web/src/widgets/execution-panel/ward-result-row-layer-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/execution-panel/ward-result-row-layer-widget.tsx` — imports `@mantine/core`
- `packages/web/src/widgets/flow-edge/flow-edge-widget.test.tsx` — imports `react`, `@testing-library/react`
- `packages/web/src/widgets/flow-edge/flow-edge-widget.tsx` — imports `react`

**web-B54**

- `packages/web/src/widgets/flow-node-handles/flow-node-handles-widget.test.tsx` — imports `react`
- `packages/web/src/widgets/flow-node-handles/flow-node-handles-widget.tsx` — imports `react`
- `packages/web/src/widgets/form-dropdown/form-dropdown-widget.proxy.tsx` — imports `@testing-library/react`, `@testing-library/user-event`
- `packages/web/src/widgets/form-dropdown/form-dropdown-widget.test.tsx` — imports `@testing-library/react`

**web-B55**

- `packages/web/src/widgets/form-input/form-input-widget.proxy.tsx` — imports `@testing-library/react`, `@testing-library/user-event`
- `packages/web/src/widgets/form-input/form-input-widget.test.tsx` — imports `@testing-library/react` · uses `document`
- `packages/web/src/widgets/form-tag-list/form-tag-list-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/form-tag-list/form-tag-list-widget.tsx` — imports `@mantine/core`

**web-B56**

- `packages/web/src/widgets/guild-add-modal/guild-add-modal-widget.proxy.tsx` — imports `@testing-library/react`, `@testing-library/user-event`
- `packages/web/src/widgets/guild-add-modal/guild-add-modal-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/guild-add-modal/guild-add-modal-widget.tsx` — imports `react`, `@mantine/core`

**web-B57**

- `packages/web/src/widgets/guild-empty-state/guild-empty-state-widget.proxy.tsx` — imports `@testing-library/react`, `@testing-library/user-event`
- `packages/web/src/widgets/guild-empty-state/guild-empty-state-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/guild-empty-state/guild-empty-state-widget.tsx` — imports `react`, `@mantine/core`

**web-B58**

- `packages/web/src/widgets/guild-list/guild-list-widget.proxy.tsx` — imports `@testing-library/react`, `@testing-library/user-event`
- `packages/web/src/widgets/guild-list/guild-list-widget.tsx` — imports `@mantine/core`
- `packages/web/src/widgets/guild-list/guild-row-layer-widget.proxy.tsx` — imports `@testing-library/react`, `@testing-library/user-event`
- `packages/web/src/widgets/guild-list/guild-row-layer-widget.tsx` — imports `@mantine/core`

**web-B59**

- `packages/web/src/widgets/guild-session-list/guild-session-list-widget.proxy.tsx` — imports `@testing-library/react`, `@testing-library/user-event` · uses `document`
- `packages/web/src/widgets/guild-session-list/guild-session-list-widget.test.tsx` — imports `react` · uses `document`
- `packages/web/src/widgets/guild-session-list/guild-session-list-widget.tsx` — imports `@mantine/core`

**web-B60**

- `packages/web/src/widgets/guild-session-list/quest-row-layer-widget.proxy.tsx` — imports `@testing-library/react`, `@testing-library/user-event`
- `packages/web/src/widgets/guild-session-list/quest-row-layer-widget.test.tsx` — imports `react`
- `packages/web/src/widgets/guild-session-list/quest-row-layer-widget.tsx` — imports `@mantine/core`, `@tabler/icons-react`

**web-B61**

- `packages/web/src/widgets/guild-session-list/session-row-layer-widget.proxy.tsx` — imports `@testing-library/react`, `@testing-library/user-event`
- `packages/web/src/widgets/guild-session-list/session-row-layer-widget.tsx` — imports `@mantine/core`
- `packages/web/src/widgets/guild-session-list/unreadable-quest-row-layer-widget.proxy.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/guild-session-list/unreadable-quest-row-layer-widget.tsx` — imports `@mantine/core`

**web-B62** — waits on GB3

- `packages/web/src/widgets/home-content/home-content-widget.proxy.tsx` — imports `@testing-library/user-event` · uses `console` · **needs** GB3 localStorage.clear (no wrapper)
- `packages/web/src/widgets/home-content/home-content-widget.test.tsx` — imports `react-router-dom` · uses `localStorage.getItem`, `localStorage.setItem`
- `packages/web/src/widgets/home-content/home-content-widget.tsx` — imports `react`, `react-router-dom`, `@mantine/core` · uses `localStorage.getItem`, `localStorage.setItem`, `localStorage.removeItem`, `console`

**web-B63**

- `packages/web/src/widgets/icon-button/icon-button-widget.proxy.tsx` — imports `@testing-library/react`, `@testing-library/user-event`
- `packages/web/src/widgets/icon-button/icon-button-widget.test.tsx` — imports `@tabler/icons-react`
- `packages/web/src/widgets/icon-button/icon-button-widget.tsx` — imports `@mantine/core`, `@tabler/icons-react`

**web-B64** — waits on GB1

- `packages/web/src/widgets/image-overlay/image-overlay-widget.proxy.tsx` — imports `@testing-library/react`, `@testing-library/user-event` · uses `document`
- `packages/web/src/widgets/image-overlay/image-overlay-widget.test.tsx` — imports `@testing-library/react` · **needs** GB1 browser global `setTimeout`
- `packages/web/src/widgets/image-overlay/image-overlay-widget.tsx` — imports `@mantine/core`, `@tabler/icons-react`

**web-B65**

- `packages/web/src/widgets/logo/logo-widget.proxy.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/logo/logo-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/logo/logo-widget.tsx` — imports `@mantine/core`

**web-B66**

- `packages/web/src/widgets/map-frame/map-frame-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/map-frame/map-frame-widget.tsx` — imports `@mantine/core`
- `packages/web/src/widgets/markdown-text/markdown-block-layer-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/markdown-text/markdown-block-layer-widget.tsx` — imports `@mantine/core`

**web-B67**

- `packages/web/src/widgets/markdown-text/markdown-span-layer-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/markdown-text/markdown-span-layer-widget.tsx` — imports `@mantine/core`
- `packages/web/src/widgets/markdown-text/markdown-text-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/markdown-text/markdown-text-widget.tsx` — imports `@mantine/core`

**web-B68**

- `packages/web/src/widgets/operations-ledger/operation-row-layer-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/operations-ledger/operation-row-layer-widget.tsx` — imports `@mantine/core`

**web-B69**

- `packages/web/src/widgets/operations-ledger/operations-ledger-widget.proxy.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/operations-ledger/operations-ledger-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/operations-ledger/operations-ledger-widget.tsx` — imports `@mantine/core`

**web-B70**

- `packages/web/src/widgets/pixel-btn/pixel-btn-widget.proxy.tsx` — imports `@testing-library/react`, `@testing-library/user-event`
- `packages/web/src/widgets/pixel-btn/pixel-btn-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/pixel-btn/pixel-btn-widget.tsx` — imports `@mantine/core`
- `packages/web/src/widgets/pixel-sprite/pixel-sprite-widget.test.tsx` — imports `@testing-library/react`

**web-B71**

- `packages/web/src/widgets/plan-section/plan-section-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/plan-section/plan-section-widget.tsx` — imports `@mantine/core`

**web-B72**

- `packages/web/src/widgets/quest-approved-modal/quest-approved-modal-widget.proxy.tsx` — imports `@testing-library/react`, `@testing-library/user-event`
- `packages/web/src/widgets/quest-approved-modal/quest-approved-modal-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/quest-approved-modal/quest-approved-modal-widget.tsx` — imports `@mantine/core`

**web-B73** — waits on GB2

- `packages/web/src/widgets/quest-chat/quest-chat-content-layer-widget.proxy.tsx` — imports `@testing-library/react`, `@testing-library/user-event`
- `packages/web/src/widgets/quest-chat/quest-chat-content-layer-widget.test.tsx` — imports `@testing-library/react`, `react-router-dom` · **needs** GB2 browser global `Node`; GB2 browser global `btoa`
- `packages/web/src/widgets/quest-chat/quest-chat-content-layer-widget.tsx` — imports `react`, `react-router-dom`, `@mantine/core` · uses `crypto`, `console` · **needs** GB2 browser global `URLSearchParams`

**web-B74**

- `packages/web/src/widgets/quest-chat/quest-chat-widget.proxy.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/quest-chat/quest-chat-widget.test.tsx` — imports `@testing-library/react`, `react-router-dom`
- `packages/web/src/widgets/quest-chat/quest-chat-widget.tsx` — imports `react-router-dom`, `@mantine/core`

**web-B75**

- `packages/web/src/widgets/quest-clarify-panel/clarify-option-layer-widget.proxy.tsx` — imports `@testing-library/react`, `@testing-library/user-event`
- `packages/web/src/widgets/quest-clarify-panel/clarify-option-layer-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/quest-clarify-panel/clarify-option-layer-widget.tsx` — imports `@mantine/core`

**web-B76**

- `packages/web/src/widgets/quest-clarify-panel/quest-clarify-panel-widget.proxy.tsx` — imports `@testing-library/react`, `@testing-library/user-event`
- `packages/web/src/widgets/quest-clarify-panel/quest-clarify-panel-widget.test.tsx` — imports `@testing-library/react` · uses `document`
- `packages/web/src/widgets/quest-clarify-panel/quest-clarify-panel-widget.tsx` — imports `react`, `@mantine/core`

**web-B77**

- `packages/web/src/widgets/quest-load-error/quest-load-error-widget.proxy.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/quest-load-error/quest-load-error-widget.tsx` — imports `@mantine/core`
- `packages/web/src/widgets/quest-queue-bar/quest-queue-bar-widget.test.tsx` — imports `@testing-library/react`, `@testing-library/user-event`, `react-router-dom` · uses `document`
- `packages/web/src/widgets/quest-queue-bar/quest-queue-bar-widget.tsx` — imports `@mantine/core`, `react`

**web-B78**

- `packages/web/src/widgets/quest-queue-bar/queue-row-layer-widget.test.tsx` — imports `@testing-library/react`, `react-router-dom`
- `packages/web/src/widgets/quest-queue-bar/queue-row-layer-widget.tsx` — imports `react-router-dom`
- `packages/web/src/widgets/quest-spec-panel/contracts-layer-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/quest-spec-panel/contracts-layer-widget.tsx` — imports `@mantine/core`

**web-B79**

- `packages/web/src/widgets/quest-spec-panel/design-decisions-layer-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/quest-spec-panel/design-decisions-layer-widget.tsx` — imports `@mantine/core`
- `packages/web/src/widgets/quest-spec-panel/flow-tab-layer-widget.proxy.tsx` — imports `@testing-library/react`, `@testing-library/user-event`
- `packages/web/src/widgets/quest-spec-panel/flow-tab-layer-widget.test.tsx` — imports `@testing-library/react`

**web-B80**

- `packages/web/src/widgets/quest-spec-panel/flow-tab-queue-mark-layer-widget.proxy.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/quest-spec-panel/flow-tab-queue-mark-layer-widget.tsx` — imports `@tabler/icons-react`

**web-B81**

- `packages/web/src/widgets/quest-spec-panel/flows-layer-widget.proxy.tsx` — imports `@testing-library/react`, `@testing-library/user-event`
- `packages/web/src/widgets/quest-spec-panel/flows-layer-widget.test.tsx` — imports `@testing-library/react`, `@testing-library/user-event`
- `packages/web/src/widgets/quest-spec-panel/flows-layer-widget.tsx` — imports `react`, `@mantine/core`

**web-B82**

- `packages/web/src/widgets/quest-spec-panel/quest-spec-panel-widget.proxy.tsx` — imports `@testing-library/react`, `@testing-library/user-event`
- `packages/web/src/widgets/quest-spec-panel/quest-spec-panel-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/quest-spec-panel/quest-spec-panel-widget.tsx` — imports `react`, `@mantine/core`

**web-B83**

- `packages/web/src/widgets/quest-spec-panel/user-request-layer-widget.proxy.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/quest-spec-panel/user-request-layer-widget.tsx` — imports `@mantine/core`, `react`
- `packages/web/src/widgets/quest-summary/debt-row-layer-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/quest-summary/debt-row-layer-widget.tsx` — imports `@mantine/core`

**web-B84**

- `packages/web/src/widgets/quest-summary/flow-row-layer-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/quest-summary/flow-row-layer-widget.tsx` — imports `@mantine/core`
- `packages/web/src/widgets/quest-summary/human-check-panel-layer-widget.proxy.tsx` — imports `@testing-library/react`, `@testing-library/user-event`
- `packages/web/src/widgets/quest-summary/human-check-panel-layer-widget.tsx` — imports `@mantine/core`

**web-B85**

- `packages/web/src/widgets/quest-summary/human-check-row-layer-widget.proxy.tsx` — imports `@testing-library/react`, `@testing-library/user-event`
- `packages/web/src/widgets/quest-summary/human-check-row-layer-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/quest-summary/human-check-row-layer-widget.tsx` — imports `react`, `@mantine/core`

**web-B86**

- `packages/web/src/widgets/quest-summary/note-group-layer-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/quest-summary/note-group-layer-widget.tsx` — imports `@mantine/core`
- `packages/web/src/widgets/quest-summary/note-row-layer-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/quest-summary/note-row-layer-widget.tsx` — imports `@mantine/core`

**web-B87**

- `packages/web/src/widgets/quest-summary/observable-row-layer-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/quest-summary/observable-row-layer-widget.tsx` — imports `@mantine/core`

**web-B88**

- `packages/web/src/widgets/quest-summary/quest-summary-widget.proxy.tsx` — uses `console`
- `packages/web/src/widgets/quest-summary/quest-summary-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/quest-summary/quest-summary-widget.tsx` — imports `@mantine/core`

**web-B89**

- `packages/web/src/widgets/quest-summary/track-row-layer-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/quest-summary/track-row-layer-widget.tsx` — imports `@mantine/core`

**web-B90**

- `packages/web/src/widgets/quest-title-bar/quest-title-bar-widget.proxy.tsx` — imports `@testing-library/react`, `@testing-library/user-event`
- `packages/web/src/widgets/quest-title-bar/quest-title-bar-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/quest-title-bar/quest-title-bar-widget.tsx` — imports `react`, `@mantine/core`

**web-B91**

- `packages/web/src/widgets/queue-page/queue-page-widget.proxy.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/queue-page/queue-page-widget.test.tsx` — imports `react-router-dom`
- `packages/web/src/widgets/queue-page/queue-page-widget.tsx` — imports `@mantine/core`

**web-B92**

- `packages/web/src/widgets/queue-page/queue-row-layer-widget.test.tsx` — imports `@testing-library/react`, `react-router-dom`
- `packages/web/src/widgets/queue-page/queue-row-layer-widget.tsx` — imports `react-router-dom`
- `packages/web/src/widgets/rate-limit-card/rate-limit-card-widget.tsx` — imports `@mantine/core`
- `packages/web/src/widgets/rate-limits-stack/rate-limits-stack-widget.tsx` — imports `@mantine/core`

**web-B93**

- `packages/web/src/widgets/react-flow-diagram/flow-detail-panel-comment-row-layer-widget.proxy.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/react-flow-diagram/flow-detail-panel-comment-row-layer-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/react-flow-diagram/flow-detail-panel-contract-entry-layer-widget.proxy.tsx` — imports `@testing-library/react`

**web-B94**

- `packages/web/src/widgets/react-flow-diagram/flow-node-card-layer-widget.proxy.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/react-flow-diagram/flow-node-card-layer-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/react-flow-diagram/flow-node-card-layer-widget.tsx` — imports `@tabler/icons-react`

**web-B95**

- `packages/web/src/widgets/react-flow-diagram/flow-node-detail-panel-layer-widget.proxy.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/react-flow-diagram/flow-node-detail-panel-layer-widget.test.tsx` — imports `@testing-library/react`, `@testing-library/user-event`
- `packages/web/src/widgets/react-flow-diagram/flow-node-detail-panel-layer-widget.tsx` — imports `@tabler/icons-react`
- `packages/web/src/widgets/react-flow-diagram/flow-node-package-chip-layer-widget.proxy.tsx` — imports `@testing-library/react`

**web-B96**

- `packages/web/src/widgets/react-flow-diagram/flow-observable-node-layer-widget.proxy.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/react-flow-diagram/flow-portal-node-layer-widget.proxy.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/react-flow-diagram/flow-recipe-callout-layer-widget.proxy.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/react-flow-diagram/flow-recipe-row-layer-widget.proxy.tsx` — imports `@testing-library/react`

**web-B97**

- `packages/web/src/widgets/react-flow-diagram/react-flow-diagram-widget.proxy.tsx` — imports `@testing-library/react`, `@testing-library/user-event` · uses `console`
- `packages/web/src/widgets/react-flow-diagram/react-flow-diagram-widget.tsx` — imports `@tabler/icons-react` · uses `console`, `document`

**web-B98**

- `packages/web/src/widgets/react-flow/node-measure-layer-widget.proxy.tsx` — uses `document`
- `packages/web/src/widgets/react-flow/node-measure-layer-widget.test.tsx` — imports `react`, `@testing-library/react`
- `packages/web/src/widgets/react-flow/node-measure-layer-widget.tsx` — imports `react`

**web-B99**

- `packages/web/src/widgets/react-flow/react-flow-widget.test.tsx` — imports `react`, `@testing-library/react`, `@testing-library/user-event` · uses `document`
- `packages/web/src/widgets/react-flow/react-flow-widget.tsx` — imports `react` · uses `console`
- `packages/web/src/widgets/section-header/section-header-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/section-header/section-header-widget.tsx` — imports `@mantine/core`

**web-B100**

- `packages/web/src/widgets/session-view/session-view-widget.test.tsx` — imports `@testing-library/react`, `react-router-dom`
- `packages/web/src/widgets/session-view/session-view-widget.tsx` — imports `react-router-dom`, `@mantine/core`
- `packages/web/src/widgets/show-earlier-toggle/show-earlier-toggle-widget.test.tsx` — imports `@testing-library/react`, `@testing-library/user-event`
- `packages/web/src/widgets/show-earlier-toggle/show-earlier-toggle-widget.tsx` — imports `@mantine/core`

**web-B101** — waits on GB1

- `packages/web/src/widgets/streaming-indicator/streaming-indicator-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/streaming-indicator/streaming-indicator-widget.tsx` — imports `@mantine/core`, `react` · **needs** GB1 browser global `setInterval`; GB1 browser global `clearInterval`; GB1 browser global `setTimeout`; GB1 browser global `clearTimeout`

**web-B102** — waits on GB2

- `packages/web/src/widgets/subagent-chain/subagent-chain-widget.proxy.tsx` — imports `@testing-library/react`, `@testing-library/user-event` · **needs** GB2 browser global `HTMLElement`
- `packages/web/src/widgets/subagent-chain/subagent-chain-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/subagent-chain/subagent-chain-widget.tsx` — imports `@mantine/core`, `react`

**web-B103**

- `packages/web/src/widgets/thinking-row/thinking-row-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/thinking-row/thinking-row-widget.tsx` — imports `@mantine/core`
- `packages/web/src/widgets/tool-result-content/tool-result-content-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/tool-result-content/tool-result-content-widget.tsx` — imports `@mantine/core`

**web-B104**

- `packages/web/src/widgets/tool-result-content/tool-result-part-layer-widget.test.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/tool-result-content/tool-result-part-layer-widget.tsx` — imports `@mantine/core`
- `packages/web/src/widgets/tool-row/tool-row-field-layer-widget.test.tsx` — imports `@testing-library/react`, `@testing-library/user-event`
- `packages/web/src/widgets/tool-row/tool-row-field-layer-widget.tsx` — imports `@mantine/core`, `react`

**web-B105**

- `packages/web/src/widgets/tool-row/tool-row-widget.test.tsx` — imports `@testing-library/react`, `@testing-library/user-event`
- `packages/web/src/widgets/tool-row/tool-row-widget.tsx` — imports `@mantine/core`, `react`
- `packages/web/src/widgets/upload-progress-bar/upload-progress-bar-widget.proxy.tsx` — imports `@testing-library/react`
- `packages/web/src/widgets/upload-progress-bar/upload-progress-bar-widget.tsx` — imports `@mantine/core`

**web-B106**

- `packages/web/test/harnesses/chat-control/chat-control.harness.ts` — imports `@playwright/test` — leave the page-callback globals alone (FP)
- `packages/web/test/harnesses/claude-mock/claude-mock.harness.ts` — imports `fs`, `path`, `zod` · uses `process.env.X`
- `packages/web/test/harnesses/comment-box/comment-box.harness.ts` — imports `@playwright/test` — leave the page-callback globals alone (FP)
- `packages/web/test/harnesses/comment-queue-lifecycle/comment-queue-lifecycle.harness.ts` — imports `@playwright/test` — leave the page-callback globals alone (FP)

**web-B107**

- `packages/web/test/harnesses/comment-queue-send/comment-queue-send.harness.ts` — imports `@playwright/test` — leave the page-callback globals alone (FP)
- `packages/web/test/harnesses/composer-paste/composer-paste.harness.ts` — imports `fs`, `path`, `@playwright/test` · uses `atob`, `Buffer` — leave the page-callback globals alone (FP)
- `packages/web/test/harnesses/composer-send/composer-send.harness.ts` — imports `fs`, `path`, `@playwright/test` · uses `setTimeout`, `process.env.X` — leave the page-callback globals alone (FP)
- `packages/web/test/harnesses/dispatch-pause/dispatch-pause.harness.ts` — imports `@playwright/test`

**web-B108**

- `packages/web/test/harnesses/dispatch/dispatch.harness.ts` — imports `fs`, `path`, `@playwright/test`, `zod` · uses `process.env.X`, `setTimeout`
- `packages/web/test/harnesses/dm-target/dm-target.harness.ts` — imports `@playwright/test` · uses `process.env.X`

**web-B109** — waits on GN1

- `packages/web/test/harnesses/e2e-fixtures.ts` — imports `@playwright/test`
- `packages/web/test/harnesses/elapsed-duration/elapsed-duration.harness.ts` — imports `fs`, `path`, `@playwright/test` · uses `setInterval`, `clearInterval`
- `packages/web/test/harnesses/environment/environment.harness.ts` — imports `child_process`, `fs`, `path` · uses `git` · **needs** GN1 process env snapshot (whole `process.env`)
- `packages/web/test/harnesses/execution-row-status/execution-row-status.harness.ts` — imports `@playwright/test` — leave the page-callback globals alone (FP)

**web-B110**

- `packages/web/test/harnesses/flow-diagram/flow-diagram.harness.ts` — imports `@playwright/test` — leave the page-callback globals alone (FP)
- `packages/web/test/harnesses/followup/followup.harness.ts` — imports `fs`, `path`, `@playwright/test` — leave the page-callback globals alone (FP)

**web-B111**

- `packages/web/test/harnesses/global-setup.ts` — imports `fs`, `os`, `path` · uses `process.env.X`, `process.stderr`
- `packages/web/test/harnesses/global-teardown.ts` — imports `fs`, `os`, `path` · uses `process.env.X`

**web-B112**

- `packages/web/test/harnesses/guild/guild.harness.ts` — imports `@playwright/test` · uses `process.env.X`
- `packages/web/test/harnesses/navigation/navigation.harness.ts` — imports `@playwright/test` · uses `setTimeout` — leave the page-callback globals alone (FP)
- `packages/web/test/harnesses/network/network.harness.ts` — imports `@playwright/test`
- `packages/web/test/harnesses/open-handle-watch/open-handle-watch.harness.ts` — uses `process.env.X`

**web-B113**

- `packages/web/test/harnesses/persisted-comments/persisted-comments.harness.ts` — imports `@playwright/test`
- `packages/web/test/harnesses/quest-approved-modal/quest-approved-modal.harness.ts` — imports `@playwright/test`
- `packages/web/test/harnesses/quest-spec-readonly/quest-spec-readonly.harness.ts` — imports `fs`
- `packages/web/test/harnesses/quest/quest.harness.ts` — imports `fs`, `path`, `@playwright/test` · uses `process.env.X`

**web-B114**

- `packages/web/test/harnesses/rate-limits/rate-limits.harness.ts` — imports `fs`, `path` · uses `process.env.X`
- `packages/web/test/harnesses/session-subagent-duration/session-subagent-duration.harness.ts` — imports `@playwright/test` · uses `setInterval`, `clearInterval`
- `packages/web/test/harnesses/session/session.harness.ts` — imports `fs`, `path` · uses `process.env.X`
- `packages/web/test/harnesses/sticky-header/sticky-header.harness.ts` — imports `@playwright/test` — leave the page-callback globals alone (FP)

**web-B115**

- `packages/web/test/harnesses/subagent-duration-placement/subagent-duration-placement.harness.ts` — imports `@playwright/test` — leave the page-callback globals alone (FP)
- `packages/web/test/harnesses/subagent-duration-triple-chain/subagent-duration-triple-chain.harness.ts` — imports `fs`, `path`
- `packages/web/test/harnesses/subagent-duration/subagent-duration.harness.ts` — imports `fs`, `path`
- `packages/web/test/harnesses/subagent-launch-order/subagent-launch-order.harness.ts` — imports `@playwright/test` — leave the page-callback globals alone (FP)

**web-B116** — waits on GN5

- `packages/web/test/harnesses/transcript-images/transcript-images.harness.ts` — imports `fs`, `os`, `path`, `@playwright/test` · uses `Buffer`, `process.env.X` · **needs** GN5 node `zlib` — leave the page-callback globals alone (FP)
- `packages/web/test/harnesses/transcript-inline-layout/transcript-inline-layout.harness.ts` — imports `@playwright/test` — leave the page-callback globals alone (FP)
- `packages/web/test/harnesses/ward-mock/ward-mock.harness.ts` — imports `fs`, `path` · uses `process.env.X`
- `packages/web/test/harnesses/warpgate/warpgate.harness.ts` — imports `@playwright/test`

**web-B117** — waits on C3

- `packages/web/test/harnesses/ws-quest-lifecycle/ws-quest-lifecycle.harness.ts` — imports `@playwright/test`, `zod`
- `packages/web/vite.config.ts` — imports `node:fs`, `node:path`, `@vitejs/plugin-react` · uses `process.env.X` · **needs** C3 npm `vite`

#### `siegelense` — after the last adapter chunk lands

Dispatch none of this until A13/A14's last chunk is committed; re-run the census first, because that chunk rewrites or deletes many of these files. Files under `src/adapters/` are left out here — they belong to that chunk, not to A18.

**siegelense-Z (zod sweep).** Each file's only violation is `import … from 'zod'`; change the specifier to `'#gateway/npm/zod'` and nothing else.

- `packages/siegelense/src/brokers/run/execute/run-execute-step-layer-broker.proxy.ts`
- `packages/siegelense/src/brokers/step/dispatch/run-verb-layer-broker.proxy.ts`
- `packages/siegelense/src/brokers/step/target-resolve/step-target-resolve-broker.proxy.ts`
- `packages/siegelense/src/brokers/step/until/step-until-broker.proxy.ts`
- `packages/siegelense/src/contracts/attr-pair/attr-pair-contract.ts`
- `packages/siegelense/src/contracts/blank-reading/blank-reading-contract.ts`
- `packages/siegelense/src/contracts/boot-failure-marker/boot-failure-marker-contract.ts`
- `packages/siegelense/src/contracts/boot-lock/boot-lock-contract.ts`
- `packages/siegelense/src/contracts/boot-poll-outcome/boot-poll-outcome-contract.ts`
- `packages/siegelense/src/contracts/box-reading/box-reading-contract.ts`
- `packages/siegelense/src/contracts/browser-session/browser-session-contract.ts`
- `packages/siegelense/src/contracts/browser-session/browser-session.stub.ts`
- `packages/siegelense/src/contracts/buffer-entry/buffer-entry-contract.ts`
- `packages/siegelense/src/contracts/buffer-line-count/buffer-line-count-contract.ts`
- `packages/siegelense/src/contracts/capacity-answer/capacity-answer-contract.ts`
- `packages/siegelense/src/contracts/capacity-args/capacity-args-contract.ts`
- `packages/siegelense/src/contracts/capacity-measured/capacity-measured-contract.ts`
- `packages/siegelense/src/contracts/capacity-profile/capacity-profile-contract.ts`
- `packages/siegelense/src/contracts/capacity-suggestion/capacity-suggestion-contract.ts`
- `packages/siegelense/src/contracts/citation-gap/citation-gap-contract.ts`
- `packages/siegelense/src/contracts/citation-kind/citation-kind-contract.ts`
- `packages/siegelense/src/contracts/citation-kind/citation-kind.stub.ts`
- `packages/siegelense/src/contracts/citation-reference/citation-reference-contract.ts`
- `packages/siegelense/src/contracts/citation-resolution/citation-resolution-contract.ts`
- `packages/siegelense/src/contracts/cleanup-answer/cleanup-answer-contract.ts`
- `packages/siegelense/src/contracts/cleanup-args/cleanup-args-contract.ts`
- `packages/siegelense/src/contracts/clipboard-payload/clipboard-payload-contract.ts`
- `packages/siegelense/src/contracts/colour-channel/colour-channel-contract.ts`
- `packages/siegelense/src/contracts/compare-answer/compare-answer-contract.ts`
- `packages/siegelense/src/contracts/compare-args/compare-args-contract.ts`
- `packages/siegelense/src/contracts/compare-query/compare-query-contract.ts`
- `packages/siegelense/src/contracts/count-delta/count-delta-contract.ts`
- `packages/siegelense/src/contracts/decoded-frame/decoded-frame-contract.ts`
- `packages/siegelense/src/contracts/docs-answer/docs-answer-contract.ts`
- `packages/siegelense/src/contracts/docs-args/docs-args-contract.ts`
- `packages/siegelense/src/contracts/docs-scope/docs-scope-contract.ts`
- `packages/siegelense/src/contracts/docs-scope/docs-scope.stub.ts`
- `packages/siegelense/src/contracts/dom-field/dom-field-contract.ts`
- `packages/siegelense/src/contracts/dom-field/dom-field.stub.ts`
- `packages/siegelense/src/contracts/dom-node/dom-node-contract.ts`
- `packages/siegelense/src/contracts/dom-reading/dom-reading-contract.ts`
- `packages/siegelense/src/contracts/dom-rect/dom-rect-contract.ts`
- `packages/siegelense/src/contracts/dom-text-mode/dom-text-mode-contract.ts`
- `packages/siegelense/src/contracts/dom-text-mode/dom-text-mode.stub.ts`
- `packages/siegelense/src/contracts/driver-request-kind/driver-request-kind-contract.ts`
- `packages/siegelense/src/contracts/driver-request/driver-request-contract.ts`
- `packages/siegelense/src/contracts/driver-response/driver-response-contract.ts`
- `packages/siegelense/src/contracts/driving-oddity/driving-oddity-contract.ts`
- `packages/siegelense/src/contracts/elapsed-text/elapsed-text-contract.ts`
- `packages/siegelense/src/contracts/element-delta/element-delta-contract.ts`
- `packages/siegelense/src/contracts/element-flag/element-flag-contract.ts`
- `packages/siegelense/src/contracts/epoch-ms/epoch-ms-contract.ts`
- `packages/siegelense/src/contracts/file-descriptor/file-descriptor-contract.ts`
- `packages/siegelense/src/contracts/file-size-bytes/file-size-bytes-contract.ts`
- `packages/siegelense/src/contracts/file-stat/file-stat-contract.ts`
- `packages/siegelense/src/contracts/focused-element/focused-element-contract.ts`
- `packages/siegelense/src/contracts/health-reading/health-reading-contract.ts`
- `packages/siegelense/src/contracts/health-verdict/health-verdict-contract.ts`
- `packages/siegelense/src/contracts/health-verdict/health-verdict.stub.ts`
- `packages/siegelense/src/contracts/hex-colour/hex-colour-contract.ts`
- `packages/siegelense/src/contracts/hold-reading/hold-reading-contract.ts`
- `packages/siegelense/src/contracts/http-method/http-method-contract.ts`
- `packages/siegelense/src/contracts/http-method/http-method.stub.ts`
- `packages/siegelense/src/contracts/http-request-reading/http-request-reading-contract.ts`
- `packages/siegelense/src/contracts/instance-evidence-listing/instance-evidence-listing-contract.ts`
- `packages/siegelense/src/contracts/instance-heartbeat/instance-heartbeat-contract.ts`
- `packages/siegelense/src/contracts/instance-id/instance-id-contract.ts`
- `packages/siegelense/src/contracts/instance-manifest/instance-manifest-contract.ts`
- `packages/siegelense/src/contracts/instance-owner/instance-owner-contract.ts`
- `packages/siegelense/src/contracts/instance-state/instance-state-contract.ts`
- `packages/siegelense/src/contracts/instance-state/instance-state.stub.ts`
- `packages/siegelense/src/contracts/instance-status/instance-status-contract.ts`
- `packages/siegelense/src/contracts/key-listing/key-listing-contract.ts`
- `packages/siegelense/src/contracts/key-reading/key-reading-contract.ts`
- `packages/siegelense/src/contracts/key-row/key-row-contract.ts`
- `packages/siegelense/src/contracts/kill-args/kill-args-contract.ts`
- `packages/siegelense/src/contracts/kill-result/kill-result-contract.ts`
- `packages/siegelense/src/contracts/lane-process-name/lane-process-name-contract.ts`
- `packages/siegelense/src/contracts/lane-process/lane-process-contract.ts`
- `packages/siegelense/src/contracts/lane-session/lane-session-contract.ts`
- `packages/siegelense/src/contracts/lane-spec/lane-spec-contract.ts`
- `packages/siegelense/src/contracts/last-step-reading/last-step-reading-contract.ts`
- `packages/siegelense/src/contracts/left-alone/left-alone-contract.ts`
- `packages/siegelense/src/contracts/load-average/load-average-contract.ts`
- `packages/siegelense/src/contracts/locator-state/locator-state-contract.ts`
- `packages/siegelense/src/contracts/locator-state/locator-state.stub.ts`
- `packages/siegelense/src/contracts/log-level/log-level-contract.ts`
- `packages/siegelense/src/contracts/log-level/log-level.stub.ts`
- `packages/siegelense/src/contracts/machine-reading/machine-reading-contract.ts`
- `packages/siegelense/src/contracts/match-count/match-count-contract.ts`
- `packages/siegelense/src/contracts/megabytes/megabytes-contract.ts`
- `packages/siegelense/src/contracts/monitored-metric/monitored-metric-contract.ts`
- `packages/siegelense/src/contracts/monitored-metric/monitored-metric.stub.ts`
- `packages/siegelense/src/contracts/node-label/node-label-contract.ts`
- `packages/siegelense/src/contracts/orphan-reading/orphan-reading-contract.ts`
- `packages/siegelense/src/contracts/pixel-change/pixel-change-contract.ts`
- `packages/siegelense/src/contracts/pixel-coordinate/pixel-coordinate-contract.ts`
- `packages/siegelense/src/contracts/pixel-count/pixel-count-contract.ts`
- `packages/siegelense/src/contracts/port-pair/port-pair-contract.ts`
- `packages/siegelense/src/contracts/port-role/port-role-contract.ts`
- `packages/siegelense/src/contracts/process-group-id/process-group-id-contract.ts`
- `packages/siegelense/src/contracts/profile-args/profile-args-contract.ts`
- `packages/siegelense/src/contracts/profile-boot/profile-boot-contract.ts`
- `packages/siegelense/src/contracts/profile-observation/profile-observation-contract.ts`
- `packages/siegelense/src/contracts/profile-pool-size/profile-pool-size-contract.ts`
- `packages/siegelense/src/contracts/prune-answer/prune-answer-contract.ts`
- `packages/siegelense/src/contracts/prune-args/prune-args-contract.ts`
- `packages/siegelense/src/contracts/prune-asset-kind/prune-asset-kind-contract.ts`
- `packages/siegelense/src/contracts/prune-asset-kind/prune-asset-kind.stub.ts`
- `packages/siegelense/src/contracts/prune-asset/prune-asset-contract.ts`
- `packages/siegelense/src/contracts/prune-query/prune-query-contract.ts`
- `packages/siegelense/src/contracts/prune-refusal/prune-refusal-contract.ts`
- `packages/siegelense/src/contracts/prune-removal/prune-removal-contract.ts`
- `packages/siegelense/src/contracts/raw-dom-reading/raw-dom-reading-contract.ts`
- `packages/siegelense/src/contracts/raw-key-reading/raw-key-reading-contract.ts`
- `packages/siegelense/src/contracts/raw-ref-state/raw-ref-state-contract.ts`
- `packages/siegelense/src/contracts/raw-settle-probe/raw-settle-probe-contract.ts`
- `packages/siegelense/src/contracts/reading-count/reading-count-contract.ts`
- `packages/siegelense/src/contracts/reaped-instance/reaped-instance-contract.ts`
- `packages/siegelense/src/contracts/recipe-input-key/recipe-input-key-contract.ts`
- `packages/siegelense/src/contracts/recipe-listing-entry/recipe-listing-entry-contract.ts`
- `packages/siegelense/src/contracts/recipe-name/recipe-name-contract.ts`
- `packages/siegelense/src/contracts/recipes-answer/recipes-answer-contract.ts`
- `packages/siegelense/src/contracts/recipes-args/recipes-args-contract.ts`
- `packages/siegelense/src/contracts/recipes-listing/recipes-listing-contract.ts`
- `packages/siegelense/src/contracts/recipes-scaffold-file/recipes-scaffold-file-contract.ts`
- `packages/siegelense/src/contracts/ref-resolution/ref-resolution-contract.ts`
- `packages/siegelense/src/contracts/ref/ref-contract.ts`
- `packages/siegelense/src/contracts/registry-entry/registry-entry-contract.ts`
- `packages/siegelense/src/contracts/registry/registry-contract.ts`
- `packages/siegelense/src/contracts/repo-local-path/repo-local-path-contract.ts`
- `packages/siegelense/src/contracts/reset-level/reset-level-contract.ts`
- `packages/siegelense/src/contracts/reset-level/reset-level.stub.ts`
- `packages/siegelense/src/contracts/reset-reading/reset-reading-contract.ts`
- `packages/siegelense/src/contracts/reset-undid/reset-undid-contract.ts`
- `packages/siegelense/src/contracts/result-field/result-field-contract.ts`
- `packages/siegelense/src/contracts/result-kind/result-kind-contract.ts`
- `packages/siegelense/src/contracts/result-kind/result-kind.stub.ts`
- `packages/siegelense/src/contracts/result-where/result-where-contract.ts`
- `packages/siegelense/src/contracts/results-answer/results-answer-contract.ts`
- `packages/siegelense/src/contracts/results-args/results-args-contract.ts`
- `packages/siegelense/src/contracts/results-query/results-query-contract.ts`
- `packages/siegelense/src/contracts/run-args/run-args-contract.ts`
- `packages/siegelense/src/contracts/run-id/run-id-contract.ts`
- `packages/siegelense/src/contracts/run-index/run-index-contract.ts`
- `packages/siegelense/src/contracts/run-request/run-request-contract.ts`
- `packages/siegelense/src/contracts/run-result/run-result-contract.ts`
- `packages/siegelense/src/contracts/run-status/run-status-contract.ts`
- `packages/siegelense/src/contracts/run-status/run-status.stub.ts`
- `packages/siegelense/src/contracts/seed-binding-name/seed-binding-name-contract.ts`
- `packages/siegelense/src/contracts/seed-bindings/seed-bindings-contract.ts`
- `packages/siegelense/src/contracts/seed-result/seed-result-contract.ts`
- `packages/siegelense/src/contracts/selector/selector-contract.ts`
- `packages/siegelense/src/contracts/server-log-byte-count/server-log-byte-count-contract.ts`
- `packages/siegelense/src/contracts/server-log-window/server-log-window-contract.ts`
- `packages/siegelense/src/contracts/settle-reading/settle-reading-contract.ts`
- `packages/siegelense/src/contracts/shot-listing/shot-listing-contract.ts`
- `packages/siegelense/src/contracts/shot-open-reason/shot-open-reason-contract.ts`
- `packages/siegelense/src/contracts/shot-open-reason/shot-open-reason.stub.ts`
- `packages/siegelense/src/contracts/shutdown-reason/shutdown-reason-contract.ts`
- `packages/siegelense/src/contracts/since-marker/since-marker-contract.ts`
- `packages/siegelense/src/contracts/snapshot-boundary/snapshot-boundary-contract.ts`
- `packages/siegelense/src/contracts/snapshot-name/snapshot-name-contract.ts`
- `packages/siegelense/src/contracts/snapshot-ordinal/snapshot-ordinal-contract.ts`
- `packages/siegelense/src/contracts/snapshot-record/snapshot-record-contract.ts`
- `packages/siegelense/src/contracts/snapshots-answer/snapshots-answer-contract.ts`
- `packages/siegelense/src/contracts/snapshots-args/snapshots-args-contract.ts`
- `packages/siegelense/src/contracts/spec-hash/spec-hash-contract.ts`
- `packages/siegelense/src/contracts/spec-name/spec-name-contract.ts`
- `packages/siegelense/src/contracts/spec-profile/spec-profile-contract.ts`
- `packages/siegelense/src/contracts/start-args/start-args-contract.ts`
- `packages/siegelense/src/contracts/status-answer/status-answer-contract.ts`
- `packages/siegelense/src/contracts/status-args/status-args-contract.ts`
- `packages/siegelense/src/contracts/status-query/status-query-contract.ts`
- `packages/siegelense/src/contracts/step-candidate/step-candidate-contract.ts`
- `packages/siegelense/src/contracts/step-expectation/step-expectation-contract.ts`
- `packages/siegelense/src/contracts/step-expectation/step-expectation.stub.ts`
- `packages/siegelense/src/contracts/step-file-path/step-file-path-contract.ts`
- `packages/siegelense/src/contracts/step-index/step-index-contract.ts`
- `packages/siegelense/src/contracts/step-output-name/step-output-name-contract.ts`
- `packages/siegelense/src/contracts/step-path/step-path-contract.ts`
- `packages/siegelense/src/contracts/step-range/step-range-contract.ts`
- `packages/siegelense/src/contracts/step-reading/step-reading-contract.ts`
- `packages/siegelense/src/contracts/step-ref/step-ref-contract.ts`
- `packages/siegelense/src/contracts/step-verb/step-verb-contract.ts`
- `packages/siegelense/src/contracts/step-verb/step-verb.stub.ts`
- `packages/siegelense/src/contracts/step/step-contract.ts`
- `packages/siegelense/src/contracts/stop-on/stop-on-contract.ts`
- `packages/siegelense/src/contracts/stop-on/stop-on.stub.ts`
- `packages/siegelense/src/contracts/stopped-at/stopped-at-contract.ts`
- `packages/siegelense/src/contracts/storage-reading/storage-reading-contract.ts`
- `packages/siegelense/src/contracts/until-console-pattern/until-console-pattern-contract.ts`
- `packages/siegelense/src/contracts/until-file-path/until-file-path-contract.ts`
- `packages/siegelense/src/contracts/until-response/until-response-contract.ts`
- `packages/siegelense/src/contracts/url-path/url-path-contract.ts`
- `packages/siegelense/src/contracts/video-action/video-action-contract.ts`
- `packages/siegelense/src/contracts/video-action/video-action.stub.ts`
- `packages/siegelense/src/contracts/video-result/video-result-contract.ts`
- `packages/siegelense/src/contracts/zod-issue-error/zod-issue-error-contract.ts`

**siegelense-B01**

- `packages/siegelense/src/brokers/boot-lock/acquire/boot-lock-acquire-broker.test.ts` — uses `process.pid`
- `packages/siegelense/src/brokers/boot-lock/acquire/boot-lock-acquire-broker.ts` — uses `process.pid`, `setTimeout`

**siegelense-B02**

- `packages/siegelense/src/brokers/browser-session/launch/browser-session-launch-broker.test.ts` — uses `Buffer`
- `packages/siegelense/src/brokers/browser-session/launch/browser-session-launch-broker.ts` — uses `process.env.X`, `process.stderr`, `atob` — leave the page-callback globals alone (FP)
- `packages/siegelense/src/brokers/browser-session/launch/paste-payload-layer-broker.test.ts` — uses `Buffer`

**siegelense-B03**

- `packages/siegelense/src/brokers/driver/heartbeat-tick/driver-heartbeat-tick-broker.proxy.ts` — uses `process.stderr`
- `packages/siegelense/src/brokers/driver/heartbeat-tick/driver-heartbeat-tick-broker.test.ts` — uses `process.pid`
- `packages/siegelense/src/brokers/driver/heartbeat-tick/driver-heartbeat-tick-broker.ts` — uses `process.pid`, `process.stderr`

**siegelense-B04**

- `packages/siegelense/src/brokers/heartbeat/write/heartbeat-write-broker.ts` — uses `process.stderr`
- `packages/siegelense/src/brokers/instance/kill/instance-kill-broker.proxy.ts` — imports `fs`, `fs/promises`, `net`
- `packages/siegelense/src/brokers/instance/kill/instance-kill-broker.ts` — uses `process.stderr`, `setTimeout`

**siegelense-B05**

- `packages/siegelense/src/brokers/instance/reserve/instance-reserve-broker.proxy.ts` — uses `crypto`
- `packages/siegelense/src/brokers/instance/reserve/instance-reserve-broker.test.ts` — uses `process.pid`, `process.cwd`
- `packages/siegelense/src/brokers/instance/reserve/instance-reserve-broker.ts` — uses `crypto`, `process.pid`
- `packages/siegelense/src/brokers/instance/run/instance-run-broker.proxy.ts` — imports `fs`, `fs/promises`

**siegelense-B06** — waits on GN1

- `packages/siegelense/src/brokers/instance/start/instance-start-boot-poll-layer-broker.ts` — uses `setTimeout`
- `packages/siegelense/src/brokers/instance/start/instance-start-broker.proxy.ts` — imports `fs`, `fs/promises` · uses `process.stderr`, `crypto`, `process.execPath`
- `packages/siegelense/src/brokers/instance/start/instance-start-broker.ts` — uses `process.stderr`, `process.execPath` · **needs** GN1 process env snapshot (whole `process.env`)

**siegelense-B07** — waits on GN1

- `packages/siegelense/src/brokers/lane/boot/lane-boot-broker.proxy.ts` — **needs** GN1 process env snapshot (whole `process.env`)
- `packages/siegelense/src/brokers/lane/boot/lane-boot-broker.ts` — **needs** GN1 process env snapshot (whole `process.env`)
- `packages/siegelense/src/brokers/lane/boot/server-log-reader-layer-broker.ts` — uses `Buffer`
- `packages/siegelense/src/brokers/lane/ready-wait/lane-ready-wait-broker.ts` — uses `setTimeout`

**siegelense-B08**

- `packages/siegelense/src/brokers/lane/teardown/lane-teardown-broker.proxy.ts` — imports `fs`, `process`
- `packages/siegelense/src/brokers/lane/teardown/lane-teardown-broker.test.ts` — uses `process.stderr`
- `packages/siegelense/src/brokers/lane/teardown/lane-teardown-broker.ts` — uses `process.stderr`, `setTimeout`

**siegelense-B09**

- `packages/siegelense/src/brokers/locations/socket-path-find/locations-socket-path-find-broker.test.ts` — uses `Buffer`
- `packages/siegelense/src/brokers/profile/read/profile-read-broker.proxy.ts` — uses `process.stderr`
- `packages/siegelense/src/brokers/profile/read/profile-read-broker.ts` — uses `process.stderr`

**siegelense-B10** — waits on GN1, GN2

- `packages/siegelense/src/brokers/profile/sample-record/profile-sample-record-broker.integration.test.ts` — uses `process.env.X`, `process.cwd` · **needs** GN1 process env write/delete (`setEnv`/`deleteEnv`); GN2 process.chdir; GN1 process env snapshot (whole `process.env`)
- `packages/siegelense/src/brokers/profile/sample-record/profile-sample-record-broker.proxy.ts` — uses `process.stderr`
- `packages/siegelense/src/brokers/profile/sample-record/profile-sample-record-broker.ts` — uses `process.stderr`

**siegelense-B11** — waits on GN1

- `packages/siegelense/src/brokers/prune/assets-list/prune-assets-list-broker.proxy.ts` — imports `fs/promises`
- `packages/siegelense/src/brokers/prune/run/prune-run-broker.integration.test.ts` — uses `process.env.X` · **needs** GN1 process env write/delete (`setEnv`/`deleteEnv`); GN1 process env snapshot (whole `process.env`)

**siegelense-B12**

- `packages/siegelense/src/brokers/registry/lock-acquire/registry-lock-acquire-broker.ts` — uses `setTimeout`
- `packages/siegelense/src/brokers/results/read/results-read-broker.proxy.ts` — imports `os`
- `packages/siegelense/src/brokers/results/read/results-read-broker.test.ts` — uses `Buffer`

**siegelense-B13**

- `packages/siegelense/src/brokers/results/read/server-window-read-layer-broker.test.ts` — uses `Buffer`
- `packages/siegelense/src/brokers/results/read/server-window-read-layer-broker.ts` — uses `Buffer`

**siegelense-B14**

- `packages/siegelense/src/brokers/run/execute/run-execute-broker.proxy.ts` — imports `fs`, `fs/promises`, `zod`
- `packages/siegelense/src/brokers/run/execute/run-execute-broker.ts` — uses `process.stderr`

**siegelense-B15**

- `packages/siegelense/src/brokers/shot/blank-read/shot-blank-read-broker.proxy.ts` — uses `Buffer`
- `packages/siegelense/src/brokers/shot/blank-read/shot-blank-read-broker.ts` — uses `Buffer`
- `packages/siegelense/src/brokers/shot/change-read/shot-change-read-broker.proxy.ts` — uses `Buffer`
- `packages/siegelense/src/brokers/shot/change-read/shot-change-read-broker.ts` — uses `Buffer`

**siegelense-B16**

- `packages/siegelense/src/brokers/status/read/profile-solo-read-layer-broker.proxy.ts` — uses `process.stderr`
- `packages/siegelense/src/brokers/status/read/profile-solo-read-layer-broker.ts` — uses `process.stderr`

**siegelense-B17**

- `packages/siegelense/src/brokers/step/dispatch/step-dispatch-broker.proxy.ts` — imports `zod` · uses `Buffer`
- `packages/siegelense/src/brokers/step/dispatch/step-dispatch-broker.ts` — uses `process.stderr`
- `packages/siegelense/src/brokers/step/hold/step-hold-broker.proxy.ts` — imports `pngjs` · uses `Buffer`
- `packages/siegelense/src/brokers/step/until/until-buffer-match-layer-broker.ts` — uses `setTimeout`

**siegelense-B18**

- `packages/siegelense/src/brokers/step/until/until-file-wait-layer-broker.ts` — uses `setTimeout`
- `packages/siegelense/src/brokers/step/video/step-video-broker.proxy.ts` — imports `fs`, `fs/promises`

**siegelense-B19** — waits on GN1, GN2

- `packages/siegelense/src/flows/driver/driver-flow.integration.test.ts` — uses `process.env.X`, `process.cwd` · **needs** GN1 process env write/delete (`setEnv`/`deleteEnv`); GN1 process env snapshot (whole `process.env`); GN2 process.chdir
- `packages/siegelense/src/flows/install/install-flow.integration.test.ts` — **needs** GN1 process env write/delete (`setEnv`/`deleteEnv`); GN1 process env snapshot (whole `process.env`)
- `packages/siegelense/src/flows/siegelense/siegelense-capacity-layer-flow.integration.test.ts` — uses `process.env.X`, `process.cwd`, `process.stdout` · **needs** GN1 process env write/delete (`setEnv`/`deleteEnv`); GN2 process.chdir; GN1 process env snapshot (whole `process.env`)
- `packages/siegelense/src/flows/siegelense/siegelense-cleanup-layer-flow.integration.test.ts` — uses `process.stdout`

**siegelense-B20** — waits on GN1

- `packages/siegelense/src/flows/siegelense/siegelense-compare-layer-flow.integration.test.ts` — uses `process.stdout`
- `packages/siegelense/src/flows/siegelense/siegelense-docs-layer-flow.integration.test.ts` — uses `process.stdout`
- `packages/siegelense/src/flows/siegelense/siegelense-flow.integration.test.ts` — uses `process.env.X`, `process.stdout` · **needs** GN1 process env write/delete (`setEnv`/`deleteEnv`); GN1 process env snapshot (whole `process.env`)
- `packages/siegelense/src/flows/siegelense/siegelense-flow.ts` — uses `process.stdout`

**siegelense-B21** — waits on GN1

- `packages/siegelense/src/flows/siegelense/siegelense-kill-layer-flow.integration.test.ts` — uses `process.stdout`
- `packages/siegelense/src/flows/siegelense/siegelense-prune-layer-flow.integration.test.ts` — uses `process.env.X`, `process.stdout` · **needs** GN1 process env write/delete (`setEnv`/`deleteEnv`); GN1 process env snapshot (whole `process.env`)
- `packages/siegelense/src/flows/siegelense/siegelense-recipes-layer-flow.integration.test.ts` — uses `process.stdout`
- `packages/siegelense/src/flows/siegelense/siegelense-results-layer-flow.integration.test.ts` — uses `process.stdout`

**siegelense-B22** — waits on GN1

- `packages/siegelense/src/flows/siegelense/siegelense-run-layer-flow.integration.test.ts` — uses `process.env.X` · **needs** GN1 process env write/delete (`setEnv`/`deleteEnv`); GN1 process env snapshot (whole `process.env`)
- `packages/siegelense/src/flows/siegelense/siegelense-snapshots-layer-flow.integration.test.ts` — uses `process.env.X`, `process.stdout` · **needs** GN1 process env write/delete (`setEnv`/`deleteEnv`); GN1 process env snapshot (whole `process.env`)
- `packages/siegelense/src/flows/siegelense/siegelense-status-layer-flow.integration.test.ts` — uses `process.env.X`, `process.stdout` · **needs** GN1 process env write/delete (`setEnv`/`deleteEnv`); GN1 process env snapshot (whole `process.env`)

**siegelense-B23**

- `packages/siegelense/src/responders/install/link-create/install-link-create-responder.proxy.ts` — imports `fs/promises`
- `packages/siegelense/src/responders/siegelense/capacity/siegelense-capacity-responder.proxy.ts` — uses `process.stdout`
- `packages/siegelense/src/responders/siegelense/capacity/siegelense-capacity-responder.ts` — uses `process.stdout`

**siegelense-B24**

- `packages/siegelense/src/responders/siegelense/cleanup/siegelense-cleanup-responder.proxy.ts` — uses `process.stdout`
- `packages/siegelense/src/responders/siegelense/cleanup/siegelense-cleanup-responder.ts` — uses `process.stdout`
- `packages/siegelense/src/responders/siegelense/compare/siegelense-compare-responder.proxy.ts` — uses `process.stdout`
- `packages/siegelense/src/responders/siegelense/compare/siegelense-compare-responder.ts` — uses `process.stdout`

**siegelense-B25**

- `packages/siegelense/src/responders/siegelense/docs/siegelense-docs-responder.proxy.ts` — uses `process.stdout`
- `packages/siegelense/src/responders/siegelense/docs/siegelense-docs-responder.ts` — uses `process.stdout`
- `packages/siegelense/src/responders/siegelense/driver/driver-idle-wait-layer-responder.proxy.ts` — uses `setTimeout`
- `packages/siegelense/src/responders/siegelense/driver/driver-idle-wait-layer-responder.ts` — uses `setTimeout`, `clearTimeout`

**siegelense-B26** — waits on GN2, GN3

- `packages/siegelense/src/responders/siegelense/driver/driver-serve-layer-responder.proxy.ts` — uses `setInterval`, `process.stderr` · **needs** GN2a process.<object>
- `packages/siegelense/src/responders/siegelense/driver/driver-serve-layer-responder.test.ts` — **needs** GN3 node global `setImmediate`
- `packages/siegelense/src/responders/siegelense/driver/driver-serve-layer-responder.ts` — uses `process.stderr`, `setInterval`, `clearInterval` · **needs** GN2 process.on for a non-signal event

**siegelense-B27**

- `packages/siegelense/src/responders/siegelense/driver/siegelense-driver-responder.test.ts` — uses `process.pid`
- `packages/siegelense/src/responders/siegelense/driver/siegelense-driver-responder.ts` — uses `process.stderr`, `process.pid`
- `packages/siegelense/src/responders/siegelense/fleet/siegelense-fleet-responder.proxy.ts` — uses `process.stdout`
- `packages/siegelense/src/responders/siegelense/fleet/siegelense-fleet-responder.ts` — uses `process.stdout`

**siegelense-B28**

- `packages/siegelense/src/responders/siegelense/kill/siegelense-kill-responder.proxy.ts` — uses `process.stdout`
- `packages/siegelense/src/responders/siegelense/kill/siegelense-kill-responder.ts` — uses `process.stdout`
- `packages/siegelense/src/responders/siegelense/prune/siegelense-prune-responder.proxy.ts` — uses `process.stdout`
- `packages/siegelense/src/responders/siegelense/prune/siegelense-prune-responder.ts` — uses `process.stdout`

**siegelense-B29**

- `packages/siegelense/src/responders/siegelense/recipes/siegelense-recipes-responder.proxy.ts` — uses `process.stdout`
- `packages/siegelense/src/responders/siegelense/recipes/siegelense-recipes-responder.ts` — uses `process.stdout`
- `packages/siegelense/src/responders/siegelense/results/siegelense-results-responder.proxy.ts` — uses `process.stdout`
- `packages/siegelense/src/responders/siegelense/results/siegelense-results-responder.ts` — uses `process.stdout`

**siegelense-B30**

- `packages/siegelense/src/responders/siegelense/run/siegelense-run-responder.proxy.ts` — uses `process.stdout`
- `packages/siegelense/src/responders/siegelense/run/siegelense-run-responder.ts` — uses `process.stdout`
- `packages/siegelense/src/responders/siegelense/snapshots/siegelense-snapshots-responder.proxy.ts` — uses `process.stdout`
- `packages/siegelense/src/responders/siegelense/snapshots/siegelense-snapshots-responder.ts` — uses `process.stdout`

**siegelense-B31**

- `packages/siegelense/src/responders/siegelense/start/siegelense-start-responder.proxy.ts` — uses `process.stdout`
- `packages/siegelense/src/responders/siegelense/start/siegelense-start-responder.ts` — uses `process.stdout`
- `packages/siegelense/src/responders/siegelense/status/siegelense-status-responder.proxy.ts` — uses `process.stdout`
- `packages/siegelense/src/responders/siegelense/status/siegelense-status-responder.ts` — uses `process.stdout`

**siegelense-B32** — waits on GN1

- `packages/siegelense/src/startup/start-install.integration.test.ts` — **needs** GN1 process env write/delete (`setEnv`/`deleteEnv`); GN1 process env snapshot (whole `process.env`)
- `packages/siegelense/src/startup/start-siegelense-driver.integration.test.ts` — uses `process.env.X` · **needs** GN1 process env write/delete (`setEnv`/`deleteEnv`); GN1 process env snapshot (whole `process.env`)
- `packages/siegelense/src/startup/start-siegelense.integration.test.ts` — uses `process.env.X`, `process.stdout` · **needs** GN1 process env write/delete (`setEnv`/`deleteEnv`); GN1 process env snapshot (whole `process.env`)

**siegelense-B33** — waits on GN1

- `packages/siegelense/test/harnesses/driver-fleet/driver-fleet.harness.ts` — imports `fs`, `net`, `process`, `path` · uses `setTimeout`, `process.stderr` · **needs** GN1 process env write/delete (`setEnv`/`deleteEnv`)
- `packages/siegelense/test/harnesses/evidence-age/evidence-age.harness.ts` — imports `fs`, `fs/promises`
- `packages/siegelense/test/harnesses/evidence-tree/evidence-tree.harness.ts` — imports `child_process`, `fs`, `pngjs` · uses `Buffer`, `process.env.X`, `process.kill`, `process.stderr` · **needs** GN1 process env write/delete (`setEnv`/`deleteEnv`); GN1 process env snapshot (whole `process.env`)
- `packages/siegelense/test/harnesses/npm-command-fake/npm-command-fake.harness.ts` — imports `path` · uses `process.env.X` · **needs** GN1 process env write/delete (`setEnv`/`deleteEnv`)

**siegelense-B34**

- `packages/siegelense/test/harnesses/seed-home/seed-home.harness.ts` — imports `fs`, `path`
- `packages/siegelense/test/harnesses/snapshot-store/snapshot-store.harness.ts` — imports `fs/promises` · uses `crypto`

#### `testing` — after the last adapter chunk lands

Dispatch none of this until A13/A14's last chunk is committed; re-run the census first, because that chunk rewrites or deletes many of these files. Files under `src/adapters/` are left out here — they belong to that chunk, not to A18.

**testing-Z (zod sweep).** Each file's only violation is `import … from 'zod'`; change the specifier to `'#gateway/npm/zod'` and nothing else.

- `packages/testing/src/contracts/armed-timer/armed-timer-contract.ts`
- `packages/testing/src/contracts/base-name/base-name-contract.ts`
- `packages/testing/src/contracts/command-name/command-name-contract.ts`
- `packages/testing/src/contracts/delay-milliseconds/delay-milliseconds-contract.ts`
- `packages/testing/src/contracts/endpoint-control/endpoint-control-contract.ts`
- `packages/testing/src/contracts/endpoint-mock-lifecycle/endpoint-mock-lifecycle-contract.ts`
- `packages/testing/src/contracts/epoch-timestamp/epoch-timestamp-contract.ts`
- `packages/testing/src/contracts/exit-code/exit-code-contract.ts`
- `packages/testing/src/contracts/factory-function-text/factory-function-text-contract.ts`
- `packages/testing/src/contracts/file-content/file-content-contract.ts`
- `packages/testing/src/contracts/file-name/file-name-contract.ts`
- `packages/testing/src/contracts/file-path/file-path-contract.ts`
- `packages/testing/src/contracts/identifier-name/identifier-name-contract.ts`
- `packages/testing/src/contracts/import-path/import-path-contract.ts`
- `packages/testing/src/contracts/install-testbed/install-testbed-contract.ts`
- `packages/testing/src/contracts/isolate-modules-mock/isolate-modules-mock-contract.ts`
- `packages/testing/src/contracts/match-specificity/match-specificity-contract.ts`
- `packages/testing/src/contracts/mock-call/mock-call-contract.ts`
- `packages/testing/src/contracts/mock-function-name/mock-function-name-contract.ts`
- `packages/testing/src/contracts/mock-handle/mock-handle-contract.ts`
- `packages/testing/src/contracts/mock-process-behavior/mock-process-behavior-contract.ts`
- `packages/testing/src/contracts/mock-spawn-result/mock-spawn-result-contract.ts`
- `packages/testing/src/contracts/mock-staging/mock-staging-contract.ts`
- `packages/testing/src/contracts/module-name/module-name-contract.ts`
- `packages/testing/src/contracts/msw-request-id/msw-request-id-contract.ts`
- `packages/testing/src/contracts/network-log-entry/network-log-entry-contract.ts`
- `packages/testing/src/contracts/open-handle-finding/open-handle-finding-contract.ts`
- `packages/testing/src/contracts/package-json/package-json-contract.ts`
- `packages/testing/src/contracts/package-specifier-parts/package-specifier-parts-contract.ts`
- `packages/testing/src/contracts/pending-request/pending-request-contract.ts`
- `packages/testing/src/contracts/playwright-line-results/playwright-line-results-contract.ts`
- `packages/testing/src/contracts/process-output/process-output-contract.ts`
- `packages/testing/src/contracts/proxy-import-edge/proxy-import-edge-contract.ts`
- `packages/testing/src/contracts/proxy-mock-queue-entry/proxy-mock-queue-entry-contract.ts`
- `packages/testing/src/contracts/queue-metadata/queue-metadata-contract.ts`
- `packages/testing/src/contracts/recorded-calls/recorded-calls-contract.ts`
- `packages/testing/src/contracts/relative-path/relative-path-contract.ts`
- `packages/testing/src/contracts/request-count/request-count-contract.ts`
- `packages/testing/src/contracts/script-name/script-name-contract.ts`
- `packages/testing/src/contracts/source-file-name/source-file-name-contract.ts`
- `packages/testing/src/contracts/staged-call/staged-call-contract.ts`
- `packages/testing/src/contracts/subdir-name/subdir-name-contract.ts`
- `packages/testing/src/contracts/test-guild/test-guild-contract.ts`
- `packages/testing/src/contracts/test-status/test-status-contract.ts`
- `packages/testing/src/contracts/testbed-config/testbed-config-contract.ts`
- `packages/testing/src/contracts/timer-handle/timer-handle-contract.ts`
- `packages/testing/src/contracts/typescript-node-factory/typescript-node-factory-contract.ts`
- `packages/testing/src/contracts/typescript-program/typescript-program-contract.ts`
- `packages/testing/src/contracts/typescript-source-file/typescript-source-file-contract.ts`
- `packages/testing/src/contracts/typescript-statement/typescript-statement-contract.ts`
- `packages/testing/src/contracts/unhandled-request-message/unhandled-request-message-contract.ts`
- `packages/testing/src/contracts/workspace-package-export-source-path/workspace-package-export-source-path-contract.ts`
- `packages/testing/src/contracts/workspace-package-json/workspace-package-json-contract.ts`
- `packages/testing/src/contracts/ws-log-entry/ws-log-entry-contract.ts`
- `packages/testing/src/responders/endpoint-mock/listen/endpoint-mock-listen-responder.proxy.ts`

**testing-B01**

- `packages/testing/src/brokers/install-testbed/create/install-testbed-create-broker.proxy.ts` — imports `crypto`
- `packages/testing/src/brokers/install-testbed/create/install-testbed-create-broker.test.ts` — uses `Buffer`

**testing-B02**

- `packages/testing/src/brokers/integration-environment/create/integration-environment-create-broker.proxy.ts` — imports `crypto`
- `packages/testing/src/brokers/integration-environment/create/integration-environment-create-broker.test.ts` — uses `Buffer`
- `packages/testing/src/brokers/integration-environment/create/integration-environment-create-broker.ts` — `runSync({ command: 'npm' })` → #gateway/bin/npm (`install`/`npmRun`)

**testing-B03** — waits on GN4

- `packages/testing/src/brokers/network-record/capture/network-record-capture-broker.proxy.ts` — uses `process.stderr` · **needs** GN4 node global `Request`
- `packages/testing/src/brokers/network-record/capture/network-record-capture-broker.test.ts` — **needs** GN4 raw `fetch` (node gateway exports only fetchJson/fetchOk/fetchWithStatus)
- `packages/testing/src/brokers/network-record/capture/network-record-capture-broker.ts` — uses `process.stderr`

**testing-B04**

- `packages/testing/src/brokers/network-record/playwright/network-record-playwright-broker.proxy.ts` — uses `process.stderr`
- `packages/testing/src/brokers/network-record/playwright/network-record-playwright-broker.test.ts` — uses `setTimeout`
- `packages/testing/src/brokers/network-record/playwright/network-record-playwright-broker.ts` — uses `process.stderr`

**testing-B05**

- `packages/testing/src/brokers/open-handle/report/open-handle-report-broker.test.ts` — uses `setInterval`, `clearInterval`
- `packages/testing/src/brokers/open-handle/tracking/open-handle-tracking-broker.test.ts` — uses `setTimeout`, `clearTimeout`, `setInterval`, `clearInterval`

**testing-B06** — waits on GN3

- `packages/testing/src/brokers/timers/watch/timers-watch-broker.test.ts` — uses `setInterval`, `clearInterval`, `setTimeout`, `clearTimeout` · **needs** GN3 node global `setImmediate`
- `packages/testing/src/brokers/timers/watch/timers-watch-broker.ts` — uses `setTimeout`, `setInterval`, `clearTimeout`, `clearInterval` · **needs** GN3 node global `setImmediate`; GN3 node global `clearImmediate`

**testing-B07** — waits on GN4

- `packages/testing/src/contracts/timer-handle/timer-handle-contract.test.ts` — uses `setInterval`, `clearInterval`
- `packages/testing/src/flows/endpoint-mock/endpoint-mock-flow.integration.test.ts` — **needs** GN4 raw `fetch` (node gateway exports only fetchJson/fetchOk/fetchWithStatus)

**testing-B08** — waits on GN2

- `packages/testing/src/guards/is-timer-holding-loop/is-timer-holding-loop-guard.test.ts` — uses `setInterval`, `clearInterval`
- `packages/testing/src/middleware/child-process-mock/child-process-mock-middleware.ts` — uses `setTimeout` · **needs** GN2 process.nextTick
- `packages/testing/src/middleware/mantine-render/mantine-render-middleware.test.ts` — uses `document`
- `packages/testing/src/middleware/spy-on-register/spy-on-register-middleware.test.ts` — uses `process.stdout`

**testing-B09** — waits on GN4

- `packages/testing/src/module-resolution.integration.test.ts` — imports `path`
- `packages/testing/src/responders/endpoint-mock/listen/endpoint-mock-listen-responder.test.ts` — uses `setTimeout` · **needs** GN4 raw `fetch` (node gateway exports only fetchJson/fetchOk/fetchWithStatus)

**testing-B10**

- `packages/testing/src/responders/network-record/lifecycle/network-record-lifecycle-responder.test.ts` — uses `process.stderr`
- `packages/testing/src/responders/network-record/lifecycle/network-record-lifecycle-responder.ts` — uses `process.stderr`

**testing-B11** — waits on GN4

- `packages/testing/src/state/msw-server/msw-server-state.test.ts` — **needs** GN4 raw `fetch` (node gateway exports only fetchJson/fetchOk/fetchWithStatus)
- `packages/testing/src/transform-path-sources.integration.test.ts` — imports `fs`, `path`

**testing-B12** — waits on GN4

- `packages/testing/src/transformers/msw-response-to-network-entry/msw-response-to-network-entry-transformer.test.ts` — **needs** GN4 node global `Response`

The siegelense files under `src/adapters/` that the scan flagged are NOT A18's — they belong to A13's running
chunk, which rewrites or deletes them:

- `packages/siegelense/src/adapters/child-process/spawn-detached/child-process-spawn-detached-adapter.proxy.ts`
- `packages/siegelense/src/adapters/child-process/spawn-detached/child-process-spawn-detached-adapter.ts`
- `packages/siegelense/src/adapters/cli-package/bin-resolve/cli-package-bin-resolve-adapter.proxy.ts`
- `packages/siegelense/src/adapters/cli-package/bin-resolve/cli-package-bin-resolve-adapter.ts`
- `packages/siegelense/src/adapters/cli-package/bin-resolve/package-root-find-layer-adapter.proxy.ts`
- `packages/siegelense/src/adapters/cli-package/bin-resolve/package-root-find-layer-adapter.ts`
- `packages/siegelense/src/adapters/fetch/http-request/fetch-http-request-adapter.ts`
- `packages/siegelense/src/adapters/fs/close-fd/fs-close-fd-adapter.proxy.ts`
- `packages/siegelense/src/adapters/fs/close-fd/fs-close-fd-adapter.ts`
- `packages/siegelense/src/adapters/fs/rm/fs-rm-adapter.proxy.ts`
- `packages/siegelense/src/adapters/fs/rm/fs-rm-adapter.ts`
- `packages/siegelense/src/adapters/fs/stat/fs-stat-adapter.proxy.ts`
- `packages/siegelense/src/adapters/fs/stat/fs-stat-adapter.ts`
- `packages/siegelense/src/adapters/fs/unlink/fs-unlink-adapter.proxy.ts`
- `packages/siegelense/src/adapters/fs/unlink/fs-unlink-adapter.ts`
- `packages/siegelense/src/adapters/fs/write-file/fs-write-file-adapter.proxy.ts`
- `packages/siegelense/src/adapters/fs/write-file/fs-write-file-adapter.ts`
- `packages/siegelense/src/adapters/net/unix-request/net-unix-request-adapter.proxy.ts`
- `packages/siegelense/src/adapters/net/unix-request/net-unix-request-adapter.ts`
- `packages/siegelense/src/adapters/net/unix-serve/net-unix-serve-adapter.proxy.ts`
- `packages/siegelense/src/adapters/net/unix-serve/net-unix-serve-adapter.test.ts`
- `packages/siegelense/src/adapters/net/unix-serve/net-unix-serve-adapter.ts`
- `packages/siegelense/src/adapters/os/tmpdir/os-tmpdir-adapter.proxy.ts`
- `packages/siegelense/src/adapters/os/tmpdir/os-tmpdir-adapter.ts`
- `packages/siegelense/src/adapters/process/is-alive/process-is-alive-adapter.proxy.ts`
- `packages/siegelense/src/adapters/process/is-alive/process-is-alive-adapter.test.ts`
- `packages/siegelense/src/adapters/process/is-alive/process-is-alive-adapter.ts`
- `packages/siegelense/src/adapters/process/kill-group/process-kill-group-adapter.proxy.ts`
- `packages/siegelense/src/adapters/process/kill-group/process-kill-group-adapter.test.ts`
- `packages/siegelense/src/adapters/process/kill-group/process-kill-group-adapter.ts`

### -Z sweep, wave 1 (cli, config, hooks, hydration, mcp, session-forensics, tooling)

Script: `tmp/a18-zod/rewrite.py <pkg> [apply]` (gitignored scratch). It re-censuses the package (every `.ts`/`.tsx` outside
`node_modules`/`dist`), skips any file with another raw import (a bare specifier that is not `.`, `#` or `@dungeonmaster/`)
and rewrites only line-anchored `import ... from 'zod'` to `'#gateway/npm/zod'`; string-literal fixtures never match.
No file was reverted; the one skipped file was `packages/cli/src/statics/package-seed-service/package-seed-service-statics.ts`
(its `hono` text is a string template, another raw import by the script's reading, left as it was).

| Package | Files changed | Ward run (lint, typecheck, unit) |
|---|---|---|
| `cli` | 15 | `1790643039380-2b73` PASS |
| `config` | 9 | `1790643107951-f30c` PASS |
| `hooks` | 61 | `1790643131825-db37` PASS |
| `hydration` | 53 | `1790643469679-4d32` PASS |
| `mcp` | 74 | `1790643511690-656d` PASS |
| `session-forensics` | 20 | `1790643567246-f7aa` PASS |
| `tooling` | 39 | `1790643599376-1c30` PASS |

Two things the script alone could not do:

- `config` and `session-forensics` had no `@dungeonmaster/npm` dependency and `hydration` held it only as a devDependency, so
  `gateway-dependency-declared` failed lint. `@dungeonmaster/npm: "*"` was added to `dependencies` in the three
  `package.json` files (moved out of `devDependencies` in `hydration`). `zod` stays in all of them.
- `hydration`'s `test/type-fixtures/typescript-program-diagnostics.ts` compiles fixtures and the `src` they import in a
  standalone `ts.Program` with `moduleResolution: Node10`, which ignores the `imports` field, so `#gateway/npm/zod` did
  not resolve and the negative type tests saw `any`. Its compiler options are now `module: ESNext`,
  `moduleResolution: Bundler`, `customConditions: ['source']` (the last so `@dungeonmaster/*` resolves to source, as Jest does).

### Dependency removals per `package.json`

Remove an entry only after that package's `-Z` list and batches are merged and a re-scan shows no raw import of it
left. "Unused" means nothing in the package imports it, raw or through the gateway. Keep every `peerDependencies`
entry (a published plugin's contract with its consumer), every `@types/*`, and every package a script, a `.cjs`
config or a jest config loads by name.

| `package.json` | Remove | Keep, and why |
|---|---|---|
| `packages/cli/package.json` | `zod` | `typescript` (satisfies `@dungeonmaster/npm`'s `typescript` peer for consumers — operator confirms); `tsx` (C2, until decided). The `bundle` script's `--external:zod` becomes dead once no source imports `zod`; drop it in the same edit. The eslint/prettier/ts-jest/ts-node devDependencies are imported by nothing in `cli` — not duplicates, so outside A18's rule; flagged for the operator. |
| `packages/config/package.json` | `zod` | — |
| `packages/eslint-plugin/package.json` | `minimatch`, `zod`; devDependency `@typescript-eslint/parser` (reached through `#gateway/npm/typescript-eslint__parser`; the root `eslint.config.js` requires it from the root install) | every `peerDependencies` entry |
| `packages/hooks/package.json` | `zod`; `debug` (unused) | every `peerDependencies` entry |
| `packages/hydration/package.json` | `zod` | devDependency `typescript` (the `@dungeonmaster/npm` peer) |
| `packages/hydration-recipes/package.json` | `zod` | devDependency `typescript` |
| `packages/local-eslint/package.json` | `zod` (unused — no import at all); devDependency `@typescript-eslint/parser` (unused) | — |
| `packages/mcp/package.json` | `@modelcontextprotocol/sdk`, `glob`, `zod`; `zod-to-json-schema` (unused) | `typescript` (not imported by mcp itself; same peer question as cli — operator confirms); devDependency `tsx` (`dev` script) |
| `packages/orchestrator/package.json` | `zod` | — |
| `packages/server/package.json` | `glob`, `hono`, `@hono/node-server`, `@hono/node-ws`, `zod` | devDependency `typescript` |
| `packages/session-forensics/package.json` | `zod` | — |
| `packages/shared/package.json` | `fast-xml-parser`, `zod` | devDependency `typescript` |
| `packages/siegelense/package.json` (after its last adapter chunk) | `pixelmatch`, `pngjs`, `zod`; devDependencies `@types/pixelmatch`, `@types/pngjs` if siegelense's typecheck stays green without them | `@playwright/test` (peer + dev); devDependency `typescript` |
| `packages/testing/package.json` (after its last adapter chunk) | `@mantine/core`, `zod`; `msw` once testing's own unit run passes without it (only `ts-jest/node-modules-esm-transform-packages.js` names it, as a path pattern) | `tsx` (`ts-jest/*.js` require `tsx/cjs`); `undici` (`src/jsdom-polyfills.cjs`) |
| `packages/tooling/package.json` | `glob`, `zod`; the duplicate devDependency `typescript` (already in `dependencies`) | `typescript` in `dependencies` |
| `packages/ward/package.json` | `zod` | every `peerDependencies` entry |
| `packages/web/package.json` | `elkjs`, `rxjs`, `react-router-dom`, `@tabler/icons-react`, `zod`; `@mantine/hooks`, `ansi-to-react` (unused); devDependencies `@testing-library/react`, `@testing-library/user-event`; devDependency `@vitejs/plugin-react` only if C3 moves `vite.config.ts` onto the gateway | `react`, `react-dom` (`jest.config.cjs` `require.resolve`s both, and `src/__mocks__/*.cjs` require `react`); `@mantine/core`, `@mantine/notifications`, `@xyflow/react` while C4's CSS imports stay raw; `@testing-library/jest-dom` (`jest.config.cjs` `setupFilesAfterEnv`); `@playwright/test`, `vite`, `jest`, `jest-environment-jsdom`, `postcss*`, `undici` (CLIs and `.cjs` configs) |

## Concessions made while executing

<!-- Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table. -->
