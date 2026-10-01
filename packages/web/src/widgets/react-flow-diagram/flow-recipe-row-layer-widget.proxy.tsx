import { screen } from '#gateway/npm/testing-library__react';

interface FlowRecipeRowLayerWidgetProxyResult {
  getName: () => Node['textContent'];
  getCitation: () => Node['textContent'];
}

export const FlowRecipeRowLayerWidgetProxy = (): FlowRecipeRowLayerWidgetProxyResult => ({
  getName: (): Node['textContent'] => screen.queryByTestId('FLOW_RECIPE_NAME')?.textContent ?? null,
  getCitation: (): Node['textContent'] =>
    screen.queryByTestId('FLOW_RECIPE_CITATION')?.textContent ?? null,
});
