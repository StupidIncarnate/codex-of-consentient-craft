/**
 * PURPOSE: Black-box concurrency safety test for ward. Spawns the real ward binary and monitors
 * the process tree to verify child processes stay bounded. No mocking — exercises the real code path.
 *
 * USAGE:
 * npx jest packages/ward/src/startup/start-ward.e2e.test.ts --no-coverage
 */

import { spawn, execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

const REPO_ROOT = path.resolve(__dirname, '../../../..');
const WARD_BIN = path.resolve(REPO_ROOT, 'packages/ward/dist/startup/start-ward.js');

const countDirectChildren = ({ pid }: { pid: number }): number => {
  try {
    const result = execSync(`pgrep -cP ${String(pid)}`, {
      encoding: 'utf-8',
      timeout: 2000,
    });
    return parseInt(result.trim(), 10);
  } catch {
    // pgrep exits 1 when no children found
    return 0;
  }
};

const sleep = async ({ ms }: { ms: number }): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const readRssKb = ({ pid }: { pid: number }) => {
  try {
    const result = execSync(`ps -o rss= -p ${String(pid)}`, {
      encoding: 'utf-8',
      timeout: 2000,
    });
    return parseInt(result.trim(), 10);
  } catch {
    return 0;
  }
};

describe('start-ward e2e', () => {
  describe('concurrency safety', () => {
    it('SAFETY: {--only lint, all packages} => max concurrent child processes stays bounded', async () => {
      expect(existsSync(WARD_BIN)).toBe(true);

      const wardProcess = spawn('node', [WARD_BIN, 'run', '--only', 'lint'], {
        cwd: REPO_ROOT,
        stdio: 'ignore',
        detached: true,
      });

      const pid = wardProcess.pid!;
      let maxChildren = 0;
      let exited = false;

      wardProcess.on('exit', () => {
        exited = true;
      });

      // Skip discovery phase (git ls-files, package.json reads)
      await sleep({ ms: 2000 });

      // Monitor direct child count for up to 10 seconds
      const POLL_MS = 50;
      const MONITOR_ROUNDS = 200;

      for (let i = 0; i < MONITOR_ROUNDS && !exited; i++) {
        await sleep({ ms: POLL_MS });
        const count = countDirectChildren({ pid });
        if (count > maxChildren) {
          maxChildren = count;
        }
      }

      // Kill ward process group
      try {
        process.kill(-pid, 'SIGKILL');
      } catch {
        // Process may have already exited
      }

      await sleep({ ms: 1000 });

      // Sequential execution: at most 1 child at a time (allow 2 for brief transition overlap)
      // Parallel execution would show 12+ children (one eslint per package simultaneously)
      expect(maxChildren).toBeLessThanOrEqual(2);
    }, 60_000);
  });

  describe('memory ceiling', () => {
    it('SAFETY: {--only lint, all packages} => RSS stays under 300MB', async () => {
      expect(existsSync(WARD_BIN)).toBe(true);

      const wardProcess = spawn('node', [WARD_BIN, 'run', '--only', 'lint'], {
        cwd: REPO_ROOT,
        stdio: 'ignore',
        detached: true,
      });

      const pid = wardProcess.pid!;
      let maxRssKb = 0;

      // Wait for process to complete or timeout after 30s
      await new Promise<void>((resolve) => {
        const POLL_MS = 100;
        const interval = setInterval(() => {
          const rss = readRssKb({ pid });
          maxRssKb = Math.max(maxRssKb, rss);
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
        }, 30_000);
      });

      await sleep({ ms: 1000 });

      // 300MB ceiling in KB
      const MAX_RSS_KB = 307_200;

      expect(maxRssKb).toBeLessThan(MAX_RSS_KB);
    }, 60_000);
  });
});
