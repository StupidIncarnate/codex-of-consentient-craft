/**
 * PURPOSE: Validates that a quest has the required non-empty content for a gate transition, supporting dot-path requirements
 *
 * USAGE:
 * hasQuestGateContentGuard({ quest, nextStatus: 'flows_approved' });
 * // Returns true if quest.flows.length > 0, false otherwise
 * hasQuestGateContentGuard({ quest, nextStatus: 'approved' });
 * // Returns true if quest.flows is non-empty AND quest.operations contains at least one role:codeweaver item
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

  return requiredFields.every((requirement) => {
    const path = typeof requirement === 'string' ? requirement : requirement.field;
    const segments = path.split('.');
    let current: unknown = quest;

    for (const segment of segments) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return false;
      }
      current = Reflect.get(current, segment);
    }

    if (typeof requirement !== 'string') {
      if (!Array.isArray(current)) {
        return false;
      }
      return current.some((item: unknown) => {
        if (item === null || item === undefined || typeof item !== 'object') {
          return false;
        }
        return Reflect.get(item, requirement.contains.key) === requirement.contains.value;
      });
    }

    if (current === null || current === undefined) {
      return false;
    }

    if (Array.isArray(current)) {
      return current.length > 0;
    }

    return true;
  });
};
