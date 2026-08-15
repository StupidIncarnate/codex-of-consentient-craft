/**
 * PURPOSE: Validates that a quest has the required non-empty content for a gate transition, reading
 * the dot-path requirements `questGateContentRequirementsStatics` lists per target status
 *
 * USAGE:
 * hasQuestGateContentGuard({ quest, nextStatus: 'flows_approved' });
 * // Returns true if quest.flows.length > 0, false otherwise
 *
 * This used to also support an object requirement — { field, contains: { key, value }, questTypes } —
 * whose only user was `approved` demanding an operations ledger with at least one role:codeweaver
 * item. That demand is gone: the codeweaver items are DERIVED at Start from the node tags and the
 * contract source paths, so there is no authored ledger at `approved` to measure. With no object
 * requirement left in the statics, TypeScript narrowed the branch to `never` and the code could not
 * compile — which is the type system correctly reporting dead weight rather than a regression to
 * work around. Reintroduce the object form together with a requirement that needs it, not before.
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

  return requiredFields.every((path) => {
    const segments = path.split('.');
    let current: unknown = quest;

    for (const segment of segments) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return false;
      }
      current = Reflect.get(current, segment);
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
