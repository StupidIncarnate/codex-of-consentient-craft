import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { SessionIdStub } from '@dungeonmaster/shared/contracts/session-id/session-id.stub';
import { WorkItemStub } from '@dungeonmaster/shared/contracts/work-item/work-item.stub';

import { QuestClarifyResponder } from './quest-clarify-responder';
import { QuestClarifyResponderProxy } from './quest-clarify-responder.proxy';

describe('QuestClarifyResponder', () => {
  describe('successful clarification', () => {
    it('VALID: {questId in params, body with answers/questions, chat work item with sessionId} => returns 200 with chatProcessId', async () => {
      const proxy = QuestClarifyResponderProxy();
      const questId = QuestIdStub();
      const sessionId = SessionIdStub({ value: 'session-clarify' });
      const guildId = GuildIdStub();
      const chatProcessId = 'proc-clarify';
      const quest = QuestStub({
        id: questId,
        workItems: [WorkItemStub({ role: 'chaoswhisperer', sessionId })],
      });

      proxy.setupQuestLoad({ quest });
      proxy.setupFindQuestPath({
        questId,
        guildId,
        questPath: '/q/path',
      });
      proxy.setupClarify({ questId, chatProcessId });

      const result = await proxy.callResponder({
        params: { questId },
        body: {
          answers: [{ header: 'q1', labels: ['a1'] }],
          questions: [
            {
              question: 'a question',
              header: 'q1',
              options: [{ label: 'a1', description: 'first option' }],
              multiSelect: false,
            },
          ],
        },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: { chatProcessId: 'proc-clarify' },
      });
    });

    it('VALID: {question-1 answer {header: Letters, labels: [Alpha, Gamma], text: prefer Gamma}} => returns 200 with chatProcessId', async () => {
      const proxy = QuestClarifyResponderProxy();
      const questId = QuestIdStub();
      const sessionId = SessionIdStub({ value: 'session-clarify' });
      const guildId = GuildIdStub();
      const quest = QuestStub({
        id: questId,
        workItems: [WorkItemStub({ role: 'chaoswhisperer', sessionId })],
      });

      proxy.setupQuestLoad({ quest });
      proxy.setupFindQuestPath({ questId, guildId, questPath: '/q/path' });
      proxy.setupClarify({ questId, chatProcessId: 'proc-multi' });

      const result = await proxy.callResponder({
        params: { questId },
        body: {
          answers: [{ header: 'Letters', labels: ['Alpha', 'Gamma'], text: 'prefer Gamma' }],
          questions: [
            {
              question: 'Which letters?',
              header: 'Letters',
              options: [
                { label: 'Alpha', description: 'first letter' },
                { label: 'Beta', description: 'second letter' },
                { label: 'Gamma', description: 'third letter' },
              ],
              multiSelect: true,
            },
          ],
        },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: { chatProcessId: 'proc-multi' },
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
          answers: [{ header: 'q1', labels: ['a1'] }],
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

    it('INVALID: {answer {header: Letters, labels: []} and no text} => returns 400', async () => {
      QuestClarifyResponderProxy();

      const result = await QuestClarifyResponder({
        params: { questId: QuestIdStub() },
        body: { answers: [{ header: 'Letters', labels: [] }], questions: [] },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'answers array is required and must not be empty' },
      });
    });

    it('INVALID: {answer {labels: [], text: whitespace only}} => returns 400', async () => {
      QuestClarifyResponderProxy();

      const result = await QuestClarifyResponder({
        params: { questId: QuestIdStub() },
        body: { answers: [{ header: 'Letters', labels: [], text: '   ' }], questions: [] },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'answers array is required and must not be empty' },
      });
    });

    it('INVALID: {answer {labels: [empty string]}} => returns 400', async () => {
      QuestClarifyResponderProxy();

      const result = await QuestClarifyResponder({
        params: { questId: QuestIdStub() },
        body: { answers: [{ header: 'Letters', labels: [''] }], questions: [] },
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
      const questId = QuestIdStub();
      proxy.setupQuestLoadError({ questId, error: new Error('Quest not found') });

      const result = await proxy.callResponder({
        params: { questId },
        body: {
          answers: [{ header: 'q1', labels: ['a1'] }],
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
