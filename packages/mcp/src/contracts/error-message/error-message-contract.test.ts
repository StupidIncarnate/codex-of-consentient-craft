import { errorMessageContract as _errorMessageContract } from './error-message-contract';
import { ErrorMessageStub } from './error-message.stub';

describe('errorMessageContract', () => {
  it('VALID: {value: "Unknown tool: test"} => parses successfully', () => {
    const result = ErrorMessageStub({ value: 'Unknown tool: test' });

    expect(result).toBe('Unknown tool: test');
  });

  it('VALID: {value: "Request timeout"} => parses successfully', () => {
    const result = ErrorMessageStub({ value: 'Request timeout' });

    expect(result).toBe('Request timeout');
  });

  it('VALID: {value: ""} => parses successfully', () => {
    const result = ErrorMessageStub({ value: '' });

    expect(result).toBe('');
  });
});
