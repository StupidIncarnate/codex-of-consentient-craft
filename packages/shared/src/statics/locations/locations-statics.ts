/**
 * PURPOSE: Single source of truth for every filename and dirname literal that
 * dungeonmaster code reaches on disk. Grouped by anchor (repo root, dungeonmaster
 * home, guild, quest, user home, hooks). Resolver brokers under
 * src/brokers/locations/** compose absolute paths from these constants; lint
 * rules enforce that string values from this module are the only legal
 * location-shape literals in the codebase.
 *
 * USAGE:
 * locationsStatics.repoRoot.config;
 * // Returns '.dungeonmaster.json'
 *
 * locationsStatics.dungeonmasterHome.eventOutbox;
 * // Returns 'event-outbox.jsonl'
 */

export const locationsStatics = {
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
    rateLimitsSnapshot: 'rate-limits.json',
    rateLimitsSnapshotTmp: 'rate-limits.json.tmp',
    rateLimitsHistory: 'rate-limits-history.jsonl',
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
} as const;
