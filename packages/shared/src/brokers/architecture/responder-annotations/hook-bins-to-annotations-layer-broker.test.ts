import { hookBinsToAnnotationsLayerBroker } from './hook-bins-to-annotations-layer-broker';
import { hookBinsToAnnotationsLayerBrokerProxy } from './hook-bins-to-annotations-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/hooks' });
const PRE_EDIT_STARTUP = AbsoluteFilePathStub({
  value: '/repo/packages/hooks/src/startup/start-pre-edit-hook.ts',
});
const PRE_BASH_STARTUP = AbsoluteFilePathStub({
  value: '/repo/packages/hooks/src/startup/start-pre-bash-hook.ts',
});

describe('hookBinsToAnnotationsLayerBroker', () => {
  describe('package without package.json', () => {
    it('EMPTY: {package.json missing} => returns empty Map', () => {
      const proxy = hookBinsToAnnotationsLayerBrokerProxy();
      proxy.setupMissing();

      const result = hookBinsToAnnotationsLayerBroker({ packageRoot: PACKAGE_ROOT });

      expect(result).toStrictEqual(new Map());
    });
  });

  describe('package without bin field', () => {
    it('EMPTY: {package.json without bin} => returns empty Map', () => {
      const proxy = hookBinsToAnnotationsLayerBrokerProxy();
      proxy.setupJson({ json: { name: '@dungeonmaster/hooks' } });

      const result = hookBinsToAnnotationsLayerBroker({ packageRoot: PACKAGE_ROOT });

      expect(result).toStrictEqual(new Map());
    });
  });

  describe('package with multiple bin entries', () => {
    it('VALID: {two bin entries} => returns annotations keyed by startup file paths', () => {
      const proxy = hookBinsToAnnotationsLayerBrokerProxy();
      proxy.setupJson({
        json: {
          name: '@dungeonmaster/hooks',
          bin: {
            'dungeonmaster-pre-edit-lint': './dist/src/startup/start-pre-edit-hook.js',
            'dungeonmaster-pre-bash': './dist/src/startup/start-pre-bash-hook.js',
          },
        },
      });

      const result = hookBinsToAnnotationsLayerBroker({ packageRoot: PACKAGE_ROOT });

      expect(result).toStrictEqual(
        new Map([
          [PRE_EDIT_STARTUP, { suffix: '[hook: dungeonmaster-pre-edit-lint]', childLines: [] }],
          [PRE_BASH_STARTUP, { suffix: '[hook: dungeonmaster-pre-bash]', childLines: [] }],
        ]),
      );
    });
  });
});
