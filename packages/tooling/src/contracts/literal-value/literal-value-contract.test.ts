import { LiteralValueStub } from './literal-value.stub';

describe('literalValueContract', () => {
  it('VALID: {value: "test-string"} => parses successfully', () => {
    const result = LiteralValueStub({ value: 'test-string' });

    expect(result).toBe('test-string');
  });

  it('VALID: {value: "error"} => parses successfully', () => {
    const result = LiteralValueStub({ value: 'error' });

    expect(result).toBe('error');
  });

  it('VALID: {value: ""} => parses successfully', () => {
    const result = LiteralValueStub({ value: '' });

    expect(result).toBe('');
  });

  it('VALID: {value: "a"} => parses successfully', () => {
    const result = LiteralValueStub({ value: 'a' });

    expect(result).toBe('a');
  });

  it('VALID: {value: very long string} => parses successfully', () => {
    const longString = 'a'.repeat(10000);
    const result = LiteralValueStub({ value: longString });

    expect(result).toBe(longString);
  });

  it('VALID: {value: "string with spaces"} => parses successfully', () => {
    const result = LiteralValueStub({ value: 'string with spaces' });

    expect(result).toBe('string with spaces');
  });

  it('VALID: {value: "string\\nwith\\nnewlines"} => parses successfully', () => {
    const result = LiteralValueStub({ value: 'string\nwith\nnewlines' });

    expect(result).toBe('string\nwith\nnewlines');
  });

  it('VALID: {value: "string\\twith\\ttabs"} => parses successfully', () => {
    const result = LiteralValueStub({ value: 'string\twith\ttabs' });

    expect(result).toBe('string\twith\ttabs');
  });

  it('VALID: {value: "He said \\"hello\\""} => parses successfully', () => {
    const result = LiteralValueStub({ value: 'He said "hello"' });

    expect(result).toBe('He said "hello"');
  });

  it('VALID: {value: "path\\\\to\\\\file"} => parses successfully', () => {
    const result = LiteralValueStub({ value: 'path\\to\\file' });

    expect(result).toBe('path\\to\\file');
  });

  it('VALID: {value: "special!@#$%^&*()chars"} => parses successfully', () => {
    const result = LiteralValueStub({ value: 'special!@#$%^&*()chars' });

    expect(result).toBe('special!@#$%^&*()chars');
  });

  it('VALID: {value: "文字列"} => parses successfully', () => {
    const result = LiteralValueStub({ value: '文字列' });

    expect(result).toBe('文字列');
  });

  it('VALID: {value: "🔥💯🚀"} => parses successfully', () => {
    const result = LiteralValueStub({ value: '🔥💯🚀' });

    expect(result).toBe('🔥💯🚀');
  });
});
