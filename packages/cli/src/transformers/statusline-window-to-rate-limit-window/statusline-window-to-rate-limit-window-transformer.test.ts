import { statuslineWindowToRateLimitWindowTransformer } from './statusline-window-to-rate-limit-window-transformer';

describe('statuslineWindowToRateLimitWindowTransformer', () => {
  it('VALID: {used_percentage, resets_at} => returns RateLimitWindow', () => {
    const result = statuslineWindowToRateLimitWindowTransformer({
      raw: { used_percentage: 42, resets_at: '2026-05-05T15:00:00.000Z' },
    });

    expect(result).toStrictEqual({
      usedPercentage: 42,
      resetsAt: '2026-05-05T15:00:00.000Z',
    });
  });

  it('EMPTY: {} => returns null', () => {
    expect(statuslineWindowToRateLimitWindowTransformer({ raw: {} })).toBe(null);
  });

  it('EMPTY: {used_percentage only} => returns null', () => {
    expect(statuslineWindowToRateLimitWindowTransformer({ raw: { used_percentage: 42 } })).toBe(
      null,
    );
  });

  it('EMPTY: {resets_at only} => returns null', () => {
    expect(
      statuslineWindowToRateLimitWindowTransformer({
        raw: { resets_at: '2026-05-05T15:00:00.000Z' },
      }),
    ).toBe(null);
  });
});
