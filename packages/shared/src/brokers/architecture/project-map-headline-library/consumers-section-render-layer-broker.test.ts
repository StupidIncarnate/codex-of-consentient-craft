import { consumersSectionRenderLayerBroker } from './consumers-section-render-layer-broker';
import { consumersSectionRenderLayerBrokerProxy } from './consumers-section-render-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { projectMapHeadlineLibraryStatics } from '../../../statics/project-map-headline-library/project-map-headline-library-statics';

const PROJECT_ROOT = AbsoluteFilePathStub({ value: '/repo' });

const SHARED_PKG = ContentTextStub({ value: 'shared' });
const WEB_PKG = ContentTextStub({ value: 'web' });
const SERVER_PKG = ContentTextStub({ value: 'server' });

describe('consumersSectionRenderLayerBroker', () => {
  describe('no consumers', () => {
    it('EMPTY: {no packages import shared} => renders 0 consumer packages line', () => {
      const proxy = consumersSectionRenderLayerBrokerProxy();
      proxy.setup({ projectRoot: PROJECT_ROOT, packages: [SHARED_PKG], sourceFiles: [] });

      const result = consumersSectionRenderLayerBroker({
        projectRoot: PROJECT_ROOT,
        packageName: SHARED_PKG,
      });

      expect(String(result)).toStrictEqual(
        `${projectMapHeadlineLibraryStatics.consumersSectionHeader}\n${projectMapHeadlineLibraryStatics.noConsumersLine}`,
      );
    });
  });

  describe('consumers list includes packages that import this library', () => {
    it('VALID: {web imports shared} => consumers section lists web', () => {
      const proxy = consumersSectionRenderLayerBrokerProxy();
      proxy.setup({
        projectRoot: PROJECT_ROOT,
        packages: [WEB_PKG, SHARED_PKG],
        sourceFiles: [
          {
            path: AbsoluteFilePathStub({ value: '/repo/packages/web/src/widgets/app-widget.ts' }),
            source: ContentTextStub({
              value: "import { x } from '@dungeonmaster/shared/contracts';",
            }),
          },
        ],
      });

      const result = consumersSectionRenderLayerBroker({
        projectRoot: PROJECT_ROOT,
        packageName: SHARED_PKG,
      });

      expect(String(result)).toStrictEqual(
        `${projectMapHeadlineLibraryStatics.consumersSectionHeader}\nweb\n(1 consumer package)`,
      );
    });

    it('VALID: {web and server import shared} => consumers section lists both sorted', () => {
      const proxy = consumersSectionRenderLayerBrokerProxy();
      proxy.setup({
        projectRoot: PROJECT_ROOT,
        packages: [WEB_PKG, SERVER_PKG, SHARED_PKG],
        sourceFiles: [
          {
            path: AbsoluteFilePathStub({ value: '/repo/packages/web/src/widgets/app-widget.ts' }),
            source: ContentTextStub({
              value: "import { x } from '@dungeonmaster/shared/contracts';",
            }),
          },
          {
            path: AbsoluteFilePathStub({ value: '/repo/packages/server/src/flows/quest-flow.ts' }),
            source: ContentTextStub({
              value: "import { y } from '@dungeonmaster/shared/guards';",
            }),
          },
        ],
      });

      const result = consumersSectionRenderLayerBroker({
        projectRoot: PROJECT_ROOT,
        packageName: SHARED_PKG,
      });

      expect(String(result)).toStrictEqual(
        `${projectMapHeadlineLibraryStatics.consumersSectionHeader}\nserver, web\n(2 consumer packages)`,
      );
    });
  });
});
