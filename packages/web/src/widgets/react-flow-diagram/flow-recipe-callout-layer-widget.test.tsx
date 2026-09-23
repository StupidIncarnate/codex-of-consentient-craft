import { FlowRecipeStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { FlowRecipeCalloutLayerWidget } from './flow-recipe-callout-layer-widget';
import { FlowRecipeCalloutLayerWidgetProxy } from './flow-recipe-callout-layer-widget.proxy';

describe('FlowRecipeCalloutLayerWidget', () => {
  describe('with recipes', () => {
    it('VALID: {two recipes} => renders both recipe names and citations in order', () => {
      const proxy = FlowRecipeCalloutLayerWidgetProxy();
      const recipes = [
        FlowRecipeStub({ id: 'pc-walk-1', instanceId: 'inst_7f3a9c21', runId: 'run_2' }),
        FlowRecipeStub({ id: 'admin-onboard', instanceId: 'inst_11b2c333', runId: 'run_5' }),
      ];

      mantineRenderAdapter({ ui: <FlowRecipeCalloutLayerWidget recipes={recipes} /> });

      expect(proxy.hasCallout()).toBe(true);
      expect(proxy.getRecipeNames()).toStrictEqual(['pc-walk-1', 'admin-onboard']);
      expect(proxy.getRecipeCitations()).toStrictEqual([
        'inst_7f3a9c21 / run_2',
        'inst_11b2c333 / run_5',
      ]);
    });
  });

  describe('no recipes', () => {
    it('EMPTY: {no recipes} => renders no callout at all', () => {
      const proxy = FlowRecipeCalloutLayerWidgetProxy();

      mantineRenderAdapter({ ui: <FlowRecipeCalloutLayerWidget recipes={[]} /> });

      expect(proxy.hasCallout()).toBe(false);
    });
  });
});
