# S1: `adapter-census` is a shipped, tested command in `@dungeonmaster/tooling`

| | |
|---|---|
| Phase | Scripting (outside the phase list; opportunity 1 of `scripting-opportunities.md`) |
| Source | `scrolls/brands-gateways-epic/scripting-opportunities.md`, "Opportunity 1: a census and batching tool"; the one-off it promotes is `tmp/adapters-fresh/scan.cjs` |
| Needs | nothing |
| Unblocks | the planner steps of A13, A14, A17, and EPIC.md "Converting the next repo", execution step 2 |
| Packages touched | `@dungeonmaster/tooling` only |
| Checks to run | `lint,typecheck,unit,integration` |
| Split | one agent |
| Runs alone | no. Nothing else edits `packages/tooling` |

## Why

Every agent's first step re-derives the same facts: who imports an adapter, which proxies compose that
caller's proxy, and which staging methods are catch-alls. The census was built by hand three times
(`tmp/adapters-fresh/`, A12's Phase 2 census, `triage-phase2.md`). A shipped command answers it in one
run, prints a JSON file the operator can diff between runs, and works in a consumer repo, where planners
otherwise hand-write the same census (EPIC.md "Converting the next repo", step 2).

## Current state

- `packages/tooling` ships one bin, `detect-duplicate-primitives`, wired
  `bin/ -> startup/ -> flows/ -> responders/ -> brokers/`. `@dungeonmaster/tooling` is already a root
  `dependencies` entry, so a new bin ships to a consumer with no change to `cli`.
- `scan.cjs` builds a TypeScript program over every implementation file and resolves each fact through
  the type checker. It only runs from `tmp/`, and it needs the whole repo to typecheck.
- The census below resolves imports itself instead, from a parse of each file (no `Program`, no type
  checker), so it needs no `tsconfig`, runs on a consumer repo that does not typecheck, and stays fast.

## Work

The command is `adapter-census [--cwd=<repoRoot>] [--format=table|json] [--package=<name>]`. It reads
`<cwd>/package.json` for the workspace scope (through `workspaceScopeFromRootNameTransformer`, never a
hard-coded scope), finds every package under `packages/*` and `packages/@*/*`, and reports for each
package, for every `src/adapters/**/*-adapter.ts`:

- `shape`: `pass-through` or `logic`. Pass-through means exactly one outside call (a bare npm or Node
  import, a global, or a `#gateway/*` export) and nothing else: no `try`/`catch`, no branching, no
  chained call on the result, no call on a held value, no `new Promise`, no call into other repo code
  beyond a contract `.parse`/`.safeParse`, no call into another adapter, AND at least one `#gateway/*`
  export that already does the job. A gateway export matches `exact` when it has the callee's name in
  the same module, and `related` when its own implementation calls the same outside function. Anything
  else is `logic`, with a `reasons` list.
- `callers`: production files that import it (import resolved through relative paths, workspace
  package subpaths and barrel `export *` chains), the test files that import it, and the proxy files
  that import it directly.
- for each production caller: its sibling proxy, every proxy that composes that proxy (transitively),
  and every proxy in that set that stages a catch-all: `calledWith([])`, `onceFor([])`, an accept-all
  predicate (`() => true`), or reads back through `callsMatching([])`.
- the adapter's own proxy and the proxies that compose it.

Output is one JSON document (`--format=json`) or a short per-package table (the default).

## Plan

Every path is under `packages/tooling/` unless it starts with `scrolls/`.

**Wiring**
- `package.json`: the `adapter-census` bin and an `adapter-census` npm script (`tsx --conditions=source bin/adapter-census.ts`).
- `bin/adapter-census.ts`: thin entry, mirrors `bin/detect-duplicate-primitives.ts`.
- `src/startup/start-adapter-census.ts` (+ `.integration.test.ts`)
- `src/flows/adapter-census/adapter-census-flow.ts` (+ `.integration.test.ts`, the real-fixture-tree test and the real-repo count check)
- `src/responders/adapter-census/run/adapter-census-run-responder.ts` (+ `.proxy.ts`, `.test.ts`)
- `test/harnesses/adapter-census/adapter-census.harness.ts`: runs the bin as a child process, installs the fixture, reads the table counts

**Brokers** (`src/brokers/`, each with `.proxy.ts` and `.test.ts`)
- `adapter-census/run/adapter-census-run-broker.ts`: reads layout and sources through the gateway, then builds
- `adapter-census/build/adapter-census-build-broker.ts` plus three layers, `-gateway-layer-broker.ts` (gateway barrels to wrappers), `-importers-layer-broker.ts` (who imports each adapter and proxy), `-records-layer-broker.ts` (one record per adapter)
- `census-repo/read-layout/census-repo-read-layout-broker.ts`: root `package.json` scope and package list
- `census-repo/read-sources/census-repo-read-sources-broker.ts` and `-chunk-layer-broker.ts`: glob and bounded-concurrency reads
- `source-facts/extract/source-facts-extract-broker.ts` plus `-statements-layer-broker.ts` and `-staging-layer-broker.ts`: imports, re-exports, exports, catch-all staging sites
- `adapter-analysis/analyze/adapter-analysis-analyze-broker.ts` plus `-scope-`, `-calls-` and `-structure-layer-broker.ts`: outside calls and reasons for one adapter

**Transformers** (`src/transformers/<name>/<name>-transformer.ts` + `.test.ts`)
`census-path-normalize`, `gateway-module-dir`, `gateway-barrel-import-path`, `census-file-kind`,
`census-package-of-file`, `import-target-resolve`, `barrel-origins-index`, `import-origin-classify`,
`proxy-sibling-file`, `proxy-composers-collect`, `adapter-shape-classify`, `gateway-match-find`,
`adapter-census-totals`, `code-snippet-normalize`, `census-args-parse`, `census-table-line`,
`census-table-render`

**Guard** (`src/guards/is-adapter-entry-file/is-adapter-entry-file-guard.ts` + `.proxy.ts` + `.test.ts`)

**Statics** (`src/statics/<name>/<name>-statics.ts` + `.test.ts`): `census-layout`, `census-language-globals`

**Contracts** (`src/contracts/<name>/<name>-contract.ts` + `.test.ts` + `.stub.ts`)
`census-path`, `export-name`, `module-specifier`, `gateway-module-dir`, `adapter-logic-reason`,
`census-file-kind`, `census-format`, `import-origin`, `catch-all-site`, `outside-call`, `source-facts`,
`adapter-analysis`, `census-source-entry`, `census-package`, `census-root-package`,
`census-repo-layout`, `gateway-export`, `gateway-implementation`, `proxy-catch-all`, `adapter-caller`,
`adapter-record`, `package-census`, `census-count`, `adapter-census`, `census-args`. Reused as they
are: `source-code`, `glob-pattern`, `absolute-file-path`, `process-output`, `command-result`,
`exit-code`.

**Scrolls**: this file.

`packages/cli` is not touched. The published root `dependencies` already carry `@dungeonmaster/tooling`.

## Done when

- `npm run ward -- --only lint,typecheck,unit,integration -- packages/tooling` exits 0.
- The integration test runs the census on a fixture built with `installTestbedCreateBroker`, and on
  this repo read-only.
- Nothing outside `packages/tooling` and this file changed.

## Traps

- A plain text scan of import stems merges same-named adapters across packages. The census resolves
  every import to a file.
- The census reads; it never writes into the repo it scans.
- A consumer's `packages/@gateway/npm` and `packages/@gateway/bin` start empty, so an adapter over an npm
  package there is `logic` with `no-gateway-export` until the wrapper exists.

## Concessions made while executing

- The output is `--format=table` (default) or `--format=json`, not both at once, so the JSON can be redirected to a file and diffed. `--package=` keeps one package.
- The bin is `adapter-census`, not `census`, so it cannot collide with another tool in a consumer's
  `node_modules/.bin`.
- Imports are resolved from a parse of each file rather than through the type checker, so the census
  needs no working `tsconfig`. A re-export that renames (`export { a as b }`) is followed by its exported name only.
