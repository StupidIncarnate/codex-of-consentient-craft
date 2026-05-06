import { rateLimitColorTransformer } from './rate-limit-color-transformer';

describe('rateLimitColorTransformer', () => {
  it('VALID: {usedPercentage: 0} => returns text-dim', () => {
    expect(rateLimitColorTransformer({ usedPercentage: 0 })).toBe('#8a7260');
  });

  it('VALID: {usedPercentage: 49} => returns text-dim (just below warning)', () => {
    expect(rateLimitColorTransformer({ usedPercentage: 49 })).toBe('#8a7260');
  });

  it('EDGE: {usedPercentage: 50} => returns warning at threshold', () => {
    expect(rateLimitColorTransformer({ usedPercentage: 50 })).toBe('#f59e0b');
  });

  it('VALID: {usedPercentage: 79} => returns warning (just below danger)', () => {
    expect(rateLimitColorTransformer({ usedPercentage: 79 })).toBe('#f59e0b');
  });

  it('EDGE: {usedPercentage: 80} => returns danger at threshold', () => {
    expect(rateLimitColorTransformer({ usedPercentage: 80 })).toBe('#ef4444');
  });

  it('VALID: {usedPercentage: 100} => returns danger', () => {
    expect(rateLimitColorTransformer({ usedPercentage: 100 })).toBe('#ef4444');
  });
});
