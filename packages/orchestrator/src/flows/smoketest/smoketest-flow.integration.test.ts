import { SmoketestFlow } from './smoketest-flow';

describe('SmoketestFlow', () => {
  describe('export', () => {
    it('VALID: SmoketestFlow => exports run and getState', () => {
      expect(SmoketestFlow).toStrictEqual({
        run: expect.any(Function),
        getState: expect.any(Function),
      });
    });
  });

  describe('getState', () => {
    it('VALID: {getState} => returns {active: null, events: []} when no run is active', () => {
      expect(SmoketestFlow.getState()).toStrictEqual({ active: null, events: [] });
    });
  });
});
