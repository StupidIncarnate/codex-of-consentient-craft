import { StartInstall } from './start-install';
import { StartInstallProxy } from './start-install.proxy';
import {
  InstallContextStub,
  FilePathStub,
  FileContentsStub,
} from '@dungeonmaster/shared/contracts';

describe('StartInstall', () => {
  describe('install()', () => {
    it('VALID: eslint.config.js exists with @dungeonmaster => skips installation', () => {
      const proxy = StartInstallProxy();

      const context = InstallContextStub({
        value: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dungeonmaster' }),
        },
      });

      const configPath = FilePathStub({ value: '/project/eslint.config.js' });
      const existingContent = FileContentsStub({
        value: "const dungeonmaster = require('@dungeonmaster/eslint-plugin');",
      });

      proxy.pathJoin.returns({ result: configPath });
      proxy.fsExistsSync.returns({ filePath: configPath, exists: true });
      proxy.fsReadFileSync.returns({ filePath: configPath, contents: existingContent });

      const result = StartInstall({ context });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/eslint-plugin',
        success: true,
        action: 'skipped',
        message: 'ESLint already configured with dungeonmaster',
      });
    });

    it('VALID: eslint.config.js exists without @dungeonmaster => skips with manual instruction', () => {
      const proxy = StartInstallProxy();

      const context = InstallContextStub({
        value: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dungeonmaster' }),
        },
      });

      const configPath = FilePathStub({ value: '/project/eslint.config.js' });
      const existingContent = FileContentsStub({
        value: 'runtime.exports = { rules: {} };',
      });

      proxy.pathJoin.returns({ result: configPath });
      proxy.fsExistsSync.returns({ filePath: configPath, exists: true });
      proxy.fsReadFileSync.returns({ filePath: configPath, contents: existingContent });

      const result = StartInstall({ context });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/eslint-plugin',
        success: true,
        action: 'skipped',
        message: 'Found eslint.config.js - please add @dungeonmaster/eslint-plugin manually',
      });
    });

    it('VALID: eslint.config.mjs exists without @dungeonmaster => skips with manual instruction', () => {
      const proxy = StartInstallProxy();

      const context = InstallContextStub({
        value: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dungeonmaster' }),
        },
      });

      const existingContent = FileContentsStub({
        value: 'export default { rules: {} };',
      });

      // Set up file system: .js doesn't exist, .mjs exists
      proxy.fsExistsSync.setupFileSystem((path) => {
        return String(path).endsWith('eslint.config.mjs');
      });

      proxy.fsReadFileSync.returns({
        filePath: FilePathStub({ value: '/project/eslint.config.mjs' }),
        contents: existingContent,
      });

      const result = StartInstall({ context });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/eslint-plugin',
        success: true,
        action: 'skipped',
        message: 'Found eslint.config.mjs - please add @dungeonmaster/eslint-plugin manually',
      });
    });

    it('VALID: no config exists => creates eslint.config.js', () => {
      const proxy = StartInstallProxy();

      const context = InstallContextStub({
        value: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dungeonmaster' }),
        },
      });

      const expectedContents = FileContentsStub({
        value: `const dungeonmaster = require('@dungeonmaster/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');

module.exports = [
    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {parser: tsparser},
        plugins: {'@dungeonmaster': dungeonmaster},
        rules: {...dungeonmaster.configs.recommended.rules},
    },
];
`,
      });

      // All config files don't exist
      proxy.fsExistsSync.setupFileSystem(() => false);

      proxy.fsWriteFileSync.succeeds({
        filePath: FilePathStub({ value: '/project/eslint.config.js' }),
        contents: expectedContents,
      });

      const result = StartInstall({ context });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/eslint-plugin',
        success: true,
        action: 'created',
        message: 'Created eslint.config.js',
      });
    });
  });
});
