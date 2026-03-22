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
      });

      expect(result.exitCode).toBe(0);
      expect(result.runId).toBe('1739625600000-a3f1');
    });

    it('VALID: {ward exits 1 with run ID} => returns exitCode 1 and runId', async () => {
      const proxy = spawnWardLayerBrokerProxy();
      proxy.setupWardFailure({ exitCode: ExitCodeStub({ value: 1 }) });

      const result = await spawnWardLayerBroker({
        startPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result.exitCode).toBe(1);
      expect(result.runId).toBe('1739625600000-a3f1');
    });

    it('VALID: {ward exits 1 without run ID} => returns exitCode 1 and null runId', async () => {
      const proxy = spawnWardLayerBrokerProxy();
      proxy.setupWardNoRunId();

      const result = await spawnWardLayerBroker({
        startPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result.exitCode).toBe(1);
      expect(result.runId).toBeNull();
    });

    it('VALID: {ward process is killed} => returns exitCode 1 and null runId', async () => {
      const proxy = spawnWardLayerBrokerProxy();
      proxy.setupWardKilled();

      const result = await spawnWardLayerBroker({
        startPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result.exitCode).toBe(1);
      expect(result.runId).toBeNull();
    });
  });

  describe('wardMode flag', () => {
    it('VALID: {wardMode: changed} => spawns with --changed arg', async () => {
      const proxy = spawnWardLayerBrokerProxy();
      proxy.setupWardSuccess({ exitCode: ExitCodeStub({ value: 0 }) });

      await spawnWardLayerBroker({
        startPath: AbsoluteFilePathStub({ value: '/project' }),
        wardMode: 'changed',
      });

      expect(proxy.getSpawnedArgs()).toStrictEqual(['run', '--changed']);
    });

    it('VALID: {wardMode: full} => spawns with run only', async () => {
      const proxy = spawnWardLayerBrokerProxy();
      proxy.setupWardSuccess({ exitCode: ExitCodeStub({ value: 0 }) });

      await spawnWardLayerBroker({
        startPath: AbsoluteFilePathStub({ value: '/project' }),
        wardMode: 'full',
      });

      expect(proxy.getSpawnedArgs()).toStrictEqual(['run']);
    });

    it('VALID: {no wardMode} => spawns with run only', async () => {
      const proxy = spawnWardLayerBrokerProxy();
      proxy.setupWardSuccess({ exitCode: ExitCodeStub({ value: 0 }) });

      await spawnWardLayerBroker({
        startPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(proxy.getSpawnedArgs()).toStrictEqual(['run']);
    });
  });
});
