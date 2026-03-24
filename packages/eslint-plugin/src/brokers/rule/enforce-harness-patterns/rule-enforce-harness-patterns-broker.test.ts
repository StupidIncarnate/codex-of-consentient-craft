import { ruleEnforceHarnessPatternsBroker } from './rule-enforce-harness-patterns-broker';
import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('enforce-harness-patterns', ruleEnforceHarnessPatternsBroker(), {
  valid: [
    // --- Factory returning object from block body ---
    {
      code: 'export const guildHarness = () => { return { create: () => {}, clean: () => {} }; };',
      filename: '/project/test/harnesses/guild/guild.harness.ts',
    },

    // --- Factory returning object from expression body ---
    {
      code: 'export const guildHarness = () => ({ create: () => {}, clean: () => {} });',
      filename: '/project/test/harnesses/guild/guild.harness.ts',
    },

    // --- Non-harness files are not checked at all ---
    {
      code: "import { readFile } from 'fs'; export const helper = () => 'string';",
      filename: '/project/src/brokers/guild/guild-broker.ts',
    },
    {
      code: "import { guildProxy } from './guild-broker.proxy'; export const test = () => {};",
      filename: '/project/src/brokers/guild/guild-broker.test.ts',
    },
    {
      code: "import { guildContract } from '../contracts/guild/guild-contract';",
      filename: '/project/e2e/web/smoke.spec.ts',
    },
    {
      code: "import { guildContract } from '../contracts/guild/guild-contract';",
      filename: '/project/src/flows/guild/guild-flow.integration.test.ts',
    },

    // --- Harness importing from stub file is fine ---
    {
      code: "import { GuildStub } from '@dungeonmaster/shared/contracts'; export const guildHarness = () => { return { create: () => GuildStub() }; };",
      filename: '/project/test/harnesses/guild/guild.harness.ts',
    },
    {
      code: "import { QuestStub } from '../../src/contracts/quest/quest.stub'; export const questHarness = () => { return { create: () => QuestStub() }; };",
      filename: '/project/test/harnesses/quest/quest.harness.ts',
    },

    // --- Type-only contract imports are fine ---
    {
      code: "import type { Guild } from '../../src/contracts/guild/guild-contract'; export const guildHarness = () => { return { create: () => ({}) }; };",
      filename: '/project/test/harnesses/guild/guild.harness.ts',
    },
    {
      code: "import type { Quest } from '@dungeonmaster/shared/contracts'; export const questHarness = () => { return { create: () => ({}) }; };",
      filename: '/project/test/harnesses/quest/quest.harness.ts',
    },

    // --- Harness importing node builtins is fine (harnesses CAN use fs/path/os) ---
    {
      code: "import * as fs from 'fs'; import * as path from 'path'; export const sessionHarness = () => { return { createFile: () => {} }; };",
      filename: '/project/test/harnesses/session/session.harness.ts',
    },

    // --- Harness importing another harness is fine ---
    {
      code: "import { guildHarness } from '../guild/guild.harness'; export const questHarness = () => { return { create: () => {} }; };",
      filename: '/project/test/harnesses/quest/quest.harness.ts',
    },

    // --- Async factory is fine ---
    {
      code: 'export const environmentHarness = async () => { return { setup: () => {}, restore: () => {} }; };',
      filename: '/project/test/harnesses/environment/environment.harness.ts',
    },

    // --- Factory with parameters is fine ---
    {
      code: 'export const claudeMockHarness = ({ queueDir }: { queueDir: string }) => { return { queue: () => {}, clear: () => {} }; };',
      filename: '/project/test/harnesses/claude-mock/claude-mock.harness.ts',
    },

    // --- Harness with beforeEach in constructor is fine ---
    {
      code: 'export const guildHarness = () => { beforeEach(() => {}); return { create: () => {} }; };',
      filename: '/project/test/harnesses/guild/guild.harness.ts',
    },

    // --- Harness with afterEach in constructor is fine ---
    {
      code: 'export const guildHarness = () => { afterEach(() => {}); return { create: () => {} }; };',
      filename: '/project/test/harnesses/guild/guild.harness.ts',
    },

    // --- Harness with fs.mkdirSync in constructor is fine ---
    {
      code: "export const envHarness = () => { fs.mkdirSync('/tmp/test', { recursive: true }); return { setup: () => {} }; };",
      filename: '/project/test/harnesses/environment/environment.harness.ts',
    },

    // --- Harness with jest.spyOn in constructor is fine ---
    {
      code: "export const envHarness = () => { jest.spyOn(process, 'env'); return { setup: () => {} }; };",
      filename: '/project/test/harnesses/environment/environment.harness.ts',
    },

    // --- Harness with child harness call in constructor is fine ---
    {
      code: 'export const questHarness = () => { guildHarness(); return { create: () => {} }; };',
      filename: '/project/test/harnesses/quest/quest.harness.ts',
    },

    // --- Harness with os.tmpdir() in constructor is fine ---
    {
      code: 'export const envHarness = () => { os.tmpdir(); return { setup: () => {} }; };',
      filename: '/project/test/harnesses/environment/environment.harness.ts',
    },

    // --- Harness with beforeAll() in constructor is fine ---
    {
      code: 'export const guildHarness = () => { beforeAll(() => {}); return { create: () => {} }; };',
      filename: '/project/test/harnesses/guild/guild.harness.ts',
    },

    // --- Harness with const dir = path.join(...) in constructor is fine ---
    {
      code: "export const envHarness = () => { const dir = path.join('/tmp', 'test'); return { setup: () => {} }; };",
      filename: '/project/test/harnesses/environment/environment.harness.ts',
    },
  ],

  invalid: [
    // --- Harness importing proxy file (relative path) ---
    {
      code: "import { guildBrokerProxy } from '../../src/brokers/guild/guild-broker.proxy'; export const guildHarness = () => { return { create: () => {} }; };",
      filename: '/project/test/harnesses/guild/guild.harness.ts',
      errors: [{ messageId: 'harnessNoProxyImports' }],
    },

    // --- Harness importing proxy file (.proxy.ts extension) ---
    {
      code: "import { questProxy } from '../../src/brokers/quest/quest-broker.proxy.ts'; export const questHarness = () => { return { create: () => {} }; };",
      filename: '/project/test/harnesses/quest/quest.harness.ts',
      errors: [{ messageId: 'harnessNoProxyImports' }],
    },

    // --- Harness importing contract value (relative path) ---
    {
      code: "import { guildContract } from '../../src/contracts/guild/guild-contract'; export const guildHarness = () => { return { create: () => {} }; };",
      filename: '/project/test/harnesses/guild/guild.harness.ts',
      errors: [{ messageId: 'harnessNoContractImports' }],
    },

    // --- Harness importing both proxy and contract (multiple violations) ---
    {
      code: "import { guildProxy } from '../../src/brokers/guild/guild-broker.proxy'; import { guildContract } from '../../src/contracts/guild/guild-contract'; export const guildHarness = () => { return { create: () => {} }; };",
      filename: '/project/test/harnesses/guild/guild.harness.ts',
      errors: [{ messageId: 'harnessNoProxyImports' }, { messageId: 'harnessNoContractImports' }],
    },

    // --- Harness importing contract value via scoped package path ---
    {
      code: "import { questContract } from '@dungeonmaster/shared/contracts/quest/quest-contract'; export const questHarness = () => { return { create: () => {} }; };",
      filename: '/project/test/harnesses/quest/quest.harness.ts',
      errors: [{ messageId: 'harnessNoContractImports' }],
    },

    // --- Harness not returning object (returns void / no return) ---
    {
      code: "export const guildHarness = () => { console.log('no return'); };",
      filename: '/project/test/harnesses/guild/guild.harness.ts',
      errors: [{ messageId: 'harnessMustReturnObject' }],
    },

    // --- Harness returning string from expression body ---
    {
      code: "export const guildHarness = () => 'not an object';",
      filename: '/project/test/harnesses/guild/guild.harness.ts',
      errors: [{ messageId: 'harnessMustReturnObject' }],
    },

    // --- Harness returning array from block body ---
    {
      code: 'export const guildHarness = () => { return [1, 2, 3]; };',
      filename: '/project/test/harnesses/guild/guild.harness.ts',
      errors: [{ messageId: 'harnessMustReturnObject' }],
    },

    // --- Harness returning number ---
    {
      code: 'export const guildHarness = () => { return 42; };',
      filename: '/project/test/harnesses/guild/guild.harness.ts',
      errors: [{ messageId: 'harnessMustReturnObject' }],
    },

    // --- Harness with database.connect() side effect in constructor ---
    {
      code: 'export const guildHarness = () => { database.connect(); return { create: () => {} }; };',
      filename: '/project/test/harnesses/guild/guild.harness.ts',
      errors: [{ messageId: 'harnessConstructorNoSideEffects' }],
    },

    // --- Harness with bare someRandomFunction() side effect in constructor ---
    {
      code: 'export const guildHarness = () => { someRandomFunction(); return { create: () => {} }; };',
      filename: '/project/test/harnesses/guild/guild.harness.ts',
      errors: [{ messageId: 'harnessConstructorNoSideEffects' }],
    },

    // --- Harness with process.env.FOO = 'bar' assignment in constructor ---
    {
      code: "export const envHarness = () => { process.env.FOO = 'bar'; return { setup: () => {} }; };",
      filename: '/project/test/harnesses/environment/environment.harness.ts',
      errors: [{ messageId: 'harnessConstructorNoSideEffects' }],
    },
  ],
});
