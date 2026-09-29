/**
 * PURPOSE: Seeds a real workspace tree for the bin-resolve integration test and puts a decoy
 * executable first on PATH, so a resolver that consulted PATH would return the decoy. The unit
 * tests stage every fs check by exact path, which cannot prove the walk works against a real
 * filesystem or that the result beats PATH.
 *
 * USAGE:
 * const harness = binResolveHarness();
 * harness.seedFile({ root, relativePath: 'node_modules/.bin/jest', contents: '#!/bin/sh\n' });
 * harness.prependPathDecoy({ root, binName: 'jest' });
 * harness.firstPathDir(); // Returns '<root>/decoy-path'
 */
import { chmodSync, ensureDirSync, writeFileSync } from '#gateway/node/fs';
import { ensureDir, writeFile } from '#gateway/node/fs__promises';
import { dirname, join } from '#gateway/node/path';
import { deleteEnv, getEnv, setEnv } from '#gateway/node/process';

import { FilePathStub } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const binResolveHarness = (): {
  beforeEach: () => void;
  afterEach: () => void;
  seedFile: (params: {
    root: AbsoluteFilePath;
    relativePath: string;
    contents: string;
  }) => Promise<void>;
  prependPathDecoy: (params: { root: AbsoluteFilePath; binName: string }) => void;
  firstPathDir: () => ReturnType<typeof FilePathStub>;
} => {
  const originalPath = { value: getEnv('PATH') };

  return {
    beforeEach: (): void => {
      originalPath.value = getEnv('PATH');
    },
    afterEach: (): void => {
      if (originalPath.value === undefined) {
        deleteEnv('PATH');
        return;
      }
      setEnv('PATH', originalPath.value);
    },
    seedFile: async ({ root, relativePath, contents }): Promise<void> => {
      const path = join(String(root), relativePath);
      await ensureDir(dirname(path));
      await writeFile(path, contents);
    },
    prependPathDecoy: ({ root, binName }): void => {
      const decoyDir = join(String(root), 'decoy-path');
      ensureDirSync(decoyDir);
      writeFileSync(join(decoyDir, binName), '#!/bin/sh\n');
      chmodSync(join(decoyDir, binName), 0o755);
      setEnv('PATH', `${decoyDir}:${originalPath.value ?? ''}`);
    },
    firstPathDir: (): ReturnType<typeof FilePathStub> =>
      FilePathStub({ value: (getEnv('PATH') ?? '').split(':')[0] ?? '' }),
  };
};
