/**
 * PURPOSE: Drives the `file` step verb — resolves the path against the lane's throwaway home
 * directory (`lane.homePath`) or its evidence directory (`lane.evidencePath` for process logs),
 * checks for existence, and reads its contents from disk as ContentText. Reach for this over
 * browser-based DOM reading when inspecting files written by the application (such as logs,
 * outboxes, transcripts, or persisted quest records), especially on operational browserless lanes
 * where no screen exists. Throws StepFileNotFoundError if the file is absent in both, which
 * expect: 'error' turns into a passing adversarial test.
 *
 * USAGE:
 * await stepFileBroker({ lane, path: StepFilePathStub({ value: 'api-server.log' }) });
 * // Returns file contents as ContentText
 */

import { join } from '#gateway/node/path';

import { readFile, statIfExists } from '#gateway/node/fs__promises';
import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import { StepFileNotFoundError } from '../../../errors/step-file-not-found/step-file-not-found-error';

export const stepFileBroker = async ({
  lane,
  path,
}: {
  lane: LaneSession;
  path: string;
}): Promise<string> => {
  const homeFilePath = join(lane.homePath, path);
  const homeStat = await statIfExists(homeFilePath);

  if (homeStat !== null) {
    const content = await readFile(homeFilePath);
    return content;
  }

  const evidenceFilePath = join(lane.evidencePath, path);
  const evidenceStat = await statIfExists(evidenceFilePath);

  if (evidenceStat !== null) {
    const content = await readFile(evidenceFilePath);
    return content;
  }

  throw new StepFileNotFoundError({ path, homePath: lane.homePath });
};
