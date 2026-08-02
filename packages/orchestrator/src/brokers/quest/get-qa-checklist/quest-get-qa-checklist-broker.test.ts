import {
  FlowStub,
  QuestIdStub,
  QuestQaLedgerEntryStub,
  QuestStub,
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
