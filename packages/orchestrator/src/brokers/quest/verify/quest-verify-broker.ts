/**
 * PURPOSE: Runs deterministic integrity checks on a quest and returns structured pass/fail results
 *
 * USAGE:
 * const result = await questVerifyBroker({ input: VerifyQuestInputStub({ questId: 'add-auth' }), startPath: FilePathStub({ value: '/project/src' }) });
 * // Returns: { success: true, checks: [...] } or { success: false, checks: [], error: 'Quest not found' }
 */

import { questsFolderEnsureBroker } from '@dungeonmaster/shared/brokers';
import type { FilePath } from '@dungeonmaster/shared/contracts';

import { verifyQuestInputContract } from '../../../contracts/verify-quest-input/verify-quest-input-contract';
import type { VerifyQuestInput } from '../../../contracts/verify-quest-input/verify-quest-input-contract';
import { verifyQuestResultContract } from '../../../contracts/verify-quest-result/verify-quest-result-contract';
import type { VerifyQuestResult } from '../../../contracts/verify-quest-result/verify-quest-result-contract';
import { questVerifyTransformer } from '../../../transformers/quest-verify/quest-verify-transformer';
import { questFolderFindBroker } from '../folder-find/quest-folder-find-broker';

export const questVerifyBroker = async ({
  input,
  startPath,
}: {
  input: VerifyQuestInput;
  startPath: FilePath;
}): Promise<VerifyQuestResult> => {
  try {
    const validated = verifyQuestInputContract.parse(input);

    // Ensure folder exists before searching
    const { questsBasePath } = await questsFolderEnsureBroker({ startPath });

    const findResult = await questFolderFindBroker({
      questId: validated.questId,
      questsPath: questsBasePath,
    });

    if (!findResult.found) {
      return verifyQuestResultContract.parse({
        success: false,
        checks: [],
        error: `Quest not found: ${validated.questId}`,
      });
    }

    const checks = questVerifyTransformer({ quest: findResult.quest });
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
