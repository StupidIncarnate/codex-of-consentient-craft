import { eslintRawMessageContract } from './eslint-raw-message-contract';
import { EslintRawMessageStub } from './eslint-raw-message.stub';

describe('eslintRawMessageContract', () => {
  describe('valid messages', () => {
    it('VALID: {line:1, column:0, message, severity:2} => parses successfully', () => {
      const msg = EslintRawMessageStub({ line: 1, column: 0, message: 'no-console', severity: 2 });

      const result = eslintRawMessageContract.parse(msg);

      expect(result).toStrictEqual({
        line: 1,
        column: 0,
        message: 'no-console',
        severity: 2,
      });
    });

    it('VALID: {with ruleId} => parses with ruleId', () => {
      const msg = EslintRawMessageStub({ ruleId: 'no-console' });

      const result = eslintRawMessageContract.parse(msg);

      expect(result).toStrictEqual({
        line: 1,
        column: 0,
        message: 'lint error',
        severity: 2,
        ruleId: 'no-console',
      });
    });

    it('VALID: {ruleId: null} => parses with null ruleId', () => {
      const msg = EslintRawMessageStub({ ruleId: null });

      const result = eslintRawMessageContract.parse(msg);

      expect(result).toStrictEqual({
        line: 1,
        column: 0,
        message: 'lint error',
        severity: 2,
        ruleId: null,
      });
    });
  });

  describe('invalid messages', () => {
    it('INVALID: {line: string} => throws validation error', () => {
      expect(() => {
        return eslintRawMessageContract.parse({
          line: 'not-a-number',
          column: 0,
          message: 'lint error',
          severity: 2,
        });
      }).toThrow(/Expected number/u);
    });

    it('INVALID: {missing message} => throws validation error', () => {
      expect(() => {
        return eslintRawMessageContract.parse({
          line: 1,
          column: 0,
          severity: 2,
        });
      }).toThrow(/Required/u);
    });
  });
});
