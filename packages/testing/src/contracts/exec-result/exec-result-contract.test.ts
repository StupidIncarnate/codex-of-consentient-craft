import { execResultContract } from './exec-result-contract';
import { ExecResultStub } from './exec-result.stub';

describe('execResultContract', () => {
  describe('valid exec results', () => {
    it('VALID: {stdout, stderr, exitCode: 0} => parses successfully', () => {
      const result = ExecResultStub({
        stdout: 'Command output',
        stderr: '',
        exitCode: 0,
      });

      const parsed = execResultContract.parse(result);

      expect(parsed).toStrictEqual({
        stdout: 'Command output',
        stderr: '',
        exitCode: 0,
      });
    });

    it('VALID: {exitCode: 1} => parses error exit code', () => {
      const result = ExecResultStub({
        stdout: '',
        stderr: 'Error message',
        exitCode: 1,
      });

      const parsed = execResultContract.parse(result);

      expect(parsed).toStrictEqual({
        stdout: '',
        stderr: 'Error message',
        exitCode: 1,
      });
    });

    it('VALID: {empty strings} => parses empty output', () => {
      const result = ExecResultStub({
        stdout: '',
        stderr: '',
        exitCode: 0,
      });

      const parsed = execResultContract.parse(result);

      expect(parsed).toStrictEqual({
        stdout: '',
        stderr: '',
        exitCode: 0,
      });
    });
  });

  describe('invalid exec results', () => {
    it('INVALID_EXIT_CODE: {exitCode: 1.5} => throws validation error', () => {
      expect(() => {
        return execResultContract.parse({
          stdout: '',
          stderr: '',
          exitCode: 1.5,
        });
      }).toThrow(/Expected integer/u);
    });

    it('INVALID_STDOUT: {stdout: number} => throws validation error', () => {
      expect(() => {
        return execResultContract.parse({
          stdout: 123 as never,
          stderr: '',
          exitCode: 0,
        });
      }).toThrow(/Expected string/u);
    });

    it('INVALID_MULTIPLE: {missing all fields} => throws validation error', () => {
      expect(() => {
        return execResultContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
