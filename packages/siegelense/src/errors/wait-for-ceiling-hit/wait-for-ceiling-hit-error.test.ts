import { WaitForCeilingHitError } from './wait-for-ceiling-hit-error';

describe('WaitForCeilingHitError', () => {
  describe('constructor()', () => {
    it('VALID: {target, within: null, state, timeoutMs, cause} => names the state, the target and the ceiling', () => {
      const error = new WaitForCeilingHitError({
        target: '[data-testid="MODAL"]',
        within: null,
        state: 'visible',
        timeoutMs: 5000,
        cause: new Error('Timeout 30000ms exceeded'),
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'WaitForCeilingHitError',
        message:
          'visible [data-testid="MODAL"] never resolved in 5000ms: Error: Timeout 30000ms exceeded',
      });
    });

    it('EDGE: {within: a step-level scope} => the message states the scope the step already applied', () => {
      const error = new WaitForCeilingHitError({
        target: '[data-testid="CONFIRM"]',
        within: 'MODAL',
        state: 'hidden',
        timeoutMs: 10_000,
        cause: new Error('boom'),
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'WaitForCeilingHitError',
        message:
          'hidden [data-testid="CONFIRM"] within=MODAL never resolved in 10000ms: Error: boom',
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof WaitForCeilingHitError => returns true', () => {
      const error = new WaitForCeilingHitError({
        target: '[data-testid="MODAL"]',
        within: null,
        state: 'visible',
        timeoutMs: 5000,
        cause: new Error('x'),
      });

      expect(error instanceof WaitForCeilingHitError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new WaitForCeilingHitError({
        target: '[data-testid="MODAL"]',
        within: null,
        state: 'visible',
        timeoutMs: 5000,
        cause: new Error('x'),
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
