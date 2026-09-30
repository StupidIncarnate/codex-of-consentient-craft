/**
 * PURPOSE: Builds a valid SmoketestRunResult for tests
 *
 * USAGE:
 * SmoketestRunResultStub();
 * // Returns a valid SmoketestRunResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { ActiveSmoketestRunStub } from '../active-smoketest-run/active-smoketest-run.stub';

import { smoketestRunResultContract } from './smoketest-run-result-contract';
import type { SmoketestRunResult } from './smoketest-run-result-contract';

export const SmoketestRunResultStub = ({
  ...props
}: StubArgument<SmoketestRunResult> = {}): SmoketestRunResult =>
  smoketestRunResultContract.parse({
    runId: ActiveSmoketestRunStub().runId,
    enqueued: [],
    results: [],
    ...props,
  });
