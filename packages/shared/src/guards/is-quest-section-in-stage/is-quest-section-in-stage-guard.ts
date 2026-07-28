/**
 * PURPOSE: Answers whether a quest section is carried by a given pipeline stage, so a renderer can
 * tell "this section was filtered out of the response" apart from "this section is genuinely empty"
 *
 * USAGE:
 * isQuestSectionInStageGuard({ section: 'operations', stage: 'spec' });
 * // Returns false — `spec` carries flows/designDecisions/contracts/toolingRequirements only
 *
 * isQuestSectionInStageGuard({ section: 'operations', stage: undefined });
 * // Returns true — an unstaged quest is unfiltered, so every section is really present
 */

import type { QuestSection } from '../../contracts/quest-section/quest-section-contract';
import type { QuestStage } from '../../contracts/quest-stage/quest-stage-contract';
import { questStageMappingStatics } from '../../statics/quest-stage-mapping/quest-stage-mapping-statics';

export const isQuestSectionInStageGuard = ({
  section,
  stage,
}: {
  section?: QuestSection | undefined;
  // Explicit `| undefined` (not bare `?`) because callers forward a possibly-undefined stage under
  // exactOptionalPropertyTypes, where an optional prop may be omitted but not passed as undefined.
  stage?: QuestStage | undefined;
}): boolean => {
  if (section === undefined) {
    return false;
  }

  // No stage means an unfiltered quest: every section is genuinely present, so render them all.
  return (
    stage === undefined ||
    (questStageMappingStatics.stages[stage] as readonly QuestSection[]).includes(section)
  );
};
