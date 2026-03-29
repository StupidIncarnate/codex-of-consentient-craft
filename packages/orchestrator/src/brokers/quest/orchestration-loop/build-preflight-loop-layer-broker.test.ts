import { ExitCodeStub, FilePathStub } from '@dungeonmaster/shared/contracts';

import { buildPreflightLoopLayerBroker } from './build-preflight-loop-layer-broker';
import { buildPreflightLoopLayerBrokerProxy } from './build-preflight-loop-layer-broker.proxy';

const CWD = '/project' as never;
const BUILD_COMMAND = 'npm run build';

describe('buildPreflightLoopLayerBroker', () => {
  describe('export', () => {
    it('VALID: {module} => exports a function', () => {
      expect(buildPreflightLoopLayerBroker).toStrictEqual(expect.any(Function));
    });
  });

  describe('build succeeds immediately', () => {
    it('VALID: {build passes on first attempt} => returns { success: true }', async () => {
      const proxy = buildPreflightLoopLayerBrokerProxy();
      proxy.setupBuildSuccess();

      const result = await buildPreflightLoopLayerBroker({
        buildCommand: BUILD_COMMAND,
        cwd: CWD,
        startPath: FilePathStub({ value: '/project' }),
        abortSignal: new AbortController().signal,
        attempt: 0,
        maxAttempts: 3,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('build fails then succeeds after spiritmender', () => {
    it('VALID: {build fails once, spiritmender runs, retry succeeds} => returns { success: true }', async () => {
      const proxy = buildPreflightLoopLayerBrokerProxy();
      proxy.setupBuildFailure({ exitCode: ExitCodeStub({ value: 1 }), output: 'type error' });
      proxy.setupSpawnOnce({ lines: [], exitCode: ExitCodeStub({ value: 0 }) });
      proxy.setupBuildSuccess();

      const result = await buildPreflightLoopLayerBroker({
        buildCommand: BUILD_COMMAND,
        cwd: CWD,
        startPath: FilePathStub({ value: '/project' }),
        abortSignal: new AbortController().signal,
        attempt: 0,
        maxAttempts: 3,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('build exhausts all attempts', () => {
    it('VALID: {build fails maxAttempts times} => returns { success: false }', async () => {
      const proxy = buildPreflightLoopLayerBrokerProxy();
      proxy.setupBuildFailure({ exitCode: ExitCodeStub({ value: 1 }), output: 'error 1' });
      proxy.setupSpawnOnce({ lines: [], exitCode: ExitCodeStub({ value: 0 }) });
      proxy.setupBuildFailure({ exitCode: ExitCodeStub({ value: 1 }), output: 'error 2' });
      proxy.setupSpawnOnce({ lines: [], exitCode: ExitCodeStub({ value: 0 }) });
      proxy.setupBuildFailure({ exitCode: ExitCodeStub({ value: 1 }), output: 'error 3' });

      const result = await buildPreflightLoopLayerBroker({
        buildCommand: BUILD_COMMAND,
        cwd: CWD,
        startPath: FilePathStub({ value: '/project' }),
        abortSignal: new AbortController().signal,
        attempt: 0,
        maxAttempts: 3,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('already aborted', () => {
    it('VALID: {signal already aborted} => returns { success: false } without building', async () => {
      buildPreflightLoopLayerBrokerProxy();

      const abortController = new AbortController();
      abortController.abort();

      const result = await buildPreflightLoopLayerBroker({
        buildCommand: BUILD_COMMAND,
        cwd: CWD,
        startPath: FilePathStub({ value: '/project' }),
        abortSignal: abortController.signal,
        attempt: 0,
        maxAttempts: 3,
      });

      expect(result.success).toBe(false);
    });
  });
});
