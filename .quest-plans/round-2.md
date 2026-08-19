# Round 2 — [codeweaver] Codeweaver: build this slice — web: health-detail-page

SUMMARY: Round 1's chunks 1-8 are accepted and untouched here. The only open scope is round 1's chunk 9:
nothing in the repo proves `/health` is reachable through the ACTUAL composed route tree
(`AppFlow` -> `AppLayoutResponder` -> `HealthFlow` -> `AppHealthResponder` -> `HealthPageWidget`), so
`check-health-route-mounts` and `check-health-route-not-notfound` have no test, and deleting `{HealthFlow()}`
from `app-flow.tsx` is caught by nothing. This round closes that with the reviewer's **option [ii]**: a
`packages/web/test/harnesses/` harness that mounts the real `AppFlow` in jsdom, consumed from the existing
`packages/web/src/flows/app/app-flow.integration.test.tsx`. One chunk, two files.

**Why [ii] and not [i] or [iii], decided by reading the rules at source rather than by preference.** Option
[i] (open `flows/` integration tests up in `packages/eslint-plugin` + `packages/shared`) means adding
`@testing-library/react` and `adapters/` to `folderConfigStatics.flows.allowedImports` — a list that is NOT
test-scoped, so it would let every package's PRODUCTION flow file import adapters — plus extending
`enforce-test-creation-of-proxy`'s `/startup/` exemption to `flows/`, which re-opens mocking inside
integration tests monorepo-wide. Those are architecture decisions with repo-wide blast radius, taken to
solve a problem the harness pattern already solves. Option [iii] (restate the two units as browser
observables for groundstomper `#048f352a`) is a legitimate escape, but the discipline's bar for restating an
observable is "impossible against the real system, or reachable only by damaging the design" — and it is
neither, so restating here would be a retreat taken to avoid work. **No `modify-quest` call is made this
round; both observables stand exactly as written.**

**The three blockers round 1 hit do not apply to a harness, verified at source:** (a)
`rule-enforce-import-dependencies-broker.ts:58-62` computes the importing file's folder type with
`folderTypeTransformer`, which returns `null` for any path not under `src/<folderType>/` — so a
`test/harnesses/**` file has NO import restrictions at all; (b) the same rule at lines 92-96 resolves a
RELATIVE import's folder type the same way and returns early on `null`, so a `flows/` integration test may
import that harness; (c) no new filename goes through `validate-filename-layer-broker`'s multi-dot path —
the harness is a plain `.harness.ts` (44 already exist) and the integration test file already exists on
disk. The pattern has 15+ in-repo precedents, the closest being
`packages/server/src/flows/health/health-flow.integration.test.ts:3,10` importing
`packages/server/test/harnesses/server-app/server-app.harness.ts`.

**No spike was run, deliberately.** `spike-tmp/` is gitignored and sits outside both `packages/web/tsconfig.json`'s
`include` and `jest.config.cjs`'s `roots`/`testMatch`, so neither ESLint nor Jest would look at it — and
lint reachability plus Jest collection are the only two things this chunk is uncertain about. Everything a
spike could have told me was settled by reading the rule sources listed above; the two residual unknowns
(does an unrecognised path render anything, and does the shell issue a fourth GET) are named in the chunk's
NOTES with the exact way to find out in one run.

## chunk 1 — mount the REAL AppFlow at /health and prove it is not the unrecognised-path surface

INTENT: A Jest integration test drives the real composed route tree — `AppFlow` -> `AppLayoutResponder` ->
`HealthFlow` -> `AppHealthResponder` -> `HealthPageWidget` — with NO hand-written route table, and proves
two things about it: at `/health` a `HEALTH_PAGE` element exists INSIDE `APP_MAP_CONTAINER`, and at an
unrecognised path the tree renders the not-found surface (neither `APP_MAP_CONTAINER` nor `HEALTH_PAGE`).
Deleting `{HealthFlow()}` from `packages/web/src/flows/app/app-flow.tsx` must turn the run RED — witness
that red before committing, and say in the commit body what the failure output was.

FILES:
  - ./packages/web/test/harnesses/app-route-tree/app-route-tree.harness.ts
  - ./packages/web/src/flows/app/app-flow.integration.test.tsx

UNITS:
  - check-health-route-mounts
  - check-health-route-not-notfound

MIRROR: ./packages/server/test/harnesses/server-app/server-app.harness.ts (harness shape: file header,
exported `xHarness` factory with a fully-annotated return-object type, methods declared as consts above a
single `return {...}`) and ./packages/web/src/widgets/app/app-widget.test.tsx:29-49 (the `renderApp` helper
— the exact `mantineRenderAdapter({ ui: <MemoryRouter initialEntries={[path]}>...</MemoryRouter> })` mount
shape this harness replaces with the real `AppFlow`).

WARD: npm run ward -- --only lint,typecheck,integration -- ./packages/web/test/harnesses/app-route-tree/app-route-tree.harness.ts ./packages/web/src/flows/app/app-flow.integration.test.tsx

NOTES:

**The flow, and where this chunk sits in it.** Flow `#health-detail-page`, "Health Detail Page". Entry point
`/health`. A user lands on `/health` — from the header badge or by typing the URL — and gets the full server
health snapshot as a labelled table that stays live off the server's `health-updated` tick, with a
sad-raccoon error panel and a RETRY control when the fetch or the socket fails. This chunk implements the
flow's FIRST node, `#health-route-renders` ("/health route mounts the health page", a state node). Every
other node of this flow was built and accepted in round 1 — the binding, the table, the error panel, the
retry, the tick, the socket-close branch. What is missing is only the proof that the route is actually
composed into the shipped route tree, which is what `#health-route-renders` asserts.

**The two observables this chunk must satisfy, VERBATIM from the quest:**
  - `check-health-route-mounts` [ui-state]: "Navigating to /health renders an element with data-testid
    HEALTH_PAGE inside APP_MAP_CONTAINER"
  - `check-health-route-not-notfound` [ui-state]: "Navigating to /health does not render the not-found
    surface that an unrecognised path renders"

Read them literally. "inside APP_MAP_CONTAINER" is a CONTAINMENT claim, not two independent presence
checks — use `within(screen.getByTestId('APP_MAP_CONTAINER')).queryByTestId('HEALTH_PAGE')`
(`within` is imported from `@testing-library/react`; see
`packages/web/src/widgets/dispatch-toggle/dispatch-toggle-widget.proxy.tsx:10` for precedent). And the second
observable is a CONTRAST: it only means something if the same run also renders an unrecognised path and reads
what that produces. Assert both readings as ONE `toStrictEqual` on an object per path, so the pair reads as a
contrast rather than as four loose booleans.

**Why round 1's chunk 9 could not do this, and why this shape can.** Round 1 tried to render the tree from
inside `packages/web/src/flows/health/`, and was blocked three ways. All three are avoided by moving the
rendering into a harness, because the folder rules key on `src/<folderType>/` and a harness is not under it:

  - `packages/eslint-plugin/src/brokers/rule/enforce-import-dependencies/rule-enforce-import-dependencies-broker.ts:58-62`
    — `folderTypeTransformer({filename})` returns `null` for a path not under `src/<folderType>/`, and the
    rule returns immediately on `null`. So the harness file itself is subject to NO import restrictions: it
    may import `@testing-library/react`, `@dungeonmaster/testing`, `react-router-dom`, `src/adapters/**`,
    `src/flows/**`, anything.
  - Same file, lines 87-96 — for a RELATIVE import the rule resolves the target path and runs
    `folderTypeTransformer` on it; `test/harnesses/**` yields `null`, so it returns before any allowlist
    check. That is why `app-flow.integration.test.tsx` (a `flows/` file, whose `allowedImports` in
    `packages/shared/src/statics/folder-config/folder-config-statics.ts:124-137` carries neither
    `@testing-library/react` nor `adapters/`) may still import this harness.
  - `packages/eslint-plugin/src/brokers/rule/enforce-test-creation-of-proxy/rule-enforce-test-creation-of-proxy-broker.ts:92-98`
    bans `.proxy` imports in an integration test. The harness is not a proxy, so nothing is violated —
    but it also means the harness cannot lean on the existing widget proxies and must stage MSW itself
    (see below).

**Rules the HARNESS file must satisfy** (`rule-enforce-harness-patterns-broker.ts`, which fires on any
`*.harness.ts`):
  - Export exactly `export const appRouteTreeHarness = (): { ... } => { ... return { ... }; };` — a factory
    whose name ends in `Harness` and whose body has a `return` of an OBJECT LITERAL. An arrow returning
    anything else is reported.
  - It must NOT import any `.proxy` file, and must NOT value-import a path ending in `-contract` (a
    `import type` of one is fine). `@dungeonmaster/shared/contracts` does not end in `-contract`, so
    importing `HealthSnapshotStub` from it as a VALUE is allowed — and is how the harness should build its
    snapshot fixture.
  - `validate-harness-constructor-side-effects-layer-broker.ts` allows only lifecycle-hook calls and child
    `*Harness()` calls in the factory body BEFORE the `return`. **Every `StartEndpointMock.listen(...)` call
    must therefore live inside a returned METHOD, never in the factory body.** That is also correct
    behaviourally: `packages/testing/src/startup/start-endpoint-mock-setup.ts:20-23` calls
    `lifecycle.resetHandlers()` in a global `afterEach`, so handlers registered outside an `it` are wiped
    before the test that needs them runs.
  - Give it a `PURPOSE:` / `USAGE:` header like every other harness (`enforce-file-metadata`). Write PURPOSE
    LAST, after the body exists.

**Rules the TEST file must satisfy** (it is `*.integration.test.tsx`, so
`rule-enforce-test-creation-of-proxy-broker.ts` takes its integration branch):
  - No `.proxy` imports.
  - The `appRouteTreeHarness()` call must sit at DESCRIBE scope — not module scope, not inside an `it`
    (lines 159-185 report `harnessMustBeInDescribe` for both). `const harness = appRouteTreeHarness();`
    directly inside the top `describe`, exactly as
    `packages/server/src/flows/health/health-flow.integration.test.ts:10` does.
  - Standard test law still applies: `VALID:`/`EDGE:` name prefixes, no `beforeEach`/`afterEach`, no
    conditionals, `toStrictEqual` only, no `.toBeDefined()`/`.toBeTruthy()`/`.not.*`.
  - **Do not delete the file's existing `describe('export')` block** — it is another session's committed
    work. Add the new describes alongside it.

**The already-built exports this wires into, read off disk — do not guess these:**
  - `AppFlow` — `packages/web/src/flows/app/app-flow.tsx:18`, `(): React.JSX.Element`, renders
    `<Routes><Route element={<AppLayoutResponder />}>{HealthFlow()}{HomeFlow()}{QueueFlow()}{QuestChatFlow()}{SessionViewFlow()}</Route></Routes>`.
    The harness renders `<MemoryRouter initialEntries={[path]}><AppFlow /></MemoryRouter>` and NOTHING else —
    if the harness declares any `<Route>` of its own, the whole chunk is worthless.
  - `mantineRenderAdapter` — `packages/web/src/adapters/mantine/render/mantine-render-adapter.ts:12`,
    `({ ui }: { ui: React.ReactElement }): RenderResult`. Required, not optional: the shell mounts Mantine
    components (`QuestQueueBarWidget`, `HealthPageWidget`'s `Stack`/`Text`) which need a `MantineProvider`.
  - `StartEndpointMock` — `import { StartEndpointMock } from '@dungeonmaster/testing'`;
    `StartEndpointMock.listen({ method: 'get', url })` returns a control with `.resolves({ data })`. Live
    precedent for exactly this staging outside a proxy:
    `packages/web/src/widgets/app/app-widget.integration.test.tsx:18-28`.
  - `webConfigStatics.api.routes` — `packages/web/src/statics/web-config/web-config-statics.ts:11-46`; the
    keys needed are `questsQueue` (`/api/quests/queue`), `rateLimits` (`/api/rate-limits`) and `health`
    (`/api/health`). Use the statics, never the literal.
  - `HealthSnapshotStub` from `@dungeonmaster/shared/contracts` — used as-is in
    `packages/web/src/widgets/app/app-widget.test.tsx:8`.
  - Testids, all already rendered: `APP_MAP_CONTAINER` (`packages/web/src/widgets/app/app-widget.tsx:95`),
    `HEALTH_PAGE` (`packages/web/src/widgets/health-page/health-page-widget.tsx:35`).

**Exactly which HTTP calls the shell makes at `/health`, and why.** MSW runs with
`onUnhandledRequest: 'error'`, so an unstaged request throws and the test fails with the offending URL
named. Stage these three, no more:
  1. `webConfigStatics.api.routes.questsQueue` -> `{ data: { entries: [] } }` — `QuestQueueBarWidget` ->
     `useQuestQueueBinding` fetches on mount.
  2. `webConfigStatics.api.routes.rateLimits` -> `{ data: { snapshot: null } }` — `RateLimitsStackWidget` ->
     `useRateLimitsBinding` fetches on mount.
  3. `webConfigStatics.api.routes.health` -> `{ data: HealthSnapshotStub() }` — `HealthPageWidget` ->
     `useHealthBinding` (`packages/web/src/bindings/use-health/use-health-binding.ts:56-59`) fetches on mount.

  There is deliberately NO handler for `/api/orchestration/dispatch`: `DispatchToggleWidget` is a child of
  `QuestQueueBarWidget`, and `packages/web/src/widgets/quest-queue-bar/quest-queue-bar-widget.tsx:30-32`
  returns `null` when the queue is empty — so with `{entries: []}` the toggle never mounts and never fetches.
  `ServerHealthBadgeWidget` is likewise suppressed at `/health` by
  `packages/web/src/widgets/app/app-widget.tsx:76` (`isHealthRoute ? null : <ServerHealthBadgeWidget />`), so
  it issues nothing either. **If the run reports a fourth unhandled request, the honest fix is to stage it
  in the harness and say so in the commit body — do NOT switch MSW to a permissive mode.**

  `webSocketChannelState` is never connected here. The bindings subscribe to its observables, which simply
  never emit; that is the same state `app-widget.test.tsx` runs in today. Do not connect a socket — the tick
  behaviour is already covered by round 1's `health-page-widget.test.tsx`.

  `HEALTH_PAGE` renders unconditionally, above the loading/table/error branch
  (`health-page-widget.tsx:32-41`), so the containment assertion does not depend on the health fetch
  resolving. Stage it anyway — MSW would throw on the unhandled request otherwise.

**The unrecognised path — the one thing to VERIFY rather than assume.** `AppFlow` has no catch-all: none of
`home-flow.tsx` (`path="/"`), `queue-flow.tsx` (`/queue`), `quest-chat-flow.tsx` (`/:guildSlug/quest`,
`/:guildSlug/quest/:questId`), `session-view-flow.tsx` (`/:guildSlug/session/:sessionId`) or `health-flow.tsx`
(`/health`) declares `path="*"`. So a ONE-SEGMENT unknown path should match nothing, the pathless layout
branch should therefore not match either, and `<Routes>` should render nothing at all — meaning the
not-found surface is the ABSENCE of `APP_MAP_CONTAINER`. **Use a single-segment path** (`/not-a-real-route`);
a two-segment path such as `/foo/quest` WOULD match `QuestChatFlow` and prove nothing. Render that path
FIRST, read the DOM, and write the assertion against what you actually observe. If something does render
there, assert against that real surface instead and note the correction in the commit body — the observable
says "the not-found surface that an unrecognised path renders", whatever that turns out to be.

**Design decisions from the quest that constrain this chunk**, quoted:
  - `#badge-hidden-on-health-route`: "The badge lives in the app shell, so without this it would mount on
    /health alongside the page and both bindings would independently fetch GET /api/health on mount and on
    every tick — 2 requests per tick." This is why the harness stages only one `/api/health` listener and
    why no badge testid appears in these assertions.
  - `#dd-double-fetch`: "The page already shows everything the badge shows, so suppress the badge on that one
    route."

**Suggested harness surface** (adjust if the test reads better another way — you own both files, so keep
them in step): `mountAt({ path }: { path: string }): void` doing the three `StartEndpointMock.listen` calls
and then the `mantineRenderAdapter` mount; `hasMapContainer(): boolean`; `hasHealthPageInsideMapContainer():
boolean`; `hasHealthPageAnywhere(): boolean`. Raw `string` params are fine in a harness — `eslint.config.js`
puts `**/*.harness.ts` in the relaxed test block, and `serverAppHarness` takes bare-string params throughout.

**Infrastructure that is already in place — no config edits needed, and none are authorised here:**
`packages/web/jest.config.cjs:18` already has `roots: ['<rootDir>/src', '<rootDir>/test']`; line 22 already
loads `start-endpoint-mock-setup.js`; line 30's `testMatch` deliberately excludes `*.harness.ts` so Jest
never collects the harness as a suite; `packages/web/tsconfig.json:14` already includes `test/**/*`.

**If a rule you have not been warned about here blocks the edit**, do not improvise around it and do not fall
back to another `matchPath` assertion — the reviewer ruled that out explicitly. Report `rework` naming the
rule file and line and the exact message, so round 3 can choose the reviewer's option [i] (tooling change in
`packages/eslint-plugin` + `packages/shared`) or option [iii] (restate both observables onto the pending
groundstomper item `#048f352a`) with real evidence rather than a guess.
