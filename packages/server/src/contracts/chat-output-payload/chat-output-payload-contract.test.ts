import { QuestIdStub, QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts';
import { chatOutputPayloadContract } from './chat-output-payload-contract';
import { ChatOutputPayloadStub } from './chat-output-payload.stub';

describe('chatOutputPayloadContract', () => {
  describe('valid inputs', () => {
    it('VALID: empty object => parses successfully (backward compat for orphan-session payloads)', () => {
      const result = ChatOutputPayloadStub({});

      expect(result).toStrictEqual({});
    });

    it('VALID: {slotIndex: 0} => parses successfully', () => {
      const result = chatOutputPayloadContract.parse({ slotIndex: 0 });

      expect(result).toStrictEqual({ slotIndex: 0 });
    });

    it('VALID: {questId, workItemId} => parses successfully and preserves both fields', () => {
      const questId = QuestIdStub();
      const workItemId = QuestWorkItemIdStub();

      const result = chatOutputPayloadContract.parse({ questId, workItemId });

      expect(result).toStrictEqual({ questId, workItemId });
    });

    it('VALID: {questId} only => parses successfully (workItemId independently optional)', () => {
      const questId = QuestIdStub();

      const result = chatOutputPayloadContract.parse({ questId });

      expect(result).toStrictEqual({ questId });
    });

    it('VALID: {workItemId} only => parses successfully (questId independently optional)', () => {
      const workItemId = QuestWorkItemIdStub();

      const result = chatOutputPayloadContract.parse({ workItemId });

      expect(result).toStrictEqual({ workItemId });
    });

    it('VALID: passthrough additional fields => preserves them', () => {
      const result = chatOutputPayloadContract.parse({ extra: 'stuff' }) as Record<
        PropertyKey,
        unknown
      >;

      expect(result).toStrictEqual({ extra: 'stuff' });
    });

    it('VALID: passthrough preserves unknown fields alongside questId + workItemId', () => {
      const questId = QuestIdStub();
      const workItemId = QuestWorkItemIdStub();

      const result = chatOutputPayloadContract.parse({
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
      expect(() => chatOutputPayloadContract.parse({ questId: 42 })).toThrow(
        'Expected string, received number',
      );
    });

    it('ERROR: {questId: ""} (empty string) => throws ZodError', () => {
      expect(() => chatOutputPayloadContract.parse({ questId: '' })).toThrow(
        'String must contain at least 1 character(s)',
      );
    });

    it('ERROR: {workItemId: 7} (number) => throws ZodError', () => {
      expect(() => chatOutputPayloadContract.parse({ workItemId: 7 })).toThrow(
        'Expected string, received number',
      );
    });

    it('ERROR: {workItemId: ""} (empty string) => throws ZodError', () => {
      expect(() => chatOutputPayloadContract.parse({ workItemId: '' })).toThrow('Invalid uuid');
    });

    it('ERROR: {workItemId: "bad-uuid"} (malformed UUID) => throws ZodError', () => {
      expect(() => chatOutputPayloadContract.parse({ workItemId: 'bad-uuid' })).toThrow(
        'Invalid uuid',
      );
    });
  });
});
