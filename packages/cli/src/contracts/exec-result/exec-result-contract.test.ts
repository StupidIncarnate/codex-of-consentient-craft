import { execResultContract } from './exec-result-contract';
import type { ExecResultStub } from './exec-result.stub';

type ExecResult = ReturnType<typeof ExecResultStub>;

describe('execResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {success with empty output} => returns ExecResult', () => {
      const result: ExecResult = execResultContract.parse({
        stdout: '',
        stderr: '',
        exitCode: 0,
      });

      expect(result).toStrictEqual({
        stdout: '',
        stderr: '',
        exitCode: 0,
      });
    });

    it('VALID: {success with stdout} => returns ExecResult', () => {
      const result: ExecResult = execResultContract.parse({
        stdout: 'Hello World',
        stderr: '',
        exitCode: 0,
      });

      expect(result).toStrictEqual({
        stdout: 'Hello World',
        stderr: '',
        exitCode: 0,
      });
    });

    it('VALID: {failure with stderr} => returns ExecResult', () => {
      const result: ExecResult = execResultContract.parse({
        stdout: '',
        stderr: 'Error occurred',
        exitCode: 1,
      });

      expect(result).toStrictEqual({
        stdout: '',
        stderr: 'Error occurred',
        exitCode: 1,
      });
    });

    it('VALID: {both stdout and stderr} => returns ExecResult', () => {
      const result: ExecResult = execResultContract.parse({
        stdout: 'Some output',
        stderr: 'Some warning',
        exitCode: 0,
      });

      expect(result).toStrictEqual({
        stdout: 'Some output',
        stderr: 'Some warning',
        exitCode: 0,
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {missing stdout} => throws validation error', () => {
      expect(() =>
        execResultContract.parse({
          stderr: '',
          exitCode: 0,
        }),
      ).toThrow(/stdout/iu);
    });

    it('INVALID: {missing stderr} => throws validation error', () => {
      expect(() =>
        execResultContract.parse({
          stdout: '',
          exitCode: 0,
        }),
      ).toThrow(/stderr/iu);
    });

    it('INVALID: {missing exitCode} => throws validation error', () => {
      expect(() =>
        execResultContract.parse({
          stdout: '',
          stderr: '',
        }),
      ).toThrow(/exitCode/iu);
    });

    it('INVALID: {invalid exitCode type} => throws validation error', () => {
      expect(() =>
        execResultContract.parse({
          stdout: '',
          stderr: '',
          exitCode: 'zero',
        }),
      ).toThrow(/number/iu);
    });
  });
});

describe('ExecResultStub', () => {
  it('VALID: {default} => returns ExecResult with default values', () => {
    const { ExecResultStub: Stub } = require('./exec-result.stub');
    const result = Stub();

    expect(result).toStrictEqual({
      stdout: '',
      stderr: '',
      exitCode: 0,
    });
  });

  it('VALID: {custom stdout} => returns ExecResult with custom stdout', () => {
    const { ExecResultStub: Stub } = require('./exec-result.stub');
    const result = Stub({ stdout: 'custom output' });

    expect(result).toStrictEqual({
      stdout: 'custom output',
      stderr: '',
      exitCode: 0,
    });
  });

  it('VALID: {custom exitCode} => returns ExecResult with custom exitCode', () => {
    const { ExecResultStub: Stub } = require('./exec-result.stub');
    const result = Stub({ exitCode: 1 });

    expect(result).toStrictEqual({
      stdout: '',
      stderr: '',
      exitCode: 1,
    });
  });
});
