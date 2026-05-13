import { processStaleWatchBootstrapState } from './process-stale-watch-bootstrap-state';

describe('processStaleWatchBootstrapState', () => {
  describe('getHandle / setHandle', () => {
    it('VALID: {handle set} => getHandle returns the same handle', () => {
      processStaleWatchBootstrapState.clear();
      const stop = jest.fn();
      processStaleWatchBootstrapState.setHandle({ handle: { stop } });

      const result = processStaleWatchBootstrapState.getHandle();

      expect(result).toStrictEqual({ stop });
    });

    it('EMPTY: {no handle set} => getHandle returns null', () => {
      processStaleWatchBootstrapState.clear();

      const result = processStaleWatchBootstrapState.getHandle();

      expect(result).toBe(null);
    });
  });

  describe('clear', () => {
    it('VALID: {handle set then cleared} => getHandle returns null', () => {
      processStaleWatchBootstrapState.clear();
      processStaleWatchBootstrapState.setHandle({ handle: { stop: jest.fn() } });

      processStaleWatchBootstrapState.clear();

      expect(processStaleWatchBootstrapState.getHandle()).toBe(null);
    });
  });
});
