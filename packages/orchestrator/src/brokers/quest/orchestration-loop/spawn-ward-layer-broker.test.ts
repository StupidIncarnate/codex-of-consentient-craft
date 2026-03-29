import { AbsoluteFilePathStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';

import { spawnWardLayerBroker } from './spawn-ward-layer-broker';
import { spawnWardLayerBrokerProxy } from './spawn-ward-layer-broker.proxy';

describe('spawnWardLayerBroker', () => {
  describe('ward execution', () => {
    it('VALID: {ward exits 0 with run ID} => returns exitCode 0 and runId', async () => {
      const proxy = spawnWardLayerBrokerProxy();
      proxy.setupWardSuccess({ exitCode: ExitCodeStub({ value: 0 }) });

      const result = await spawnWardLayerBroker({
        startPath: AbsoluteFilePathStub({ value: '/project' }),
        abortSignal: new AbortController().signal,
      });

      expect(result).toStrictEqual({ exitCode: 0, runId: '1739625600000-a3f1' });
    });

    it('VALID: {ward exits 1 with run ID} => returns exitCode 1 and runId', async () => {
      const proxy = spawnWardLayerBrokerProxy();
      proxy.setupWardFailure({ exitCode: ExitCodeStub({ value: 1 }) });

      const result = await spawnWardLayerBroker({
        startPath: AbsoluteFilePathStub({ value: '/project' }),
        abortSignal: new AbortController().signal,
      });

      expect(result).toStrictEqual({ exitCode: 1, runId: '1739625600000-a3f1' });
    });

    it('VALID: {ward exits 1 without run ID} => returns exitCode 1 and null runId', async () => {
      const proxy = spawnWardLayerBrokerProxy();
      proxy.setupWardNoRunId();

      const result = await spawnWardLayerBroker({
        startPath: AbsoluteFilePathStub({ value: '/project' }),
        abortSignal: new AbortController().signal,
      });

      expect(result).toStrictEqual({ exitCode: 1, runId: null });
    });

    it('VALID: {ward process is killed} => returns exitCode 1 and null runId', async () => {
      const proxy = spawnWardLayerBrokerProxy();
      proxy.setupWardKilled();

      const result = await spawnWardLayerBroker({
        startPath: AbsoluteFilePathStub({ value: '/project' }),
        abortSignal: new AbortController().signal,
      });

      expect(result).toStrictEqual({ exitCode: 1, runId: null });
    });
  });

  describe('wardMode flag', () => {
    it('VALID: {wardMode: changed} => spawns with --changed arg', async () => {
      const proxy = spawnWardLayerBrokerProxy();
      proxy.setupWardSuccess({ exitCode: ExitCodeStub({ value: 0 }) });

      await spawnWardLayerBroker({
        startPath: AbsoluteFilePathStub({ value: '/project' }),
        wardMode: 'changed',
        abortSignal: new AbortController().signal,
      });

      expect(proxy.getSpawnedArgs()).toStrictEqual(['run', '--changed']);
    });

    it('VALID: {wardMode: full} => spawns with run only', async () => {
      const proxy = spawnWardLayerBrokerProxy();
      proxy.setupWardSuccess({ exitCode: ExitCodeStub({ value: 0 }) });

      await spawnWardLayerBroker({
        startPath: AbsoluteFilePathStub({ value: '/project' }),
        wardMode: 'full',
        abortSignal: new AbortController().signal,
      });

      expect(proxy.getSpawnedArgs()).toStrictEqual(['run']);
    });

    it('VALID: {no wardMode} => spawns with run only', async () => {
      const proxy = spawnWardLayerBrokerProxy();
      proxy.setupWardSuccess({ exitCode: ExitCodeStub({ value: 0 }) });

      await spawnWardLayerBroker({
        startPath: AbsoluteFilePathStub({ value: '/project' }),
        abortSignal: new AbortController().signal,
      });

      expect(proxy.getSpawnedArgs()).toStrictEqual(['run']);
    });
  });

  describe('onLine callback', () => {
    it('VALID: {onLine provided, output has lines} => calls onLine for each non-empty line', async () => {
      const proxy = spawnWardLayerBrokerProxy();
      proxy.setupWardSuccess({
        exitCode: ExitCodeStub({ value: 0 }),
        stdoutLines: ['run: 1739625600000-a3f1', 'lint:      PASS', 'typecheck: PASS'],
      });

      const collectedLines: unknown[] = [];

      await spawnWardLayerBroker({
        startPath: AbsoluteFilePathStub({ value: '/project' }),
        onLine: (line) => {
          collectedLines.push(line);
        },
        abortSignal: new AbortController().signal,
      });

      expect(collectedLines).toStrictEqual([
        'run: 1739625600000-a3f1',
        'lint:      PASS',
        'typecheck: PASS',
      ]);
    });

    it('VALID: {onLine provided, output has empty lines} => passes all lines including empty', async () => {
      const proxy = spawnWardLayerBrokerProxy();
      proxy.setupWardSuccess({
        exitCode: ExitCodeStub({ value: 0 }),
        stdoutLines: ['run: 1739625600000-a3f1', '', 'lint:      PASS'],
      });

      const collectedLines: unknown[] = [];

      await spawnWardLayerBroker({
        startPath: AbsoluteFilePathStub({ value: '/project' }),
        onLine: (line) => {
          collectedLines.push(line);
        },
        abortSignal: new AbortController().signal,
      });

      expect(collectedLines).toStrictEqual(['run: 1739625600000-a3f1', '', 'lint:      PASS']);
    });

    it('VALID: {no onLine callback} => does not throw', async () => {
      const proxy = spawnWardLayerBrokerProxy();
      proxy.setupWardSuccess({ exitCode: ExitCodeStub({ value: 0 }) });

      const result = await spawnWardLayerBroker({
        startPath: AbsoluteFilePathStub({ value: '/project' }),
        abortSignal: new AbortController().signal,
      });

      expect(result.exitCode).toBe(0);
    });
  });
});
