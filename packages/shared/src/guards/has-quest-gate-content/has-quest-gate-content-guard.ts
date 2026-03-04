/**
 * PURPOSE: Validates that a quest has the required non-empty array content for a gate transition
 *
 * USAGE:
 * hasQuestGateContentGuard({ quest, nextStatus: 'flows_approved' });
 * // Returns true if quest.flows.length > 0, false otherwise
 */

import type { Quest } from '../../contracts/quest/quest-contract';
import type { QuestStatus } from '../../contracts/quest-status/quest-status-contract';
import { questGateContentRequirementsStatics } from '../../statics/quest-gate-content-requirements/quest-gate-content-requirements-statics';

export const hasQuestGateContentGuard = ({
  quest,
  nextStatus,
}: {
  quest?: Quest;
  nextStatus?: QuestStatus;
}): boolean => {
  if (!quest || !nextStatus) {
    return false;
  }

  const { gates } = questGateContentRequirementsStatics;

  if (!(nextStatus in gates)) {
    return true;
  }

  const requiredFields = gates[nextStatus as keyof typeof gates];

  return requiredFields.every((field) => quest[field].length > 0);
};
