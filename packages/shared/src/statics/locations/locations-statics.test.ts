import { locationsStatics } from './locations-statics';

describe('locationsStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(locationsStatics).toStrictEqual({
      repoRoot: {
        config: '.dungeonmaster.json',
        mcpJson: '.mcp.json',
        claude: {
          dir: '.claude',
          settings: 'settings.json',
          settingsLocal: 'settings.local.json',
        },
        tsconfig: 'tsconfig.json',
        eslintConfig: [
          'eslint.config.ts',
          'eslint.config.js',
          'eslint.config.mjs',
          'eslint.config.cjs',
        ],
        nodeModulesBin: 'node_modules/.bin',
        dungeonmasterQuests: '.dungeonmaster-quests',
        wardLocalDir: '.ward',
      },
      dungeonmasterHome: {
        dir: '.dungeonmaster',
        guildsDir: 'guilds',
        eventOutbox: 'event-outbox.jsonl',
        guildConfigFile: 'guild.json',
      },
      guild: {
        questsDir: 'quests',
      },
      quest: {
        wardResultsDir: 'ward-results',
        designDir: 'design',
        questFile: 'quest.json',
      },
      userHome: {
        claude: {
          dir: '.claude',
          projectsDir: 'projects',
          subagentsDir: 'subagents',
        },
      },
      hooks: {
        configFiles: [
          '.dungeonmaster-hooks.config.ts',
          '.dungeonmaster-hooks.config.js',
          '.dungeonmaster-hooks.config.mjs',
          '.dungeonmaster-hooks.config.cjs',
        ],
      },
    });
  });
});
