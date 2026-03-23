import { ruleEnforceHarnessPatternsBroker } from './rule-enforce-harness-patterns-broker';
import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('enforce-harness-patterns', ruleEnforceHarnessPatternsBroker(), {
  valid: [
    // Harness returning object from block body
    {
      code: 'export const guildHarness = () => { return { create: () => {} }; };',
      filename: '/project/test/harnesses/guild/guild.harness.ts',
    },

    // Non-harness file is not checked
    {
      code: "import { readFile } from 'fs'; export const helper = () => 'string';",
      filename: '/project/src/brokers/guild/guild-broker.ts',
    },

    // Harness importing from stub file is fine
    {
      code: "import { GuildStub } from '../../src/contracts/guild/guild.stub'; export const guildHarness = () => { return { create: () => GuildStub() }; };",
      filename: '/project/test/harnesses/guild/guild.harness.ts',
    },

    // Type-only contract imports are fine
    {
      code: "import type { Guild } from '../../src/contracts/guild/guild-contract'; export const guildHarness = () => { return { create: () => ({}) }; };",
      filename: '/project/test/harnesses/guild/guild.harness.ts',
    },
  ],

  invalid: [
    // Harness importing proxy file
    {
      code: "import { guildBrokerProxy } from '../../src/brokers/guild/guild-broker.proxy'; export const guildHarness = () => { return { create: () => {} }; };",
      filename: '/project/test/harnesses/guild/guild.harness.ts',
      errors: [{ messageId: 'harnessNoProxyImports' }],
    },

    // Harness importing contract value (not type-only)
    {
      code: "import { guildContract } from '../../src/contracts/guild/guild-contract'; export const guildHarness = () => { return { create: () => {} }; };",
      filename: '/project/test/harnesses/guild/guild.harness.ts',
      errors: [{ messageId: 'harnessNoContractImports' }],
    },

    // Harness not returning object (returns void)
    {
      code: "export const guildHarness = () => { console.log('no return'); };",
      filename: '/project/test/harnesses/guild/guild.harness.ts',
      errors: [{ messageId: 'harnessMustReturnObject' }],
    },
  ],
});
