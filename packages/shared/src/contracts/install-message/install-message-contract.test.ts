import { installMessageContract } from './install-message-contract';
import { InstallMessageStub as _InstallMessageStub } from './install-message.stub';

describe('installMessageContract', () => {
  describe('valid messages', () => {
    it('VALID: {message: "Package installed successfully"} => parses successfully', () => {
      const result = installMessageContract.parse('Package installed successfully');

      expect(result).toBe('Package installed successfully');
    });

    it('VALID: {message: "Skipped - already exists"} => parses successfully', () => {
      const result = installMessageContract.parse('Skipped - already exists');

      expect(result).toBe('Skipped - already exists');
    });

    it('VALID: {message: "Error: file not found"} => parses successfully', () => {
      const result = installMessageContract.parse('Error: file not found');

      expect(result).toBe('Error: file not found');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {message: ""} => throws ZodError', () => {
      expect(() => {
        return installMessageContract.parse('');
      }).toThrow('expected string to have >=1 characters');
    });

    it('INVALID: {message: 123} => throws ZodError', () => {
      expect(() => {
        return installMessageContract.parse(123);
      }).toThrow('expected string');
    });

    it('INVALID: {message: null} => throws ZodError', () => {
      expect(() => {
        return installMessageContract.parse(null);
      }).toThrow('expected string');
    });

    it('INVALID: {message: undefined} => throws ZodError', () => {
      expect(() => {
        return installMessageContract.parse(undefined);
      }).toThrow('received undefined');
    });
  });
});
