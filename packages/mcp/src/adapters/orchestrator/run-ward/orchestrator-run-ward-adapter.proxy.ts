/**
 * PURPOSE: Proxy for orchestrator-run-ward-adapter that mocks the orchestrator package
 *
 * USAGE:
 * const proxy = orchestratorRunWardAdapterProxy();
 * proxy.returns({ result: QuestRunWardResultStub() });
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { QuestRunWardResult } from '@dungeonmaster/orchestrator';
import { QuestRunWardResultStub } from '@dungeonmaster/orchestrator/testing';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const orchestratorRunWardAdapterProxy = (): {
  returns: (params: { result: QuestRunWardResult }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const handle = registerMock({ fn: StartOrchestrator.runWard });

  handle.mockResolvedValue(QuestRunWardResultStub());

  return {
    returns: ({ result }: { result: QuestRunWardResult }): void => {
      handle.mockResolvedValueOnce(result);
    },
    throws: ({ error }: { error: Error }): void => {
      handle.mockRejectedValueOnce(error);
    },
  };
};
