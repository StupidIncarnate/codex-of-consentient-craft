import {
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { computeNextStepFromQuestLayerBroker } from './compute-next-step-from-quest-layer-broker';
import { computeNextStepFromQuestLayerBrokerProxy } from './compute-next-step-from-quest-layer-broker.proxy';

// Bug-hunt chain ids (shape produced by questBuildBugHuntGraphBroker, whose own test verifies it).
const PESTEATER_ID = QuestWorkItemIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
const WARD_CHANGED_ID = QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' });
const LAWBRINGER_ID = QuestWorkItemIdStub({ value: 'cccccccc-1111-4222-9333-444444444444' });
const BLIGHTWARDEN_ID = QuestWorkItemIdStub({ value: 'dddddddd-1111-4222-9333-444444444444' });
const WARD_FULL_ID = QuestWorkItemIdStub({ value: 'eeeeeeee-1111-4222-9333-444444444444' });

const bugHuntItems = ({
  completeIds,
}: {
  completeIds: readonly ReturnType<typeof QuestWorkItemIdStub>[];
}): ReturnType<typeof WorkItemStub>[] => {
  const statusFor = (id: ReturnType<typeof QuestWorkItemIdStub>): 'complete' | 'pending' =>
    completeIds.includes(id) ? 'complete' : 'pending';

  return [
    WorkItemStub({
      id: PESTEATER_ID,
      role: 'pesteater',
      status: statusFor(PESTEATER_ID),
      dependsOn: [],
    }),
    WorkItemStub({
      id: WARD_CHANGED_ID,
      role: 'ward',
      spawnerType: 'command',
      wardMode: 'changed',
      status: statusFor(WARD_CHANGED_ID),
      dependsOn: [PESTEATER_ID],
    }),
    WorkItemStub({
      id: LAWBRINGER_ID,
      role: 'lawbringer',
      status: statusFor(LAWBRINGER_ID),
      dependsOn: [WARD_CHANGED_ID],
    }),
    WorkItemStub({
      id: BLIGHTWARDEN_ID,
      role: 'blightwarden',
      status: statusFor(BLIGHTWARDEN_ID),
      dependsOn: [LAWBRINGER_ID],
    }),
    WorkItemStub({
      id: WARD_FULL_ID,
      role: 'ward',
      spawnerType: 'command',
      wardMode: 'full',
      status: statusFor(WARD_FULL_ID),
      dependsOn: [BLIGHTWARDEN_ID],
    }),
  ];
};

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
          taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${cwId}",\n  questId: "${questId}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${cwId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>",\n  operationStatus: "done" | "partial"\n}).`,
        },
      ],
    });
  });

  it('VALID: {quest in_progress, chaoswhisperer complete, codeweaver pending depends on it} => spawn-agents codeweaver (a ready dependent must dispatch)', () => {
    computeNextStepFromQuestLayerBrokerProxy();
    const questId = QuestIdStub({ value: '4226b8d1-2827-4250-8d82-c278d66bcd2d' });
    const chaosId = QuestWorkItemIdStub({ value: '53e47119-0000-4000-8000-000000000000' });
    const dependentId = QuestWorkItemIdStub({ value: '8c858ffd-e132-4cf6-8d2c-defbeec99810' });
    const quest = QuestStub({
      id: questId,
      status: 'in_progress',
      workItems: [
        WorkItemStub({ id: chaosId, role: 'chaoswhisperer', status: 'complete', dependsOn: [] }),
        WorkItemStub({
          id: dependentId,
          role: 'codeweaver',
          status: 'pending',
          dependsOn: [chaosId],
        }),
      ],
    });

    expect(computeNextStepFromQuestLayerBroker({ quest })).toStrictEqual({
      type: 'spawn-agents',
      agents: [
        {
          questId,
          role: 'codeweaver',
          workItemId: dependentId,
          taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${String(dependentId)}",\n  questId: "${String(questId)}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${String(questId)}",\n  workItemId: "${String(dependentId)}",\n  signal: "complete",\n  operationItemId: "<your operation item id>",\n  operationStatus: "done" | "partial"\n}).`,
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

  describe('bug-hunt dispatch walk', () => {
    it('VALID: {pesteater pending} => spawn-agents pesteater first', () => {
      computeNextStepFromQuestLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'fix-bug' });
      const quest = QuestStub({
        id: questId,
        questType: 'bug-hunt',
        workItems: bugHuntItems({ completeIds: [] }),
      });

      expect(computeNextStepFromQuestLayerBroker({ quest })).toStrictEqual({
        type: 'spawn-agents',
        agents: [
          {
            questId,
            role: 'pesteater',
            workItemId: PESTEATER_ID,
            taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "pesteater",\n  workItemId: "${String(PESTEATER_ID)}",\n  questId: "fix-bug"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "fix-bug",\n  workItemId: "${String(PESTEATER_ID)}",\n  signal: "complete",\n  operationItemId: "<your operation item id>",\n  operationStatus: "done" | "partial"\n}).`,
          },
        ],
      });
    });

    it('VALID: {pesteater complete} => run-ward changed', () => {
      computeNextStepFromQuestLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'fix-bug' });
      const quest = QuestStub({
        id: questId,
        questType: 'bug-hunt',
        workItems: bugHuntItems({ completeIds: [PESTEATER_ID] }),
      });

      expect(computeNextStepFromQuestLayerBroker({ quest })).toStrictEqual({
        type: 'run-ward',
        questId,
        workItemId: WARD_CHANGED_ID,
        mode: 'changed',
      });
    });

    it('VALID: {through ward(changed)} => spawn-agents lawbringer', () => {
      computeNextStepFromQuestLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'fix-bug' });
      const quest = QuestStub({
        id: questId,
        questType: 'bug-hunt',
        workItems: bugHuntItems({ completeIds: [PESTEATER_ID, WARD_CHANGED_ID] }),
      });

      expect(computeNextStepFromQuestLayerBroker({ quest })).toStrictEqual({
        type: 'spawn-agents',
        agents: [
          {
            questId,
            role: 'lawbringer',
            workItemId: LAWBRINGER_ID,
            taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "lawbringer",\n  workItemId: "${String(LAWBRINGER_ID)}",\n  questId: "fix-bug"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "fix-bug",\n  workItemId: "${String(LAWBRINGER_ID)}",\n  signal: "complete",\n  operationItemId: "<your operation item id>",\n  operationStatus: "done" | "partial"\n}).`,
          },
        ],
      });
    });

    it('VALID: {through lawbringer} => spawn-agents blightwarden', () => {
      computeNextStepFromQuestLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'fix-bug' });
      const quest = QuestStub({
        id: questId,
        questType: 'bug-hunt',
        workItems: bugHuntItems({ completeIds: [PESTEATER_ID, WARD_CHANGED_ID, LAWBRINGER_ID] }),
      });

      expect(computeNextStepFromQuestLayerBroker({ quest })).toStrictEqual({
        type: 'spawn-agents',
        agents: [
          {
            questId,
            role: 'blightwarden',
            workItemId: BLIGHTWARDEN_ID,
            taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "blightwarden",\n  workItemId: "${String(BLIGHTWARDEN_ID)}",\n  questId: "fix-bug"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "fix-bug",\n  workItemId: "${String(BLIGHTWARDEN_ID)}",\n  signal: "complete",\n  operationItemId: "<your operation item id>",\n  operationStatus: "done" | "partial"\n}).`,
          },
        ],
      });
    });

    it('VALID: {through blightwarden} => run-ward full', () => {
      computeNextStepFromQuestLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'fix-bug' });
      const quest = QuestStub({
        id: questId,
        questType: 'bug-hunt',
        workItems: bugHuntItems({
          completeIds: [PESTEATER_ID, WARD_CHANGED_ID, LAWBRINGER_ID, BLIGHTWARDEN_ID],
        }),
      });

      expect(computeNextStepFromQuestLayerBroker({ quest })).toStrictEqual({
        type: 'run-ward',
        questId,
        workItemId: WARD_FULL_ID,
        mode: 'full',
      });
    });

    it('VALID: {all items complete} => null (chain exhausted)', () => {
      computeNextStepFromQuestLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'fix-bug' });
      const quest = QuestStub({
        id: questId,
        questType: 'bug-hunt',
        workItems: bugHuntItems({
          completeIds: [
            PESTEATER_ID,
            WARD_CHANGED_ID,
            LAWBRINGER_ID,
            BLIGHTWARDEN_ID,
            WARD_FULL_ID,
          ],
        }),
      });

      expect(computeNextStepFromQuestLayerBroker({ quest })).toBe(null);
    });
  });
});
