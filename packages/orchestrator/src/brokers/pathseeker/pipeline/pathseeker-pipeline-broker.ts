/**
 * PURPOSE: Manages the PathSeeker verification pipeline with retry logic
 *
 * USAGE:
 * await pathseekerPipelineBroker({processId, questId, killableProcess, attempt: 0, onVerifySuccess: () => {}, onProcessUpdate: () => {}});
 * // Waits for PathSeeker exit, re-loads quest, succeeds if status is in_progress, otherwise re-spawns
 */

import type { AdapterResult, FilePath, ProcessId, QuestId } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';

import { childProcessSpawnStreamJsonAdapter } from '../../../adapters/child-process/spawn-stream-json/child-process-spawn-stream-json-adapter';
import { killableProcessContract } from '../../../contracts/killable-process/killable-process-contract';
import type { KillableProcess } from '../../../contracts/killable-process/killable-process-contract';
import { promptTextContract } from '../../../contracts/prompt-text/prompt-text-contract';
import { getQuestInputContract } from '@dungeonmaster/shared/contracts';
import {
  isActivelyExecutingQuestStatusGuard,
  isPathseekerRunningQuestStatusGuard,
} from '@dungeonmaster/shared/guards';
import { questGetBroker } from '../../quest/get/quest-get-broker';
import { pathseekerPipelineStatics } from '../../../statics/pathseeker-pipeline/pathseeker-pipeline-statics';
import { pathseekerPromptStatics } from '../../../statics/pathseeker-prompt/pathseeker-prompt-statics';

// Retry cap applies to the ENTIRE seek_* -> in_progress pipeline. An "attempt" is
// one agent spawn; reaching in_progress (via modify-quest) ends the cycle. If the
// agent crashes mid-phase or signals complete without transitioning to in_progress,
// that counts as one attempt used.
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
}): Promise<AdapterResult> => {
  const result = adapterResultContract.parse({ success: true });
  if (attempt >= pathseekerPipelineStatics.limits.maxAttempts) {
    return result;
  }

  await killableProcess.waitForExit();

  // Re-load quest fresh after the agent signals complete so we observe the final
  // status written by modify-quest. Completeness enforcement lives inside
  // modify-quest's seek_plan -> in_progress transition; the pipeline only needs
  // to confirm the agent actually reached in_progress.
  const getInput = getQuestInputContract.parse({ questId });
  const postResult = await questGetBroker({ input: getInput });

  if (
    postResult.success &&
    postResult.quest &&
    isActivelyExecutingQuestStatusGuard({ status: postResult.quest.status })
  ) {
    onVerifySuccess();
    return result;
  }

  // Agent either failed, crashed, or signaled complete without transitioning to
  // in_progress. Treat as failed and retry (depth-limited by maxAttempts).
  const currentStatus =
    postResult.success && postResult.quest ? postResult.quest.status : 'seek_scope';

  const statusLine = `Current status: ${currentStatus}.`;
  const seekGuidance = isPathseekerRunningQuestStatusGuard({ status: currentStatus })
    ? '\nPrior planningNotes may exist — call get-planning-notes to load before starting work. Do NOT redo any phase whose artifact is already committed.'
    : '';

  // Prepend (not append) the resume hint before existing quest context so the
  // agent sees the status/resume instruction first. The existing quest context
  // (Quest ID) continues below per the pathseeker-prompt template's $ARGUMENTS
  // placeholder contract.
  const resumeHint = `${statusLine}${seekGuidance}\n\nQuest ID: ${questId}`;

  const promptText = pathseekerPromptStatics.prompt.template.replace(
    pathseekerPromptStatics.prompt.placeholders.arguments,
    resumeHint,
  );

  const prompt = promptTextContract.parse(promptText);
  const { process: childProcess } = childProcessSpawnStreamJsonAdapter({ prompt, cwd: startPath });

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
