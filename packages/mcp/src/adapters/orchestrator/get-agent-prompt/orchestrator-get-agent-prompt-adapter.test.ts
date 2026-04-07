import { AgentPromptResultStub } from '../../../contracts/agent-prompt-result/agent-prompt-result.stub';

import { orchestratorGetAgentPromptAdapter } from './orchestrator-get-agent-prompt-adapter';
import { orchestratorGetAgentPromptAdapterProxy } from './orchestrator-get-agent-prompt-adapter.proxy';

describe('orchestratorGetAgentPromptAdapter', () => {
  describe('successful get', () => {
    it('VALID: {agent} => returns AgentPromptResult', () => {
      const proxy = orchestratorGetAgentPromptAdapterProxy();
      const expectedResult = AgentPromptResultStub();

      proxy.returns({ result: expectedResult });

      const result = orchestratorGetAgentPromptAdapter({
        agent: 'quest-gap-reviewer',
      });

      expect(result).toStrictEqual(expectedResult);
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', () => {
      const proxy = orchestratorGetAgentPromptAdapterProxy();

      proxy.throws({ error: new Error('Unknown agent') });

      expect(() =>
        orchestratorGetAgentPromptAdapter({
          agent: 'non-existent',
        }),
      ).toThrow(/Unknown agent/u);
    });
  });
});
