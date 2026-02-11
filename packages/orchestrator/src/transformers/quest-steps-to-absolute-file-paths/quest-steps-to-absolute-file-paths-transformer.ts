/**
 * PURPOSE: Collects all absolute file paths from quest steps into a deduplicated array
 *
 * USAGE:
 * questStepsToAbsoluteFilePathsTransformer({ steps: [DependencyStepStub()] });
 * // Returns deduplicated AbsoluteFilePath[] from all step filesToCreate and filesToModify
 */

import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
  type DependencyStep,
} from '@dungeonmaster/shared/contracts';

import { stepToFilePathsTransformer } from '../step-to-file-paths/step-to-file-paths-transformer';

export const questStepsToAbsoluteFilePathsTransformer = ({
  steps,
}: {
  steps: DependencyStep[];
}): AbsoluteFilePath[] => {
  const seen = new Set<AbsoluteFilePath>();
  const result: AbsoluteFilePath[] = [];

  for (const step of steps) {
    const filePaths = stepToFilePathsTransformer({ step });
    for (const filePath of filePaths) {
      try {
        const absolutePath = absoluteFilePathContract.parse(String(filePath));
        if (!seen.has(absolutePath)) {
          seen.add(absolutePath);
          result.push(absolutePath);
        }
      } catch {
        // Skip paths that fail absolute path validation
      }
    }
  }

  return result;
};
