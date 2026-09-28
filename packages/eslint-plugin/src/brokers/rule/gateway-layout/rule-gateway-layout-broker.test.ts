import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { ruleGatewayLayoutBroker } from './rule-gateway-layout-broker';
import { ruleGatewayLayoutBrokerProxy } from './rule-gateway-layout-broker.proxy';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

const ruleTester = eslintRuleTesterAdapter();

beforeEach(() => {
  const proxy = ruleGatewayLayoutBrokerProxy();

  proxy.fsReaddirSync.returns({
    path: FilePathStub({ value: '/repo/packages/@gateway/node/src' }),
    entries: [
      { name: 'fs', kind: 'directory' },
      { name: 'fs__promises', kind: 'directory' },
      { name: 'buffer', kind: 'directory' },
      { name: 'process', kind: 'directory' },
      { name: 'jest.config.js', kind: 'file' },
    ],
  });
  proxy.fsReaddirSync.returns({
    path: FilePathStub({ value: '/repo/packages/@gateway/browser/src' }),
    entries: [
      { name: 'URL', kind: 'directory' },
      { name: 'url', kind: 'directory' },
    ],
  });
  proxy.fsReaddirSync.returns({
    path: FilePathStub({ value: '/repo/packages/@gateway/bin/src' }),
    entries: [{ name: 'git', kind: 'directory' }],
  });
});

ruleTester.run('gateway-layout', ruleGatewayLayoutBroker(), {
  valid: [
    // --- no colliding sibling: fs, buffer and process all differ beyond case ---
    {
      code: "export { readFileSync } from './read-file-sync/read-file-sync';",
      filename: '/repo/packages/@gateway/node/src/fs/fs.ts',
    },
    // --- a flattened nested subpath (fs__promises) with no colliding sibling ---
    {
      code: "export { readFile } from './read-file/read-file';",
      filename: '/repo/packages/@gateway/node/src/fs__promises/fs__promises.ts',
    },
    // --- a wrapper file inside a subpath folder is not itself checked ---
    {
      code: 'export const readFileSync = (): string => "";',
      filename: '/repo/packages/@gateway/node/src/fs/read-file-sync/read-file-sync.ts',
    },
    // --- a non-gateway file is untouched ---
    {
      code: 'export const orderFetchBroker = () => {};',
      filename: '/repo/packages/hooks/src/brokers/order/fetch/order-fetch-broker.ts',
    },
  ],

  invalid: [
    // --- URL and url differ only by case ---
    {
      code: "export * from 'url';",
      filename: '/repo/packages/@gateway/browser/src/URL/URL.ts',
      errors: [
        {
          messageId: 'caseCollision',
          data: {
            folderName: 'URL',
            siblingFolderName: 'url',
            parentDir: '/repo/packages/@gateway/browser/src',
          },
        },
      ],
    },
    // --- the mirror direction reports too, from url's own barrel ---
    {
      code: "export * from 'url';",
      filename: '/repo/packages/@gateway/browser/src/url/url.ts',
      errors: [
        {
          messageId: 'caseCollision',
          data: {
            folderName: 'url',
            siblingFolderName: 'URL',
            parentDir: '/repo/packages/@gateway/browser/src',
          },
        },
      ],
    },
  ],
});
