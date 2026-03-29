import { QuestModifyResponderProxy } from './quest-modify-responder.proxy';

describe('QuestModifyResponder', () => {
  describe('successful modification', () => {
    it('VALID: {valid questId, body} => returns 200 with result', async () => {
      const proxy = QuestModifyResponderProxy();
      const { expectedData } = proxy.setupModifyQuest();

      const result = await proxy.callResponder({
        params: { questId: 'test-quest' },
        body: { status: 'approved' },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: expectedData,
      });
    });
  });

  describe('validation errors', () => {
    it('INVALID: {null params} => returns 400 with error', async () => {
      const proxy = QuestModifyResponderProxy();

      const result = await proxy.callResponder({ params: null, body: {} });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID: {non-object params} => returns 400 with error', async () => {
      const proxy = QuestModifyResponderProxy();

      const result = await proxy.callResponder({ params: 'not-an-object', body: {} });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID: {missing questId} => returns 400 with error', async () => {
      const proxy = QuestModifyResponderProxy();

      const result = await proxy.callResponder({ params: {}, body: {} });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'questId is required' },
      });
    });

    it('INVALID: {questId is number} => returns 400 with error', async () => {
      const proxy = QuestModifyResponderProxy();

      const result = await proxy.callResponder({ params: { questId: 123 }, body: {} });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'questId is required' },
      });
    });

    it('INVALID: {null body} => returns 400 with error', async () => {
      const proxy = QuestModifyResponderProxy();

      const result = await proxy.callResponder({ params: { questId: 'test-quest' }, body: null });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Request body must be a JSON object' },
      });
    });

    it('INVALID: {non-object body} => returns 400 with error', async () => {
      const proxy = QuestModifyResponderProxy();

      const result = await proxy.callResponder({
        params: { questId: 'test-quest' },
        body: 'not-an-object',
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Request body must be a JSON object' },
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {adapter throws} => returns 500 with error message', async () => {
      const proxy = QuestModifyResponderProxy();
      proxy.setupModifyQuestError({ message: 'Modification failed' });

      const result = await proxy.callResponder({
        params: { questId: 'test-quest' },
        body: { status: 'approved' },
      });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'Modification failed' },
      });
    });
  });
});
