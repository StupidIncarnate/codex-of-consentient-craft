import { regexEscapeTransformer } from './regex-escape-transformer';

describe('regexEscapeTransformer', () => {
  it("VALID: {str: 'hello'} => returns 'hello'", () => {
    expect(regexEscapeTransformer({ str: 'hello' })).toBe('hello');
  });

  it("VALID: {str: 'hello.world'} => returns 'hello\\.world'", () => {
    expect(regexEscapeTransformer({ str: 'hello.world' })).toBe('hello\\.world');
  });

  it("VALID: {str: '[test]*+?^${}()|\\\\test'} => returns escaped string", () => {
    expect(regexEscapeTransformer({ str: '[test]*+?^${}()|\\test' })).toBe(
      '\\[test\\]\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\\\test',
    );
  });

  it("EMPTY: {str: ''} => returns ''", () => {
    expect(regexEscapeTransformer({ str: '' })).toBe('');
  });
});
