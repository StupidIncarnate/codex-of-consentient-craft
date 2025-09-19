import { fileUtilEscapeRegex } from './file-util-escape-regex';

describe('fileUtilEscapeRegex', () => {
  it("VALID: {str: 'hello'} => returns 'hello'", () => {
    expect(fileUtilEscapeRegex({ str: 'hello' })).toBe('hello');
  });

  it("VALID: {str: 'hello.world'} => returns 'hello\\.world'", () => {
    expect(fileUtilEscapeRegex({ str: 'hello.world' })).toBe('hello\\.world');
  });

  it("VALID: {str: '[test]*+?^${}()|\\\\test'} => returns escaped string", () => {
    expect(fileUtilEscapeRegex({ str: '[test]*+?^${}()|\\test' })).toBe(
      '\\[test\\]\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\\\test',
    );
  });

  it("EMPTY: {str: ''} => returns ''", () => {
    expect(fileUtilEscapeRegex({ str: '' })).toBe('');
  });
});
