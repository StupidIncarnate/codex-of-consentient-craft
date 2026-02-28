import { FilePathStub, FileContentsStub } from '@dungeonmaster/shared/contracts';
import { InstallDetectConfigResponderProxy } from './install-detect-config-responder.proxy';

describe('InstallDetectConfigResponder', () => {
  describe('no existing config', () => {
    it('VALID: {context: no existing config} => creates eslint.config.js', () => {
      const proxy = InstallDetectConfigResponderProxy();
      proxy.setupNoConfigExists();

      const result = proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/test/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/test/.dungeonmaster' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/eslint-plugin',
        success: true,
        action: 'created',
        message: 'Created eslint.config.js',
      });
    });
  });

  describe('existing config with dungeonmaster', () => {
    it('VALID: {context: eslint.config.js exists with @dungeonmaster} => skips installation', () => {
      const proxy = InstallDetectConfigResponderProxy();
      proxy.setupConfigExists({
        configFileName: 'eslint.config.js',
        contents: FileContentsStub({
          value: "const dungeonmaster = require('@dungeonmaster/eslint-plugin');",
        }),
      });

      const result = proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/test/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/test/.dungeonmaster' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/eslint-plugin',
        success: true,
        action: 'skipped',
        message: 'ESLint already configured with dungeonmaster',
      });
    });
  });

  describe('existing config without dungeonmaster', () => {
    it('VALID: {context: eslint.config.js exists without @dungeonmaster} => skips with manual instruction', () => {
      const proxy = InstallDetectConfigResponderProxy();
      proxy.setupConfigExists({
        configFileName: 'eslint.config.js',
        contents: FileContentsStub({ value: 'module.exports = { rules: {} };' }),
      });

      const result = proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/test/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/test/.dungeonmaster' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/eslint-plugin',
        success: true,
        action: 'skipped',
        message: 'Found eslint.config.js - please add @dungeonmaster/eslint-plugin manually',
      });
    });

    it('VALID: {context: eslint.config.mjs exists without @dungeonmaster} => skips with manual instruction', () => {
      const proxy = InstallDetectConfigResponderProxy();
      proxy.setupConfigExists({
        configFileName: 'eslint.config.mjs',
        contents: FileContentsStub({ value: 'export default { rules: {} };' }),
      });

      const result = proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/test/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/test/.dungeonmaster' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/eslint-plugin',
        success: true,
        action: 'skipped',
        message: 'Found eslint.config.mjs - please add @dungeonmaster/eslint-plugin manually',
      });
    });
  });
});
