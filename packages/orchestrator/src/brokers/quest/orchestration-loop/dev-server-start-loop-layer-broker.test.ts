import { ExitCodeStub, FilePathStub } from '@dungeonmaster/shared/contracts';

import { devServerStartLoopLayerBroker } from './dev-server-start-loop-layer-broker';
import { devServerStartLoopLayerBrokerProxy } from './dev-server-start-loop-layer-broker.proxy';

const CWD = '/project' as never;
const DEV_COMMAND = 'npm run dev';
const PORT = 3000;
const HOSTNAME = 'localhost';
const READINESS_PATH = '/';
const READINESS_TIMEOUT_MS = 5000;
const START_PATH = FilePathStub({ value: '/project' });

describe('devServerStartLoopLayerBroker', () => {
  describe('export', () => {
    it('VALID: {module} => exports a function', () => {
      expect(typeof devServerStartLoopLayerBroker).toBe('function');
    });
  });

  describe('server starts immediately', () => {
    it('VALID: {server starts on first attempt} => returns { success: true, process }', async () => {
      const proxy = devServerStartLoopLayerBrokerProxy();
      proxy.setupServerBecomesReady();

      const result = await devServerStartLoopLayerBroker({
        devCommand: DEV_COMMAND,
        port: PORT,
        hostname: HOSTNAME,
        readinessPath: READINESS_PATH,
        readinessTimeoutMs: READINESS_TIMEOUT_MS,
        cwd: CWD,
        startPath: START_PATH,
        abortSignal: new AbortController().signal,
        attempt: 0,
        maxAttempts: 3,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('server fails then succeeds after spiritmender', () => {
    it('VALID: {server fails once, spiritmender runs, retry succeeds} => returns { success: true }', async () => {
      const proxy = devServerStartLoopLayerBrokerProxy();
      proxy.setupServerExitsBeforeReady({ exitCode: 1 });
      proxy.setupSpawnOnce({ lines: [], exitCode: ExitCodeStub({ value: 0 }) });
      proxy.setupServerBecomesReady();

      const result = await devServerStartLoopLayerBroker({
        devCommand: DEV_COMMAND,
        port: PORT,
        hostname: HOSTNAME,
        readinessPath: READINESS_PATH,
        readinessTimeoutMs: READINESS_TIMEOUT_MS,
        cwd: CWD,
        startPath: START_PATH,
        abortSignal: new AbortController().signal,
        attempt: 0,
        maxAttempts: 3,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('server exhausts all attempts', () => {
    it('VALID: {server fails with maxAttempts: 1} => returns { success: false } without spawning spiritmender', async () => {
      const proxy = devServerStartLoopLayerBrokerProxy();
      proxy.setupServerExitsBeforeReady({ exitCode: 1 });

      const result = await devServerStartLoopLayerBroker({
        devCommand: DEV_COMMAND,
        port: PORT,
        hostname: HOSTNAME,
        readinessPath: READINESS_PATH,
        readinessTimeoutMs: READINESS_TIMEOUT_MS,
        cwd: CWD,
        startPath: START_PATH,
        abortSignal: new AbortController().signal,
        attempt: 0,
        maxAttempts: 1,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('already aborted', () => {
    it('VALID: {signal already aborted} => returns { success: false } without attempting', async () => {
      devServerStartLoopLayerBrokerProxy();

      const abortController = new AbortController();
      abortController.abort();

      const result = await devServerStartLoopLayerBroker({
        devCommand: DEV_COMMAND,
        port: PORT,
        hostname: HOSTNAME,
        readinessPath: READINESS_PATH,
        readinessTimeoutMs: READINESS_TIMEOUT_MS,
        cwd: CWD,
        startPath: START_PATH,
        abortSignal: abortController.signal,
        attempt: 0,
        maxAttempts: 3,
      });

      expect(result.success).toBe(false);
    });
  });
});
