import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { ruleGatewayColocationBroker } from './rule-gateway-colocation-broker';
import { ruleGatewayColocationBrokerProxy } from './rule-gateway-colocation-broker.proxy';

const ruleTester = eslintRuleTesterAdapter();

beforeEach(() => {
  const proxy = ruleGatewayColocationBrokerProxy();

  proxy.fsExistsSync.setupFileSystem((filePath) => {
    const existingFiles = [
      '/repo/packages/node/src/fs/read-file-sync.test.ts',
      '/repo/packages/node/src/fs/read-file-sync.proxy.ts',
      '/repo/packages/node/src/fs/index.test.ts',
      '/repo/packages/npm/src/react/index.test.ts',
      '/repo/packages/node/src/module/index.test.ts',
      '/repo/packages/node/src/child_process/run.integration.test.ts',
      '/repo/packages/node/src/child_process/run.proxy.ts',
      '/repo/packages/node/src/console/index.test.ts',
      '/repo/packages/node/src/setTimeout/index.test.ts',
      '/repo/packages/bin/src/git/index.test.ts',
      '/repo/packages/bin/src/git/index.proxy.ts',
      '/repo/packages/npm/src/@testing-library/jest-dom/index.test.ts',
    ];

    return existingFiles.includes(String(filePath));
  });
});

ruleTester.run('gateway-colocation', ruleGatewayColocationBroker(), {
  valid: [
    // --- wrapper file with a colocated .test.ts and .proxy.ts ---
    {
      code: 'export const readFileSync = (): string => "";',
      filename: '/repo/packages/node/src/fs/read-file-sync.ts',
    },
    // --- wrapper file with a colocated .integration.test.ts (no unit test) ---
    {
      code: 'export const run = (): void => {};',
      filename: '/repo/packages/node/src/child_process/run.ts',
    },
    // --- pure re-export index.ts (export * from) with only a test, no proxy needed ---
    {
      code: "export * from 'react';",
      filename: '/repo/packages/npm/src/react/index.ts',
    },
    // --- pure re-export index.ts (export { a } from './a', export type) with a colocated test ---
    {
      code: "export { readFileSync } from './read-file-sync';\nexport type { FsError } from './is-fs-error';",
      filename: '/repo/packages/node/src/fs/index.ts',
    },
    // --- pure re-export index.ts using the export = form (import x = require(); export = x;) ---
    {
      code: "import mod = require('react');\nexport = mod;",
      filename: '/repo/packages/npm/src/react/index.ts',
    },
    // --- global capture index.ts: destructure form (export const { x } = globalThis;) ---
    {
      code: 'export const { console } = globalThis;',
      filename: '/repo/packages/node/src/console/index.ts',
    },
    // --- global capture index.ts: member form (export const x = globalThis.x;) ---
    {
      code: 'export const setTimeout = globalThis.setTimeout;',
      filename: '/repo/packages/node/src/setTimeout/index.ts',
    },
    // --- bare side-effect import, no specifiers: a pass-through for a setup-only package ---
    {
      code: "import '@testing-library/jest-dom';",
      filename: '/repo/packages/npm/src/@testing-library/jest-dom/index.ts',
    },
    // --- a companion file (more than one dot) is never itself checked for companions ---
    {
      code: 'describe("x", () => {});',
      filename: '/repo/packages/node/src/fs/read-file-sync.test.ts',
    },
    {
      code: 'export const readFileSyncProxy = () => ({});',
      filename: '/repo/packages/node/src/fs/read-file-sync.proxy.ts',
    },
    // --- files outside the gateway are untouched ---
    {
      code: 'export const orderFetchBroker = () => {};',
      filename: '/repo/packages/hooks/src/brokers/order/fetch/order-fetch-broker.ts',
    },
  ],

  invalid: [
    // --- wrapper file missing both test and proxy ---
    {
      code: 'export const writeFileSync = (): void => {};',
      filename: '/repo/packages/node/src/fs/write-file-sync.ts',
      errors: [{ messageId: 'missingTestFile' }, { messageId: 'missingProxyFile' }],
    },
    // --- wrapper file with a test but no proxy ---
    {
      code: 'export const readFileSync = (): string => "";',
      filename: '/repo/packages/node/src/fs/read-file-sync-missing-proxy.ts',
      errors: [{ messageId: 'missingTestFile' }, { messageId: 'missingProxyFile' }],
    },
    // --- pure re-export index.ts with no colocated test ---
    {
      code: "export * from 'zod';",
      filename: '/repo/packages/npm/src/zod/index.ts',
      errors: [{ messageId: 'missingTestFile' }],
    },
    // --- a `let` capture is not a global capture: only `const` counts as pure ---
    {
      code: 'export let { console } = globalThis;',
      filename: '/repo/packages/node/src/console/index.ts',
      errors: [{ messageId: 'passThroughNotPureReexport' }, { messageId: 'missingProxyFile' }],
    },
    // --- capturing off something other than globalThis is real wrapping behavior, not a capture ---
    {
      code: 'const fakeGlobal = {}; export const { console } = fakeGlobal;',
      filename: '/repo/packages/node/src/console/index.ts',
      errors: [{ messageId: 'passThroughNotPureReexport' }, { messageId: 'missingProxyFile' }],
    },
    // --- a call off globalThis is real wrapping behavior, not a bare capture ---
    {
      code: 'export const now = globalThis.Date.now();',
      filename: '/repo/packages/node/src/console/index.ts',
      errors: [{ messageId: 'passThroughNotPureReexport' }, { messageId: 'missingProxyFile' }],
    },
    // --- a side-effect import alongside a plain `import` with bindings is not pure ---
    {
      code: "import defaultExport from '@testing-library/jest-dom';",
      filename: '/repo/packages/npm/src/@testing-library/jest-dom/index.ts',
      errors: [{ messageId: 'passThroughNotPureReexport' }, { messageId: 'missingProxyFile' }],
    },
    // --- pure re-export index.ts that ALSO carries a stray proxy: soft flag, dead weight ---
    {
      code: "export * from './git-current-branch';\nexport * from './git-add-all';",
      filename: '/repo/packages/bin/src/git/index.ts',
      errors: [{ messageId: 'passThroughHasStrayProxy' }],
    },
    // --- an index.ts that fails purity (real behavior) is flagged, and held to wrapper rules ---
    {
      code: "import { resolvePackageRoot } from './resolve-package-root';\nconst gateway = Object.create({});\ngateway.resolvePackageRoot = resolvePackageRoot;\nexport = gateway;",
      filename: '/repo/packages/node/src/module/index.ts',
      errors: [{ messageId: 'passThroughNotPureReexport' }, { messageId: 'missingProxyFile' }],
    },
  ],
});
