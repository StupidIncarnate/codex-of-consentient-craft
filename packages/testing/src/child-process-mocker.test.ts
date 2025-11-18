/**
 * Tests for ChildProcessMocker
 */

import { ChildProcessMocker } from './child-process-mocker';

describe('ChildProcessMocker', () => {
  describe('mockSpawn()', () => {
    describe('valid input', () => {
      it('VALID: {behavior: success preset} => returns restore function', () => {
        const behavior = ChildProcessMocker.presets.success('test output');
        const mock = ChildProcessMocker.mockSpawn(behavior);

        mock.restore();

        expect(mock).toStrictEqual({
          restore: expect.any(Function),
        });
      });
    });
  });

  describe('presets', () => {
    describe('success()', () => {
      it('VALID: {stdout: "test", code: 0} => returns success behavior', () => {
        const result = ChildProcessMocker.presets.success('test output', 0);

        expect(result).toStrictEqual({
          result: {
            code: 0,
            stdout: 'test output',
            stderr: '',
          },
        });
      });

      it('VALID: {stdout: "", code: 0} => returns success behavior with defaults', () => {
        const result = ChildProcessMocker.presets.success();

        expect(result).toStrictEqual({
          result: {
            code: 0,
            stdout: '',
            stderr: '',
          },
        });
      });
    });

    describe('failure()', () => {
      it('VALID: {stderr: "error", code: 1} => returns failure behavior', () => {
        const result = ChildProcessMocker.presets.failure('error message', 1);

        expect(result).toStrictEqual({
          result: {
            code: 1,
            stdout: '',
            stderr: 'error message',
          },
        });
      });

      it('VALID: {} => returns failure behavior with defaults', () => {
        const result = ChildProcessMocker.presets.failure();

        expect(result).toStrictEqual({
          result: {
            code: 1,
            stdout: '',
            stderr: 'Process failed',
          },
        });
      });
    });

    describe('crash()', () => {
      it('VALID: {error: custom error} => returns crash behavior', () => {
        const error = new Error('spawn ENOENT');
        const result = ChildProcessMocker.presets.crash(error);

        expect(result).toStrictEqual({
          shouldThrow: true,
          throwError: error,
        });
      });

      it('VALID: {} => returns crash behavior with default error', () => {
        const result = ChildProcessMocker.presets.crash();

        expect(result).toStrictEqual({
          shouldThrow: true,
          throwError: expect.any(Error),
        });
        expect(result.throwError?.message).toBe('spawn ENOENT');
      });
    });

    describe('eslintCrash()', () => {
      it('VALID: {} => returns ESLint crash behavior', () => {
        const result = ChildProcessMocker.presets.eslintCrash();

        expect(result).toStrictEqual({
          result: {
            code: 2,
            stdout: '',
            stderr: 'Oops! Something went wrong!',
          },
        });
      });
    });

    describe('timeout()', () => {
      it('VALID: {delay: 5000} => returns timeout behavior', () => {
        const delay = 5000;
        const result = ChildProcessMocker.presets.timeout(delay);

        expect(result).toStrictEqual({
          delay: 5000,
          result: {
            code: 1,
            stdout: '',
            stderr: 'Timeout',
          },
        });
      });

      it('VALID: {} => returns timeout behavior with default delay', () => {
        const result = ChildProcessMocker.presets.timeout();

        expect(result).toStrictEqual({
          delay: 31000,
          result: {
            code: 1,
            stdout: '',
            stderr: 'Timeout',
          },
        });
      });
    });
  });
});
