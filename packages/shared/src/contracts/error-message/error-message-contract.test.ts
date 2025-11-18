import { errorMessageContract as _errorMessageContract } from './error-message-contract';
import { ErrorMessageStub } from './error-message.stub';

describe('errorMessageContract', () => {
  it('VALID: {value: "An error occurred"} => parses successfully', () => {
    const result = ErrorMessageStub({ value: 'An error occurred' });

    expect(result).toBe('An error occurred');
  });

  it('VALID: {value: "Validation failed: name is required"} => parses successfully', () => {
    const result = ErrorMessageStub({
      value: 'Validation failed: name is required',
    });

    expect(result).toBe('Validation failed: name is required');
  });

  it('VALID: {value: "File not found at /path/to/file.ts"} => parses successfully', () => {
    const result = ErrorMessageStub({
      value: 'File not found at /path/to/file.ts',
    });

    expect(result).toBe('File not found at /path/to/file.ts');
  });

  it('VALID: {value: ""} => parses successfully', () => {
    const result = ErrorMessageStub({ value: '' });

    expect(result).toBe('');
  });

  it('VALID: {value: "Very long error message..."} => parses successfully', () => {
    const longMessage =
      'This is a very long error message that contains a lot of detail about what went wrong in the system. '.repeat(
        10,
      );
    const result = ErrorMessageStub({ value: longMessage });

    expect(result).toBe(longMessage);
  });

  it('VALID: {value: "Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?/"} => parses successfully', () => {
    const result = ErrorMessageStub({
      value: 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?/',
    });

    expect(result).toBe('Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?/');
  });

  it('VALID: {value: "Unicode: 你好 🚀 éàü"} => parses successfully', () => {
    const result = ErrorMessageStub({ value: 'Unicode: 你好 🚀 éàü' });

    expect(result).toBe('Unicode: 你好 🚀 éàü');
  });

  it('VALID: {value: "Multiline\\nerror\\nmessage"} => parses successfully', () => {
    const result = ErrorMessageStub({ value: 'Multiline\nerror\nmessage' });

    expect(result).toBe('Multiline\nerror\nmessage');
  });
});
