import { architectureProjectMapBroker } from './architecture-project-map-broker';
import { architectureProjectMapBrokerProxy } from './architecture-project-map-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { PackageNameStub } from '../../../contracts/package-name/package-name.stub';
import { projectMapStatics } from '../../../statics/project-map/project-map-statics';

describe('architectureProjectMapBroker', () => {
  describe('symbol legend and URL pairing convention header', () => {
    it('VALID: {single library package, packages: [shared]} => output starts with symbol legend', async () => {
      const proxy = architectureProjectMapBrokerProxy();
      proxy.setupLibraryPackage({ packageName: 'shared' });
      const projectRoot = AbsoluteFilePathStub({ value: '/project' });

      const result = await architectureProjectMapBroker({
        projectRoot,
        packages: [PackageNameStub({ value: 'shared' })],
      });

      expect(String(result).startsWith(projectMapStatics.symbolLegend)).toBe(true);
    });
  });

  describe('library packages excluded', () => {
    it('VALID: {library package named shared, packages: [shared]} => output does NOT contain # shared [library] header', async () => {
      const proxy = architectureProjectMapBrokerProxy();
      proxy.setupLibraryPackage({ packageName: 'shared' });
      const projectRoot = AbsoluteFilePathStub({ value: '/project' });

      const result = await architectureProjectMapBroker({
        projectRoot,
        packages: [PackageNameStub({ value: 'shared' })],
      });

      expect(
        String(result)
          .split('\n')
          .some((l) => l === '# shared [library]'),
      ).toBe(false);
    });

    it('VALID: {library package, packages: [shared]} => output does not contain ## Boot heading', async () => {
      const proxy = architectureProjectMapBrokerProxy();
      proxy.setupLibraryPackage({ packageName: 'shared' });
      const projectRoot = AbsoluteFilePathStub({ value: '/project' });

      const result = await architectureProjectMapBroker({
        projectRoot,
        packages: [PackageNameStub({ value: 'shared' })],
      });

      expect(
        String(result)
          .split('\n')
          .some((l) => l === '## Boot'),
      ).toBe(false);
    });
  });

  describe('pointer footer', () => {
    it('VALID: {library package, packages: [shared]} => output ends with pointer footer line', async () => {
      const proxy = architectureProjectMapBrokerProxy();
      proxy.setupLibraryPackage({ packageName: 'shared' });
      const projectRoot = AbsoluteFilePathStub({ value: '/project' });

      const result = await architectureProjectMapBroker({
        projectRoot,
        packages: [PackageNameStub({ value: 'shared' })],
      });

      const lines = String(result).split('\n');

      expect(lines[lines.length - 1]).toStrictEqual(projectMapStatics.pointerFooter);
    });
  });

  describe('empty monorepo (single-repo mode)', () => {
    it('VALID: {no packages/ dir, root has no startups, packages: [root]} => root is treated as library and excluded', async () => {
      const proxy = architectureProjectMapBrokerProxy();
      proxy.setupEmptyMonorepo();
      const projectRoot = AbsoluteFilePathStub({ value: '/project' });

      const result = await architectureProjectMapBroker({
        projectRoot,
        packages: [PackageNameStub({ value: 'root' })],
      });

      expect(
        String(result)
          .split('\n')
          .some((l) => l === '# root [library]'),
      ).toBe(false);
    });
  });

  describe('frontend-ink package', () => {
    it('VALID: {frontend-ink package, packages: [ink-cli]} => renders with # ink-cli [frontend-ink] header', async () => {
      const proxy = architectureProjectMapBrokerProxy();
      proxy.setupFrontendInkPackage({ packageName: 'ink-cli' });
      const projectRoot = AbsoluteFilePathStub({ value: '/project' });

      const result = await architectureProjectMapBroker({
        projectRoot,
        packages: [PackageNameStub({ value: 'ink-cli' })],
      });

      expect(
        String(result)
          .split('\n')
          .some((l) => l === '# ink-cli [frontend-ink]'),
      ).toBe(true);
    });
  });

  describe('packages filter', () => {
    it('VALID: {renderable package, packages: [non-matching name]} => header for that package is NOT rendered', async () => {
      const proxy = architectureProjectMapBrokerProxy();
      proxy.setupRenderablePackage({ packageName: 'mcp' });
      const projectRoot = AbsoluteFilePathStub({ value: '/project' });

      const result = await architectureProjectMapBroker({
        projectRoot,
        packages: [PackageNameStub({ value: 'mcp' })],
      });

      expect(
        String(result)
          .split('\n')
          .some((l) => l === '# mcp [programmatic-service]'),
      ).toBe(true);
    });
  });

  describe('input validation', () => {
    it('INVALID: {packages: []} => throws "requires at least one package name"', async () => {
      architectureProjectMapBrokerProxy();
      const projectRoot = AbsoluteFilePathStub({ value: '/project' });

      await expect(architectureProjectMapBroker({ projectRoot, packages: [] })).rejects.toThrow(
        /requires at least one package name/u,
      );
    });

    it('INVALID: {packages: [unknown name]} => throws Unknown package error listing valid names', async () => {
      const proxy = architectureProjectMapBrokerProxy();
      proxy.setupRenderablePackage({ packageName: 'mcp' });
      const projectRoot = AbsoluteFilePathStub({ value: '/project' });

      await expect(
        architectureProjectMapBroker({
          projectRoot,
          packages: [PackageNameStub({ value: 'nonexistent' })],
        }),
      ).rejects.toThrow(/Unknown package\(s\): nonexistent\. Valid: mcp/u);
    });
  });
});
