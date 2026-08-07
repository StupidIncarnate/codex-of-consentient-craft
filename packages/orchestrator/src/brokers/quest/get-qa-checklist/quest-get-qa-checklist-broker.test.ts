import {
  FlowNodeStub,
  FlowStub,
  QuestIdStub,
  QuestQaLedgerEntryStub,
  QuestStub,
  SignoffStub,
} from '@dungeonmaster/shared/contracts';

import { questGetQaChecklistBroker } from './quest-get-qa-checklist-broker';
import { questGetQaChecklistBrokerProxy } from './quest-get-qa-checklist-broker.proxy';

describe('questGetQaChecklistBroker', () => {
  describe('enumerating a quest', () => {
    it('VALID: {quest with two flows} => returns one checklist per flow, in quest order', async () => {
      const proxy = questGetQaChecklistBrokerProxy();
      const quest = QuestStub({
        flows: [
          FlowStub({ id: 'first-flow', name: 'First Flow', nodes: [], edges: [] }),
          FlowStub({ id: 'second-flow', name: 'Second Flow', nodes: [], edges: [] }),
        ],
      });
      proxy.setupQuestFound({ quest });

      const result = await questGetQaChecklistBroker({ questId: QuestIdStub({ value: quest.id }) });

      expect(result.map((checklist) => checklist.flowId)).toStrictEqual([
        'first-flow',
        'second-flow',
      ]);
    });

    it('VALID: {flowId given} => returns only that flow', async () => {
      const proxy = questGetQaChecklistBrokerProxy();
      const quest = QuestStub({
        flows: [
          FlowStub({ id: 'first-flow', name: 'First Flow', nodes: [], edges: [] }),
          FlowStub({ id: 'second-flow', name: 'Second Flow', nodes: [], edges: [] }),
        ],
      });
      proxy.setupQuestFound({ quest });

      const result = await questGetQaChecklistBroker({
        questId: QuestIdStub({ value: quest.id }),
        flowId: 'second-flow' as never,
      });

      expect(result.map((checklist) => checklist.flowId)).toStrictEqual(['second-flow']);
    });

    it('VALID: {unknown flowId} => returns an empty list rather than throwing', async () => {
      const proxy = questGetQaChecklistBrokerProxy();
      const quest = QuestStub({
        flows: [FlowStub({ id: 'first-flow', name: 'First Flow', nodes: [], edges: [] })],
      });
      proxy.setupQuestFound({ quest });

      const result = await questGetQaChecklistBroker({
        questId: QuestIdStub({ value: quest.id }),
        flowId: 'not-on-this-quest' as never,
      });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {quest with no flows} => returns an empty list', async () => {
      const proxy = questGetQaChecklistBrokerProxy();
      const quest = QuestStub({ flows: [] });
      proxy.setupQuestFound({ quest });

      const result = await questGetQaChecklistBroker({ questId: QuestIdStub({ value: quest.id }) });

      expect(result).toStrictEqual([]);
    });
  });

  describe('coverage from the persisted ledger', () => {
    it('VALID: {ledger entry for a unit} => that unit is absent from remainingItemIds', async () => {
      const proxy = questGetQaChecklistBrokerProxy();
      const quest = QuestStub({
        flows: [
          FlowStub({
            id: 'first-flow',
            name: 'First Flow',
            nodes: [{ id: 'a-node', label: 'A node', type: 'state', observables: [] }],
            edges: [],
          }),
        ],
        planningNotes: {
          blightReports: [],
          qaLedger: [QuestQaLedgerEntryStub({ itemId: 'first-flow:terminal:a-node' })],
        },
      });
      proxy.setupQuestFound({ quest });

      const result = await questGetQaChecklistBroker({ questId: QuestIdStub({ value: quest.id }) });

      expect(result[0]?.remainingItemIds).toStrictEqual([
        'first-flow:off-map:re-entry',
        'first-flow:off-map:concurrency',
        'first-flow:off-map:interruption',
        'first-flow:off-map:staleness',
        'first-flow:off-map:configuration',
        'first-flow:off-map:hostile-input',
        'first-flow:off-map:perf',
      ]);
    });

    it('VALID: {empty ledger} => every unit on the flow remains', async () => {
      const proxy = questGetQaChecklistBrokerProxy();
      const quest = QuestStub({
        flows: [
          FlowStub({
            id: 'first-flow',
            name: 'First Flow',
            nodes: [{ id: 'a-node', label: 'A node', type: 'state', observables: [] }],
            edges: [],
          }),
        ],
        planningNotes: { blightReports: [], qaLedger: [] },
      });
      proxy.setupQuestFound({ quest });

      const result = await questGetQaChecklistBroker({ questId: QuestIdStub({ value: quest.id }) });

      expect(result[0]?.remainingItemIds).toStrictEqual(result[0]?.items.map((item) => item.id));
    });
  });

  describe('track scoping over a quest carrying both flow types', () => {
    it("VALID: {track: 'flowrider', no flowId} => returns the RUNTIME flows only, the set that track is measured over", async () => {
      const proxy = questGetQaChecklistBrokerProxy();
      const quest = QuestStub({
        flows: [
          FlowStub({
            id: 'walk-flow',
            name: 'Walk Flow',
            flowType: 'runtime',
            nodes: [],
            edges: [],
          }),
          FlowStub({
            id: 'rollout-flow',
            name: 'Rollout Flow',
            flowType: 'operational',
            nodes: [],
            edges: [],
          }),
          FlowStub({
            id: 'second-walk-flow',
            name: 'Second Walk Flow',
            flowType: 'runtime',
            nodes: [],
            edges: [],
          }),
        ],
      });
      proxy.setupQuestFound({ quest });

      const result = await questGetQaChecklistBroker({
        questId: QuestIdStub({ value: quest.id }),
        track: 'flowrider',
      });

      expect(result.map((checklist) => checklist.flowId)).toStrictEqual([
        'walk-flow',
        'second-walk-flow',
      ]);
    });

    it("VALID: {track: 'siegemaster', no flowId} => returns EVERY flow, because siegemaster verifies operational end states too", async () => {
      const proxy = questGetQaChecklistBrokerProxy();
      const quest = QuestStub({
        flows: [
          FlowStub({
            id: 'walk-flow',
            name: 'Walk Flow',
            flowType: 'runtime',
            nodes: [],
            edges: [],
          }),
          FlowStub({
            id: 'rollout-flow',
            name: 'Rollout Flow',
            flowType: 'operational',
            nodes: [],
            edges: [],
          }),
        ],
      });
      proxy.setupQuestFound({ quest });

      const result = await questGetQaChecklistBroker({
        questId: QuestIdStub({ value: quest.id }),
        track: 'siegemaster',
      });

      expect(result.map((checklist) => checklist.flowId)).toStrictEqual([
        'walk-flow',
        'rollout-flow',
      ]);
    });

    it('VALID: {no track} => returns every flow, unchanged by flow type', async () => {
      const proxy = questGetQaChecklistBrokerProxy();
      const quest = QuestStub({
        flows: [
          FlowStub({
            id: 'walk-flow',
            name: 'Walk Flow',
            flowType: 'runtime',
            nodes: [],
            edges: [],
          }),
          FlowStub({
            id: 'rollout-flow',
            name: 'Rollout Flow',
            flowType: 'operational',
            nodes: [],
            edges: [],
          }),
        ],
      });
      proxy.setupQuestFound({ quest });

      const result = await questGetQaChecklistBroker({ questId: QuestIdStub({ value: quest.id }) });

      expect(result.map((checklist) => checklist.flowId)).toStrictEqual([
        'walk-flow',
        'rollout-flow',
      ]);
    });

    it("VALID: {track: 'flowrider', flowId of an OPERATIONAL flow} => the explicit flowId wins over the track filter", async () => {
      const proxy = questGetQaChecklistBrokerProxy();
      const quest = QuestStub({
        flows: [
          FlowStub({
            id: 'walk-flow',
            name: 'Walk Flow',
            flowType: 'runtime',
            nodes: [],
            edges: [],
          }),
          FlowStub({
            id: 'rollout-flow',
            name: 'Rollout Flow',
            flowType: 'operational',
            nodes: [],
            edges: [],
          }),
        ],
      });
      proxy.setupQuestFound({ quest });

      const result = await questGetQaChecklistBroker({
        questId: QuestIdStub({ value: quest.id }),
        flowId: 'rollout-flow' as never,
        track: 'flowrider',
      });

      expect(result.map((checklist) => checklist.flowId)).toStrictEqual(['rollout-flow']);
    });

    it("EMPTY: {track: 'flowrider', every flow operational} => returns an empty list, so 'nothing to walk' is a real answer", async () => {
      const proxy = questGetQaChecklistBrokerProxy();
      const quest = QuestStub({
        flows: [
          FlowStub({
            id: 'rollout-flow',
            name: 'Rollout Flow',
            flowType: 'operational',
            nodes: [],
            edges: [],
          }),
        ],
      });
      proxy.setupQuestFound({ quest });

      const result = await questGetQaChecklistBroker({
        questId: QuestIdStub({ value: quest.id }),
        track: 'flowrider',
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('remainingItemIds is measured against the named track, not the ledger', () => {
    it("VALID: {track: 'flowrider', ledger says dispositioned but no flowriderSignoff} => still outstanding", async () => {
      const proxy = questGetQaChecklistBrokerProxy();
      const quest = QuestStub({
        flows: [
          FlowStub({
            id: 'walk-flow',
            name: 'Walk Flow',
            flowType: 'runtime',
            nodes: [FlowNodeStub({ id: 'a-node', label: 'A node' })],
            edges: [],
          }),
        ],
        planningNotes: {
          blightReports: [],
          qaLedger: [QuestQaLedgerEntryStub({ itemId: 'walk-flow:terminal:a-node' })],
        },
      });
      proxy.setupQuestFound({ quest });

      const result = await questGetQaChecklistBroker({
        questId: QuestIdStub({ value: quest.id }),
        track: 'flowrider',
      });

      expect(result[0]?.remainingItemIds).toStrictEqual(['walk-flow:terminal:a-node']);
    });

    it("VALID: {track: 'flowrider', terminal carries flowriderSignoff} => nothing remains, and off-map never counted", async () => {
      const proxy = questGetQaChecklistBrokerProxy();
      const quest = QuestStub({
        flows: [
          FlowStub({
            id: 'walk-flow',
            name: 'Walk Flow',
            flowType: 'runtime',
            nodes: [
              FlowNodeStub({ id: 'a-node', label: 'A node', flowriderSignoff: SignoffStub() }),
            ],
            edges: [],
          }),
        ],
        planningNotes: { blightReports: [], qaLedger: [] },
      });
      proxy.setupQuestFound({ quest });

      const result = await questGetQaChecklistBroker({
        questId: QuestIdStub({ value: quest.id }),
        track: 'flowrider',
      });

      expect(result[0]?.remainingItemIds).toStrictEqual([]);
    });

    it("VALID: {track: 'siegemaster', terminal carries flowriderSignoff only} => the terminal AND every off-map family are still outstanding", async () => {
      const proxy = questGetQaChecklistBrokerProxy();
      const quest = QuestStub({
        flows: [
          FlowStub({
            id: 'walk-flow',
            name: 'Walk Flow',
            flowType: 'runtime',
            nodes: [
              FlowNodeStub({ id: 'a-node', label: 'A node', flowriderSignoff: SignoffStub() }),
            ],
            edges: [],
          }),
        ],
        planningNotes: { blightReports: [], qaLedger: [] },
      });
      proxy.setupQuestFound({ quest });

      const result = await questGetQaChecklistBroker({
        questId: QuestIdStub({ value: quest.id }),
        track: 'siegemaster',
      });

      expect(result[0]?.remainingItemIds).toStrictEqual([
        'walk-flow:terminal:a-node',
        'walk-flow:off-map:re-entry',
        'walk-flow:off-map:concurrency',
        'walk-flow:off-map:interruption',
        'walk-flow:off-map:staleness',
        'walk-flow:off-map:configuration',
        'walk-flow:off-map:hostile-input',
        'walk-flow:off-map:perf',
      ]);
    });
  });

  describe('quest not found', () => {
    it('ERROR: {questId not exists} => throws not found error', async () => {
      const proxy = questGetQaChecklistBrokerProxy();
      proxy.setupQuestNotFound();

      await expect(
        questGetQaChecklistBroker({ questId: QuestIdStub({ value: 'nonexistent' }) }),
      ).rejects.toThrow(/Quest with id "nonexistent" not found/u);
    });
  });
});
