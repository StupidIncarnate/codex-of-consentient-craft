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
