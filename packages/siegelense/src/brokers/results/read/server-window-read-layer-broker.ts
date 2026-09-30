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
 * answers `[]` rather than falling back to the whole log. `sinceBoot: true` ignores the windows and
 * reads the WHOLE log — `api-server.log` is one file per instance, spanning every run from the
 * server's first boot line on, so it is the one server read `since: 'boot'` can answer.
 *
 * USAGE:
 * await serverWindowReadLayerBroker({
 *   evidencePath: '/repo/.dungeonmaster-assets/siegelense-assets/.../inst_1',
 *   readings: [StepReadingStub({ step: 7, serverWindow: { fromByte: 900, toByte: 1400 } })],
 *   step: null, where: ResultWhereStub({ steps: '6-8', level: 'error' }), sinceBoot: false,
 * });
 * // Returns the error lines inside the byte windows of steps 6 through 8
 */

import { join } from '#gateway/node/path';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { readFileIfExists } from '#gateway/node/fs__promises';
import type { ResultWhere } from '../../../contracts/result-where/result-where-contract';
import type { StepReading } from '../../../contracts/step-reading/step-reading-contract';
import { resultsStatics } from '../../../statics/results/results-statics';
import { stepRangeExpandTransformer } from '../../../transformers/step-range-expand/step-range-expand-transformer';
import { Buffer } from '#gateway/node/buffer';

export const serverWindowReadLayerBroker = async ({
  evidencePath,
  readings,
  step,
  where,
  sinceBoot,
}: {
  evidencePath: string;
  readings: readonly StepReading[];
  step: number | null;
  where: ResultWhere | null;
  sinceBoot: boolean;
}): Promise<readonly string[]> => {
  const stepRange = where?.steps ?? null;

  const targetSteps: readonly number[] =
    stepRange === null
      ? step === null
        ? readings.map((reading) => reading.step)
        : [step]
      : stepRangeExpandTransformer({ range: stepRange });

  const targetWindows = readings
    .filter((reading) => targetSteps.includes(reading.step))
    .map((reading) => reading.serverWindow);

  if (!sinceBoot && targetWindows.length === 0) {
    return [];
  }

  const logPath = join(evidencePath, locationsStatics.siegelense.apiLog);

  const content = await readFileIfExists(logPath);

  if (content === null) {
    return [];
  }

  const sliced = sinceBoot
    ? content
    : Buffer.from(content, 'utf8')
        .subarray(
          Math.min(...targetWindows.map((window) => window.fromByte)),
          Math.max(...targetWindows.map((window) => window.toByte)),
        )
        .toString('utf8');
  const lines = sliced
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => line);

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
