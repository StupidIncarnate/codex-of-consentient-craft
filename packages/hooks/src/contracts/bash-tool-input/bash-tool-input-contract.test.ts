import { bashToolInputContract } from './bash-tool-input-contract';
import { BashToolInputStub } from './bash-tool-input.stub';

describe('bashToolInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {default stub} => parses successfully', () => {
      const input = BashToolInputStub();

      const result = bashToolInputContract.parse(input);

      expect(result).toStrictEqual({
        command: 'echo hello',
      });
    });

    it('VALID: {custom command} => parses successfully', () => {
      const input = BashToolInputStub({ command: 'npm run test' });

      const result = bashToolInputContract.parse(input);

      expect(result).toStrictEqual({
        command: 'npm run test',
      });
    });

    it('VALID: {command with spaces and flags} => parses successfully', () => {
      const result = bashToolInputContract.parse({
        command: 'npx jest --verbose --coverage',
      });

      expect(result).toStrictEqual({
        command: 'npx jest --verbose --coverage',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_COMMAND: {missing command} => throws validation error', () => {
      expect(() => {
        return bashToolInputContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID_COMMAND: {empty command} => throws validation error', () => {
      expect(() => {
        return bashToolInputContract.parse({ command: '' });
      }).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID_COMMAND: {command is number} => throws validation error', () => {
      expect(() => {
        return bashToolInputContract.parse({ command: 123 as never });
      }).toThrow(/Expected string/u);
    });

    it('INVALID_MULTIPLE: {missing all fields} => throws validation error', () => {
      expect(() => {
        return bashToolInputContract.parse({} as never);
      }).toThrow(/Required/u);
    });
  });
});
