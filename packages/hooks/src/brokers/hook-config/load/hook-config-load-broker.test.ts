import { hookConfigLoadBroker } from './hook-config-load-broker';
import { hookConfigLoadBrokerProxy } from './hook-config-load-broker.proxy';

describe('hookConfigLoadBroker', () => {
  describe('valid input', () => {
    it('VALID: {} => returns default config with pre-edit rules', () => {
      hookConfigLoadBrokerProxy();

      const result = hookConfigLoadBroker();

      expect(Array.isArray(result.rules)).toBe(true);
      expect(result.rules.length).toBeGreaterThan(30);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {cwd: "/nonexistent"} => returns default config when no files exist', () => {
      hookConfigLoadBrokerProxy();

      const result = hookConfigLoadBroker({ cwd: '/nonexistent' as never });

      expect(Array.isArray(result.rules)).toBe(true);
      expect(result.rules.length).toBeGreaterThan(30);
    });
  });
});
