import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { QuestFollowupStopResponderProxy } from './quest-followup-stop-responder.proxy';

describe('QuestFollowupStopResponder', () => {
  describe('stopping a running turn', () => {
    it('VALID: {questId with a running tavernkeeper} => 200 with stopped true', async () => {
      const proxy = QuestFollowupStopResponderProxy();
      const questId = QuestIdStub({ value: 'quest-stop-1' });
      proxy.setupStopFollowupChat({ questId, stopped: true });

      const result = await proxy.callResponder({ params: { questId } });

      expect(result).toStrictEqual({ status: 200, data: { stopped: true } });
    });

    // A STOP pressed before the spawn registered, or after the turn already ended. The composer
    // disarms optimistically, so answering 4xx here would paint a red error entry in the
    // transcript for a button that did exactly what the reader asked.
    it('EMPTY: {nothing running for that quest} => 200 with stopped false rather than an error', async () => {
      const proxy = QuestFollowupStopResponderProxy();
      const questId = QuestIdStub({ value: 'quest-stop-2' });
      proxy.setupStopFollowupChat({ questId, stopped: false });

      const result = await proxy.callResponder({ params: { questId } });

      expect(result).toStrictEqual({ status: 200, data: { stopped: false } });
    });

    // No status gate, unlike the sibling followup POST: refusing to stop a process that IS running
    // is exactly the case a stale tab needs this route for.
    it('VALID: {questId, quest at any status} => reaches the adapter without a status pre-check', async () => {
      const proxy = QuestFollowupStopResponderProxy();
      const questId = QuestIdStub({ value: 'quest-stop-3' });
      proxy.setupStopFollowupChat({ questId, stopped: true });

      await proxy.callResponder({ params: { questId } });

      expect(proxy.getStopFollowupChatCalls()).toStrictEqual([{ questId }]);
    });
  });

  describe('invalid params', () => {
    it('INVALID: {params not an object} => 400 and the adapter is never reached', async () => {
      const proxy = QuestFollowupStopResponderProxy();

      const result = await proxy.callResponder({ params: 'not-an-object' });

      expect({ result, calls: proxy.getStopFollowupChatCalls() }).toStrictEqual({
        result: { status: 400, data: { error: 'Invalid params' } },
        calls: [],
      });
    });

    it('INVALID: {params without questId} => 400 and the adapter is never reached', async () => {
      const proxy = QuestFollowupStopResponderProxy();

      const result = await proxy.callResponder({ params: {} });

      expect({ result, calls: proxy.getStopFollowupChatCalls() }).toStrictEqual({
        result: { status: 400, data: { error: 'questId is required' } },
        calls: [],
      });
    });
  });

  describe('orchestrator failure', () => {
    it('ERROR: {adapter throws} => 500 carrying the orchestrator message verbatim', async () => {
      const proxy = QuestFollowupStopResponderProxy();
      const questId = QuestIdStub({ value: 'quest-stop-4' });
      proxy.setupStopFollowupChatError({
        questId,
        error: new Error('Quest not found: quest-stop-4'),
      });

      const result = await proxy.callResponder({ params: { questId } });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'Quest not found: quest-stop-4' },
      });
    });
  });
});
