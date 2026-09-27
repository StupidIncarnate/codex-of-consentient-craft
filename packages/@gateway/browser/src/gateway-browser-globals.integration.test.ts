/**
 * PURPOSE: Every folder directly under this package's own `src/` must name a real browser global —
 * with exactly one reserved exception, `RESERVED_TEST_SUPPORT_FOLDER`, the one folder every gateway
 * may hold for a shared, type-only proxy-addressing helper (`ValueMatcher` here) that has no real
 * global to be named after. ESLint runs under Node and has no view of the browser's own global list,
 * so this cannot be an ESLint rule the way `gateway-layout`'s case-collision check is — the
 * comparison needs a maintained list of real browser API names, not a source file a selector can
 * parse. `browserGlobalNamesForTest` is that list, and THIS FILE owns creating and maintaining it (no
 * other list of browser globals exists in this repo) — extend it here when a new folder wraps a
 * browser global not already listed. Casing must match the browser's own global exactly
 * (`WebSocket`, not `websocket`), per the layout standard's rule that a global keeps its own exact
 * casing. `RESERVED_TEST_SUPPORT_FOLDER` is duplicated by hand from
 * `gatewayReservedFolderNamesStatics.folders.testSupport` (`eslint-plugin`) — a gateway file may not
 * import `@dungeonmaster/shared` (`gateway-import-boundary`), and eslint-plugin is the one non-gateway
 * place that name can be canonical. Change both when it changes.
 *
 * `.integration.test.ts`, not `.test.ts`: this file has no single implementation companion —
 * `@dungeonmaster/enforce-test-colocation` requires one for a plain `.test.ts`, and is turned off (in
 * `config-dungeonmaster-broker.ts`) only for `**\/src/*.integration.test.ts`.
 *
 * USAGE:
 * npm run ward -- --only integration -- packages/@gateway/browser/src/gateway-browser-globals.integration.test.ts
 */
import { readdirSync } from 'fs';

const SRC_DIR = __dirname;
const RESERVED_TEST_SUPPORT_FOLDER = 'gateway-test-support';

// Real browser globals this gateway wraps. No shared statics list of "every browser global" exists
// anywhere else in this repo — add a name here when a new folder wraps one.
const browserGlobalNamesForTest = [
  'AbortController',
  'atob',
  'Blob',
  'console',
  'createImageBitmap',
  'crypto',
  'document',
  'fetch',
  'FileReader',
  'indexedDB',
  'localStorage',
  'location',
  'navigator',
  'requestAnimationFrame',
  'ResizeObserver',
  'sessionStorage',
  'URL',
  'WebSocket',
  'window',
  'XMLHttpRequest',
];

const readOwnSrcFolders = (): string[] =>
  readdirSync(SRC_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

const folderNamesABrowserGlobal = ({ folderName }: { folderName: string }): boolean =>
  browserGlobalNamesForTest.some((globalName) => folderName === globalName);

// A single named predicate, not an inline `||`, so the conditional lives in a top-level function
// instead of inside the `it()` body — `jest/no-conditional-in-test` flags a logical expression
// written directly in a test.
const folderNamesNeitherGlobalNorReserved = ({ folderName }: { folderName: string }): boolean =>
  !folderNamesABrowserGlobal({ folderName }) && folderName !== RESERVED_TEST_SUPPORT_FOLDER;

describe('gateway browser global folder names', () => {
  it('VALID: {every src/ folder} => names a real, maintained browser global, or is the one reserved test-support folder', () => {
    const foldersNamingNeither = readOwnSrcFolders().filter((folderName) =>
      folderNamesNeitherGlobalNorReserved({ folderName }),
    );

    expect(foldersNamingNeither).toStrictEqual([]);
  });
});
