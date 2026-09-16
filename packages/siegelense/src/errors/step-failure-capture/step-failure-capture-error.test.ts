import { StepFailureCaptureError } from './step-failure-capture-error';

describe('StepFailureCaptureError', () => {
  describe('constructor()', () => {
    it('VALID: {underlyingError, captured: true} => names the underlying error and carries captured true', () => {
      const underlyingError = new Error('AMBIGUOUS: 2 elements match [data-testid="X"]');

      const error = new StepFailureCaptureError({ underlyingError, captured: true });

      expect({
        name: error.name,
        message: error.message,
        underlyingError: error.underlyingError,
        captured: error.captured,
      }).toStrictEqual({
        name: 'StepFailureCaptureError',
        message: 'Error: AMBIGUOUS: 2 elements match [data-testid="X"]',
        underlyingError,
        captured: true,
      });
    });

    it('VALID: {underlyingError, captured: false} => carries captured false when the capture itself failed', () => {
      const underlyingError = new Error('page.goto: Timeout 30000ms exceeded.');

      const error = new StepFailureCaptureError({ underlyingError, captured: false });

      expect({
        name: error.name,
        message: error.message,
        underlyingError: error.underlyingError,
        captured: error.captured,
      }).toStrictEqual({
        name: 'StepFailureCaptureError',
        message: 'Error: page.goto: Timeout 30000ms exceeded.',
        underlyingError,
        captured: false,
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof StepFailureCaptureError => returns true', () => {
      const error = new StepFailureCaptureError({
        underlyingError: new Error('boom'),
        captured: true,
      });

      expect(error instanceof StepFailureCaptureError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new StepFailureCaptureError({
        underlyingError: new Error('boom'),
        captured: true,
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
