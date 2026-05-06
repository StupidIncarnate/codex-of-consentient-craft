import { rateLimitBarTransformer } from './rate-limit-bar-transformer';

describe('rateLimitBarTransformer', () => {
  it('EDGE: {usedPercentage: 0} => returns 8 empty blocks', () => {
    expect(rateLimitBarTransformer({ usedPercentage: 0 })).toBe('▱▱▱▱▱▱▱▱');
  });

  it('EDGE: {usedPercentage: 100} => returns 8 filled blocks', () => {
    expect(rateLimitBarTransformer({ usedPercentage: 100 })).toBe('▰▰▰▰▰▰▰▰');
  });

  it('VALID: {usedPercentage: 50} => returns 4 filled + 4 empty', () => {
    expect(rateLimitBarTransformer({ usedPercentage: 50 })).toBe('▰▰▰▰▱▱▱▱');
  });

  it('VALID: {usedPercentage: 25} => returns 2 filled + 6 empty', () => {
    expect(rateLimitBarTransformer({ usedPercentage: 25 })).toBe('▰▰▱▱▱▱▱▱');
  });

  it('EDGE: {usedPercentage: 200} => clamps to 8 filled', () => {
    expect(rateLimitBarTransformer({ usedPercentage: 200 })).toBe('▰▰▰▰▰▰▰▰');
  });

  it('EDGE: {usedPercentage: -10} => clamps to 0 filled', () => {
    expect(rateLimitBarTransformer({ usedPercentage: -10 })).toBe('▱▱▱▱▱▱▱▱');
  });
});
