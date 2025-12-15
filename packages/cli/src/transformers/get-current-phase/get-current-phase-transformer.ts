/**
 * PURPOSE: Gets the current active phase from a quest's phases
 *
 * USAGE:
 * getCurrentPhaseTransformer({phases: quest.phases});
 * // Returns 'implementation' or undefined if all complete
 */

import type { PhaseType, QuestPhases } from '@dungeonmaster/shared/contracts';
import { questStatics } from '../../statics/quest/quest-statics';

export const getCurrentPhaseTransformer = ({
  phases,
}: {
  phases: QuestPhases;
}): PhaseType | undefined => {
  // First check for in_progress or blocked phases
  for (const phase of questStatics.phases.order) {
    const phaseStatus = phases[phase].status;
    if (phaseStatus === 'in_progress' || phaseStatus === 'blocked') {
      return phase;
    }
  }

  // Then check for pending phases
  for (const phase of questStatics.phases.order) {
    if (phases[phase].status === 'pending') {
      return phase;
    }
  }

  // All phases complete or skipped
  return undefined;
};
