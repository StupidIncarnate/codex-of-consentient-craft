# Gateway inventory — npm packages

Scope: every adapter in every package (testing included) that calls one of: rxjs, eslint, glob, zod,
typescript, @testing-library/react, @testing-library/dom, minimatch, debug, @hono/node-ws,
@hono/node-server, fast-xml-parser, pixelmatch, playwright-core, pngjs, elkjs,
@mantine/notifications, react, react-dom, @xyflow/system, @xyflow/react. Sourced from
`tmp/adapters-fresh/adapters.json`, then every file opened directly.

## Decision summary

| Package | Kind | Gateway subpath | Notes |
|---|---|---|---|
| rxjs | pass-through | `@dungeonmaster/npm/rxjs`, `.../rxjs/operators` | six web adapters just re-export one call each |
| eslint | pass-through (peer) | `@dungeonmaster/npm/eslint` | already a peer dep in eslint-plugin/hooks/ward |
| glob | **wrapped** | `@dungeonmaster/npm/glob` | 3 packages, 3 behaviours — see below |
| zod | pass-through | `@dungeonmaster/npm/zod` | no dedicated adapter anywhere; used inline via contracts |
| typescript | pass-through (peer) | `@dungeonmaster/npm/typescript` | every user mixes it with our own contracts — splits |
| @testing-library/react | **wrapped** | `@dungeonmaster/npm/@testing-library/react` | overrides `render` only, everything else passes through |
| @testing-library/dom | pass-through | `@dungeonmaster/npm/@testing-library/dom` | reached today only transitively, via `@testing-library/react`'s re-export |
| minimatch | pass-through | `@dungeonmaster/npm/minimatch` | one caller, one fixed option — not worth curating centrally |
| debug | pass-through | `@dungeonmaster/npm/debug` | trivial factory call |
| @hono/node-ws | pass-through | `@dungeonmaster/npm/@hono/node-ws` | thin wrap exists only for mockability |
| @hono/node-server | pass-through | `@dungeonmaster/npm/@hono/node-server` | same |
| fast-xml-parser | **wrapped** | `@dungeonmaster/npm/fast-xml-parser` | fixed options today, no sad-path handling — add one |
| pixelmatch | pass-through | `@dungeonmaster/npm/pixelmatch` | deliberately never catches (own comment: let its own throw through) |
| playwright-core | pass-through (peer, via `@playwright/test`) | `@dungeonmaster/npm/@playwright/test` | nobody imports `playwright-core` by name; reached through `@playwright/test`'s re-export |
| pngjs | **wrapped** | `@dungeonmaster/npm/pngjs` | already guarded (try/catch + cause) — promote as-is, return plain values |
| elkjs | pass-through | `@dungeonmaster/npm/elkjs` | brief's own "ELK layout" split example |
| @mantine/notifications | pass-through | `@dungeonmaster/npm/@mantine/notifications` | two web adapters wrap it trivially |
| react | pass-through | `@dungeonmaster/npm/react` | |
| react-dom | pass-through | `@dungeonmaster/npm/react-dom`, `.../react-dom/client` | mirrors the subpath actually imported |
| @xyflow/system | pass-through | `@dungeonmaster/npm/@xyflow/system` | |
| @xyflow/react | pass-through | `@dungeonmaster/npm/@xyflow/react` | |

Four wrappers get real design below: **glob**, **@testing-library/react**, **fast-xml-parser**,
**pngjs**. Everything else needs no override — its adapter today is either a trivial mockability
shim (stays in its package, unmoved) or the mixed-with-our-contracts case the brief calls a split.

## glob — 3 packages, 3 behaviours, decide the winner

| Copy | Ignore list | Directories | v7 fallback |
|---|---|---|---|
| `packages/mcp/src/adapters/glob/find/glob-find-adapter.ts:20-38` | **caller-supplied, required** | excluded unless `includeDirectories` | none |
| `packages/mcp/src/adapters/fs/glob/fs-glob-adapter.ts:18-31` | none (no ignore at all) | included | none |
| `packages/server/src/adapters/glob/find/glob-find-adapter.ts:16-55` | hard-coded 4 patterns | included | **dead code, lines 31-54** — glob is on v10+, which always returns an array, so the callback-API branch never runs |
| `packages/tooling/src/adapters/glob/find/glob-find-adapter.ts:13-28` | hard-coded 4 patterns | included | none |

**Winner: mcp's `globFindAdapter` shape.** Its own comment (`glob-find-adapter.ts:4-6`) states the
reasoning the doc already settled on: "what a scan skips is a decision built from the repo's
.gitignore and the caller's own glob, and a default here would let a call site quietly scan a
different tree than every other one." A hard-coded ignore list is exactly that silent divergence —
server and tooling would each scan a different tree than mcp for the same pattern.

The gateway's `glob` wrapper is built, at `packages/@gateway/npm/src/glob/glob.ts`, matching this
winner: the same name (`glob`), `ignore` a required caller-supplied array with no baked-in default,
directories excluded by default, no v7 callback fallback, and a try/catch none of the three copies
above had.

## @testing-library/react — the wrapper design

Every web widget test calls `mantineRenderAdapter`, never raw `render`, confirmed against
`packages/web/src/widgets/logo/logo-widget.test.tsx`. That adapter wraps `render`'s output in
`MantineProvider`, with no theme prop. `testing-library-render-hook-adapter.ts` and
`testing-library-wait-for-adapter.ts` are bare pass-throughs of `renderHook` and `waitFor`, with no
provider and no options. No client-side router exists anywhere in `packages/web` today.

The gateway's `@dungeonmaster/npm/@testing-library/react` is built, at
`packages/@gateway/npm/src/@testing-library/react/`, matching this: every export passes through
except `render`, which the gateway overrides with the same `MantineProvider` wrap, keeping the same
`(ui, options?)` shape so a caller's own `options` still applies. `renderHook` stays a plain
pass-through; there is no router to wrap yet, so none is added.

Checked 2026-09-26: no `@testing-library/dom` subpath exists yet under
`packages/@gateway/npm/src/@testing-library/` — only `jest-dom`, `react` and `user-event` do.
`waitFor` is reached today only through `@testing-library/react`'s own re-export, and no file imports
`@testing-library/dom` directly.

## Adapters replaced

`scrolls/gateway-build/coverage.md` maps every old adapter to its gateway export, including every npm
one named above.

## Splits (npm call vs. our own logic)

The brief: "An adapter that mixes an npm call with our own contracts or logic splits in two. The
npm part moves to the gateway. The part using our contracts stays in its package as a broker later,
and for now it stays an adapter."

| File | npm part → gateway | our-contract part → stays adapter |
|---|---|---|
| `packages/web/src/adapters/elk/layout/elk-layout-adapter.ts` | `new ELK()`, `elk.layout(graph)` (pass-through) | node-sizing math off `elkLayoutStatics`, `FlowNode`/`FlowEdge` contract parsing, portal handling |
| `packages/siegelense/src/adapters/playwright/session/playwright-session-adapter.ts` (627 lines) and its two siblings `ref-registry-layer-adapter.ts`, `settle-poll-layer-adapter.ts` | `chromium.launch`, `browser.newContext`, `page.on(...)`, `page.evaluate`, `page.waitForTimeout` (pass-through via `@playwright/test`) | the whole `BrowserSession` facade, every `*Contract.parse`, the ref registry, the settle detector — these are almost entirely our own logic already; the npm surface is a handful of direct calls, most already isolated in `listeners-layer-adapter.ts` (which imports **nothing** from `@playwright/test` by design, per its own header comment at line 3-8) |
| `packages/web/src/adapters/react-dom/mount/react-dom-mount-adapter.ts` | `createRoot`, `root.render` (pass-through) | `document.getElementById` (a **browser global**, not npm — belongs to `@dungeonmaster/browser`, out of this inventory's scope), the `AdapterResult`/`Wrapper` shape |
| `packages/cli/src/adapters/typescript/content-diagnostics/typescript-content-diagnostics-adapter.ts` | `ts.createCompilerHost`, `ts.createProgram`, `ts.createSourceFile`, `ts.flattenDiagnosticMessageText` (pass-through) | the virtual-file host overrides, the `ErrorMessage` contract mapping |
| `packages/hydration/src/adapters/typescript/program-diagnostics/typescript-program-diagnostics-adapter.ts` | `ts.createProgram`, diagnostics getters (pass-through) | repo-root resolution, `TypeDiagnostic` contract mapping |
| `packages/tooling/src/adapters/typescript/parse/typescript-parse-adapter.ts` | `ts.createSourceFile`, `ts.forEachChild`, `ts.isStringLiteral`, `ts.isRegularExpressionLiteral` (pass-through) | the AST walk and `LiteralOccurrence`/`LiteralValue` contract mapping |

**xyflow stays whole, not split.** The four `packages/web/src/adapters/xyflow/**` files
(`xyflow-edge-adapter.ts`, `xyflow-react-flow-adapter.ts`, `node-measure-layer-adapter.ts`,
`xyflow-node-handles-adapter.ts`) render React elements built from our own statics/contracts
(`elkLayoutStatics`, `flowHandleStatics`, `FlowObservableNodeData`, etc.) around `@xyflow/react`
components. There is no separable generic wrapper here — the npm surface (`Handle`, `Position`,
`ReactFlow`, `Controls`, `BaseEdge`, `EdgeLabelRenderer`, `getBezierPath`,
`useNodesInitialized`/`useUpdateNodeInternals`) needs no guarding of its own; only the import
source changes (`@xyflow/react` → `@dungeonmaster/npm/@xyflow/react`), and the whole file stays an
adapter/widget as it is today.

## Sad-path holes today (path:line)

| Hole | What's missing |
|---|---|
| `packages/hooks/src/adapters/eslint/output-fixes/eslint-output-fixes-adapter.ts:16` | `await ESLint.outputFixes(results)` — no catch around a disk-write failure |
| `packages/server/src/adapters/hono/serve/hono-serve-adapter.ts:16` | `serve({...}, onListen)` — no catch (e.g. port already in use) |
| `packages/server/src/adapters/hono/create-node-web-socket/hono-create-node-web-socket-adapter.ts:12-16` | same — no catch |
| `packages/web/src/adapters/elk/layout/elk-layout-adapter.ts:126` | `await elk.layout(graph)` — no catch (disconnected graph, bad options) |
| `packages/eslint-plugin/src/adapters/minimatch/match/minimatch-match-adapter.ts:17` | `minimatch(filePath, pattern, ...)` — no catch for an invalid pattern |
| `packages/siegelense/src/adapters/playwright/session/playwright-session-adapter.ts:147` | `await chromium.launch({ headless: true })` — no catch (browser not installed) |

Closed: the gateway's `glob` and `parseXml` (fast-xml-parser) wrappers now catch and wrap these two
failures, confirmed against `packages/@gateway/npm/src/glob/glob.ts` and
`packages/@gateway/npm/src/fast-xml-parser/parse-xml.ts`.

**Not a hole, a deliberate decision:** `packages/siegelense/src/adapters/pixelmatch/compare/pixelmatch-compare-adapter.ts:12-17`
explains in its own header why it never catches a dimension mismatch — it lets pixelmatch's own
buffer-length check throw unmodified, because the broker that reads the two shot paths is the one
that can name them in an error. The gateway's `decodePng` (`packages/@gateway/npm/src/pngjs/decode-png.ts`)
keeps the same wrap-and-rethrow-with-`cause` shape this adapter used.

## Flagged: scan said "no outside call," but it touches an npm package

`packages/web/src/adapters/mantine/notifications/mantine-notifications-adapter.ts` — `outside: []`
in `adapters.json`, but line 10 is `import { Notifications } from '@mantine/notifications';` plus a
line-8 CSS side-effect import from the same package. Recorded in `scrolls/gateway-build/coverage.md`'s
`@mantine/notifications` row rather than in `stays-as-adapter.md`.

`packages/hooks/src/adapters/eslint/calculate-config-for-file/eslint-calculate-config-for-file-adapter.ts`
and `packages/hooks/src/adapters/eslint/is-path-ignored/eslint-is-path-ignored-adapter.ts` — the scan
recorded `outside: []` for both because each imports only `type { ESLint, Linter } from 'eslint'`, but
the runtime body calls `.calculateConfigForFile()` / `.isPathIgnored()` on the `ESLint` instance the
caller passes in — a real `eslint` API call. Recorded in `scrolls/gateway-build/coverage.md`'s eslint
row.

**Playwright's per-file boundary is not actually one file.** `playwright-session-adapter.ts:3-4`
claims to be "the ONLY file in this package allowed to import `@playwright/test`," but three
siblings in the same `playwright/session/` folder already import `type { Page } from '@playwright/test'`
and call real `Page` methods: `settle-wait-layer-adapter.ts` (`page.waitForTimeout`, inside
`settlePollLayerAdapter`), `init-script-add-layer-adapter.ts:20` (`page.addInitScript`), and
`viewport-set-layer-adapter.ts:23` (`page.setViewportSize`). The scan missed all three (recorded as
"no outside call"). They are folded into the playwright split row above rather than getting their
own gateway entries — each is a two-line wrapper around one `Page` method, with no failure handling
of its own to design around, and their real content (the `ContentText`/`AdapterResult` translation)
is the "our logic" half that stays in siegelense regardless.
