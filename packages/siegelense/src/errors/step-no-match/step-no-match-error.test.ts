import { StepNoMatchError } from './step-no-match-error';

describe('StepNoMatchError', () => {
  describe('constructor()', () => {
    it('VALID: {target, within: null, three near misses} => names every near-miss testId on the page', () => {
      const error = new StepNoMatchError({
        target: '[data-testid="GUILD_ADD"]',
        within: null,
        nearest: ['GUILD_LIST', 'GUILD_ITEM_f52cd', 'PIXEL_BTN'],
        more: 0,
        key: null,
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'StepNoMatchError',
        message:
          'NO MATCH: 0 elements match target [data-testid="GUILD_ADD"]. Nearest names on this page: GUILD_LIST, GUILD_ITEM_f52cd, PIXEL_BTN.',
      });
    });

    it('EDGE: {within: a step-level scope} => the message states the scope the step already applied', () => {
      const error = new StepNoMatchError({
        target: '[data-testid="CONFIRM"]',
        within: 'MODAL',
        nearest: ['CANCEL'],
        more: 0,
        key: null,
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'StepNoMatchError',
        message:
          'NO MATCH: 0 elements match target [data-testid="CONFIRM"] within=MODAL. Nearest names on this page: CANCEL.',
      });
    });

    it('EMPTY: {nearest: []} => names the page as carrying no near misses', () => {
      const error = new StepNoMatchError({
        target: '[data-testid="X"]',
        within: null,
        nearest: [],
        more: 0,
        key: null,
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'StepNoMatchError',
        message:
          'NO MATCH: 0 elements match target [data-testid="X"]. Nearest names on this page: (none found on this page).',
      });
    });

    it('VALID: {five ranked names, more: 13, key} => names the five, counts the rest, and keeps the key off the message', () => {
      const error = new StepNoMatchError({
        target: '[data-testid="NOPE"]',
        within: null,
        nearest: ['NODE', 'ROPE', 'PIXEL_BTN', 'APP_ROOT_BG', 'GUILD_LIST'],
        more: 13,
        key: 'key: 18 rows',
      });

      expect({ name: error.name, message: error.message, key: error.key }).toStrictEqual({
        name: 'StepNoMatchError',
        message:
          'NO MATCH: 0 elements match target [data-testid="NOPE"]. Nearest names on this page: NODE, ROPE, PIXEL_BTN, APP_ROOT_BG, GUILD_LIST (+13 more).',
        key: 'key: 18 rows',
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof StepNoMatchError => returns true', () => {
      const error = new StepNoMatchError({
        target: '[data-testid="GUILD_ADD"]',
        within: null,
        nearest: ['GUILD_LIST'],
        more: 0,
        key: null,
      });

      expect(error instanceof StepNoMatchError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new StepNoMatchError({
        target: '[data-testid="GUILD_ADD"]',
        within: null,
        nearest: ['GUILD_LIST'],
        more: 0,
        key: null,
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
