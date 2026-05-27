import {
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { chaoswhispererGapMinionStatics } from '../../../statics/chaoswhisperer-gap-minion/chaoswhisperer-gap-minion-statics';

import { AgentPromptGetResponder } from './agent-prompt-get-responder';
import { AgentPromptGetResponderProxy } from './agent-prompt-get-responder.proxy';

describe('AgentPromptGetResponder', () => {
  it('VALID: {agent: chaoswhisperer-gap-minion, questId, workItemId} => returns substituted prompt', async () => {
    const proxy = AgentPromptGetResponderProxy();
    const workItemId = QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' });
    const workItem = WorkItemStub({ id: workItemId, role: 'codeweaver' });
    const quest = QuestStub({
      id: QuestIdStub({ value: 'add-auth' }),
      workItems: [workItem],
    });
    proxy.setupQuestFound({ quest });

    const result = await AgentPromptGetResponder({
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
});
