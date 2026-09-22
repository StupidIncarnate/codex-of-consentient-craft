import { screen } from '@testing-library/react';

import { FlowRecipeRowLayerWidgetProxy } from './flow-recipe-row-layer-widget.proxy';

interface FlowRecipeCalloutLayerWidgetProxyResult {
  hasCallout: () => boolean;
  getRecipeNames: () => HTMLElement['textContent'][];
  getRecipeCitations: () => HTMLElement['textContent'][];
}

export const FlowRecipeCalloutLayerWidgetProxy = (): FlowRecipeCalloutLayerWidgetProxyResult => {
  // No dependency of its own to mock — the row layer renders real, addressed here only to satisfy
  // the "implementation imports a layer, proxy imports its proxy" rule.
  FlowRecipeRowLayerWidgetProxy();

  return {
    hasCallout: (): boolean => screen.queryByTestId('FLOW_RECIPE_CALLOUT') !== null,
    getRecipeNames: (): HTMLElement['textContent'][] =>
      screen.queryAllByTestId('FLOW_RECIPE_NAME').map((el) => el.textContent),
    getRecipeCitations: (): HTMLElement['textContent'][] =>
      screen.queryAllByTestId('FLOW_RECIPE_CITATION').map((el) => el.textContent),
  };
};
