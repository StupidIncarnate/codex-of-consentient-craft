import { ruleEnforceGatewayConfigNamesExistBroker } from './rule-enforce-gateway-config-names-exist-broker';
import { ruleEnforceGatewayConfigNamesExistBrokerProxy } from './rule-enforce-gateway-config-names-exist-broker.proxy';
import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { GatewayLintConfigStub } from '../../../contracts/gateway-lint-config/gateway-lint-config.stub';

const ruleTester = eslintRuleTesterAdapter();

const ANCHOR_FILE =
  '/repo/packages/config/src/contracts/dungeonmaster-config/dungeonmaster-config-contract.ts';
const OTHER_FILE = '/repo/packages/hooks/src/brokers/x/x-broker.ts';

beforeEach(() => {
  const proxy = ruleEnforceGatewayConfigNamesExistBrokerProxy();

  proxy.setupWorkspaceRoot({
    rootDir: '/repo',
    packageNames: ['@dungeonmaster/orchestrator', '@dungeonmaster/hooks'],
  });
  proxy.setupBarrelExists({
    barrelPath: '/repo/packages/@gateway/node/src/fs/fs.ts',
    sourceText: "export { readFileSync } from './read-file-sync/read-file-sync';\n",
  });
});

const realEntryOption = GatewayLintConfigStub({
  bannedExports: [
    { subpath: '#gateway/node/fs', name: 'readFileSync', use: 'readFile', reason: 'sync' },
  ],
});

ruleTester.run('enforce-gateway-config-names-exist', ruleEnforceGatewayConfigNamesExistBroker(), {
  valid: [
    // --- no options configured: nothing to check ---
    { code: 'export const x = 1;', filename: ANCHOR_FILE },
    // --- options configured, but this is not the anchor file: rule stays silent ---
    { code: 'export const x = 1;', filename: OTHER_FILE, options: [realEntryOption] },
    // --- anchor file, every subpath/name/package is real ---
    { code: 'export const x = 1;', filename: ANCHOR_FILE, options: [realEntryOption] },
    {
      code: 'export const x = 1;',
      filename: ANCHOR_FILE,
      options: [
        GatewayLintConfigStub({
          restrictedTo: [
            {
              subpath: '#gateway/node/fs',
              packages: ['@dungeonmaster/orchestrator'],
              reason: 'why',
            },
          ],
        }),
      ],
    },
  ],

  invalid: [
    // --- bannedExports subpath is not a real gateway subpath ---
    {
      code: 'export const x = 1;',
      filename: ANCHOR_FILE,
      options: [
        GatewayLintConfigStub({
          bannedExports: [
            { subpath: '#gateway/node/renamed-away', name: 'x', use: 'y', reason: 'z' },
          ],
        }),
      ],
      errors: [{ messageId: 'unknownSubpath', data: { subpath: '#gateway/node/renamed-away' } }],
    },
    // --- bannedExports subpath is real, but the name is not a real export of it ---
    {
      code: 'export const x = 1;',
      filename: ANCHOR_FILE,
      options: [
        GatewayLintConfigStub({
          bannedExports: [
            { subpath: '#gateway/node/fs', name: 'renamedAway', use: 'y', reason: 'z' },
          ],
        }),
      ],
      errors: [
        {
          messageId: 'unknownName',
          data: { name: 'renamedAway', subpath: '#gateway/node/fs' },
        },
      ],
    },
    // --- restrictedTo subpath is not a real gateway subpath ---
    {
      code: 'export const x = 1;',
      filename: ANCHOR_FILE,
      options: [
        GatewayLintConfigStub({
          restrictedTo: [
            {
              subpath: '#gateway/node/renamed-away',
              packages: ['@dungeonmaster/orchestrator'],
              reason: 'z',
            },
          ],
        }),
      ],
      errors: [{ messageId: 'unknownSubpath', data: { subpath: '#gateway/node/renamed-away' } }],
    },
    // --- restrictedTo names a package that is not a real workspace package ---
    {
      code: 'export const x = 1;',
      filename: ANCHOR_FILE,
      options: [
        GatewayLintConfigStub({
          restrictedTo: [
            { subpath: '#gateway/node/fs', packages: ['@dungeonmaster/not-real'], reason: 'z' },
          ],
        }),
      ],
      errors: [
        {
          messageId: 'unknownPackage',
          data: { packageName: '@dungeonmaster/not-real', subpath: '#gateway/node/fs' },
        },
      ],
    },
  ],
});
