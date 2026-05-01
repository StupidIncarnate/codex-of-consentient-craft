import { findStartupFileLayerBroker } from './find-startup-file-layer-broker';
import { findStartupFileLayerBrokerProxy } from './find-startup-file-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/orchestrator' });

describe('findStartupFileLayerBroker', () => {
  describe('no startup files', () => {
    it('EMPTY: {no files in startup dir} => returns undefined', () => {
      const proxy = findStartupFileLayerBrokerProxy();
      proxy.setupEmpty();

      const result = findStartupFileLayerBroker({ packageRoot: PACKAGE_ROOT });

      expect(result).toBe(undefined);
    });

    it('EMPTY: {only integration test files} => returns undefined', () => {
      const proxy = findStartupFileLayerBrokerProxy();
      proxy.setupStartupFiles({
        names: ['start-orchestrator.integration.test.ts', 'start-install.integration.test.ts'],
      });

      const result = findStartupFileLayerBroker({ packageRoot: PACKAGE_ROOT });

      expect(result).toBe(undefined);
    });
  });

  describe('startup file present', () => {
    it('VALID: {start-orchestrator.ts exists} => returns its absolute path', () => {
      const proxy = findStartupFileLayerBrokerProxy();
      proxy.setupStartupFiles({ names: ['start-orchestrator.ts', 'start-install.ts'] });

      const result = findStartupFileLayerBroker({ packageRoot: PACKAGE_ROOT });

      expect(String(result)).toBe('/repo/packages/orchestrator/src/startup/start-orchestrator.ts');
    });

    it('VALID: {mixed files including integration test} => returns first non-test startup file', () => {
      const proxy = findStartupFileLayerBrokerProxy();
      proxy.setupStartupFiles({
        names: [
          'start-orchestrator.integration.test.ts',
          'start-orchestrator.ts',
          'start-install.ts',
        ],
      });

      const result = findStartupFileLayerBroker({ packageRoot: PACKAGE_ROOT });

      expect(String(result)).toBe('/repo/packages/orchestrator/src/startup/start-orchestrator.ts');
    });
  });
});
