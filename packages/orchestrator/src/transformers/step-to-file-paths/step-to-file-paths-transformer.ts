/**
 * PURPOSE: Combines filesToCreate and filesToModify from a step into a single deduplicated array
 *
 * USAGE:
 * const paths = stepToFilePathsTransformer({ step });
 * // Returns deduplicated array of file paths from both filesToCreate and filesToModify
 */

import type { DependencyStep } from '@dungeonmaster/shared/contracts';

type StepFilePath = DependencyStep['filesToCreate'] extends (infer T)[] ? T : never;

export const stepToFilePathsTransformer = ({ step }: { step: DependencyStep }): StepFilePath[] => {
  const seen = new Set<StepFilePath>();
  const result: StepFilePath[] = [];

  for (const filePath of [...step.filesToCreate, ...step.filesToModify]) {
    if (!seen.has(filePath)) {
      seen.add(filePath);
      result.push(filePath);
    }
  }

  return result;
};
