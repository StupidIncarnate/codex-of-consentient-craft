/**
 * PURPOSE: The `api-server.log` byte range a `results --kind server` query covers — from the
 * earliest `fromByte` to the latest `toByte` of the steps it selects (`--step`, a `where.steps`
 * range, or every step in the run) — so an EMPTY server answer can say which window was empty
 * rather than just "none found". Picks steps exactly as `serverWindowReadLayerBroker` does, so the
 * range named and the range read can never disagree. `null` when no selected step recorded a window.
 *
 * USAGE:
 * serverWindowCoverTransformer({ readings: [StepReadingStub({ serverWindow: { fromByte: 10, toByte: 40 } })], step: null, where: null });
 * // Returns { fromByte: 10, toByte: 40 }
 */

import type { ResultWhere } from '../../contracts/result-where/result-where-contract';
import { serverLogWindowContract } from '../../contracts/server-log-window/server-log-window-contract';
import type { ServerLogWindow } from '../../contracts/server-log-window/server-log-window-contract';
import type { StepIndex } from '../../contracts/step-index/step-index-contract';
import type { StepReading } from '../../contracts/step-reading/step-reading-contract';
import { stepRangeExpandTransformer } from '../step-range-expand/step-range-expand-transformer';

export const serverWindowCoverTransformer = ({
  readings,
  step,
  where,
}: {
  readings: readonly StepReading[];
  step: StepIndex | null;
  where: ResultWhere | null;
}): ServerLogWindow | null => {
  const stepRange = where?.steps ?? null;
  const selectedSteps: readonly StepIndex[] =
    stepRange === null
      ? step === null
        ? readings.map((reading) => reading.step)
        : [step]
      : stepRangeExpandTransformer({ range: stepRange });

  const windows = readings
    .filter((reading) => selectedSteps.includes(reading.step))
    .map((reading) => reading.serverWindow);

  if (windows.length === 0) {
    return null;
  }

  return serverLogWindowContract.parse({
    fromByte: Math.min(...windows.map((window) => window.fromByte)),
    toByte: Math.max(...windows.map((window) => window.toByte)),
  });
};
