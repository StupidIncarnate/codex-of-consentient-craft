/**
 * PURPOSE: Converts a quest pipeline stage into the array of sections that stage includes
 *
 * USAGE:
 * questStageToSectionsTransformer({ stage: 'spec' });
 * // Returns ['flows', 'designDecisions', 'contracts', 'toolingRequirements']
 */

import { questSectionContract } from '@dungeonmaster/shared/contracts';
import type { QuestSection } from '@dungeonmaster/shared/contracts';
import type { QuestStage } from '@dungeonmaster/shared/contracts';
import { questStageMappingStatics } from '@dungeonmaster/shared/statics';

export const questStageToSectionsTransformer = ({ stage }: { stage: QuestStage }): QuestSection[] =>
  questStageMappingStatics.stages[stage].map((section) => questSectionContract.parse(section));
