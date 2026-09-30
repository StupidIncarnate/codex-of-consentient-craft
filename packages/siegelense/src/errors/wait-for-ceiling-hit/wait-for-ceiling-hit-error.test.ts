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
        nearest: null,
        more: 0,
        key: null,
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
        nearest: null,
        more: 0,
        key: null,
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'WaitForCeilingHitError',
        message:
          'hidden [data-testid="CONFIRM"] within=MODAL never resolved in 10000ms: Error: boom',
      });
    });

    it('VALID: {nearest: ranked names, more: 13, key} => names the top names and the count, and keeps the key off the message', () => {
      const error = new WaitForCeilingHitError({
        target: '[data-testid="NOPE"]',
        within: null,
        state: 'visible',
        timeoutMs: 2000,
        cause: new Error('Timeout 2000ms exceeded'),
        nearest: ['NODE', 'ROPE', 'PIXEL_BTN', 'APP_ROOT_BG', 'GUILD_LIST'],
        more: 13,
        key: 'key: 18 rows',
      });

      expect({ name: error.name, message: error.message, key: error.key }).toStrictEqual({
        name: 'WaitForCeilingHitError',
        message:
          'visible [data-testid="NOPE"] never resolved in 2000ms: Error: Timeout 2000ms exceeded — 0 elements match [data-testid="NOPE"] now. Nearest names on this page: NODE, ROPE, PIXEL_BTN, APP_ROOT_BG, GUILD_LIST (+13 more).',
        key: 'key: 18 rows',
      });
    });

    it('EMPTY: {nearest: []} => says the page carries no near misses', () => {
      const error = new WaitForCeilingHitError({
        target: '[data-testid="NOPE"]',
        within: null,
        state: 'visible',
        timeoutMs: 2000,
        cause: new Error('Timeout 2000ms exceeded'),
        nearest: [],
        more: 0,
        key: null,
      });

      expect({ name: error.name, message: error.message, key: error.key }).toStrictEqual({
        name: 'WaitForCeilingHitError',
        message:
          'visible [data-testid="NOPE"] never resolved in 2000ms: Error: Timeout 2000ms exceeded — 0 elements match [data-testid="NOPE"] now. Nearest names on this page: (none found on this page).',
        key: null,
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
        nearest: null,
        more: 0,
        key: null,
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
        nearest: null,
        more: 0,
        key: null,
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
