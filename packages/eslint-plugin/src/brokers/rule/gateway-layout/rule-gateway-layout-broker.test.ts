import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { ruleGatewayLayoutBroker } from './rule-gateway-layout-broker';
import { ruleGatewayLayoutBrokerProxy } from './rule-gateway-layout-broker.proxy';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { FileNameStub } from '../../../contracts/file-name/file-name.stub';

const ruleTester = eslintRuleTesterAdapter();

beforeEach(() => {
  const proxy = ruleGatewayLayoutBrokerProxy();

  proxy.fsReaddirSync.returns({
    dirPath: FilePathStub({ value: '/repo/packages/@gateway/node/src' }),
    entries: [
      { name: FileNameStub({ value: 'fs' }), isDirectory: true },
      { name: FileNameStub({ value: 'buffer' }), isDirectory: true },
      { name: FileNameStub({ value: 'process' }), isDirectory: true },
      { name: FileNameStub({ value: 'jest.config.js' }), isDirectory: false },
    ],
  });
  proxy.fsReaddirSync.returns({
    dirPath: FilePathStub({ value: '/repo/packages/@gateway/node/src/fs' }),
    entries: [{ name: FileNameStub({ value: 'promises' }), isDirectory: true }],
  });
  proxy.fsReaddirSync.returns({
    dirPath: FilePathStub({ value: '/repo/packages/@gateway/browser/src' }),
    entries: [
      { name: FileNameStub({ value: 'URL' }), isDirectory: true },
      { name: FileNameStub({ value: 'url' }), isDirectory: true },
    ],
  });
  proxy.fsReaddirSync.returns({
    dirPath: FilePathStub({ value: '/repo/packages/@gateway/bin/src' }),
    entries: [{ name: FileNameStub({ value: 'git' }), isDirectory: true }],
  });
});

ruleTester.run('gateway-layout', ruleGatewayLayoutBroker(), {
  valid: [
    // --- no colliding sibling: fs, buffer and process all differ beyond case ---
    {
      code: "export { readFileSync } from './read-file-sync';",
      filename: '/repo/packages/@gateway/node/src/fs/index.ts',
    },
    // --- a nested subpath folder (fs/promises) with no colliding sibling ---
    {
      code: "export { readFile } from './read-file';",
      filename: '/repo/packages/@gateway/node/src/fs/promises/index.ts',
    },
    // --- a non-index file inside the same folder is not itself checked ---
    {
      code: 'export const readFileSync = (): string => "";',
      filename: '/repo/packages/@gateway/node/src/fs/read-file-sync.ts',
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
      filename: '/repo/packages/@gateway/browser/src/URL/index.ts',
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
    // --- the mirror direction reports too, from url's own index.ts ---
    {
      code: "export * from 'url';",
      filename: '/repo/packages/@gateway/browser/src/url/index.ts',
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
