import { questToListItemTransformer } from './quest-to-list-item-transformer';
import {
  OperationItemStub,
  QuestStub,
  SessionIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

describe('questToListItemTransformer', () => {
  describe('valid transformations', () => {
    it('VALID: {quest with no operations} => returns list item with undefined stepProgress', () => {
      const quest = QuestStub({ operations: [] });

      const result = questToListItemTransformer({ quest });

      expect(result).toStrictEqual({
        id: quest.id,
        folder: quest.folder,
        title: quest.title,
        status: quest.status,
        createdAt: quest.createdAt,
        stepProgress: undefined,
        activeSessionId: undefined,
        userRequest: quest.userRequest,
      });
    });

    it('VALID: {quest with a mix of operation statuses} => returns stepProgress counting complete operations', () => {
      const quest = QuestStub({
        operations: [
          OperationItemStub({
            id: '235be74a-c2e6-687c-a91c-7169625c0e54',
            status: 'complete',
          }),
          OperationItemStub({
            id: '7d42a5b3-83e0-4dd4-b874-900390937194',
            status: 'pending',
          }),
          OperationItemStub({
            id: '0c478f2e-447c-8816-a9f9-24a2987ea557',
            status: 'pending',
          }),
        ],
      });

      const result = questToListItemTransformer({ quest });

      expect(result.stepProgress).toBe('1/3');
    });

    it('VALID: {quest with all operations complete} => returns stepProgress showing all complete', () => {
      const quest = QuestStub({
        operations: [
          OperationItemStub({
            id: '235be74a-c2e6-687c-a91c-7169625c0e54',
            status: 'complete',
          }),
          OperationItemStub({
            id: '7d42a5b3-83e0-4dd4-b874-900390937194',
            status: 'complete',
          }),
        ],
      });

      const result = questToListItemTransformer({ quest });

      expect(result.stepProgress).toBe('2/2');
    });

    it('VALID: {quest with no complete operations} => returns stepProgress showing zero complete', () => {
      const quest = QuestStub({
        operations: [
          OperationItemStub({
            id: '235be74a-c2e6-687c-a91c-7169625c0e54',
            status: 'pending',
          }),
          OperationItemStub({
            id: '7d42a5b3-83e0-4dd4-b874-900390937194',
            status: 'in_progress',
          }),
        ],
      });

      const result = questToListItemTransformer({ quest });

      expect(result.stepProgress).toBe('0/2');
    });

    it('VALID: {quest with in_progress chat work item} => returns activeSessionId', () => {
      const sessionId = SessionIdStub();
      const quest = QuestStub({
        workItems: [WorkItemStub({ role: 'chaoswhisperer', status: 'in_progress', sessionId })],
      });

      const result = questToListItemTransformer({ quest });

      expect(result.activeSessionId).toBe(sessionId);
    });

    it('VALID: {quest without chat work items} => returns undefined activeSessionId', () => {
      const quest = QuestStub();

      const result = questToListItemTransformer({ quest });

      expect(result.activeSessionId).toBe(undefined);
    });
  });
});
