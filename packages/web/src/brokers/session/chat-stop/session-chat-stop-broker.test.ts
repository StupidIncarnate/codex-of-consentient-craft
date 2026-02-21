import { ProcessIdStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

import { sessionChatStopBroker } from './session-chat-stop-broker';
import { sessionChatStopBrokerProxy } from './session-chat-stop-broker.proxy';

describe('sessionChatStopBroker', () => {
  describe('successful stop', () => {
    it('VALID: {sessionId, chatProcessId} => resolves void', async () => {
      const proxy = sessionChatStopBrokerProxy();
      const sessionId = SessionIdStub({ value: 'session-abc' });
      const chatProcessId = ProcessIdStub({ value: 'chat-proc-1' });

      proxy.setupStop();

      await expect(sessionChatStopBroker({ sessionId, chatProcessId })).resolves.toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('ERROR: {server error} => throws error', async () => {
      const proxy = sessionChatStopBrokerProxy();
      const sessionId = SessionIdStub({ value: 'session-abc' });
      const chatProcessId = ProcessIdStub({ value: 'chat-proc-1' });

      proxy.setupError();

      await expect(sessionChatStopBroker({ sessionId, chatProcessId })).rejects.toThrow(/fetch/iu);
    });
  });
});
