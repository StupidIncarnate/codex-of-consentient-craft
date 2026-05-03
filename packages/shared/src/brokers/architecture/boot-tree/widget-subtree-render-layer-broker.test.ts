import { widgetSubtreeRenderLayerBroker } from './widget-subtree-render-layer-broker';
import { widgetSubtreeRenderLayerBrokerProxy } from './widget-subtree-render-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { WidgetNodeStub } from '../../../contracts/widget-node/widget-node.stub';
import { WidgetTreeResultStub } from '../../../contracts/widget-tree-result/widget-tree-result.stub';

describe('widgetSubtreeRenderLayerBroker', () => {
  describe('responder imports a known root widget', () => {
    it('VALID: {responder imports root widget with one child} => returns indented widget tree lines', () => {
      const proxy = widgetSubtreeRenderLayerBrokerProxy();
      const responderFile = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/responders/app/home/app-home-responder.ts',
      });
      const widgetFile = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/widgets/home-content/home-content-widget.ts',
      });
      const childFile = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/widgets/guild-list/guild-list-widget.ts',
      });
      const packageRoot = AbsoluteFilePathStub({ value: '/repo/packages/web' });
      const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/web/src' });

      proxy.setupSource({
        content: ContentTextStub({
          value: `import { HomeContentWidget } from '../../../widgets/home-content/home-content-widget';`,
        }),
      });

      const widgetTree = WidgetTreeResultStub({
        roots: [
          WidgetNodeStub({
            widgetName: ContentTextStub({ value: 'home-content-widget' }),
            filePath: widgetFile,
            bindingsAttached: [],
            children: [
              WidgetNodeStub({
                widgetName: ContentTextStub({ value: 'guild-list-widget' }),
                filePath: childFile,
                bindingsAttached: [],
                children: [],
              }),
            ],
          }),
        ],
        hubs: [],
      });

      const projectRoot = AbsoluteFilePathStub({ value: '/repo' });

      const result = widgetSubtreeRenderLayerBroker({
        responderFile,
        widgetTree,
        httpEdges: [],
        wsEdges: [],
        packageRoot,
        projectRoot,
        packageSrcPath,
        indent: ContentTextStub({ value: '      ' }),
      });

      expect(result.map(String)).toStrictEqual([
        '      home-content-widget',
        '      └─ guild-list-widget',
      ]);
    });
  });

  describe('responder imports nothing matching a root', () => {
    it('EMPTY: {responder imports widget not in tree.roots} => returns empty array', () => {
      const proxy = widgetSubtreeRenderLayerBrokerProxy();
      const responderFile = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/responders/x/x-responder.ts',
      });
      const packageRoot = AbsoluteFilePathStub({ value: '/repo/packages/web' });
      const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/web/src' });

      proxy.setupSource({
        content: ContentTextStub({
          value: `import { OtherWidget } from '../../widgets/other/other-widget';`,
        }),
      });

      const widgetTree = WidgetTreeResultStub({ roots: [], hubs: [] });

      const projectRoot = AbsoluteFilePathStub({ value: '/repo' });

      const result = widgetSubtreeRenderLayerBroker({
        responderFile,
        widgetTree,
        httpEdges: [],
        wsEdges: [],
        packageRoot,
        projectRoot,
        packageSrcPath,
        indent: ContentTextStub({ value: '      ' }),
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('responder has no widget imports', () => {
    it('EMPTY: {responder imports nothing from widgets/} => returns empty array', () => {
      const proxy = widgetSubtreeRenderLayerBrokerProxy();
      const responderFile = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/responders/x/x-responder.ts',
      });
      const packageRoot = AbsoluteFilePathStub({ value: '/repo/packages/web' });
      const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/web/src' });

      proxy.setupSource({
        content: ContentTextStub({ value: `export const x = () => null;` }),
      });

      const widgetTree = WidgetTreeResultStub({ roots: [], hubs: [] });

      const projectRoot = AbsoluteFilePathStub({ value: '/repo' });

      const result = widgetSubtreeRenderLayerBroker({
        responderFile,
        widgetTree,
        httpEdges: [],
        wsEdges: [],
        packageRoot,
        projectRoot,
        packageSrcPath,
        indent: ContentTextStub({ value: '' }),
      });

      expect(result).toStrictEqual([]);
    });
  });
});
