# G13: The Mantine-wrapped `render` moves to `@dungeonmaster/testing`

| | |
|---|---|
| Phase | Phase 1 — gateway foundation |
| Source | `scrolls/gateway/followup-sustainability.md`, item 15, lines 87-118 |
| Needs | [G12](g12-gateway-config-key-and-rules.md) (the `gateway` key must exist in `.dungeonmaster.json` before this item adds a `restrictedTo` entry to it); [G26](g26-per-file-proxy-and-stub-imports.md) (deletes the subpath's `_test_` barrel this item's "Current state" describes, so the render proxy is a per-file import by the time this item runs) |
| Unblocks | nothing |
| Packages touched | `@gateway/npm` (delete), `testing` (add) |
| Checks to run | `lint,typecheck,unit` |
| Split | one agent |
| Runs alone | no — but do not let another agent edit `web` or `testing` at the same time (EPIC.md's "Runs with" column for G13 says "any outside `web`, `testing`") |

## Why

`packages/@gateway/npm/src/testing-library__react/render/render.ts` wraps every render call in
Mantine's `MantineProvider`, with no theme prop. That is one app's (web's) choice of UI library,
hard-coded inside the shared wrapper for the npm package `@testing-library/react`. It makes the
gateway's `testing-library__react` subpath depend on `@mantine/core`, and it forces any second React
package that uses a different UI library to override `wrapper` on every single render call. The fix
moves the Mantine-specific wrapping out of the gateway and into `@dungeonmaster/testing`, which is
where a test-only, one-app choice belongs.

## Current state

Checked 2026-09-26 against the code:

- `packages/@gateway/npm/src/testing-library__react/testing-library__react.ts` is the subpath barrel.
  It does `export * from '@testing-library/react';` then overrides one name:
  `export { render } from './render/render';`.
- `packages/@gateway/npm/src/testing-library__react/render/render.ts` holds the wrapped `render`:

  ```typescript
  export const render = (ui: ReactElement, options?: RenderOptions): RenderResult =>
    testingLibraryRender(ui, { wrapper: MantineProvider, ...options });
  ```

  Its own PURPOSE header says it matches
  `packages/web/src/adapters/mantine/render/mantine-render-adapter.ts` "verbatim".
- The wrapper folder also holds `render.test.ts` (two cases: a component reading Mantine context
  renders correctly inside the provider; other `RenderOptions` such as `container` still pass through)
  and `render.proxy.ts` (a no-op proxy — the PURPOSE comment says this composes two real, deterministic
  npm calls with no I/O, so nothing is mocked).
- The subpath's `_test_` barrel, `packages/@gateway/npm/src/testing-library__react/testing-library__react.proxy.ts`,
  re-exports it as `export { renderProxy } from './render/render.proxy';` — checked before G26 landed. G26
  deletes this subpath test barrel along with every other one, so by the time this item runs,
  `render.proxy.ts` is a per-file import: `#gateway/npm/testing-library__react/render/render.proxy`.
- **No caller outside the gateway imports `render` from `#gateway/npm/testing-library__react` today.**
  A repo-wide search for an import of `render` from that exact specifier found none (only the compiled
  `.d.ts` in `packages/@gateway/npm/dist`, which is build output, not a caller). Two web test files
  (`react-flow-diagram-widget.test.tsx`, `home-content-widget.test.tsx`) import `screen` and `waitFor`
  from that subpath but get their actual render call from web's own
  `mantine-render-adapter.ts` instead.
- **Every widget test in `web` still renders through `mantineRenderAdapter`** —
  `packages/web/src/adapters/mantine/render/mantine-render-adapter.ts`, a plain wrapper with the same
  body as the gateway's `render`:

  ```typescript
  export const mantineRenderAdapter = ({ ui }: { ui: React.ReactElement }): RenderResult =>
    render(ui, { wrapper: MantineProvider });
  ```

  Around a hundred `*-widget.test.tsx` files import it (a repo-wide search on 2026-09-26 found roughly
  105). Migrating those callers off the adapter and onto a gateway or `testing` render is web's own
  adapter-deletion item (A17), not this one. **This item only has to handle the gateway's OWN wrapped
  `render` and its (currently zero) callers.**
- `.dungeonmaster.json` at the repo root has no `gateway` key yet (checked 2026-09-26) — G12 has not
  landed. Do not write the `restrictedTo` entry until it exists; G12 is this item's one dependency.
- `packages/testing/package.json` uses a hand-written `exports` map today, one entry per thing it
  ships (`.`, `./register-mock`, `./brokers/network-record/playwright`,
  `./adapters/fs/queue-metadata-read`, `./transformers/quest-flow-observable-seed`, `./brokers`,
  `./jest-config-base`), not yet the gateway's three-key `./*.proxy` / `./*.stub` / `./*` form — that move
  is B03, later in the epic. Add this item's new export the same way the existing ones are added: a new
  `exports` entry plus a matching `typesVersions` row, following an existing entry as the pattern.
  Where in `testing`'s own folder structure the wrapped `render` belongs is not obvious from an
  existing example — `testing` has no folder today that holds a UI-rendering helper. **Recommended:**
  put it under a new `middleware/render/render.ts` (folder type `middleware/`: "Combine adapters for
  infrastructure" is the closest fit — it composes the gateway's `render` with Mantine's provider, the
  same shape `mantine-render-adapter.ts` had). This is a recommendation, not a hard requirement — the
  executing agent may pick a different folder type with a reason recorded in DECISIONS, since B03 will
  revisit this package's whole layout regardless.

## Work

1. Write the wrapped `render` in `@dungeonmaster/testing`, calling the raw (now Mantine-free) `render`
   from `#gateway/npm/testing-library__react`:

   ```typescript
   import { render as gatewayRender } from '#gateway/npm/testing-library__react';
   import type { RenderOptions, RenderResult } from '#gateway/npm/testing-library__react';
   import type { ReactElement } from 'react';
   import { MantineProvider } from '@mantine/core';

   export const render = (ui: ReactElement, options?: RenderOptions): RenderResult =>
     gatewayRender(ui, { wrapper: MantineProvider, ...options });
   ```

   Give it a colocated test carrying over the two cases from the gateway's `render.test.ts` (Mantine
   context renders correctly; other `RenderOptions` still pass through), and a proxy matching the
   gateway's no-op reasoning (composes two real, deterministic calls — nothing to mock).
2. `testing` then lists `@mantine/core` in its own `dependencies` (it is a real, direct import now, not
   a transitive one).
3. Move every caller of the gateway's wrapped `render` onto `testing`'s. Per "Current state" above,
   there are none today — confirm this is still true before deleting the gateway's version (a caller
   could have been added since 2026-09-26), and if any exist, switch them to import `render` from
   `@dungeonmaster/testing`'s new export path instead.
4. Delete `packages/@gateway/npm/src/testing-library__react/render/` — `render.ts`, `render.test.ts`,
   `render.proxy.ts` — and its re-export from `testing-library__react.ts` (the barrel). After the delete,
   the barrel goes back to a bare `export * from '@testing-library/react';` with no override line. G26
   already deleted the subpath's `_test_` test barrel (`testing-library__react.proxy.ts`), so there is no
   companion barrel file left to clean up here.
5. Add the `restrictedTo` entry to the `gateway` key in `.dungeonmaster.json`, now that G12 has built
   it:

   ```json
   "restrictedTo": [
     {
       "subpath": "#gateway/npm/testing-library__react",
       "name": "render",
       "packages": ["testing"],
       "reason": "widget tests render through @dungeonmaster/testing's render, which wraps MantineProvider"
     }
   ]
   ```

   Confirm against G12's item file what shape the `gateway` key and its lint rules actually landed in
   (an item file is a plan; the code that shipped is the truth) before writing this entry.

## Done when

- [ ] `packages/@gateway/npm/src/testing-library__react/render/` no longer exists.
- [ ] The gateway's `testing-library__react.ts` barrel is a bare pass-through with no `render` override.
- [ ] `@dungeonmaster/testing` exports a Mantine-wrapped `render`, with a test and a proxy.
- [ ] `@dungeonmaster/testing`'s `package.json` lists `@mantine/core` in `dependencies`.
- [ ] The `gateway.restrictedTo` entry above exists in `.dungeonmaster.json` and validates against
      `dungeonmasterConfigContract`.
- [ ] `npm run ward -- -- <files touched>` exits 0.

## Traps

- Do not confuse this item with A17 (adapters: `web`), which is what actually moves web's ~105 widget
  tests off `mantineRenderAdapter`. This item only removes the gateway's copy and gives `testing` a
  replacement; migrating web's callers is out of scope here.
- The `restrictedTo` entry only stops OTHER packages from reaching the raw `render` through the
  gateway directly — it does nothing to stop a caller reaching Mantine directly or reaching
  `testing`'s own wrapped export from a package the entry does not list. Read G12's item file for
  exactly what the lint rule checks before assuming this alone is enforcement.

## Concessions made while executing

<Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table.>
