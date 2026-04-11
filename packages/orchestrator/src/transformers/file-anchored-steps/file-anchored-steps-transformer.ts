/**
 * PURPOSE: Filters a DependencyStep array down to steps that have a focusFile, narrowing the type so focusFile is non-optional
 *
 * USAGE:
 * const fileSteps = fileAnchoredStepsTransformer({steps});
 * // Returns steps where step.focusFile is known to be defined (type-narrowed)
 *
 * WHEN-TO-USE: Before running file-oriented checks (companion files, focus-file validation, duplicate detection) that
 * only apply to steps with a focusFile. Operational steps with focusAction have no file target and must be excluded.
 */
import type { DependencyStep } from '@dungeonmaster/shared/contracts';

type FileAnchoredStep = DependencyStep & { focusFile: NonNullable<DependencyStep['focusFile']> };

export const fileAnchoredStepsTransformer = ({
  steps,
}: {
  steps: DependencyStep[];
}): FileAnchoredStep[] =>
  steps.filter((step): step is FileAnchoredStep => step.focusFile !== undefined);
