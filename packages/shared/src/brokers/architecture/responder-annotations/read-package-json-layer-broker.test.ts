import { readPackageJsonLayerBroker } from './read-package-json-layer-broker';
import { readPackageJsonLayerBrokerProxy } from './read-package-json-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/hooks' });

describe('readPackageJsonLayerBroker', () => {
  describe('existing package.json', () => {
    it('VALID: {package.json with multiple bin entries} => returns parsed object with all bins', () => {
      const proxy = readPackageJsonLayerBrokerProxy();
      proxy.setupJson({
        json: {
          name: '@dungeonmaster/hooks',
          bin: {
            'dungeonmaster-pre-edit-lint': './dist/src/startup/start-pre-edit-hook.js',
            'dungeonmaster-pre-bash': './dist/src/startup/start-pre-bash-hook.js',
          },
        },
      });

      const result = readPackageJsonLayerBroker({ packageRoot: PACKAGE_ROOT });

      expect(result?.bin).toStrictEqual({
        'dungeonmaster-pre-edit-lint': './dist/src/startup/start-pre-edit-hook.js',
        'dungeonmaster-pre-bash': './dist/src/startup/start-pre-bash-hook.js',
      });
    });

    it('VALID: {package.json without bin} => returns parsed object with bin undefined', () => {
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
