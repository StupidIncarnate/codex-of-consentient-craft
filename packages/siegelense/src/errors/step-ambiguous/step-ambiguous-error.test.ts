import { StepAmbiguousError } from './step-ambiguous-error';

describe('StepAmbiguousError', () => {
  describe('constructor()', () => {
    it('VALID: {target, within: null, three candidates} => renders every candidate with its disambiguating within, and the document-root candidate as (document root)', () => {
      const error = new StepAmbiguousError({
        target: '[data-testid="PIXEL_BTN"]',
        within: null,
        candidates: [
          { index: 0, within: 'GUILD_LIST', text: '+', rect: '(444,348) 27x25' },
          { index: 1, within: 'GUILD_SESSION_LIST', text: '+', rect: '(965,348) 27x25' },
          { index: 2, within: null, text: '+', rect: '(120,80) 27x25' },
        ],
      });

      const expectedMessage = [
        'AMBIGUOUS: 3 elements match target [data-testid="PIXEL_BTN"].',
        '  [0] within=GUILD_LIST text="+" rect=(444,348) 27x25',
        '  [1] within=GUILD_SESSION_LIST text="+" rect=(965,348) 27x25',
        '  [2] within=(document root) text="+" rect=(120,80) 27x25',
        'Pick one by narrowing with `within`.',
      ].join('\n');

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'StepAmbiguousError',
        message: expectedMessage,
      });
    });

    it('EDGE: {within: a step-level scope, two candidates} => the message states the scope the step already applied', () => {
      const error = new StepAmbiguousError({
        target: '[data-testid="GUILD_ADD"]',
        within: 'GUILD_LIST',
        candidates: [
          { index: 0, within: 'GUILD_LIST', text: 'Add', rect: '(10,20) 40x20' },
          { index: 1, within: 'GUILD_LIST', text: 'Add', rect: '(60,20) 40x20' },
        ],
      });

      const expectedMessage = [
        'AMBIGUOUS: 2 elements match target [data-testid="GUILD_ADD"] within=GUILD_LIST.',
        '  [0] within=GUILD_LIST text="Add" rect=(10,20) 40x20',
        '  [1] within=GUILD_LIST text="Add" rect=(60,20) 40x20',
        'Pick one by narrowing with `within`.',
      ].join('\n');

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'StepAmbiguousError',
        message: expectedMessage,
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof StepAmbiguousError => returns true', () => {
      const error = new StepAmbiguousError({
        target: '[data-testid="PIXEL_BTN"]',
        within: null,
        candidates: [
          { index: 0, within: 'GUILD_LIST', text: '+', rect: '(444,348) 27x25' },
          { index: 1, within: 'GUILD_SESSION_LIST', text: '+', rect: '(965,348) 27x25' },
        ],
      });

      expect(error instanceof StepAmbiguousError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new StepAmbiguousError({
        target: '[data-testid="PIXEL_BTN"]',
        within: null,
        candidates: [
          { index: 0, within: 'GUILD_LIST', text: '+', rect: '(444,348) 27x25' },
          { index: 1, within: 'GUILD_SESSION_LIST', text: '+', rect: '(965,348) 27x25' },
        ],
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
