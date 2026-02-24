import { ProcessIdStub } from '@dungeonmaster/shared/contracts';

import { orchestratorStopChatAdapter } from './orchestrator-stop-chat-adapter';
import { orchestratorStopChatAdapterProxy } from './orchestrator-stop-chat-adapter.proxy';

describe('orchestratorStopChatAdapter', () => {
  describe('successful stop', () => {
    it('VALID: {chatProcessId} => returns true when process found', () => {
      orchestratorStopChatAdapterProxy();
      const chatProcessId = ProcessIdStub();

      const result = orchestratorStopChatAdapter({ chatProcessId });

      expect(result).toBe(true);
    });

    it('VALID: {chatProcessId} => returns false when process not found', () => {
      const proxy = orchestratorStopChatAdapterProxy();
      const chatProcessId = ProcessIdStub();

      proxy.returns({ stopped: false });

      const result = orchestratorStopChatAdapter({ chatProcessId });

      expect(result).toBe(false);
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', () => {
      const proxy = orchestratorStopChatAdapterProxy();
      const chatProcessId = ProcessIdStub();

      proxy.throws({ error: new Error('Failed to stop chat') });

      expect(() => orchestratorStopChatAdapter({ chatProcessId })).toThrow(/Failed to stop chat/u);
    });
  });
});
