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
    it('VALID: {context: no devDependencies} => adds required devDependencies', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'add-devdeps' }),
      });

      const result = await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.projectPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/cli',
        success: true,
        action: 'created',
        message: 'Added devDependencies to package.json',
      });

      const packageJsonContent = testbed.readFile({
        relativePath: RelativePathStub({ value: 'package.json' }),
      });

      testbed.cleanup();

      expect(packageJsonContent).toMatch(/"devDependencies"/u);
      expect(packageJsonContent).toMatch(/"@eslint\/compat": "\^1\.3\.1"/u);
      expect(packageJsonContent).toMatch(/"typescript": "\^5\.8\.3"/u);
      expect(packageJsonContent).toMatch(/"eslint": "\^9\.36\.0"/u);
    });

    it('VALID: {context: no devDependencies} => adds jest and tsx', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'add-devdeps-more' }),
      });

      await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.projectPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      const packageJsonContent = testbed.readFile({
        relativePath: RelativePathStub({ value: 'package.json' }),
      });

      testbed.cleanup();

      expect(packageJsonContent).toMatch(/"jest": "\^30\.0\.4"/u);
      expect(packageJsonContent).toMatch(/"tsx": "\^4\.0\.0"/u);
    });

    it('VALID: {context: some devDependencies exist} => preserves existing versions', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'partial-devdeps' }),
      });

      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'package.json' }),
        content: FileContentStub({
          value: JSON.stringify(
            {
              name: 'test-project',
              version: '1.0.0',
              devDependencies: {
                typescript: '^5.0.0',
                jest: '^29.0.0',
              },
            },
            null,
            2,
          ),
        }),
      });

      const result = await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.projectPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/cli',
        success: true,
        action: 'created',
        message: 'Added devDependencies to package.json',
      });

      const packageJsonContent = testbed.readFile({
        relativePath: RelativePathStub({ value: 'package.json' }),
      });

      testbed.cleanup();

      expect(packageJsonContent).toMatch(/"typescript": "\^5\.0\.0"/u);
      expect(packageJsonContent).toMatch(/"jest": "\^29\.0\.0"/u);
      expect(packageJsonContent).toMatch(/"@eslint\/compat": "\^1\.3\.1"/u);
    });

    it('VALID: {context: all devDependencies already exist} => skips installation', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'all-devdeps' }),
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

      const result = await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.projectPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/cli',
        success: true,
        action: 'skipped',
        message: 'All devDependencies already present',
      });
    });
  });
});
