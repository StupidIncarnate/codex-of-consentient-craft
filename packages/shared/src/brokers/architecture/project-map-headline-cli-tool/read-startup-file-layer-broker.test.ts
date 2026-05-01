import { readStartupFileLayerBroker } from './read-startup-file-layer-broker';
import { readStartupFileLayerBrokerProxy } from './read-startup-file-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/ward' });
const STARTUP_SOURCE = ContentTextStub({ value: `export const StartWard = async () => {};` });

describe('readStartupFileLayerBroker', () => {
  describe('startup file found', () => {
    it('VALID: {start-ward.ts exists} => returns file content', () => {
      const proxy = readStartupFileLayerBrokerProxy();
      proxy.setup({ fileName: 'start-ward.ts', source: STARTUP_SOURCE });

      const result = readStartupFileLayerBroker({ packageRoot: PACKAGE_ROOT });

      expect(result).toBe(String(STARTUP_SOURCE));
    });
  });

  describe('no startup files', () => {
    it('EMPTY: {empty startup dir} => returns undefined', () => {
      const proxy = readStartupFileLayerBrokerProxy();
      proxy.setupEmpty();

      const result = readStartupFileLayerBroker({ packageRoot: PACKAGE_ROOT });

      expect(result).toBe(undefined);
    });
  });

  describe('test files filtered out', () => {
    it('EDGE: {only integration test file in startup dir} => returns undefined', () => {
      const proxy = readStartupFileLayerBrokerProxy();
      proxy.setupEmpty();

      const result = readStartupFileLayerBroker({ packageRoot: PACKAGE_ROOT });

      expect(result).toBe(undefined);
    });
  });
});
