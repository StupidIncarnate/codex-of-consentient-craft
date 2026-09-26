# Unit 6: siegelense instance-reserve-broker — gitBranchReadAdapter → @dungeonmaster/bin/git

## Files changed

- `packages/siegelense/src/brokers/instance/reserve/instance-reserve-broker.ts` — drops
  `gitBranchReadAdapter`, calls `currentBranch({ cwd: cwd() })` from `@dungeonmaster/bin/git`
  (`cwd` from `@dungeonmaster/node/process`), combined with the port-candidate fan-out via one
  `Promise.all` since the two calls are independent.
- `packages/siegelense/src/brokers/instance/reserve/instance-reserve-broker.proxy.ts` — drops
  `gitBranchReadAdapterProxy`, composes `gitCurrentBranchProxy` from `@dungeonmaster/bin/testing`.
  `setupBranch({branch})` now maps `null` to `branchProxy.setupDetached()` and a string to
  `branchProxy.setupBranch({branch})` (the new proxy has no combined "branch or null" method); added
  `setupBranchFailure({exitCode, output})` for the new git-failure case.
- `packages/siegelense/src/brokers/instance/reserve/instance-reserve-broker.test.ts` — added a `git
  failure` describe block asserting the reservation itself rejects with the real git error.
- `packages/siegelense/src/brokers/instance/start/instance-start-broker.proxy.ts` — ripple fix.
  `instanceReserveBrokerProxy()` was constructed as a phantom child (enforce-proxy-child-creation)
  whose setup methods are never called; the OLD `gitBranchReadAdapterProxy` staged a `'HEAD'`
  (detached) default unconditionally in its own constructor, so this file never had to ask for a
  branch. The NEW `gitCurrentBranchProxy` stages nothing by default, so this file now calls
  `reserveProxy.setupBranch({ branch: null })` explicitly to keep its existing (branch-agnostic)
  tests passing.
- `packages/siegelense/package.json` — added `"@dungeonmaster/bin": "*"` and
  `"@dungeonmaster/node": "*"` to `dependencies` (the latter for `cwd`, below).

**`git-branch-read-adapter.ts` is untouched and left with no callers**, per the trial rules.

## Gateway imports used

- `currentBranch` from `@dungeonmaster/bin/git`
- `cwd` from `@dungeonmaster/node/process`
- `gitCurrentBranchProxy` from `@dungeonmaster/bin/testing`

## The semantics decision

`currentBranch` is async and THROWS on a real git failure (missing git, `cwd` not a repo) instead of
collapsing every failure to `null` the way `gitBranchReadAdapter` did. `instanceReserveBroker` lets
that rejection propagate — no try/catch added. Reasoning, also recorded in the broker's header: a
registry row that silently drops its git provenance on the one case worth surfacing (a real git
failure) is a worse failure mode than refusing the reservation outright. This is a real behaviour
change from the adapter it replaces: the old code would still complete a reservation (with
`branch: null`) in a repo with no git or a broken git install; the new code refuses the reservation
entirely in that case. No caller of `instanceReserveBroker` currently expects it to succeed outside a
real git checkout, and siegelense already assumes a git worktree elsewhere (`git-worktree-add`, etc.),
so this was judged an acceptable, intentional tightening rather than a regression to route around.

## `no-bare-process-cwd`

The broker originally used bare `process.cwd()` to build `currentBranch`'s `{cwd}` argument.
`@dungeonmaster/enforce-project-structure`'s sibling rule `no-bare-process-cwd` correctly blocked
that (real rule doing its job, not a misfire) — the gateway already has its own sanctioned wrapper,
`cwd` from `@dungeonmaster/node/process`, and the fix was to use it instead of routing around the
rule.

## Ward commands run and results

```
npm run ward -- --only lint,typecheck,unit -- <all 6 files above>
```

- `typecheck`: **PASS** (1483 files).
- `lint`: **FAIL** — one error, friction below (not fixable in this unit's lane).
- `unit`: **FAIL** — blocked by a testing-infrastructure gap, not a logic bug; see below. Verified in
  isolation:

```
npm run ward -- --only unit -- packages/siegelense/src/brokers/instance/reserve/instance-reserve-broker.test.ts
npm run ward -- --only unit -- packages/bin/src/git/git-current-branch.test.ts   # control: PASS
```

## Friction

### 1. Lint misfire: `@dungeonmaster/enforce-proxy-child-creation`

`packages/siegelense/src/brokers/instance/reserve/instance-reserve-broker.proxy.ts:1` —
> `Proxy creates gitCurrentBranchProxy but instance-reserve-broker.ts does not import gitCurrentBranch. Remove the phantom proxy creation or add the import to the implementation.`

The rule expects the broker to import a function whose name matches the proxy factory name minus
`Proxy`. The broker imports `currentBranch` (the function `@dungeonmaster/bin/git` actually exports);
the proxy factory is `gitCurrentBranchProxy` (named after its file, `git-current-branch.proxy.ts`,
per `@dungeonmaster/bin`'s own internal file-naming convention). The rule has no way to know these
two names name the same gateway export. Correct code as written; not fixable from siegelense.

**Resolved by the follow-up gateway-fixes pass:** every gateway proxy whose name differed from
`<exportName>Proxy` was renamed — all 24 of them lived in `@dungeonmaster/bin` (`gitCurrentBranchProxy`
→ `currentBranchProxy`, `npmInstallProxy` → `installProxy`, etc.; `@dungeonmaster/node`,
`@dungeonmaster/npm` and `@dungeonmaster/browser` were already correctly named). This file's own
`import { currentBranchProxy } from '@dungeonmaster/bin/testing';` now matches `currentBranch` exactly,
so THIS misfire is gone. `enforce-proxy-child-creation` still fires here, but on a genuinely different,
real gap: the implementation also imports `cwd` from `@dungeonmaster/node/process`, and this proxy
never composes a `cwdProxy` for it — a real (if harmless, since `cwd()` runs for real and nothing
asserts on it) finding, left for the eslint-plugin pass fixing this rule rather than patched around
here.

### 2. BLOCKING: cross-package proxy mock composition does not intercept the real call

Every unit test in `instance-reserve-broker.test.ts` that reaches `instanceReserveBroker` — including
the three pre-existing "no port collision" tests, the port-collision test, the exhaustion test, and
the new git-failure test — now fails with either
`TypeError: Cannot read properties of undefined (reading 'stdout')` (isolated run) or
`registerMock: nothing set up for the call mockConstructor("git", [...])` (full-package run),
both originating inside the REAL `run()` body at
`packages/node/src/child_process/run.ts:52-63`, reached from `currentBranch` → `gitRun` → `run`.

Root cause: `packages/testing/src/middleware/import-path-resolver/import-path-resolver-middleware.ts`
(lines 28-48) only resolves a relative import, or the single hardcoded special case
`@dungeonmaster/shared/testing`. `proxyMockCollectorMiddleware` uses this to recursively follow
`...Proxy`-named imports to hoist `registerMock`/`registerSpyOn` calls into `jest.mock()`. When
`instance-reserve-broker.proxy.ts` imports `gitCurrentBranchProxy` from `@dungeonmaster/bin/testing`,
that import path is neither relative nor the shared special case, so the resolver returns `null` and
the collector stops there — `git-run.proxy.ts`'s own `registerMock({fn: run})` (inside
`@dungeonmaster/bin`) never gets its `jest.mock()` hoisted for a SIEGELENSE test file. `run` stays a
real function, `registerMock`'s dispatcher never installs (silently, since `run` has no
`mockImplementation`), and the real code runs a real `git` subprocess (which then either errors
against a global child_process safety net, or crashes on an unmocked `spawn` returning `undefined`,
depending on which other mocks the run happened to compose).

**Control test confirming the diagnosis:** `packages/bin/src/git/git-current-branch.test.ts` passes
standalone — every import in ITS OWN chain (`./git-current-branch.proxy` → `./git-run.proxy`) is
relative, so the same collector resolves it fine within `@dungeonmaster/bin`. The break is
specifically the cross-package hop.

This is not fixable inside siegelense — the fix belongs in
`import-path-resolver-middleware.ts`, generalizing the `@dungeonmaster/shared/testing` special case
to any `@dungeonmaster/<pkg>/testing` package-specifier import (same `require.resolve` +
`dist`→source rewrite, keyed on the package name instead of hardcoded to `shared`). Until that
lands, **no caller anywhere in the repo can unit-test a composition that reaches a mocked call
through `@dungeonmaster/bin/testing`, `@dungeonmaster/node/testing` or `@dungeonmaster/npm/testing`
via another package's own `.proxy.ts`** — this affects every trial unit that composes a gateway
proxy transitively (not just this one), and is worth flagging to whoever runs the lint/testing
consumption phase before more callers migrate.

**Resolved by the follow-up gateway-fixes pass, in `packages/testing/src`:**

- `require.resolve` + `dist`→source string-rewrite could not be the general mechanism after all —
  every gateway package (`bin`, `node`, `npm`, `browser`) had **no `dist/` at all** at fix time (none
  had ever been built), so `require.resolve('@dungeonmaster/bin/testing')` fails outright, and even
  where a `dist/` exists (`shared`), the naive `/dist/` → `/` string rewrite only happens to work for
  `shared`'s flat root-barrel layout (`testing.ts` → `dist/testing.js`) and breaks for every gateway
  package's `src/testing/index.ts` → `dist/testing/index.js` nesting.
- The real fix reads the workspace **the way Node's `exports` "source" condition would, without
  needing `dist/` to exist**: `workspaceRootFindMiddleware` walks up from the importing file to the
  nearest ancestor `package.json` carrying a `workspaces` field (mirrors `findRepoRootLayerBroker`,
  duplicated rather than imported — middleware/ cannot import brokers/), lists `packages/*`, and
  `workspacePackageImportResolveMiddleware` finds the sibling whose own `package.json.name` matches
  the specifier, then matches the subpath against ITS `exports` map (literal key first, then a
  single-`*` wildcard key, substituting the captured remainder) via
  `workspacePackageExportSourceTransformer`. No package name is hardcoded anywhere in this chain —
  it falls out of reading each workspace package's own `package.json`.
- `isProxyImportGuard` (`packages/testing/src/guards/is-proxy-import/is-proxy-import-guard.ts`) and
  `importPathToFilePathTransformer`
  (`packages/testing/src/transformers/import-path-to-file-path/import-path-to-file-path-transformer.ts`)
  both generalized past the same `@dungeonmaster/shared/testing` special case to a
  `(@scope/)?name/testing` pattern, so the AST walk that decides which imports are "proxy imports"
  worth recursing into now follows a cross-package `./testing` barrel from ANY workspace package —
  not just `shared`'s.
- Proof case (this file) now passes; two more proxy-mock-collector proof cases the orchestrator
  named also pass: `packages/hooks/src/responders/install/create-settings/install-create-settings-responder.test.ts`
  and `packages/mcp/src/responders/install/config-create/install-config-create-responder.test.ts`
  (both compose `@dungeonmaster/node/testing` proxies transitively the same way).
- One more pre-existing gap surfaced once the mock actually started hoisting: four of THIS file's
  own test cases (the "no port collision", "port collision" and "every attempt collides" ones) never
  called `proxy.setupBranch(...)` at all — they silently depended on the OLD adapter's implicit
  detached-HEAD default the same way `instance-start-broker.proxy.ts` did (see the edge case below),
  and once `run` was really mocked they hit the real, unstaged `registerMock` dispatcher and threw
  "nothing set up for the call". Fixed with the same one-line `proxy.setupBranch({ branch: null })`
  this file's own "semantics decision" section already used for `instance-start-broker.proxy.ts`.

## Edge cases found

- **The async/throw switch is a real behaviour change**, not just a mechanical signature ripple (see
  "The semantics decision" above) — logged in the broker's own header rather than only here, per the
  comment-discipline rule against putting history in code comments (the header states the decision
  and its reasoning, not what changed).
- **A caller's phantom proxy composition can silently rely on a mocked dependency's implicit
  default.** `gitBranchReadAdapterProxy`'s constructor staged a `'HEAD'` (detached) default
  unconditionally; `gitCurrentBranchProxy`'s constructor stages nothing, so every OTHER file that
  composes `instanceReserveBrokerProxy()` purely to satisfy `enforce-proxy-child-creation` (this
  repo has at least one: `instance-start-broker.proxy.ts`) now needs an explicit
  `setupBranch({branch: null})` call it never needed before. Fixed here for the one file this
  package's own tests touch; any other untouched composer elsewhere in the repo would need the same
  one-line fix before its tests go green.
- **The proxy-mock-collector gap (friction #2) is the single biggest cross-cutting risk the trial
  surfaced.** It is invisible until a test actually runs (typecheck and lint both pass cleanly), and
  it silently degrades from "throws a clear unmocked-call error" to "crashes on `undefined.stdout`"
  depending on incidental global mock state — neither failure mode points a reader at the real cause
  without tracing the stack into `packages/node/src/child_process/run.ts`.
