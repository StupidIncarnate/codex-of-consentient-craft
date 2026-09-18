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

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { absoluteFilePathContract, contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsStatAdapter } from '../../../adapters/fs/stat/fs-stat-adapter';
import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import type { StepFilePath } from '../../../contracts/step-file-path/step-file-path-contract';
import { StepFileNotFoundError } from '../../../errors/step-file-not-found/step-file-not-found-error';

export const stepFileBroker = async ({
  lane,
  path,
}: {
  lane: LaneSession;
  path: StepFilePath;
}): Promise<ContentText> => {
  const homeFilePath = absoluteFilePathContract.parse(
    pathJoinAdapter({ paths: [lane.homePath, path] }),
  );
  const homeStat = await fsStatAdapter({ filePath: homeFilePath });

  if (homeStat !== null) {
    const content = await fsReadFileAdapter({ filePath: homeFilePath, encoding: 'utf8' });
    return contentTextContract.parse(content);
  }

  const evidenceFilePath = absoluteFilePathContract.parse(
    pathJoinAdapter({ paths: [lane.evidencePath, path] }),
  );
  const evidenceStat = await fsStatAdapter({ filePath: evidenceFilePath });

  if (evidenceStat !== null) {
    const content = await fsReadFileAdapter({ filePath: evidenceFilePath, encoding: 'utf8' });
    return contentTextContract.parse(content);
  }

  throw new StepFileNotFoundError({ path, homePath: lane.homePath });
};
