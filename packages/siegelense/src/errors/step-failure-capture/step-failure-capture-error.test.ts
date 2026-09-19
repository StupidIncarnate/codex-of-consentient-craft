import { StepFailureCaptureError } from './step-failure-capture-error';

describe('StepFailureCaptureError', () => {
  describe('constructor()', () => {
    it('VALID: {underlyingError, captured: true, blank: false, blankColour: null, pixelChange: "4%"} => names the underlying error and carries the measured reading', () => {
      const underlyingError = new Error('AMBIGUOUS: 2 elements match [data-testid="X"]');

      const error = new StepFailureCaptureError({
        underlyingError,
        captured: true,
        blank: false,
        blankColour: null,
        pixelChange: '4%',
      });

      expect({
        name: error.name,
        message: error.message,
        underlyingError: error.underlyingError,
        captured: error.captured,
        blank: error.blank,
        blankColour: error.blankColour,
        pixelChange: error.pixelChange,
      }).toStrictEqual({
        name: 'StepFailureCaptureError',
        message: 'Error: AMBIGUOUS: 2 elements match [data-testid="X"]',
        underlyingError,
        captured: true,
        blank: false,
        blankColour: null,
        pixelChange: '4%',
      });
    });

    it('VALID: {underlyingError, captured: false, every reading null} => carries captured false and no reading when the capture itself failed', () => {
      const underlyingError = new Error('page.goto: Timeout 30000ms exceeded.');

      const error = new StepFailureCaptureError({
        underlyingError,
        captured: false,
        blank: null,
        blankColour: null,
        pixelChange: null,
      });

      expect({
        name: error.name,
        message: error.message,
        underlyingError: error.underlyingError,
        captured: error.captured,
        blank: error.blank,
        blankColour: error.blankColour,
        pixelChange: error.pixelChange,
      }).toStrictEqual({
        name: 'StepFailureCaptureError',
        message: 'Error: page.goto: Timeout 30000ms exceeded.',
        underlyingError,
        captured: false,
        blank: null,
        blankColour: null,
        pixelChange: null,
      });
    });

    it('VALID: {captured: true, blank: true, blankColour: "#0d0907"} => carries the blank verdict and its colour', () => {
      const error = new StepFailureCaptureError({
        underlyingError: new Error('boom'),
        captured: true,
        blank: true,
        blankColour: '#0d0907',
        pixelChange: null,
      });

      expect({
        blank: error.blank,
        blankColour: error.blankColour,
        pixelChange: error.pixelChange,
      }).toStrictEqual({
        blank: true,
        blankColour: '#0d0907',
        pixelChange: null,
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof StepFailureCaptureError => returns true', () => {
      const error = new StepFailureCaptureError({
        underlyingError: new Error('boom'),
        captured: true,
        blank: null,
        blankColour: null,
        pixelChange: null,
      });

      expect(error instanceof StepFailureCaptureError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new StepFailureCaptureError({
        underlyingError: new Error('boom'),
        captured: true,
        blank: null,
        blankColour: null,
        pixelChange: null,
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
