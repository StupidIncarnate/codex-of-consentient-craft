import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { InstallAddDevDepsResponderProxy } from './install-add-dev-deps-responder.proxy';
import { devDependenciesStatics } from '../../../statics/dev-dependencies/dev-dependencies-statics';

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

      expect(writtenFiles[0]?.path).toBe('/project/package.json');
      // Derive from statics so the required set (incl. @dungeonmaster/* tooling) stays in sync.
      expect(String(writtenFiles[0]?.content)).toBe(
        JSON.stringify(
          {
            name: 'test-project',
            version: '1.0.0',
            devDependencies: { ...devDependenciesStatics.packages },
          },
          null,
          2,
        ),
      );
    });
  });

  describe('partial devDependencies', () => {
    it('VALID: {devDependencies present before nothing} => keeps name first, preserves + merges', async () => {
      const proxy = InstallAddDevDepsResponderProxy();

      proxy.setupFileExists();
      proxy.setupReadFile({
        content: JSON.stringify({
          name: 'test-project',
          devDependencies: { typescript: '^5.0.0' },
          license: 'MIT',
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

      // String-exact: proves top-level order is preserved (name/devDependencies/license), not
      // hoisted. The merged devDependencies keep the statics order with typescript's value overridden.
      expect(String(proxy.getWrittenFiles()[0]?.content)).toBe(
        JSON.stringify(
          {
            name: 'test-project',
            devDependencies: { ...devDependenciesStatics.packages, typescript: '^5.0.0' },
            license: 'MIT',
          },
          null,
          2,
        ),
      );
    });
  });

  describe('all devDependencies present', () => {
    it('VALID: {all devDependencies exist} => skips installation', async () => {
      const proxy = InstallAddDevDepsResponderProxy();

      proxy.setupFileExists();
      proxy.setupReadFile({
        content: JSON.stringify({
          name: 'test-project',
          devDependencies: { ...devDependenciesStatics.packages },
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
