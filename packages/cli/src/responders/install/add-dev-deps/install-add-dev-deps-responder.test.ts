import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { InstallAddDevDepsResponderProxy } from './install-add-dev-deps-responder.proxy';
import { devDependenciesStatics } from '../../../statics/dev-dependencies/dev-dependencies-statics';

describe('InstallAddDevDepsResponder', () => {
  describe('no package.json', () => {
    it('VALID: {no package.json} => returns skipped with failure', async () => {
      const proxy = InstallAddDevDepsResponderProxy();

      proxy.setupFileNotExists({ filePath: FilePathStub({ value: '/project/package.json' }) });

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

      proxy.setupFileExists({ filePath: FilePathStub({ value: '/project/package.json' }) });
      proxy.setupReadFile({
        filePath: FilePathStub({ value: '/project/package.json' }),
        content: '"not-an-object"',
      });

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

      proxy.setupFileExists({ filePath: FilePathStub({ value: '/project/package.json' }) });
      proxy.setupReadFile({
        filePath: FilePathStub({ value: '/project/package.json' }),
        content: 'null',
      });

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

      proxy.setupFileExists({ filePath: FilePathStub({ value: '/project/package.json' }) });
      proxy.setupReadFile({
        filePath: FilePathStub({ value: '/project/package.json' }),
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
      // String-exact: proves the write ends in one trailing newline and the merged
      // devDependencies come back alphabetically sorted, not in statics declaration order.
      expect(String(writtenFiles[0]?.content)).toBe(
        `${JSON.stringify(
          {
            name: 'test-project',
            version: '1.0.0',
            devDependencies: Object.fromEntries(
              Object.entries({ ...devDependenciesStatics.packages }).sort(([keyA], [keyB]) =>
                keyA.localeCompare(keyB),
              ),
            ),
          },
          null,
          2,
        )}\n`,
      );
    });
  });

  describe('partial devDependencies', () => {
    it('VALID: {devDependencies present before nothing} => keeps name first, preserves + merges', async () => {
      const proxy = InstallAddDevDepsResponderProxy();

      proxy.setupFileExists({ filePath: FilePathStub({ value: '/project/package.json' }) });
      proxy.setupReadFile({
        filePath: FilePathStub({ value: '/project/package.json' }),
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
      // hoisted; the merged devDependencies come back alphabetically sorted with typescript's
      // value overridden; and the write ends in one trailing newline.
      expect(String(proxy.getWrittenFiles()[0]?.content)).toBe(
        `${JSON.stringify(
          {
            name: 'test-project',
            devDependencies: Object.fromEntries(
              Object.entries({ ...devDependenciesStatics.packages, typescript: '^5.0.0' }).sort(
                ([keyA], [keyB]) => keyA.localeCompare(keyB),
              ),
            ),
            license: 'MIT',
          },
          null,
          2,
        )}\n`,
      );
    });
  });

  describe('extra devDependency outside the required set', () => {
    it('VALID: {devDependencies has ts-node, not in the required list} => sorts it into its alphabetical position instead of appending it after every required package', async () => {
      const proxy = InstallAddDevDepsResponderProxy();

      proxy.setupFileExists({ filePath: FilePathStub({ value: '/project/package.json' }) });
      proxy.setupReadFile({
        filePath: FilePathStub({ value: '/project/package.json' }),
        content: JSON.stringify({
          name: 'test-project',
          devDependencies: { 'ts-node': '^10.9.2', typescript: '^5.0.0' },
        }),
      });

      await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      // String-exact: 'ts-node' sorts between 'ts-jest' and 'tsx' — proving it lands at its
      // alphabetical position rather than tacked on after the whole required set, which is what a
      // plain `{...required, ...existing}` spread does (the bug this test guards against).
      expect(String(proxy.getWrittenFiles()[0]?.content)).toBe(
        `${JSON.stringify(
          {
            name: 'test-project',
            devDependencies: Object.fromEntries(
              Object.entries({
                ...devDependenciesStatics.packages,
                'ts-node': '^10.9.2',
                typescript: '^5.0.0',
              }).sort(([keyA], [keyB]) => keyA.localeCompare(keyB)),
            ),
          },
          null,
          2,
        )}\n`,
      );
    });
  });

  describe('all devDependencies present', () => {
    it('VALID: {all devDependencies exist} => skips installation', async () => {
      const proxy = InstallAddDevDepsResponderProxy();

      proxy.setupFileExists({ filePath: FilePathStub({ value: '/project/package.json' }) });
      proxy.setupReadFile({
        filePath: FilePathStub({ value: '/project/package.json' }),
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
