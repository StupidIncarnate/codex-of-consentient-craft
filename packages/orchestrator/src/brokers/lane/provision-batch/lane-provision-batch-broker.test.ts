import {
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { LaneManifestReadingStub } from '../../../contracts/lane-manifest-reading/lane-manifest-reading.stub';
import { SpawnInstructionStub } from '../../../contracts/spawn-instruction/spawn-instruction.stub';
import { laneProvisionBatchBroker } from './lane-provision-batch-broker';
import { laneProvisionBatchBrokerProxy } from './lane-provision-batch-broker.proxy';

const questId = QuestIdStub({ value: 'lane-provision' });
const workItemIdOne = QuestWorkItemIdStub({ value: 'aaaaaaaa-0000-0000-0000-000000000021' });
const workItemIdTwo = QuestWorkItemIdStub({ value: 'aaaaaaaa-0000-0000-0000-000000000022' });
const workItemIdThree = QuestWorkItemIdStub({ value: 'aaaaaaaa-0000-0000-0000-000000000023' });

describe('laneProvisionBatchBroker', () => {
  describe('a step that is not spawn-agents', () => {
    it('VALID: {type: idle} => passes through unchanged', async () => {
      const proxy = laneProvisionBatchBrokerProxy();
      const quest = QuestStub({ id: questId, status: 'in_progress', workItems: [] });
      proxy.setupQuestFound({ quest });

      const result = await laneProvisionBatchBroker({ quest, step: { type: 'idle' } });

      expect(result).toStrictEqual({ type: 'idle' });
    });

    it('EMPTY: {step: null} => passes null through', async () => {
      const proxy = laneProvisionBatchBrokerProxy();
      const quest = QuestStub({ id: questId, status: 'in_progress', workItems: [] });
      proxy.setupQuestFound({ quest });

      const result = await laneProvisionBatchBroker({ quest, step: null });

      expect(result).toBe(null);
    });
  });

  describe('a spawn-agents batch that does not needsLane', () => {
    it('VALID: {codeweaver batch} => passes through unchanged, capacity never read', async () => {
      const proxy = laneProvisionBatchBrokerProxy();
      const workItem = WorkItemStub({
        id: workItemIdOne,
        role: 'codeweaver',
        status: 'pending',
        step: 'work',
      });
      const quest = QuestStub({ id: questId, status: 'in_progress', workItems: [workItem] });
      proxy.setupQuestFound({ quest });
      const agent = SpawnInstructionStub({
        questId,
        role: 'codeweaver',
        workItemId: workItemIdOne,
      });

      const result = await laneProvisionBatchBroker({
        quest,
        step: { type: 'spawn-agents', agents: [agent] },
      });

      expect(result).toStrictEqual({ type: 'spawn-agents', agents: [agent] });
    });

    it('VALID: {four flowrider browser-walk pieces, capacity suggested: 1} => dispatches all four — siege’s pool does not see them', async () => {
      const proxy = laneProvisionBatchBrokerProxy();
      const flowriderWorkItemIds = [
        workItemIdOne,
        workItemIdTwo,
        workItemIdThree,
        QuestWorkItemIdStub({ value: 'aaaaaaaa-0000-0000-0000-000000000024' }),
      ];
      const flowriderWorkItems = flowriderWorkItemIds.map((id) =>
        WorkItemStub({ id, role: 'flowrider', status: 'pending', step: 'work' }),
      );
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: flowriderWorkItems,
      });
      proxy.setupQuestFound({ quest });
      // Staged even though it must never be read for a non-lane batch — proves a low `suggested`
      // sitting in the registry cannot bound a browser-walk batch it was never measured over.
      proxy.setupCapacityAndManifest({ suggested: 1, manifest: LaneManifestReadingStub() });
      const agents = flowriderWorkItemIds.map((workItemId) =>
        SpawnInstructionStub({ questId, role: 'flowrider', workItemId }),
      );

      const result = await laneProvisionBatchBroker({
        quest,
        step: { type: 'spawn-agents', agents },
      });

      expect(result).toStrictEqual({ type: 'spawn-agents', agents });
    });
  });

  describe('a needsLane batch bounded by capacity', () => {
    it('VALID: {two needsLane items, suggested: 1} => dispatches one and starts its lane', async () => {
      const proxy = laneProvisionBatchBrokerProxy();
      const workItemOne = WorkItemStub({
        id: workItemIdOne,
        role: 'siegemaster',
        status: 'pending',
        step: 'happyWalk',
        needsLane: true,
      });
      const workItemTwo = WorkItemStub({
        id: workItemIdTwo,
        role: 'siegemaster',
        status: 'pending',
        step: 'happyWalk',
        needsLane: true,
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [workItemOne, workItemTwo],
      });
      proxy.setupQuestFound({ quest });
      proxy.setupCapacityAndManifest({ suggested: 1, manifest: LaneManifestReadingStub() });

      const agentOne = SpawnInstructionStub({
        questId,
        role: 'siegemaster',
        workItemId: workItemIdOne,
      });
      const agentTwo = SpawnInstructionStub({
        questId,
        role: 'siegemaster',
        workItemId: workItemIdTwo,
      });

      const result = await laneProvisionBatchBroker({
        quest,
        step: { type: 'spawn-agents', agents: [agentOne, agentTwo] },
      });

      expect(result).toStrictEqual({ type: 'spawn-agents', agents: [agentOne] });

      const persisted = proxy.getLastPersistedQuest();
      const persistedTarget = persisted.workItems.find((item) => item.id === workItemIdOne);

      expect(persistedTarget?.payload).toStrictEqual({
        instance: {
          instanceId: 'inst_7f3a9c21',
          baseUrl: 'http://localhost:34173',
          apiUrl: null,
          home: '/tmp/dm-siege-inst_7f3a9c21',
          logs: {
            api: '/repo/.dungeonmaster-assets/siegelense-assets/g1/instances/inst_7f3a9c21/api-server.log',
            web: '/repo/.dungeonmaster-assets/siegelense-assets/g1/instances/inst_7f3a9c21/web-server.log',
          },
        },
      });
    });

    it('VALID: {three needsLane items, suggested: 3} => dispatches all three', async () => {
      const proxy = laneProvisionBatchBrokerProxy();
      const workItemOne = WorkItemStub({
        id: workItemIdOne,
        role: 'siegemaster',
        status: 'pending',
        step: 'happyWalk',
        needsLane: true,
      });
      const workItemTwo = WorkItemStub({
        id: workItemIdTwo,
        role: 'siegemaster',
        status: 'pending',
        step: 'happyWalk',
        needsLane: true,
      });
      const workItemThree = WorkItemStub({
        id: workItemIdThree,
        role: 'siegemaster',
        status: 'pending',
        step: 'happyWalk',
        needsLane: true,
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [workItemOne, workItemTwo, workItemThree],
      });
      proxy.setupQuestFound({ quest });
      proxy.setupCapacityAndManifest({ suggested: 3, manifest: LaneManifestReadingStub() });

      const agentOne = SpawnInstructionStub({
        questId,
        role: 'siegemaster',
        workItemId: workItemIdOne,
      });
      const agentTwo = SpawnInstructionStub({
        questId,
        role: 'siegemaster',
        workItemId: workItemIdTwo,
      });
      const agentThree = SpawnInstructionStub({
        questId,
        role: 'siegemaster',
        workItemId: workItemIdThree,
      });

      const result = await laneProvisionBatchBroker({
        quest,
        step: { type: 'spawn-agents', agents: [agentOne, agentTwo, agentThree] },
      });

      expect(result).toStrictEqual({
        type: 'spawn-agents',
        agents: [agentOne, agentTwo, agentThree],
      });
    });

    it('EMPTY: {suggested: 0} => returns null — every lane slot already spent', async () => {
      const proxy = laneProvisionBatchBrokerProxy();
      const workItem = WorkItemStub({
        id: workItemIdOne,
        role: 'siegemaster',
        status: 'pending',
        step: 'happyWalk',
        needsLane: true,
      });
      const quest = QuestStub({ id: questId, status: 'in_progress', workItems: [workItem] });
      proxy.setupQuestFound({ quest });
      proxy.setupCapacityAndManifest({ suggested: 0, manifest: LaneManifestReadingStub() });
      const agent = SpawnInstructionStub({
        questId,
        role: 'siegemaster',
        workItemId: workItemIdOne,
      });

      const result = await laneProvisionBatchBroker({
        quest,
        step: { type: 'spawn-agents', agents: [agent] },
      });

      expect(result).toBe(null);
    });
  });

  describe('a needsLane item that already recorded an instance', () => {
    it('VALID: {payload.instance already present} => starts nothing again, re-dispatches unchanged', async () => {
      const proxy = laneProvisionBatchBrokerProxy();
      const existingInstance = LaneManifestReadingStub();
      const workItem = WorkItemStub({
        id: workItemIdOne,
        role: 'siegemaster',
        status: 'pending',
        step: 'happyWalk',
        needsLane: true,
        payload: {
          instance: {
            instanceId: existingInstance.instanceId,
            baseUrl: existingInstance.baseUrl,
            apiUrl: null,
            home: existingInstance.home,
            logs: {
              api: existingInstance.logs.api.path,
              web: existingInstance.logs.web.path,
            },
          },
        },
      });
      const quest = QuestStub({ id: questId, status: 'in_progress', workItems: [workItem] });
      proxy.setupQuestFound({ quest });
      proxy.setupCapacityAndManifest({ suggested: 1, manifest: LaneManifestReadingStub() });
      const agent = SpawnInstructionStub({
        questId,
        role: 'siegemaster',
        workItemId: workItemIdOne,
      });

      const result = await laneProvisionBatchBroker({
        quest,
        step: { type: 'spawn-agents', agents: [agent] },
      });

      expect(result).toStrictEqual({ type: 'spawn-agents', agents: [agent] });
    });
  });
});
