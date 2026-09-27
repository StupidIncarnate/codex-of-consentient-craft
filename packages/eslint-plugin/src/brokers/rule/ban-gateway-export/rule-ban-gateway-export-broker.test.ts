import { ruleBanGatewayExportBroker } from './rule-ban-gateway-export-broker';
import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { GatewayLintConfigStub } from '@dungeonmaster/shared/contracts';

const ruleTester = eslintRuleTesterAdapter();

const bannedExportsOption = GatewayLintConfigStub({
  bannedExports: [
    {
      subpath: '#gateway/node/fs',
      name: 'readFileSync',
      use: 'readFile',
      reason: 'blocks the event loop',
    },
  ],
});

ruleTester.run('ban-gateway-export', ruleBanGatewayExportBroker(), {
  valid: [
    // --- no options configured: nothing is banned ---
    {
      code: "import { readFileSync } from '#gateway/node/fs';",
      filename: '/repo/packages/hooks/src/brokers/x/x-broker.ts',
    },
    // --- a different name from the same banned subpath is untouched ---
    {
      code: "import { readFile } from '#gateway/node/fs';",
      filename: '/repo/packages/hooks/src/brokers/x/x-broker.ts',
      options: [bannedExportsOption],
    },
    // --- the banned name from an unrelated subpath is untouched ---
    {
      code: "import { readFileSync } from '#gateway/node/other';",
      filename: '/repo/packages/hooks/src/brokers/x/x-broker.ts',
      options: [bannedExportsOption],
    },
  ],

  invalid: [
    {
      code: "import { readFileSync } from '#gateway/node/fs';",
      filename: '/repo/packages/hooks/src/brokers/x/x-broker.ts',
      options: [bannedExportsOption],
      errors: [
        {
          messageId: 'bannedExport',
          data: {
            name: 'readFileSync',
            subpath: '#gateway/node/fs',
            use: 'readFile',
            reason: 'blocks the event loop',
          },
        },
      ],
    },
    // --- a renamed local binding still reports on the IMPORTED name, not the local alias ---
    {
      code: "import { readFileSync as rfs } from '#gateway/node/fs';",
      filename: '/repo/packages/hooks/src/brokers/x/x-broker.ts',
      options: [bannedExportsOption],
      errors: [
        {
          messageId: 'bannedExport',
          data: {
            name: 'readFileSync',
            subpath: '#gateway/node/fs',
            use: 'readFile',
            reason: 'blocks the event loop',
          },
        },
      ],
    },
    // --- two banned names imported side by side both report ---
    {
      code: "import { readFileSync, writeFileSync } from '#gateway/node/fs';",
      filename: '/repo/packages/hooks/src/brokers/x/x-broker.ts',
      options: [
        GatewayLintConfigStub({
          bannedExports: [
            ...(bannedExportsOption.bannedExports ?? []),
            {
              subpath: '#gateway/node/fs',
              name: 'writeFileSync',
              use: 'writeFile',
              reason: 'blocks the event loop',
            },
          ],
        }),
      ],
      errors: [{ messageId: 'bannedExport' }, { messageId: 'bannedExport' }],
    },
  ],
});
