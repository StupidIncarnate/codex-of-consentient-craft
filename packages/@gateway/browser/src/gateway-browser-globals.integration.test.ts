/**
 * PURPOSE: Every folder directly under this package's own `src/` must name a real browser global.
 * ESLint runs under Node and has no view of the browser's own global list, so this cannot be an
 * ESLint rule the way `gateway-layout`'s case-collision check is — the comparison needs a maintained
 * list of real browser API names, not a source file a selector can parse. `browserGlobalNamesForTest`
 * is that list, and THIS FILE owns creating and maintaining it (no other list of browser globals
 * exists in this repo) — extend it here when a new folder wraps a browser global not already listed.
 * Casing must match the browser's own global exactly (`WebSocket`, not `websocket`), per the layout
 * standard's rule that a global keeps its own exact casing.
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

describe('gateway browser global folder names', () => {
  it('VALID: {every src/ folder} => names a real, maintained browser global', () => {
    const foldersNamingNoGlobal = readOwnSrcFolders().filter(
      (folderName) => !folderNamesABrowserGlobal({ folderName }),
    );

    expect(foldersNamingNoGlobal).toStrictEqual([]);
  });
});
