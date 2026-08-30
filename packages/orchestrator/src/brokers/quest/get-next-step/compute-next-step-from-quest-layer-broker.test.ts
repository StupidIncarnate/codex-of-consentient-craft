import {
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { computeNextStepFromQuestLayerBroker } from './compute-next-step-from-quest-layer-broker';
import { computeNextStepFromQuestLayerBrokerProxy } from './compute-next-step-from-quest-layer-broker.proxy';

// Chain ids for a bug-hunt quest's relay tail. questBuildRelayGraphBroker seeds the identical
// relay shape for both quest types: riftcarver, then codeweaver, then ward(changed) -> flowrider
// -> siegemaster -> ward(full).
const CODEWEAVER_ID = QuestWorkItemIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
const WARD_CHANGED_ID = QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' });
const FLOWRIDER_ID = QuestWorkItemIdStub({ value: 'cccccccc-1111-4222-9333-444444444444' });
const SIEGEMASTER_ID = QuestWorkItemIdStub({ value: 'dddddddd-1111-4222-9333-444444444444' });
const WARD_FULL_ID = QuestWorkItemIdStub({ value: 'eeeeeeee-1111-4222-9333-444444444444' });

const relayTailItems = ({
  completeIds,
}: {
  completeIds: readonly ReturnType<typeof QuestWorkItemIdStub>[];
}): ReturnType<typeof WorkItemStub>[] => {
  const statusFor = (id: ReturnType<typeof QuestWorkItemIdStub>): 'complete' | 'pending' =>
    completeIds.includes(id) ? 'complete' : 'pending';

  return [
    WorkItemStub({
      id: CODEWEAVER_ID,
      role: 'codeweaver',
      status: statusFor(CODEWEAVER_ID),
      dependsOn: [],
    }),
    WorkItemStub({
      id: WARD_CHANGED_ID,
      role: 'ward',
      spawnerType: 'command',
      wardMode: 'changed',
      status: statusFor(WARD_CHANGED_ID),
      dependsOn: [CODEWEAVER_ID],
    }),
    WorkItemStub({
      id: FLOWRIDER_ID,
      role: 'flowrider',
      status: statusFor(FLOWRIDER_ID),
      dependsOn: [WARD_CHANGED_ID],
    }),
    WorkItemStub({
      id: SIEGEMASTER_ID,
      role: 'siegemaster',
      status: statusFor(SIEGEMASTER_ID),
      dependsOn: [FLOWRIDER_ID],
    }),
    WorkItemStub({
      id: WARD_FULL_ID,
      role: 'ward',
      spawnerType: 'command',
      wardMode: 'full',
      status: statusFor(WARD_FULL_ID),
      dependsOn: [SIEGEMASTER_ID],
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

  // buildSpawnInstructionLayerBroker parses agentRoleContract and THROWS for a non-agent role, so
  // a riftcarver item reaching the batch below is a crash rather than a mis-dispatch. This branch
  // is what guarantees it never gets there.
  it('VALID: {ready riftcarver item alongside a ready codeweaver} => returns run-riftcarver alone, never a spawn instruction', () => {
    computeNextStepFromQuestLayerBrokerProxy();
    const questId = QuestIdStub({ value: 'q-riftcarver' });
    const carveId = QuestWorkItemIdStub({ value: 'ccc11111-1111-4222-9333-444444444444' });
    const cwId = QuestWorkItemIdStub({ value: 'ccc22222-1111-4222-9333-444444444444' });
    const quest = QuestStub({
      id: questId,
      workItems: [
        WorkItemStub({ id: cwId, role: 'codeweaver', status: 'pending' }),
        WorkItemStub({
          id: carveId,
          role: 'riftcarver',
          status: 'pending',
          spawnerType: 'command',
        }),
      ],
    });

    const result = computeNextStepFromQuestLayerBroker({ quest });

    expect(result).toStrictEqual({
      type: 'run-riftcarver',
      questId,
      workItemId: carveId,
    });
  });

  it('VALID: {ready riftcarver item alone} => returns run-riftcarver with no mode key', () => {
    computeNextStepFromQuestLayerBrokerProxy();
    const questId = QuestIdStub({ value: 'q-riftcarver-solo' });
    const carveId = QuestWorkItemIdStub({ value: 'ccc33333-1111-4222-9333-444444444444' });
    const quest = QuestStub({
      id: questId,
      workItems: [
        WorkItemStub({
          id: carveId,
          role: 'riftcarver',
          status: 'pending',
          spawnerType: 'command',
        }),
      ],
    });

    const result = computeNextStepFromQuestLayerBroker({ quest });

    expect(result).toStrictEqual({
      type: 'run-riftcarver',
      questId,
      workItemId: carveId,
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
          taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${cwId}",\n  questId: "${questId}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${cwId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>",\n  operationStatus: "done" | "partial" | "blocked"\n}).`,
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
          taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${String(dependentId)}",\n  questId: "${String(questId)}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${String(questId)}",\n  workItemId: "${String(dependentId)}",\n  signal: "complete",\n  operationItemId: "<your operation item id>",\n  operationStatus: "done" | "partial" | "blocked"\n}).`,
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
    it('VALID: {codeweaver pending} => spawn-agents codeweaver first', () => {
      computeNextStepFromQuestLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'fix-bug' });
      const quest = QuestStub({
        id: questId,
        questType: 'bug-hunt',
        workItems: relayTailItems({ completeIds: [] }),
      });

      expect(computeNextStepFromQuestLayerBroker({ quest })).toStrictEqual({
        type: 'spawn-agents',
        agents: [
          {
            questId,
            role: 'codeweaver',
            workItemId: CODEWEAVER_ID,
            taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${String(CODEWEAVER_ID)}",\n  questId: "fix-bug"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "fix-bug",\n  workItemId: "${String(CODEWEAVER_ID)}",\n  signal: "complete",\n  operationItemId: "<your operation item id>",\n  operationStatus: "done" | "partial" | "blocked"\n}).`,
          },
        ],
      });
    });

    it('VALID: {codeweaver complete} => run-ward changed', () => {
      computeNextStepFromQuestLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'fix-bug' });
      const quest = QuestStub({
        id: questId,
        questType: 'bug-hunt',
        workItems: relayTailItems({ completeIds: [CODEWEAVER_ID] }),
      });

      expect(computeNextStepFromQuestLayerBroker({ quest })).toStrictEqual({
        type: 'run-ward',
        questId,
        workItemId: WARD_CHANGED_ID,
        mode: 'changed',
      });
    });

    it('VALID: {through ward(changed)} => spawn-agents flowrider', () => {
      computeNextStepFromQuestLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'fix-bug' });
      const quest = QuestStub({
        id: questId,
        questType: 'bug-hunt',
        workItems: relayTailItems({ completeIds: [CODEWEAVER_ID, WARD_CHANGED_ID] }),
      });

      expect(computeNextStepFromQuestLayerBroker({ quest })).toStrictEqual({
        type: 'spawn-agents',
        agents: [
          {
            questId,
            role: 'flowrider',
            workItemId: FLOWRIDER_ID,
            taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "flowrider",\n  workItemId: "${String(FLOWRIDER_ID)}",\n  questId: "fix-bug"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "fix-bug",\n  workItemId: "${String(FLOWRIDER_ID)}",\n  signal: "complete",\n  operationItemId: "<your operation item id>",\n  operationStatus: "done" | "partial" | "blocked"\n}).`,
          },
        ],
      });
    });

    it('VALID: {through flowrider} => spawn-agents siegemaster', () => {
      computeNextStepFromQuestLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'fix-bug' });
      const quest = QuestStub({
        id: questId,
        questType: 'bug-hunt',
        workItems: relayTailItems({
          completeIds: [CODEWEAVER_ID, WARD_CHANGED_ID, FLOWRIDER_ID],
        }),
      });

      expect(computeNextStepFromQuestLayerBroker({ quest })).toStrictEqual({
        type: 'spawn-agents',
        agents: [
          {
            questId,
            role: 'siegemaster',
            workItemId: SIEGEMASTER_ID,
            taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "siegemaster",\n  workItemId: "${String(SIEGEMASTER_ID)}",\n  questId: "fix-bug"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "fix-bug",\n  workItemId: "${String(SIEGEMASTER_ID)}",\n  signal: "complete",\n  operationItemId: "<your operation item id>",\n  operationStatus: "done" | "partial" | "blocked"\n}).`,
          },
        ],
      });
    });

    it('VALID: {through siegemaster} => run-ward full', () => {
      computeNextStepFromQuestLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'fix-bug' });
      const quest = QuestStub({
        id: questId,
        questType: 'bug-hunt',
        workItems: relayTailItems({
          completeIds: [CODEWEAVER_ID, WARD_CHANGED_ID, FLOWRIDER_ID, SIEGEMASTER_ID],
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
        workItems: relayTailItems({
          completeIds: [CODEWEAVER_ID, WARD_CHANGED_ID, FLOWRIDER_ID, SIEGEMASTER_ID, WARD_FULL_ID],
        }),
      });

      expect(computeNextStepFromQuestLayerBroker({ quest })).toBe(null);
    });
  });
});
