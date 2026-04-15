/**
 * PURPOSE: Converts a quest pipeline stage into the array of sections that stage includes
 *
 * USAGE:
 * questStageToSectionsTransformer({ stage: 'spec' });
 * // Returns ['requirements', 'designDecisions', 'contracts', 'contexts', 'observables', 'toolingRequirements']
 */

import type { QuestSection } from '../../contracts/quest-section/quest-section-contract';
import type { QuestStage } from '@dungeonmaster/shared/contracts';
import { questStageMappingStatics } from '../../statics/quest-stage-mapping/quest-stage-mapping-statics';

export const questStageToSectionsTransformer = ({ stage }: { stage: QuestStage }): QuestSection[] =>
  [...questStageMappingStatics.stages[stage]] as QuestSection[];
