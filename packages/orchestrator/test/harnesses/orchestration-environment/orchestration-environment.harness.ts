/**
 * PURPOSE: Manages environment variable isolation for orchestration integration tests
 *
 * USAGE:
 * const envHarness = orchestrationEnvironmentHarness();
 * const env = envHarness.setup({ tempDir: testbed.guildPath, queueHarness });
 * await envHarness.withRestore(env, async () => { ... });
 */
import * as fs from 'fs';
import * as path from 'path';

import { GuildNameStub, guildPathContract } from '@dungeonmaster/shared/contracts';
import type { FilePath, GuildPath } from '@dungeonmaster/shared/contracts';

import { guildAddBroker } from '../../../src/brokers/guild/add/guild-add-broker';
import { OrchestrationFlow } from '../../../src/flows/orchestration/orchestration-flow';

interface QueueHarness {
  createDirs: (params: { baseDir: GuildPath }) => {
    claudeQueueDir: FilePath;
    wardQueueDir: FilePath;
  };
  resetCounters: () => void;
}

const FAKE_CLAUDE_CLI = path.resolve(
  __dirname,
  '../../../../testing/test/harnesses/claude-mock/bin/claude',
);
const FAKE_WARD_BIN_DIR = path.resolve(__dirname, '../../../test-fixtures/fake-ward-bin');
const FAKE_WARD_CLI = path.join(FAKE_WARD_BIN_DIR, 'dungeonmaster-ward');

export const orchestrationEnvironmentHarness = (): {
  beforeEach: () => void;
  afterEach: () => void;
  setupHome: (params: { tempDir: GuildPath }) => {
    restore: () => void;
  };
  seedRepoRootGuild: (params: { tempDir: GuildPath }) => Promise<{ guildPath: GuildPath }>;
  setup: (params: { tempDir: GuildPath; queueHarness: QueueHarness }) => {
    claudeQueueDir: FilePath;
    wardQueueDir: FilePath;
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
    setupHome: ({ tempDir }: { tempDir: GuildPath }): { restore: () => void } => {
      const savedDungeonmasterHome = process.env.DUNGEONMASTER_HOME;
      process.env.DUNGEONMASTER_HOME = tempDir;

      fs.mkdirSync(tempDir, { recursive: true });
      fs.writeFileSync(path.join(tempDir, 'config.json'), JSON.stringify({ guilds: [] }));

      const restore = (): void => {
        if (savedDungeonmasterHome === undefined) {
          Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');
        } else {
          process.env.DUNGEONMASTER_HOME = savedDungeonmasterHome;
        }
      };

      currentRestore = restore;

      return { restore };
    },
    seedRepoRootGuild: async ({
      tempDir,
    }: {
      tempDir: GuildPath;
    }): Promise<{ guildPath: GuildPath }> => {
      // Drop a `.dungeonmaster.json` at the testbed dir so cwdResolveBroker({ kind: 'repo-root' })
      // walks up from the home AND from the registered guild.path to the SAME repo root —
      // that's the equality smoketestEnsureGuildBroker requires before returning a guildId.
      fs.writeFileSync(path.join(tempDir, '.dungeonmaster.json'), '{}');
      const guildPath = guildPathContract.parse(tempDir);
      await guildAddBroker({
        name: GuildNameStub({ value: 'codex' }),
        path: guildPath,
      });
      return { guildPath };
    },

    setup: ({
      tempDir,
      queueHarness,
    }: {
      tempDir: GuildPath;
      queueHarness: QueueHarness;
    }): {
      claudeQueueDir: FilePath;
      wardQueueDir: FilePath;
      restore: () => void;
    } => {
      queueHarness.resetCounters();
      const { claudeQueueDir, wardQueueDir } = queueHarness.createDirs({ baseDir: tempDir });

      const savedClaudeCliPath = process.env.CLAUDE_CLI_PATH;
      const savedFakeClaudeQueueDir = process.env.FAKE_CLAUDE_QUEUE_DIR;
      const savedFakeWardQueueDir = process.env.FAKE_WARD_QUEUE_DIR;
      const savedPath = process.env.PATH;
      const savedDungeonmasterHome = process.env.DUNGEONMASTER_HOME;
      const savedWardCliPath = process.env.WARD_CLI_PATH;

      process.env.CLAUDE_CLI_PATH = FAKE_CLAUDE_CLI;
      process.env.FAKE_CLAUDE_QUEUE_DIR = String(claudeQueueDir);
      process.env.FAKE_WARD_QUEUE_DIR = String(wardQueueDir);
      process.env.PATH = `${FAKE_WARD_BIN_DIR}:${process.env.PATH ?? ''}`;
      process.env.WARD_CLI_PATH = FAKE_WARD_CLI;
      process.env.DUNGEONMASTER_HOME = tempDir;

      fs.mkdirSync(tempDir, { recursive: true });
      fs.writeFileSync(path.join(tempDir, 'config.json'), JSON.stringify({ guilds: [] }));

      const restore = (): void => {
        process.env.CLAUDE_CLI_PATH = savedClaudeCliPath;
        process.env.FAKE_CLAUDE_QUEUE_DIR = savedFakeClaudeQueueDir;
        process.env.FAKE_WARD_QUEUE_DIR = savedFakeWardQueueDir;
        process.env.PATH = savedPath;
        if (savedWardCliPath === undefined) {
          Reflect.deleteProperty(process.env, 'WARD_CLI_PATH');
        } else {
          process.env.WARD_CLI_PATH = savedWardCliPath;
        }
        if (savedDungeonmasterHome === undefined) {
          Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');
        } else {
          process.env.DUNGEONMASTER_HOME = savedDungeonmasterHome;
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
