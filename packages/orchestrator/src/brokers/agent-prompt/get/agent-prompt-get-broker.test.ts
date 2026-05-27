import {
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { chaoswhispererGapMinionStatics } from '../../../statics/chaoswhisperer-gap-minion/chaoswhisperer-gap-minion-statics';

import { agentPromptGetBroker } from './agent-prompt-get-broker';
import { agentPromptGetBrokerProxy } from './agent-prompt-get-broker.proxy';

describe('agentPromptGetBroker', () => {
  describe('full {agent, questId, workItemId} path', () => {
    it('VALID: {agent: chaoswhisperer-gap-minion, questId, workItemId} => returns prompt with $ARGUMENTS substituted', async () => {
      const proxy = agentPromptGetBrokerProxy();
      const workItemId = QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' });
      const workItem = WorkItemStub({ id: workItemId, role: 'codeweaver' });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'add-auth' }),
        packagesAffected: ['orchestrator'],
        workItems: [workItem],
      });
      proxy.setupQuestFound({ quest });

      const result = await agentPromptGetBroker({
        agent: 'chaoswhisperer-gap-minion',
        questId: quest.id,
        workItemId,
      });

      const expectedArgs = `Quest ID: ${String(quest.id)}\nWork Item ID: ${String(workItemId)}`;

      expect(result).toStrictEqual({
        name: 'chaoswhisperer-gap-minion',
        model: 'sonnet',
        prompt: chaoswhispererGapMinionStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      });
    });

    it('ERROR: {agent, questId, workItemId not on quest} => throws workItem-not-found error', async () => {
      const proxy = agentPromptGetBrokerProxy();
      const quest = QuestStub({
        id: QuestIdStub({ value: 'add-auth' }),
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
          }),
        ],
      });
      proxy.setupQuestFound({ quest });

      const missingId = QuestWorkItemIdStub({ value: 'ffffffff-1111-4222-9333-444444444444' });

      await expect(
        agentPromptGetBroker({
          agent: 'chaoswhisperer-gap-minion',
          questId: quest.id,
          workItemId: missingId,
        }),
      ).rejects.toThrow(/workItem .* not found on quest/u);
    });
  });

  describe('session id capture path', () => {
    it('VALID: {agent, questId, workItemId} => broker returns substituted prompt WITHOUT persisting sessionId (Fallback B defer-to-line-emit)', async () => {
      const proxy = agentPromptGetBrokerProxy();
      const workItemId = QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' });
      const workItem = WorkItemStub({ id: workItemId, role: 'codeweaver' });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'add-auth' }),
        workItems: [workItem],
      });
      proxy.setupQuestFound({ quest });

      const result = await agentPromptGetBroker({
        agent: 'chaoswhisperer-gap-minion',
        questId: quest.id,
        workItemId,
      });

      // Returned prompt is the chaoswhisperer-gap-minion template with $ARGUMENTS substituted...
      const expectedArgs = `Quest ID: ${String(quest.id)}\nWork Item ID: ${String(workItemId)}`;

      expect(result.prompt).toBe(
        chaoswhispererGapMinionStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      );
      // ... and the work item on disk still has no sessionId (broker did not call quest-persist).
      // workItem.sessionId is undefined under Fallback B until chat-line convergence picks it up.
      expect(workItem.sessionId).toBe(undefined);
    });
  });
});
