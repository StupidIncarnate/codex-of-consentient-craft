import { isWhitespaceOnlyGuard } from './is-whitespace-only-guard';

describe('isWhitespaceOnlyGuard', () => {
  it('VALID: {candidate: "    "} => returns true', () => {
    expect(isWhitespaceOnlyGuard({ candidate: '    ' })).toBe(true);
  });

  it('EMPTY: {candidate: ""} => returns true', () => {
    expect(isWhitespaceOnlyGuard({ candidate: '' })).toBe(true);
  });

  it('EMPTY: {candidate: undefined} => returns false', () => {
    expect(isWhitespaceOnlyGuard({})).toBe(false);
  });

  it('INVALID: {candidate: \'  "paths": \'} => returns false', () => {
    expect(isWhitespaceOnlyGuard({ candidate: '  "paths": ' })).toBe(false);
  });

  it('INVALID: {candidate: "a"} => returns false', () => {
    expect(isWhitespaceOnlyGuard({ candidate: 'a' })).toBe(false);
  });
});
