/**
 * PURPOSE: Manages file-based queue directories for fake Claude CLI and ward binary in integration tests
 *
 * USAGE:
 * const queue = orchestrationQueueHarness();
 * const dirs = queue.createDirs({ baseDir: testbed.guildPath });
 * queue.enqueue({ queueDir: dirs.claudeQueueDir, response: agentSuccessResponse() });
 */
import { ensureDirSync, writeFileSync } from '#gateway/node/fs';
import * as path from '#gateway/node/path';

import { ArrayIndexStub } from '@dungeonmaster/shared/contracts/array-index/array-index.stub';

export const orchestrationQueueHarness = (): {
  beforeEach: () => void;
  afterEach: () => void;
  initDirs: (params: { baseDir: string }) => {
    claudeQueueDir: string;
    wardQueueDir: string;
  };
  enqueue: (params: { queueDir: string; response: unknown }) => void;
  resetCounters: () => void;
} => {
  const counters = new Map<string, ReturnType<typeof ArrayIndexStub>>();

  return {
    beforeEach: (): void => {
      counters.clear();
    },
    afterEach: (): void => {
      counters.clear();
    },
    initDirs: ({
      baseDir,
    }: {
      baseDir: string;
    }): {
      claudeQueueDir: string;
      wardQueueDir: string;
    } => {
      const claudeQueueDir = path.join(baseDir, 'claude-queue');
      const wardQueueDir = path.join(baseDir, 'ward-queue');
      ensureDirSync(claudeQueueDir);
      ensureDirSync(wardQueueDir);
      return {
        claudeQueueDir: claudeQueueDir,
        wardQueueDir: wardQueueDir,
      };
    },

    enqueue: ({ queueDir, response }: { queueDir: string; response: unknown }): void => {
      const key = queueDir;
      const counter = counters.get(key) ?? ArrayIndexStub({ value: 0 });
      const filePath = path.join(queueDir, `${String(counter).padStart(4, '0')}.json`);
      writeFileSync(filePath, JSON.stringify(response));
      counters.set(key, ArrayIndexStub({ value: Number(counter) + 1 }));
    },

    resetCounters: (): void => {
      counters.clear();
    },
  };
};
