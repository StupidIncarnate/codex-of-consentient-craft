import { widgetTreeSectionRenderLayerBroker } from './widget-tree-section-render-layer-broker';
import { widgetTreeSectionRenderLayerBrokerProxy } from './widget-tree-section-render-layer-broker.proxy';
import { WidgetTreeResultStub } from '../../../contracts/widget-tree-result/widget-tree-result.stub';
import { WidgetNodeStub } from '../../../contracts/widget-node/widget-node.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { projectMapHeadlineFrontendReactStatics } from '../../../statics/project-map-headline-frontend-react/project-map-headline-frontend-react-statics';

describe('widgetTreeSectionRenderLayerBroker', () => {
  describe('empty widget tree', () => {
    it('EMPTY: {no roots} => first line is composition section header', () => {
      widgetTreeSectionRenderLayerBrokerProxy();
      const widgetTree = WidgetTreeResultStub({ roots: [], hubs: [] });

      const result = widgetTreeSectionRenderLayerBroker({ widgetTree });

      const lines = String(result).split('\n');

      expect(lines[0]).toBe(projectMapHeadlineFrontendReactStatics.compositionSectionHeader);
    });

    it('EMPTY: {no roots} => empty message present', () => {
      widgetTreeSectionRenderLayerBrokerProxy();
      const widgetTree = WidgetTreeResultStub({ roots: [], hubs: [] });

      const result = widgetTreeSectionRenderLayerBroker({ widgetTree });

      const lines = String(result).split('\n');

      expect(
        lines.some((l) => l === projectMapHeadlineFrontendReactStatics.compositionSectionEmpty),
      ).toBe(true);
    });
  });

  describe('single root node', () => {
    it('VALID: {one root} => root widget name appears in output', () => {
      widgetTreeSectionRenderLayerBrokerProxy();
      const root = WidgetNodeStub({
        widgetName: ContentTextStub({ value: 'quest-chat-widget' }),
        bindingsAttached: [],
        children: [],
        filePath: AbsoluteFilePathStub({
          value: '/repo/packages/web/src/widgets/quest-chat/quest-chat-widget.tsx',
        }),
      });
      const widgetTree = WidgetTreeResultStub({ roots: [root], hubs: [] });

      const result = widgetTreeSectionRenderLayerBroker({ widgetTree });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === 'quest-chat-widget')).toBe(true);
    });

    it('VALID: {root with binding} => bindings line in output', () => {
      widgetTreeSectionRenderLayerBrokerProxy();
      const root = WidgetNodeStub({
        widgetName: ContentTextStub({ value: 'quest-chat-widget' }),
        bindingsAttached: [ContentTextStub({ value: 'use-quest-chat' })],
        children: [],
        filePath: AbsoluteFilePathStub({
          value: '/repo/packages/web/src/widgets/quest-chat/quest-chat-widget.tsx',
        }),
      });
      const widgetTree = WidgetTreeResultStub({ roots: [root], hubs: [] });

      const result = widgetTreeSectionRenderLayerBroker({ widgetTree });

      const lines = String(result).split('\n');
      const bindingsLine = `${projectMapHeadlineFrontendReactStatics.bindingsPrefix}use-quest-chat`;

      expect(lines.some((l) => l === bindingsLine)).toBe(true);
    });
  });

  describe('multi-root nodes', () => {
    it('VALID: {two roots} => first root name in output', () => {
      widgetTreeSectionRenderLayerBrokerProxy();
      const root1 = WidgetNodeStub({
        widgetName: ContentTextStub({ value: 'quest-chat-widget' }),
        bindingsAttached: [],
        children: [],
        filePath: AbsoluteFilePathStub({
          value: '/repo/packages/web/src/widgets/quest-chat/quest-chat-widget.tsx',
        }),
      });
      const root2 = WidgetNodeStub({
        widgetName: ContentTextStub({ value: 'home-content-widget' }),
        bindingsAttached: [],
        children: [],
        filePath: AbsoluteFilePathStub({
          value: '/repo/packages/web/src/widgets/home-content/home-content-widget.tsx',
        }),
      });
      const widgetTree = WidgetTreeResultStub({ roots: [root1, root2], hubs: [] });

      const result = widgetTreeSectionRenderLayerBroker({ widgetTree });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === 'quest-chat-widget')).toBe(true);
    });

    it('VALID: {two roots} => second root name in output', () => {
      widgetTreeSectionRenderLayerBrokerProxy();
      const root1 = WidgetNodeStub({
        widgetName: ContentTextStub({ value: 'quest-chat-widget' }),
        bindingsAttached: [],
        children: [],
        filePath: AbsoluteFilePathStub({
          value: '/repo/packages/web/src/widgets/quest-chat/quest-chat-widget.tsx',
        }),
      });
      const root2 = WidgetNodeStub({
        widgetName: ContentTextStub({ value: 'home-content-widget' }),
        bindingsAttached: [],
        children: [],
        filePath: AbsoluteFilePathStub({
          value: '/repo/packages/web/src/widgets/home-content/home-content-widget.tsx',
        }),
      });
      const widgetTree = WidgetTreeResultStub({ roots: [root1, root2], hubs: [] });

      const result = widgetTreeSectionRenderLayerBroker({ widgetTree });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === 'home-content-widget')).toBe(true);
    });
  });
});
