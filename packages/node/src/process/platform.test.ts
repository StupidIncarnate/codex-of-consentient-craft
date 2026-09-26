import { platform } from './platform';

describe('platform', () => {
  it('VALID: {} => is the same value process.platform holds', () => {
    expect(platform).toBe(process.platform);
  });
});
