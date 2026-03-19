import { AbsoluteFilePathStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';

import { spawnWardLayerBroker } from './spawn-ward-layer-broker';
import { spawnWardLayerBrokerProxy } from './spawn-ward-layer-broker.proxy';

describe('spawnWardLayerBroker', () => {
  describe('ward execution', () => {
    it('VALID: {ward exits 0 with run ID} => returns exitCode 0 and populated wardResultJson', async () => {
      const proxy = spawnWardLayerBrokerProxy();
      const wardResultJson = '{"lint":"PASS","typecheck":"PASS"}';
      proxy.setupWardSuccess({ exitCode: ExitCodeStub({ value: 0 }), wardResultJson });

      const result = await spawnWardLayerBroker({
        startPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result.exitCode).toBe(0);
      expect(result.wardResultJson).toBe(wardResultJson);
    });

    it('VALID: {ward exits 1 with run ID} => returns exitCode 1 and populated wardResultJson', async () => {
      const proxy = spawnWardLayerBrokerProxy();
      const wardResultJson = '{"lint":"FAIL","typecheck":"PASS"}';
      proxy.setupWardFailure({ exitCode: ExitCodeStub({ value: 1 }), wardResultJson });

      const result = await spawnWardLayerBroker({
        startPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result.exitCode).toBe(1);
      expect(result.wardResultJson).toBe(wardResultJson);
    });

    it('VALID: {ward exits 1 without run ID} => returns exitCode 1 and null wardResultJson', async () => {
      const proxy = spawnWardLayerBrokerProxy();
      proxy.setupWardNoRunId({ exitCode: ExitCodeStub({ value: 1 }) });

      const result = await spawnWardLayerBroker({
        startPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result.exitCode).toBe(1);
      expect(result.wardResultJson).toBeNull();
    });

    it('VALID: {ward process is killed (null exitCode)} => returns exitCode 1 and null wardResultJson', async () => {
      const proxy = spawnWardLayerBrokerProxy();
      proxy.setupWardKilled();

      const result = await spawnWardLayerBroker({
        startPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result.exitCode).toBe(1);
      expect(result.wardResultJson).toBeNull();
    });

    it('VALID: {adapter normalizes null exitCode to 1} => returns exitCode 1 (adapter-level guarantee)', async () => {
      const proxy = spawnWardLayerBrokerProxy();
      proxy.setupWardNoRunId({ exitCode: ExitCodeStub({ value: 1 }) });

      const result = await spawnWardLayerBroker({
        startPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result.exitCode).toBe(1);
      expect(result.wardResultJson).toBeNull();
    });
  });
});
