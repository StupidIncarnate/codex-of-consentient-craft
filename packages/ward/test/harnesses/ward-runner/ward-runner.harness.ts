/**
 * PURPOSE: Provides process spawn and memory monitoring helpers for ward integration tests
 *
 * USAGE:
 * const ward = wardRunnerHarness();
 * const { maxRssKb } = await ward.runAndMonitorMemory({ args: ['run', '--only', 'lint'] });
 * expect(maxRssKb).toBeLessThan(307200);
 */
import { spawn, execSync } from 'child_process';
import { existsSync } from 'fs';
import * as path from 'path';

import type { FilePath } from '@dungeonmaster/shared/contracts';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

const REPO_ROOT = FilePathStub({
  value: path.resolve(__dirname, '../../../../..'),
});
const WARD_BIN = FilePathStub({
  value: path.resolve(String(REPO_ROOT), 'packages/ward/dist/src/startup/start-ward.js'),
});

const POLL_MS = 100;
const SLEEP_MS = 1000;
const PROCESS_TIMEOUT_MS = 30_000;
const EXEC_TIMEOUT_MS = 2000;

export const wardRunnerHarness = (): {
  wardBinExists: () => boolean;
  repoRoot: FilePath;
  wardBin: FilePath;
  runAndMonitorMemory: (params: {
    args: readonly string[];
  }) => Promise<{ maxRssKb: ReturnType<typeof Number> }>;
} => {
  const wardBinExists = (): boolean => existsSync(String(WARD_BIN));

  const runAndMonitorMemory = async ({
    args,
  }: {
    args: readonly string[];
  }): Promise<{ maxRssKb: ReturnType<typeof Number> }> => {
    const wardProcess = spawn('node', [String(WARD_BIN), ...args], {
      cwd: String(REPO_ROOT),
      stdio: 'ignore',
      detached: true,
    });

    const pid = wardProcess.pid!;
    let maxRssKb = 0;

    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        try {
          const result = execSync(`ps -o rss= -p ${String(pid)}`, {
            encoding: 'utf-8',
            timeout: EXEC_TIMEOUT_MS,
          });
          const rss = parseInt(result.trim(), 10);
          maxRssKb = Math.max(maxRssKb, rss);
        } catch {
          // Process may have exited
        }
      }, POLL_MS);

      wardProcess.on('exit', () => {
        clearInterval(interval);
        resolve();
      });

      setTimeout(() => {
        clearInterval(interval);
        try {
          process.kill(-pid, 'SIGKILL');
        } catch {
          // Process may have already exited
        }
        resolve();
      }, PROCESS_TIMEOUT_MS);
    });

    await new Promise((resolve) => {
      setTimeout(resolve, SLEEP_MS);
    });

    return { maxRssKb };
  };

  return {
    wardBinExists,
    repoRoot: REPO_ROOT,
    wardBin: WARD_BIN,
    runAndMonitorMemory,
  };
};
