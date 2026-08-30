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
 * const sliced = await questGetBroker({ input: GetQuestInputStub({ questId: 'add-auth', flowId: 'login', packageName: 'web' }) });
 * // Returns: { success: true, quest: {...}, flowSlice: '<rendered one-flow spec>' }
 *
 * THE SLICE IS A SIBLING ENTRY POINT, NOT A REWRITE. `stage` still filters sections exactly as it
 * always has, and the quest it returns is untouched by the slice; `flowSlice` is an ADDITIONAL
 * rendered field, present only when the caller named a flow or a package. The two arguments are
 * mutually exclusive at the contract, so no call reaches here asking for both.
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { getQuestInputContract } from '@dungeonmaster/shared/contracts';
import type { GetQuestInput } from '@dungeonmaster/shared/contracts';
import { getQuestResultContract } from '@dungeonmaster/shared/contracts';
import type { GetQuestResult } from '@dungeonmaster/shared/contracts';
import { questFlowSliceTransformer } from '@dungeonmaster/shared/transformers';
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

    // Rendered from the UNFILTERED quest: a slice already decides for itself which flow, contracts
    // and decisions it carries, and running it over a section-filtered quest would hand it empty
    // arrays it cannot tell from a quest that genuinely has none.
    const flowSlice =
      validated.flowId === undefined && validated.packageName === undefined
        ? undefined
        : questFlowSliceTransformer({
            quest: loadedQuest,
            ...(validated.flowId !== undefined && { flowId: validated.flowId }),
            ...(validated.packageName !== undefined && { packageName: validated.packageName }),
          });

    return getQuestResultContract.parse({
      success: true,
      quest: filtered,
      ...(flowSlice !== undefined && { flowSlice }),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return getQuestResultContract.parse({
      success: false,
      error: errorMessage,
    });
  }
};
