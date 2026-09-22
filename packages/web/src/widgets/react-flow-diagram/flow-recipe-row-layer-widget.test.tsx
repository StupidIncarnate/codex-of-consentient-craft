import { FlowRecipeStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { FlowRecipeRowLayerWidget } from './flow-recipe-row-layer-widget';
import { FlowRecipeRowLayerWidgetProxy } from './flow-recipe-row-layer-widget.proxy';

describe('FlowRecipeRowLayerWidget', () => {
  it('VALID: {recipe} => renders the recipe name and its instanceId/runId citation', () => {
    const proxy = FlowRecipeRowLayerWidgetProxy();
    const recipe = FlowRecipeStub({
      id: 'pc-walk-1',
      instanceId: 'inst_7f3a9c21',
      runId: 'run_2',
    });

    mantineRenderAdapter({ ui: <FlowRecipeRowLayerWidget recipe={recipe} /> });

    expect(proxy.getName()).toBe('pc-walk-1');
    expect(proxy.getCitation()).toBe('inst_7f3a9c21 / run_2');
  });
});
