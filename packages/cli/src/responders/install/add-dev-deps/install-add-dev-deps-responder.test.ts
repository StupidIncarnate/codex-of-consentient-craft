import { InstallAddDevDepsResponderProxy } from './install-add-dev-deps-responder.proxy';
import { devDependenciesStatics } from '../../../statics/dev-dependencies/dev-dependencies-statics';
import { DependencyMapStub } from '../../../contracts/dependency-map/dependency-map.stub';
import { InstallContextStub } from '@dungeonmaster/shared/contracts/install-context/install-context.stub';

describe('InstallAddDevDepsResponder', () => {
  describe('no package.json', () => {
    it('VALID: {no package.json} => returns skipped with failure', async () => {
      const proxy = InstallAddDevDepsResponderProxy();

      proxy.setupFileNotExists({ filePath: '/project/package.json' });

      const result = await proxy.callResponder({
        context: InstallContextStub({
          value: {
            targetProjectRoot: '/project',
            dungeonmasterRoot: '/dm-root',
          },
        }),
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

      proxy.setupFileExists({ filePath: '/project/package.json' });
      proxy.setupReadFile({
        filePath: '/project/package.json',
        content: '"not-an-object"',
      });

      const result = await proxy.callResponder({
        context: InstallContextStub({
          value: {
            targetProjectRoot: '/project',
            dungeonmasterRoot: '/dm-root',
          },
        }),
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

      proxy.setupFileExists({ filePath: '/project/package.json' });
      proxy.setupReadFile({
        filePath: '/project/package.json',
        content: 'null',
      });

      const result = await proxy.callResponder({
        context: InstallContextStub({
          value: {
            targetProjectRoot: '/project',
            dungeonmasterRoot: '/dm-root',
          },
        }),
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

      proxy.setupFileExists({ filePath: '/project/package.json' });
      proxy.setupReadFile({
        filePath: '/project/package.json',
        content: JSON.stringify({ name: 'test-project', version: '1.0.0' }),
      });

      const result = await proxy.callResponder({
        context: InstallContextStub({
          value: {
            targetProjectRoot: '/project',
            dungeonmasterRoot: '/dm-root',
          },
        }),
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

      proxy.setupFileExists({ filePath: '/project/package.json' });
      proxy.setupReadFile({
        filePath: '/project/package.json',
        content: JSON.stringify({
          name: 'test-project',
          devDependencies: { typescript: '^5.0.0' },
          license: 'MIT',
        }),
      });

      const result = await proxy.callResponder({
        context: InstallContextStub({
          value: {
            targetProjectRoot: '/project',
            dungeonmasterRoot: '/dm-root',
          },
        }),
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

      proxy.setupFileExists({ filePath: '/project/package.json' });
      proxy.setupReadFile({
        filePath: '/project/package.json',
        content: JSON.stringify({
          name: 'test-project',
          devDependencies: { 'ts-node': '^10.9.2', typescript: '^5.0.0' },
        }),
      });

      await proxy.callResponder({
        context: InstallContextStub({
          value: {
            targetProjectRoot: '/project',
            dungeonmasterRoot: '/dm-root',
          },
        }),
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

      proxy.setupFileExists({ filePath: '/project/package.json' });
      proxy.setupReadFile({
        filePath: '/project/package.json',
        content: JSON.stringify({
          name: 'test-project',
          devDependencies: { ...devDependenciesStatics.packages },
        }),
      });

      const result = await proxy.callResponder({
        context: InstallContextStub({
          value: {
            targetProjectRoot: '/project',
            dungeonmasterRoot: '/dm-root',
          },
        }),
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/cli',
        success: true,
        action: 'skipped',
        message: 'All devDependencies already present',
      });
    });
  });

  describe('@dungeonmaster/* siblings taken through file:', () => {
    it('VALID: {file: siblings, @dungeonmaster/siegelense missing} => writes siegelense as a file: path to its discovered dir, siblings untouched', async () => {
      const proxy = InstallAddDevDepsResponderProxy();
      const localDevDeps = DependencyMapStub({
        ...Object.fromEntries(
          Object.entries(devDependenciesStatics.packages).filter(
            ([name]) => !name.startsWith('@dungeonmaster/'),
          ),
        ),
        '@dungeonmaster/eslint-plugin': 'file:../dm/packages/eslint-plugin',
        '@dungeonmaster/hooks': 'file:../dm/packages/hooks',
        '@dungeonmaster/mcp': 'file:../dm/packages/mcp',
        '@dungeonmaster/shared': 'file:../dm/packages/shared',
        '@dungeonmaster/testing': 'file:../dm/packages/testing',
        '@dungeonmaster/ward': 'file:../dm/packages/ward',
      });

      proxy.setupFileExists({ filePath: '/home/u/app/package.json' });
      proxy.setupReadFile({
        filePath: '/home/u/app/package.json',
        content: JSON.stringify({ name: 'app', devDependencies: localDevDeps }),
      });
      proxy.setupDungeonmasterPackages({
        packagesPath: '/home/u/dm/packages',
        packages: [{ name: 'cli' }, { name: 'siegelense' }, { name: 'npm', group: '@gateway' }],
      });

      const result = await proxy.callResponder({
        context: InstallContextStub({
          value: { targetProjectRoot: '/home/u/app', dungeonmasterRoot: '/home/u/dm' },
        }),
      });

      expect({
        result,
        written: String(proxy.getWrittenFiles()[0]?.content),
      }).toStrictEqual({
        result: {
          packageName: '@dungeonmaster/cli',
          success: true,
          action: 'created',
          message: 'Added devDependencies to package.json',
        },
        written: `${JSON.stringify(
          {
            name: 'app',
            devDependencies: Object.fromEntries(
              Object.entries({
                ...localDevDeps,
                '@dungeonmaster/siegelense': 'file:../dm/packages/siegelense',
              }).sort(([keyA], [keyB]) => keyA.localeCompare(keyB)),
            ),
          },
          null,
          2,
        )}\n`,
      });
    });

    it('VALID: {file: siblings, @dungeonmaster/siegelense already "*"} => never rewrites an existing entry, skips', async () => {
      const proxy = InstallAddDevDepsResponderProxy();

      proxy.setupFileExists({ filePath: '/home/u/app/package.json' });
      proxy.setupReadFile({
        filePath: '/home/u/app/package.json',
        content: JSON.stringify({
          name: 'app',
          devDependencies: {
            ...devDependenciesStatics.packages,
            '@dungeonmaster/cli': 'file:../dm/packages/cli',
          },
        }),
      });

      const result = await proxy.callResponder({
        context: InstallContextStub({
          value: { targetProjectRoot: '/home/u/app', dungeonmasterRoot: '/home/u/dm' },
        }),
      });

      expect({ result, written: proxy.getWrittenFiles() }).toStrictEqual({
        result: {
          packageName: '@dungeonmaster/cli',
          success: true,
          action: 'skipped',
          message: 'All devDependencies already present',
        },
        written: [],
      });
    });
  });
});
