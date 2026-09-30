/**
 * PURPOSE: Builds a valid RunListLayerResult for tests
 *
 * USAGE:
 * RunListLayerResultStub();
 * // Returns a valid RunListLayerResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { SiegeRunStub } from '@dungeonmaster/shared/contracts/siege-run/siege-run.stub';

import { runListLayerResultContract } from './run-list-layer-result-contract';
import type { RunListLayerResult } from './run-list-layer-result-contract';

export const RunListLayerResultStub = ({
  ...props
}: StubArgument<RunListLayerResult> = {}): RunListLayerResult =>
  runListLayerResultContract.parse({
    runCount: 0,
    latestRunId: SiegeRunStub().id,
    evidenceComplete: false,
    ...props,
  });
