import { processUptimeAdapter } from './process-uptime-adapter';
import { processUptimeAdapterProxy } from './process-uptime-adapter.proxy';

describe('processUptimeAdapter', () => {
  describe('whole-second reading', () => {
    it('VALID: {seconds: 120} => returns 120', () => {
      const proxy = processUptimeAdapterProxy();
      proxy.returns({ seconds: 120 });

      const result = processUptimeAdapter();

      expect(result).toBe(120);
    });
  });

  describe('fractional reading', () => {
    it('EDGE: {seconds: 12.7} => floors to 12 instead of failing an int() parse', () => {
      const proxy = processUptimeAdapterProxy();
      proxy.returns({ seconds: 12.7 });

      const result = processUptimeAdapter();

      expect(result).toBe(12);
    });
  });
});
