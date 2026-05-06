import { formatResetDurationTransformer } from './format-reset-duration-transformer';

describe('formatResetDurationTransformer', () => {
  it('EDGE: {seconds: 0} => returns "0m"', () => {
    expect(formatResetDurationTransformer({ seconds: 0 })).toBe('0m');
  });

  it('EDGE: {seconds: -10} => returns "0m" for already-elapsed times', () => {
    expect(formatResetDurationTransformer({ seconds: -10 })).toBe('0m');
  });

  it('VALID: {seconds: 900} => returns "15m"', () => {
    expect(formatResetDurationTransformer({ seconds: 900 })).toBe('15m');
  });

  it('VALID: {seconds: 7500} => returns "2h5m"', () => {
    expect(formatResetDurationTransformer({ seconds: 7500 })).toBe('2h5m');
  });

  it('VALID: {seconds: 3600} => returns "1h0m"', () => {
    expect(formatResetDurationTransformer({ seconds: 3600 })).toBe('1h0m');
  });

  it('VALID: {seconds: 4d11h} => returns "4d11h"', () => {
    const FOUR_DAYS_ELEVEN_HOURS = 4 * 86_400 + 11 * 3600;

    expect(formatResetDurationTransformer({ seconds: FOUR_DAYS_ELEVEN_HOURS })).toBe('4d11h');
  });

  it('VALID: {seconds: 86400} => returns "1d0h"', () => {
    expect(formatResetDurationTransformer({ seconds: 86_400 })).toBe('1d0h');
  });
});
