import { QuestIdStub } from '@dungeonmaster/shared/contracts';
import { QuestPauseResponderProxy } from './quest-pause-responder.proxy';

describe('QuestPauseResponder', () => {
  describe('successful pause', () => {
    it('VALID: {valid questId} => returns 200 with paused true', async () => {
      const proxy = QuestPauseResponderProxy();
      const questId = QuestIdStub();
      proxy.setupPauseQuest({ paused: true });

      const result = await proxy.callResponder({ params: { questId } });

      expect(result).toStrictEqual({
        status: 200,
        data: { paused: true },
      });
    });
  });

  describe('validation errors', () => {
    it('INVALID: {null params} => returns 400 with error', async () => {
      const proxy = QuestPauseResponderProxy();

      const result = await proxy.callResponder({ params: null });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID: {missing questId} => returns 400 with error', async () => {
      const proxy = QuestPauseResponderProxy();

      const result = await proxy.callResponder({ params: {} });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'questId is required' },
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {adapter throws} => returns 500 with error message', async () => {
      const proxy = QuestPauseResponderProxy();
      proxy.setupPauseQuestError({ message: 'Quest pause failed' });

      const result = await proxy.callResponder({ params: { questId: 'test-quest' } });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'Quest pause failed' },
      });
    });
  });
});
