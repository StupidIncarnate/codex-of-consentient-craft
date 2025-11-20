import { mockSpawnResultContract } from './mock-spawn-result-contract';
import { MockSpawnResultStub } from './mock-spawn-result.stub';

describe('mockSpawnResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {code: 0, stdout: "", stderr: ""} => parses successfully', () => {
      const result = MockSpawnResultStub({
        code: 0,
        stdout: '',
        stderr: '',
      });

      const parsed = mockSpawnResultContract.parse(result);

      expect(parsed).toStrictEqual({
        code: 0,
        stdout: '',
        stderr: '',
      });
    });

    it('VALID: {code: 1, stdout: "output", stderr: "error"} => parses with all fields', () => {
      const result = MockSpawnResultStub({
        code: 1,
        stdout: 'output',
        stderr: 'error',
      });

      const parsed = mockSpawnResultContract.parse(result);

      expect(parsed).toStrictEqual({
        code: 1,
        stdout: 'output',
        stderr: 'error',
      });
    });

    it('VALID: {code: 2, stdout: "ESLint output", stderr: ""} => parses with stdout only', () => {
      const result = MockSpawnResultStub({
        code: 2,
        stdout: 'ESLint output',
      });

      const parsed = mockSpawnResultContract.parse(result);

      expect(parsed).toStrictEqual({
        code: 2,
        stdout: 'ESLint output',
        stderr: '',
      });
    });

    it('VALID: {code: 0, stdout: "", stderr: "warning"} => parses with stderr only', () => {
      const result = MockSpawnResultStub({
        stderr: 'warning',
      });

      const parsed = mockSpawnResultContract.parse(result);

      expect(parsed).toStrictEqual({
        code: 0,
        stdout: '',
        stderr: 'warning',
      });
    });

    it('EDGE: {code: -1} => parses negative exit code', () => {
      const result = MockSpawnResultStub({
        code: -1,
      });

      const parsed = mockSpawnResultContract.parse(result);

      expect(parsed).toStrictEqual({
        code: -1,
        stdout: '',
        stderr: '',
      });
    });

    it('EDGE: {code: 255} => parses maximum exit code', () => {
      const result = MockSpawnResultStub({
        code: 255,
      });

      const parsed = mockSpawnResultContract.parse(result);

      expect(parsed).toStrictEqual({
        code: 255,
        stdout: '',
        stderr: '',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_CODE: {code: 1.5} => throws validation error for non-integer', () => {
      expect(() => {
        return mockSpawnResultContract.parse({
          code: 1.5,
          stdout: '',
          stderr: '',
        });
      }).toThrow(/Expected integer/u);
    });

    it('INVALID_CODE: {code: "0"} => throws validation error for string code', () => {
      expect(() => {
        return mockSpawnResultContract.parse({
          code: '0' as never,
          stdout: '',
          stderr: '',
        });
      }).toThrow(/Expected number/u);
    });

    it('INVALID_STDOUT: {stdout: 123} => throws validation error for non-string stdout', () => {
      expect(() => {
        return mockSpawnResultContract.parse({
          code: 0,
          stdout: 123 as never,
          stderr: '',
        });
      }).toThrow(/Expected string/u);
    });

    it('INVALID_STDERR: {stderr: null} => throws validation error for null stderr', () => {
      expect(() => {
        return mockSpawnResultContract.parse({
          code: 0,
          stdout: '',
          stderr: null as never,
        });
      }).toThrow(/Expected string/u);
    });

    it('INVALID_MULTIPLE: {missing code and stdout} => throws validation error', () => {
      expect(() => {
        return mockSpawnResultContract.parse({
          stderr: '',
        });
      }).toThrow(/Required/u);
    });

    it('INVALID_MULTIPLE: {empty object} => throws validation error for all fields', () => {
      expect(() => {
        return mockSpawnResultContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
