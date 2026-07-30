import { apiOverloadRetryStatics } from '../../statics/api-overload-retry/api-overload-retry-statics';
import { apiOverloadRetryDelayTransformer } from './api-overload-retry-delay-transformer';

const FAST_ATTEMPTS = Array.from(
  { length: apiOverloadRetryStatics.fastAttempts },
  (_, index) => index + 1,
);

const SLOW_ATTEMPTS = Array.from(
  { length: apiOverloadRetryStatics.slowAttempts },
  (_, index) => apiOverloadRetryStatics.fastAttempts + index + 1,
);

describe('apiOverloadRetryDelayTransformer', () => {
  describe('fast tier', () => {
    it.each(FAST_ATTEMPTS)('VALID: {attempt: %s} => returns the one-minute delay', (attempt) => {
      expect(apiOverloadRetryDelayTransformer({ attempt })).toBe(
        apiOverloadRetryStatics.fastDelayMs,
      );
    });
  });

  describe('slow tier', () => {
    it.each(SLOW_ATTEMPTS)('VALID: {attempt: %s} => returns the five-minute delay', (attempt) => {
      expect(apiOverloadRetryDelayTransformer({ attempt })).toBe(
        apiOverloadRetryStatics.slowDelayMs,
      );
    });
  });

  describe('tier boundaries', () => {
    it('EDGE: {attempt: 10} => last fast attempt still returns the one-minute delay', () => {
      expect(apiOverloadRetryDelayTransformer({ attempt: 10 })).toBe(60_000);
    });

    it('EDGE: {attempt: 11} => first slow attempt returns the five-minute delay', () => {
      expect(apiOverloadRetryDelayTransformer({ attempt: 11 })).toBe(300_000);
    });

    it('EDGE: {attempt: 30} => last scheduled attempt returns the five-minute delay', () => {
      expect(apiOverloadRetryDelayTransformer({ attempt: 30 })).toBe(300_000);
    });

    it('EDGE: {attempt: 31} => schedule exhausted, returns null', () => {
      expect(apiOverloadRetryDelayTransformer({ attempt: 31 })).toBe(null);
    });

    it('EDGE: {attempt: 999} => far past the schedule, returns null', () => {
      expect(apiOverloadRetryDelayTransformer({ attempt: 999 })).toBe(null);
    });
  });

  describe('invalid attempt numbers', () => {
    it('EDGE: {attempt: 0} => returns null (attempts are 1-based)', () => {
      expect(apiOverloadRetryDelayTransformer({ attempt: 0 })).toBe(null);
    });

    it('EDGE: {attempt: -1} => returns null', () => {
      expect(apiOverloadRetryDelayTransformer({ attempt: -1 })).toBe(null);
    });
  });
});
