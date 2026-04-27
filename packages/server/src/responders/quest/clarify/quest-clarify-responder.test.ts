import {
  AbsoluteFilePathStub,
  GuildIdStub,
  ProcessIdStub,
  QuestIdStub,
  QuestStub,
  SessionIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { QuestClarifyResponder } from './quest-clarify-responder';
import { QuestClarifyResponderProxy } from './quest-clarify-responder.proxy';

describe('QuestClarifyResponder', () => {
  describe('successful clarification', () => {
    it('VALID: {questId in params, body with answers/questions, chat work item with sessionId} => returns 200 with chatProcessId', async () => {
      const proxy = QuestClarifyResponderProxy();
      const questId = QuestIdStub();
      const sessionId = SessionIdStub({ value: 'session-clarify' });
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'proc-clarify' });
      const quest = QuestStub({
        id: questId,
        workItems: [WorkItemStub({ role: 'chaoswhisperer', sessionId })],
      });

      proxy.setupQuestLoad({ quest });
      proxy.setupFindQuestPath({
        guildId,
        questPath: AbsoluteFilePathStub({ value: '/q/path' }),
      });
      proxy.setupClarify({ chatProcessId });

      const result = await proxy.callResponder({
        params: { questId },
        body: {
          answers: [{ header: 'q1', label: 'a1' }],
          questions: [{ id: 'q1', text: 'a question' }],
        },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: { chatProcessId: 'proc-clarify' },
      });
    });
  });

  describe('not-found cases', () => {
    it('EDGE: {quest with no chat work item sessionId} => returns 404', async () => {
      const proxy = QuestClarifyResponderProxy();
      const questId = QuestIdStub();
      const quest = QuestStub({ id: questId, workItems: [] });

      proxy.setupQuestLoad({ quest });

      const result = await proxy.callResponder({
        params: { questId },
        body: {
          answers: [{ header: 'q1', label: 'a1' }],
          questions: [],
        },
      });

      expect(result).toStrictEqual({
        status: 404,
        data: { error: 'No active chat session found for quest' },
      });
    });
  });

  describe('validation errors', () => {
    it('INVALID: {null params} => returns 400', async () => {
      QuestClarifyResponderProxy();

      const result = await QuestClarifyResponder({
        params: null,
        body: { answers: [], questions: [] },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID: {missing questId} => returns 400', async () => {
      QuestClarifyResponderProxy();

      const result = await QuestClarifyResponder({
        params: {},
        body: { answers: [], questions: [] },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'questId is required' },
      });
    });

    it('INVALID: {null body} => returns 400', async () => {
      QuestClarifyResponderProxy();

      const result = await QuestClarifyResponder({
        params: { questId: QuestIdStub() },
        body: null,
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Request body must be a JSON object' },
      });
    });

    it('INVALID: {empty answers} => returns 400', async () => {
      QuestClarifyResponderProxy();

      const result = await QuestClarifyResponder({
        params: { questId: QuestIdStub() },
        body: { answers: [], questions: [] },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'answers array is required and must not be empty' },
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {load quest throws} => returns 500', async () => {
      const proxy = QuestClarifyResponderProxy();
      proxy.setupQuestLoadError({ error: new Error('Quest not found') });

      const result = await proxy.callResponder({
        params: { questId: QuestIdStub() },
        body: {
          answers: [{ header: 'q1', label: 'a1' }],
          questions: [],
        },
      });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'Quest not found' },
      });
    });
  });
});
