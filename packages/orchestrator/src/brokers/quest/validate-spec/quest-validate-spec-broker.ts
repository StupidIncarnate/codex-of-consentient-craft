/**
 * PURPOSE: Runs deterministic structural checks on a quest spec BEFORE step generation and returns structured pass/fail results
 *
 * USAGE:
 * const result = await questValidateSpecBroker({ input: ValidateSpecInputStub({ questId: 'add-auth' }) });
 * // Returns: { success: true, checks: [...] } or { success: false, checks: [], error: 'Quest not found' }
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { filePathContract } from '@dungeonmaster/shared/contracts';

import { validateSpecInputContract } from '../../../contracts/validate-spec-input/validate-spec-input-contract';
import type { ValidateSpecInput } from '../../../contracts/validate-spec-input/validate-spec-input-contract';
import { verifyQuestResultContract } from '../../../contracts/verify-quest-result/verify-quest-result-contract';
import type { VerifyQuestResult } from '../../../contracts/verify-quest-result/verify-quest-result-contract';
import { questValidateSpecTransformer } from '../../../transformers/quest-validate-spec/quest-validate-spec-transformer';
import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../load/quest-load-broker';

const QUEST_FILE_NAME = 'quest.json';

export const questValidateSpecBroker = async ({
  input,
}: {
  input: ValidateSpecInput;
}): Promise<VerifyQuestResult> => {
  try {
    const validated = validateSpecInputContract.parse(input);

    const { questPath } = await questFindQuestPathBroker({ questId: validated.questId });

    const questFilePath = filePathContract.parse(
      pathJoinAdapter({ paths: [questPath, QUEST_FILE_NAME] }),
    );

    const loadedQuest = await questLoadBroker({ questFilePath });

    const checks = questValidateSpecTransformer({ quest: loadedQuest });
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
