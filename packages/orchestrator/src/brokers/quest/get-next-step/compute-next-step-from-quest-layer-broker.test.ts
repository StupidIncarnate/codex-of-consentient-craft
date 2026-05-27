import {
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { computeNextStepFromQuestLayerBroker } from './compute-next-step-from-quest-layer-broker';
import { computeNextStepFromQuestLayerBrokerProxy } from './compute-next-step-from-quest-layer-broker.proxy';

describe('computeNextStepFromQuestLayerBroker', () => {
  it('EMPTY: {quest with no ready items} => returns null', () => {
    computeNextStepFromQuestLayerBrokerProxy();
    const quest = QuestStub({
      workItems: [WorkItemStub({ status: 'in_progress' })],
    });

    const result = computeNextStepFromQuestLayerBroker({ quest });

    expect(result).toBe(null);
  });

  it('VALID: {ready ward item} => returns run-ward (always alone)', () => {
    computeNextStepFromQuestLayerBrokerProxy();
    const questId = QuestIdStub({ value: 'q-ward' });
    const wardId = QuestWorkItemIdStub({
      value: 'aaa11111-1111-4222-9333-444444444444',
    });
    const cwId = QuestWorkItemIdStub({
      value: 'aaa22222-1111-4222-9333-444444444444',
    });
    const quest = QuestStub({
      id: questId,
      workItems: [
        WorkItemStub({ id: cwId, role: 'codeweaver', status: 'pending' }),
        WorkItemStub({
          id: wardId,
          role: 'ward',
          status: 'pending',
          spawnerType: 'command',
          wardMode: 'changed',
        }),
      ],
    });

    const result = computeNextStepFromQuestLayerBroker({ quest });

    expect(result).toStrictEqual({
      type: 'run-ward',
      questId,
      workItemId: wardId,
      mode: 'changed',
    });
  });

  it('VALID: {ready codeweaver only} => returns spawn-agents with one codeweaver', () => {
    computeNextStepFromQuestLayerBrokerProxy();
    const questId = QuestIdStub({ value: 'q-cw' });
    const cwId = QuestWorkItemIdStub({
      value: 'aaa33333-1111-4222-9333-444444444444',
    });
    const quest = QuestStub({
      id: questId,
      workItems: [WorkItemStub({ id: cwId, role: 'codeweaver', status: 'pending' })],
    });

    const result = computeNextStepFromQuestLayerBroker({ quest });

    expect(result).toStrictEqual({
      type: 'spawn-agents',
      agents: [
        {
          questId,
          role: 'codeweaver',
          workItemId: cwId,
          taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${cwId}",\n  questId: "${questId}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${cwId}",\n  signal: "complete" | "failed",\n  summary: "<one-line>"\n}).`,
        },
      ],
    });
  });

  it('VALID: {ready ward with no wardMode set} => defaults to changed', () => {
    computeNextStepFromQuestLayerBrokerProxy();
    const questId = QuestIdStub({ value: 'q-ward-default' });
    const wardId = QuestWorkItemIdStub({
      value: 'aaa44444-1111-4222-9333-444444444444',
    });
    const quest = QuestStub({
      id: questId,
      workItems: [
        WorkItemStub({
          id: wardId,
          role: 'ward',
          status: 'pending',
          spawnerType: 'command',
        }),
      ],
    });

    const result = computeNextStepFromQuestLayerBroker({ quest });

    expect(result).toStrictEqual({
      type: 'run-ward',
      questId,
      workItemId: wardId,
      mode: 'changed',
    });
  });
});
