# G22: Jest goes through the gateway like every other outside package

| | |
|---|---|
| Phase | Phase 1 — gateway foundation |
| Source | `scrolls/gateway/followup-sustainability.md`, "Jest goes through the gateway…" (263-275), item 21 (479-511), the `testing` row of the adapters-not-replaced table (line 338) |
| Needs | [G02](g02-build-order-ignores-dev-deps.md) (fixes the build-order dependency-cycle item 21 warns about — must land before `testing` depends on the gateway), [G03](g03-publish-testing-public.md) (publishes `@dungeonmaster/testing` publicly, which item 21a says a consumer install needs) |
| Unblocks | nothing directly in Phase 1, but this is what makes `testing`'s own adapter-deletion item (A14) possible |
| Packages touched | `@gateway/npm` (new `jest__globals` subpath), `testing` |
| Checks to run | `lint,typecheck,unit` |
| Split | one agent |
| Runs alone | no — do not let another agent edit `testing` at the same time (EPIC.md's "Runs with" column for G22 says "any outside `testing`") |

## Why

Jest's API (`jest.spyOn`, `jest.doMock`, `jest.requireActual`, `jest.isolateModulesAsync`, and the rest
of the `jest` global members) is really the npm package `@jest/globals` — so it belongs at
`#gateway/npm/jest__globals` like every other outside package, and `packages/testing` (the ONE package
that legitimately calls it today) should reach it through the gateway rather than touching the global
`jest` object directly. This item builds that subpath and untangles `testing`'s direct `jest.*` calls
into gateway wrappers.

## Current state

Checked 2026-09-26 against the code:

- **No `jest__globals` (or any `jest`-named) subpath exists anywhere in the gateway yet.** A folder
  listing of `packages/@gateway/npm/src/` found only `eslint-plugin-jest` (an unrelated ESLint plugin
  package) and `testing-library__jest-dom` — no subpath for `@jest/globals` itself.
- **`packages/testing/src/adapters/jest/` already holds the SEVEN adapters the source doc names as
  needing to "stay in testing as brokers or transformers"** (this item's own scope is narrower than
  that reclassification — see "Traps" below): `register-mock`, `register-spy-on`,
  `register-module-mock`, `require-actual`, `isolate-modules` (all under `adapters/jest/`), plus
  `child-process/mocker` (item 21's "child-process-mocker") and `timers/watch` (item 21's
  "timers-watch") elsewhere under `packages/testing/src/adapters/`. All seven exist today as
  adapters; turning them into brokers/transformers per the design direction ("adapters" folder type
  going away) is [A14](a14-adapters-testing.md)'s job, not this item's — this item only has to get
  their JEST CALLS routed through the new gateway subpath.
- **`packages/testing/package.json` lists no `@dungeonmaster/*` package as a `dependencies` entry**
  today (checked 2026-09-26) — it has no `dependencies` key that names a workspace package at all; its
  only `dependencies` are `msw` and `tsx`. This confirms item 21's warning: once `testing` needs to
  import `#gateway/npm/jest__globals` as a real `dependency` (not a `devDependency`), the build-order
  script will see BOTH edges (`testing` needs gateway; gateway packages already list `testing` as a
  `devDependency` for their own proxies) and throw `Dependency cycle among workspaces` — UNLESS G02 has
  already fixed `readManifests` to ignore `devDependencies` when ordering the build. **Confirm G02 has
  landed before adding this dependency edge**, or the build breaks the day this item's dependency change
  lands.
- **`packages/testing/package.json` has no `publishConfig` with `"access": "public"`** (checked
  2026-09-26 across every workspace package's `package.json`) — confirming item 21a's claim directly.
  This item does not fix that (G03 does); it is named here only because a consumer's `npm install`
  needs G03 to have landed before this item's changes are useful outside this repo.
- **The four orchestrator proxy files the source doc names, confirmed to exist:**
  `packages/orchestrator/src/brokers/quest/route-scope/quest-route-scope-broker.proxy.ts`,
  `packages/orchestrator/src/brokers/quest/node-dispatch-loop/quest-node-dispatch-loop-broker.proxy.ts`,
  `packages/orchestrator/src/brokers/quest/run-step/quest-run-step-broker.proxy.ts`,
  `packages/orchestrator/src/brokers/step-handler/riftcarver/step-handler-riftcarver-broker.proxy.ts`.
  Read `quest-route-scope-broker.proxy.ts` as the worked example: it calls
  `registerModuleMock({ module: '@dungeonmaster/shared/adapters', factory: () => ({
  ...jest.requireActual('@dungeonmaster/shared/adapters'), fsExistsSyncAdapter: jest.fn(), ... }) })` —
  a `jest.requireActual` call INSIDE a factory function passed to `registerModuleMock`, which itself
  wraps `jest.mock(...)`. `jest.mock()` calls are hoisted by Jest above every import in the file, so this
  factory can run before the file's own `import { requireActual } from
  '@dungeonmaster/testing/register-mock'` (or, after this item, an import of a gateway wrapper) has
  actually loaded. This is exactly the hazard the source doc flags: "a factory that calls an imported
  gateway function may run before that import has loaded." All four files use this same shape (a
  `registerModuleMock` factory calling `jest.requireActual` directly) and need a VERIFIED pattern before
  they can switch to calling a gateway wrapper instead of the bare global `jest.requireActual`.

## Work

1. **Confirm G02 has landed** (the build-order fix). If not, stop and report this item as blocked — do
   not add the `testing` → gateway dependency edge against an unfixed build order.
2. **Build the `#gateway/npm/jest__globals` subpath.** A pass-through barrel
   (`export * from '@jest/globals';`), its own barrel test (export-key comparison against the real
   module, matching the existing pass-through pattern), and named wrapper folders for whichever `jest`
   members `packages/testing`'s adapters actually call — at minimum: `spyOn`, `doMock` (or `mock`),
   `requireActual`, `isolateModulesAsync` (and `isolateModules` if a sync variant is also used), plus
   whatever `child-process/mocker` and `timers/watch` need under the hood (check both files' current
   direct `jest.*` calls before assuming the list above is complete).
3. **Add `@dungeonmaster/npm` (or however the npm gateway package's own name resolves through
   `#gateway/npm/*`) as a real `dependency` in `packages/testing/package.json`.**
4. **Move every `jest.*` call inside `packages/testing/src/adapters/jest/` and the two other adapters
   named above (`child-process/mocker`, `timers/watch`) onto the new gateway wrapper**, so `testing`
   itself never touches the bare global `jest` object — it calls
   `#gateway/npm/jest__globals`'s wrapped functions instead.
5. **Establish the verified pattern for the four orchestrator proxy files.** The hazard is specifically
   `jest.requireActual` called INSIDE a `registerModuleMock`/`jest.mock()` factory, which is hoisted
   above the file's own imports. Options to verify (pick one, prove it works with a real test run, and
   record the choice under DECISIONS):
   - Import the gateway's `requireActual` wrapper normally at the top of the file and confirm Jest's
     hoisting of `jest.mock()` calls does NOT, in practice, run the factory before a REGULAR (not
     `jest.mock`-hoisted) `import` statement has been evaluated — imports are hoisted too, and JS module
     evaluation order may make this safe even though the factory function's own invocation is deferred
     until the mock is actually used, not until file-load time. Verify this empirically rather than
     reasoning about it in the abstract.
   - If it is NOT safe, keep the bare global `jest.requireActual` call inside these four factories
     specifically (an explicit, narrow exception), and say so under DECISIONS with the reason — do not
     silently leave four files still calling `jest` directly with no note explaining why they are exempt
     from this item's own rule.
6. **Check whether the proxy-mock hoister (`typescript-proxy-mock-transformer` /
   `proxy-mock-collector` under `packages/testing/src/middleware/`) handles imports from
   `#gateway/npm/jest__globals` the same way it handles any other `.proxy`/`.stub` import** — the
   hoister's whole job is finding and hoisting certain imports; confirm it does not need a special case
   added for the new gateway import path, and if it does, add it.

## Lint rules this item adds or changes

None built here. This item's own success is partly enforced by G12's `bannedExports`/`restrictedTo`
gateway-config mechanism and the caller-facing rules (`raw-import-ban`, `platform-globals-ban`) that
turn on repo-wide later (item 29) — those are separate items, not this one.

## Teaching text this item changes

None yet — Phase 6.

## Done when

- [ ] `#gateway/npm/jest__globals` exists, with a barrel, a barrel test, and named wrapper folders for
      every `jest` member `testing`'s own adapters call.
- [ ] `packages/testing/package.json` lists the npm gateway package as a real `dependency`.
- [ ] Every `jest.*` call inside `testing`'s seven named adapters (`register-mock`, `register-spy-on`,
      `register-module-mock`, `require-actual`, `isolate-modules`, `child-process/mocker`,
      `timers/watch`) goes through the new gateway wrapper instead of the bare global.
- [ ] The four orchestrator proxy files have a verified, working pattern for their
      `jest.requireActual`-inside-a-hoisted-factory shape, recorded under DECISIONS whichever way it
      landed.
- [ ] `npm run build` (report to the operator that a build is needed to prove the dependency-cycle fix
      holds — this item does not run the build itself) succeeds with `testing` depending on the gateway.
- [ ] `npm run ward -- -- <files touched>` exits 0.

## Traps

- **Do not build this item before confirming G02 landed.** Adding the dependency edge against the
  unfixed build order reproduces the exact `Dependency cycle among workspaces` crash the source doc
  warns about, and it will not be obvious from a scoped ward run — it only shows up in a real
  `npm run build`, which this item never runs itself (report "build needed" per `agent-brief.md`'s
  standing rule).
- **Reclassifying the seven adapters into brokers/transformers is [A14](a14-adapters-testing.md)'s
  job, not this item's.** Do not rename or restructure `packages/testing/src/adapters/jest/` (or the
  other two) beyond swapping their internal `jest.*` calls for gateway calls — leave the folder shape
  and the `adapters/` classification for A14 to change.
- The four orchestrator proxy files are the one place this item might legitimately conclude "the bare
  global `jest.requireActual` stays, by exception" — do not force a fix that breaks Jest's hoisting
  contract just to make every file uniform. Verify empirically before deciding either way.

## Concessions made while executing

<Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table.>

## Plan

Checked against code on 2026-09-27:

- `packages/testing/package.json:97-99` **already lists `@dungeonmaster/node` and `@dungeonmaster/npm`
  as real `dependencies`** (added by G13 for `mantine-render-adapter.ts`). The item's "Current state"
  (checked 2026-09-26) says testing has no `@dungeonmaster/*` dependency at all — stale. Work step 3 is
  already done; no edit needed there.
- Only **4 of the 7 named adapters actually call `jest.*`**. Read all seven:
  `jest-register-mock-adapter.ts` (no jest call — only calls methods on the passed-in `fn`),
  `jest-register-module-mock-adapter.ts` (runtime no-op; the real `jest.mock()` text is emitted by
  `typescript-ast-to-module-mock-calls-adapter.ts`'s AST transform, not by this file calling `jest.*`),
  and `timers-watch-adapter.ts` (wraps `globalThis.setTimeout`/etc., never `jest`) have **nothing to
  migrate**. Only `jest-register-spy-on-adapter.ts` (`jest.spyOn`), `jest-require-actual-adapter.ts`
  (`jest.requireActual`, twice — module scope and inside the function), `jest-isolate-modules-adapter.ts`
  (`jest.isolateModulesAsync`, `jest.doMock`) and `child-process-mocker-adapter.ts` (`jest.resetModules`,
  `jest.fn` x3, `jest.doMock`) have real calls.
- Work step 6 (hoister special case) is very likely a non-issue: every jest__globals wrapper's own
  `.proxy.ts` will be an **empty proxy** (`Record<PropertyKey, never>`), the same shape
  `child-process-mocker-adapter.proxy.ts:3-6` and `timers-watch-adapter.proxy.ts` already use for
  adapters that wrap the test-mocking mechanism itself and must run real — nothing in an empty proxy for
  the collector (`proxy-mock-collector-middleware.ts`) to hoist.
- **The 4 orchestrator proxy files Work step 5 names sit outside the item's own "Packages touched"
  table** (which lists only `@gateway/npm` and `testing`) — `orchestrator` must be added; confirmed all
  four still exist with the exact `jest.requireActual`-inside-`registerModuleMock`-factory shape:
  `quest-route-scope-broker.proxy.ts:76-89`, `quest-node-dispatch-loop-broker.proxy.ts:24-43`,
  `quest-run-step-broker.proxy.ts:54-68`, `step-handler-riftcarver-broker.proxy.ts:87-103`.
- Two of those four files carry **open, unrelated follow-ups that touch the same file**:
  `step-handler-riftcarver-broker.proxy.ts` is named in open F34 (`streamLines` read-back) and open F35
  (raw `spawn` mock + `as never` casts) — coordinate ownership before editing it here.
- `packages/testing/register-mock.ts:13,16,17` re-exports these three adapters as `registerSpyOn`,
  `requireActual` and `isolateModules` (note: exported name `isolateModules`, though it wraps
  `jest.isolateModulesAsync` internally) — these three are used by virtually every `.proxy.ts` file in
  the repo. `childProcessMockerAdapter` is also exported from `packages/testing/index.ts:6`, but a
  repo-wide search (`discover({grep:"childProcessMockerAdapter", strict:true})`) found no caller outside
  `packages/testing/` itself — its blast radius is testing's own package only.

### Files

**New — `#gateway/npm/jest__globals` subpath** (`packages/@gateway/npm/src/jest__globals/`):
`jest__globals.ts`, `jest__globals.test.ts`, `spy-on/spy-on.ts`, `spy-on/spy-on.proxy.ts`,
`spy-on/spy-on.test.ts`, `do-mock/do-mock.ts`, `do-mock/do-mock.proxy.ts`, `do-mock/do-mock.test.ts`,
`require-actual/require-actual.ts`, `require-actual/require-actual.proxy.ts`,
`require-actual/require-actual.test.ts`, `isolate-modules-async/isolate-modules-async.ts`,
`isolate-modules-async/isolate-modules-async.proxy.ts`, `isolate-modules-async/isolate-modules-async.test.ts`,
`reset-modules/reset-modules.ts`, `reset-modules/reset-modules.proxy.ts`, `reset-modules/reset-modules.test.ts`,
`fn/fn.ts`, `fn/fn.proxy.ts`, `fn/fn.test.ts`. Each `<name>.ts` is a thin wrapper calling the matching
`jest.<member>` from `@jest/globals`'s `jest` object (e.g. `export const spyOn = <T extends object>({object, method}: {object: T; method: keyof T & string}): ReturnType<typeof jest.spyOn> => jest.spyOn(object, method as never);`)
— pick the one-object-argument form per `get-architecture`'s parameter rule, even though `jest.spyOn`
itself is positional. Each `.proxy.ts` is empty (see staleness bullet above). `jest__globals.ts` does
`export * from '@jest/globals';` plus named re-exports of the six wrappers, matching the "Curated entry"
shape of `packages/@gateway/browser/src/fetch/fetch.ts`. `jest__globals.test.ts` is an export-key
comparison against the real `@jest/globals` module, matching `packages/@gateway/npm/src/eslint-plugin-jest/eslint-plugin-jest.test.ts`.

**Edited — registration:**
- `packages/@gateway/npm/package.json` — add `"@jest/globals"` to `dependencies` (confirm the exact
  version against this repo's own `jest` devDependency, `^30.0.4` in root `package.json`, at
  implementation time).

**Edited — testing's adapters (only the 4 with real `jest.*` calls):**
- `packages/testing/src/adapters/jest/register-spy-on/jest-register-spy-on-adapter.ts` — `jest.spyOn(object, method as never)` → the gateway's `spyOn`.
- `packages/testing/src/adapters/jest/register-spy-on/jest-register-spy-on-adapter.proxy.ts` — compose the gateway's `spy-on.proxy` (empty) per `enforce-proxy-child-creation`.
- `packages/testing/src/adapters/jest/register-spy-on/jest-register-spy-on-adapter.test.ts` — re-run unchanged; confirm still green.
- `packages/testing/src/adapters/jest/require-actual/jest-require-actual-adapter.ts` — both `jest.requireActual(...)` calls (module-scope line 17, function-body lines 28/56) → the gateway's `requireActual`. Safe and mechanical: this file's own top-level call runs after its own `import` lines resolve, unlike the orchestrator factories in G22-13.
- `packages/testing/src/adapters/jest/require-actual/jest-require-actual-adapter.proxy.ts` — compose `require-actual.proxy` (empty).
- `packages/testing/src/adapters/jest/require-actual/jest-require-actual-adapter.test.ts` — re-run unchanged.
- `packages/testing/src/adapters/jest/isolate-modules/jest-isolate-modules-adapter.ts` — `jest.isolateModulesAsync` → gateway `isolateModulesAsync`; `jest.doMock` → gateway `doMock`.
- `packages/testing/src/adapters/jest/isolate-modules/jest-isolate-modules-adapter.proxy.ts` — compose both children's proxies (empty).
- `packages/testing/src/adapters/jest/isolate-modules/jest-isolate-modules-adapter.test.ts` — re-run unchanged.
- `packages/testing/src/adapters/child-process/mocker/child-process-mocker-adapter.ts` — `jest.resetModules()` (x2) → gateway `resetModules`; `jest.fn()` (x3: `mockSpawn`, `stdin.write`, `stdin.end`) → gateway `fn`; `jest.doMock('child_process', ...)` → gateway `doMock`. Decide whether the `jest.Mock` type annotations on `stdin.write`/`stdin.end` (line 22-24) become `ReturnType<typeof fn>` or stay as a type-only import from the gateway barrel — record under DECISIONS.
- `packages/testing/src/adapters/child-process/mocker/child-process-mocker-adapter.proxy.ts` — compose the used children's proxies (empty).
- `packages/testing/src/adapters/child-process/mocker/child-process-mocker-adapter.test.ts` — re-run unchanged.

**Added during G22-1..8 implementation, in-package (not in the file list above):**
`packages/@gateway/npm/src/jest__globals/mock-function/mock-function.stub.ts` and
`mock-function.stub.test.ts` — `gateway-colocation`'s `requireStub` option is `error` repo-wide
(landed by G18, confirmed at `packages/eslint-plugin/src/brokers/config/dungeonmaster/config-dungeonmaster-broker.ts:285`),
and `gatewaySubpathHasStubLayerBroker` requires at least one `.stub.ts` file somewhere under a
subpath's own folder tree or the barrel is flagged `missingStub` — the plan's file list for this
subpath named none. `MockFunctionStub` mints a real jest Mock through the subpath's own `fn`
wrapper, the same "real value via the real call" shape as `debugger.stub.ts` beside `debug.ts`.

**Not touched** (no `jest.*` call found): `jest-register-mock-adapter.ts`(+`.proxy.ts`/`.test.ts`),
`jest-register-module-mock-adapter.ts`(+`.proxy.ts`/`.test.ts`), `timers-watch-adapter.ts`(+`.proxy.ts`/`.test.ts`),
`packages/testing/register-mock.ts`, `packages/testing/index.ts`.

**Edited — orchestrator (Work step 5, the verified-pattern batch):**
- `packages/orchestrator/src/brokers/quest/route-scope/quest-route-scope-broker.proxy.ts`
- `packages/orchestrator/src/brokers/quest/node-dispatch-loop/quest-node-dispatch-loop-broker.proxy.ts`
- `packages/orchestrator/src/brokers/quest/run-step/quest-run-step-broker.proxy.ts`
- `packages/orchestrator/src/brokers/step-handler/riftcarver/step-handler-riftcarver-broker.proxy.ts`

Each file's `jest.requireActual(...)` call inside its `registerModuleMock({module, factory: () => ({...})})`
factory becomes the gateway's `requireActual`, imported normally at the top of the file — IF a real
`npm run ward -- -- <that file>` plus that broker's own whole-package unit run proves the factory (hoisted
above imports, but invoked lazily on first `require` of the mocked module — never at file-load time) still
sees an initialized import. If it does not, keep the bare `jest.requireActual` in these four factories as an
explicit, named exception and record it under DECISIONS — do not touch the `jest.fn()` calls in the same
factories (out of this item's scope; that hazard is unrelated).

### Batches

| ID | Files | Depends on | Runs beside | What it does |
|---|---|---|---|---|
| G22-1 | `@gateway/npm/package.json`; `jest__globals/jest__globals.ts` (pass-through only); `jest__globals.test.ts` | — | — (must land first) | Adds the `@jest/globals` dependency and the barrel skeleton. |
| G22-2 | `spy-on/spy-on.ts`, `.proxy.ts`, `.test.ts` | G22-1 | G22-3..7 | `spyOn` wrapper. |
| G22-3 | `do-mock/do-mock.ts`, `.proxy.ts`, `.test.ts` | G22-1 | G22-2, G22-4..7 | `doMock` wrapper. |
| G22-4 | `require-actual/require-actual.ts`, `.proxy.ts`, `.test.ts` | G22-1 | G22-2,3,5,6,7 | `requireActual` wrapper. |
| G22-5 | `isolate-modules-async/isolate-modules-async.ts`, `.proxy.ts`, `.test.ts` | G22-1 | G22-2,3,4,6,7 | `isolateModulesAsync` wrapper. |
| G22-6 | `reset-modules/reset-modules.ts`, `.proxy.ts`, `.test.ts` | G22-1 | G22-2,3,4,5,7 | `resetModules` wrapper. |
| G22-7 | `fn/fn.ts`, `.proxy.ts`, `.test.ts` | G22-1 | G22-2,3,4,5,6 | `fn` wrapper. |
| G22-8 | `jest__globals.ts`, `jest__globals.test.ts` (curated re-exports) | G22-2..7 | — | Barrel re-exports all six named wrappers, matching `fetch.ts`'s curated-entry shape. |
| G22-9 | `jest-register-spy-on-adapter.ts`, `.proxy.ts`, `.test.ts` | G22-8 | G22-10,11,12 | Testing's spy-on adapter calls the gateway instead of bare `jest`. |
| G22-10 | `jest-require-actual-adapter.ts`, `.proxy.ts`, `.test.ts` | G22-8 | G22-9,11,12 | Testing's require-actual adapter calls the gateway. |
| G22-11 | `jest-isolate-modules-adapter.ts`, `.proxy.ts`, `.test.ts` | G22-8 | G22-9,10,12 | Testing's isolate-modules adapter calls the gateway. |
| G22-12 | `child-process-mocker-adapter.ts`, `.proxy.ts`, `.test.ts` | G22-6,G22-7,G22-3,G22-8 | G22-9,10,11 | Testing's child-process mocker calls the gateway. |
| G22-13 | The 4 orchestrator `.proxy.ts` files | G22-4 | none — claim these 4 files alone, check F34/F35 are not in flight first | Verifies (or records the exception for) the hoisted-factory `requireActual` swap. |

Despite the batch split above (sized 2-4 files each, per the file's own rule), the item's own header says
**"Split: one agent" and "Runs alone: no — do not let another agent edit `testing` at the same time."**
G22-2 through G22-7 touch disjoint files and are technically parallelizable, but the operator should treat
the whole item as ONE claim on `@gateway/npm` and `testing` (sequential batches, one agent or one agent at
a time), consistent with that header and with the EPIC handoff's own note on this item ("Touches
`registerMock`'s foundation: run the wide unit regression before committing").

### Verification

| Batch(es) | Ward | Whole unit suites required after |
|---|---|---|
| G22-1..8 | `npm run ward -- -- packages/@gateway/npm` (or the touched files) | none yet — nothing outside `@gateway/npm` imports the new subpath until G22-9 |
| G22-9, G22-10, G22-11 | `npm run ward -- -- <the 3 touched files>` | **Every package's whole unit suite.** `registerSpyOn`, `requireActual` and `isolateModules` (from `@dungeonmaster/testing/register-mock`) back virtually every `.proxy.ts` file in the repo — this is the "touches registerMock's foundation" case the EPIC handoff already flags. |
| G22-12 | `npm run ward -- -- <the 3 touched files>` | `testing`'s own whole unit suite only — no external caller of `childProcessMockerAdapter` found. |
| G22-13 | `npm run ward -- -- <the 4 orchestrator files>` | `orchestrator`'s whole unit suite (mandatory — these proxies are composed by many other quest broker tests, per each file's own header comment); `server` and `mcp` whole unit suites too, since A02/A12 history shows both compose orchestrator proxies. |

### Build / consumer-resolution

- **Build needed, but not by this item.** Per the item's own Done-when list: report to the operator that
  `npm run build` (whole repo, or at minimum `@gateway/npm` then `testing`) is needed to prove the G02
  build-order fix holds now that `testing` depends on the gateway for real. Ward's typecheck/unit runs use
  the `source` condition and need no build.
- **`check:consumer` required before commit (EPIC rule 13).** `@gateway/npm`'s `package.json` gains a new
  published `dependencies` entry (`@jest/globals`), which changes what a consumer installs — run
  `npm run build:clean` then `npm run check:consumer` before this item's commit.

### Open questions

- Whether `jest.Mock` type usage in `child-process-mocker-adapter.ts` (typing `stdin.write`/`stdin.end`)
  should switch to `ReturnType<typeof fn>` or import `Mock` as a type from the gateway barrel — either
  works; record the choice under DECISIONS.
- Whether the orchestrator swap (G22-13) holds empirically. The item's own Traps section already names
  this as the one place a bare `jest.requireActual` exception is acceptable — this plan cannot resolve it
  without a real jest run.
