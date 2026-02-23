import { QuestVerifyResponderProxy } from './quest-verify-responder.proxy';

describe('QuestVerifyResponder', () => {
  describe('successful verification', () => {
    it('VALID: {valid questId} => returns 200 with result', async () => {
      const proxy = QuestVerifyResponderProxy();
      const { expectedData } = proxy.setupVerifyQuest();

      const result = await proxy.callResponder({ params: { questId: 'test-quest' } });

      expect(result).toStrictEqual({
        status: 200,
        data: expectedData,
      });
    });
  });

  describe('validation errors', () => {
    it('INVALID_MULTIPLE: {null params} => returns 400 with error', async () => {
      const proxy = QuestVerifyResponderProxy();

      const result = await proxy.callResponder({ params: null });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID_MULTIPLE: {non-object params} => returns 400 with error', async () => {
      const proxy = QuestVerifyResponderProxy();

      const result = await proxy.callResponder({ params: 'not-an-object' });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID_MULTIPLE: {missing questId} => returns 400 with error', async () => {
      const proxy = QuestVerifyResponderProxy();

      const result = await proxy.callResponder({ params: {} });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'questId is required' },
      });
    });

    it('INVALID_MULTIPLE: {questId is number} => returns 400 with error', async () => {
      const proxy = QuestVerifyResponderProxy();

      const result = await proxy.callResponder({ params: { questId: 123 } });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'questId is required' },
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {adapter throws} => returns 500 with error message', async () => {
      const proxy = QuestVerifyResponderProxy();
      proxy.setupVerifyQuestError({ message: 'Verification failed' });

      const result = await proxy.callResponder({ params: { questId: 'test-quest' } });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'Verification failed' },
      });
    });
  });
});
