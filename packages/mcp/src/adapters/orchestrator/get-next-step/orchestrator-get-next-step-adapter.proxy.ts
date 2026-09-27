/**
 * PURPOSE: Proxy for orchestrator-get-next-step-adapter that mocks the orchestrator package.
 * Composes orchestrator's own cross-package proxy (A00, brands doc T6) instead of registering its
 * own mock on StartOrchestrator.getNextStep — proves the per-file import
 * `@dungeonmaster/orchestrator/startup/start-orchestrator.proxy` resolves and hoists correctly
 * from OUTSIDE the orchestrator package.
 *
 * USAGE:
 * const proxy = orchestratorGetNextStepAdapterProxy();
 * proxy.returns({ step: NextStepStub() });
 */

import type { NextStep } from '@dungeonmaster/orchestrator';
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';

export const orchestratorGetNextStepAdapterProxy = (): {
  returns: (params: { step: NextStep }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    returns: ({ step }: { step: NextStep }): void => {
      orchestrator.getNextStepReturns({ step });
    },
    throws: ({ error }: { error: Error }): void => {
      orchestrator.getNextStepThrows({ error });
    },
  };
};
