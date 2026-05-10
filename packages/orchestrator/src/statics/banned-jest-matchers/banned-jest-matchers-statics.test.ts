import { bannedJestMatchersStatics } from './banned-jest-matchers-statics';

describe('bannedJestMatchersStatics', () => {
  it('VALID: exported value => matches the canonical banned-matcher list', () => {
    expect(bannedJestMatchersStatics).toStrictEqual([
      '.toContain(',
      '.toMatchObject(',
      '.toEqual(',
      '.toHaveProperty(',
      '.includes(',
      'expect.any(',
      'expect.objectContaining(',
    ]);
  });
});
