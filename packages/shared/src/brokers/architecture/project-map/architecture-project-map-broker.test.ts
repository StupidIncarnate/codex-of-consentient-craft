import { architectureProjectMapBroker } from './architecture-project-map-broker';
import { architectureProjectMapBrokerProxy } from './architecture-project-map-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { projectMapStatics } from '../../../statics/project-map/project-map-statics';

describe('architectureProjectMapBroker', () => {
  describe('symbol legend and URL pairing convention header', () => {
    it('VALID: {single library package} => output starts with symbol legend', async () => {
      const proxy = architectureProjectMapBrokerProxy();
      proxy.setupLibraryPackage({ packageName: 'shared' });
      const projectRoot = AbsoluteFilePathStub({ value: '/project' });

      const result = await architectureProjectMapBroker({ projectRoot });

      expect(String(result).startsWith(projectMapStatics.symbolLegend)).toBe(true);
    });
  });

  describe('per-package header line', () => {
    it('VALID: {library package named shared} => output contains # shared [library] header', async () => {
      const proxy = architectureProjectMapBrokerProxy();
      proxy.setupLibraryPackage({ packageName: 'shared' });
      const projectRoot = AbsoluteFilePathStub({ value: '/project' });

      const result = await architectureProjectMapBroker({ projectRoot });

      expect(
        String(result)
          .split('\n')
          .some((l) => l === '# shared [library]'),
      ).toBe(true);
    });
  });

  describe('section separator', () => {
    it('VALID: {single library package} => output is split by --- separators into multiple top-level parts', async () => {
      const proxy = architectureProjectMapBrokerProxy();
      proxy.setupLibraryPackage({ packageName: 'shared' });
      const projectRoot = AbsoluteFilePathStub({ value: '/project' });

      const result = await architectureProjectMapBroker({ projectRoot });

      // symbol legend + url pairing block already contains '---' on its own line,
      // the composer adds more separators — the split produces at least 3 parts
      const parts = String(result).split('\n\n---\n\n');

      expect(parts.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('pointer footer', () => {
    it('VALID: {library package} => output ends with pointer footer line', async () => {
      const proxy = architectureProjectMapBrokerProxy();
      proxy.setupLibraryPackage({ packageName: 'shared' });
      const projectRoot = AbsoluteFilePathStub({ value: '/project' });

      const result = await architectureProjectMapBroker({ projectRoot });

      const lines = String(result).split('\n');

      expect(lines[lines.length - 1]).toStrictEqual(projectMapStatics.pointerFooter);
    });
  });

  describe('library type skips boot section', () => {
    it('VALID: {library package} => output does not contain ## Boot heading', async () => {
      const proxy = architectureProjectMapBrokerProxy();
      proxy.setupLibraryPackage({ packageName: 'shared' });
      const projectRoot = AbsoluteFilePathStub({ value: '/project' });

      const result = await architectureProjectMapBroker({ projectRoot });

      expect(
        String(result)
          .split('\n')
          .some((l) => l === '## Boot'),
      ).toBe(false);
    });
  });

  describe('empty monorepo (single-repo mode)', () => {
    it('VALID: {no packages/ dir} => falls back to root package with [library] type', async () => {
      const proxy = architectureProjectMapBrokerProxy();
      proxy.setupEmptyMonorepo();
      const projectRoot = AbsoluteFilePathStub({ value: '/project' });

      const result = await architectureProjectMapBroker({ projectRoot });

      expect(
        String(result)
          .split('\n')
          .some((l) => l === '# root [library]'),
      ).toBe(true);
    });
  });

  describe('frontend-ink package', () => {
    it('ERROR: {frontend-ink package} => throws not-yet-implemented error', async () => {
      const proxy = architectureProjectMapBrokerProxy();
      proxy.setupFrontendInkPackage({ packageName: 'ink-cli' });
      const projectRoot = AbsoluteFilePathStub({ value: '/project' });

      await expect(architectureProjectMapBroker({ projectRoot })).rejects.toThrow(
        'frontend-ink renderer not yet implemented (v2)',
      );
    });
  });
});
