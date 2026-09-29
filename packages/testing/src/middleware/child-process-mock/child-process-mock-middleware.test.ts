import { childProcessMockMiddleware } from './child-process-mock-middleware';
import { childProcessMockMiddlewareProxy } from './child-process-mock-middleware.proxy';
import type { MockProcessBehaviorStub } from '../../contracts/mock-process-behavior/mock-process-behavior.stub';
import type { MockSpawnResultStub } from '../../contracts/mock-spawn-result/mock-spawn-result.stub';

type MockProcessBehavior = ReturnType<typeof MockProcessBehaviorStub>;
type MockSpawnResult = ReturnType<typeof MockSpawnResultStub>;

describe('childProcessMockMiddleware', () => {
  describe('mockSpawn()', () => {
    describe('valid input', () => {
      it('VALID: {behavior: success preset} => returns restore function', () => {
        childProcessMockMiddlewareProxy();

        const mocker = childProcessMockMiddleware();
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
        childProcessMockMiddlewareProxy();

        const mocker = childProcessMockMiddleware();
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
        childProcessMockMiddlewareProxy();

        const mocker = childProcessMockMiddleware();
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
        childProcessMockMiddlewareProxy();

        const mocker = childProcessMockMiddleware();
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
        childProcessMockMiddlewareProxy();

        const mocker = childProcessMockMiddleware();
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
        childProcessMockMiddlewareProxy();

        const mocker = childProcessMockMiddleware();
        const error = new Error('spawn ENOENT');
        const result = mocker.presets.crash({ error });

        expect(result).toStrictEqual({
          shouldThrow: true,
          throwError: error,
        });
      });

      it('VALID: {} => returns crash behavior with default error', () => {
        childProcessMockMiddlewareProxy();

        const mocker = childProcessMockMiddleware();
        const result = mocker.presets.crash({});

        expect(result).toStrictEqual({
          shouldThrow: true,
          throwError: new Error('spawn ENOENT'),
        });
      });
    });

    describe('eslintCrash()', () => {
      it('VALID: {} => returns ESLint crash behavior', () => {
        childProcessMockMiddlewareProxy();

        const mocker = childProcessMockMiddleware();
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
        childProcessMockMiddlewareProxy();

        const mocker = childProcessMockMiddleware();
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
        childProcessMockMiddlewareProxy();

        const mocker = childProcessMockMiddleware();
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
