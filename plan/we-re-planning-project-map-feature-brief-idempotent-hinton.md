# Project-map → connection-graph + per-package inventory

## Context

`mcp__dungeonmaster__get-project-map` today is a phonebook (per-package folder/file inventory, ~6k tokens). It tells an LLM "web has 642 files in 9 folder types" but nothing about how packages connect. To orient an LLM the way an ER diagram orients a backend dev, the map needs **inter-package edges**: HTTP request/response pairs, WS event emit/consume pairs, file-bus pairs, direct cross-package adapter calls, state ownership.

The current per-package inventory still has value but belongs in a separate, on-demand tool.

**Format anchor:** `tmp/server-map.md` is the locked output shape for `http-backend`. Other types (mcp-server, programmatic-service, cli-tool, hook-handlers, eslint-plugin, frontend-react, library) get analogous shapes per the per-type table in `tmp/project-map-feature-brief.md` §"Per-type meta splice", but we are NOT pre-locking a separate `tmp/<type>-map.md` for each before coding. Instead, each per-type renderer is built to spec and validated by reading its output against the brief.

**Source documents** (read both before coding):
- `tmp/project-map-feature-brief.md` — detection rules, format conventions (locked), extraction tiers, phasing
- `tmp/server-map.md` — the only locked format reference; regression target for this monorepo's `server` package output

**Stale-but-useful precursor:** `~/.claude/plans/pull-the-project-map-generic-moore.md` has correct file-locations and edge-detection mechanics. Its long fenced "Concrete sample output" block predates the format lock — ignore that block.

## Outcome

After this work:
- `get-project-map` (no args) returns a connection-graph view: per-package boot + type-specific headline + one detailed exemplar trace per package + side-channel cascade + cross-package EDGES footer + excluded-categories audit. Output is markdown.
- `get-project-inventory({ packageName })` returns the current per-package folder/file detail.
- Adding a new package type is one detection-rule entry + one renderer file.

## Approach

Server-map.md is the format gold standard. Build implementation in three phases (numbering matches the brief). Each per-type renderer matches server-map.md on the universal sections (Boot, BOUNDARY box style, side-channel, excluded audit) and varies only on the type-specific headline + exemplar shape. v1 emits everything; size filters deferred to v2 once we measure real token cost.

## Phase 1 — Inventory split (no user-facing change)

Goal: `get-project-map` output is **byte-identical** to current; new `get-project-inventory` tool exists and is callable.

1. [x] **Lift per-package body** from `packages/shared/src/brokers/architecture/project-map/architecture-project-map-broker.ts` lines 69–114 into a new broker `packages/shared/src/brokers/architecture/package-inventory/architecture-package-inventory-broker.ts`.
   - Signature: `({ packageName, srcPath }) => string`. Returns the **exact same string** the per-package iteration produces today (header line + folder rollups, no leading/trailing newline). The composer in `architecture-project-map-broker` joins these strings with `'\n\n'` exactly as today's loop does. Test it produces the existing snapshot byte-for-byte.
2. [x] **Register tool** in `packages/mcp/src/flows/architecture/architecture-flow.ts`: `get-project-inventory({ packageName: PackageName })`. Add input contract under `packages/mcp/src/contracts/get-project-inventory-input/` (re-use `package-name` contract from shared if it already exists; otherwise add brand `z.string().brand<'PackageName'>()`).
3. [x] **Dispatch** in `packages/mcp/src/responders/architecture/handle/architecture-handle-responder.ts` — add `if (tool === 'get-project-inventory')` case, parse input, call inventory broker.
4. [x] **Update existing project-map broker** to delegate per-package emission to `architecture-package-inventory-broker` (byte-identical output).
5. [x] **Tests** (per `get-testing-patterns`): unit tests for both brokers using proxies. Concrete pattern: a colocated `*-broker.proxy.ts` per implementation file; tests `registerMock({ fn: <imported-npm-fn> })` for fs/glob/readdir at I/O boundaries; fresh proxy per test (no `beforeEach`/`afterEach`); assertions use `toStrictEqual` and `toBe` only; tests import stubs (NOT contract types). Model on the existing `safe-readdir-layer-broker.proxy.ts` pattern. Integration test for the new tool through `architecture-handle-responder`.
6. [x] **MCP tool registration in statics:** `mcpToolsStatics` is a hand-written `as const` object at `packages/shared/src/statics/mcp-tools/mcp-tools-statics.ts`, consumed by `packages/mcp/src/transformers/mcp-permissions-creator/mcp-permissions-creator-transformer.ts`. Append `'get-project-inventory'` directly to the statics file's tool-names list AND its colocated test array. Then `npm run init` regenerates `.claude/settings.json` permissions through the install pipeline. Do NOT hand-edit settings.json.

## Phase 2 — Rebuild project-map output

Goal: `get-project-map` returns the connection-graph view per server-map.md shape.

### 2a. Detection

7. [x] **`packages/shared/src/brokers/architecture/package-type-detect/`** — runs the priority-order detection table from the brief §"Tech-type detection". Returns a branded `PackageType` literal: `'http-backend' | 'mcp-server' | 'frontend-react' | 'frontend-ink' | 'hook-handlers' | 'eslint-plugin' | 'cli-tool' | 'programmatic-service' | 'library'`.
   - Add contract: `packages/shared/src/contracts/package-type/`
   - Detection signals are filesystem + `package.json` only — never names. Mechanics per brief §"AST/file-read mechanics".
   - **Decompose into small layer-brokers/guards** (one per signal): `has-hono-or-express-adapter-guard`, `has-modelcontextprotocol-adapter-guard`, `has-widgets-folder-guard`, `react-in-deps-guard`, `bin-entry-count-broker`, `startup-references-argv-guard`, `flow-returns-tool-registration-guard`, `startup-exports-async-namespace-guard`. Top-level broker chains them in priority order.
   - **TS-AST infrastructure note:** "startup exports a namespace of async methods" (programmatic-service signal) and "flow returns `ToolRegistration[]`" (mcp-server signal) require TypeScript AST parsing. `shared` has no TS-AST adapter today. Either (a) add `packages/shared/src/adapters/typescript/parse-source-file/` wrapping `typescript` compiler API, or (b) start with the heuristic alternatives the brief allows: regex grep for `export const \w+ = {` + `async (` for namespace; grep `import { ToolRegistration }` for flow signal. Recommend (b) for v1 — cheaper and the brief explicitly permits it; revisit if heuristics misfire.
   - **`mock-rails`** is empty (0 files) and is being deleted; if still present at scan time, falls through to `library`. No special-case needed.
8. [x] **Test**: every current monorepo package classifies to its expected type (per the conflict-resolution decision below for `tooling`). Fixture-based tests for synthetic package shapes covering priority ordering and hybrid edge cases.

### 2b. Universal extractors

9. [x] **`packages/shared/src/brokers/architecture/edge-graph/`** — five layer brokers, each producing one edge category for the EDGES footer and feeding type-specific headlines:
   - `http-edges-layer-broker` — joins server `app.<method>(apiRoutesStatics.<g>.<k>, …)` AST scan with web `fetch{Get,Post,Patch,Delete}Adapter({url: webConfigStatics.api.routes.<k>})`. Resolve both static refs to literals; join key `(method, urlPattern)`. **Must also handle inline string-literal route registrations** (e.g. `app.get('/api/health', …)` if `flows/health/health-flow.ts` doesn't go through `apiRoutesStatics`) — first arg may be either a literal string or a `MemberExpression` resolving into the statics. Verify both shapes during AST walk.
   > [DONE: http-edges]
   - `ws-edges-layer-broker` — emit sites: `orchestrationEventsState.emit({type: '<lit>', …})`. Consume sites: `if (parsed.data.type === '<lit>')` after `wsMessageContract.safeParse`. Join key: literal type string. Canonical union from `packages/shared/src/contracts/orchestration-event-type/orchestration-event-type-contract.ts` (Zod enum, 16 literals).
   > [DONE: ws-edges]
   - `file-bus-edges-layer-broker` — pairs `fsAppendFileAdapter`/`fsWriteFileAdapter` callers with `fsWatchTailAdapter` callers, joining on resolved literal path (resolved through `shared/brokers/locations/*-find-broker` chains).
   > [DONE: file-bus-edges]
   - `direct-call-edges-layer-broker` — every folder `packages/X/adapters/<otherPkg>/<sub>/` is a wrapper; read body to extract `<OtherPkg>.<method>` and signature. Convention: adapter sub-folder name matches an importable package name.
   > [DONE: direct-call-edges]
   - `import-edges-layer-broker` — cross-package barrel imports beyond direct adapters (e.g. `@dungeonmaster/shared/contracts`). Aggregate by source pkg + barrel.
   > [DONE: import-edges]
   - **Known orphan:** `webConfigStatics.api.routes.sessionChatHistory` (`/api/sessions/:sessionId/chat/history`) has no server-side `apiRoutesStatics` entry. The HTTP-edge join will produce one orphan in v1 output — expected, surface via Phase 3 `orphans?: boolean` if needed.
10. [x] **`packages/shared/src/brokers/architecture/state-writes/`** — scans:
    - `state/*` folder names imported by responders/brokers (architectural stores)
    - `fsAppendFileAdapter` / `fsWriteFileAdapter` / `fsMkdirAdapter` callers traced back to literal paths via `shared/brokers/locations/*-find-broker` chains (file writes)
    - localStorage/sessionStorage/indexedDB usage in adapters (browser storage)
    - Reuses path-resolution logic with file-bus broker.
11. [x] **`packages/shared/src/brokers/architecture/widget-tree/`** — frontend-react only. For each widget file, extract imports targeting other widget paths. Build directed graph. Roots = widgets imported by responders/flows. Hubs = in-degree ≥ 5 (listed separately, not inline).
12. [x] **`packages/shared/src/brokers/architecture/boot-tree/`** — startup → flows → responders skeleton. Universal across all types except `library` (libraries skip Boot section).

### 2c. Per-type renderers

One renderer per detected type. Each is its own broker file under `packages/shared/src/brokers/architecture/project-map/headline/`:

13. [x] `project-map-headline-http-backend-broker` — Routes table grouped by flow file (matches server-map.md §"Routes" exactly). One detailed exemplar trace.
14. [x] `project-map-headline-mcp-server-broker` — Tool registration table grouped by flow file (each flow returns `ToolRegistration[]`, names are literals). One tool exemplar trace.
15. [x] `project-map-headline-programmatic-service-broker` — Public API method table grouped by domain + event-bus emissions list + owned state stores. One API-call exemplar.
16. [x] `project-map-headline-cli-tool-broker` — Subcommand → responder table. One subcommand exemplar.
17. [x] `project-map-headline-hook-handlers-broker` — Hook event registration table (each `bin` entry → startup → flow → responder → spawned subprocess / fs writes). One hook invocation exemplar.
18. [x] `project-map-headline-eslint-plugin-broker` — Rules grouped by name prefix (ban-, enforce-, forbid-, require-, no-, other) + config presets. One rule's broker as exemplar (no request-shape).
19. [x] `project-map-headline-frontend-react-broker` — Widget composition tree (roots + 2 levels of children) + which bindings/brokers attach where. Hubs listed separately. One user-interaction exemplar (click → broker → HTTP edge AND WS dispatch back → state writes → re-render).
20. [x] `project-map-headline-library-broker` — Barrel export table + consumer-package count. No exemplar trace.
20a. **`frontend-ink` is detected but NOT rendered in v1.** No current package is `frontend-ink`. The composer's per-type switch must throw a clear error if a `frontend-ink` package is encountered (rather than silently falling back to `library`), telling the user to add the renderer. Renderer deferred to v2.
21. [x] **Side-channel section** — for any package with WS/bus/file-outbox edges, render the async cascade (see server-map.md §"Side-channel"). Built from edge-graph results.
22. [x] **Excluded categories audit** — bottom of every package's section. Lists files in `guards/`, `transformers/`, `contracts/`, `assets/` that were on the trace path but filtered. Per brief §"Format conventions" item 7: errors/ and statics/ are NOT excluded.

### 2d. Composer + statics

23. [x] **Rewrite** `architecture-project-map-broker` to compose:
    - Top-level header: Symbol legend + URL pairing convention block (appears ONCE, not per-package — sourced from `tmp/server-map.md` lines 1–17)
    - For each package: detect type → render Header / Boot / Headline / Exemplar / Side-channel / Excluded / Inventory-counts
    - Cross-package EDGES footer
    - Pointer footer to `get-project-inventory` and `get-project-map({expand:…})` (deferred args)
24. [x] **Extend** `packages/shared/src/statics/project-map/project-map-statics.ts` with:
    - `excludedFolders: ['guards', 'transformers', 'contracts', 'assets']`
    - `staticsInlineThreshold: 15` (used by library renderer)
    - Symbol legend block (matches server-map.md header table)
    - Test-file suffix filter list (`.test.ts`, `.test.tsx`, `.proxy.ts`, `.proxy.tsx`, `.stub.ts`, `.integration.test.ts`)
25. [x] **Add a single shared filter guard** `packages/shared/src/guards/is-non-test-file/is-non-test-file-guard.ts` that consumes the suffix list above. **Every** extractor (boot-tree, edge-graph, state-writes, widget-tree, headline renderers, package-inventory) MUST route file-listing through this guard. Centralized so the filter cannot drift across extractors.
26. **Add transformers for two repeated rendering concerns:**
    - `packages/shared/src/transformers/layer-file-parent-resolve/layer-file-parent-resolve-transformer.ts` — given a layer file path (`-layer-` infix, e.g. `quest-chat-content-layer-widget.tsx`), returns its parent entry file path. Naming convention: strip `-<word>-layer` → parent name. Used by Boot-tree and headline renderers to inline layer files under their parent (brief item 10).
    - `packages/shared/src/transformers/import-path-to-package-prefix/import-path-to-package-prefix-transformer.ts` — given the file currently being rendered + a referenced symbol's source path, returns the cross-package qualified name (`shared/brokers/portResolveBroker`) when the source is in a different package, or just the bare name when local. Used everywhere cross-package origins must be inline-qualified (brief item 8).

> [DONE: import-path]
> [DONE: layer-file]
> [VERIFIED green by orchestrator-verification agent]

### 2e. Tests

27. Unit test each new broker with proxies (concrete pattern per Phase 1 step 5: `*-broker.proxy.ts` per file, `registerMock` for npm fns at I/O boundaries, no `beforeEach`/`afterEach`, fresh proxy per test, `toStrictEqual`/`toBe` only).
28. Edge-join fixture tests: synthetic server route + matching web broker → verify they pair on `(method, urlPattern)`. Same for WS and file-bus.
29. **Regression test the locked format** — the full `tmp/server-map.md` file is the authoritative reference. Test compares the `server` package's rendered section (composer output between the `# server [http-backend]` H1 line and the start of the next package's H1) against `tmp/server-map.md` lines 1–331 (whole file). The test must skip the global Symbol legend + URL pairing convention block when comparing per-package output if the v2 composer hoists those to the top-level. Spell out the comparison surface explicitly in the test setup. Other packages' outputs validated by reading.
30. Integration test for `architecture-flow.ts` end-to-end through the MCP tool dispatch.

## Phase 3 — Expansion options (deferred / v2)

Defer until token cost is measured.

31. Add optional input args to `get-project-map`: `{ expand?: ('contracts'|'transformers'|'guards'|'statics'|'adapters')[], packages?: string[], orphans?: boolean }`.
32. Implement orphan detection: HTTP routes with no caller (e.g. `webConfigStatics.api.routes.sessionChatHistory`), WS events emitted but never consumed, etc.
33. Implement `frontend-ink` headline renderer when a consumer first ships an ink-based package.

## Critical files

### MCP package (registration & dispatch)
- `packages/mcp/src/flows/architecture/architecture-flow.ts` — register `get-project-inventory` (Phase 1)
- `packages/mcp/src/responders/architecture/handle/architecture-handle-responder.ts` — add dispatch case
- `packages/mcp/src/contracts/get-project-inventory-input/` — input contract

### Shared package (implementation)
- `packages/shared/src/statics/mcp-tools/mcp-tools-statics.ts` (+ colocated test) — append `'get-project-inventory'` to tool-names list
- `packages/shared/src/brokers/architecture/project-map/architecture-project-map-broker.ts` — composer (Phase 1: delegate; Phase 2: rebuild)
- `packages/shared/src/brokers/architecture/package-inventory/` — **new** (Phase 1 lift target)
- `packages/shared/src/brokers/architecture/package-type-detect/` + per-signal sub-brokers/guards — **new** (Phase 2)
- `packages/shared/src/brokers/architecture/edge-graph/{http,ws,file-bus,direct-call,import}-edges-layer-broker/` — **new** (Phase 2)
- `packages/shared/src/brokers/architecture/state-writes/` — **new** (Phase 2)
- `packages/shared/src/brokers/architecture/widget-tree/` — **new** (Phase 2, frontend-react only)
- `packages/shared/src/brokers/architecture/boot-tree/` — **new** (Phase 2)
- `packages/shared/src/brokers/architecture/project-map/headline/{http-backend,mcp-server,programmatic-service,cli-tool,hook-handlers,eslint-plugin,frontend-react,library}-broker/` — **new** (Phase 2, 8 renderers; `frontend-ink` deferred)
- `packages/shared/src/guards/is-non-test-file/` — **new** (centralized test-file filter)
- `packages/shared/src/transformers/layer-file-parent-resolve/` — **new** (Phase 2)
- `packages/shared/src/transformers/import-path-to-package-prefix/` — **new** (Phase 2)
- `packages/shared/src/contracts/package-type/` — **new** (Phase 2)
- `packages/shared/src/statics/project-map/project-map-statics.ts` — extend with excluded folders, statics threshold, legend, test-file suffixes

### Existing helpers to reuse
- `safeReaddirLayerBroker`, `countFilesRecursiveLayerBroker`, `formatFolderContentLayerBroker`, `readPackageDescriptionLayerBroker` (current `architecture/project-map/` layer brokers — reused by inventory broker)
- AST-walk patterns from `eslint-plugin`'s broker library (typescript-eslint based) — model for parsing flows / static refs / `app.<method>` calls
- `packages/mcp/src/brokers/file/scanner/file-scanner-broker.ts` — glob+grep+metadata pattern (reusable for some discovery passes)
- `processCwdAdapter`, `absoluteFilePathContract` from shared

## Open considerations (not blocking)

- **Tooling classification: `cli-tool`** (per brief signals — confirmed). `tooling` has `package.json.bin` AND startup references `process.argv` (line 15 of `start-primitive-duplicate-detection.ts`). Detection broker test asserts this. If the cli-tool headline (subcommand table) renders poorly for a single-command package, refine the cli-tool rule in v2 (e.g. require ≥2 subcommand branches) rather than name-overriding.
- **Output token cost.** v1 emits everything. After Phase 2, run `get-project-map` against this monorepo and measure. If > ~25k tokens, prioritize Phase 3 `{packages?: string[]}` filter.
- **Detection edge case — hybrid packages.** A hypothetical package with both `widgets/` and `adapters/hono/` classifies as `http-backend` (higher priority). Brief calls this a known misclassification; out of scope for v1.
- **TS-AST in shared.** Two detection signals (`programmatic-service` startup-shape, `mcp-server` flow-return-type) ideally use a TS compiler API. v1 starts with grep heuristics the brief allows; if either misfires on a real consumer repo, add `packages/shared/src/adapters/typescript/parse-source-file/` then.

## Verification

**Build order is load-bearing** (per CLAUDE.md ward rules): shared first, then mcp, then restart MCP. Permissions regen requires `npm link --workspaces` + `npm run init`.

After Phase 1:
1. `npm run build --workspace=@dungeonmaster/shared` then `npm run build` (full monorepo)
2. `npm link --workspaces && npm run init` (regenerate `.claude/settings.json` with new tool permission)
3. Restart MCP per `packages/mcp/CLAUDE.md`
4. Call `get-project-map` → **byte-identical** to current output (snapshot test verifies)
5. Call `get-project-inventory({ packageName: 'web' })` → matches today's per-`web` block
6. `npm run ward` green (`timeout: 600000`)

After Phase 2:
1. `npm run build --workspace=@dungeonmaster/shared` then `npm run build`
2. Restart MCP
3. Call `get-project-map` (no args) and verify:
   - `server` section matches `tmp/server-map.md` (regression test passes)
   - `orchestrator` shows `StartOrchestrator.*` API table, 16 event-bus emissions, owned state stores, owned files
   - `tooling` classifies per the conflict resolution above (default: `cli-tool`)
   - `mcp` shows registered tool list grouped by flow file (now including `get-project-inventory`)
   - `web` shows widget composition tree with roots + 2 levels + hubs
   - `cli`, `ward` show CLI subcommands
   - `hooks` shows 6 hook event registrations
   - `eslint-plugin`, `local-eslint` show rules grouped by prefix
   - `shared`, `testing`, `config` show as `library` with subpath exports + consumer counts
   - EDGES footer summarizes `web → server (HTTP N)`, `server → web (WS N)`, `orchestrator → server (bus + outbox)`, `server → orchestrator (N adapters)`, etc.
   - `sessionChatHistory` orphan route is present (one HTTP edge that doesn't pair) — expected
4. Measure token count of full output; flag for Phase 3 if > 25k.
5. `npm run ward` green.
