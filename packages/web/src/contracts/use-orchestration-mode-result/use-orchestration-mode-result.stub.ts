/**
 * PURPOSE: Builds a valid UseOrchestrationModeResult for tests
 *
 * USAGE:
 * UseOrchestrationModeResultStub();
 * // Returns a valid UseOrchestrationModeResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { OrchestrationModeStub } from '@dungeonmaster/shared/contracts/orchestration-mode/orchestration-mode.stub';

import { useOrchestrationModeResultContract } from './use-orchestration-mode-result-contract';
import type { UseOrchestrationModeResult } from './use-orchestration-mode-result-contract';

export const UseOrchestrationModeResultStub = ({
  ...props
}: StubArgument<UseOrchestrationModeResult> = {}): UseOrchestrationModeResult =>
  useOrchestrationModeResultContract.parse({
    mode: OrchestrationModeStub(),
    isLoading: false,
    ...props,
  });
