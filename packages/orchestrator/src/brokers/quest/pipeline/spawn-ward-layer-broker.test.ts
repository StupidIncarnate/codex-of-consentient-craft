import { AbsoluteFilePathStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';

import { spawnWardLayerBroker } from './spawn-ward-layer-broker';
import { spawnWardLayerBrokerProxy } from './spawn-ward-layer-broker.proxy';

const WARD_RESULT_JSON = JSON.stringify({
  runId: '1739625600000-a3f1',
  timestamp: 1739625600000,
  filters: {},
  checks: [],
});

describe('spawnWardLayerBroker', () => {
  describe('successful ward run', () => {
    it('VALID: {ward exits with 0} => returns exit code 0 and ward result JSON', async () => {
      const proxy = spawnWardLayerBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupWardSuccess({ exitCode, wardResultJson: WARD_RESULT_JSON });

      const result = await spawnWardLayerBroker({
        startPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        exitCode: 0,
        wardResultJson: WARD_RESULT_JSON,
      });
    });
  });

  describe('failed ward run', () => {
    it('VALID: {ward exits with 1 and result JSON} => returns exit code 1 and ward result JSON', async () => {
      const proxy = spawnWardLayerBrokerProxy();
      const exitCode = ExitCodeStub({ value: 1 });
      proxy.setupWardFailure({ exitCode, wardResultJson: WARD_RESULT_JSON });

      const result = await spawnWardLayerBroker({
        startPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        exitCode: 1,
        wardResultJson: WARD_RESULT_JSON,
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {spawn error} => resolves with exit code 1 and null wardResultJson', async () => {
      const proxy = spawnWardLayerBrokerProxy();
      proxy.setupWardError({ error: new Error('ENOENT: dungeonmaster-ward not found') });

      const result = await spawnWardLayerBroker({
        startPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        exitCode: 1,
        wardResultJson: null,
      });
    });

    it('ERROR: {ward output has no run ID} => returns null wardResultJson', async () => {
      const proxy = spawnWardLayerBrokerProxy();
      const exitCode = ExitCodeStub({ value: 1 });
      proxy.setupWardNoRunId({ exitCode });

      const result = await spawnWardLayerBroker({
        startPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        exitCode: 1,
        wardResultJson: null,
      });
    });
  });

  describe('spawn arguments', () => {
    it('VALID: {startPath} => spawns dungeonmaster-ward run with correct cwd', async () => {
      const proxy = spawnWardLayerBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupWardSuccess({ exitCode, wardResultJson: WARD_RESULT_JSON });

      await spawnWardLayerBroker({
        startPath: AbsoluteFilePathStub({ value: '/home/user/project' }),
      });

      expect(proxy.getSpawnedCommand()).toBe('dungeonmaster-ward');
      expect(proxy.getSpawnedArgs()).toStrictEqual(['run']);
    });

    it('VALID: {startPath} => forwards startPath as cwd to spawned process', async () => {
      const proxy = spawnWardLayerBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupWardSuccess({ exitCode, wardResultJson: WARD_RESULT_JSON });

      await spawnWardLayerBroker({
        startPath: AbsoluteFilePathStub({ value: '/home/user/project' }),
      });

      expect(proxy.getSpawnedCwd()).toBe('/home/user/project');
    });
  });
});
