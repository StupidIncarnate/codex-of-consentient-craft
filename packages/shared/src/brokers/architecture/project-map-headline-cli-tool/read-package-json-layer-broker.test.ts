import { readPackageJsonLayerBroker } from './read-package-json-layer-broker';
import { readPackageJsonLayerBrokerProxy } from './read-package-json-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/ward' });

describe('readPackageJsonLayerBroker', () => {
  describe('existing package.json', () => {
    it('VALID: {valid package.json with bin} => returns parsed object with bin entries', () => {
      const proxy = readPackageJsonLayerBrokerProxy();
      proxy.setupJson({
        json: { name: '@dungeonmaster/ward', bin: { 'dungeonmaster-ward': './dist/bin/ward.js' } },
      });

      const result = readPackageJsonLayerBroker({ packageRoot: PACKAGE_ROOT });

      expect(result?.bin).toStrictEqual({ 'dungeonmaster-ward': './dist/bin/ward.js' });
    });

    it('VALID: {valid package.json without bin} => returns parsed object with bin undefined', () => {
      const proxy = readPackageJsonLayerBrokerProxy();
      proxy.setupJson({ json: { name: '@dungeonmaster/shared' } });

      const result = readPackageJsonLayerBroker({ packageRoot: PACKAGE_ROOT });

      expect(result?.bin).toBe(undefined);
    });
  });

  describe('missing package.json', () => {
    it('EMPTY: {no package.json} => returns undefined', () => {
      const proxy = readPackageJsonLayerBrokerProxy();
      proxy.setupMissing();

      const result = readPackageJsonLayerBroker({ packageRoot: PACKAGE_ROOT });

      expect(result).toBe(undefined);
    });
  });
});
