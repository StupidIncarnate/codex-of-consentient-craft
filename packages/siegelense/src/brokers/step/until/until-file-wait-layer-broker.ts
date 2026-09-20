/**
 * PURPOSE: Polls `fs.stat` on a path resolved against the lane's own throwaway home until the file
 * appears or `deadlineAtMs` passes — recursion, not `while (true)`, mirroring `laneReadyWaitBroker`'s
 * own shape. The ONLY `until` form that runs on a browserless lane (R13 — an operational flow has no
 * screen, and still writes files), so `stepUntilBroker` routes here before touching `lane.browser`.
 *
 * USAGE:
 * await untilFileWaitLayerBroker({
 *   homePath: AbsoluteFilePathStub(), file: UntilFilePathStub(), startedAtMs: Date.now(),
 *   deadlineAtMs: Date.now() + 10000, timeoutMs: 10000,
 * });
 * // Resolves the reading once the file appears, or throws UntilCeilingHitError at the ceiling
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { absoluteFilePathContract, contentTextContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, ContentText } from '@dungeonmaster/shared/contracts';

import { fsStatAdapter } from '../../../adapters/fs/stat/fs-stat-adapter';
import type { UntilFilePath } from '../../../contracts/until-file-path/until-file-path-contract';
import { UntilCeilingHitError } from '../../../errors/until-ceiling-hit/until-ceiling-hit-error';
import { driverStatics } from '../../../statics/driver/driver-statics';

export const untilFileWaitLayerBroker = async ({
  homePath,
  file,
  startedAtMs,
  deadlineAtMs,
  timeoutMs,
}: {
  homePath: AbsoluteFilePath;
  file: UntilFilePath;
  startedAtMs: number;
  deadlineAtMs: number;
  timeoutMs: number;
}): Promise<ContentText> => {
  const filePath = absoluteFilePathContract.parse(pathJoinAdapter({ paths: [homePath, file] }));
  const stat = await fsStatAdapter({ filePath });

  if (stat !== null) {
    const waitedMs = Date.now() - startedAtMs;
    return contentTextContract.parse(`${file} appeared after ${String(waitedMs)}ms`);
  }

  if (Date.now() >= deadlineAtMs) {
    throw new UntilCeilingHitError({ descriptor: `file ${file}`, timeoutMs, bufferNote: null });
  }

  await new Promise((resolve) => {
    setTimeout(resolve, driverStatics.run.untilPollMs);
  });

  return untilFileWaitLayerBroker({ homePath, file, startedAtMs, deadlineAtMs, timeoutMs });
};
