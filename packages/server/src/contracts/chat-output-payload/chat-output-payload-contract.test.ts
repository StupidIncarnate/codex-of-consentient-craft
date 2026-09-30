import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts/quest-work-item-id/quest-work-item-id.stub';
import { chatOutputRoutingContract } from './chat-output-payload-contract';
import { ChatOutputRoutingStub } from './chat-output-payload.stub';

describe('chatOutputPayloadContract', () => {
  describe('valid inputs', () => {
    it('VALID: empty object => parses successfully (backward compat for orphan-session payloads)', () => {
      const result = ChatOutputRoutingStub({});

      expect(result).toStrictEqual({});
    });

    it('VALID: {slotIndex: 0} => parses successfully', () => {
      const result = chatOutputRoutingContract.parse({ slotIndex: 0 });

      expect(result).toStrictEqual({ slotIndex: 0 });
    });

    it('VALID: {questId, workItemId} => parses successfully and preserves both fields', () => {
      const questId = QuestIdStub();
      const workItemId = QuestWorkItemIdStub();

      const result = chatOutputRoutingContract.parse({ questId, workItemId });

      expect(result).toStrictEqual({ questId, workItemId });
    });

    it('VALID: {questId} only => parses successfully (workItemId independently optional)', () => {
      const questId = QuestIdStub();

      const result = chatOutputRoutingContract.parse({ questId });

      expect(result).toStrictEqual({ questId });
    });

    it('VALID: {workItemId} only => parses successfully (questId independently optional)', () => {
      const workItemId = QuestWorkItemIdStub();

      const result = chatOutputRoutingContract.parse({ workItemId });

      expect(result).toStrictEqual({ workItemId });
    });

    it('VALID: passthrough additional fields => preserves them', () => {
      const result = chatOutputRoutingContract.parse({ extra: 'stuff' }) as Record<
        PropertyKey,
        unknown
      >;

      expect(result).toStrictEqual({ extra: 'stuff' });
    });

    it('VALID: passthrough preserves unknown fields alongside questId + workItemId', () => {
      const questId = QuestIdStub();
      const workItemId = QuestWorkItemIdStub();

      const result = chatOutputRoutingContract.parse({
        questId,
        workItemId,
        chatProcessId: 'cp-123',
        entries: [],
      }) as Record<PropertyKey, unknown>;

      expect(result).toStrictEqual({
        questId,
        workItemId,
        chatProcessId: 'cp-123',
        entries: [],
      });
    });
  });

  describe('invalid inputs', () => {
    it('ERROR: {questId: 42} (number) => throws ZodError', () => {
      expect(() => chatOutputRoutingContract.parse({ questId: 42 })).toThrow(
        'Invalid input: expected string, received number',
      );
    });

    it('ERROR: {questId: ""} (empty string) => throws ZodError', () => {
      expect(() => chatOutputRoutingContract.parse({ questId: '' })).toThrow(
        'expected string to have >=1 characters',
      );
    });

    it('ERROR: {workItemId: 7} (number) => throws ZodError', () => {
      expect(() => chatOutputRoutingContract.parse({ workItemId: 7 })).toThrow(
        'Invalid input: expected string, received number',
      );
    });

    it('ERROR: {workItemId: ""} (empty string) => throws ZodError', () => {
      expect(() => chatOutputRoutingContract.parse({ workItemId: '' })).toThrow('Invalid UUID');
    });

    it('ERROR: {workItemId: "bad-uuid"} (malformed UUID) => throws ZodError', () => {
      expect(() => chatOutputRoutingContract.parse({ workItemId: 'bad-uuid' })).toThrow(
        'Invalid UUID',
      );
    });
  });
});
