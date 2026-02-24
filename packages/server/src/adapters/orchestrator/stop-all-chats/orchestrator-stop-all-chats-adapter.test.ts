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

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', () => {
      const proxy = orchestratorStopAllChatsAdapterProxy();

      proxy.throws({ error: new Error('Failed to kill processes') });

      expect(() => {
        orchestratorStopAllChatsAdapter();
      }).toThrow(/^Failed to kill processes$/u);
    });
  });
});
