/**
 * PURPOSE: Manages file-based queue directories for fake Claude CLI and ward binary in integration tests
 *
 * USAGE:
 * const queue = orchestrationQueueHarness();
 * const dirs = queue.createDirs({ baseDir: testbed.guildPath });
 * queue.enqueue({ queueDir: dirs.claudeQueueDir, response: agentSuccessResponse() });
 */
import * as fs from 'fs';
import * as path from 'path';

import type { FilePath, GuildPath } from '@dungeonmaster/shared/contracts';
import { ArrayIndexStub, FilePathStub } from '@dungeonmaster/shared/contracts';

export const orchestrationQueueHarness = (): {
  beforeEach: () => void;
  afterEach: () => void;
  createDirs: (params: { baseDir: GuildPath }) => {
    claudeQueueDir: FilePath;
    wardQueueDir: FilePath;
  };
  enqueue: (params: { queueDir: FilePath; response: unknown }) => void;
  resetCounters: () => void;
} => {
  const counters = new Map<FilePath, ReturnType<typeof ArrayIndexStub>>();

  const makeDir = (baseDir: GuildPath, name: 'claude-queue' | 'ward-queue'): FilePath => {
    const dir = path.join(baseDir, name);
    fs.mkdirSync(dir, { recursive: true });
    return FilePathStub({ value: dir });
  };

  return {
    beforeEach: (): void => {
      counters.clear();
    },
    afterEach: (): void => {
      counters.clear();
    },
    createDirs: ({
      baseDir,
    }: {
      baseDir: GuildPath;
    }): {
      claudeQueueDir: FilePath;
      wardQueueDir: FilePath;
    } => ({
      claudeQueueDir: makeDir(baseDir, 'claude-queue'),
      wardQueueDir: makeDir(baseDir, 'ward-queue'),
    }),

    enqueue: ({ queueDir, response }: { queueDir: FilePath; response: unknown }): void => {
      const key = FilePathStub({ value: queueDir });
      const counter = counters.get(key) ?? ArrayIndexStub({ value: 0 });
      const filePath = path.join(queueDir, `${String(counter).padStart(4, '0')}.json`);
      fs.writeFileSync(filePath, JSON.stringify(response));
      counters.set(key, ArrayIndexStub({ value: Number(counter) + 1 }));
    },

    resetCounters: (): void => {
      counters.clear();
    },
  };
};
