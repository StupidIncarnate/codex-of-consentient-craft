import { packageSectionBuildLayerBroker } from './package-section-build-layer-broker';
import { packageSectionBuildLayerBrokerProxy } from './package-section-build-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { PackageTypeStub } from '../../../contracts/package-type/package-type.stub';

const PROJECT_ROOT = AbsoluteFilePathStub({ value: '/repo' });
const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/shared' });
const PACKAGE_NAME = ContentTextStub({ value: 'shared' });
const SRC_PATH = AbsoluteFilePathStub({ value: '/repo/packages/shared/src' });
const PKG_JSON_PATH = AbsoluteFilePathStub({ value: '/repo/packages/shared/package.json' });

describe('packageSectionBuildLayerBroker', () => {
  describe('library type', () => {
    it('VALID: {library package} => section starts with # shared [library] header', () => {
      const proxy = packageSectionBuildLayerBrokerProxy();
      proxy.setupLibraryPackage({ packageName: 'shared' });

      const result = packageSectionBuildLayerBroker({
        packageName: PACKAGE_NAME,
        packageRoot: PACKAGE_ROOT,
        packageType: PackageTypeStub({ value: 'library' }),
        srcPath: SRC_PATH,
        packageJsonPath: PKG_JSON_PATH,
        projectRoot: PROJECT_ROOT,
      });

      expect(String(result).split('\n')[0]).toStrictEqual('# shared [library]');
    });

    it('VALID: {library package} => section contains ### Inventory subsection', () => {
      const proxy = packageSectionBuildLayerBrokerProxy();
      proxy.setupLibraryPackage({ packageName: 'shared' });

      const result = packageSectionBuildLayerBroker({
        packageName: PACKAGE_NAME,
        packageRoot: PACKAGE_ROOT,
        packageType: PackageTypeStub({ value: 'library' }),
        srcPath: SRC_PATH,
        packageJsonPath: PKG_JSON_PATH,
        projectRoot: PROJECT_ROOT,
      });

      expect(
        String(result)
          .split('\n')
          .some((l) => l === '### Inventory'),
      ).toBe(true);
    });

    it('VALID: {library package} => does not contain ## Boot section (library skips boot)', () => {
      const proxy = packageSectionBuildLayerBrokerProxy();
      proxy.setupLibraryPackage({ packageName: 'shared' });

      const result = packageSectionBuildLayerBroker({
        packageName: PACKAGE_NAME,
        packageRoot: PACKAGE_ROOT,
        packageType: PackageTypeStub({ value: 'library' }),
        srcPath: SRC_PATH,
        packageJsonPath: PKG_JSON_PATH,
        projectRoot: PROJECT_ROOT,
      });

      expect(
        String(result)
          .split('\n')
          .some((l) => l === '## Boot'),
      ).toBe(false);
    });
  });
});
