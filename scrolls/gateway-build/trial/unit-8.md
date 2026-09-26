# Unit 8: web home-content widget test consumes `@dungeonmaster/npm/@testing-library/react`

- Files changed:
  - `packages/web/src/widgets/home-content/home-content-widget.test.tsx` — `screen, waitFor` import switched from `'@testing-library/react'` to `'@dungeonmaster/npm/@testing-library/react'`
  - `packages/web/src/widgets/home-content/home-content-widget.proxy.tsx` — `screen, within` import switched the same way (it imports testing-library directly, so it is in scope per the unit's own instructions)
  - `packages/web/package.json` — added `"@dungeonmaster/npm": "*"` to `dependencies`

- What did NOT change, and why: neither the test nor the proxy imports `render` directly. Both call `mantineRenderAdapter` (`packages/web/src/adapters/mantine/render/mantine-render-adapter.ts`), which is an untouched adapter per the brief ("never delete or edit an adapter, switch the caller only"). So the gateway's own `render` (which wraps `MantineProvider`, in `packages/npm/src/@testing-library/react/render.ts`) is never exercised by this file — the trial-plan's description of this unit ("today's adapter import: render from `@testing-library/react`, raw npm import in the test file") does not match the file's current shape; the test only ever rendered through `mantineRenderAdapter`. No double-wrap risk here as a result: the Mantine wrap this test gets still comes solely from the one untouched adapter.

- Gateway imports used: `screen`, `waitFor` (test), `screen`, `within` (proxy) — all pure pass-throughs off `@dungeonmaster/npm/@testing-library/react`'s `export * from '@testing-library/react'` (`packages/npm/src/@testing-library/react/index.ts:12`). Same module instance concern: because the gateway file is a re-export of the identical `@testing-library/react` package (not a second copy/second install), `screen`'s internal binding to `document.body` is unaffected — `screen` from the gateway subpath and `screen` from a raw import are the same object.

- Ward command and result:
  `npm run ward -- --only lint,typecheck,unit -- packages/web/src/widgets/home-content/home-content-widget.test.tsx packages/web/src/widgets/home-content/home-content-widget.proxy.tsx packages/web/package.json`
  ```
  lint:      PASS  1 packages (2 files passed/0 files failed, 2 discovered)  6.7s
  typecheck: PASS  1 packages (1467 files passed/0 files failed, 1467 discovered)  10.8s
  unit:      PASS  1 packages (1 files passed/0 files failed, 464 discovered)  17.2s
  ```
  Fully green — the widget's whole suite (18 test cases across empty state, guild list, guild creation, localStorage persistence, navigation, error logging, quest delete, unreadable quest files) still passes unchanged.

- Friction: none observed. Per the trial-plan's own prediction, unit 8 is the one exception to the import-boundary trip every other unit expects — `widgets/`'s test-file import rules are already loose enough (`@testing-library/react` is in `folderConfigStatics`'s widgets allowlist) and `enforce-import-dependencies`'s gateway carve-out (see unit 9's log) covers the subpath regardless.

- Edge cases found the gateway design did not account for: the trial-plan's premise for this unit (a raw `render` import in the test file) was already stale against the current code — the test never called raw `render`, only the `mantineRenderAdapter` wrapper. Worth flagging to whoever plans the eventual migration of `mantine-render-adapter.ts` itself: when that adapter is later retired in favor of callers using the gateway's own Mantine-wrapping `render` directly, this file's `mantineRenderAdapter` calls are what will actually need to change, not the testing-library import line this unit touched.

- Could not finish: nothing. Unit complete.
