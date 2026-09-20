import { StepAmbiguousError } from './step-ambiguous-error';

describe('StepAmbiguousError', () => {
  describe('constructor()', () => {
    it('VALID: {target, within: null, three candidates} => renders every candidate with its ref and its disambiguating within, and the document-root candidate as (document root)', () => {
      const error = new StepAmbiguousError({
        target: '[data-testid="PIXEL_BTN"]',
        within: null,
        candidates: [
          { index: 0, ref: 16, within: 'GUILD_LIST', text: '+', rect: '(444,348) 27x25' },
          { index: 1, ref: 23, within: 'GUILD_SESSION_LIST', text: '+', rect: '(965,348) 27x25' },
          { index: 2, ref: 31, within: null, text: '+', rect: '(120,80) 27x25' },
        ],
      });

      const expectedMessage = [
        'AMBIGUOUS: 3 elements match target [data-testid="PIXEL_BTN"].',
        '  [0] ref=16 within=GUILD_LIST text="+" rect=(444,348) 27x25',
        '  [1] ref=23 within=GUILD_SESSION_LIST text="+" rect=(965,348) 27x25',
        '  [2] ref=31 within=(document root) text="+" rect=(120,80) 27x25',
        'Pick one by ref — { "step": "click", "ref": N } — or narrow with `within`. Two candidates sharing a `within` can only be told apart by ref; run `look` for the current key.',
      ].join('\n');

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'StepAmbiguousError',
        message: expectedMessage,
      });
    });

    it('VALID: {two candidates} => the structured candidates array carries every row, so a session parsing the JSON gets what the message got', () => {
      const error = new StepAmbiguousError({
        target: '[data-testid="PIXEL_BTN"]',
        within: '[data-testid="MAP_FRAME"]',
        candidates: [
          {
            index: 0,
            ref: 22,
            within: '[data-testid="MAP_FRAME"]',
            text: 'BROWSE',
            rect: '(742,433) 66x27',
          },
          {
            index: 1,
            ref: 26,
            within: '[data-testid="MAP_FRAME"]',
            text: 'CREATE',
            rect: '(607,472) 66x27',
          },
        ],
      });

      expect(error.candidates).toStrictEqual([
        {
          index: 0,
          ref: 22,
          within: '[data-testid="MAP_FRAME"]',
          text: 'BROWSE',
          rect: '(742,433) 66x27',
        },
        {
          index: 1,
          ref: 26,
          within: '[data-testid="MAP_FRAME"]',
          text: 'CREATE',
          rect: '(607,472) 66x27',
        },
      ]);
    });

    it('VALID: {two candidates sharing a within} => the message names the ref as the way out, because narrowing by within cannot separate them', () => {
      const error = new StepAmbiguousError({
        target: '[data-testid="PIXEL_BTN"]',
        within: '[data-testid="MAP_FRAME"]',
        candidates: [
          {
            index: 0,
            ref: 22,
            within: '[data-testid="MAP_FRAME"]',
            text: 'BROWSE',
            rect: '(742,433) 66x27',
          },
          {
            index: 1,
            ref: 26,
            within: '[data-testid="MAP_FRAME"]',
            text: 'CREATE',
            rect: '(607,472) 66x27',
          },
        ],
      });

      const expectedMessage = [
        'AMBIGUOUS: 2 elements match target [data-testid="PIXEL_BTN"] within=[data-testid="MAP_FRAME"].',
        '  [0] ref=22 within=[data-testid="MAP_FRAME"] text="BROWSE" rect=(742,433) 66x27',
        '  [1] ref=26 within=[data-testid="MAP_FRAME"] text="CREATE" rect=(607,472) 66x27',
        'Pick one by ref — { "step": "click", "ref": N } — or narrow with `within`. Two candidates sharing a `within` can only be told apart by ref; run `look` for the current key.',
      ].join('\n');

      expect(error.message).toBe(expectedMessage);
    });

    it('EDGE: {a candidate with no ref} => the row renders its within alone rather than an empty ref column', () => {
      const error = new StepAmbiguousError({
        target: '[data-testid="GUILD_ADD"]',
        within: null,
        candidates: [
          { index: 0, ref: null, within: 'GUILD_LIST', text: 'Add', rect: '(10,20) 40x20' },
        ],
      });

      const expectedMessage = [
        'AMBIGUOUS: 1 elements match target [data-testid="GUILD_ADD"].',
        '  [0] within=GUILD_LIST text="Add" rect=(10,20) 40x20',
        'Pick one by ref — { "step": "click", "ref": N } — or narrow with `within`. Two candidates sharing a `within` can only be told apart by ref; run `look` for the current key.',
      ].join('\n');

      expect(error.message).toBe(expectedMessage);
    });

    it('VALID: {target and within} => the carried target and within are the ones the step asked for', () => {
      const error = new StepAmbiguousError({
        target: '[data-testid="PIXEL_BTN"]',
        within: '[data-testid="MAP_FRAME"]',
        candidates: [],
      });

      expect({ target: error.target, within: error.within }).toStrictEqual({
        target: '[data-testid="PIXEL_BTN"]',
        within: '[data-testid="MAP_FRAME"]',
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof StepAmbiguousError => returns true', () => {
      const error = new StepAmbiguousError({
        target: '[data-testid="PIXEL_BTN"]',
        within: null,
        candidates: [
          { index: 0, ref: 16, within: 'GUILD_LIST', text: '+', rect: '(444,348) 27x25' },
          { index: 1, ref: 23, within: 'GUILD_SESSION_LIST', text: '+', rect: '(965,348) 27x25' },
        ],
      });

      expect(error instanceof StepAmbiguousError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new StepAmbiguousError({
        target: '[data-testid="PIXEL_BTN"]',
        within: null,
        candidates: [
          { index: 0, ref: 16, within: 'GUILD_LIST', text: '+', rect: '(444,348) 27x25' },
          { index: 1, ref: 23, within: 'GUILD_SESSION_LIST', text: '+', rect: '(965,348) 27x25' },
        ],
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
