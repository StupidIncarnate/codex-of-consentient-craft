import {
  installTestbedCreateBroker,
  BaseNameStub,
  RelativePathStub,
  FileContentStub,
} from '@dungeonmaster/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { InstallFlow } from './install-flow';

describe('InstallFlow', () => {
  describe('add-dev-deps + create-playwright', () => {
    it('VALID: {context: no devDependencies, no playwright config} => adds devDependencies and creates playwright.config.ts', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'flow-add-devdeps' }),
      });

      const result = await InstallFlow({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      const packageJsonContent = testbed.readFile({
        relativePath: RelativePathStub({ value: 'package.json' }),
      });
      const playwrightConfigContent = testbed.readFile({
        relativePath: RelativePathStub({ value: 'playwright.config.ts' }),
      });

      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/cli',
        success: true,
        action: 'created',
        message: 'Added devDependencies to package.json; Created playwright.config.ts',
      });
      expect(packageJsonContent).toMatch(/^\s*"devDependencies": \{$/mu);
      expect(packageJsonContent).toMatch(/^\s*"typescript": "\^5\.8\.3"$/mu);
      expect(packageJsonContent).toMatch(/^\s*"@playwright\/test": "\^1\.58\.2",$/mu);
      expect(playwrightConfigContent).toBe(
        `import { defineConfig } from '@playwright/test';

export default defineConfig({ testMatch: '**/*.e2e.ts', timeout: 30_000 });
`,
      );
    });

    it('VALID: {context: all devDependencies present, playwright config exists} => returns skipped without overwriting', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'flow-skip-devdeps' }),
      });

      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'package.json' }),
        content: FileContentStub({
          value: JSON.stringify(
            {
              name: 'test-project',
              version: '1.0.0',
              devDependencies: {
                '@eslint/compat': '^1.3.1',
                '@eslint/eslintrc': '^3.3.1',
                '@playwright/test': '^1.58.2',
                '@types/debug': '^4.1.12',
                '@types/eslint': '^9.0.0',
                '@types/jest': '^30.0.0',
                '@types/node': '^24.0.15',
                '@types/prettier': '^2.7.3',
                '@typescript-eslint/eslint-plugin': '^8.35.1',
                '@typescript-eslint/parser': '^8.35.1',
                eslint: '^9.36.0',
                'eslint-config-prettier': '^10.1.5',
                'eslint-plugin-eslint-comments': '^3.2.0',
                'eslint-plugin-jest': '^29.0.1',
                'eslint-plugin-prettier': '^5.5.1',
                jest: '^30.0.4',
                prettier: '^3.6.2',
                'ts-jest': '^29.4.0',
                'ts-node': '^10.9.2',
                tsx: '^4.0.0',
                typescript: '^5.8.3',
              },
            },
            null,
            2,
          ),
        }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'playwright.config.ts' }),
        content: FileContentStub({ value: '// existing user config\n' }),
      });

      const result = await InstallFlow({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      const playwrightConfigContent = testbed.readFile({
        relativePath: RelativePathStub({ value: 'playwright.config.ts' }),
      });

      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/cli',
        success: true,
        action: 'skipped',
        message: 'All devDependencies already present; playwright.config.ts already exists',
      });
      expect(playwrightConfigContent).toBe('// existing user config\n');
    });
  });
});
