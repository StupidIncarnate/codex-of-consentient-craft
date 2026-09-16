/**
 * PURPOSE: Takes the step windows off an already-parsed transcript and slices `api-server.log` by
 * their byte range — `results { kind: 'server' }`'s own read (chunk-03-read-path-and-perception.md
 * §3.A: "the server log is NOT copied… `results { kind: 'server' }` slices the real log by that
 * range"). The target steps come from `where.steps` (a range, unioned) when given, else the single
 * top-level `step`, else every step the transcript holds — so `results { kind: 'server' }` alone,
 * naming neither, still answers the whole run's window. `where.level: 'error'` reuses
 * `resultsStatics.patterns.serverError` — the SAME pattern `runIndexComputeTransformer` classifies a
 * server line with; `'warn'`/`'info'` have no server-log classification in this codebase and pass
 * every line through unfiltered. A target step with no matching window (an out-of-range `step`)
 * answers `[]` rather than falling back to the whole log.
 *
 * USAGE:
 * await serverWindowReadLayerBroker({
 *   evidencePath: AbsoluteFilePathStub({ value: '/repo/.siegelense/.../inst_1' }),
 *   readings: [StepReadingStub({ step: 7, serverWindow: { fromByte: 900, toByte: 1400 } })],
 *   step: null, where: ResultWhereStub({ steps: '6-8', level: 'error' }),
 * });
 * // Returns the error lines inside the byte windows of steps 6 through 8
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { absoluteFilePathContract, contentTextContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, ContentText } from '@dungeonmaster/shared/contracts';

import { errorIsNativeErrorAdapter } from '../../../adapters/error/is-native-error/error-is-native-error-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import type { ResultWhere } from '../../../contracts/result-where/result-where-contract';
import type { StepIndex } from '../../../contracts/step-index/step-index-contract';
import type { StepReading } from '../../../contracts/step-reading/step-reading-contract';
import { resultsStatics } from '../../../statics/results/results-statics';
import { stepRangeExpandTransformer } from '../../../transformers/step-range-expand/step-range-expand-transformer';

export const serverWindowReadLayerBroker = async ({
  evidencePath,
  readings,
  step,
  where,
}: {
  evidencePath: AbsoluteFilePath;
  readings: readonly StepReading[];
  step: StepIndex | null;
  where: ResultWhere | null;
}): Promise<readonly ContentText[]> => {
  const stepRange = where?.steps ?? null;

  const targetSteps: readonly StepIndex[] =
    stepRange === null
      ? step === null
        ? readings.map((reading) => reading.step)
        : [step]
      : stepRangeExpandTransformer({ range: stepRange });

  const targetWindows = readings
    .filter((reading) => targetSteps.includes(reading.step))
    .map((reading) => reading.serverWindow);

  if (targetWindows.length === 0) {
    return [];
  }

  const fromByte = Math.min(...targetWindows.map((window) => window.fromByte));
  const toByte = Math.max(...targetWindows.map((window) => window.toByte));

  const logPath = absoluteFilePathContract.parse(
    pathJoinAdapter({ paths: [evidencePath, locationsStatics.siegelense.apiLog] }),
  );

  const content = await fsReadFileAdapter({ filePath: logPath }).catch((error: unknown) => {
    if (
      error !== null &&
      typeof error === 'object' &&
      errorIsNativeErrorAdapter({ value: error }) &&
      'cause' in error &&
      error.cause !== null &&
      typeof error.cause === 'object' &&
      errorIsNativeErrorAdapter({ value: error.cause }) &&
      'code' in error.cause &&
      error.cause.code === 'ENOENT'
    ) {
      return null;
    }
    throw error;
  });

  if (content === null) {
    return [];
  }

  const sliced = Buffer.from(content, 'utf8').subarray(fromByte, toByte).toString('utf8');
  const lines = sliced
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => contentTextContract.parse(line));

  const level = where?.level ?? null;
  if (level !== 'error') {
    return lines;
  }

  const pattern = new RegExp(
    resultsStatics.patterns.serverError.source,
    resultsStatics.patterns.serverError.flags,
  );

  return lines.filter((line) => pattern.test(line));
};
