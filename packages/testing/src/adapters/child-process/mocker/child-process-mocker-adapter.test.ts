import { childProcessMockerAdapter } from './child-process-mocker-adapter';
import { childProcessMockerAdapterProxy } from './child-process-mocker-adapter.proxy';
import type { MockProcessBehaviorStub } from '../../../contracts/mock-process-behavior/mock-process-behavior.stub';
import type { MockSpawnResultStub } from '../../../contracts/mock-spawn-result/mock-spawn-result.stub';

type MockProcessBehavior = ReturnType<typeof MockProcessBehaviorStub>;
type MockSpawnResult = ReturnType<typeof MockSpawnResultStub>;

describe('childProcessMockerAdapter', () => {
  describe('mockSpawn()', () => {
    describe('valid input', () => {
      it('VALID: {behavior: success preset} => returns restore function', () => {
        childProcessMockerAdapterProxy();

        const mocker = childProcessMockerAdapter();
        const behavior = mocker.presets.success({
          stdout: 'test output' as MockSpawnResult['stdout'],
        });
        const mock = mocker.mockSpawn({ behavior });

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
        childProcessMockerAdapterProxy();

        const mocker = childProcessMockerAdapter();
        const result = mocker.presets.success({
          stdout: 'test output' as MockSpawnResult['stdout'],
          code: 0 as MockSpawnResult['code'],
        });

        expect(result).toStrictEqual({
          result: {
            code: 0 as MockSpawnResult['code'],
            stdout: 'test output' as MockSpawnResult['stdout'],
            stderr: '' as MockSpawnResult['stderr'],
          },
        });
      });

      it('VALID: {} => returns success behavior with defaults', () => {
        childProcessMockerAdapterProxy();

        const mocker = childProcessMockerAdapter();
        const result = mocker.presets.success({});

        expect(result).toStrictEqual({
          result: {
            code: 0 as MockSpawnResult['code'],
            stdout: '' as MockSpawnResult['stdout'],
            stderr: '' as MockSpawnResult['stderr'],
          },
        });
      });
    });

    describe('failure()', () => {
      it('VALID: {stderr: "error", code: 1} => returns failure behavior', () => {
        childProcessMockerAdapterProxy();

        const mocker = childProcessMockerAdapter();
        const result = mocker.presets.failure({
          stderr: 'error message' as MockSpawnResult['stderr'],
          code: 1 as MockSpawnResult['code'],
        });

        expect(result).toStrictEqual({
          result: {
            code: 1 as MockSpawnResult['code'],
            stdout: '' as MockSpawnResult['stdout'],
            stderr: 'error message' as MockSpawnResult['stderr'],
          },
        });
      });

      it('VALID: {} => returns failure behavior with defaults', () => {
        childProcessMockerAdapterProxy();

        const mocker = childProcessMockerAdapter();
        const result = mocker.presets.failure({});

        expect(result).toStrictEqual({
          result: {
            code: 1 as MockSpawnResult['code'],
            stdout: '' as MockSpawnResult['stdout'],
            stderr: 'Process failed' as MockSpawnResult['stderr'],
          },
        });
      });
    });

    describe('crash()', () => {
      it('VALID: {error: custom error} => returns crash behavior', () => {
        childProcessMockerAdapterProxy();

        const mocker = childProcessMockerAdapter();
        const error = new Error('spawn ENOENT');
        const result = mocker.presets.crash({ error });

        expect(result).toStrictEqual({
          shouldThrow: true,
          throwError: error,
        });
      });

      it('VALID: {} => returns crash behavior with default error', () => {
        childProcessMockerAdapterProxy();

        const mocker = childProcessMockerAdapter();
        const result = mocker.presets.crash({});

        expect(result).toStrictEqual({
          shouldThrow: true,
          throwError: expect.any(Error),
        });
        expect(result.throwError?.message).toBe('spawn ENOENT');
      });
    });

    describe('eslintCrash()', () => {
      it('VALID: {} => returns ESLint crash behavior', () => {
        childProcessMockerAdapterProxy();

        const mocker = childProcessMockerAdapter();
        const result = mocker.presets.eslintCrash();

        expect(result).toStrictEqual({
          result: {
            code: 0 as MockSpawnResult['code'],
            stdout: '' as MockSpawnResult['stdout'],
            stderr: 'Oops! Something went wrong!' as MockSpawnResult['stderr'],
          },
        });
      });
    });

    describe('timeout()', () => {
      it('VALID: {delay: 5000} => returns timeout behavior', () => {
        childProcessMockerAdapterProxy();

        const mocker = childProcessMockerAdapter();
        const delay = 5000 as MockProcessBehavior['delay'];
        const result = mocker.presets.timeout({ delay });

        expect(result).toStrictEqual({
          delay: 5000 as MockProcessBehavior['delay'],
          result: {
            code: 1 as MockSpawnResult['code'],
            stdout: '' as MockSpawnResult['stdout'],
            stderr: 'Timeout' as MockSpawnResult['stderr'],
          },
        });
      });

      it('VALID: {} => returns timeout behavior with default delay', () => {
        childProcessMockerAdapterProxy();

        const mocker = childProcessMockerAdapter();
        const result = mocker.presets.timeout({});

        expect(result).toStrictEqual({
          delay: 0 as MockProcessBehavior['delay'],
          result: {
            code: 1 as MockSpawnResult['code'],
            stdout: '' as MockSpawnResult['stdout'],
            stderr: 'Timeout' as MockSpawnResult['stderr'],
          },
        });
      });
    });
  });
});
