import { packageSectionBuildLayerBroker } from './package-section-build-layer-broker';
import { packageSectionBuildLayerBrokerProxy } from './package-section-build-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { PackageTypeStub } from '../../../contracts/package-type/package-type.stub';

const PROJECT_ROOT = AbsoluteFilePathStub({ value: '/repo' });
const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/shared' });
const PACKAGE_NAME = ContentTextStub({ value: 'shared' });

describe('packageSectionBuildLayerBroker', () => {
  describe('library type', () => {
    it('VALID: {library package} => section starts with # shared [library] header', () => {
      const proxy = packageSectionBuildLayerBrokerProxy();
      proxy.setupLibraryPackage();

      const result = packageSectionBuildLayerBroker({
        packageName: PACKAGE_NAME,
        packageRoot: PACKAGE_ROOT,
        packageType: PackageTypeStub({ value: 'library' }),
        projectRoot: PROJECT_ROOT,
      });

      expect(String(result).split('\n')[0]).toStrictEqual('# shared [library]');
    });

    it('VALID: {library package} => does not contain ## Boot section (library skips boot)', () => {
      const proxy = packageSectionBuildLayerBrokerProxy();
      proxy.setupLibraryPackage();

      const result = packageSectionBuildLayerBroker({
        packageName: PACKAGE_NAME,
        packageRoot: PACKAGE_ROOT,
        packageType: PackageTypeStub({ value: 'library' }),
        projectRoot: PROJECT_ROOT,
      });

      expect(
        String(result)
          .split('\n')
          .some((l) => l === '## Boot'),
      ).toBe(false);
    });

    it('VALID: {library package} => does not contain ## Side-channel section (library skips side-channel)', () => {
      const proxy = packageSectionBuildLayerBrokerProxy();
      proxy.setupLibraryPackage();

      const result = packageSectionBuildLayerBroker({
        packageName: PACKAGE_NAME,
        packageRoot: PACKAGE_ROOT,
        packageType: PackageTypeStub({ value: 'library' }),
        projectRoot: PROJECT_ROOT,
      });

      expect(
        String(result)
          .split('\n')
          .some((l) => l.startsWith('## Side-channel')),
      ).toBe(false);
    });
  });
});
