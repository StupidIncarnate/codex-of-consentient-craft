import { FilePathStub, PackageNameStub } from '@dungeonmaster/shared/contracts';
import { packageRegisterBrokerProxy } from './package-register-broker.proxy';
import { PackageJsonRawStub } from '../../../contracts/package-json-raw/package-json-raw.stub';

describe('packageRegisterBroker', () => {
  describe('VALID: registering a package missing from root dependencies', () => {
    it('VALID: {dependencies without packageName} => writes the sorted merge and returns true', async () => {
      const proxy = packageRegisterBrokerProxy();
      const projectRoot = FilePathStub({ value: '/project' });
      const packageName = PackageNameStub({ value: '@dungeonmaster/new-pkg' });

      const rootPackageJson = PackageJsonRawStub({
        dependencies: { '@dungeonmaster/existing': '*' },
      });

      proxy.setupRootPackageJson({ projectRoot, contents: JSON.stringify(rootPackageJson) });

      const result = await proxy.callBroker({ projectRoot, packageName });

      expect(result).toBe(true);
      expect(proxy.getWrittenContents()).toStrictEqual([
        `${JSON.stringify(
          {
            name: 'stub-project',
            version: '1.0.0',
            dependencies: {
              '@dungeonmaster/existing': '*',
              '@dungeonmaster/new-pkg': '*',
            },
          },
          null,
          2,
        )}\n`,
      ]);
    });
  });

  describe('EDGE: packageName already present in root dependencies', () => {
    it('EDGE: {dependencies already listing packageName} => returns false and writes nothing', async () => {
      const proxy = packageRegisterBrokerProxy();
      const projectRoot = FilePathStub({ value: '/project' });
      const packageName = PackageNameStub({ value: '@dungeonmaster/existing' });

      const rootPackageJson = PackageJsonRawStub({
        dependencies: { '@dungeonmaster/existing': '*' },
      });

      proxy.setupRootPackageJson({ projectRoot, contents: JSON.stringify(rootPackageJson) });

      const result = await proxy.callBroker({ projectRoot, packageName });

      expect(result).toBe(false);
      expect(proxy.getWrittenContents()).toStrictEqual([]);
    });
  });

  describe('ERROR: root package.json is missing', () => {
    it('ERROR: {projectRoot with no package.json} => throws naming the path', async () => {
      const proxy = packageRegisterBrokerProxy();
      const projectRoot = FilePathStub({ value: '/project' });
      const packageName = PackageNameStub({ value: '@dungeonmaster/new-pkg' });

      proxy.setupRootPackageJsonMissing({ projectRoot });

      await expect(proxy.callBroker({ projectRoot, packageName })).rejects.toThrow(
        /^No package\.json found at \/project\/package\.json$/u,
      );
    });
  });
});
