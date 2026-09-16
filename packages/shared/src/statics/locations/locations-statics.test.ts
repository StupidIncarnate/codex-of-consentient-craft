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
        designDir: 'design',
        questFile: 'quest.json',
        imagesDir: 'images',
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
    });
  });
});
