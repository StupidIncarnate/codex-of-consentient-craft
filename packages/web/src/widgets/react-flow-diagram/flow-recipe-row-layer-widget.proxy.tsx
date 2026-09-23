import { screen } from '@testing-library/react';

interface FlowRecipeRowLayerWidgetProxyResult {
  getName: () => HTMLElement['textContent'];
  getCitation: () => HTMLElement['textContent'];
}

export const FlowRecipeRowLayerWidgetProxy = (): FlowRecipeRowLayerWidgetProxyResult => ({
  getName: (): HTMLElement['textContent'] =>
    screen.queryByTestId('FLOW_RECIPE_NAME')?.textContent ?? null,
  getCitation: (): HTMLElement['textContent'] =>
    screen.queryByTestId('FLOW_RECIPE_CITATION')?.textContent ?? null,
});
