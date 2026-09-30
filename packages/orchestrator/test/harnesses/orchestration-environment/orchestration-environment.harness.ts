/**
 * PURPOSE: Manages environment variable isolation for orchestration integration tests
 *
 * USAGE:
 * const envHarness = orchestrationEnvironmentHarness();
 * const env = envHarness.setup({ tempDir: testbed.guildPath, queueHarness });
 * await envHarness.withRestore(env, async () => { ... });
 */
import { setTimeout } from '#gateway/node/setTimeout';
import { chdir, cwd, deleteEnv, getEnv, setEnv } from '#gateway/node/process';
import * as fs from '#gateway/node/fs';
import { ensureDir, writeFile } from '#gateway/node/fs__promises';
import * as path from '#gateway/node/path';

import type { UrlSlug, Quest, Guild } from '@dungeonmaster/shared/contracts';

import { guildAddBroker } from '../../../src/brokers/guild/add/guild-add-broker';
import { OrchestrationFlow } from '../../../src/flows/orchestration/orchestration-flow';

interface QueueHarness {
  initDirs: (params: { baseDir: string }) => {
    claudeQueueDir: string;
    wardQueueDir: string;
  };
  resetCounters: () => void;
}

const FAKE_CLAUDE_CLI = path.resolve(
  __dirname,
  '../../../../testing/test/harnesses/claude-mock/bin/claude',
);
const FAKE_WARD_BIN_DIR = path.resolve(__dirname, '../../../test-fixtures/fake-ward-bin');
const FAKE_WARD_CLI = path.join(FAKE_WARD_BIN_DIR, 'dungeonmaster-ward');

const GUILD_CONFIG_FILENAME = 'config.json';
const USAGE_LEDGER_FILENAME = 'usage-ledger.json';

// Both files a dungeonmaster home needs before anything reads it. The ledger stamped NOW is what
// makes usageLedgerScanBroker take its throttle path — a fresh directory has none, the default one
// is stamped at the epoch, and every guardrail pass then reads that as a measurement due and walks
// `~/.claude/projects`. That path is a run-wide jest sandbox (`jest.setup-global.js`'s `globalSetup`
// assigns `HOME` once, before any worker forks), shared across every worker and every test file in
// the run — an unthrottled walk here would pick up transcripts other tests' fake Claude CLIs already
// wrote into it, not just spend time reading them.
const seedHomeFiles = ({ homeDir }: { homeDir: string }): void => {
  fs.mkdirSync(homeDir, { recursive: true });
  fs.writeFileSync(path.join(homeDir, GUILD_CONFIG_FILENAME), JSON.stringify({ guilds: [] }));
  fs.writeFileSync(
    path.join(homeDir, USAGE_LEDGER_FILENAME),
    JSON.stringify({
      buckets: {},
      cursors: {},
      ceilings: { fiveHour: null, sevenDay: null },
      updatedAt: new Date().toISOString(),
    }),
  );
};

export const orchestrationEnvironmentHarness = (): {
  beforeEach: () => void;
  afterEach: () => void;
  setupHome: (params: { tempDir: string }) => {
    restore: () => void;
  };
  seedHome: (params: { tempDir: string }) => Promise<void>;
  writeRepoRootMarker: (params: { repoRoot: string }) => Promise<void>;
  seedQuestRepoPackages: (params: {
    repoRoot: string;
    locations: readonly string[];
    sources?: readonly string[];
  }) => Promise<void>;
  chdirInto: (params: { dir: string }) => { restore: () => void };
  makeAndChdir: (params: { dir: string }) => { restore: () => void };
  readConfigGuilds: (params: {
    tempDir: string;
  }) => readonly { name: string; path: string; guildId: Guild['id']; urlSlug: UrlSlug }[];
  questsDirExists: (params: { tempDir: string; guildId: Guild['id'] }) => boolean;
  questFilePersisted: (params: { tempDir: string; guildId: Guild['id']; questId: Quest['id'] }) => {
    exists: boolean;
    questIdInFile: boolean;
  };
  seedRepoRootGuild: (params: { tempDir: string }) => Promise<{ guildPath: string }>;
  setup: (params: { tempDir: string; queueHarness: QueueHarness }) => {
    claudeQueueDir: string;
    wardQueueDir: string;
    restore: () => void;
  };
  withRestore: <T>(env: { restore: () => void }, fn: () => Promise<T>) => Promise<T>;
} => {
  let currentRestore: (() => void) | null = null;

  return {
    beforeEach: (): void => {
      if (currentRestore) {
        try {
          OrchestrationFlow.stopAll();
        } finally {
          currentRestore();
          currentRestore = null;
        }
      }
    },
    afterEach: (): void => {
      if (currentRestore) {
        try {
          OrchestrationFlow.stopAll();
        } finally {
          currentRestore();
          currentRestore = null;
        }
      }
    },
    setupHome: ({ tempDir }: { tempDir: string }): { restore: () => void } => {
      const savedDungeonmasterHome = getEnv('DUNGEONMASTER_HOME');
      setEnv('DUNGEONMASTER_HOME', tempDir);

      seedHomeFiles({ homeDir: tempDir });

      const restore = (): void => {
        if (savedDungeonmasterHome === undefined) {
          deleteEnv('DUNGEONMASTER_HOME');
        } else {
          setEnv('DUNGEONMASTER_HOME', savedDungeonmasterHome);
        }
      };

      currentRestore = restore;

      return { restore };
    },
    // The same files `setupHome` lays down, for a SECOND home the test reaches by handing its path
    // to a broker rather than by pointing DUNGEONMASTER_HOME at it. `config.json` in particular is
    // not optional here: `guildConfigReadBroker`'s ENOENT fallback tests `cause instanceof Error`,
    // and under jest the cause is an `fs/promises` error from outside the sandbox realm, so that
    // check reads false and the read throws instead of defaulting to `{ guilds: [] }`.
    //
    // Async because `ban-sync-seeding-methods` requires it of every `seed*` harness method. The
    // writes stay on the sync `seedHomeFiles` this shares with `setupHome`, which cannot itself
    // become async without changing every caller of the restore handle it returns inline.
    seedHome: async ({ tempDir }: { tempDir: string }): Promise<void> => {
      await Promise.resolve();
      seedHomeFiles({ homeDir: tempDir });
    },
    writeRepoRootMarker: async ({ repoRoot }: { repoRoot: string }): Promise<void> => {
      // Drop a `.dungeonmaster.json` at the repo root so cwdResolveBroker({ kind: 'repo-root' })
      // walking up from cwd() resolves to this directory.
      await ensureDir(repoRoot);
      await writeFile(path.join(repoRoot, '.dungeonmaster.json'), '{}');
    },
    seedQuestRepoPackages: async ({
      repoRoot,
      locations,
      sources = [],
    }: {
      repoRoot: string;
      locations: readonly string[];
      sources?: readonly string[];
    }): Promise<void> => {
      // Makes this testbed dir the repo a hydrated quest targets, holding the package roots that
      // quest declares. The `.dungeonmaster.json` marker pins cwdResolveBroker's walk-up from the
      // guild path here rather than to some ancestor of /tmp, and each declared location is
      // repo-relative to exactly that root — which is where questModifyBroker's write-time
      // existence check for an 'edit' entry looks.
      await ensureDir(repoRoot);
      await writeFile(path.join(repoRoot, '.dungeonmaster.json'), '{}');
      await Promise.all(
        locations.map(async (location) => ensureDir(path.resolve(repoRoot, location))),
      );
      // `sources` are contract source paths the blueprint declares as already existing. They are
      // anchored on the same root for the same reason the locations are: questModifyBroker's
      // Contract Source Resolution check probes `<projectRoot>/<source>`, so a blueprint carrying
      // `status: 'existing'` is only honest in a testbed repo that actually holds the file.
      await Promise.all(
        sources.map(async (source) => {
          const sourcePath = path.resolve(repoRoot, source);
          await ensureDir(path.dirname(sourcePath));
          await writeFile(sourcePath, '');
        }),
      );
    },
    chdirInto: ({ dir }: { dir: string }): { restore: () => void } => {
      // questMcpCreateBroker reads cwd() verbatim via processCwdAdapter; chdir so the
      // real cwd walk-up anchors on this testbed dir, not the host repo.
      const savedCwd = cwd();
      chdir(dir);
      return {
        restore: (): void => {
          chdir(savedCwd);
        },
      };
    },
    makeAndChdir: ({ dir }: { dir: string }): { restore: () => void } => {
      // Create a nested subfolder (so create-quest can run from inside an ancestor guild) and
      // chdir into it; restore the original cwd afterwards.
      const savedCwd = cwd();
      fs.mkdirSync(dir, { recursive: true });
      chdir(dir);
      return {
        restore: (): void => {
          chdir(savedCwd);
        },
      };
    },
    readConfigGuilds: ({
      tempDir,
    }: {
      tempDir: string;
    }): readonly { name: string; path: string; guildId: Guild['id']; urlSlug: UrlSlug }[] => {
      const raw = fs.readFileSync(path.join(tempDir, 'config.json'));
      const parsed = JSON.parse(raw) as {
        guilds: { name: string; path: string; id: Guild['id']; urlSlug: UrlSlug }[];
      };
      return parsed.guilds.map((guild) => ({
        name: guild.name,
        path: guild.path,
        guildId: guild.id,
        urlSlug: guild.urlSlug,
      }));
    },
    questsDirExists: ({ tempDir, guildId }: { tempDir: string; guildId: Guild['id'] }): boolean =>
      fs.existsSync(path.join(tempDir, 'guilds', guildId, 'quests')),
    questFilePersisted: ({
      tempDir,
      guildId,
      questId,
    }: {
      tempDir: string;
      guildId: Guild['id'];
      questId: Quest['id'];
    }): { exists: boolean; questIdInFile: boolean } => {
      const questFilePath = path.join(tempDir, 'guilds', guildId, 'quests', questId, 'quest.json');
      const exists = fs.existsSync(questFilePath);
      const parsed = exists
        ? (JSON.parse(fs.readFileSync(questFilePath)) as { id?: Quest['id'] })
        : { id: undefined };
      return { exists, questIdInFile: parsed.id === questId };
    },
    seedRepoRootGuild: async ({
      tempDir,
    }: {
      tempDir: string;
    }): Promise<{ guildPath: string }> => {
      // Drop a `.dungeonmaster.json` at the testbed dir so cwdResolveBroker({ kind: 'repo-root' })
      // walks up from the home AND from the registered guild.path to the SAME repo root —
      // that's the equality smoketestEnsureGuildBroker requires before returning a guildId.
      fs.writeFileSync(path.join(tempDir, '.dungeonmaster.json'), '{}');
      const guildPath = tempDir;
      await guildAddBroker({
        name: 'codex',
        path: guildPath,
      });
      return { guildPath };
    },

    setup: ({
      tempDir,
      queueHarness,
    }: {
      tempDir: string;
      queueHarness: QueueHarness;
    }): {
      claudeQueueDir: string;
      wardQueueDir: string;
      restore: () => void;
    } => {
      queueHarness.resetCounters();
      const { claudeQueueDir, wardQueueDir } = queueHarness.initDirs({ baseDir: tempDir });

      const savedClaudeCliPath = getEnv('CLAUDE_CLI_PATH');
      const savedFakeClaudeQueueDir = getEnv('FAKE_CLAUDE_QUEUE_DIR');
      const savedFakeWardQueueDir = getEnv('FAKE_WARD_QUEUE_DIR');
      const savedPath = getEnv('PATH');
      const savedDungeonmasterHome = getEnv('DUNGEONMASTER_HOME');
      const savedWardCliPath = getEnv('WARD_CLI_PATH');

      setEnv('CLAUDE_CLI_PATH', FAKE_CLAUDE_CLI);
      setEnv('FAKE_CLAUDE_QUEUE_DIR', String(claudeQueueDir));
      setEnv('FAKE_WARD_QUEUE_DIR', String(wardQueueDir));
      setEnv('PATH', `${FAKE_WARD_BIN_DIR}:${getEnv('PATH') ?? ''}`);
      setEnv('WARD_CLI_PATH', FAKE_WARD_CLI);
      setEnv('DUNGEONMASTER_HOME', tempDir);

      seedHomeFiles({ homeDir: tempDir });

      const restore = (): void => {
        if (savedClaudeCliPath === undefined) {
          deleteEnv('CLAUDE_CLI_PATH');
        } else {
          setEnv('CLAUDE_CLI_PATH', savedClaudeCliPath);
        }
        if (savedFakeClaudeQueueDir === undefined) {
          deleteEnv('FAKE_CLAUDE_QUEUE_DIR');
        } else {
          setEnv('FAKE_CLAUDE_QUEUE_DIR', savedFakeClaudeQueueDir);
        }
        if (savedFakeWardQueueDir === undefined) {
          deleteEnv('FAKE_WARD_QUEUE_DIR');
        } else {
          setEnv('FAKE_WARD_QUEUE_DIR', savedFakeWardQueueDir);
        }
        if (savedPath === undefined) {
          deleteEnv('PATH');
        } else {
          setEnv('PATH', savedPath);
        }
        if (savedWardCliPath === undefined) {
          deleteEnv('WARD_CLI_PATH');
        } else {
          setEnv('WARD_CLI_PATH', savedWardCliPath);
        }
        if (savedDungeonmasterHome === undefined) {
          deleteEnv('DUNGEONMASTER_HOME');
        } else {
          setEnv('DUNGEONMASTER_HOME', savedDungeonmasterHome);
        }
      };

      currentRestore = restore;

      return { claudeQueueDir, wardQueueDir, restore };
    },

    withRestore: async <T>(env: { restore: () => void }, fn: () => Promise<T>): Promise<T> => {
      try {
        return await fn();
      } finally {
        OrchestrationFlow.stopAll();
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 250);
        });
        env.restore();
      }
    },
  };
};
