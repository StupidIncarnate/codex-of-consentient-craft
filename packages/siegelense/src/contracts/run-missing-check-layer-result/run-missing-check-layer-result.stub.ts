/**
 * PURPOSE: Builds a valid RunMissingCheckLayerResult for tests
 *
 * USAGE:
 * RunMissingCheckLayerResultStub();
 * // Returns a valid RunMissingCheckLayerResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { runMissingCheckLayerResultContract } from './run-missing-check-layer-result-contract';
import type { RunMissingCheckLayerResult } from './run-missing-check-layer-result-contract';

export const RunMissingCheckLayerResultStub = ({
  ...props
}: StubArgument<RunMissingCheckLayerResult> = {}): RunMissingCheckLayerResult =>
  runMissingCheckLayerResultContract.parse({ storedReturnContent: 'sample', ...props });
