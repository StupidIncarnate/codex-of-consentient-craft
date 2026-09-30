/**
 * PURPOSE: Seeds a real package tree with the per-run artifacts an e2e run leaves behind, aged to
 * order, and reports which of them survived a sweep. The prune broker's unit tests all mock the
 * filesystem, so every one of them stays green against a broker that builds the WRONG path — it
 * would delete nothing, for ever, and read as success. This harness is what puts a real directory
 * at a real path so the integration test can grade that.
 *
 * Every method takes its own `packageRoot` rather than closing over one, because a harness has to
 * be constructed at describe level while each test mints its own testbed inside an `it`.
 *
 * USAGE:
 * const harness = e2eArtifactsHarness();
 * harness.seedDir({ packageRoot, relativePath: 'node_modules/.vite-64001', daysOld: 5 });
 * harness.exists({ packageRoot, relativePath: 'node_modules/.vite-64001' });
 */
import { existsSync, readdirSync } from '#gateway/node/fs';
import { ensureDir, utimes, writeFile } from '#gateway/node/fs__promises';
import { now } from '#gateway/node/Date';
import { join } from '#gateway/node/path';


const DAY_SECONDS = 86_400;

export const e2eArtifactsHarness = (): {
  seedDir: (params: {
    packageRoot: string;
    relativePath: string;
    daysOld: number;
  }) => Promise<void>;
  seedFile: (params: {
    packageRoot: string;
    relativePath: string;
    daysOld: number;
  }) => Promise<void>;
  exists: (params: { packageRoot: string; relativePath: string }) => boolean;
  listRoot: (params: { packageRoot: string }) => string[];
} => {
  const absolute = ({
    packageRoot,
    relativePath,
  }: {
    packageRoot: string;
    relativePath: string;
  }): string =>
    join(String(packageRoot), relativePath);

  // utimes takes SECONDS since the epoch, not milliseconds. Handing it now() dates everything
  // ~55,000 years into the future, which reads as newer than every TTL and turns every deletion
  // assertion in the test into a false pass.
  const backdate = async ({ path, daysOld }: { path: string; daysOld: number }): Promise<void> => {
    const when = now() / 1000 - daysOld * DAY_SECONDS;
    await utimes(path, when, when);
  };

  return {
    seedDir: async ({ packageRoot, relativePath, daysOld }): Promise<void> => {
      const path = String(absolute({ packageRoot, relativePath }));
      await ensureDir(path);
      await writeFile(join(path, 'seed'), 'x');
      // Age the directory AFTER writing into it. A write bumps the parent's mtime, which would
      // undo the backdating and leave the fixture looking brand new.
      await backdate({ path, daysOld });
    },
    seedFile: async ({ packageRoot, relativePath, daysOld }): Promise<void> => {
      const path = String(absolute({ packageRoot, relativePath }));
      await writeFile(path, '{}');
      await backdate({ path, daysOld });
    },
    exists: ({ packageRoot, relativePath }): boolean =>
      existsSync(String(absolute({ packageRoot, relativePath }))),
    listRoot: ({ packageRoot }): string[] =>
      readdirSync(String(packageRoot))
        .sort()
        .map((name) => name),
  };
};
