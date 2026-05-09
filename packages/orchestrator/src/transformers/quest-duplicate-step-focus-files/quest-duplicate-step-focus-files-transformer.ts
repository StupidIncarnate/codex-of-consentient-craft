/**
 * PURPOSE: Returns the list of focusFile.path values claimed by 2+ steps (empty array = no duplicates)
 *
 * USAGE:
 * questDuplicateStepFocusFilesTransformer({steps});
 * // Returns ErrorMessage[] — each entry is a duplicated focusFile path,
 * // e.g. ["src/brokers/auth/login/auth-login-broker.ts"].
 *
 * WHEN-TO-USE: Save-time invariant during seek_synth/seek_walk to catch the case where two slices both
 * declare a step with the same focusFile.path. Such collisions must be promoted to a single-owner step
 * (shared slice) before the plan can advance.
 *
 * WHEN-NOT-TO-USE: Steps with focusAction (no focusFile) are excluded — operational verification steps
 * have no file target and cannot collide.
 */
import type { DependencyStep, ErrorMessage } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';

import { fileAnchoredStepsTransformer } from '../file-anchored-steps/file-anchored-steps-transformer';

export const questDuplicateStepFocusFilesTransformer = ({
  steps,
}: {
  steps?: DependencyStep[];
}): ErrorMessage[] => {
  if (!steps) {
    return [];
  }

  const fileSteps = fileAnchoredStepsTransformer({ steps });

  const seen = new Set<unknown>();
  const duplicates = new Set<unknown>();

  for (const step of fileSteps) {
    const path = String(step.focusFile.path);
    if (seen.has(path)) {
      duplicates.add(path);
    } else {
      seen.add(path);
    }
  }

  return Array.from(duplicates).map((path) => errorMessageContract.parse(String(path)));
};
