/**
 * PURPOSE: Spawns Claude CLI subprocess with pathseeker prompt for quest file mapping
 *
 * USAGE:
 * await pathseekerSpawnBroker({questId: QuestIdStub({value: 'add-auth'})});
 * // Spawns claude subprocess with pathseeker prompt, returns exit code
 */

import type { ExitCode, QuestId } from '@dungeonmaster/shared/contracts';

import { claudeSpawnBroker } from '../../claude/spawn/claude-spawn-broker';
import { promptTextContract } from '../../../contracts/prompt-text/prompt-text-contract';
import { pathseekerPromptStatics } from '../../../statics/pathseeker-prompt/pathseeker-prompt-statics';

export const pathseekerSpawnBroker = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<{ exitCode: ExitCode | null }> => {
  // Replace placeholder with quest ID
  const promptText = pathseekerPromptStatics.prompt.template.replace(
    pathseekerPromptStatics.prompt.placeholders.arguments,
    `Quest ID: ${questId}`,
  );

  const prompt = promptTextContract.parse(promptText);

  return claudeSpawnBroker({ prompt });
};
