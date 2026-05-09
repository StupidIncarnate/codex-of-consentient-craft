/**
 * PURPOSE: Retrieves a quest by ID by scanning all projects for the quest
 *
 * USAGE:
 * const result = await questGetBroker({ input: GetQuestInputStub({ questId: 'add-auth' }) });
 * // Returns: { success: true, quest: {...} } or { success: false, error: 'Quest not found' }
 *
 * const filtered = await questGetBroker({ input: GetQuestInputStub({ questId: 'add-auth', stage: 'spec' }) });
 * // Returns: { success: true, quest: {...} } with only spec-stage sections populated; other sections are empty arrays
 *
 * const sliced = await questGetBroker({ input: GetQuestInputStub({ questId: 'add-auth', stage: 'planning', slice: ['backend'] }) });
 * // Returns quest with steps[] filtered to entries whose step.slice is in the slice array. Other sections are unaffected.
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { getQuestInputContract } from '@dungeonmaster/shared/contracts';
import type { GetQuestInput } from '@dungeonmaster/shared/contracts';
import { getQuestResultContract } from '@dungeonmaster/shared/contracts';
import type { GetQuestResult } from '@dungeonmaster/shared/contracts';
import { questSectionFilterTransformer } from '../../../transformers/quest-section-filter/quest-section-filter-transformer';
import { questStageToSectionsTransformer } from '../../../transformers/quest-stage-to-sections/quest-stage-to-sections-transformer';
import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../load/quest-load-broker';

export const questGetBroker = async ({
  input,
}: {
  input: GetQuestInput;
}): Promise<GetQuestResult> => {
  try {
    const validated = getQuestInputContract.parse(input);

    const sections =
      validated.stage === undefined
        ? undefined
        : questStageToSectionsTransformer({ stage: validated.stage });

    const { questPath } = await questFindQuestPathBroker({ questId: validated.questId });

    const questFilePath = filePathContract.parse(
      pathJoinAdapter({ paths: [questPath, locationsStatics.quest.questFile] }),
    );

    const loadedQuest = await questLoadBroker({ questFilePath });

    const filtered = questSectionFilterTransformer({
      quest: loadedQuest,
      ...(sections !== undefined && { sections }),
    });

    const quest =
      validated.slice === undefined
        ? filtered
        : {
            ...filtered,
            steps: filtered.steps.filter((step) => validated.slice?.includes(step.slice)),
          };

    return getQuestResultContract.parse({
      success: true,
      quest,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return getQuestResultContract.parse({
      success: false,
      error: errorMessage,
    });
  }
};
