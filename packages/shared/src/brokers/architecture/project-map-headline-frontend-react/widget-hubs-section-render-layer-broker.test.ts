import { widgetHubsSectionRenderLayerBroker } from './widget-hubs-section-render-layer-broker';
import { widgetHubsSectionRenderLayerBrokerProxy } from './widget-hubs-section-render-layer-broker.proxy';
import { WidgetTreeResultStub } from '../../../contracts/widget-tree-result/widget-tree-result.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { projectMapHeadlineFrontendReactStatics } from '../../../statics/project-map-headline-frontend-react/project-map-headline-frontend-react-statics';

describe('widgetHubsSectionRenderLayerBroker', () => {
  describe('no hubs', () => {
    it('EMPTY: {no hubs} => first line is hubs section header', () => {
      widgetHubsSectionRenderLayerBrokerProxy();
      const widgetTree = WidgetTreeResultStub({ roots: [], hubs: [] });

      const result = widgetHubsSectionRenderLayerBroker({ widgetTree });

      const lines = String(result).split('\n');

      expect(lines[0]).toBe(projectMapHeadlineFrontendReactStatics.hubsSectionHeader);
    });

    it('EMPTY: {no hubs} => empty message present', () => {
      widgetHubsSectionRenderLayerBrokerProxy();
      const widgetTree = WidgetTreeResultStub({ roots: [], hubs: [] });

      const result = widgetHubsSectionRenderLayerBroker({ widgetTree });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === projectMapHeadlineFrontendReactStatics.hubsSectionEmpty)).toBe(
        true,
      );
    });
  });

  describe('with hubs', () => {
    it('VALID: {one hub} => hub name in output', () => {
      widgetHubsSectionRenderLayerBrokerProxy();
      const widgetTree = WidgetTreeResultStub({
        roots: [],
        hubs: [ContentTextStub({ value: 'pixel-btn-widget' })],
      });

      const result = widgetHubsSectionRenderLayerBroker({ widgetTree });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === 'pixel-btn-widget')).toBe(true);
    });

    it('VALID: {two hubs} => both hub names comma-separated on same line', () => {
      widgetHubsSectionRenderLayerBrokerProxy();
      const widgetTree = WidgetTreeResultStub({
        roots: [],
        hubs: [
          ContentTextStub({ value: 'pixel-btn-widget' }),
          ContentTextStub({ value: 'chat-entry-list-widget' }),
        ],
      });

      const result = widgetHubsSectionRenderLayerBroker({ widgetTree });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === 'pixel-btn-widget, chat-entry-list-widget')).toBe(true);
    });
  });
});
