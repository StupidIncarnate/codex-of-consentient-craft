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
// wardBinExists() backs the one "built artifact exists" assertion in
// start-ward.integration.test.ts, which must keep grading dist — see that file's comment.
const WARD_BIN = FilePathStub({
  value: path.resolve(String(REPO_ROOT), 'packages/ward/dist/src/startup/start-ward.js'),
});
// runAndMonitorMemory exercises real ward behaviour, so it spawns the source entry directly
// under tsx instead of the built dist file. `--conditions=source` resolves every
// @dungeonmaster/* import to TS source (see jest.config.base.js's `customExportConditions`),
// matching how `npm run dev` runs source.
const WARD_SOURCE_ENTRY = FilePathStub({
  value: path.resolve(String(REPO_ROOT), 'packages/ward/src/startup/start-ward.ts'),
});

const POLL_MS = 100;
const SLEEP_MS = 1000;
const PROCESS_TIMEOUT_MS = 30_000;
const EXEC_TIMEOUT_MS = 2000;

// Unlike the old `node <dist-file>.js` spawn, tsx always forks a child to actually run the
// target script (measured: `node_modules/.bin/tsx ...` still has a separate PID doing the real
// work), so the spawned PID alone under-reports. Walk the whole descendant tree and sum RSS
// across it so the ceiling still measures ward's real memory use.
const collectDescendantPids = (pid: ReturnType<typeof Number>): ReturnType<typeof Number>[] => {
  try {
    const output = execSync(`pgrep -P ${String(pid)}`, {
      encoding: 'utf-8',
      timeout: EXEC_TIMEOUT_MS,
    });
    const childPids = output
      .trim()
      .split('\n')
      .filter((line) => line.length > 0)
      .map((line) => parseInt(line, 10));
    return [...childPids, ...childPids.flatMap((childPid) => collectDescendantPids(childPid))];
  } catch {
    return [];
  }
};

const treeRssKb = (rootPid: ReturnType<typeof Number>): ReturnType<typeof Number> =>
  [rootPid, ...collectDescendantPids(rootPid)].reduce((sum, currentPid) => {
    try {
      const result = execSync(`ps -o rss= -p ${String(currentPid)}`, {
        encoding: 'utf-8',
        timeout: EXEC_TIMEOUT_MS,
      });
      const rss = parseInt(result.trim(), 10);
      return sum + (Number.isNaN(rss) ? 0 : rss);
    } catch {
      return sum;
    }
  }, 0);

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
    const wardProcess = spawn(
      'npx',
      ['tsx', '--conditions=source', String(WARD_SOURCE_ENTRY), ...args],
      {
        cwd: String(REPO_ROOT),
        stdio: 'ignore',
        detached: true,
      },
    );

    const pid = wardProcess.pid!;
    let maxRssKb = 0;

    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        maxRssKb = Math.max(maxRssKb, treeRssKb(pid));
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
