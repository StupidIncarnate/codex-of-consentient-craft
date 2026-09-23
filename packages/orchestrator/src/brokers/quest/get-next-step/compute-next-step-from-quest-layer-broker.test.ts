import {
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { computeNextStepFromQuestLayerBroker } from './compute-next-step-from-quest-layer-broker';
import { computeNextStepFromQuestLayerBrokerProxy } from './compute-next-step-from-quest-layer-broker.proxy';

// Chain ids for a bug-hunt quest's relay tail: riftcarver, then codeweaver, then a ward gate,
// then flowrider, siegemaster, and a second ward gate — a synthetic ledger shape for exercising
// computeNextStepFromQuestLayerBroker's routing in isolation, one `run-ward` step per gate.
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
        }),
      ],
    });

    const result = computeNextStepFromQuestLayerBroker({ quest });

    expect(result).toStrictEqual({
      type: 'run-ward',
      questId,
      workItemId: wardId,
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
          model: 'opus',
          workItemId: cwId,
          taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${cwId}",\n  questId: "${questId}"\n}) and follow its instructions exactly.\n\nWhen the work is done, RECORD it through mcp__dungeonmaster__quest-work and signal, in that order.\n\nMark every unit you were assigned — a signal from a session that left one unmarked is refused, naming it:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${cwId}",\n  payload: { kind: "observations", observations: [{ unitId: "<unit id>", mark: "met" | "cant-meet" | "unmet", evidence: "<what you saw>" }] }\n})\n\nThen name the outcome of this step as a whole — "done", "unmet", "empty" or "wall". A unit you could not settle is "unmet", which mints a successor scoped to exactly those units; "wall" is an environment wall no session of your role can pass, and halts the quest:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${cwId}",\n  payload: { kind: "outcome", word: "done", reason: "<why this word>" }\n})\n\nThen, as the last action of your turn:\nmcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${cwId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>"\n})`,
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
          model: 'opus',
          workItemId: dependentId,
          taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${String(dependentId)}",\n  questId: "${String(questId)}"\n}) and follow its instructions exactly.\n\nWhen the work is done, RECORD it through mcp__dungeonmaster__quest-work and signal, in that order.\n\nMark every unit you were assigned — a signal from a session that left one unmarked is refused, naming it:\nmcp__dungeonmaster__quest-work({\n  questId: "${String(questId)}",\n  workItemId: "${String(dependentId)}",\n  payload: { kind: "observations", observations: [{ unitId: "<unit id>", mark: "met" | "cant-meet" | "unmet", evidence: "<what you saw>" }] }\n})\n\nThen name the outcome of this step as a whole — "done", "unmet", "empty" or "wall". A unit you could not settle is "unmet", which mints a successor scoped to exactly those units; "wall" is an environment wall no session of your role can pass, and halts the quest:\nmcp__dungeonmaster__quest-work({\n  questId: "${String(questId)}",\n  workItemId: "${String(dependentId)}",\n  payload: { kind: "outcome", word: "done", reason: "<why this word>" }\n})\n\nThen, as the last action of your turn:\nmcp__dungeonmaster__signal-back({\n  questId: "${String(questId)}",\n  workItemId: "${String(dependentId)}",\n  signal: "complete",\n  operationItemId: "<your operation item id>"\n})`,
        },
      ],
    });
  });

  it('VALID: {four ready codeweaver cells, no interdependency} => spawn-agents dispatches all four, in dispatch order', () => {
    computeNextStepFromQuestLayerBrokerProxy();
    const questId = QuestIdStub({ value: 'q-four-cells' });
    const cw1Id = QuestWorkItemIdStub({ value: 'ffff0001-1111-4222-9333-444444444444' });
    const cw2Id = QuestWorkItemIdStub({ value: 'ffff0002-1111-4222-9333-444444444444' });
    const cw3Id = QuestWorkItemIdStub({ value: 'ffff0003-1111-4222-9333-444444444444' });
    const cw4Id = QuestWorkItemIdStub({ value: 'ffff0004-1111-4222-9333-444444444444' });
    const quest = QuestStub({
      id: questId,
      workItems: [
        // Deliberately out of createdAt order — proves the batch follows DISPATCH order, not
        // array order.
        WorkItemStub({
          id: cw3Id,
          role: 'codeweaver',
          status: 'pending',
          createdAt: '2024-01-15T10:00:03.000Z',
        }),
        WorkItemStub({
          id: cw1Id,
          role: 'codeweaver',
          status: 'pending',
          createdAt: '2024-01-15T10:00:01.000Z',
        }),
        WorkItemStub({
          id: cw4Id,
          role: 'codeweaver',
          status: 'pending',
          createdAt: '2024-01-15T10:00:04.000Z',
        }),
        WorkItemStub({
          id: cw2Id,
          role: 'codeweaver',
          status: 'pending',
          createdAt: '2024-01-15T10:00:02.000Z',
        }),
      ],
    });

    const result = computeNextStepFromQuestLayerBroker({ quest });

    expect(result).toStrictEqual({
      type: 'spawn-agents',
      agents: [
        {
          questId,
          role: 'codeweaver',
          model: 'opus',
          workItemId: cw1Id,
          taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${cw1Id}",\n  questId: "${questId}"\n}) and follow its instructions exactly.\n\nWhen the work is done, RECORD it through mcp__dungeonmaster__quest-work and signal, in that order.\n\nMark every unit you were assigned — a signal from a session that left one unmarked is refused, naming it:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${cw1Id}",\n  payload: { kind: "observations", observations: [{ unitId: "<unit id>", mark: "met" | "cant-meet" | "unmet", evidence: "<what you saw>" }] }\n})\n\nThen name the outcome of this step as a whole — "done", "unmet", "empty" or "wall". A unit you could not settle is "unmet", which mints a successor scoped to exactly those units; "wall" is an environment wall no session of your role can pass, and halts the quest:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${cw1Id}",\n  payload: { kind: "outcome", word: "done", reason: "<why this word>" }\n})\n\nThen, as the last action of your turn:\nmcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${cw1Id}",\n  signal: "complete",\n  operationItemId: "<your operation item id>"\n})`,
        },
        {
          questId,
          role: 'codeweaver',
          model: 'opus',
          workItemId: cw2Id,
          taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${cw2Id}",\n  questId: "${questId}"\n}) and follow its instructions exactly.\n\nWhen the work is done, RECORD it through mcp__dungeonmaster__quest-work and signal, in that order.\n\nMark every unit you were assigned — a signal from a session that left one unmarked is refused, naming it:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${cw2Id}",\n  payload: { kind: "observations", observations: [{ unitId: "<unit id>", mark: "met" | "cant-meet" | "unmet", evidence: "<what you saw>" }] }\n})\n\nThen name the outcome of this step as a whole — "done", "unmet", "empty" or "wall". A unit you could not settle is "unmet", which mints a successor scoped to exactly those units; "wall" is an environment wall no session of your role can pass, and halts the quest:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${cw2Id}",\n  payload: { kind: "outcome", word: "done", reason: "<why this word>" }\n})\n\nThen, as the last action of your turn:\nmcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${cw2Id}",\n  signal: "complete",\n  operationItemId: "<your operation item id>"\n})`,
        },
        {
          questId,
          role: 'codeweaver',
          model: 'opus',
          workItemId: cw3Id,
          taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${cw3Id}",\n  questId: "${questId}"\n}) and follow its instructions exactly.\n\nWhen the work is done, RECORD it through mcp__dungeonmaster__quest-work and signal, in that order.\n\nMark every unit you were assigned — a signal from a session that left one unmarked is refused, naming it:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${cw3Id}",\n  payload: { kind: "observations", observations: [{ unitId: "<unit id>", mark: "met" | "cant-meet" | "unmet", evidence: "<what you saw>" }] }\n})\n\nThen name the outcome of this step as a whole — "done", "unmet", "empty" or "wall". A unit you could not settle is "unmet", which mints a successor scoped to exactly those units; "wall" is an environment wall no session of your role can pass, and halts the quest:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${cw3Id}",\n  payload: { kind: "outcome", word: "done", reason: "<why this word>" }\n})\n\nThen, as the last action of your turn:\nmcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${cw3Id}",\n  signal: "complete",\n  operationItemId: "<your operation item id>"\n})`,
        },
        {
          questId,
          role: 'codeweaver',
          model: 'opus',
          workItemId: cw4Id,
          taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${cw4Id}",\n  questId: "${questId}"\n}) and follow its instructions exactly.\n\nWhen the work is done, RECORD it through mcp__dungeonmaster__quest-work and signal, in that order.\n\nMark every unit you were assigned — a signal from a session that left one unmarked is refused, naming it:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${cw4Id}",\n  payload: { kind: "observations", observations: [{ unitId: "<unit id>", mark: "met" | "cant-meet" | "unmet", evidence: "<what you saw>" }] }\n})\n\nThen name the outcome of this step as a whole — "done", "unmet", "empty" or "wall". A unit you could not settle is "unmet", which mints a successor scoped to exactly those units; "wall" is an environment wall no session of your role can pass, and halts the quest:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${cw4Id}",\n  payload: { kind: "outcome", word: "done", reason: "<why this word>" }\n})\n\nThen, as the last action of your turn:\nmcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${cw4Id}",\n  signal: "complete",\n  operationItemId: "<your operation item id>"\n})`,
        },
      ],
    });
  });

  it('VALID: {codeweaver queued alongside two ready codeweavers} => spawn-agents dispatches only the two ready items, queued excluded', () => {
    computeNextStepFromQuestLayerBrokerProxy();
    const questId = QuestIdStub({ value: 'q-queued-excluded' });
    const queuedId = QuestWorkItemIdStub({ value: 'ddd10001-1111-4222-9333-444444444444' });
    const cw1Id = QuestWorkItemIdStub({ value: 'ddd10002-1111-4222-9333-444444444444' });
    const cw2Id = QuestWorkItemIdStub({ value: 'ddd10003-1111-4222-9333-444444444444' });
    const quest = QuestStub({
      id: questId,
      workItems: [
        WorkItemStub({ id: queuedId, role: 'codeweaver', status: 'queued' }),
        WorkItemStub({
          id: cw1Id,
          role: 'codeweaver',
          status: 'pending',
          createdAt: '2024-01-15T10:00:01.000Z',
        }),
        WorkItemStub({
          id: cw2Id,
          role: 'codeweaver',
          status: 'pending',
          createdAt: '2024-01-15T10:00:02.000Z',
        }),
      ],
    });

    const result = computeNextStepFromQuestLayerBroker({ quest });

    expect(result).toStrictEqual({
      type: 'spawn-agents',
      agents: [
        {
          questId,
          role: 'codeweaver',
          model: 'opus',
          workItemId: cw1Id,
          taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${cw1Id}",\n  questId: "${questId}"\n}) and follow its instructions exactly.\n\nWhen the work is done, RECORD it through mcp__dungeonmaster__quest-work and signal, in that order.\n\nMark every unit you were assigned — a signal from a session that left one unmarked is refused, naming it:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${cw1Id}",\n  payload: { kind: "observations", observations: [{ unitId: "<unit id>", mark: "met" | "cant-meet" | "unmet", evidence: "<what you saw>" }] }\n})\n\nThen name the outcome of this step as a whole — "done", "unmet", "empty" or "wall". A unit you could not settle is "unmet", which mints a successor scoped to exactly those units; "wall" is an environment wall no session of your role can pass, and halts the quest:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${cw1Id}",\n  payload: { kind: "outcome", word: "done", reason: "<why this word>" }\n})\n\nThen, as the last action of your turn:\nmcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${cw1Id}",\n  signal: "complete",\n  operationItemId: "<your operation item id>"\n})`,
        },
        {
          questId,
          role: 'codeweaver',
          model: 'opus',
          workItemId: cw2Id,
          taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${cw2Id}",\n  questId: "${questId}"\n}) and follow its instructions exactly.\n\nWhen the work is done, RECORD it through mcp__dungeonmaster__quest-work and signal, in that order.\n\nMark every unit you were assigned — a signal from a session that left one unmarked is refused, naming it:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${cw2Id}",\n  payload: { kind: "observations", observations: [{ unitId: "<unit id>", mark: "met" | "cant-meet" | "unmet", evidence: "<what you saw>" }] }\n})\n\nThen name the outcome of this step as a whole — "done", "unmet", "empty" or "wall". A unit you could not settle is "unmet", which mints a successor scoped to exactly those units; "wall" is an environment wall no session of your role can pass, and halts the quest:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${cw2Id}",\n  payload: { kind: "outcome", word: "done", reason: "<why this word>" }\n})\n\nThen, as the last action of your turn:\nmcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${cw2Id}",\n  signal: "complete",\n  operationItemId: "<your operation item id>"\n})`,
        },
      ],
    });
  });

  it('VALID: {ward ready alongside three ready codeweavers} => returns run-ward alone, never batched with the agents', () => {
    computeNextStepFromQuestLayerBrokerProxy();
    const questId = QuestIdStub({ value: 'q-ward-plus-agents' });
    const wardId = QuestWorkItemIdStub({ value: 'aaa10001-1111-4222-9333-444444444444' });
    const cw1Id = QuestWorkItemIdStub({ value: 'aaa10002-1111-4222-9333-444444444444' });
    const cw2Id = QuestWorkItemIdStub({ value: 'aaa10003-1111-4222-9333-444444444444' });
    const cw3Id = QuestWorkItemIdStub({ value: 'aaa10004-1111-4222-9333-444444444444' });
    const quest = QuestStub({
      id: questId,
      workItems: [
        WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'pending' }),
        WorkItemStub({
          id: wardId,
          role: 'ward',
          status: 'pending',
          spawnerType: 'command',
        }),
        WorkItemStub({ id: cw2Id, role: 'codeweaver', status: 'pending' }),
        WorkItemStub({ id: cw3Id, role: 'codeweaver', status: 'pending' }),
      ],
    });

    const result = computeNextStepFromQuestLayerBroker({ quest });

    expect(result).toStrictEqual({
      type: 'run-ward',
      questId,
      workItemId: wardId,
    });
  });

  it('VALID: {riftcarver ready alongside three ready codeweavers} => returns run-riftcarver alone, no spawn-agents', () => {
    computeNextStepFromQuestLayerBrokerProxy();
    const questId = QuestIdStub({ value: 'q-riftcarver-plus-agents' });
    const carveId = QuestWorkItemIdStub({ value: 'bbb10001-1111-4222-9333-444444444444' });
    const cw1Id = QuestWorkItemIdStub({ value: 'bbb10002-1111-4222-9333-444444444444' });
    const cw2Id = QuestWorkItemIdStub({ value: 'bbb10003-1111-4222-9333-444444444444' });
    const cw3Id = QuestWorkItemIdStub({ value: 'bbb10004-1111-4222-9333-444444444444' });
    const quest = QuestStub({
      id: questId,
      workItems: [
        WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'pending' }),
        WorkItemStub({ id: cw2Id, role: 'codeweaver', status: 'pending' }),
        WorkItemStub({
          id: carveId,
          role: 'riftcarver',
          status: 'pending',
          spawnerType: 'command',
        }),
        WorkItemStub({ id: cw3Id, role: 'codeweaver', status: 'pending' }),
      ],
    });

    const result = computeNextStepFromQuestLayerBroker({ quest });

    expect(result).toStrictEqual({
      type: 'run-riftcarver',
      questId,
      workItemId: carveId,
    });
  });

  it('VALID: {three of four upstream codeweaver cells complete, ward depends on all four} => spawn-agents dispatches the one remaining cell, not run-ward (join has not fired)', () => {
    computeNextStepFromQuestLayerBrokerProxy();
    const questId = QuestIdStub({ value: 'q-join-not-yet' });
    const cw1Id = QuestWorkItemIdStub({ value: 'ccc20001-1111-4222-9333-444444444444' });
    const cw2Id = QuestWorkItemIdStub({ value: 'ccc20002-1111-4222-9333-444444444444' });
    const cw3Id = QuestWorkItemIdStub({ value: 'ccc20003-1111-4222-9333-444444444444' });
    const cw4Id = QuestWorkItemIdStub({ value: 'ccc20004-1111-4222-9333-444444444444' });
    const wardId = QuestWorkItemIdStub({ value: 'ccc20005-1111-4222-9333-444444444444' });
    const quest = QuestStub({
      id: questId,
      workItems: [
        WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'complete' }),
        WorkItemStub({ id: cw2Id, role: 'codeweaver', status: 'complete' }),
        WorkItemStub({ id: cw3Id, role: 'codeweaver', status: 'complete' }),
        // The one that hasn't recorded yet — the join must not fire without it.
        WorkItemStub({ id: cw4Id, role: 'codeweaver', status: 'pending' }),
        WorkItemStub({
          id: wardId,
          role: 'ward',
          status: 'pending',
          spawnerType: 'command',
          dependsOn: [cw1Id, cw2Id, cw3Id, cw4Id],
        }),
      ],
    });

    const result = computeNextStepFromQuestLayerBroker({ quest });

    expect(result).toStrictEqual({
      type: 'spawn-agents',
      agents: [
        {
          questId,
          role: 'codeweaver',
          model: 'opus',
          workItemId: cw4Id,
          taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${cw4Id}",\n  questId: "${questId}"\n}) and follow its instructions exactly.\n\nWhen the work is done, RECORD it through mcp__dungeonmaster__quest-work and signal, in that order.\n\nMark every unit you were assigned — a signal from a session that left one unmarked is refused, naming it:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${cw4Id}",\n  payload: { kind: "observations", observations: [{ unitId: "<unit id>", mark: "met" | "cant-meet" | "unmet", evidence: "<what you saw>" }] }\n})\n\nThen name the outcome of this step as a whole — "done", "unmet", "empty" or "wall". A unit you could not settle is "unmet", which mints a successor scoped to exactly those units; "wall" is an environment wall no session of your role can pass, and halts the quest:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${cw4Id}",\n  payload: { kind: "outcome", word: "done", reason: "<why this word>" }\n})\n\nThen, as the last action of your turn:\nmcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${cw4Id}",\n  signal: "complete",\n  operationItemId: "<your operation item id>"\n})`,
        },
      ],
    });
  });

  it('VALID: {all four upstream codeweaver cells complete, ward depends on all four} => run-ward fires (join complete on the LAST recording)', () => {
    computeNextStepFromQuestLayerBrokerProxy();
    const questId = QuestIdStub({ value: 'q-join-fires' });
    const cw1Id = QuestWorkItemIdStub({ value: 'ccc30001-1111-4222-9333-444444444444' });
    const cw2Id = QuestWorkItemIdStub({ value: 'ccc30002-1111-4222-9333-444444444444' });
    const cw3Id = QuestWorkItemIdStub({ value: 'ccc30003-1111-4222-9333-444444444444' });
    const cw4Id = QuestWorkItemIdStub({ value: 'ccc30004-1111-4222-9333-444444444444' });
    const wardId = QuestWorkItemIdStub({ value: 'ccc30005-1111-4222-9333-444444444444' });
    const quest = QuestStub({
      id: questId,
      workItems: [
        WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'complete' }),
        WorkItemStub({ id: cw2Id, role: 'codeweaver', status: 'complete' }),
        WorkItemStub({ id: cw3Id, role: 'codeweaver', status: 'complete' }),
        // The fourth and final recording — this is what makes the join fire.
        WorkItemStub({ id: cw4Id, role: 'codeweaver', status: 'complete' }),
        WorkItemStub({
          id: wardId,
          role: 'ward',
          status: 'pending',
          spawnerType: 'command',
          dependsOn: [cw1Id, cw2Id, cw3Id, cw4Id],
        }),
      ],
    });

    const result = computeNextStepFromQuestLayerBroker({ quest });

    expect(result).toStrictEqual({
      type: 'run-ward',
      questId,
      workItemId: wardId,
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
            model: 'opus',
            workItemId: CODEWEAVER_ID,
            taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${String(CODEWEAVER_ID)}",\n  questId: "fix-bug"\n}) and follow its instructions exactly.\n\nWhen the work is done, RECORD it through mcp__dungeonmaster__quest-work and signal, in that order.\n\nMark every unit you were assigned — a signal from a session that left one unmarked is refused, naming it:\nmcp__dungeonmaster__quest-work({\n  questId: "fix-bug",\n  workItemId: "${String(CODEWEAVER_ID)}",\n  payload: { kind: "observations", observations: [{ unitId: "<unit id>", mark: "met" | "cant-meet" | "unmet", evidence: "<what you saw>" }] }\n})\n\nThen name the outcome of this step as a whole — "done", "unmet", "empty" or "wall". A unit you could not settle is "unmet", which mints a successor scoped to exactly those units; "wall" is an environment wall no session of your role can pass, and halts the quest:\nmcp__dungeonmaster__quest-work({\n  questId: "fix-bug",\n  workItemId: "${String(CODEWEAVER_ID)}",\n  payload: { kind: "outcome", word: "done", reason: "<why this word>" }\n})\n\nThen, as the last action of your turn:\nmcp__dungeonmaster__signal-back({\n  questId: "fix-bug",\n  workItemId: "${String(CODEWEAVER_ID)}",\n  signal: "complete",\n  operationItemId: "<your operation item id>"\n})`,
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
      });
    });

    it('VALID: {through ward(committed)} => spawn-agents flowrider', () => {
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
            model: 'opus',
            workItemId: FLOWRIDER_ID,
            taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "flowrider",\n  workItemId: "${String(FLOWRIDER_ID)}",\n  questId: "fix-bug"\n}) and follow its instructions exactly.\n\nWhen the work is done, RECORD it through mcp__dungeonmaster__quest-work and signal, in that order.\n\nMark every unit you were assigned — a signal from a session that left one unmarked is refused, naming it:\nmcp__dungeonmaster__quest-work({\n  questId: "fix-bug",\n  workItemId: "${String(FLOWRIDER_ID)}",\n  payload: { kind: "observations", observations: [{ unitId: "<unit id>", mark: "met" | "cant-meet" | "unmet", evidence: "<what you saw>" }] }\n})\n\nThen name the outcome of this step as a whole — "done", "unmet", "empty" or "wall". A unit you could not settle is "unmet", which mints a successor scoped to exactly those units; "wall" is an environment wall no session of your role can pass, and halts the quest:\nmcp__dungeonmaster__quest-work({\n  questId: "fix-bug",\n  workItemId: "${String(FLOWRIDER_ID)}",\n  payload: { kind: "outcome", word: "done", reason: "<why this word>" }\n})\n\nThen, as the last action of your turn:\nmcp__dungeonmaster__signal-back({\n  questId: "fix-bug",\n  workItemId: "${String(FLOWRIDER_ID)}",\n  signal: "complete",\n  operationItemId: "<your operation item id>"\n})`,
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
            model: 'opus',
            workItemId: SIEGEMASTER_ID,
            taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "siegemaster",\n  workItemId: "${String(SIEGEMASTER_ID)}",\n  questId: "fix-bug"\n}) and follow its instructions exactly.\n\nWhen the work is done, RECORD it through mcp__dungeonmaster__quest-work and signal, in that order.\n\nMark every unit you were assigned — a signal from a session that left one unmarked is refused, naming it:\nmcp__dungeonmaster__quest-work({\n  questId: "fix-bug",\n  workItemId: "${String(SIEGEMASTER_ID)}",\n  payload: { kind: "observations", observations: [{ unitId: "<unit id>", mark: "met" | "cant-meet" | "unmet", evidence: "<what you saw>" }] }\n})\n\nThen name the outcome of this step as a whole — "done", "unmet", "empty" or "wall". A unit you could not settle is "unmet", which mints a successor scoped to exactly those units; "wall" is an environment wall no session of your role can pass, and halts the quest:\nmcp__dungeonmaster__quest-work({\n  questId: "fix-bug",\n  workItemId: "${String(SIEGEMASTER_ID)}",\n  payload: { kind: "outcome", word: "done", reason: "<why this word>" }\n})\n\nThen, as the last action of your turn:\nmcp__dungeonmaster__signal-back({\n  questId: "fix-bug",\n  workItemId: "${String(SIEGEMASTER_ID)}",\n  signal: "complete",\n  operationItemId: "<your operation item id>"\n})`,
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
