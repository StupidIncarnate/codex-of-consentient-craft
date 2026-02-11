/**
 * PURPOSE: Groups implementation files with their test files from completed steps' filesToCreate
 *
 * USAGE:
 * const pairs = stepToFilePairsTransformer({ steps });
 * // Returns [['impl.ts', 'impl.test.ts'], ['statics.ts']] pairs for review
 */

import type { DependencyStep } from '@dungeonmaster/shared/contracts';

type StepFilePath = DependencyStep['filesToCreate'] extends (infer T)[] ? T : never;

const TEST_SUFFIX = '.test.ts';
const PROXY_SUFFIX = '.proxy.ts';
const STUB_SUFFIX = '.stub.ts';
const TS_EXTENSION_PATTERN = /\.ts$/u;

export const stepToFilePairsTransformer = ({
  steps,
}: {
  steps: DependencyStep[];
}): StepFilePath[][] => {
  const allFiles = new Set<StepFilePath>();
  for (const step of steps) {
    for (const file of step.filesToCreate) {
      allFiles.add(file);
    }
  }

  const result: StepFilePath[][] = [];

  for (const file of allFiles) {
    if (file.endsWith(TEST_SUFFIX) || file.endsWith(PROXY_SUFFIX) || file.endsWith(STUB_SUFFIX)) {
      continue;
    }

    const testFile = file.replace(TS_EXTENSION_PATTERN, TEST_SUFFIX);

    if (allFiles.has(testFile as StepFilePath)) {
      result.push([file, testFile as StepFilePath]);
    } else {
      result.push([file]);
    }
  }

  return result;
};
