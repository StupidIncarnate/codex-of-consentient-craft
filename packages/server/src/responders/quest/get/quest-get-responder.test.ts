import { QuestIdStub, QuestStub } from '@dungeonmaster/shared/contracts';
import { QuestGetResponderProxy } from './quest-get-responder.proxy';

describe('QuestGetResponder', () => {
  describe('successful retrieval', () => {
    it('VALID: {valid questId} => returns 200 with quest', async () => {
      const proxy = QuestGetResponderProxy();
      const questId = QuestIdStub({ value: 'test-quest' });
      const quest = QuestStub({ id: questId });
      const { expectedData } = proxy.setupGetQuest({ quest });

      const result = await proxy.callResponder({ params: { questId }, query: {} });

      expect(result).toStrictEqual({
        status: 200,
        data: expectedData,
      });
    });

    it('VALID: {questId with stage} => returns 200 with quest', async () => {
      const proxy = QuestGetResponderProxy();
      const questId = QuestIdStub({ value: 'test-quest' });
      const quest = QuestStub({ id: questId });
      const { expectedData } = proxy.setupGetQuest({ quest });

      const result = await proxy.callResponder({
        params: { questId },
        query: { stage: 'spec' },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: expectedData,
      });
    });

    it('EDGE: {null query} => returns 200 (stage ignored)', async () => {
      const proxy = QuestGetResponderProxy();
      const questId = QuestIdStub({ value: 'test-quest' });
      const quest = QuestStub({ id: questId });
      const { expectedData } = proxy.setupGetQuest({ quest });

      const result = await proxy.callResponder({ params: { questId }, query: null });

      expect(result).toStrictEqual({
        status: 200,
        data: expectedData,
      });
    });
  });

  describe('validation errors', () => {
    it('INVALID: {null params} => returns 400 with error', async () => {
      const proxy = QuestGetResponderProxy();

      const result = await proxy.callResponder({ params: null, query: {} });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID: {non-object params} => returns 400 with error', async () => {
      const proxy = QuestGetResponderProxy();

      const result = await proxy.callResponder({ params: 'not-an-object', query: {} });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID: {missing questId} => returns 400 with error', async () => {
      const proxy = QuestGetResponderProxy();

      const result = await proxy.callResponder({ params: {}, query: {} });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'questId is required' },
      });
    });

    it('INVALID: {questId is number} => returns 400 with error', async () => {
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
      const questId = QuestIdStub({ value: 'nonexistent' });
      proxy.setupGetQuestError({ questId, message: 'Quest not found' });

      const result = await proxy.callResponder({ params: { questId }, query: {} });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'Quest not found' },
      });
    });
  });
});
