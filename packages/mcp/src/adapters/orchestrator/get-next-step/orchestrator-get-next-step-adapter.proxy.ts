/**
 * PURPOSE: Proxy for orchestrator-get-next-step-adapter that mocks the orchestrator package
 *
 * USAGE:
 * const proxy = orchestratorGetNextStepAdapterProxy();
 * proxy.returns({ step: NextStepStub() });
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { NextStep } from '@dungeonmaster/orchestrator';
import { NextStepStub } from '@dungeonmaster/orchestrator/testing';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const orchestratorGetNextStepAdapterProxy = (): {
  returns: (params: { step: NextStep }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const handle = registerMock({ fn: StartOrchestrator.getNextStep });

  handle.mockResolvedValue(NextStepStub());

  return {
    returns: ({ step }: { step: NextStep }): void => {
      handle.mockResolvedValueOnce(step);
    },
    throws: ({ error }: { error: Error }): void => {
      handle.mockRejectedValueOnce(error);
    },
  };
};
