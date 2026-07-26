import { QuestIdStub, SessionIdStub } from '@dungeonmaster/shared/contracts';
import { QuestFindBySessionResponderProxy } from './quest-find-by-session-responder.proxy';

describe('QuestFindBySessionResponder', () => {
  describe('successful lookup', () => {
    it('VALID: {valid sessionId, quest found} => returns 200 with questId', async () => {
      const proxy = QuestFindBySessionResponderProxy();
      const sessionId = SessionIdStub({ value: 'session-test-001' });
      const questId = QuestIdStub({ value: 'q-sess-found-1' });
      proxy.setupFound({ sessionId, questId });

      const result = await proxy.callResponder({
        params: { sessionId },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: { questId },
      });
    });
  });

  describe('not found', () => {
    it('EMPTY: {valid sessionId, no quest found} => returns 404 with error', async () => {
      const proxy = QuestFindBySessionResponderProxy();
      const sessionId = SessionIdStub({ value: 'session-test-002' });
      proxy.setupNotFound({ sessionId });

      const result = await proxy.callResponder({
        params: { sessionId },
      });

      expect(result).toStrictEqual({
        status: 404,
        data: { error: 'No quest found for session' },
      });
    });
  });

  describe('validation errors', () => {
    it('INVALID: {null params} => returns 400 with error', async () => {
      const proxy = QuestFindBySessionResponderProxy();

      const result = await proxy.callResponder({ params: null });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID: {non-object params} => returns 400 with error', async () => {
      const proxy = QuestFindBySessionResponderProxy();

      const result = await proxy.callResponder({ params: 'not-an-object' });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID: {missing sessionId} => returns 400 with error', async () => {
      const proxy = QuestFindBySessionResponderProxy();

      const result = await proxy.callResponder({ params: {} });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'sessionId is required' },
      });
    });

    it('INVALID: {sessionId is number} => returns 400 with error', async () => {
      const proxy = QuestFindBySessionResponderProxy();

      const result = await proxy.callResponder({ params: { sessionId: 123 } });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'sessionId is required' },
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {adapter throws} => returns 500 with error message', async () => {
      const proxy = QuestFindBySessionResponderProxy();
      const sessionId = SessionIdStub({ value: 'session-test-003' });
      proxy.setupError({ sessionId, message: 'orchestrator unavailable' });

      const result = await proxy.callResponder({
        params: { sessionId },
      });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'orchestrator unavailable' },
      });
    });
  });
});
