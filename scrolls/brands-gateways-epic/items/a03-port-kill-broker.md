# A03: One broker lists what is on a port and kills it

| | |
|---|---|
| Phase | Phase 2 — delete every adapter |
| Source | `scrolls/gateway/followup-sustainability.md` items 32 (758-766) and 33's `killPid` half (781-786); `scrolls/gateway-build/coverage.md` "Real gaps" section and its two `REAL GAP` rows |
| Needs | [G21](g21-gateway-proxy-addressing-read-back.md) |
| Unblocks | [A10](a10-adapters-orchestrator.md), [A16](a16-adapters-ward.md) |
| Packages touched | shared, ward |
| Checks to run | lint, typecheck, unit |
| Split | one agent |
| Runs alone | no other agent editing `shared` or `ward` at the same time |

## Why

The gateway has `listeningPids` in `#gateway/bin/lsof` and `killPid`/`killGroup` in `#gateway/bin/kill` — one
module per program, per the gateway's own rule. "List what's on this port, then kill it" composes two gateway
functions, which is business logic, so it belongs in a broker in whichever package owns port cleanup — not in the
gateway itself (gateway files import no workspace code). Two packages have their own copy of this today:
orchestrator's `process-kill-by-port-adapter.ts` (already deleted by [A01](a01-dead-adapters.md) as dead code — it
had zero real callers) and ward's `net-kill-port-adapter.ts` / `net-port-in-use-adapter.ts` (both alive, both raw
`child_process.exec` calls with none of the gateway's guarantees).

## Current state

Confirmed 2026-09-26 by reading every file named below.

- `packages/@gateway/bin/src/lsof/listening-pids/listening-pids.ts` exports:
  ```ts
  export const listeningPids = async ({ port }: { port: number }): Promise<number[]> => { ... }
  ```
  Resolves `[]` when nothing listens (a non-zero `lsof` exit is the normal "nothing listening" case, not a
  failure). Throws `LsofNotInstalledError` only when the `lsof` binary itself is missing.
- `packages/@gateway/bin/src/kill/kill-pid/kill-pid.ts` exports:
  ```ts
  export const killPid = async ({ pid, signal = 'SIGKILL' }: { pid: number; signal?: NodeJS.Signals }):
    Promise<{ exitCode: number; output: string }> => { ... }
  ```
  Its own header already records the reconciliation this item's source material calls for: orchestrator's deleted
  `processKillByPortAdapter` used `SIGKILL`, one `kill -9 <pid>` per pid, tolerant of an already-exited pid; ward's
  `netKillPortAdapter` used the default signal (`SIGTERM`), one batched `kill <pids...>`, and swallowed every
  error. **Orchestrator's shape won the reconciliation already, inside the gateway wrapper itself** — `killPid`
  defaults to `SIGKILL`, signals one pid at a time, and hands the caller `exitCode`/`output` instead of throwing
  on a non-zero exit, so a caller can tell "already gone" from a real refusal. There is also `killGroup` (for a
  `pgid`, same default and shape) beside it, unused by this item but worth knowing about.
- `packages/ward/src/adapters/net/kill-port/net-kill-port-adapter.ts` (confirmed by reading it in full): runs
  `lsof -ti :<port>` via raw `child_process.exec`, then `kill <pids joined by space>` — no signal named (so the
  OS default, `SIGTERM`), batched into ONE `kill` call for every pid, and the callback ignores its `error`
  argument entirely, so a pid that refused to die (permission denied, or already reaped) is indistinguishable from
  success.
- `packages/ward/src/adapters/net/port-in-use/net-port-in-use-adapter.ts` (confirmed by reading it): the same
  `lsof -ti :<port>` probe, reading only whether stdout is non-empty; explicitly documents itself as sharing the
  probe with `net-kill-port-adapter.ts`.
- `packages/shared/src/brokers/port/` already exists as a domain folder, holding `resolve/port-resolve-broker.ts`
  and `config-walk/port-config-walk-broker.ts` (port CONFIG resolution, unrelated to killing). This item's new
  broker(s) belong in a new subfolder here, such as `packages/shared/src/brokers/port/kill-listeners/`.
- Both `ward`'s and `orchestrator`'s `package.json` list `@dungeonmaster/shared` as a real `dependency` (confirmed:
  `ward`'s `dependencies` are `@dungeonmaster/config`, `@dungeonmaster/npm`, `@dungeonmaster/shared`, `zod`).
  `shared` is the lowest package both already depend on — **Recommended**, matching the item's own suggested
  home. Reason: putting the broker anywhere else (`ward` or `orchestrator`) would make the OTHER package depend on
  it, which is a bigger dependency-graph change than adding one broker to a package both already use. The
  executing agent may change this with a reason under DECISIONS, but should not do so without one.

## Work

1. Write a broker in `packages/shared/src/brokers/port/` composing `listeningPids` and `killPid`. Suggested shape
   (name and exact signature are the executing agent's call — read `get-architecture` and `get-testing-patterns`
   first per the standing rule):
   ```ts
   // packages/shared/src/brokers/port/kill-listeners/port-kill-listeners-broker.ts
   import { listeningPids } from '#gateway/bin/lsof';
   import { killPid } from '#gateway/bin/kill';

   export const portKillListenersBroker = async ({ port }: { port: number }): Promise<{ pid: number; exitCode: number; output: string }[]> => {
     const pids = await listeningPids({ port });
     return Promise.all(pids.map(async (pid) => ({ pid, ...(await killPid({ pid })) })));
   };
   ```
   R1 applies: the broker returns what `killPid` told it for each pid (its `exitCode`/`output`), not an invented
   `{ success: true }`. A caller that wants a simple boolean derives it from the array itself.
2. Consider whether "is anything listening on this port" belongs as a second, tiny broker
   (`portListenersBroker` calling `listeningPids` alone) or whether ward's caller should just call
   `listeningPids` from `#gateway/bin/lsof` directly — `listeningPids` already returns exactly what
   `netPortInUseAdapter` needs (`pids.length > 0`), and it takes no combining logic, so a wrapping broker may be
   unnecessary here. Recommended: no second broker — ward's own caller does
   `(await listeningPids({ port })).length > 0` directly. **Recommended — the executing agent may change this
   with a reason in DECISIONS** if a real second caller needs more than that.
3. Move `packages/ward/src/adapters/net/kill-port/net-kill-port-adapter.ts`'s callers onto the new broker. Read
   every caller first — this changes behaviour on purpose: `SIGTERM` becomes `SIGKILL`, and a partial failure
   that used to read as silent success now surfaces (`item 33`'s own words: "Moving it to `killPid` changes the
   signal to `SIGKILL` and makes a partial failure visible. Confirm ward's e2e-artifact teardown wants both before
   switching.").
4. **Before switching ward's e2e-artifact teardown, confirm it actually wants `SIGKILL` and visible partial
   failure.** Read `packages/ward/src/brokers/e2e-artifacts/` (or wherever the prune/teardown broker that calls
   `netKillPortAdapter` lives — locate it with `get-project-inventory({ packageName: 'ward' })` and `discover`) and
   check: does it retry, log, or otherwise handle a kill that fails partway, or does it assume the adapter always
   "succeeds"? If it assumes success, decide whether the caller needs updating alongside this switch (report under
   DECISIONS either way) — a silent `SIGTERM`-then-ignore was arguably covering for a real signal the teardown
   never wanted surfaced, and changing it without reading the caller risks a flaky e2e sweep reporting an error it
   used to swallow.
5. Move `packages/ward/src/adapters/net/port-in-use/net-port-in-use-adapter.ts`'s callers onto `listeningPids`
   directly (or the second broker, if step 2 decided one is warranted).
6. Delete both ward adapters and their colocated `.test.ts`/`.proxy.ts`.
7. Write the new broker's own proxy (`port-kill-listeners-broker.proxy.ts`) composing `listeningPids`'s and
   `killPid`'s own proxies, imported per file: `#gateway/bin/lsof/listening-pids/listening-pids.proxy` and
   `#gateway/bin/kill/kill-pid/kill-pid.proxy`.

## Plan

### G-R

New files:
- `packages/shared/src/contracts/port-kill-listener-result/port-kill-listener-result-contract.ts` — the
  `{pid, exitCode, output}` shape `killPid` reports per pid, branded.
- `packages/shared/src/contracts/port-kill-listener-result/port-kill-listener-result-contract.test.ts`
- `packages/shared/src/contracts/port-kill-listener-result/port-kill-listener-result.stub.ts`
- `packages/shared/src/brokers/port/kill-listeners/port-kill-listeners-broker.ts` — composes
  `#gateway/bin/lsof`'s `listeningPids` and `#gateway/bin/kill`'s `killPid`.
- `packages/shared/src/brokers/port/kill-listeners/port-kill-listeners-broker.proxy.ts`
- `packages/shared/src/brokers/port/kill-listeners/port-kill-listeners-broker.test.ts`

Edited files:
- `packages/shared/contracts.ts` — barrel export for the new contract.
- `packages/shared/brokers.ts` — barrel export for the new broker.
- `packages/shared/testing.ts` — barrel export for the new broker's proxy.
- `packages/shared/package.json` — add `@dungeonmaster/bin` to `dependencies` (shared has no prior
  caller of `#gateway/bin/*`; `siegelense` is the only package that already declares it, per the
  same pattern this item follows).
- `packages/ward/package.json` — add `@dungeonmaster/bin` to `dependencies` (`e2e-artifacts-prune-broker.ts`
  calls `listeningPids` from `#gateway/bin/lsof` directly, per this item's step 2 recommendation).
- `packages/ward/src/brokers/check-run/e2e/check-run-e2e-broker.ts` — replace both `netKillPortAdapter`
  teardown calls with `portKillListenersBroker` from `@dungeonmaster/shared/brokers`.
- `packages/ward/src/brokers/check-run/e2e/check-run-e2e-broker.proxy.ts` — replace
  `netKillPortAdapterProxy` composition with `portKillListenersBrokerProxy` from
  `@dungeonmaster/shared/testing`, staged per exact port.
- `packages/ward/src/brokers/e2e-artifacts/prune/e2e-artifacts-prune-broker.ts` — replace
  `netPortInUseAdapter({port})` with `(await listeningPids({port})).length > 0`, imported from
  `#gateway/bin/lsof` directly (no second broker, per step 2's recommendation).
- `packages/ward/src/brokers/e2e-artifacts/prune/e2e-artifacts-prune-broker.proxy.ts` — replace
  `netPortInUseAdapterProxy` composition with `listeningPidsProxy` from
  `#gateway/bin/lsof/listening-pids/listening-pids.proxy`.
- `packages/ward/CLAUDE.md` — added after the fact, not in the original list: its own e2e-isolation
  table named `netFreePortPairAdapter`/`netKillPortAdapter` by name, both stale (the real code already
  called `freePortPair` before this item, and `netKillPortAdapter` is this item's own deletion) —
  fixed both to the names this item's diff leaves behind.

Deleted files:
- `packages/ward/src/adapters/net/kill-port/net-kill-port-adapter.ts`
- `packages/ward/src/adapters/net/kill-port/net-kill-port-adapter.proxy.ts`
- `packages/ward/src/adapters/net/kill-port/net-kill-port-adapter.test.ts`
- `packages/ward/src/adapters/net/kill-port/net-kill-port-adapter.integration.test.ts`
- `packages/ward/src/adapters/net/port-in-use/net-port-in-use-adapter.ts`
- `packages/ward/src/adapters/net/port-in-use/net-port-in-use-adapter.proxy.ts`
- `packages/ward/src/adapters/net/port-in-use/net-port-in-use-adapter.test.ts`
- `packages/ward/test/harnesses/kill-port/kill-port.harness.ts` — its one consumer (the integration
  test above) is deleted alongside it.

The deleted integration test drove a real spawned server and killed it for real. Its replacement, if
any, is not another `.integration.test.ts`: `get-testing-patterns` restricts integration tests to
`startup/`/`flows/` files, and this item's own "Checks to run" row names `lint, typecheck, unit`
only. The unit tests above mock the gateway boundary instead; see DECISIONS in the final report for
the coverage trade this makes.

### Root-cause gateway fix (operator directive, after the gap above was found)

Every `#gateway/bin` wrapper mocked `run` directly, permanently replacing its real body — the same
conflict named above, not unique to lsof/kill. Fixed at the root instead of worked around in ward:

- `packages/@gateway/node/src/child_process/run/run.proxy.ts` — widened `args?: string[]` to a new
  local `SpawnArgsMatcher` type on `setupSuccess`/`setupSignalKill`/`setupError`/`setupHangsUntilKilled`
  (purely additive; `buildSpawnAddress` already pushed `args` untyped, so no existing caller's runtime
  behavior changes) — the five `*-run.proxy.ts` files below need to stage a tolerant/predicate `args`
  through it, which the old `string[]`-only signature couldn't express.
- `packages/@gateway/bin/src/gateway-test-support/arg-matcher.ts` — added an `argsMatcher` read-back
  helper (matches one real argv array against an `ArgsMatcher`) — every rewritten `*-run.proxy.ts`'s
  own `getCallsFor` needs to filter `runProxy()`'s command-only read-back by the caller's own address,
  since `runProxy` has no such filter itself.
- `packages/@gateway/bin/src/gateway-test-support/arg-matcher.proxy.ts` — new, empty (colocation
  requires one now that `arg-matcher.ts` exports a real function, not only types).
- `packages/@gateway/bin/src/gateway-test-support/arg-matcher.test.ts` — added coverage for `argsMatcher`.
- `packages/@gateway/bin/src/{kill/kill-run,lsof/lsof-run,git/git-run,cp/cp-run,npm/npm-run}/*-run.proxy.ts`
  — all five rewritten to compose `runProxy()` (spawn level) instead of `registerMock({ fn: run })`,
  keeping every public method name/param identical. `setupNotFound`/`throwsMatchingArgs` now stage a
  raw `Error` with `.code = 'ENOENT'` via `run.setupError`, letting `run`'s real body wrap it into
  `RunNotFoundError` — byte-identical to what these proxies used to construct by hand. A `signal` param
  routes to `run.setupSignalKill`; a `timedOut` param is accepted (API parity) but cannot be wired
  through — see the exact gap below.
- `packages/@gateway/bin/src/git/git-run/git-run.test.ts` — removed the one test staging
  `timedOut: true`: unreachable under real `run()` semantics for this call shape (see below).

**Exact case where spawn-level staging cannot express something a caller needed:** `run`'s real body
sets `timedOut` ONLY from its own internal timer, armed by a `timeout` param passed to `run()` at the
call site — and no `*-run.ts` file in this gateway ever passes one. The five old `run`-level proxies
could stage `timedOut: true` anyway (they resolved `run`'s mock directly, bypassing that constraint
entirely), and `git-run.test.ts` was the one place that exercised it — a combination unreachable in
production. No fix existed inside `@gateway/bin`'s own files for this one case.

## Done when

- `packages/ward/src/adapters/net/kill-port/` and `packages/ward/src/adapters/net/port-in-use/` no longer exist.
- `packages/shared/src/brokers/port/` holds a new broker composing `#gateway/bin/lsof`'s `listeningPids` and
  `#gateway/bin/kill`'s `killPid`, with its own proxy and test.
- Every former caller of ward's two deleted adapters now calls the new broker (or `listeningPids` directly for the
  probe case), and their own proxies compose the new broker's proxy (or the gateway's `lsof` proxy).
- Ward's e2e-artifact teardown was read and its `SIGKILL`-vs-`SIGTERM` and partial-failure-visibility expectations
  were confirmed or updated — reported under DECISIONS either way.
- `npm run ward -- --only lint,typecheck,unit -- packages/shared/src/brokers/port packages/ward` (narrowed to the
  files actually touched) exits 0.

## Gap found while implementing, fixed at the root (see below)

`#gateway/bin/lsof`'s and `#gateway/bin/kill`'s own test-support proxies (`lsofRunProxy`,
`killRunProxy`, and thus `listeningPidsProxy`/`killPidProxy`) mock `#gateway/node/child_process`'s
`run` DIRECTLY: `registerMock({ fn: run })`, replacing `run`'s real implementation outright.
`#gateway/node/child_process/run/run.proxy.ts` (`runProxy()`) — the proxy every OTHER `run`-based
ward check (lint's eslint, typecheck's tsc, unit/integration's jest, and this file's own playwright
spawn) already composes — mocks `spawn`, ONE LEVEL BELOW `run`, relying on `run`'s real body to reach
it. **These two mock levels cannot coexist in one test file.** `registerMock({ fn: run })` installs a
dispatcher the moment it is CONSTRUCTED (before any `calledWith` staging), regardless of whether it is
ever exercised, and that dispatcher permanently intercepts every call to `run` — including the
UNRELATED playwright/eslint/git calls other proxies in the same file stage at the `spawn` level, which
never reach `run`'s real body again for the rest of that test.

`enforce-proxy-child-creation` (lint) makes this unavoidable from either direction: `check-run-e2e-broker.ts`
importing `portKillListenersBroker` MUST have its proxy compose `portKillListenersBrokerProxy`, which
(per this item's own instruction) MUST compose `listeningPidsProxy`/`killPidProxy` to satisfy the SAME
rule on `port-kill-listeners-broker.ts` itself; `e2e-artifacts-prune-broker.ts` importing `listeningPids`
MUST have its proxy compose `listeningPidsProxy` directly. Both are therefore lint-mandated, and both
install the conflicting `run`-level mock the moment their proxy is constructed — which
`singlePackageLayerBrokerProxy` does unconditionally, for every scenario, since production code always
calls `e2eArtifactsPruneBroker` "at the end of every invocation" regardless of which check types were
requested.

**Confirmed broken, whole `packages/ward` unit suite (237 passed / 4 failed):**
- `packages/ward/src/brokers/check-run/e2e/check-run-e2e-broker.test.ts` — its own playwright `run.setupSuccess` staging (spawn-level) never fires once `portKillListenersBrokerProxy` constructs.
- `packages/ward/src/brokers/command/run/single-package-layer-broker.test.ts`
- `packages/ward/src/brokers/command/run/command-run-broker.test.ts`
- `packages/ward/src/responders/ward/run/ward-run-responder.test.ts`

The last three never touch e2e/port-kill in their own scenarios (lint-only, git-scope-only) — they
break purely because `singlePackageLayerBrokerProxy` eagerly constructs `checkRunE2eBrokerProxy()` and
`e2eArtifactsPruneBrokerProxy()` alongside `checkRunLintBrokerProxy()` and the git brokers' own
`spawn`-level proxies. Every other file in `packages/ward` and the whole of `packages/shared` (611/611
units) stays green — the four above are the full, confirmed blast radius, and all four share this one
root cause.

**No fix stayed inside this item's scope (`shared`, `ward`).** The real fix is either in
`packages/@gateway/bin` (make `lsofRun`/`killRun`'s own proxies mock `spawn` instead of `run`, matching
`run.proxy.ts`'s own level) or a restructuring of `single-package-layer-broker.proxy.ts` so `run`-based
child proxies never coexist with `spawn`-based ones in one test file — both outside `shared`/`ward`, or
a much wider redesign of `ward`'s own check-run-* proxy layer, respectively. Left standing; see the
implementing agent's final report for what was tried.

## Traps

- `killPid`'s default signal is `SIGKILL`, not `SIGTERM` — a test staging the OLD ward behaviour (default signal,
  batched, error-swallowing) will not compile against the new broker's real behaviour. Update the tests, not the
  broker, to match `killPid`'s real, already-reconciled shape.
- `killPid` does not throw on a non-zero exit; it returns `exitCode`/`output` so the caller can tell "already gone"
  from "refused". Do not wrap it in a `try/catch` that discards this distinction (T5/R1 both apply: a real failure
  signal from `killPid` must not be swallowed into an invented success).
- `listeningPids` resolving `[]` is the ORDINARY "nothing listening" case, not a failure — do not add error
  handling around an empty array.

## Concessions made while executing

<!-- Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table. -->
