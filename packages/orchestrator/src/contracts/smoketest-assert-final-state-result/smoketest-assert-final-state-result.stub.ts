/**
 * PURPOSE: Builds a valid SmoketestAssertFinalStateResult for tests
 *
 * USAGE:
 * SmoketestAssertFinalStateResultStub();
 * // Returns a valid SmoketestAssertFinalStateResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { smoketestAssertFinalStateResultContract } from './smoketest-assert-final-state-result-contract';
import type { SmoketestAssertFinalStateResult } from './smoketest-assert-final-state-result-contract';

export const SmoketestAssertFinalStateResultStub = ({
  ...props
}: StubArgument<SmoketestAssertFinalStateResult> = {}): SmoketestAssertFinalStateResult =>
  smoketestAssertFinalStateResultContract.parse({ passed: false, failures: [], ...props });
