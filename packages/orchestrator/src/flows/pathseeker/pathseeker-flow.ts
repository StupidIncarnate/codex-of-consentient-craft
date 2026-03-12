/**
 * PURPOSE: Orchestrates pathseeker pipeline execution by delegating to the pathseeker-pipeline responder
 *
 * USAGE:
 * await PathseekerFlow({ processId, questId, killableProcess, attempt, onVerifySuccess, onProcessUpdate });
 * // Runs the PathSeeker verification pipeline with retry logic
 */

import { PathseekerPipelineResponder } from '../../responders/pathseeker/pipeline/pathseeker-pipeline-responder';

type PipelineParams = Parameters<typeof PathseekerPipelineResponder>[0];
type PipelineResult = Awaited<ReturnType<typeof PathseekerPipelineResponder>>;

export const PathseekerFlow = async ({
  processId,
  questId,
  startPath,
  killableProcess,
  attempt,
  onVerifySuccess,
  onProcessUpdate,
}: PipelineParams): Promise<PipelineResult> =>
  PathseekerPipelineResponder({
    processId,
    questId,
    startPath,
    killableProcess,
    attempt,
    onVerifySuccess,
    onProcessUpdate,
  });
