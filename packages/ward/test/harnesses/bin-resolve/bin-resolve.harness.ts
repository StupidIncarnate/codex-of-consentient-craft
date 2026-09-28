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
import { mkdirSync, writeFileSync } from 'fs';
import fsPromises from 'fs/promises';
import { dirname, join } from 'path';

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
  const originalPath = { value: process.env.PATH };

  return {
    beforeEach: (): void => {
      originalPath.value = process.env.PATH;
    },
    afterEach: (): void => {
      if (originalPath.value === undefined) {
        Reflect.deleteProperty(process.env, 'PATH');
        return;
      }
      process.env.PATH = originalPath.value;
    },
    seedFile: async ({ root, relativePath, contents }): Promise<void> => {
      const path = join(String(root), relativePath);
      await fsPromises.mkdir(dirname(path), { recursive: true });
      await fsPromises.writeFile(path, contents);
    },
    prependPathDecoy: ({ root, binName }): void => {
      const decoyDir = join(String(root), 'decoy-path');
      mkdirSync(decoyDir, { recursive: true });
      writeFileSync(join(decoyDir, binName), '#!/bin/sh\n', { mode: 0o755 });
      process.env.PATH = `${decoyDir}:${originalPath.value ?? ''}`;
    },
    firstPathDir: (): ReturnType<typeof FilePathStub> =>
      FilePathStub({ value: (process.env.PATH ?? '').split(':')[0] ?? '' }),
  };
};
