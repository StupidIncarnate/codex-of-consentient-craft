/**
 * PURPOSE: Renders one recipe row inside FlowRecipeCalloutLayerWidget — the recipe's name and the
 * run that proved it. Layer widget for that callout's `.map`, whose callback would otherwise return
 * an anonymous JSX tree.
 *
 * USAGE:
 * <FlowRecipeRowLayerWidget recipe={flowRecipe} />
 * // Renders FLOW_RECIPE_ROW with the recipe's id and its instanceId/runId citation
 */

import type { FlowRecipe } from '@dungeonmaster/shared/contracts';

import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

export interface FlowRecipeRowLayerWidgetProps {
  recipe: FlowRecipe;
}

const { colors } = emberDepthsThemeStatics;

export const FlowRecipeRowLayerWidget = ({
  recipe,
}: FlowRecipeRowLayerWidgetProps): React.JSX.Element => (
  <div data-testid="FLOW_RECIPE_ROW" style={{ marginBottom: 4 }}>
    <div data-testid="FLOW_RECIPE_NAME" style={{ fontWeight: 600, color: colors.primary }}>
      {recipe.id}
    </div>
    <div data-testid="FLOW_RECIPE_CITATION" style={{ color: colors['text-dim'], paddingLeft: 8 }}>
      {recipe.instanceId} / {recipe.runId}
    </div>
  </div>
);
