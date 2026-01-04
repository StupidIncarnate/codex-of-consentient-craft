import {
  installTestbedCreateBroker,
  BaseNameStub,
  RelativePathStub,
  FileContentStub,
} from '@dungeonmaster/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { StartInstall } from './start-install';

describe('start-install integration', () => {
  describe('StartInstall', () => {
    it('VALID: {context: no existing config} => creates eslint.config.js', () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'create-eslint-config' }),
      });

      const result = StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.projectPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/eslint-plugin',
        success: true,
        action: 'created',
        message: 'Created eslint.config.js',
      });

      const configContent = testbed.readFile({
        relativePath: RelativePathStub({ value: 'eslint.config.js' }),
      });

      testbed.cleanup();

      expect(configContent).toMatch(/@dungeonmaster\/eslint-plugin/u);
      expect(configContent).toMatch(/@typescript-eslint\/parser/u);
    });

    it('VALID: {context: eslint.config.js exists with @dungeonmaster} => skips installation', () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'skip-eslint-config' }),
      });

      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'eslint.config.js' }),
        content: FileContentStub({
          value: "const dungeonmaster = require('@dungeonmaster/eslint-plugin');",
        }),
      });

      const result = StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.projectPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/eslint-plugin',
        success: true,
        action: 'skipped',
        message: 'ESLint already configured with dungeonmaster',
      });
    });

    it('VALID: {context: eslint.config.js exists without @dungeonmaster} => skips with manual instruction', () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'existing-eslint-config' }),
      });

      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'eslint.config.js' }),
        content: FileContentStub({
          value: 'module.exports = { rules: {} };',
        }),
      });

      const result = StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.projectPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/eslint-plugin',
        success: true,
        action: 'skipped',
        message: 'Found eslint.config.js - please add @dungeonmaster/eslint-plugin manually',
      });
    });

    it('VALID: {context: eslint.config.mjs exists without @dungeonmaster} => skips with manual instruction', () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'existing-eslint-mjs' }),
      });

      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'eslint.config.mjs' }),
        content: FileContentStub({
          value: 'export default { rules: {} };',
        }),
      });

      const result = StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.projectPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/eslint-plugin',
        success: true,
        action: 'skipped',
        message: 'Found eslint.config.mjs - please add @dungeonmaster/eslint-plugin manually',
      });
    });
  });
});
