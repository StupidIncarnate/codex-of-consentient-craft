import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { InstallAddDevDepsResponderProxy } from './install-add-dev-deps-responder.proxy';

describe('InstallAddDevDepsResponder', () => {
  describe('no package.json', () => {
    it('VALID: {no package.json} => returns skipped with failure', async () => {
      const proxy = InstallAddDevDepsResponderProxy();

      proxy.setupFileNotExists();

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/cli',
        success: false,
        action: 'skipped',
        message: 'No package.json found',
      });
    });
  });

  describe('invalid package.json', () => {
    it('VALID: {invalid JSON object} => returns skipped with failure', async () => {
      const proxy = InstallAddDevDepsResponderProxy();

      proxy.setupFileExists();
      proxy.setupReadFile({ content: '"not-an-object"' });

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/cli',
        success: false,
        action: 'skipped',
        message: 'Invalid package.json',
      });
    });

    it('EMPTY: {null package.json} => returns skipped with failure', async () => {
      const proxy = InstallAddDevDepsResponderProxy();

      proxy.setupFileExists();
      proxy.setupReadFile({ content: 'null' });

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/cli',
        success: false,
        action: 'skipped',
        message: 'Invalid package.json',
      });
    });
  });

  describe('missing devDependencies', () => {
    it('VALID: {no devDependencies} => adds all required devDependencies', async () => {
      const proxy = InstallAddDevDepsResponderProxy();

      proxy.setupFileExists();
      proxy.setupReadFile({
        content: JSON.stringify({ name: 'test-project', version: '1.0.0' }),
      });

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/cli',
        success: true,
        action: 'created',
        message: 'Added devDependencies to package.json',
      });

      const writtenFiles = proxy.getWrittenFiles();
      const writtenContent = String(writtenFiles[0]?.content);

      expect(writtenFiles[0]?.path).toMatch(/package\.json$/u);
      expect(writtenContent).toMatch(/"typescript": "\^5\.8\.3"/u);
      expect(writtenContent).toMatch(/"eslint": "\^9\.36\.0"/u);
      expect(writtenContent).toMatch(/"jest": "\^30\.0\.4"/u);
    });
  });

  describe('partial devDependencies', () => {
    it('VALID: {some devDependencies exist} => preserves existing and adds missing', async () => {
      const proxy = InstallAddDevDepsResponderProxy();

      proxy.setupFileExists();
      proxy.setupReadFile({
        content: JSON.stringify({
          name: 'test-project',
          devDependencies: { typescript: '^5.0.0' },
        }),
      });

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/cli',
        success: true,
        action: 'created',
        message: 'Added devDependencies to package.json',
      });

      const writtenContent = String(proxy.getWrittenFiles()[0]?.content);

      expect(writtenContent).toMatch(/"typescript": "\^5\.0\.0"/u);
    });
  });

  describe('all devDependencies present', () => {
    it('VALID: {all devDependencies exist} => skips installation', async () => {
      const proxy = InstallAddDevDepsResponderProxy();

      proxy.setupFileExists();
      proxy.setupReadFile({
        content: JSON.stringify({
          name: 'test-project',
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
        }),
      });

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/cli',
        success: true,
        action: 'skipped',
        message: 'All devDependencies already present',
      });
    });
  });
});
