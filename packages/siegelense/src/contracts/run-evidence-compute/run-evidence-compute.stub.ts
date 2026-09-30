/**
 * PURPOSE: Builds a valid RunEvidenceCompute for tests
 *
 * USAGE:
 * RunEvidenceComputeStub();
 * // Returns a valid RunEvidenceCompute
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { SiegeRunStub } from '@dungeonmaster/shared/contracts/siege-run/siege-run.stub';

import { runEvidenceComputeContract } from './run-evidence-compute-contract';
import type { RunEvidenceCompute } from './run-evidence-compute-contract';

export const RunEvidenceComputeStub = ({
  ...props
}: StubArgument<RunEvidenceCompute> = {}): RunEvidenceCompute =>
  runEvidenceComputeContract.parse({
    runCount: 0,
    latestRunId: SiegeRunStub().id,
    evidenceComplete: false,
    ...props,
  });
