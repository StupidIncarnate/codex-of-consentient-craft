import { escapeRegex } from './escape-regex';

describe('escapeRegex', () => {
  it("VALID: {str: 'hello'} => returns 'hello'", () => {
    expect(escapeRegex({ str: 'hello' })).toBe('hello');
  });

  it("VALID: {str: 'hello.world'} => returns 'hello\\.world'", () => {
    expect(escapeRegex({ str: 'hello.world' })).toBe('hello\\.world');
  });

  it("VALID: {str: '[test]*+?^${}()|\\\\test'} => returns escaped string", () => {
    expect(escapeRegex({ str: '[test]*+?^${}()|\\test' })).toBe(
      '\\[test\\]\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\\\test',
    );
  });

  it("EMPTY: {str: ''} => returns ''", () => {
    expect(escapeRegex({ str: '' })).toBe('');
  });
});
