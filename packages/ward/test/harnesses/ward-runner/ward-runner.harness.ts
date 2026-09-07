/**
 * PURPOSE: Provides process spawn and memory monitoring helpers for ward integration tests
 *
 * USAGE:
 * const ward = wardRunnerHarness();
 * const { maxRssKb } = await ward.runAndMonitorMemory({ args: ['run', '--only', 'lint'] });
 * expect(maxRssKb).toBeLessThan(4_000_000); // ceiling on the single biggest process, not a tree sum
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
// runAndMonitorMemory exercises real ward behaviour, so it spawns the BIN ENTRY under tsx source
// rather than the built dist file — `packages/ward/src/startup/start-ward.ts` exports `StartWard`
// but never calls it (only `bin/ward-entry.ts` does), so spawning that file loads ward's module
// graph and exits without ever reaching WardFlow or eslint. See start-ward.integration.test.ts's
// comment for the measurements that proved it. `--conditions=source` resolves every
// @dungeonmaster/* import to TS source (see jest.config.base.js's `customExportConditions`),
// matching how `npm run dev` runs source.
const WARD_SOURCE_ENTRY = FilePathStub({
  value: path.resolve(String(REPO_ROOT), 'packages/ward/bin/ward-entry.ts'),
});

const POLL_MS = 100;
const SLEEP_MS = 1000;
// A real `run --only lint` fans out to every workspace package (commandRunLayerMultiBroker,
// CONCURRENCY_LIMIT = 4) and each child spawns its own eslint — measured full-repo wall time
// ranges from ~90s quiet to 464s under heavy concurrent-agent load (see the integration test's
// comment). 600_000ms matches this repo's own documented full-ward timeout convention and
// comfortably outlasts the worst measured run, so the safety kill only fires on a genuine hang.
const PROCESS_TIMEOUT_MS = 600_000;
const EXEC_TIMEOUT_MS = 2000;

// tsx always forks a child to actually run the target script (measured: `node_modules/.bin/tsx
// ...` still has a separate PID doing the real work), so the spawned PID alone under-reports.
// Walk the whole descendant tree to FIND every process ward's run produced — up to 4 concurrent
// per-package `dungeonmaster-ward` children (CONCURRENCY_LIMIT in commandRunLayerMultiBroker),
// each spawning its own eslint grandchild — but report the MAX single-process RSS across that
// tree, not the sum. RSS counts shared pages (the node binary, shared libraries, copy-on-write
// pages) once PER PROCESS, so summing double-, triple-, quadruple-counts the same physical pages
// across every concurrent eslint child; the sum has no physical memory meaning and drifts every
// time a package is added or removed. The max answers the real question instead — did any ONE
// ward process balloon — without double-counting and without depending on how many packages
// happen to exist.
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

const treeMaxRssKb = (rootPid: ReturnType<typeof Number>): ReturnType<typeof Number> =>
  [rootPid, ...collectDescendantPids(rootPid)].reduce((max, currentPid) => {
    try {
      const result = execSync(`ps -o rss= -p ${String(currentPid)}`, {
        encoding: 'utf-8',
        timeout: EXEC_TIMEOUT_MS,
      });
      const rss = parseInt(result.trim(), 10);
      return Number.isNaN(rss) ? max : Math.max(max, rss);
    } catch {
      return max;
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
        maxRssKb = Math.max(maxRssKb, treeMaxRssKb(pid));
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
