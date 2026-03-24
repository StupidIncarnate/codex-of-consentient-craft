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

import type { FilePath, GuildPath } from '@dungeonmaster/shared/contracts';
import { environmentStatics } from '@dungeonmaster/shared/statics';

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
  '../../../../testing/e2e/web/harness/claude-mock/bin/claude',
);
const FAKE_WARD_BIN_DIR = path.resolve(__dirname, '../../../test-fixtures/fake-ward-bin');
const FAKE_WARD_CLI = path.join(FAKE_WARD_BIN_DIR, 'dungeonmaster-ward');

export const orchestrationEnvironmentHarness = (): {
  setup: (params: { tempDir: GuildPath; queueHarness: QueueHarness }) => {
    claudeQueueDir: FilePath;
    wardQueueDir: FilePath;
    restore: () => void;
  };
  withRestore: <T>(env: { restore: () => void }, fn: () => Promise<T>) => Promise<T>;
} => {
  return {
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

      const dmDir = path.join(tempDir, environmentStatics.testDataDir);
      fs.mkdirSync(dmDir, { recursive: true });
      fs.writeFileSync(path.join(dmDir, 'config.json'), JSON.stringify({ guilds: [] }));

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
