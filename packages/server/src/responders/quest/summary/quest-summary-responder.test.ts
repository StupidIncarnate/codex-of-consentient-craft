import { QuestSummaryStub } from '@dungeonmaster/shared/contracts';

import { QuestSummaryResponderProxy } from './quest-summary-responder.proxy';

const VALID_QUEST_ID = '11111111-1111-4111-8111-111111111111';

describe('QuestSummaryResponder', () => {
  describe('valid params', () => {
    it('VALID: {questId} => returns 200 with the orchestrator summary verbatim', async () => {
      const proxy = QuestSummaryResponderProxy();
      const summary = QuestSummaryStub({ questId: VALID_QUEST_ID });
      proxy.setupSummary({ summary });

      const result = await proxy.callResponder({ params: { questId: VALID_QUEST_ID } });

      expect(result).toStrictEqual({ status: 200, data: summary });
    });
  });

  describe('invalid params', () => {
    it('INVALID: {questId missing} => returns 400 without calling the orchestrator', async () => {
      const proxy = QuestSummaryResponderProxy();

      const result = await proxy.callResponder({ params: {} });

      expect(result).toStrictEqual({ status: 400, data: { error: 'questId is required' } });
    });

    it('EMPTY: {questId: ""} => returns 400', async () => {
      const proxy = QuestSummaryResponderProxy();

      const result = await proxy.callResponder({ params: { questId: '' } });

      expect(result).toStrictEqual({ status: 400, data: { error: 'questId is required' } });
    });
  });

  describe('quest not found', () => {
    it('ERROR: {orchestrator throws an Error} => returns 404 carrying that error message', async () => {
      const proxy = QuestSummaryResponderProxy();
      proxy.setupQuestNotFound({
        message: 'Quest not found: 11111111-1111-4111-8111-111111111111',
      });

      const result = await proxy.callResponder({ params: { questId: VALID_QUEST_ID } });

      expect(result).toStrictEqual({
        status: 404,
        data: { error: 'Quest not found: 11111111-1111-4111-8111-111111111111' },
      });
    });

    it('ERROR: {orchestrator throws an Error carrying a cause} => returns 404 with the cause unwound into the reason', async () => {
      const proxy = QuestSummaryResponderProxy();
      const notFound = new Error('Quest with id "q-gone" not found in any guild', {
        cause: new Error('ENOENT: no such file or directory'),
      });
      proxy.setupQuestNotFoundWithCause({ error: notFound });

      const result = await proxy.callResponder({ params: { questId: VALID_QUEST_ID } });

      expect(result).toStrictEqual({
        status: 404,
        data: {
          error:
            'Quest with id "q-gone" not found in any guild | cause: ENOENT: no such file or directory',
        },
      });
    });
  });
});
