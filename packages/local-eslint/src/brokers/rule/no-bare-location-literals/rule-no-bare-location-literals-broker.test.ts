import { ruleNoBareLocationLiteralsBroker } from './rule-no-bare-location-literals-broker';
import { eslintRuleTesterAdapter } from '@dungeonmaster/eslint-plugin';

const ruleTester = eslintRuleTesterAdapter();

// Virtual fixture paths — RuleTester does NOT read these off disk; it only uses them as the
// "filename" key on each test case so path-based allowlist logic works.
const productionFixture = '/repo/packages/web/src/widgets/foo/foo-widget.ts';
const allowlistedLocationsStaticsFixture =
  '/repo/packages/shared/src/statics/locations/locations-statics.ts';
const allowlistedLocationsBrokerFixture =
  '/repo/packages/shared/src/brokers/locations/mcp-json-path-find/mcp-json-path-find-broker.ts';
const allowlistedTestFixture = '/repo/packages/web/src/widgets/foo/foo-widget.test.ts';
const allowlistedHarnessFixture = '/repo/packages/web/test/harnesses/quest/quest.harness.ts';

ruleTester.run('no-bare-location-literals', ruleNoBareLocationLiteralsBroker(), {
  valid: [
    // === ALLOWLIST: locations statics file can contain raw literals ===
    {
      code: "const x = '.mcp.json';",
      filename: allowlistedLocationsStaticsFixture,
    },
    // === ALLOWLIST: locations resolver broker can contain raw literals ===
    {
      code: "const x = '.mcp.json';",
      filename: allowlistedLocationsBrokerFixture,
    },
    // === ALLOWLIST: test files can contain raw literals ===
    {
      code: "const x = '.mcp.json';",
      filename: allowlistedTestFixture,
    },
    // === ALLOWLIST: harness files can contain raw literals ===
    {
      code: "const x = 'guild.json';",
      filename: allowlistedHarnessFixture,
    },

    // === PRODUCTION: short generic word 'design' (length 6) is NOT flagged (filter excludes) ===
    {
      code: "const x = 'design';",
      filename: productionFixture,
    },
    // === PRODUCTION: short generic word 'guilds' (length 6) is NOT flagged ===
    {
      code: "const x = 'guilds';",
      filename: productionFixture,
    },
    // === PRODUCTION: short generic word 'quests' (length 6) is NOT flagged ===
    {
      code: "const x = 'quests';",
      filename: productionFixture,
    },
    // === PRODUCTION: unrelated literal not in locationsStatics is not flagged ===
    {
      code: "const x = 'arbitrary-other-literal';",
      filename: productionFixture,
    },
  ],

  invalid: [
    // === PRODUCTION: '.mcp.json' raw literal in app code ===
    {
      code: "const x = '.mcp.json';",
      filename: productionFixture,
      errors: [
        {
          messageId: 'bareLocationLiteral',
          data: { literal: '.mcp.json', keyPath: 'locationsStatics.repoRoot.mcpJson' },
        },
      ],
    },
    // === PRODUCTION: 'guild.json' (contains dot, length 10) in app code ===
    {
      code: "const x = 'guild.json';",
      filename: productionFixture,
      errors: [
        {
          messageId: 'bareLocationLiteral',
          data: {
            literal: 'guild.json',
            keyPath: 'locationsStatics.dungeonmasterHome.guildConfigFile',
          },
        },
      ],
    },
    // === PRODUCTION: 'event-outbox.jsonl' raw literal ===
    {
      code: "const x = 'event-outbox.jsonl';",
      filename: productionFixture,
      errors: [
        {
          messageId: 'bareLocationLiteral',
          data: {
            literal: 'event-outbox.jsonl',
            keyPath: 'locationsStatics.dungeonmasterHome.eventOutbox',
          },
        },
      ],
    },
    // === PRODUCTION: 'subagents' (length 9, retained because >= 8) ===
    {
      code: "const x = 'subagents';",
      filename: productionFixture,
      errors: [
        {
          messageId: 'bareLocationLiteral',
          data: { literal: 'subagents', keyPath: 'locationsStatics.userHome.claude.subagentsDir' },
        },
      ],
    },
    // === PRODUCTION: array literal members are walked ===
    {
      code: "const arr = ['eslint.config.ts'];",
      filename: productionFixture,
      errors: [
        {
          messageId: 'bareLocationLiteral',
          data: {
            literal: 'eslint.config.ts',
            keyPath: 'locationsStatics.repoRoot.eslintConfig[0]',
          },
        },
      ],
    },
  ],
});
