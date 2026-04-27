import { QuestIdStub, QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts';

import { chatOutputPayloadContract } from './chat-output-payload-contract';
import { ChatOutputPayloadStub } from './chat-output-payload.stub';

describe('chatOutputPayloadContract', () => {
  describe('valid payloads', () => {
    it('VALID: {chatProcessId, entries, sessionId, questId, workItemId} => parses successfully', () => {
      const payload = ChatOutputPayloadStub();

      const result = chatOutputPayloadContract.parse(payload);

      expect(result).toStrictEqual({
        chatProcessId: 'proc-12345',
        entries: [],
        sessionId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
        questId: payload.questId,
        workItemId: payload.workItemId,
      });
    });

    it('VALID: {questId + workItemId only, no chatProcessId, no sessionId} => parses successfully', () => {
      const questId = QuestIdStub();
      const workItemId = QuestWorkItemIdStub();

      const result = chatOutputPayloadContract.parse({
        entries: [],
        questId,
        workItemId,
      });

      expect(result).toStrictEqual({
        entries: [],
        questId,
        workItemId,
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {questId missing} => parse fails', () => {
      const result = chatOutputPayloadContract.safeParse({
        entries: [],
        workItemId: QuestWorkItemIdStub(),
      });

      expect(result.success).toBe(false);
    });

    it('ERROR: {workItemId missing} => parse fails', () => {
      const result = chatOutputPayloadContract.safeParse({
        entries: [],
        questId: QuestIdStub(),
      });

      expect(result.success).toBe(false);
    });

    it('ERROR: {questId is empty string} => parse fails', () => {
      const result = chatOutputPayloadContract.safeParse({
        entries: [],
        questId: '',
        workItemId: QuestWorkItemIdStub(),
      });

      expect(result.success).toBe(false);
    });

    it('ERROR: {workItemId is empty string} => parse fails', () => {
      const result = chatOutputPayloadContract.safeParse({
        entries: [],
        questId: QuestIdStub(),
        workItemId: '',
      });

      expect(result.success).toBe(false);
    });

    it('ERROR: {questId is wrong type (number)} => parse fails', () => {
      const result = chatOutputPayloadContract.safeParse({
        entries: [],
        questId: 12345,
        workItemId: QuestWorkItemIdStub(),
      });

      expect(result.success).toBe(false);
    });
  });
});
