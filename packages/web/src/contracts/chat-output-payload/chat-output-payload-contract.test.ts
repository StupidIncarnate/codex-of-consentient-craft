import { QuestIdStub, QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts';

import { chatOutputPayloadContract } from './chat-output-payload-contract';
import { ChatOutputPayloadStub } from './chat-output-payload.stub';

describe('chatOutputPayloadContract', () => {
  describe('valid payloads', () => {
    it('VALID: {chatProcessId, entries, sessionId} => parses successfully', () => {
      const payload = ChatOutputPayloadStub();

      const result = chatOutputPayloadContract.parse(payload);

      expect(result).toStrictEqual({
        chatProcessId: 'proc-12345',
        entries: [],
        sessionId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
      });
    });
  });

  describe('valid payloads — optional fields', () => {
    it('VALID: {missing chatProcessId} => parses successfully with chatProcessId undefined', () => {
      const result = chatOutputPayloadContract.parse({ entries: [] });

      expect(result.chatProcessId).toBe(undefined);
    });

    it('VALID: {questId, workItemId both present} => parses successfully and preserves them', () => {
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

    it('VALID: {questId only} => parses successfully', () => {
      const questId = QuestIdStub();

      const result = chatOutputPayloadContract.parse({
        entries: [],
        questId,
      });

      expect(result).toStrictEqual({
        entries: [],
        questId,
      });
    });

    it('VALID: {workItemId only} => parses successfully', () => {
      const workItemId = QuestWorkItemIdStub();

      const result = chatOutputPayloadContract.parse({
        entries: [],
        workItemId,
      });

      expect(result).toStrictEqual({
        entries: [],
        workItemId,
      });
    });

    it('VALID: {both questId and workItemId omitted} => parses successfully (orphan-session backward compat)', () => {
      const result = chatOutputPayloadContract.parse({ entries: [] });

      expect(result).toStrictEqual({ entries: [] });
    });
  });

  describe('error cases', () => {
    it('ERROR: {questId is empty string} => parse fails', () => {
      const result = chatOutputPayloadContract.safeParse({
        entries: [],
        questId: '',
      });

      expect(result.success).toBe(false);
    });

    it('ERROR: {workItemId is empty string} => parse fails', () => {
      const result = chatOutputPayloadContract.safeParse({
        entries: [],
        workItemId: '',
      });

      expect(result.success).toBe(false);
    });

    it('ERROR: {questId is wrong type (number)} => parse fails', () => {
      const result = chatOutputPayloadContract.safeParse({
        entries: [],
        questId: 12345,
      });

      expect(result.success).toBe(false);
    });
  });
});
