# Startup Split Plan: packages/web

## Current State

### `startup/start-app.ts` violations:
1. **Branching**: `if (!rootElement)` and `if (NODE_ENV !== 'test')` — banned in startup
2. **Disallowed imports**: `react`, `react-dom/client`, `react-router-dom`, `@mantine/core`, `@mantine/notifications`

### `widgets/app/app-widget.tsx` violations:
- Contains `<Routes>` / `<Route>` definitions — routing belongs in flows, not widgets

## Design

### Component Tree (after split)

```
reactDomMountAdapter (DOM mount via react-dom/client)
  └─ AppRootWidget (BrowserRouter > MantineProvider > Notifications > dark div)
       └─ [route tree from AppFlow]
            └─ <Routes>
                 └─ <Route element={AppLayoutResponder}> (layout shell + <Outlet />)
                      ├─ HomeFlow → <Route path="/" element={AppHomeResponder}>
                      ├─ QuestChatFlow → <Route path="/:guildSlug/session" ...>
                      ├─                  <Route path="/:guildSlug/session/:sessionId" ...>
                      ├─                  <Route path="/:guildSlug/quest" ...>
                      └─                  <Route path="/:guildSlug/quest/:sessionId" ...>
```

### Call Chain

```
main.ts (Vite entry) → StartApp()
  startup/start-app.ts → AppMountFlow()
    flows/app-mount/app-mount-flow.ts → AppMountResponder({ content: AppFlow() })
      responders/app/mount/app-mount-responder.ts → reactDomMountAdapter({ Wrapper: AppRootWidget, content })

AppFlow (composed from child flows):
  flows/app/app-flow.tsx → <Routes> + <Route element={AppLayoutResponder}> + HomeFlow() + QuestChatFlow()
    flows/home/home-flow.tsx → <Route path="/" element={AppHomeResponder} />
    flows/quest-chat/quest-chat-flow.tsx → <Route path="/:guildSlug/..." element={AppQuestChatResponder} />
```

### Layer Responsibilities

| Layer | File | Responsibility |
|-------|------|----------------|
| **Entry** | `src/main.ts` | Vite entry point, calls `StartApp()` |
| **Startup** | `startup/start-app.ts` | Thin delegate → calls `AppMountFlow()` |
| **Flow** | `flows/app-mount/app-mount-flow.ts` | Passes `AppFlow` route tree to mount responder |
| **Flow** | `flows/app/app-flow.tsx` | Parent flow: composes `<Routes>` from child flows with layout |
| **Flow** | `flows/home/home-flow.tsx` | Child flow: `<Route path="/" ...>` → `AppHomeResponder` |
| **Flow** | `flows/quest-chat/quest-chat-flow.tsx` | Child flow: `<Route path="/:guildSlug/..." ...>` → `AppQuestChatResponder` |
| **Responder** | `responders/app/mount/app-mount-responder.ts` | Calls react-dom adapter with AppRootWidget wrapper + route content |
| **Responder** | `responders/app/layout/app-layout-responder.ts` | Re-exports AppWidget (layout shell with `<Outlet />`) |
| **Responder** | `responders/app/home/app-home-responder.ts` | Re-exports HomeContentLayerWidget |
| **Responder** | `responders/app/quest-chat/app-quest-chat-responder.ts` | Re-exports QuestChatWidget |
| **Widget** | `widgets/app-root/app-root-widget.tsx` | Provider tree: BrowserRouter + MantineProvider + Notifications + dark div |
| **Widget** | `widgets/app/app-widget.tsx` | Layout shell: spacers, logo, map frame, `<Outlet />` (routes removed) |
| **Adapter** | `adapters/react-dom/mount/react-dom-mount-adapter.tsx` | Wraps `react-dom/client`: gets root element, renders `<Wrapper>{content}</Wrapper>` |
| **Adapter** | `adapters/mantine/notifications/mantine-notifications-adapter.tsx` | Wraps `@mantine/notifications`: exports Notifications component + CSS |

### Key Design Decisions

**Per-domain child flows.** Each route group gets its own flow: `HomeFlow` owns `/`, `QuestChatFlow` owns `/:guildSlug/*`. The parent `AppFlow` composes them inside `<Routes>` with a shared layout route. This follows the "one flow per domain/concern" rule.

**Two-level flow composition.** `AppMountFlow` handles the imperative mount concern (calling the adapter). `AppFlow` handles the declarative routing concern (defining the route tree). `AppMountFlow` imports `AppFlow` (flows can import flows) and passes its output to the mount responder.

**Flow uses JSX via automatic JSX transform.** Flow `.tsx` files use `<Routes>`, `<Route>` from react-router-dom (whitelisted). With `"jsx": "react-jsx"` in tsconfig, no explicit `import React` is needed. If lint flags the auto-injected `react/jsx-runtime`, we'll whitelist `react` for flows.

**Route responders are thin re-exports.** They bridge flows → widgets. Can be enriched later with URL param validation.

**Mount responder types `content` as `unknown`.** Avoids needing React type imports in the responder. The adapter handles actual React typing.

**`BrowserRouter` lives in `AppRootWidget`, not the flow.** The root widget provides the router context that `<Routes>` requires. This keeps flows focused on route definitions only.

---

## Files to Create

### 1. `packages/web/src/adapters/react-dom/mount/react-dom-mount-adapter.tsx`
- Wraps `react-dom/client` (adapters can import any node_modules)
- Imports `@mantine/core/styles.css` (CSS side effect)
- Accepts `{ rootElementId, Wrapper, content }` — gets DOM element, throws if not found, renders `<Wrapper>{content}</Wrapper>`
- Companions: `.proxy.ts`, `.test.ts`

### 2. `packages/web/src/adapters/mantine/notifications/mantine-notifications-adapter.tsx`
- Wraps `@mantine/notifications`
- Imports `@mantine/notifications/styles.css` (CSS side effect)
- Re-exports `Notifications` component
- Companions: `.proxy.ts`, `.test.ts`

### 3. `packages/web/src/widgets/app-root/app-root-widget.tsx`
- Imports `BrowserRouter` from `react-router-dom`, `MantineProvider`/`createTheme` from `@mantine/core`, `Notifications` from mantine-notifications adapter
- Creates Mantine theme (monospace font, 2px radius)
- Renders: `BrowserRouter > MantineProvider > Notifications > dark div > {children}`
- Accepts `children` prop
- Companion: `.test.tsx`

### 4. `packages/web/src/responders/app/mount/app-mount-responder.ts`
- Imports `reactDomMountAdapter` and `AppRootWidget`
- Accepts `{ content: unknown }` — passes to adapter with `Wrapper: AppRootWidget, rootElementId: 'root'`
- Companions: `.proxy.ts`, `.test.ts`

### 5. `packages/web/src/responders/app/layout/app-layout-responder.ts`
- Re-exports `AppWidget` as `AppLayoutResponder`
- Companions: `.proxy.ts`, `.test.ts`

### 6. `packages/web/src/responders/app/home/app-home-responder.ts`
- Re-exports `HomeContentLayerWidget` as `AppHomeResponder`
- Companions: `.proxy.ts`, `.test.ts`

### 7. `packages/web/src/responders/app/quest-chat/app-quest-chat-responder.ts`
- Re-exports `QuestChatWidget` as `AppQuestChatResponder`
- Companions: `.proxy.ts`, `.test.ts`

### 8. `packages/web/src/flows/home/home-flow.tsx`
- Child flow: returns `<Route path="/" element={<AppHomeResponder />} />`
- Imports `Route` from `react-router-dom`, `AppHomeResponder` from responders
- Companion: `.integration.test.ts`

### 9. `packages/web/src/flows/quest-chat/quest-chat-flow.tsx`
- Child flow: returns fragment with `<Route>` elements for all `/:guildSlug/*` paths → `AppQuestChatResponder`
- Imports `Route` from `react-router-dom`, `AppQuestChatResponder` from responders
- Companion: `.integration.test.ts`

### 10. `packages/web/src/flows/app/app-flow.tsx`
- Parent flow: composes child flows inside `<Routes>` with layout route
- Imports `Routes`, `Route` from `react-router-dom`; `HomeFlow`, `QuestChatFlow` from sibling flows; `AppLayoutResponder` from responders
- Returns `<Routes><Route element={<AppLayoutResponder />}>{HomeFlow()}{QuestChatFlow()}</Route></Routes>`
- Companion: `.integration.test.ts`

### 11. `packages/web/src/flows/app-mount/app-mount-flow.ts`
- Imperative mount flow: calls `AppMountResponder` with `AppFlow` route tree as content
- Imports `AppFlow` from `../app/app-flow`, `AppMountResponder` from responders
- Companion: `.integration.test.ts`

### 12. `packages/web/src/main.ts`
- Vite entry point (outside `startup/`, no lint restrictions)
- Imports `StartApp` from `./startup/start-app`, calls it

## Files to Modify

### 13. `packages/web/src/startup/start-app.ts`
- Strip ALL imports except the mount flow
- Body: `export const StartApp = (): void => { AppMountFlow(); }`
- Remove auto-invoke guard, remove all branching

### 14. `packages/web/src/startup/start-app.integration.test.ts`
- Keep existing assertion (`StartApp` is a function)

### 15. `packages/web/src/widgets/app/app-widget.tsx`
- Remove `Routes`, `Route` imports from `react-router-dom` (keep `useLocation`)
- Add `Outlet` import from `react-router-dom`
- Replace `<Routes>...<Route>...</Routes>` block with `<Outlet />`
- All layout logic (spacers, logo, map frame, transitions) stays

### 16. `packages/web/src/widgets/app/app-widget.test.tsx`
- Route-specific assertions (testing "/" renders home, "/:guildSlug/quest" renders quest chat) move to flow integration tests
- Layout assertions (spacer animation, map frame sizing) stay

### 17. `packages/web/index.html`
- Change script src from `src/startup/start-app.ts` to `src/main.ts`

## Files to Delete

None.

## Test Redistribution

| Original assertion | New home |
|---|---|
| `StartApp` is a function | `start-app.integration.test.ts` (stays) |
| DOM element lookup + error on missing | `react-dom-mount-adapter.test.ts` |
| Notifications component exported | `mantine-notifications-adapter.test.ts` |
| Provider tree renders children | `app-root-widget.test.tsx` |
| Mount responder calls adapter | `app-mount-responder.test.ts` |
| Route "/" renders home content | `home-flow.integration.test.ts` |
| Route "/:guildSlug/quest/:sessionId" renders quest chat | `quest-chat-flow.integration.test.ts` |
| Full route composition works | `app-flow.integration.test.ts` |
| Layout spacer animation based on route | `app-widget.test.tsx` (stays) |
| Map frame sizing based on route | `app-widget.test.tsx` (stays) |

## Risk: JSX in Flow

The flow `.tsx` files use JSX which compiles to `react/jsx-runtime` via automatic JSX transform. If lint flags this, we'll whitelist `react` for flows. Verify during implementation.
