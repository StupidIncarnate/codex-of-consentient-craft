/**
 * PURPOSE: Proxy for orchestrator-get-agent-prompt-adapter that mocks the orchestrator package
 *
 * USAGE:
 * const proxy = orchestratorGetAgentPromptAdapterProxy();
 * proxy.returns({ agent: 'codeweaver', questId, result: AgentPromptResultStub() });
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { AgentPromptResult } from '@dungeonmaster/orchestrator';
import type { QuestId } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const orchestratorGetAgentPromptAdapterProxy = (): {
  returns: (params: { agent: string; questId: QuestId; result: AgentPromptResult }) => void;
  throws: (params: { agent: string; questId: QuestId; error: Error }) => void;
  getLastCallArgs: () => unknown;
} => {
  const handle = registerMock({ fn: StartOrchestrator.getAgentPrompt });

  return {
    returns: ({
      agent,
      questId,
      result,
    }: {
      agent: string;
      questId: QuestId;
      result: AgentPromptResult;
    }): void => {
      handle.calledWith([{ agent, questId }]).resolves(result);
    },
    throws: ({
      agent,
      questId,
      error,
    }: {
      agent: string;
      questId: QuestId;
      error: Error;
    }): void => {
      handle.calledWith([{ agent, questId }]).rejects(error);
    },
    getLastCallArgs: (): unknown =>
      handle
        .callsMatching([])
        .map((call) => call[0])
        .at(-1),
  };
};
