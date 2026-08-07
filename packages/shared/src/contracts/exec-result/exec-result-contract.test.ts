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

    it('EMPTY: {empty strings} => parses empty output', () => {
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

    it('VALID: {stub defaults} => creates an empty successful result', () => {
      const result = ExecResultStub();

      expect(result).toStrictEqual({
        stdout: '',
        stderr: '',
        exitCode: 0,
      });
    });
  });

  describe('invalid exec results', () => {
    it('INVALID: {exitCode: 1.5} => throws validation error', () => {
      expect(() => {
        return execResultContract.parse({
          stdout: '',
          stderr: '',
          exitCode: 1.5,
        });
      }).toThrow(/Expected integer/u);
    });

    it('INVALID: {stdout: number} => throws validation error', () => {
      expect(() => {
        return execResultContract.parse({
          stdout: 123 as never,
          stderr: '',
          exitCode: 0,
        });
      }).toThrow(/Expected string/u);
    });

    it('INVALID: {missing stdout} => throws validation error', () => {
      expect(() => {
        return execResultContract.parse({
          stderr: '',
          exitCode: 0,
        });
      }).toThrow(/Required/u);
    });

    it('INVALID: {missing stderr} => throws validation error', () => {
      expect(() => {
        return execResultContract.parse({
          stdout: 'output',
          exitCode: 0,
        });
      }).toThrow(/Required/u);
    });

    it('INVALID: {missing exitCode} => throws validation error', () => {
      expect(() => {
        return execResultContract.parse({
          stdout: 'output',
          stderr: '',
        });
      }).toThrow(/Required/u);
    });

    it('EMPTY: {missing all fields} => throws validation error', () => {
      expect(() => {
        return execResultContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
