/**
 * PURPOSE: Every folder directly under this package's own `src/` must name a real thing the Node
 * runtime provides — a built-in module or a Node GLOBAL (`setTimeout`, `fetch`, …). ESLint's
 * file-glob rules cannot make this check: it needs a maintained list of real platform names to
 * compare folders against, not a source file a selector can parse. `nodeBuiltinModuleNamesForTest`
 * duplicates `nodeBuiltinStatics.modules` (`@dungeonmaster/shared`) by hand rather than importing it
 * — `gateway-import-boundary` (active, in the gateway ESLint config block) refuses ANY import of
 * `@dungeonmaster/shared` from inside a gateway file, this test included, since the gateway is the
 * bottom layer and may not depend on a package built on top of it. Keep this list in sync with
 * `nodeBuiltinStatics.modules` by hand when a builtin is added there. `nodeGlobalNamesForTest` is a
 * SEPARATE maintained list this test owns outright (no shared statics carries Node's globals at all,
 * only its built-in modules) — extend it here when a gateway folder wraps a Node global not already
 * listed, per the layout standard's rule that a global keeps its own exact casing.
 *
 * `.integration.test.ts`, not `.test.ts`: this file has no single implementation companion —
 * `@dungeonmaster/enforce-test-colocation` requires one for a plain `.test.ts`, and is turned off (in
 * `config-dungeonmaster-broker.ts`) only for `**\/src/*.integration.test.ts`.
 *
 * USAGE:
 * npm run ward -- --only integration -- packages/@gateway/node/src/gateway-node-builtin-globals.integration.test.ts
 */
import { readdirSync } from 'fs';

const SRC_DIR = __dirname;
const SUBPATH_JOIN = '__';

// Duplicated by hand from `nodeBuiltinStatics.modules` in `@dungeonmaster/shared` — see PURPOSE for
// why this cannot be an import.
const nodeBuiltinModuleNamesForTest = [
  'assert',
  'buffer',
  'child_process',
  'cluster',
  'console',
  'constants',
  'crypto',
  'dgram',
  'dns',
  'domain',
  'events',
  'fs',
  'http',
  'http2',
  'https',
  'module',
  'net',
  'os',
  'path',
  'perf_hooks',
  'process',
  'querystring',
  'readline',
  'repl',
  'stream',
  'string_decoder',
  'timers',
  'tls',
  'tty',
  'url',
  'util',
  'v8',
  'vm',
  'worker_threads',
  'zlib',
];

// Node globals this gateway wraps that are NOT also built-in module names. Node's built-in modules
// (fs, path, process, …) already come from the list above; this list is only the extra surface
// `globalThis` carries on top of that — add a name here when a new folder wraps one.
const nodeGlobalNamesForTest = [
  'atob',
  'btoa',
  'clearImmediate',
  'clearInterval',
  'clearTimeout',
  'fetch',
  'performance',
  'queueMicrotask',
  'setImmediate',
  'setInterval',
  'setTimeout',
  'structuredClone',
];

const readOwnSrcFolders = (): string[] =>
  readdirSync(SRC_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

const folderNamesABuiltinModule = ({ folderName }: { folderName: string }): boolean =>
  nodeBuiltinModuleNamesForTest.some(
    (moduleName) =>
      folderName === moduleName || folderName.startsWith(`${moduleName}${SUBPATH_JOIN}`),
  );

const folderNamesAGlobal = ({ folderName }: { folderName: string }): boolean =>
  nodeGlobalNamesForTest.some((globalName) => folderName === globalName);

// A single named predicate, not an inline `&&`, so the conditional lives in a top-level function
// instead of inside the `it()` body — `jest/no-conditional-in-test` flags a logical expression
// written directly in a test.
const folderNamesNeitherBuiltinNorGlobal = ({ folderName }: { folderName: string }): boolean =>
  !folderNamesABuiltinModule({ folderName }) && !folderNamesAGlobal({ folderName });

describe('gateway node builtin and global folder names', () => {
  it('VALID: {every src/ folder} => names a real Node builtin module or a real Node global', () => {
    const foldersNamingNeither = readOwnSrcFolders().filter((folderName) =>
      folderNamesNeitherBuiltinNorGlobal({ folderName }),
    );

    expect(foldersNamingNeither).toStrictEqual([]);
  });
});
