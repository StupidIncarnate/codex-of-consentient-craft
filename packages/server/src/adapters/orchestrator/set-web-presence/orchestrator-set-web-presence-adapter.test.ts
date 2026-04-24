import { orchestratorSetWebPresenceAdapter } from './orchestrator-set-web-presence-adapter';
import { orchestratorSetWebPresenceAdapterProxy } from './orchestrator-set-web-presence-adapter.proxy';

describe('orchestratorSetWebPresenceAdapter', () => {
  describe('successful toggle', () => {
    it('VALID: {isPresent: true} => returns success result', () => {
      orchestratorSetWebPresenceAdapterProxy();

      const result = orchestratorSetWebPresenceAdapter({ isPresent: true });

      expect(result).toStrictEqual({ success: true });
    });

    it('VALID: {isPresent: true} => forwards exact args to orchestrator', () => {
      const proxy = orchestratorSetWebPresenceAdapterProxy();

      orchestratorSetWebPresenceAdapter({ isPresent: true });

      expect(proxy.getLastCalledArgs()).toStrictEqual({ isPresent: true });
    });

    it('VALID: {isPresent: false} => forwards exact args to orchestrator', () => {
      const proxy = orchestratorSetWebPresenceAdapterProxy();

      orchestratorSetWebPresenceAdapter({ isPresent: false });

      expect(proxy.getLastCalledArgs()).toStrictEqual({ isPresent: false });
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', () => {
      const proxy = orchestratorSetWebPresenceAdapterProxy();
      proxy.throws({ error: new Error('Failed to set web presence') });

      expect(() => orchestratorSetWebPresenceAdapter({ isPresent: true })).toThrow(
        /Failed to set web presence/u,
      );
    });
  });
});
