import { architectureProjectMapBroker } from './architecture-project-map-broker';
import { architectureProjectMapBrokerProxy } from './architecture-project-map-broker.proxy';
import { projectMapStatics } from '../../../statics/project-map/project-map-statics';

describe('architectureProjectMapBroker', () => {
  describe('symbol legend and URL pairing convention header', () => {
    it('VALID: {single library package, packages: [shared]} => output starts with symbol legend', async () => {
      const proxy = architectureProjectMapBrokerProxy();
      const projectRoot = '/project';
      proxy.setupLibraryPackage({ projectRoot, packageName: 'shared' });

      const result = await architectureProjectMapBroker({
        projectRoot,
        packages: ['shared'],
      });

      expect(result.startsWith(projectMapStatics.symbolLegend)).toBe(true);
    });
  });

  describe('library packages', () => {
    it('VALID: {library package named shared, packages: [shared]} => renders # shared [library] header', async () => {
      const proxy = architectureProjectMapBrokerProxy();
      const projectRoot = '/project';
      proxy.setupLibraryPackage({ projectRoot, packageName: 'shared' });

      const result = await architectureProjectMapBroker({
        projectRoot,
        packages: ['shared'],
      });

      expect(result.split('\n').some((l) => l === '# shared [library]')).toBe(true);
    });

    it('VALID: {library package, packages: [shared]} => header is followed by the inventory pointer', async () => {
      const proxy = architectureProjectMapBrokerProxy();
      const projectRoot = '/project';
      proxy.setupLibraryPackage({ projectRoot, packageName: 'shared' });

      const result = await architectureProjectMapBroker({
        projectRoot,
        packages: ['shared'],
      });

      const lines = result.split('\n');
      const headerIndex = lines.indexOf('# shared [library]');

      expect(lines.slice(headerIndex, headerIndex + 3)).toStrictEqual([
        '# shared [library]',
        '',
        projectMapStatics.libraryNoFlowNotice,
      ]);
    });

    it('VALID: {library package, packages: [shared]} => output does not contain ## Boot heading', async () => {
      const proxy = architectureProjectMapBrokerProxy();
      const projectRoot = '/project';
      proxy.setupLibraryPackage({ projectRoot, packageName: 'shared' });

      const result = await architectureProjectMapBroker({
        projectRoot,
        packages: ['shared'],
      });

      expect(result.split('\n').some((l) => l === '## Boot')).toBe(false);
    });
  });

  describe('pointer footer', () => {
    it('VALID: {library package, packages: [shared]} => output ends with pointer footer line', async () => {
      const proxy = architectureProjectMapBrokerProxy();
      const projectRoot = '/project';
      proxy.setupLibraryPackage({ projectRoot, packageName: 'shared' });

      const result = await architectureProjectMapBroker({
        projectRoot,
        packages: ['shared'],
      });

      const lines = result.split('\n');

      expect(lines[lines.length - 1]).toStrictEqual(projectMapStatics.pointerFooter);
    });
  });

  describe('empty monorepo (single-repo mode)', () => {
    it('VALID: {no packages/ dir, root has no startups, packages: [root]} => root renders as a library package', async () => {
      const proxy = architectureProjectMapBrokerProxy();
      const projectRoot = '/project';
      proxy.setupEmptyMonorepo({ projectRoot });

      const result = await architectureProjectMapBroker({
        projectRoot,
        packages: ['root'],
      });

      expect(result.split('\n').some((l) => l === '# root [library]')).toBe(true);
    });
  });

  describe('frontend-ink package', () => {
    it('VALID: {frontend-ink package, packages: [ink-cli]} => renders with # ink-cli [frontend-ink] header', async () => {
      const proxy = architectureProjectMapBrokerProxy();
      const projectRoot = '/project';
      proxy.setupFrontendInkPackage({ projectRoot, packageName: 'ink-cli' });

      const result = await architectureProjectMapBroker({
        projectRoot,
        packages: ['ink-cli'],
      });

      expect(result.split('\n').some((l) => l === '# ink-cli [frontend-ink]')).toBe(true);
    });
  });

  describe('packages filter', () => {
    it('VALID: {renderable package, packages: [non-matching name]} => header for that package is NOT rendered', async () => {
      const proxy = architectureProjectMapBrokerProxy();
      const projectRoot = '/project';
      proxy.setupRenderablePackage({ projectRoot, packageName: 'mcp' });

      const result = await architectureProjectMapBroker({
        projectRoot,
        packages: ['mcp'],
      });

      expect(result.split('\n').some((l) => l === '# mcp [programmatic-service]')).toBe(true);
    });
  });

  describe('@-scoped group folders (gateway packages)', () => {
    it('VALID: {packages/@gateway/npm on disk, packages: [npm]} => renders the npm section by its bare name', async () => {
      const proxy = architectureProjectMapBrokerProxy();
      const projectRoot = '/project';
      proxy.setupGatewayGroupPackage({ projectRoot, groupName: '@gateway', packageName: 'npm' });

      const result = await architectureProjectMapBroker({
        projectRoot,
        packages: ['npm'],
      });

      expect(result.split('\n').some((l) => l === '# npm [library]')).toBe(true);
    });

    it('INVALID: {packages/@gateway/npm on disk, packages: [@gateway]} => throws Unknown package(s), so the group itself is never a valid name', async () => {
      const proxy = architectureProjectMapBrokerProxy();
      const projectRoot = '/project';
      proxy.setupGatewayGroupPackage({ projectRoot, groupName: '@gateway', packageName: 'npm' });

      await expect(
        architectureProjectMapBroker({
          projectRoot,
          packages: ['@gateway'],
        }),
      ).rejects.toThrow(/Unknown package\(s\): @gateway\. Valid: #gateway/u);
    });

    it('INVALID: {packages/@gateway/npm on disk, packages: [bogus]} => valid list shows #gateway instead of npm', async () => {
      const proxy = architectureProjectMapBrokerProxy();
      const projectRoot = '/project';
      proxy.setupGatewayGroupPackage({ projectRoot, groupName: '@gateway', packageName: 'npm' });

      await expect(
        architectureProjectMapBroker({
          projectRoot,
          packages: ['bogus'],
        }),
      ).rejects.toThrow(/Unknown package\(s\): bogus\. Valid: #gateway/u);
    });
  });

  describe('#gateway grouped view', () => {
    it('VALID: {packages: [#gateway]} => renders the # #gateway [gateway] header, never "Unknown package(s)"', async () => {
      const proxy = architectureProjectMapBrokerProxy();
      const projectRoot = '/project';
      proxy.setupEmptyMonorepo({ projectRoot });

      const result = await architectureProjectMapBroker({
        projectRoot,
        packages: ['#gateway'],
      });

      expect(
        result
          .split('\n')
          .some((l) =>
            l.startsWith(
              '# #gateway [gateway] — outside packages, Node, the browser and installed programs, reached only through here',
            ),
          ),
      ).toBe(true);
    });

    it('VALID: {packages: [#gateway], a real node/fs subpath on disk} => the grouped body appears inline', async () => {
      const proxy = architectureProjectMapBrokerProxy();
      const projectRoot = '/project';
      proxy.setupEmptyMonorepo({ projectRoot });
      proxy.setupGatewaySubpath({
        projectRoot,
        folder: 'node',
        subpathName: 'fs',
        barrelContent: [
          "export * from 'fs';",
          "export { existsSync } from './exists-sync/exists-sync';",
        ].join('\n'),
      });

      const result = await architectureProjectMapBroker({
        projectRoot,
        packages: ['#gateway'],
      });

      const lines = result.split('\n');

      expect(lines.some((l) => l === "  #gateway/node/fs  passes through 'fs'")).toBe(true);
      expect(lines.some((l) => l === '      ours: existsSync')).toBe(true);
    });

    it('VALID: {packages: [#gateway, root]} => both the gateway section and the other package render', async () => {
      const proxy = architectureProjectMapBrokerProxy();
      const projectRoot = '/project';
      proxy.setupEmptyMonorepo({ projectRoot });

      const result = await architectureProjectMapBroker({
        projectRoot,
        packages: ['#gateway', 'root'],
      });

      const lines = result.split('\n');

      expect(lines.some((l) => l.startsWith('# #gateway [gateway]'))).toBe(true);
      expect(lines.some((l) => l === '# root [library]')).toBe(true);
    });
  });

  describe('input validation', () => {
    it('INVALID: {packages: []} => throws "requires at least one package name"', async () => {
      architectureProjectMapBrokerProxy();
      const projectRoot = '/project';

      await expect(architectureProjectMapBroker({ projectRoot, packages: [] })).rejects.toThrow(
        /requires at least one package name/u,
      );
    });

    it('INVALID: {packages: [unknown name]} => throws Unknown package error listing valid names', async () => {
      const proxy = architectureProjectMapBrokerProxy();
      const projectRoot = '/project';
      proxy.setupRenderablePackage({ projectRoot, packageName: 'mcp' });

      await expect(
        architectureProjectMapBroker({
          projectRoot,
          packages: ['nonexistent'],
        }),
      ).rejects.toThrow(/Unknown package\(s\): nonexistent\. Valid: mcp/u);
    });
  });
});
