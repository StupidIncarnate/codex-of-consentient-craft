/**
 * PURPOSE: Returns failed completeness checks gating the proposed quest status transition (cumulative)
 *
 * USAGE:
 * questCompletenessForTransitionTransformer({quest, nextStatus: 'review_observables'});
 * // Returns VerifyQuestCheck[] of failed checks. Empty array means quest passes the transition gate
 * // (or the requested status is not gated by completeness — only review_flows and review_observables are).
 *
 * Cumulative scoping:
 *   review_flows         -> runs flow-completeness scope only
 *   review_observables   -> runs flow-completeness AND spec-completeness (Phase 4 edits must not break Phase 2)
 *   any other status     -> returns []
 */
import type { QuestStatus, QuestStub } from '@dungeonmaster/shared/contracts';

import type { VerifyQuestCheck } from '../../contracts/verify-quest-check/verify-quest-check-contract';
import { questValidateSpecTransformer } from '../quest-validate-spec/quest-validate-spec-transformer';

type Quest = ReturnType<typeof QuestStub>;

export const questCompletenessForTransitionTransformer = ({
  quest,
  nextStatus,
}: {
  quest: Quest;
  nextStatus: QuestStatus;
}): VerifyQuestCheck[] => {
  if (nextStatus === 'review_flows') {
    const flowChecks = questValidateSpecTransformer({ quest, scope: 'flow-completeness' });
    return flowChecks.filter((check) => !check.passed);
  }

  if (nextStatus === 'review_observables') {
    const flowChecks = questValidateSpecTransformer({ quest, scope: 'flow-completeness' });
    const specChecks = questValidateSpecTransformer({ quest, scope: 'spec-completeness' });
    return [...flowChecks, ...specChecks].filter((check) => !check.passed);
  }

  return [];
};
