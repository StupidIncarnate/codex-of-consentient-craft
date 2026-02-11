import { AbsoluteFilePathStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';

import { spawnWardLayerBroker } from './spawn-ward-layer-broker';
import { spawnWardLayerBrokerProxy } from './spawn-ward-layer-broker.proxy';

describe('spawnWardLayerBroker', () => {
  describe('successful ward run', () => {
    it('VALID: {ward exits with 0} => returns exit code 0 and empty output', async () => {
      const proxy = spawnWardLayerBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupWardSuccess({ exitCode });

      const result = await spawnWardLayerBroker({
        startPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        exitCode: 0,
        output: '',
      });
    });
  });

  describe('failed ward run', () => {
    it('VALID: {ward exits with 1 and error output} => returns exit code 1 and output', async () => {
      const proxy = spawnWardLayerBrokerProxy();
      const exitCode = ExitCodeStub({ value: 1 });
      proxy.setupWardFailure({
        exitCode,
        output: 'Error in /src/brokers/test/test-broker.ts',
      });

      const result = await spawnWardLayerBroker({
        startPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        exitCode: 1,
        output: 'Error in /src/brokers/test/test-broker.ts',
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {spawn error} => resolves with exit code 1', async () => {
      const proxy = spawnWardLayerBrokerProxy();
      proxy.setupWardError({ error: new Error('ENOENT: npm not found') });

      const result = await spawnWardLayerBroker({
        startPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        exitCode: 1,
        output: '',
      });
    });
  });

  describe('spawn arguments', () => {
    it('VALID: {startPath} => spawns npm run ward:all with correct cwd', async () => {
      const proxy = spawnWardLayerBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupWardSuccess({ exitCode });

      await spawnWardLayerBroker({
        startPath: AbsoluteFilePathStub({ value: '/home/user/project' }),
      });

      expect(proxy.getSpawnedCommand()).toBe('npm');
      expect(proxy.getSpawnedArgs()).toStrictEqual(['run', 'ward:all']);
    });

    it('VALID: {startPath} => forwards startPath as cwd to spawned process', async () => {
      const proxy = spawnWardLayerBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupWardSuccess({ exitCode });

      await spawnWardLayerBroker({
        startPath: AbsoluteFilePathStub({ value: '/home/user/project' }),
      });

      expect(proxy.getSpawnedCwd()).toBe('/home/user/project');
    });
  });
});
