import { ruleEnforceGatewayRestrictedToBroker } from './rule-enforce-gateway-restricted-to-broker';
import { ruleTesterHarness } from '../../../../test/harnesses/rule-tester/rule-tester.harness';
import { GatewayLintConfigStub } from '@dungeonmaster/shared/contracts/gateway-lint-config/gateway-lint-config.stub';

const ruleTester = ruleTesterHarness();

const wholeSubpathOption = GatewayLintConfigStub({
  restrictedTo: [
    {
      subpath: '#gateway/bin/spawn',
      packages: ['@dungeonmaster/orchestrator'],
      reason: 'only orchestrator spawns',
    },
  ],
});

const namedExportOption = GatewayLintConfigStub({
  restrictedTo: [
    {
      subpath: '#gateway/npm/testing-library__react',
      name: 'render',
      packages: ['@dungeonmaster/testing'],
      reason: 'wrap it in @dungeonmaster/testing render',
    },
  ],
});

ruleTester.run('enforce-gateway-restricted-to', ruleEnforceGatewayRestrictedToBroker(), {
  valid: [
    // --- no options configured: nothing is restricted ---
    {
      code: "import { spawn } from '#gateway/bin/spawn';",
      filename: '/repo/packages/hooks/src/brokers/x/x-broker.ts',
    },
    // --- the allowed package may import the whole restricted subpath ---
    {
      code: "import { spawn } from '#gateway/bin/spawn';",
      filename: '/repo/packages/orchestrator/src/brokers/x/x-broker.ts',
      options: [wholeSubpathOption],
    },
    // --- an unrelated subpath from the same options is untouched ---
    {
      code: "import { glob } from '#gateway/npm/glob';",
      filename: '/repo/packages/hooks/src/brokers/x/x-broker.ts',
      options: [wholeSubpathOption],
    },
    // --- the allowed package may import the named restricted export ---
    {
      code: "import { render } from '#gateway/npm/testing-library__react';",
      filename: '/repo/packages/testing/src/brokers/x/x-broker.ts',
      options: [namedExportOption],
    },
    // --- a different named import from the same restricted subpath is untouched ---
    {
      code: "import { screen } from '#gateway/npm/testing-library__react';",
      filename: '/repo/packages/web/src/brokers/x/x-broker.ts',
      options: [namedExportOption],
    },
  ],

  invalid: [
    {
      code: "import { spawn } from '#gateway/bin/spawn';",
      filename: '/repo/packages/hooks/src/brokers/x/x-broker.ts',
      options: [wholeSubpathOption],
      errors: [
        {
          messageId: 'restrictedSubpath',
          data: {
            subpath: '#gateway/bin/spawn',
            packages: '@dungeonmaster/orchestrator',
            ownPackage: 'hooks',
            reason: 'only orchestrator spawns',
          },
        },
      ],
    },
    {
      code: "import { render } from '#gateway/npm/testing-library__react';",
      filename: '/repo/packages/web/src/brokers/x/x-broker.ts',
      options: [namedExportOption],
      errors: [
        {
          messageId: 'restrictedExport',
          data: {
            name: 'render',
            subpath: '#gateway/npm/testing-library__react',
            packages: '@dungeonmaster/testing',
            ownPackage: 'web',
            reason: 'wrap it in @dungeonmaster/testing render',
          },
        },
      ],
    },
    // --- a gateway package itself, outside the allowed list, still reports ---
    {
      code: "import { spawn } from '#gateway/bin/spawn';",
      filename: '/repo/packages/@gateway/node/src/some-wrapper/some-wrapper.ts',
      options: [wholeSubpathOption],
      errors: [
        {
          messageId: 'restrictedSubpath',
          data: {
            subpath: '#gateway/bin/spawn',
            packages: '@dungeonmaster/orchestrator',
            ownPackage: 'node',
            reason: 'only orchestrator spawns',
          },
        },
      ],
    },
  ],
});
