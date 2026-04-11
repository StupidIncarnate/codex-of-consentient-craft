/**
 * PURPOSE: Combines focusFile and accompanyingFiles from a step into a single deduplicated array of file paths
 *
 * USAGE:
 * const paths = stepToFilePathsTransformer({ step });
 * // Returns deduplicated array of file paths from focusFile and accompanyingFiles
 */

import type { DependencyStep, StepFileReference } from '@dungeonmaster/shared/contracts';

import { fileAnchoredStepsTransformer } from '../file-anchored-steps/file-anchored-steps-transformer';

type StepFilePath = StepFileReference['path'];

export const stepToFilePathsTransformer = ({ step }: { step: DependencyStep }): StepFilePath[] => {
  const seen = new Set<StepFilePath>();
  const result: StepFilePath[] = [];

  const [fileAnchored] = fileAnchoredStepsTransformer({ steps: [step] });
  const allPaths: StepFilePath[] = fileAnchored
    ? [fileAnchored.focusFile.path, ...step.accompanyingFiles.map((f) => f.path)]
    : step.accompanyingFiles.map((f) => f.path);

  for (const filePath of allPaths) {
    if (!seen.has(filePath)) {
      seen.add(filePath);
      result.push(filePath);
    }
  }

  return result;
};
