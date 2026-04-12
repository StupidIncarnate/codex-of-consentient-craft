/**
 * PURPOSE: Validates that every step has exactly one of focusFile or focusAction (XOR), never both and never neither
 *
 * USAGE:
 * questStepHasFocusTargetGuard({steps});
 * // Returns true if every step has exactly one focus target, false if any step has neither or both
 *
 * WHEN-TO-USE: verify-quest and validate-spec pipelines, to enforce the file-or-action rule that cannot be expressed
 * in the Zod schema (because .refine() breaks downstream .extend() usage in modify-quest-input-contract).
 */
import type { DependencyStep } from '@dungeonmaster/shared/contracts';

export const questStepHasFocusTargetGuard = ({ steps }: { steps?: DependencyStep[] }): boolean => {
  if (!steps) {
    return false;
  }

  for (const step of steps) {
    const hasFocusFile = step.focusFile !== undefined;
    const hasFocusAction = step.focusAction !== undefined;

    if (hasFocusFile === hasFocusAction) {
      return false;
    }
  }

  return true;
};
