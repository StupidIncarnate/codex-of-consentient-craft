import { architectureImportEdgesBroker } from './architecture-import-edges-broker';
import { architectureImportEdgesBrokerProxy } from './architecture-import-edges-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { ImportEdgeStub } from '../../../contracts/import-edge/import-edge.stub';

const PROJECT_ROOT = AbsoluteFilePathStub({ value: '/repo' });

const WEB_PKG = ContentTextStub({ value: 'web' });
const SHARED_PKG = ContentTextStub({ value: 'shared' });

describe('architectureImportEdgesBroker', () => {
  describe('no packages', () => {
    it('EMPTY: {no packages} => returns empty edges', () => {
      const proxy = architectureImportEdgesBrokerProxy();
      proxy.setup({ projectRoot: PROJECT_ROOT, packages: [], sourceFiles: [] });

      const result = architectureImportEdgesBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([]);
    });
  });

  describe('consumer imports from library', () => {
    it('VALID: {web imports @dungeonmaster/shared/contracts} => produces ImportEdge', () => {
      const proxy = architectureImportEdgesBrokerProxy();
      proxy.setup({
        projectRoot: PROJECT_ROOT,
        packages: [WEB_PKG, SHARED_PKG],
        sourceFiles: [
          {
            path: AbsoluteFilePathStub({
              value: '/repo/packages/web/src/widgets/app-widget.ts',
            }),
            source: ContentTextStub({
              value: "import { questContract } from '@dungeonmaster/shared/contracts';",
            }),
          },
        ],
      });

      const result = architectureImportEdgesBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        ImportEdgeStub({
          consumerPackage: ContentTextStub({ value: 'web' }),
          sourcePackage: ContentTextStub({ value: 'shared' }),
          barrel: ContentTextStub({ value: 'contracts' }),
          importCount: 1,
        }),
      ]);
    });

    it('VALID: {multiple files import same barrel} => importCount reflects distinct files', () => {
      const proxy = architectureImportEdgesBrokerProxy();
      proxy.setup({
        projectRoot: PROJECT_ROOT,
        packages: [WEB_PKG, SHARED_PKG],
        sourceFiles: [
          {
            path: AbsoluteFilePathStub({ value: '/repo/packages/web/src/widgets/a-widget.ts' }),
            source: ContentTextStub({
              value: "import { x } from '@dungeonmaster/shared/contracts';",
            }),
          },
          {
            path: AbsoluteFilePathStub({ value: '/repo/packages/web/src/widgets/b-widget.ts' }),
            source: ContentTextStub({
              value: "import { y } from '@dungeonmaster/shared/contracts';",
            }),
          },
        ],
      });

      const result = architectureImportEdgesBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        ImportEdgeStub({
          consumerPackage: ContentTextStub({ value: 'web' }),
          sourcePackage: ContentTextStub({ value: 'shared' }),
          barrel: ContentTextStub({ value: 'contracts' }),
          importCount: 2,
        }),
      ]);
    });

    it('VALID: {no cross-package imports} => returns empty edges', () => {
      const proxy = architectureImportEdgesBrokerProxy();
      proxy.setup({
        projectRoot: PROJECT_ROOT,
        packages: [WEB_PKG, SHARED_PKG],
        sourceFiles: [
          {
            path: AbsoluteFilePathStub({ value: '/repo/packages/web/src/widgets/app-widget.ts' }),
            source: ContentTextStub({ value: "import { foo } from './local-module';" }),
          },
        ],
      });

      const result = architectureImportEdgesBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([]);
    });
  });
});
