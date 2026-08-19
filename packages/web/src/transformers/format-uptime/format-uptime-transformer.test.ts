import { formatUptimeTransformer } from './format-uptime-transformer';

describe('formatUptimeTransformer', () => {
  it.each([
    [0, '0s'],
    [45, '45s'],
    [745, '12m'],
    [3745, '1h2m'],
  ])('VALID: {seconds: %s} => returns "%s"', (seconds, expected) => {
    expect(formatUptimeTransformer({ seconds })).toBe(expected);
  });

  it.each([
    [60, '1m'],
    [3600, '1h0m'],
  ])(
    'EDGE: {seconds: %s} => returns "%s", not the shorter unit one step down',
    (seconds, expected) => {
      expect(formatUptimeTransformer({ seconds })).toBe(expected);
    },
  );

  it('EDGE: {seconds: 90061} => returns "25h1m", the hours branch does not roll over into days', () => {
    expect(formatUptimeTransformer({ seconds: 90_061 })).toBe('25h1m');
  });
});
