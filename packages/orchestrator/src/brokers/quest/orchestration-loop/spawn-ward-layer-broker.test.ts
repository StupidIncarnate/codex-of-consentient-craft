import { AbsoluteFilePathStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';

import { spawnWardLayerBroker } from './spawn-ward-layer-broker';
import { spawnWardLayerBrokerProxy } from './spawn-ward-layer-broker.proxy';

describe('spawnWardLayerBroker', () => {
  describe('export', () => {
    it('VALID: {module} => exports a function', () => {
      expect(typeof spawnWardLayerBroker).toBe('function');
    });
  });

  describe('ward exits 0 with run ID', () => {
    it('VALID: {exitCode: 0, run ID present} => returns exitCode 0 with populated wardResultJson', async () => {
      const proxy = spawnWardLayerBrokerProxy();
      const wardResultJson = '{"lint":"PASS","test":"PASS"}';

      proxy.setupWardSuccess({
        exitCode: ExitCodeStub({ value: 0 }),
        wardResultJson,
      });

      const result = await spawnWardLayerBroker({
        startPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result.exitCode).toBe(0);
      expect(result.wardResultJson).toBe(wardResultJson);
    });
  });

  describe('ward exits 1 with run ID', () => {
    it('VALID: {exitCode: 1, run ID present} => returns exitCode 1 with populated wardResultJson', async () => {
      const proxy = spawnWardLayerBrokerProxy();
      const wardResultJson = '{"lint":"FAIL","test":"PASS"}';

      proxy.setupWardFailure({
        exitCode: ExitCodeStub({ value: 1 }),
        wardResultJson,
      });

      const result = await spawnWardLayerBroker({
        startPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result.exitCode).toBe(1);
      expect(result.wardResultJson).toBe(wardResultJson);
    });
  });

  describe('ward exits 1 without run ID', () => {
    it('VALID: {exitCode: 1, no run ID} => returns exitCode 1 with null wardResultJson', async () => {
      const proxy = spawnWardLayerBrokerProxy();

      proxy.setupWardNoRunId({
        exitCode: ExitCodeStub({ value: 1 }),
      });

      const result = await spawnWardLayerBroker({
        startPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result.exitCode).toBe(1);
      expect(result.wardResultJson).toBeNull();
    });
  });

  describe('ward process killed', () => {
    it('VALID: {exitCode: null (killed)} => exitCode falls back to 1', async () => {
      const proxy = spawnWardLayerBrokerProxy();

      proxy.setupWardKilled();

      const result = await spawnWardLayerBroker({
        startPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result.exitCode).toBe(1);
      expect(result.wardResultJson).toBeNull();
    });
  });
});
