import {
  AgentPromptResultStub,
  QuestIdStub,
  QuestWorkItemIdStub,
} from '@dungeonmaster/shared/contracts';

import { orchestratorGetAgentPromptAdapter } from './orchestrator-get-agent-prompt-adapter';
import { orchestratorGetAgentPromptAdapterProxy } from './orchestrator-get-agent-prompt-adapter.proxy';

describe('orchestratorGetAgentPromptAdapter', () => {
  describe('successful get', () => {
    it('VALID: {agent, questId, workItemId} => returns AgentPromptResult', async () => {
      const proxy = orchestratorGetAgentPromptAdapterProxy();
      const expectedResult = AgentPromptResultStub();

      proxy.returns({ result: expectedResult });

      const result = await orchestratorGetAgentPromptAdapter({
        agent: 'chaoswhisperer-gap-minion',
        questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
        workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' }),
      });

      expect(result).toStrictEqual(expectedResult);
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorGetAgentPromptAdapterProxy();

      proxy.throws({ error: new Error('Unknown agent') });

      await expect(
        orchestratorGetAgentPromptAdapter({
          agent: 'non-existent',
          questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
          workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' }),
        }),
      ).rejects.toThrow(/Unknown agent/u);
    });
  });
});
