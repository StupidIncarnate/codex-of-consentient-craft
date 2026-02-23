import { ProcessIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';
import { QuestStartResponderProxy } from './quest-start-responder.proxy';

describe('QuestStartResponder', () => {
  describe('successful start', () => {
    it('VALID: {valid questId} => returns 200 with processId', async () => {
      const proxy = QuestStartResponderProxy();
      const questId = QuestIdStub();
      const processId = ProcessIdStub();
      proxy.setupStartQuest({ processId });

      const result = await proxy.callResponder({ params: { questId } });

      expect(result).toStrictEqual({
        status: 200,
        data: { processId },
      });
    });
  });

  describe('validation errors', () => {
    it('INVALID_MULTIPLE: {null params} => returns 400 with error', async () => {
      const proxy = QuestStartResponderProxy();

      const result = await proxy.callResponder({ params: null });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID_MULTIPLE: {non-object params} => returns 400 with error', async () => {
      const proxy = QuestStartResponderProxy();

      const result = await proxy.callResponder({ params: 'not-an-object' });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID_MULTIPLE: {missing questId} => returns 400 with error', async () => {
      const proxy = QuestStartResponderProxy();

      const result = await proxy.callResponder({ params: {} });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'questId is required' },
      });
    });

    it('INVALID_MULTIPLE: {questId is number} => returns 400 with error', async () => {
      const proxy = QuestStartResponderProxy();

      const result = await proxy.callResponder({ params: { questId: 123 } });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'questId is required' },
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {adapter throws} => returns 500 with error message', async () => {
      const proxy = QuestStartResponderProxy();
      proxy.setupStartQuestError({ message: 'Quest start failed' });

      const result = await proxy.callResponder({ params: { questId: 'test-quest' } });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'Quest start failed' },
      });
    });
  });
});
