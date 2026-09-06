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
import { mkdirSync, writeFileSync, utimesSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

import { FileNameStub, FilePathStub } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

const DAY_SECONDS = 86_400;

export const e2eArtifactsHarness = (): {
  seedDir: (params: {
    packageRoot: AbsoluteFilePath;
    relativePath: string;
    daysOld: number;
  }) => void;
  seedFile: (params: {
    packageRoot: AbsoluteFilePath;
    relativePath: string;
    daysOld: number;
  }) => void;
  exists: (params: { packageRoot: AbsoluteFilePath; relativePath: string }) => boolean;
  listRoot: (params: { packageRoot: AbsoluteFilePath }) => ReturnType<typeof FileNameStub>[];
} => {
  const absolute = ({
    packageRoot,
    relativePath,
  }: {
    packageRoot: AbsoluteFilePath;
    relativePath: string;
  }): ReturnType<typeof FilePathStub> =>
    FilePathStub({ value: join(String(packageRoot), relativePath) });

  // utimes takes SECONDS since the epoch, not milliseconds. Handing it Date.now() dates everything
  // ~55,000 years into the future, which reads as newer than every TTL and turns every deletion
  // assertion in the test into a false pass.
  const backdate = ({ path, daysOld }: { path: string; daysOld: number }): void => {
    const when = Date.now() / 1000 - daysOld * DAY_SECONDS;
    utimesSync(path, when, when);
  };

  return {
    seedDir: ({ packageRoot, relativePath, daysOld }): void => {
      const path = String(absolute({ packageRoot, relativePath }));
      mkdirSync(path, { recursive: true });
      writeFileSync(join(path, 'seed'), 'x');
      // Age the directory AFTER writing into it. A write bumps the parent's mtime, which would
      // undo the backdating and leave the fixture looking brand new.
      backdate({ path, daysOld });
    },
    seedFile: ({ packageRoot, relativePath, daysOld }): void => {
      const path = String(absolute({ packageRoot, relativePath }));
      writeFileSync(path, '{}');
      backdate({ path, daysOld });
    },
    exists: ({ packageRoot, relativePath }): boolean =>
      existsSync(String(absolute({ packageRoot, relativePath }))),
    listRoot: ({ packageRoot }): ReturnType<typeof FileNameStub>[] =>
      readdirSync(String(packageRoot))
        .sort()
        .map((name) => FileNameStub({ value: name })),
  };
};
