# Round 1 — [codeweaver] Codeweaver: build this slice — web: foundation

SUMMARY: This round lands the three web-package contracts every later web slice imports — the
`/api/health` route literal in `webConfigStatics`, the `sadRaccoonPixelsStatics` sprite, and the
`health-updated` arm on `webSocketChannelState` — plus the `/health` browser route itself, because
the `healthPagePath` property of `#web-health-routes` names `packages/web/src/flows/health/health-flow.tsx`
as its source and that file does not exist. The route cannot compile without an element, and this
repo's route elements are one-line responder aliases onto a widget, so the round also creates a
`HealthPageWidget` SHELL — the `HEALTH_PAGE` container and its title, nothing else. The
`web: health-detail-page` session that follows EXTENDS that same widget with the binding, the 7-row
table, the sad-raccoon error panel and RETRY; it does not create it.

Two design choices settled here rather than left to a worker. **First: the sad raccoon drops the
wizard hat.** `#sad-raccoon-is-pixel-statics` requires "a distinct downcast/drooping pose, not a
recolor", and the badge renders this sprite at scale 2 — 42x30 CSS px — where the pointed hat is the
single largest mass on the grid. Removing the hat and lowering the head is what makes ONLINE vs
OFFLINE legible at that size; a hat-plus-droop pose reads as the same silhouette in a 42px box. The
established raccoon look is preserved through the palette and the ringed tail, which are what
`#dd-failure-ux` is actually asking for. **Second: the pixel statics test does more than echo the
literal.** The repo's two existing pixel-statics tests are pure `toStrictEqual` echoes of their own
data, which cannot fail for any reason a reader cares about; this one keeps that echo for
consistency and adds derived invariants (grid bounds, cell uniqueness, palette drawn from the wizard
sprite, empty top rows) that actually pin the pose and the renderability.

## chunk 1 — the /api/health route literal in webConfigStatics
INTENT: `webConfigStatics.api.routes.health` exists and is the exact string `'/api/health'`, and the
whole-object assertion in the colocated test agrees with it.
FILES:
  - ./packages/web/src/statics/web-config/web-config-statics.ts
  - ./packages/web/src/statics/web-config/web-config-statics.test.ts
UNITS:
  - "#web-health-routes.health"
  - "#check-route-literals-pair"
MIRROR: ./packages/web/src/statics/web-config/web-config-statics.ts (the existing `rateLimits: '/api/rate-limits'` entry, which is the same shape: a flat key, one literal, no params)
WARD: npm run ward -- --only lint,typecheck,unit -- ./packages/web/src/statics/web-config/web-config-statics.ts ./packages/web/src/statics/web-config/web-config-statics.test.ts
NOTES:
  This chunk is shared foundation for BOTH flows of this quest. `#server-health-badge`
  ("Server Health Badge in App Header") — the user loads any page and the header tells them whether
  the server is alive; and `#health-detail-page` ("Health Detail Page") — the user opens `/health`
  and reads the full snapshot as a table. Both fetch the SAME endpoint, and every web broker in this
  repo names its URL as `webConfigStatics.api.routes.<key>`, so neither flow can issue its GET until
  this key exists. No broker is written in this round; the key is added ahead of its first consumer
  deliberately, so the badge slice and the page slice cannot each invent their own literal.

  The contract property this satisfies, verbatim from the quest:
    `health: ApiRoute = "/api/health"` — "New key in the flat webConfigStatics.api.routes map. Must
    be the identical literal to apiRoutesStatics.health.check — the repo's URL pairing convention.
    Note web-config-statics.test.ts asserts the whole exported object with one toStrictEqual, so it
    fails until updated."

  That last sentence is the whole trap in this chunk: `web-config-statics.test.ts` has exactly ONE
  `it`, and it asserts the ENTIRE exported object with `toStrictEqual`. `toStrictEqual` rejects
  extra keys, so the moment you add `health` to the statics the test goes red. Add the key in BOTH
  files in the same edit.

  Read the real server value before you write the literal — do not trust this note over the file:
  `packages/server/src/statics/api-routes/api-routes-statics.ts` declares `health: { check: ... }`
  and `packages/server/src/flows/health/health-flow.ts` mounts it as
  `app.get(apiRoutesStatics.health.check, async (c) => {...})`. On disk right now that literal is
  `'/api/health'`. Your web key must be byte-identical.

  Observable this chunk carries, verbatim:
    `#check-route-literals-pair`: "apiRoutesStatics.health.check and webConfigStatics.api.routes.health
    are the identical literal string '/api/health', so the page and the badge hit one route"
  A web unit test CANNOT import the server package (cross-package import rules forbid a web statics
  test reaching into `@dungeonmaster/server`), so what you assert here is the web half: the literal
  `'/api/health'` inside the existing whole-object `toStrictEqual`. Do not add a second `it` that
  re-asserts the same key in isolation — the whole-object assertion already covers it, and a
  duplicate is noise. The cross-package half of the pairing is verified downstream by the e2e walk.

  Placement: append `health: '/api/health'` at the END of the `routes` map, after
  `orchestrationMode`. `toStrictEqual` does not care about key order; appending keeps the diff to two
  added lines in each file.

## chunk 2 — sadRaccoonPixelsStatics, the drooping pose
INTENT: A new `sadRaccoonPixelsStatics` exists with the same 21x15 dimensions as the wizard raccoon
and a genuinely different, drooping pose in the same coordinate-string format, so
`PixelSpriteWidget` can render it with no widget change at all.
FILES:
  - ./packages/web/src/statics/sad-raccoon-pixels/sad-raccoon-pixels-statics.ts
  - ./packages/web/src/statics/sad-raccoon-pixels/sad-raccoon-pixels-statics.test.ts
UNITS:
  - "#sad-raccoon-pixels.dimensions"
  - "#sad-raccoon-pixels.pixels"
MIRROR: ./packages/web/src/statics/raccoon-wizard-pixels/raccoon-wizard-pixels-statics.ts
WARD: npm run ward -- --only lint,typecheck,unit -- ./packages/web/src/statics/sad-raccoon-pixels/sad-raccoon-pixels-statics.ts ./packages/web/src/statics/sad-raccoon-pixels/sad-raccoon-pixels-statics.test.ts
NOTES:
  Where this sits: this sprite is the OFFLINE/error face of both flows. In `#server-health-badge` it
  renders at scale 2 inside the header badge (`#badge-offline-sad-raccoon`); in `#health-detail-page`
  it renders at scale 8 in the full-page error panel (`#page-error-sad-raccoon`). Neither of those
  widgets is built in this round — this chunk produces ONLY the data.

  The contract properties, verbatim from the quest:
    `dimensions` — "Sprite grid size, matching raccoonWizardPixelsStatics so the two poses are
    interchangeable in a PixelSpriteWidget." with `width: PixelDimension = "21"` ("Same grid width as
    the existing wizard raccoon") and `height: PixelDimension = "15"` ("Same grid height as the
    existing wizard raccoon").
    `pixels` — "Readonly array of PixelCoordinate strings in the existing '<x> <y> <#hex>' format,
    e.g. '16 9 #e0e0e0'. A distinct downcast/drooping pose, not a recolor — PixelSpriteWidget consumes
    it unchanged, so no widget work follows from this."

  Design decision that constrains it, verbatim:
    `#sad-raccoon-is-pixel-statics`: "This repo contains zero .svg files. The raccoon is CSS
    box-shadow pixel art: raccoonWizardPixelsStatics holds a 21x15 array of '<x> <y> <#hex>'
    coordinate strings that PixelSpriteWidget turns into one box-shadow declaration. There is
    exactly one raccoon pose today and DumpsterRaccoonWidget has no mood or variant prop. So the sad
    raccoon is authored as a sibling statics array in the same 21x15 coordinate format and rendered
    through the existing PixelSpriteWidget, which needs no change."

  FILE SHAPE — copy the mirror exactly: a `PURPOSE`/`USAGE` header, then
  `export const sadRaccoonPixelsStatics = { dimensions: { width: 21, height: 15 }, pixels: [ ... ] } as const;`
  Plain string literals, no contract import (a `statics/` file may import only `statics/`). Consumers
  re-brand with `.map((p) => pixelCoordinateContract.parse(p))` — see
  `packages/web/src/widgets/dumpster-raccoon/dumpster-raccoon-widget.tsx` lines 32-34. Keep the
  `// === SECTION ===` comments the wizard file uses; they are how a human reads this data.

  THE POSE. Grid is x 0..20 left-to-right, y 0..14 top-to-bottom, raccoon facing RIGHT — same
  orientation as the wizard so the two are drop-in swaps. Author to this silhouette:
   - **Rows y 0..3 are EMPTY.** Nothing above y=4. The wizard's arched tail (y 0..7) and pointed hat
     (y 1..7) both live up there; their absence is what reads as "slumped" at badge scale. This is
     asserted, so it is not optional.
   - **Back / shoulders**, x ~5..13 at y 5..7, `#8a8a9a`, sloping DOWN toward the right — the wizard's
     back line rises toward the head; this one falls toward it.
   - **Ear**, one or two `#6a6a7a` pixels around x 13..14, y 6..7, hanging DOWN-right rather than
     pointing up.
   - **Head**, x ~14..20, y 6..11 — about three rows LOWER than the wizard's y 8..11 head, muzzle
     angled toward the floor. Mask band `#4a4a5a` across the eye row. The eye is ONE `#e0e0e0` pixel
     with a `#4a4a5a` lid pixel directly ABOVE it (half-closed, downcast) — contrast the wizard's
     open eye at `'16 9 #e0e0e0'` with `#4a4a5a` on BOTH sides. Snout `#c8c8d4`, nose `#1a1a2a` at
     the lowest-rightmost snout cell. Add one `#c8c8d4` tear pixel below the eye, clear of the snout.
   - **Body / belly**, x ~5..14 at y 6..11, `#8a8a9a` with a `#c8c8d4` belly band, sagging so the
     underside sits near the floor rather than lifted on legs.
   - **Tail hangs**, sweeping from the body's lower-left down to the floor — roughly x 1..5 across
     y 8..14. Keep the ringed stripes alternating `#4a4a5a` / `#c8c8d4` in 2-pixel bands: the rings
     are what still say "raccoon" once the hat is gone.
   - **Legs and paws**, y 12..14, legs `#8a8a9a`, paws `#5a5a6a`, splayed/slumped rather than
     standing square like the wizard's four-pixel stance.
   - **NO wizard hat.** No `#7b68ee`, no `#5b48ce`, no `#ffd700` anywhere. See this round's SUMMARY
     for why. Every colour you use must be one that already appears somewhere in
     `raccoonWizardPixelsStatics.pixels` — that is asserted, and it is what keeps this reading as the
     same animal.

  TESTS — `describe('sadRaccoonPixelsStatics')`, one `it` each, no hooks, no conditionals, no local
  named helper functions (`@dungeonmaster/forbid-non-exported-functions` blocks the edit; inline
  arrow callbacks inside `.map`/`.filter` are fine). Derive 21 and 15 from
  `sadRaccoonPixelsStatics.dimensions`, never as inline literals in the assertions:
   1. `VALID: exported value => matches expected shape` — the full literal `toStrictEqual` echo of
      dimensions + every pixel, exactly like `raccoon-wizard-pixels-statics.test.ts`. Repo
      convention; keep it.
   2. `VALID: {dimensions} => equal raccoonWizardPixelsStatics.dimensions so both poses are
      interchangeable in PixelSpriteWidget` — `toStrictEqual` against the wizard statics' own
      `dimensions`, imported. This is the `dimensions` contract property's actual requirement.
   3. `VALID: {every pixel} => matches the "<x> <y> #rrggbb" format PixelSpriteWidget splits on` —
      filter the entries that do NOT match `/^\d+ \d+ #[0-9a-fA-F]{6}$/u` and assert that filtered
      array `toStrictEqual([])`. Keep the regex identical to `pixelCoordinateContract`'s; the test
      cannot import the contract (a statics test importing `contracts/` trips the layer rules), so
      say so in a one-line comment.
   4. `EDGE: {every coordinate} => falls inside the 21x15 grid` — split each entry, filter any whose
      x >= `dimensions.width` or y >= `dimensions.height`, assert `toStrictEqual([])`. An
      out-of-grid pixel paints outside the sprite box and silently overlaps neighbouring UI.
   5. `EDGE: {no two entries} => paint the same cell` — build a `Set` of `"x y"` keys and assert its
      `size` `toBe(sadRaccoonPixelsStatics.pixels.length)`. Two entries on one cell means the later
      box-shadow wins and one colour is dead data.
   6. `VALID: {every colour} => also appears in raccoonWizardPixelsStatics, so the sad pose reuses the
      established raccoon palette` — filter the colours not present in the wizard's colour set,
      assert `toStrictEqual([])`.
   7. `VALID: {rows 0-3} => are empty, unlike the wizard's arched tail and pointed hat` — filter
      entries whose y < 4, assert `toStrictEqual([])`. This is the pose invariant; without it a
      recolor of the wizard passes every other test.
  Forbidden throughout: `toEqual`, `toMatchObject`, `toContain`, `toHaveLength`, `toBeDefined`,
  `.not.*`, `expect(...).includes(...)`.

## chunk 3 — the health-updated arm on webSocketChannelState
INTENT: An inbound `health-updated` frame reaches a new per-concern Subject and surfaces on a public
`healthChanged$()` getter emitting `undefined`; frames of any other type produce zero emissions on it.
FILES:
  - ./packages/web/src/state/web-socket-channel/web-socket-channel-state.ts
  - ./packages/web/src/state/web-socket-channel/web-socket-channel-state.test.ts
UNITS:
  - "#health-channel-subject.healthChangedSubject"
  - "#health-channel-subject.dispatchArm"
  - "#health-channel-subject.healthChanged"
  - "#check-tick-routed-to-subject"
  - "#check-unrelated-type-ignored"
MIRROR: ./packages/web/src/state/web-socket-channel/web-socket-channel-state.ts (the `rateLimitsChangedSubject` / `rate-limits-updated` arm / `rateLimitsChanged$` triple — copy all three positions)
WARD: npm run ward -- --only lint,typecheck,unit -- ./packages/web/src/state/web-socket-channel/web-socket-channel-state.ts ./packages/web/src/state/web-socket-channel/web-socket-channel-state.test.ts
NOTES:
  Where this sits: this is the web end of the live tick for BOTH flows. In `#server-health-badge` the
  node is `#ws-health-tick` — "Server broadcasts health-updated every 5000ms; web channel routes it";
  in `#health-detail-page` it is `#page-ws-tick`. The user sees a badge (or a table row) whose uptime
  advances on its own without a page reload. Everything downstream of this Subject — the binding that
  refetches, the badge, the table — belongs to later sessions. This chunk delivers the routing only.

  The contract properties, verbatim from the quest:
    `healthChangedSubject: SubjectAdapter` — "New per-concern Subject in the channel's internal
    registry, carrying undefined. Mirrors rateLimitsChangedSubject exactly."
    `dispatchArm: WsMessageTypeGuard = "health-updated"` — "New arm in dispatchInbound keyed on the
    frame's type literal. Without it the frame parses and is then silently dropped, which is the
    failure mode to watch for."
    `healthChanged: ChannelObservable` — "New public getter exposing the Subject's observable, so
    consumers subscribe by name and never see the event-type discriminator string. Mirrors
    rateLimitsChanged$."

  Design decision that constrains it, verbatim:
    `#tick-notifies-web-refetches`: "This mirrors rate-limits-updated exactly:
    webSocketChannelState.dispatchInbound calls rateLimitsChangedSubject.next(undefined) and discards
    the payload, and useRateLimitsBinding responds by re-running its broker. One code path produces
    the snapshot shape (the HTTP responder) instead of two, so the WS envelope and the HTTP body can
    never disagree."

  ALREADY BUILT UPSTREAM — read these off disk, do not guess:
   - `packages/shared/src/contracts/orchestration-event-type/orchestration-event-type-contract.ts`
     already carries `'health-updated'` as the LAST member of the enum. `wsMessageContract.type`
     validates against it, so the frame already parses today — and then falls off the end of
     `dispatchInbound` and is dropped. That silent drop is exactly the failure mode named above.
   - `packages/server/src/responders/server/init/server-init-responder.ts` already broadcasts it. Its
     own test pins the wire bytes: `{"type":"health-updated","payload":{},"timestamp":"..."}`. Your
     test frames must be that shape.

  THREE EDITS, all mirroring `rateLimitsChangedSubject`:
   1. Add `healthChangedSubject: SubjectAdapter<undefined>;` to the `internalState` type literal and
      `healthChangedSubject: rxjsSubjectAdapter<undefined>(),` to its initializer. Put it adjacent to
      `rateLimitsChangedSubject` in both places.
   2. Add the arm in `dispatchInbound`. Note the file's existing shape: every arm except the LAST one
      ends in `return;`, and the last (`dispatch-state-changed`) does not. Add yours as a full
      `if (envelope.data.type === 'health-updated') { internalState.healthChangedSubject.next(undefined); return; }`
      block BEFORE the `dispatch-state-changed` arm so that trailing shape stays intact.
   3. Add `healthChanged$: (): ChannelObservable<undefined> => internalState.healthChangedSubject.observable,`
      next to `rateLimitsChanged$`.
  Do not read `envelope.data.payload` — the arm discards it, per `#tick-notifies-web-refetches`.

  TESTS — add to the existing `web-socket-channel-state.test.ts`, in the same describe block that
  holds the `rate-limits-updated` case (around line 273); copy its exact shape
  (`const proxy = webSocketChannelStateProxy(); proxy.setupEmpty(); proxy.connect();
  proxy.triggerOpen();` then subscribe, then `proxy.deliverMessage({ data: JSON.stringify({...}) })`,
  then `sub.unsubscribe()`). Collect emissions into an array and assert the ARRAY, not a boolean flag
  — the existing cases use `let emitted = false`, which cannot distinguish one emission from five, and
  two of your three cases turn on exactly that:
   1. `VALID: {health-updated ws message} => healthChanged$ emits undefined exactly once` — deliver
      `{type:'health-updated', payload:{}, timestamp:'2025-01-01T00:00:00.000Z'}`; assert the
      collected emissions `toStrictEqual([undefined])`.
      Observable, verbatim: `#check-tick-routed-to-subject` — "webSocketChannelState routes an inbound
      'health-updated' frame to its health-changed Subject, which emits undefined — the frame payload
      is discarded, not read"
   2. `VALID: {health-updated ws message with a non-empty payload} => healthChanged$ still emits only
      undefined` — deliver the same frame with e.g. `payload: { uptimeSeconds: 99 }`; assert
      `toStrictEqual([undefined])`. This is the half of the observable that proves the payload is
      DISCARDED rather than forwarded; case 1 alone passes on an implementation that forwards it.
   3. `EMPTY: {rate-limits-updated ws message} => healthChanged$ emits nothing` — subscribe to
      `healthChanged$()`, deliver a `rate-limits-updated` frame, assert the collected emissions
      `toStrictEqual([])`.
      Observable, verbatim: `#check-unrelated-type-ignored` — "An inbound frame with type
      'rate-limits-updated' produces zero emissions on the health-changed Subject"
  Do not touch `web-socket-channel-state.proxy.ts`; it already exposes everything these tests need.

## chunk 4 — HealthPageWidget, the /health page shell
INTENT: A `HealthPageWidget` renders a `HEALTH_PAGE` container with a `SERVER HEALTH` title, so the
`/health` route has an element to mount and a later session has a file to extend.
FILES:
  - ./packages/web/src/widgets/health-page/health-page-widget.tsx
  - ./packages/web/src/widgets/health-page/health-page-widget.proxy.tsx
  - ./packages/web/src/widgets/health-page/health-page-widget.test.tsx
MIRROR: ./packages/web/src/widgets/queue-page/queue-page-widget.tsx (the other full-page widget mounted straight off a route; copy its Stack + title-Text structure, its module-level layout constants, and its `emberDepthsThemeStatics` colour reads)
UNITS:
  - "#check-health-route-mounts"
WARD: npm run ward -- --only lint,typecheck,unit -- ./packages/web/src/widgets/health-page/health-page-widget.tsx ./packages/web/src/widgets/health-page/health-page-widget.proxy.tsx ./packages/web/src/widgets/health-page/health-page-widget.test.tsx
NOTES:
  Where this sits: `#health-detail-page` ("Health Detail Page"), entry node `#health-route-renders` —
  "the /health route mounts the health page". The user clicks the header badge (or types the URL) and
  lands on a page that will eventually show the full server snapshot as a labelled table.

  THIS CHUNK BUILDS THE SHELL ONLY, AND THAT IS DELIBERATE. Everything else on that flow —
  `useHealthBinding`, `HEALTH_PAGE_TABLE` and its seven `HEALTH_PAGE_ROW_*` rows, `HEALTH_PAGE_ERROR`,
  `HEALTH_PAGE_SAD_RACCOON`, `HEALTH_PAGE_RETRY` — belongs to the `web: health-detail-page` operation
  item that runs after this one. That session EXTENDS this same file; it does not create a second one.
  Do not stub a table, do not stub an error panel, do not add a binding. A placeholder table would be
  something the next session has to delete before it can build the real one.

  The one observable this shell makes true, verbatim:
    `#check-health-route-mounts`: "Navigating to /health renders an element with data-testid
    HEALTH_PAGE inside APP_MAP_CONTAINER"
  The `inside APP_MAP_CONTAINER` half is chunk 6's business (the route mounts under `AppLayoutResponder`
  → `AppWidget`, whose `APP_MAP_CONTAINER` wraps the `<Outlet/>`); this chunk owns the `HEALTH_PAGE`
  element itself.

  IMPLEMENTATION — copy `QueuePageWidget`'s frame and strip it to two elements:
   - a Mantine `<Stack gap="md" data-testid="HEALTH_PAGE">` with `padding`, `color: colors.text` and
     `fontFamily: 'monospace'` from `emberDepthsThemeStatics`;
   - inside it a `<Text ... data-testid="HEALTH_PAGE_TITLE">SERVER HEALTH</Text>`, matching
     `QUEUE_PAGE_TITLE`'s `size="md" ff="monospace" fw={700} c={colors['loot-gold']}`.
  Declare the padding / font-size numbers as module-level `const`s like `QueuePageWidget` does —
  inline numeric literals in the style object trip the magic-number rule. No props: the widget takes
  none in this round. Explicit return type `React.JSX.Element`. Write `PURPOSE` LAST, after the body,
  and make it say why this file exists and when to reach for it over `QueuePageWidget` — not what it
  returns.

  PROXY — mirror `./packages/web/src/widgets/logo/logo-widget.proxy.tsx`, which is the right shape
  for a widget with no binding: no `registerMock`, just semantic `screen.queryByTestId` reads. Expose
  `hasHealthPage()` and `getTitleText()`. Give it an explicit return type; do not return `{}`.

  TESTS — `mantineRenderAdapter({ ui: <HealthPageWidget /> })`, fresh proxy created BEFORE the render
  in every test, no `MemoryRouter` (this widget renders no `Link`):
   1. `VALID: {} => renders the HEALTH_PAGE container` — `expect(proxy.hasHealthPage()).toBe(true)`
   2. `VALID: {} => renders the title text 'SERVER HEALTH'` —
      `expect(proxy.getTitleText()).toBe('SERVER HEALTH')`
   3. `VALID: {} => renders the container in monospace` — read
      `screen.getByTestId('HEALTH_PAGE').style.fontFamily` and `.toBe('monospace')`. The same
      style-property read that `logo-widget.test.tsx` uses for `LOGO_ASCII`.

## chunk 5 — AppHealthResponder, the route element
INTENT: `AppHealthResponder` exists as the route element for `/health`, aliasing `HealthPageWidget`.
FILES:
  - ./packages/web/src/responders/app/health/app-health-responder.ts
  - ./packages/web/src/responders/app/health/app-health-responder.proxy.ts
  - ./packages/web/src/responders/app/health/app-health-responder.test.ts
UNITS:
  - "#web-health-routes.healthPagePath"
MIRROR: ./packages/web/src/responders/app/queue/app-queue-responder.ts (plus its `.proxy.ts` and `.test.ts` — all three are three-to-twelve lines; copy them line for line)
WARD: npm run ward -- --only lint,typecheck,unit -- ./packages/web/src/responders/app/health/app-health-responder.ts ./packages/web/src/responders/app/health/app-health-responder.proxy.ts ./packages/web/src/responders/app/health/app-health-responder.test.ts
NOTES:
  Where this sits: still `#health-detail-page`, node `#health-route-renders`. This is the seam between
  the flow file (chunk 6) and the widget (chunk 4): in this repo a page route element is a one-line
  responder alias, never a widget imported straight into the flow. Follow that.

  The whole implementation is `export const AppHealthResponder = HealthPageWidget;` under a
  `PURPOSE`/`USAGE` header — read `app-queue-responder.ts` and match it exactly, including the `.ts`
  (not `.tsx`) extension, which is what the queue and home responders use because the file contains
  no JSX.

  The proxy delegates: `export const AppHealthResponderProxy = (): ReturnType<typeof HealthPageWidgetProxy> => HealthPageWidgetProxy();`
  — the exact shape of `app-queue-responder.proxy.ts`. The test is the three-line export check from
  `app-queue-responder.test.ts` (`AppHealthResponderProxy(); expect(AppHealthResponder).toStrictEqual(expect.any(Function));`).
  That test is thin on purpose and it is the repo's own standard for this file type — the alias has
  no behaviour of its own; chunk 6's integration test is what proves the route actually renders it.

  Depends on chunk 4: `HealthPageWidget` and `HealthPageWidgetProxy` must already exist on disk. Read
  their real export names from the files rather than assuming them.

## chunk 6 — the /health route, declared and wired into AppFlow
INTENT: `/health` is a real browser route: `HealthFlow` declares it, `AppFlow` composes it alongside
`HomeFlow` and `QueueFlow`, and an integration test proves the path literal mounts `HEALTH_PAGE` and
that a different path does not.
FILES:
  - ./packages/web/src/flows/health/health-flow.tsx
  - ./packages/web/src/flows/health/health-flow.integration.test.tsx
  - ./packages/web/src/flows/app/app-flow.tsx
UNITS:
  - "#web-health-routes.healthPagePath"
  - "#check-health-route-mounts"
  - "#check-health-route-not-notfound"
MIRROR: ./packages/web/src/flows/queue/queue-flow.tsx (a single static-path Route onto a responder — the closest existing sibling; `/health` is a static single-segment path exactly like `/queue`)
WARD: npm run ward -- --only lint,typecheck,unit,integration -- ./packages/web/src/flows/health/health-flow.tsx ./packages/web/src/flows/health/health-flow.integration.test.tsx ./packages/web/src/flows/app/app-flow.tsx
NOTES:
  Where this sits: `#health-detail-page` ("Health Detail Page"), entry `/health`, node
  `#health-route-renders`. It is also the exit of `#server-health-badge` — `#navigate-to-health-page`,
  "Badge click routes to /health". Until this route exists, `/health` matches nothing in the route
  tree and the badge's link goes to a blank page; every later web session on this quest depends on it.

  The contract property, verbatim from the quest:
    `healthPagePath: RoutePath = "/health"` — "The browser route for the detail page, declared as a
    react-router Route in the web flows layer and called from AppFlow alongside HomeFlow and
    QueueFlow. Lives in the flow file rather than the statics file, which is why it carries its own
    source."
  That sentence is why this chunk exists and why the path literal is written in the flow file rather
  than added to `webConfigStatics` — `webConfigStatics.api.routes` holds API URLs, not browser routes,
  and chunk 1's `health` key is the API one. Do not add `/health` to the statics file.

  IMPLEMENTATION — two files, both tiny:
   - `health-flow.tsx`: `export const HealthFlow = (): React.JSX.Element => (<Route path="/health" element={<AppHealthResponder />} />);`
     with the `PURPOSE`/`USAGE` header, importing `Route` from `react-router-dom` and
     `AppHealthResponder` from `../../responders/app/health/app-health-responder`. Byte-for-byte the
     shape of `queue-flow.tsx`.
   - `app-flow.tsx`: add the import and call `{HealthFlow()}` inside the layout `<Route>`, next to
     `{QueueFlow()}`. Keep imports alphabetically ordered the way the file already has them
     (`AppLayoutResponder`, `HomeFlow`, `QuestChatFlow`, `QueueFlow`, `SessionViewFlow`) — `HealthFlow`
     sorts before `HomeFlow`. Update the file's `USAGE` comment, which currently enumerates the child
     flows by name; leaving it enumerating four of five is a present-tense-documentation violation.

  `app-flow.integration.test.tsx` is NOT in this chunk's FILES and needs no edit — it only asserts
  `AppFlow` is a function, which stays true.

  TESTS — `health-flow.integration.test.tsx`. The mirror (`queue-flow.integration.test.tsx`) only
  asserts the export is a function; that is not enough here, because the thing this chunk actually
  delivers is a PATH LITERAL, and an export-is-a-function check passes with the path spelled wrong.
  Render the route for real, using the established pattern from
  `./packages/web/src/widgets/quest-chat/quest-chat-widget.test.tsx` (lines 15-25):
  `mantineRenderAdapter({ ui: (<MemoryRouter initialEntries={['/health']}><Routes>{HealthFlow()}</Routes></MemoryRouter>) })`.
  `HealthFlow()` returns a `<Route>` element, which is a legal child of `<Routes>`.
   1. `VALID: {pathname /health} => mounts the HEALTH_PAGE element` — assert
      `screen.queryByTestId('HEALTH_PAGE') !== null` `.toBe(true)`.
      Observable, verbatim: `#check-health-route-mounts` — "Navigating to /health renders an element
      with data-testid HEALTH_PAGE inside APP_MAP_CONTAINER"
   2. `EDGE: {pathname /queue} => does not mount HEALTH_PAGE` — same render with
      `initialEntries={['/queue']}`, assert `screen.queryByTestId('HEALTH_PAGE') === null` `.toBe(true)`.
      This is what pins the literal: a route declared as `/heath` or `/api/health` fails case 1, and a
      route declared as `*` fails case 2.
      Related observable, verbatim: `#check-health-route-not-notfound` — "Navigating to /health does
      not render the not-found surface that an unrecognised path renders". The NOT_FOUND surface in
      this repo is produced by `QuestChatWidget` under `/:guildSlug/quest`, not by a catch-all route,
      so below the browser the meaningful assertion is the pair above: `/health` now matches a real
      route instead of matching nothing. The browser-level half is the groundstomper's e2e.
   3. `VALID: {} => exports HealthFlow function` — keep the mirror's export check as a third case; it
      is cheap and it is what the sibling flow tests all carry.
  No hooks, no conditionals, fresh render per test.
