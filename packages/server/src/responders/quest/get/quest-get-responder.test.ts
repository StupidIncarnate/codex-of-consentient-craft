import { QuestStub } from '@dungeonmaster/shared/contracts';
import { QuestGetResponderProxy } from './quest-get-responder.proxy';

describe('QuestGetResponder', () => {
  describe('successful retrieval', () => {
    it('VALID: {valid questId} => returns 200 with quest', async () => {
      const proxy = QuestGetResponderProxy();
      const quest = QuestStub();
      const { expectedData } = proxy.setupGetQuest({ quest });

      const result = await proxy.callResponder({ params: { questId: 'test-quest' }, query: {} });

      expect(result).toStrictEqual({
        status: 200,
        data: expectedData,
      });
    });

    it('VALID: {questId with stage} => returns 200 with quest', async () => {
      const proxy = QuestGetResponderProxy();
      const quest = QuestStub();
      const { expectedData } = proxy.setupGetQuest({ quest });

      const result = await proxy.callResponder({
        params: { questId: 'test-quest' },
        query: { stage: 'spec' },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: expectedData,
      });
    });

    it('EDGE: {null query} => returns 200 (stage ignored)', async () => {
      const proxy = QuestGetResponderProxy();
      const quest = QuestStub();
      const { expectedData } = proxy.setupGetQuest({ quest });

      const result = await proxy.callResponder({ params: { questId: 'test-quest' }, query: null });

      expect(result).toStrictEqual({
        status: 200,
        data: expectedData,
      });
    });
  });

  describe('validation errors', () => {
    it('INVALID_MULTIPLE: {null params} => returns 400 with error', async () => {
      const proxy = QuestGetResponderProxy();

      const result = await proxy.callResponder({ params: null, query: {} });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID_MULTIPLE: {non-object params} => returns 400 with error', async () => {
      const proxy = QuestGetResponderProxy();

      const result = await proxy.callResponder({ params: 'not-an-object', query: {} });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID_MULTIPLE: {missing questId} => returns 400 with error', async () => {
      const proxy = QuestGetResponderProxy();

      const result = await proxy.callResponder({ params: {}, query: {} });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'questId is required' },
      });
    });

    it('INVALID_MULTIPLE: {questId is number} => returns 400 with error', async () => {
      const proxy = QuestGetResponderProxy();

      const result = await proxy.callResponder({ params: { questId: 123 }, query: {} });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'questId is required' },
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {adapter throws} => returns 500 with error message', async () => {
      const proxy = QuestGetResponderProxy();
      proxy.setupGetQuestError({ message: 'Quest not found' });

      const result = await proxy.callResponder({ params: { questId: 'nonexistent' }, query: {} });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'Quest not found' },
      });
    });
  });
});
