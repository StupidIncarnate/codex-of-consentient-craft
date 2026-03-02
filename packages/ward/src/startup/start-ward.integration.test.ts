import { spawn, execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

import { StartWard } from './start-ward';

const REPO_ROOT = path.resolve(__dirname, '../../../..');
const WARD_BIN = path.resolve(REPO_ROOT, 'packages/ward/dist/src/startup/start-ward.js');

const POLL_MS = 100;
const SLEEP_MS = 1000;
const PROCESS_TIMEOUT_MS = 30_000;
const MAX_RSS_KB = 307_200;
const EXEC_TIMEOUT_MS = 2000;

describe('StartWard', () => {
  describe('delegation to ward flow', () => {
    it('VALID: {args: ["node", "ward", "unknown-command"]} => completes without throwing for unknown command', async () => {
      await expect(
        StartWard({ args: ['node', 'ward', 'unknown-command'] }),
      ).resolves.toBeUndefined();
    });
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

      expect(maxRssKb).toBeLessThan(MAX_RSS_KB);
    }, 60_000);
  });
});
