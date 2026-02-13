/**
 * PURPOSE: Runs deterministic integrity checks on a quest and returns structured pass/fail results
 *
 * USAGE:
 * const result = await questVerifyBroker({ input: VerifyQuestInputStub({ questId: 'add-auth' }) });
 * // Returns: { success: true, checks: [...] } or { success: false, checks: [], error: 'Quest not found' }
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { filePathContract } from '@dungeonmaster/shared/contracts';

import { verifyQuestInputContract } from '../../../contracts/verify-quest-input/verify-quest-input-contract';
import type { VerifyQuestInput } from '../../../contracts/verify-quest-input/verify-quest-input-contract';
import { verifyQuestResultContract } from '../../../contracts/verify-quest-result/verify-quest-result-contract';
import type { VerifyQuestResult } from '../../../contracts/verify-quest-result/verify-quest-result-contract';
import { questVerifyTransformer } from '../../../transformers/quest-verify/quest-verify-transformer';
import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../load/quest-load-broker';

const QUEST_FILE_NAME = 'quest.json';

export const questVerifyBroker = async ({
  input,
}: {
  input: VerifyQuestInput;
}): Promise<VerifyQuestResult> => {
  try {
    const validated = verifyQuestInputContract.parse(input);

    const { questPath } = await questFindQuestPathBroker({ questId: validated.questId });

    const questFilePath = filePathContract.parse(
      pathJoinAdapter({ paths: [questPath, QUEST_FILE_NAME] }),
    );

    const loadedQuest = await questLoadBroker({ questFilePath });

    const checks = questVerifyTransformer({ quest: loadedQuest });
    const allChecksPassed = checks.every((check) => check.passed);

    return verifyQuestResultContract.parse({
      success: allChecksPassed,
      checks,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return verifyQuestResultContract.parse({
      success: false,
      checks: [],
      error: errorMessage,
    });
  }
};
