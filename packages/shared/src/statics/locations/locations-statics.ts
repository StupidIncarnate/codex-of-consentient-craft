/**
 * PURPOSE: Single source of truth for every filename and dirname literal that
 * dungeonmaster code reaches on disk. Grouped by anchor (repo root, dungeonmaster
 * home, guild, quest, user home, hooks, siegelense). Resolver brokers under
 * src/brokers/locations/** compose absolute paths from these constants; lint
 * rules enforce that string values from this module are the only legal
 * location-shape literals in the codebase — repo-wide, across every package, not
 * just the one a value was added for. A value here MUST be a complete filename or
 * dirname, something you would see whole in a directory listing. A bare extension
 * ('.json', '.sock') or a fragment meant only to be concatenated onto something
 * else (a 'step' prefix) is not a name and does not belong here: every other
 * package's own, unrelated use of that same fragment becomes a lint failure the
 * moment it lands. That vocabulary belongs in the owning package's own statics —
 * see packages/siegelense/src/statics/evidence-file/evidence-file-statics.ts for
 * the run/shot/socket extension and prefix fragments siegelense's own resolvers
 * compose onto a run id or step index.
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
    agents: {
      dir: '.agents',
      rulesDir: 'rules',
      skillsJson: 'skills.json',
      hooksJson: 'hooks.json',
      pluginsDir: 'plugins',
      pluginJson: 'plugin.json',
      mcpConfigJson: 'mcp_config.json',
    },
    agentsMd: 'AGENTS.md',
    claudeMd: 'CLAUDE.md',
    tsconfig: 'tsconfig.json',
    eslintConfig: [
      'eslint.config.ts',
      'eslint.config.js',
      'eslint.config.mjs',
      'eslint.config.cjs',
    ],
    nodeModulesBin: 'node_modules/.bin',
    nodeModules: 'node_modules',
    dist: 'dist',
    worktreesDir: 'worktrees',
    dungeonmasterQuests: '.dungeonmaster-quests',
    dungeonmasterDevHome: '.dungeonmaster-dev',
    wardLocalDir: '.ward',
    siegelenseLink: '.siegelense',
  },
  dungeonmasterHome: {
    dir: '.dungeonmaster',
    guildsDir: 'guilds',
    eventOutbox: 'event-outbox.jsonl',
    dispatchState: 'dispatch-state.json',
    dispatchStateTmp: 'dispatch-state.json.tmp',
    guildConfigFile: 'guild.json',
    rateLimitsSnapshot: 'rate-limits.json',
    rateLimitsSnapshotTmp: 'rate-limits.json.tmp',
    usageLedger: 'usage-ledger.json',
    usageLedgerTmp: 'usage-ledger.json.tmp',
    rateLimitsHistory: 'rate-limits-history.jsonl',
  },
  guild: {
    questsDir: 'quests',
  },
  quest: {
    wardResultsDir: 'ward-results',
    riftcarverResultsDir: 'riftcarver-results',
    questFile: 'quest.json',
    imagesDir: 'images',
    plannedWorkDir: 'planned-work',
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
  siegelense: {
    dir: 'siegelense',
    registry: 'registry.json',
    registryTmp: 'registry.json.tmp',
    registryLock: 'registry.lock',
    bootLock: 'boot.lock',
    profilesDir: 'profiles',
    guildsDir: 'guilds',
    instancesDir: 'instances',
    unownedDir: 'unowned',
    heartbeat: 'heartbeat.json',
    apiLog: 'api-server.log',
    webLog: 'web-server.log',
    runsDir: 'runs',
    socketsDirName: 'dm-siege-sockets',
    driverLog: 'driver.log',
    bootFailure: 'boot-failure.json',
    shutdownReason: 'shutdown-reason.json',
    claudeQueueDir: 'claude-queue',
    wardQueueDir: 'ward-queue',
    consoleLog: 'console.jsonl',
    networkLog: 'network.jsonl',
    websocketLog: 'ws.jsonl',
  },
} as const;
