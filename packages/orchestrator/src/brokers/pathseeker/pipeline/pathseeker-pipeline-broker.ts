/**
 * PURPOSE: Manages the PathSeeker verification pipeline with retry logic
 *
 * USAGE:
 * await pathseekerPipelineBroker({processId, questId, startPath, killableProcess, attempt: 0, onVerifySuccess: () => {}, onProcessUpdate: () => {}});
 * // Waits for PathSeeker exit, verifies quest, re-spawns if needed
 */

import type { FilePath, ProcessId, QuestId } from '@dungeonmaster/shared/contracts';

import { childProcessSpawnStreamJsonAdapter } from '../../../adapters/child-process/spawn-stream-json/child-process-spawn-stream-json-adapter';
import { killableProcessContract } from '../../../contracts/killable-process/killable-process-contract';
import type { KillableProcess } from '../../../contracts/killable-process/killable-process-contract';
import { promptTextContract } from '../../../contracts/prompt-text/prompt-text-contract';
import { verifyQuestInputContract } from '../../../contracts/verify-quest-input/verify-quest-input-contract';
import { questVerifyBroker } from '../../quest/verify/quest-verify-broker';
import { pathseekerPipelineStatics } from '../../../statics/pathseeker-pipeline/pathseeker-pipeline-statics';
import { pathseekerPromptStatics } from '../../../statics/pathseeker-prompt/pathseeker-prompt-statics';

export const pathseekerPipelineBroker = async ({
  processId,
  questId,
  startPath,
  killableProcess,
  attempt,
  onVerifySuccess,
  onProcessUpdate,
}: {
  processId: ProcessId;
  questId: QuestId;
  startPath: FilePath;
  killableProcess: KillableProcess;
  attempt: number;
  onVerifySuccess: () => void;
  onProcessUpdate: (params: { process: KillableProcess }) => void;
}): Promise<void> => {
  await killableProcess.waitForExit();

  const input = verifyQuestInputContract.parse({ questId });
  const result = await questVerifyBroker({ input, startPath });

  if (result.success) {
    onVerifySuccess();
    return;
  }

  if (attempt >= pathseekerPipelineStatics.limits.maxAttempts) {
    return;
  }

  const promptText = pathseekerPromptStatics.prompt.template.replace(
    pathseekerPromptStatics.prompt.placeholders.arguments,
    `Quest ID: ${questId}`,
  );

  const prompt = promptTextContract.parse(promptText);
  const { process: childProcess } = childProcessSpawnStreamJsonAdapter({ prompt });

  const newKillableProcess = killableProcessContract.parse({
    kill: () => childProcess.kill(),
    waitForExit: async () =>
      new Promise<void>((resolve) => {
        childProcess.on('exit', () => {
          resolve();
        });
      }),
  });

  onProcessUpdate({ process: newKillableProcess });

  return pathseekerPipelineBroker({
    processId,
    questId,
    startPath,
    killableProcess: newKillableProcess,
    attempt: attempt + 1,
    onVerifySuccess,
    onProcessUpdate,
  });
};
