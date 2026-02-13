/**
 * PURPOSE: Retrieves a quest by ID by scanning all projects for the quest
 *
 * USAGE:
 * const result = await questGetBroker({ input: GetQuestInputStub({ questId: 'add-auth' }) });
 * // Returns: { success: true, quest: {...} } or { success: false, error: 'Quest not found' }
 *
 * const filtered = await questGetBroker({ input: GetQuestInputStub({ questId: 'add-auth', stage: 'spec' }) });
 * // Returns: { success: true, quest: {...} } with only spec-stage sections populated; other sections are empty arrays
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { filePathContract } from '@dungeonmaster/shared/contracts';

import { getQuestInputContract } from '../../../contracts/get-quest-input/get-quest-input-contract';
import type { GetQuestInput } from '../../../contracts/get-quest-input/get-quest-input-contract';
import { getQuestResultContract } from '../../../contracts/get-quest-result/get-quest-result-contract';
import type { GetQuestResult } from '../../../contracts/get-quest-result/get-quest-result-contract';
import { questSectionFilterTransformer } from '../../../transformers/quest-section-filter/quest-section-filter-transformer';
import { questStageToSectionsTransformer } from '../../../transformers/quest-stage-to-sections/quest-stage-to-sections-transformer';
import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../load/quest-load-broker';

const QUEST_FILE_NAME = 'quest.json';

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
      pathJoinAdapter({ paths: [questPath, QUEST_FILE_NAME] }),
    );

    const loadedQuest = await questLoadBroker({ questFilePath });

    const quest = questSectionFilterTransformer({
      quest: loadedQuest,
      ...(sections !== undefined && { sections }),
    });

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
