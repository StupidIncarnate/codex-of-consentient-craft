import { busOnCallDetectTransformer } from './bus-on-call-detect-transformer';

describe('busOnCallDetectTransformer', () => {
  describe('source contains matching .on call', () => {
    it('VALID: {simple call} => returns true', () => {
      const result = busOnCallDetectTransformer({
        source: 'myBus.on({ type, handler });',
        busExportName: 'myBus',
      });

      expect(result).toBe(true);
    });

    it('VALID: {whitespace before paren} => returns true', () => {
      const result = busOnCallDetectTransformer({
        source: 'myBus.on (args);',
        busExportName: 'myBus',
      });

      expect(result).toBe(true);
    });
  });

  describe('source has on definition but not a call', () => {
    it('EMPTY: {colon-form on property definition} => returns false', () => {
      // The bus state file itself defines `on:` — this should NOT be flagged as a subscription.
      const result = busOnCallDetectTransformer({
        source: 'export const myBus = { on: (args) => {} };',
        busExportName: 'myBus',
      });

      expect(result).toBe(false);
    });
  });

  describe('source contains .on call on a different bus', () => {
    it('EMPTY: {unrelated bus name} => returns false', () => {
      const result = busOnCallDetectTransformer({
        source: 'otherBus.on({ type, handler });',
        busExportName: 'myBus',
      });

      expect(result).toBe(false);
    });
  });
});
