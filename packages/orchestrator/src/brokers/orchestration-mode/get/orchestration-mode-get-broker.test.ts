import { orchestrationModeGetBroker } from './orchestration-mode-get-broker';
import { orchestrationModeGetBrokerProxy } from './orchestration-mode-get-broker.proxy';

describe('orchestrationModeGetBroker', () => {
  describe('config resolves', () => {
    it('VALID: {config orchestrationMode: "node"} => returns "node"', async () => {
      const proxy = orchestrationModeGetBrokerProxy();
      proxy.setupMode({ mode: 'node' });

      const result = await orchestrationModeGetBroker();

      expect(result).toBe('node');
    });

    it('VALID: {config orchestrationMode: "claude"} => returns "claude"', async () => {
      const proxy = orchestrationModeGetBrokerProxy();
      proxy.setupMode({ mode: 'claude' });

      const result = await orchestrationModeGetBroker();

      expect(result).toBe('claude');
    });
  });

  describe('config missing', () => {
    it('EMPTY: {no .dungeonmaster.json => ConfigNotFoundError} => falls back to "claude"', async () => {
      const proxy = orchestrationModeGetBrokerProxy();
      proxy.setupConfigNotFound();

      const result = await orchestrationModeGetBroker();

      expect(result).toBe('claude');
    });
  });

  describe('config error', () => {
    it('ERROR: {config resolve throws non-ConfigNotFound} => rethrows', async () => {
      const proxy = orchestrationModeGetBrokerProxy();
      proxy.setupConfigError({ error: new Error('malformed config') });

      await expect(orchestrationModeGetBroker()).rejects.toThrow(/malformed config/u);
    });
  });
});
