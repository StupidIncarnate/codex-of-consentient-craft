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
});
