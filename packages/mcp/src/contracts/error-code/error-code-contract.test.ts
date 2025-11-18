import { errorCodeContract as _errorCodeContract } from './error-code-contract';
import { ErrorCodeStub } from './error-code.stub';

describe('errorCodeContract', () => {
  it('VALID: {value: -32603} => parses successfully', () => {
    const result = ErrorCodeStub({ value: -32603 });

    expect(result).toBe(-32603);
  });

  it('VALID: {value: -32600} => parses successfully', () => {
    const result = ErrorCodeStub({ value: -32600 });

    expect(result).toBe(-32600);
  });

  it('VALID: {value: 0} => parses successfully', () => {
    const result = ErrorCodeStub({ value: 0 });

    expect(result).toBe(0);
  });

  it('VALID: {value: 1} => parses successfully', () => {
    const result = ErrorCodeStub({ value: 1 });

    expect(result).toBe(1);
  });
});
