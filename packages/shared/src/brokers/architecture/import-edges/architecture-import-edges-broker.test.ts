import { architectureImportEdgesBroker } from './architecture-import-edges-broker';
import { architectureImportEdgesBrokerProxy } from './architecture-import-edges-broker.proxy';
import { ImportEdgeStub } from '../../../contracts/import-edge/import-edge.stub';

const PROJECT_ROOT = '/repo';

const WEB_PKG = 'web';
const SHARED_PKG = 'shared';

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
            path: '/repo/packages/web/src/widgets/app-widget.ts',
            source: "import { questContract } from '@dungeonmaster/shared/contracts';",
          },
        ],
      });

      const result = architectureImportEdgesBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        ImportEdgeStub({
          consumerPackage: 'web',
          sourcePackage: 'shared',
          barrel: 'contracts',
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
            path: '/repo/packages/web/src/widgets/a-widget.ts',
            source: "import { x } from '@dungeonmaster/shared/contracts';",
          },
          {
            path: '/repo/packages/web/src/widgets/b-widget.ts',
            source: "import { y } from '@dungeonmaster/shared/contracts';",
          },
        ],
      });

      const result = architectureImportEdgesBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        ImportEdgeStub({
          consumerPackage: 'web',
          sourcePackage: 'shared',
          barrel: 'contracts',
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
            path: '/repo/packages/web/src/widgets/app-widget.ts',
            source: "import { foo } from './local-module';",
          },
        ],
      });

      const result = architectureImportEdgesBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([]);
    });
  });
});
