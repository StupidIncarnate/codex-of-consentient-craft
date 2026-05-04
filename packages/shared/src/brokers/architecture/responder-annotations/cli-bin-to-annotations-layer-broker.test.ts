import { cliBinToAnnotationsLayerBroker } from './cli-bin-to-annotations-layer-broker';
import { cliBinToAnnotationsLayerBrokerProxy } from './cli-bin-to-annotations-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/ward' });
const WARD_STARTUP = AbsoluteFilePathStub({
  value: '/repo/packages/ward/src/startup/start-ward.ts',
});

describe('cliBinToAnnotationsLayerBroker', () => {
  describe('package without package.json', () => {
    it('EMPTY: {package.json missing} => returns empty Map', () => {
      const proxy = cliBinToAnnotationsLayerBrokerProxy();
      proxy.setupMissing();

      const result = cliBinToAnnotationsLayerBroker({ packageRoot: PACKAGE_ROOT });

      expect(result).toStrictEqual(new Map());
    });
  });

  describe('package without bin field', () => {
    it('EMPTY: {package.json without bin} => returns empty Map', () => {
      const proxy = cliBinToAnnotationsLayerBrokerProxy();
      proxy.setupJson({ json: { name: '@dungeonmaster/ward' } });

      const result = cliBinToAnnotationsLayerBroker({ packageRoot: PACKAGE_ROOT });

      expect(result).toStrictEqual(new Map());
    });
  });

  describe('package with object bin', () => {
    it('VALID: {single bin entry as record} => returns annotation keyed by startup file path', () => {
      const proxy = cliBinToAnnotationsLayerBrokerProxy();
      proxy.setupJson({
        json: {
          name: '@dungeonmaster/ward',
          bin: {
            'dungeonmaster-ward': './dist/src/startup/start-ward.js',
          },
        },
      });

      const result = cliBinToAnnotationsLayerBroker({ packageRoot: PACKAGE_ROOT });

      expect(result).toStrictEqual(
        new Map([[WARD_STARTUP, { suffix: '[bin: dungeonmaster-ward]', childLines: [] }]]),
      );
    });
  });

  describe('package with string bin', () => {
    it('VALID: {string bin form} => derives bin name from package name and keys by startup', () => {
      const proxy = cliBinToAnnotationsLayerBrokerProxy();
      proxy.setupJson({
        json: {
          name: '@dungeonmaster/ward',
          bin: './dist/src/startup/start-ward.js',
        },
      });

      const result = cliBinToAnnotationsLayerBroker({ packageRoot: PACKAGE_ROOT });

      expect(result).toStrictEqual(
        new Map([[WARD_STARTUP, { suffix: '[bin: ward]', childLines: [] }]]),
      );
    });
  });
});
