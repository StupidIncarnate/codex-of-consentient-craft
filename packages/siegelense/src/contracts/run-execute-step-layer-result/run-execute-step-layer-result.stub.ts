/**
 * PURPOSE: Builds a valid RunExecuteStepLayerResult for tests
 *
 * USAGE:
 * RunExecuteStepLayerResultStub();
 * // Returns a valid RunExecuteStepLayerResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { StepReadingStub } from '../step-reading/step-reading.stub';
import { StoppedAtStub } from '../stopped-at/stopped-at.stub';

import { runExecuteStepLayerResultContract } from './run-execute-step-layer-result-contract';
import type { RunExecuteStepLayerResult } from './run-execute-step-layer-result-contract';

export const RunExecuteStepLayerResultStub = ({
  ...props
}: StubArgument<RunExecuteStepLayerResult> = {}): RunExecuteStepLayerResult =>
  runExecuteStepLayerResultContract.parse({
    reading: StepReadingStub(),
    stoppedAt: StoppedAtStub(),
    timedOut: false,
    ...props,
  });
