/**
 * PURPOSE: Proxy for orchestrator-get-agent-prompt-adapter that mocks the orchestrator package
 *
 * USAGE:
 * const proxy = orchestratorGetAgentPromptAdapterProxy();
 * proxy.returns({ result: AgentPromptResultStub() });
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { AgentPromptResult } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { AgentPromptResultStub } from '../../../contracts/agent-prompt-result/agent-prompt-result.stub';

export const orchestratorGetAgentPromptAdapterProxy = (): {
  returns: (params: { result: AgentPromptResult }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const handle = registerMock({ fn: StartOrchestrator.getAgentPrompt });

  handle.mockReturnValue(AgentPromptResultStub());

  return {
    returns: ({ result }: { result: AgentPromptResult }): void => {
      handle.mockReturnValueOnce(result);
    },
    throws: ({ error }: { error: Error }): void => {
      handle.mockImplementationOnce(() => {
        throw error;
      });
    },
  };
};
