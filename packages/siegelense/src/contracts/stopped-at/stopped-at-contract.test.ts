import { stoppedAtContract } from './stopped-at-contract';
import { StoppedAtStub } from './stopped-at.stub';

describe('stoppedAtContract', () => {
  describe('valid stops', () => {
    it('VALID: {an AMBIGUOUS stop} => carries two candidates', () => {
      const result = stoppedAtContract.parse({
        step: 4,
        verb: 'click',
        error: 'AMBIGUOUS: 2 elements match [data-testid="PIXEL_BTN"]',
        candidates: [
          { index: 0, within: '[data-testid="GUILD_LIST"]', text: '+', rect: '(444,348) 27x25' },
          {
            index: 1,
            within: '[data-testid="GUILD_SESSION_LIST"]',
            text: '+',
            rect: '(612,348) 27x25',
          },
        ],
      });

      expect(result).toStrictEqual({
        step: 4,
        verb: 'click',
        error: 'AMBIGUOUS: 2 elements match [data-testid="PIXEL_BTN"]',
        candidates: [
          { index: 0, within: '[data-testid="GUILD_LIST"]', text: '+', rect: '(444,348) 27x25' },
          {
            index: 1,
            within: '[data-testid="GUILD_SESSION_LIST"]',
            text: '+',
            rect: '(612,348) 27x25',
          },
        ],
      });
    });

    it('VALID: {a timeout stop} => the error names the step, the verb and the target', () => {
      const result = stoppedAtContract.parse({
        step: 9,
        verb: 'waitFor',
        error: 'waitFor [data-testid="X"] never resolved after 10000ms',
        candidates: [],
      });

      expect(result.error).toBe('waitFor [data-testid="X"] never resolved after 10000ms');
    });
  });

  describe('empty collections', () => {
    it('EMPTY: {candidates: []} => a stop with no candidate to offer still parses', () => {
      const result = stoppedAtContract.parse({
        step: 9,
        verb: 'waitFor',
        error: 'waitFor [data-testid="X"] never resolved after 10000ms',
        candidates: [],
      });

      expect(result.candidates).toStrictEqual([]);
    });
  });

  describe('invalid stops', () => {
    it('INVALID: {missing error} => throws validation error', () => {
      expect(() =>
        stoppedAtContract.parse({
          step: 4,
          verb: 'click',
          candidates: [],
        } as never),
      ).toThrow(/Required/u);
    });

    it('INVALID: {missing candidates} => throws validation error', () => {
      expect(() =>
        stoppedAtContract.parse({
          step: 4,
          verb: 'click',
          error: 'AMBIGUOUS: 2 elements match [data-testid="PIXEL_BTN"]',
        } as never),
      ).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates a stop with one candidate', () => {
      const result = StoppedAtStub();

      expect(result).toStrictEqual({
        step: 4,
        verb: 'click',
        error: 'AMBIGUOUS: 2 elements match [data-testid="PIXEL_BTN"]',
        candidates: [
          { index: 0, within: '[data-testid="GUILD_LIST"]', text: '+', rect: '(444,348) 27x25' },
        ],
      });
    });
  });
});
