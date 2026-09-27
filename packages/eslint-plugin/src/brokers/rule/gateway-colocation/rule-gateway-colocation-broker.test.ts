import { FilePathStub, FileContentsStub } from '@dungeonmaster/shared/contracts';
import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { FileNameStub } from '../../../contracts/file-name/file-name.stub';
import { ruleGatewayColocationBroker } from './rule-gateway-colocation-broker';
import { ruleGatewayColocationBrokerProxy } from './rule-gateway-colocation-broker.proxy';

const ruleTester = eslintRuleTesterAdapter();

beforeEach(() => {
  const proxy = ruleGatewayColocationBrokerProxy();

  proxy.fsExistsSync.setupFileSystem((filePath) => {
    const existingFiles = [
      '/repo/packages/@gateway/node/src/fs/read-file-sync/read-file-sync.test.ts',
      '/repo/packages/@gateway/node/src/fs/read-file-sync/read-file-sync.proxy.ts',
      '/repo/packages/@gateway/node/src/fs/read-file-sync/read-file-sync.ts',
      '/repo/packages/@gateway/node/src/fs/is-fs-error/is-fs-error.ts',
      '/repo/packages/@gateway/node/src/fs/is-fs-error/fs-error.ts',
      '/repo/packages/@gateway/node/src/fs/fs.test.ts',
      '/repo/packages/@gateway/node/src/fs/fs.proxy.ts',
      '/repo/packages/@gateway/npm/src/react/react.test.ts',
      '/repo/packages/@gateway/node/src/module/module.test.ts',
      '/repo/packages/@gateway/node/src/child_process/run/run.integration.test.ts',
      '/repo/packages/@gateway/node/src/child_process/run/run.proxy.ts',
      '/repo/packages/@gateway/npm/src/glob/glob/glob.test.ts',
      '/repo/packages/@gateway/npm/src/glob/glob/glob.proxy.ts',
      '/repo/packages/@gateway/node/src/console/console.test.ts',
      '/repo/packages/@gateway/node/src/setTimeout/setTimeout.test.ts',
      '/repo/packages/@gateway/npm/src/testing-library__jest-dom/testing-library__jest-dom.test.ts',
      '/repo/packages/@gateway/node/src/os/os.test.ts',
      '/repo/packages/@gateway/node/src/os/homedir/homedir.ts',
      '/repo/packages/@gateway/node/src/dns/dns.test.ts',
      '/repo/packages/@gateway/node/src/dgram/dgram.test.ts',
      '/repo/packages/@gateway/node/src/tls/tls.test.ts',
      '/repo/packages/@gateway/node/src/tls/create-server/create-server.ts',
      '/repo/packages/@gateway/node/src/vm/vm.test.ts',
      '/repo/packages/@gateway/node/src/perf_hooks/perf_hooks.test.ts',
    ];

    return existingFiles.includes(String(filePath));
  });

  // requireStub's directory walk, and (shared — registerMock keys by function reference, not by
  // caller) barrel-completeness's own subpath scan. Every barrel filename below needs its own
  // directory staged, even an empty one, since an unstaged dirPath throws.
  proxy.gatewaySubpathDirectoryWalk.fsReaddirSync.returns({
    dirPath: FilePathStub({ value: '/repo/packages/@gateway/node/src/fs/' }),
    entries: [
      { name: FileNameStub({ value: 'is-fs-error' }), isDirectory: true },
      { name: FileNameStub({ value: 'fs.ts' }), isDirectory: false },
    ],
  });
  proxy.gatewaySubpathDirectoryWalk.fsReaddirSync.returns({
    dirPath: FilePathStub({ value: '/repo/packages/@gateway/node/src/fs/is-fs-error/' }),
    entries: [
      { name: FileNameStub({ value: 'fs-error.ts' }), isDirectory: false },
      { name: FileNameStub({ value: 'fs-error.stub.ts' }), isDirectory: false },
      { name: FileNameStub({ value: 'is-fs-error.ts' }), isDirectory: false },
      { name: FileNameStub({ value: 'is-fs-error.proxy.ts' }), isDirectory: false },
      { name: FileNameStub({ value: 'is-fs-error.test.ts' }), isDirectory: false },
    ],
  });
  proxy.gatewaySubpathDirectoryWalk.fsReaddirSync.returns({
    dirPath: FilePathStub({ value: '/repo/packages/@gateway/node/src/os/' }),
    entries: [
      { name: FileNameStub({ value: 'homedir' }), isDirectory: true },
      { name: FileNameStub({ value: 'os.ts' }), isDirectory: false },
    ],
  });
  proxy.gatewaySubpathDirectoryWalk.fsReaddirSync.returns({
    dirPath: FilePathStub({ value: '/repo/packages/@gateway/node/src/os/homedir/' }),
    entries: [
      { name: FileNameStub({ value: 'homedir.ts' }), isDirectory: false },
      { name: FileNameStub({ value: 'homedir.proxy.ts' }), isDirectory: false },
      { name: FileNameStub({ value: 'homedir.test.ts' }), isDirectory: false },
    ],
  });

  // Barrels with no wrapper folders of their own — every barrel-completeness visits still calls
  // readdir once, so each needs a stage even though the result is empty.
  proxy.gatewaySubpathDirectoryWalk.fsReaddirSync.returns({
    dirPath: FilePathStub({ value: '/repo/packages/@gateway/npm/src/react/' }),
    entries: [],
  });
  proxy.gatewaySubpathDirectoryWalk.fsReaddirSync.returns({
    dirPath: FilePathStub({ value: '/repo/packages/@gateway/node/src/console/' }),
    entries: [],
  });
  proxy.gatewaySubpathDirectoryWalk.fsReaddirSync.returns({
    dirPath: FilePathStub({ value: '/repo/packages/@gateway/node/src/setTimeout/' }),
    entries: [],
  });
  proxy.gatewaySubpathDirectoryWalk.fsReaddirSync.returns({
    dirPath: FilePathStub({
      value: '/repo/packages/@gateway/npm/src/testing-library__jest-dom/',
    }),
    entries: [],
  });
  proxy.gatewaySubpathDirectoryWalk.fsReaddirSync.returns({
    dirPath: FilePathStub({ value: '/repo/packages/@gateway/node/src/module/' }),
    entries: [],
  });
  proxy.gatewaySubpathDirectoryWalk.fsReaddirSync.returns({
    dirPath: FilePathStub({ value: '/repo/packages/@gateway/npm/src/zod/' }),
    entries: [],
  });
  proxy.gatewaySubpathDirectoryWalk.fsReaddirSync.returns({
    dirPath: FilePathStub({ value: '/repo/packages/@gateway/node/src/dgram/' }),
    entries: [],
  });
  proxy.gatewaySubpathDirectoryWalk.fsReaddirSync.returns({
    dirPath: FilePathStub({ value: '/repo/packages/@gateway/node/src/tls/' }),
    entries: [],
  });
  proxy.gatewaySubpathDirectoryWalk.fsReaddirSync.returns({
    dirPath: FilePathStub({ value: '/repo/packages/@gateway/node/src/vm/' }),
    entries: [],
  });
  proxy.gatewaySubpathDirectoryWalk.fsReaddirSync.returns({
    dirPath: FilePathStub({ value: '/repo/packages/@gateway/node/src/perf_hooks/' }),
    entries: [],
  });

  // dns/ has one wrapper folder, for the barrelMissingReexport case.
  proxy.gatewaySubpathDirectoryWalk.fsReaddirSync.returns({
    dirPath: FilePathStub({ value: '/repo/packages/@gateway/node/src/dns/' }),
    entries: [
      { name: FileNameStub({ value: 'resolve4' }), isDirectory: true },
      { name: FileNameStub({ value: 'dns.ts' }), isDirectory: false },
    ],
  });
  proxy.gatewaySubpathDirectoryWalk.fsReaddirSync.returns({
    dirPath: FilePathStub({ value: '/repo/packages/@gateway/node/src/dns/resolve4/' }),
    entries: [{ name: FileNameStub({ value: 'resolve4.ts' }), isDirectory: false }],
  });

  // Source text barrel-completeness reads to learn each target file's exported names.
  proxy.barrelCompleteness.fsReadFileSync.returns({
    filePath: FilePathStub({
      value: '/repo/packages/@gateway/node/src/fs/is-fs-error/fs-error.ts',
    }),
    contents: FileContentsStub({ value: 'export interface FsError {\n  code: string;\n}\n' }),
  });
  proxy.barrelCompleteness.fsReadFileSync.returns({
    filePath: FilePathStub({
      value: '/repo/packages/@gateway/node/src/fs/is-fs-error/is-fs-error.ts',
    }),
    contents: FileContentsStub({ value: 'export const isFsError = (): boolean => false;\n' }),
  });
  proxy.barrelCompleteness.fsReadFileSync.returns({
    filePath: FilePathStub({
      value: '/repo/packages/@gateway/node/src/fs/read-file-sync/read-file-sync.ts',
    }),
    contents: FileContentsStub({ value: 'export const readFileSync = (): string => "";\n' }),
  });
  proxy.barrelCompleteness.fsReadFileSync.returns({
    filePath: FilePathStub({ value: '/repo/packages/@gateway/node/src/os/homedir/homedir.ts' }),
    contents: FileContentsStub({ value: 'export const homedir = (): string => "";\n' }),
  });
  proxy.barrelCompleteness.fsReadFileSync.returns({
    filePath: FilePathStub({
      value: '/repo/packages/@gateway/node/src/dns/resolve4/resolve4.ts',
    }),
    contents: FileContentsStub({ value: 'export const resolve4 = (): string[] => [];\n' }),
  });
  proxy.barrelCompleteness.fsReadFileSync.returns({
    filePath: FilePathStub({
      value: '/repo/packages/@gateway/node/src/tls/create-server/create-server.ts',
    }),
    contents: FileContentsStub({ value: 'export const startServer = (): void => {};\n' }),
  });
});

ruleTester.run('gateway-colocation', ruleGatewayColocationBroker(), {
  valid: [
    // --- wrapper file with a colocated .test.ts and .proxy.ts ---
    {
      code: 'export const readFileSync = (): string => "";',
      filename: '/repo/packages/@gateway/node/src/fs/read-file-sync/read-file-sync.ts',
    },
    // --- wrapper file with a colocated .integration.test.ts (no unit test) ---
    {
      code: 'export const run = (): void => {};',
      filename: '/repo/packages/@gateway/node/src/child_process/run/run.ts',
    },
    // --- pure re-export barrel (export * from) with only a test, no proxy needed ---
    {
      code: "export * from 'react';",
      filename: '/repo/packages/@gateway/npm/src/react/react.ts',
    },
    // --- pure re-export barrel with a colocated test, every wrapper export re-exported ---
    {
      code: "export { readFileSync } from './read-file-sync/read-file-sync';\nexport { isFsError } from './is-fs-error/is-fs-error';\nexport type { FsError } from './is-fs-error/fs-error';",
      filename: '/repo/packages/@gateway/node/src/fs/fs.ts',
    },
    // --- pure re-export barrel using the export = form (import x = require(); export = x;) ---
    {
      code: "import mod = require('react');\nexport = mod;",
      filename: '/repo/packages/@gateway/npm/src/react/react.ts',
    },
    // --- global capture barrel: destructure form (export const { x } = globalThis;) ---
    {
      code: 'export const { console } = globalThis;',
      filename: '/repo/packages/@gateway/node/src/console/console.ts',
    },
    // --- global capture barrel: member form (export const x = globalThis.x;) ---
    {
      code: 'export const setTimeout = globalThis.setTimeout;',
      filename: '/repo/packages/@gateway/node/src/setTimeout/setTimeout.ts',
    },
    // --- bare side-effect import, no specifiers: a pass-through for a setup-only package ---
    {
      code: "import '@testing-library/jest-dom';",
      filename:
        '/repo/packages/@gateway/npm/src/testing-library__jest-dom/testing-library__jest-dom.ts',
    },
    // --- a companion file (more than one dot) is never itself checked for companions ---
    {
      code: 'describe("x", () => {});',
      filename: '/repo/packages/@gateway/node/src/fs/read-file-sync/read-file-sync.test.ts',
    },
    {
      code: 'export const readFileSyncProxy = () => ({});',
      filename: '/repo/packages/@gateway/node/src/fs/read-file-sync/read-file-sync.proxy.ts',
    },
    // --- a file declaring only types needs neither a test nor a proxy ---
    {
      code: "import type { Stats } from 'fs';\nexport interface FsStat {\n  kind: string;\n}",
      filename: '/repo/packages/@gateway/node/src/fs/stat-sync/fs-stat.ts',
    },
    // --- a wrapper named after its own subpath sits one folder deeper, so it is not the barrel ---
    {
      code: 'export const glob = (): string[] => [];',
      filename: '/repo/packages/@gateway/npm/src/glob/glob/glob.ts',
    },
    // --- files outside the gateway are untouched ---
    {
      code: 'export const orderFetchBroker = () => {};',
      filename: '/repo/packages/hooks/src/brokers/order/fetch/order-fetch-broker.ts',
    },
    // --- requireStub off by default: a subpath with no .stub.ts anywhere is fine without the option ---
    {
      code: "export * from 'os';\nexport { homedir } from './homedir/homedir';",
      filename: '/repo/packages/@gateway/node/src/os/os.ts',
    },
    // --- requireStub true: a subpath whose directory tree DOES have a nested .stub.ts passes ---
    {
      code: "export { readFileSync } from './read-file-sync/read-file-sync';\nexport { isFsError } from './is-fs-error/is-fs-error';\nexport type { FsError } from './is-fs-error/fs-error';",
      filename: '/repo/packages/@gateway/node/src/fs/fs.ts',
      options: [{ requireStub: true }],
    },
    // --- requireStub true: a consumer's EMPTY npm/bin gateway has only the scaffolded placeholder,
    // never a subpath barrel (its parent folder is "src", not the file's own folder name), so
    // missingStub never fires against it — there is no subpath here to require a stub for ---
    {
      code: '// Keeps this package compiling while it holds no subpath: tsc refuses a config that matches no\n// file. Delete it once the first src/<subpath>/<subpath>.ts exists.\nexport {};',
      filename: '/repo/packages/@gateway/npm/src/index.d.ts',
      options: [{ requireStub: true }],
    },
    // --- .error.ts: a bare one-line error class needs no test and no proxy ---
    {
      code: 'export class GitNotInstalledError extends Error {}',
      filename: '/repo/packages/@gateway/bin/src/git/git-run/git-not-installed.error.ts',
    },
    // --- .error.ts: imports are allowed alongside the one exported error class ---
    {
      code: "import type { Identifier } from '@dungeonmaster/shared/contracts';\nexport class RunNotFoundError extends Error {}",
      filename: '/repo/packages/@gateway/node/src/child_process/run-not-found.error.ts',
    },
  ],

  invalid: [
    // --- wrapper file missing both test and proxy ---
    {
      code: 'export const writeFileSync = (): void => {};',
      filename: '/repo/packages/@gateway/node/src/fs/write-file-sync/write-file-sync.ts',
      errors: [{ messageId: 'missingTestFile' }, { messageId: 'missingProxyFile' }],
    },
    // --- wrapper file with a test but no proxy ---
    {
      code: 'export const readFileSync = (): string => "";',
      filename:
        '/repo/packages/@gateway/node/src/fs/read-file-sync-missing-proxy/read-file-sync-missing-proxy.ts',
      errors: [{ messageId: 'missingTestFile' }, { messageId: 'missingProxyFile' }],
    },
    // --- pure re-export barrel with no colocated test ---
    {
      code: "export * from 'zod';",
      filename: '/repo/packages/@gateway/npm/src/zod/zod.ts',
      errors: [{ messageId: 'missingTestFile' }],
    },
    // --- a `let` capture is not a global capture: only `const` counts as pure ---
    {
      code: 'export let { console } = globalThis;',
      filename: '/repo/packages/@gateway/node/src/console/console.ts',
      errors: [{ messageId: 'passThroughNotPureReexport' }],
    },
    // --- capturing off something other than globalThis is real wrapping behavior, not a capture ---
    {
      code: 'const fakeGlobal = {}; export const { console } = fakeGlobal;',
      filename: '/repo/packages/@gateway/node/src/console/console.ts',
      errors: [{ messageId: 'passThroughNotPureReexport' }],
    },
    // --- a call off globalThis is real wrapping behavior, not a bare capture ---
    {
      code: 'export const now = globalThis.Date.now();',
      filename: '/repo/packages/@gateway/node/src/console/console.ts',
      errors: [{ messageId: 'passThroughNotPureReexport' }],
    },
    // --- a side-effect import alongside a plain `import` with bindings is not pure ---
    {
      code: "import defaultExport from '@testing-library/jest-dom';",
      filename:
        '/repo/packages/@gateway/npm/src/testing-library__jest-dom/testing-library__jest-dom.ts',
      errors: [{ messageId: 'passThroughNotPureReexport' }],
    },
    // --- a barrel that fails purity (real behavior) is flagged ---
    {
      code: "import { resolvePackageRoot } from './resolve-package-root';\nconst gateway = Object.create({});\ngateway.resolvePackageRoot = resolvePackageRoot;\nexport = gateway;",
      filename: '/repo/packages/@gateway/node/src/module/module.ts',
      errors: [{ messageId: 'passThroughNotPureReexport' }],
    },
    // --- requireStub true: a subpath whose directory tree has no .stub.ts anywhere is flagged ---
    {
      code: "export * from 'os';\nexport { homedir } from './homedir/homedir';",
      filename: '/repo/packages/@gateway/node/src/os/os.ts',
      options: [{ requireStub: true }],
      errors: [{ messageId: 'missingStub' }],
    },
    // --- .error.ts: more than one export alongside the error class ---
    {
      code: 'export class GitNotInstalledError extends Error {}\nexport const helper = (): void => {};',
      filename: '/repo/packages/@gateway/bin/src/git/git-run/git-not-installed.error.ts',
      errors: [{ messageId: 'errorFileMultipleExports' }],
    },
    // --- .error.ts: the one export is not a class at all ---
    {
      code: 'export const notAClass = 1;',
      filename: '/repo/packages/@gateway/bin/src/git/git-run/git-not-installed.error.ts',
      errors: [{ messageId: 'errorFileNotErrorClass' }],
    },
    // --- .error.ts: a class that does not extend Error ---
    {
      code: 'export class GitNotInstalledError {}',
      filename: '/repo/packages/@gateway/bin/src/git/git-run/git-not-installed.error.ts',
      errors: [{ messageId: 'errorFileNotErrorClass' }],
    },
    // --- .error.ts: a class extending Error whose name does not match the filename ---
    {
      code: 'export class WrongNameError extends Error {}',
      filename: '/repo/packages/@gateway/bin/src/git/git-run/git-not-installed.error.ts',
      errors: [{ messageId: 'errorFileNameMismatch' }],
    },
    // --- an error class declared inside an ordinary wrapper file, not its own .error.ts ---
    {
      code: 'export class GitNotInstalledError extends Error {}\nexport const gitRun = async (): Promise<void> => {};',
      filename: '/repo/packages/@gateway/bin/src/git/git-run/git-run.ts',
      errors: [
        { messageId: 'errorClassOutsideErrorFile' },
        { messageId: 'missingTestFile' },
        { messageId: 'missingProxyFile' },
      ],
    },
    // --- barrel completeness, direction 1: a wrapper's value export the barrel never re-exports ---
    {
      code: '',
      filename: '/repo/packages/@gateway/node/src/dns/dns.ts',
      errors: [{ messageId: 'barrelMissingReexport' }],
    },
    // --- barrel completeness, direction 2: the target file is gone entirely ---
    {
      code: "export { createSocket } from './create-socket/create-socket';",
      filename: '/repo/packages/@gateway/node/src/dgram/dgram.ts',
      errors: [{ messageId: 'barrelStaleReexport' }],
    },
    // --- barrel completeness, direction 2: the target file exists but no longer carries that name ---
    {
      code: "export { createServer } from './create-server/create-server';",
      filename: '/repo/packages/@gateway/node/src/tls/tls.ts',
      errors: [{ messageId: 'barrelStaleReexport' }],
    },
    // --- single-home: a relative source that climbs into a sibling subpath ---
    {
      code: "export { isFsError } from '../fs/is-fs-error/is-fs-error';",
      filename: '/repo/packages/@gateway/node/src/vm/vm.ts',
      errors: [{ messageId: 'reexportOutsideOwnSubpath' }],
    },
    // --- no barrel re-exports a .proxy.ts or .stub.ts file ---
    {
      code: "export { readFileSyncProxy } from './read-file-sync/read-file-sync.proxy';",
      filename: '/repo/packages/@gateway/node/src/perf_hooks/perf_hooks.ts',
      errors: [{ messageId: 'barrelReexportsTestSupportFile' }],
    },
  ],
});
