import { OperationItemStub, QuestStub, WorkItemStub } from '@dungeonmaster/shared/contracts';

import { questHasIncompleteWorkLayerBroker } from './quest-has-incomplete-work-layer-broker';
import { questHasIncompleteWorkLayerBrokerProxy } from './quest-has-incomplete-work-layer-broker.proxy';

describe('questHasIncompleteWorkLayerBroker', () => {
  describe('work-item gate', () => {
    it('EMPTY: {workItems: [], operations: []} => returns false', () => {
      questHasIncompleteWorkLayerBrokerProxy();
      const quest = QuestStub({ workItems: [], operations: [] });

      const result = questHasIncompleteWorkLayerBroker({ quest });

      expect(result).toBe(false);
    });

    it('VALID: {all workItems terminal, no operations} => returns false', () => {
      questHasIncompleteWorkLayerBrokerProxy();
      const quest = QuestStub({
        workItems: [WorkItemStub({ status: 'complete' }), WorkItemStub({ status: 'failed' })],
        operations: [],
      });

      const result = questHasIncompleteWorkLayerBroker({ quest });

      expect(result).toBe(false);
    });

    it('VALID: {one pending workItem} => returns true', () => {
      questHasIncompleteWorkLayerBrokerProxy();
      const quest = QuestStub({
        workItems: [WorkItemStub({ status: 'complete' }), WorkItemStub({ status: 'pending' })],
      });

      const result = questHasIncompleteWorkLayerBroker({ quest });

      expect(result).toBe(true);
    });

    it('VALID: {one in_progress workItem} => returns true', () => {
      questHasIncompleteWorkLayerBrokerProxy();
      const quest = QuestStub({
        workItems: [WorkItemStub({ status: 'in_progress' })],
      });

      const result = questHasIncompleteWorkLayerBroker({ quest });

      expect(result).toBe(true);
    });
  });

  describe('operations-ledger gate (self-heal window)', () => {
    it('VALID: {all workItems terminal, one pending operation} => returns true', () => {
      questHasIncompleteWorkLayerBrokerProxy();
      const quest = QuestStub({
        workItems: [WorkItemStub({ status: 'complete' })],
        operations: [OperationItemStub({ status: 'pending' })],
      });

      const result = questHasIncompleteWorkLayerBroker({ quest });

      expect(result).toBe(true);
    });

    it('VALID: {all workItems terminal, one in_progress operation} => returns true', () => {
      questHasIncompleteWorkLayerBrokerProxy();
      const quest = QuestStub({
        workItems: [WorkItemStub({ status: 'complete' })],
        operations: [OperationItemStub({ status: 'in_progress' })],
      });

      const result = questHasIncompleteWorkLayerBroker({ quest });

      expect(result).toBe(true);
    });

    it('VALID: {all workItems terminal, all operations complete} => returns false', () => {
      questHasIncompleteWorkLayerBrokerProxy();
      const quest = QuestStub({
        workItems: [WorkItemStub({ status: 'complete' })],
        operations: [OperationItemStub({ status: 'complete' })],
      });

      const result = questHasIncompleteWorkLayerBroker({ quest });

      expect(result).toBe(false);
    });
  });
});
