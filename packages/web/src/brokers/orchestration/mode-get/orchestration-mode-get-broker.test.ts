import { orchestrationModeGetBroker } from './orchestration-mode-get-broker';
import { orchestrationModeGetBrokerProxy } from './orchestration-mode-get-broker.proxy';

describe('orchestrationModeGetBroker', () => {
  describe('successful fetch', () => {
    it('VALID: {mode: node} => returns "node" from API', async () => {
      const proxy = orchestrationModeGetBrokerProxy();

      proxy.setupMode({ mode: 'node' });

      const result = await orchestrationModeGetBroker();

      expect(result).toBe('node');
    });

    it('VALID: {mode: claude} => returns "claude" from API', async () => {
      const proxy = orchestrationModeGetBrokerProxy();

      proxy.setupMode({ mode: 'claude' });

      const result = await orchestrationModeGetBroker();

      expect(result).toBe('claude');
    });
  });

  describe('error handling', () => {
    it('ERROR: {network failure} => throws error', async () => {
      const proxy = orchestrationModeGetBrokerProxy();

      proxy.setupError();

      await expect(orchestrationModeGetBroker()).rejects.toThrow(/fetch/iu);
    });
  });

  describe('zod validation', () => {
    it('ERROR: {fetch returns invalid mode} => throws ZodError', async () => {
      const proxy = orchestrationModeGetBrokerProxy();

      proxy.setupInvalidResponse({ data: { mode: 'hybrid' } });

      await expect(orchestrationModeGetBroker()).rejects.toThrow(/Invalid enum value/u);
    });
  });
});
