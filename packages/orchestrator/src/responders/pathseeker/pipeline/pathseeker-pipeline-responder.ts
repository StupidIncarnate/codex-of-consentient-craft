/**
 * PURPOSE: Delegates pathseeker pipeline execution to the pathseeker-pipeline broker
 *
 * USAGE:
 * await PathseekerPipelineResponder({ processId, questId, killableProcess, attempt, onVerifySuccess, onProcessUpdate });
 * // Runs the PathSeeker verification pipeline with retry logic
 */

import type { ProcessId, QuestId } from '@dungeonmaster/shared/contracts';

import type { KillableProcess } from '../../../contracts/killable-process/killable-process-contract';
import { pathseekerPipelineBroker } from '../../../brokers/pathseeker/pipeline/pathseeker-pipeline-broker';

export const PathseekerPipelineResponder = async ({
  processId,
  questId,
  killableProcess,
  attempt,
  onVerifySuccess,
  onProcessUpdate,
}: {
  processId: ProcessId;
  questId: QuestId;
  killableProcess: KillableProcess;
  attempt: number;
  onVerifySuccess: () => void;
  onProcessUpdate: (params: { process: KillableProcess }) => void;
}): Promise<void> =>
  pathseekerPipelineBroker({
    processId,
    questId,
    killableProcess,
    attempt,
    onVerifySuccess,
    onProcessUpdate,
  });
