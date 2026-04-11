/**
 * PURPOSE: Groups implementation files with their test files from completed steps' focusFile and accompanyingFiles
 *
 * USAGE:
 * const pairs = stepToFilePairsTransformer({ steps });
 * // Returns [['impl.ts', 'impl.test.ts'], ['statics.ts']] pairs for review
 */

import type { DependencyStep, StepFileReference } from '@dungeonmaster/shared/contracts';

type StepFilePath = StepFileReference['path'];

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
    if (step.focusFile !== undefined) {
      allFiles.add(step.focusFile.path);
    }
    for (const file of step.accompanyingFiles) {
      allFiles.add(file.path);
    }
  }

  const result: StepFilePath[][] = [];

  for (const file of allFiles) {
    if (file.endsWith(TEST_SUFFIX) || file.endsWith(PROXY_SUFFIX) || file.endsWith(STUB_SUFFIX)) {
      continue;
    }

    const testFile = file.replace(TS_EXTENSION_PATTERN, TEST_SUFFIX) as StepFilePath;

    if (allFiles.has(testFile)) {
      result.push([file, testFile]);
    } else {
      result.push([file]);
    }
  }

  return result;
};
