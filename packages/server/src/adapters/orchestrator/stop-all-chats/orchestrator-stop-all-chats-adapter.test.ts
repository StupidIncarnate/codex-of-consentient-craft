import { orchestratorStopAllChatsAdapter } from './orchestrator-stop-all-chats-adapter';
import { orchestratorStopAllChatsAdapterProxy } from './orchestrator-stop-all-chats-adapter.proxy';

describe('orchestratorStopAllChatsAdapter', () => {
  describe('successful stop all', () => {
    it('VALID: {} => completes without error', () => {
      orchestratorStopAllChatsAdapterProxy();

      expect(() => {
        orchestratorStopAllChatsAdapter();
      }).not.toThrow();
    });
  });
});
