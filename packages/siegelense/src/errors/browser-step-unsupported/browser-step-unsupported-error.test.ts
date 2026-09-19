import { BrowserStepUnsupportedError } from './browser-step-unsupported-error';

describe('BrowserStepUnsupportedError', () => {
  describe('constructor()', () => {
    it('VALID: {verb: "click", specName: "dungeonmaster-api"} => names both the step and the browserless spec', () => {
      const error = new BrowserStepUnsupportedError({
        verb: 'click',
        specName: 'dungeonmaster-api',
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'BrowserStepUnsupportedError',
        message: 'Step click needs a browser, but spec dungeonmaster-api declares browser: false',
      });
    });

    it('EDGE: {verb: "screenshot"} => a capture verb is refused the same way as any other browser verb', () => {
      const error = new BrowserStepUnsupportedError({
        verb: 'screenshot',
        specName: 'dungeonmaster-api',
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'BrowserStepUnsupportedError',
        message:
          'Step screenshot needs a browser, but spec dungeonmaster-api declares browser: false',
      });
    });
  });

  describe('the form parameter, used only by until', () => {
    it('VALID: {verb: "until", form: "visible"} => names the spec, the form written, and the file form that works there', () => {
      const error = new BrowserStepUnsupportedError({
        verb: 'until',
        specName: 'dungeonmaster-api',
        form: 'visible',
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'BrowserStepUnsupportedError',
        message:
          'Step until { visible } needs a browser, but spec dungeonmaster-api declares browser: false — until { file } is the form that runs on a lane with no screen',
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof BrowserStepUnsupportedError => returns true', () => {
      const error = new BrowserStepUnsupportedError({
        verb: 'click',
        specName: 'dungeonmaster-api',
      });

      expect(error instanceof BrowserStepUnsupportedError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new BrowserStepUnsupportedError({
        verb: 'click',
        specName: 'dungeonmaster-api',
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
