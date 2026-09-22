/**
 * PURPOSE: Renders the seed recipes a flow's walk starts from, so a reader of the SPEC tab can see
 * what starting state proved this flow without leaving the diagram. `flow.recipes[]` carries no
 * nodeId (see `flowContract`'s JSDoc — an id-bearing array upserted wholesale, like
 * `offMapSignoffs`), so this is a flow-level callout on the canvas itself rather than a per-node
 * panel section.
 *
 * USAGE:
 * <FlowRecipeCalloutLayerWidget recipes={flow.recipes} />
 * // Renders FLOW_RECIPE_CALLOUT listing each recipe's name and proving run, or nothing when empty
 */

import type { FlowRecipe } from '@dungeonmaster/shared/contracts';

import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { FlowRecipeRowLayerWidget } from './flow-recipe-row-layer-widget';

export interface FlowRecipeCalloutLayerWidgetProps {
  recipes: readonly FlowRecipe[];
}

const { colors } = emberDepthsThemeStatics;

export const FlowRecipeCalloutLayerWidget = ({
  recipes,
}: FlowRecipeCalloutLayerWidgetProps): React.JSX.Element | null => {
  // No empty-state box: a flow with no seed recipes yet says nothing about it, rather than showing
  // a "none" placeholder on every canvas that has not been walked yet.
  if (recipes.length === 0) {
    return null;
  }

  return (
    <div
      data-testid="FLOW_RECIPE_CALLOUT"
      style={{
        // Top-left: the detail panel floats top-right and the zoom controls float bottom-left, so
        // this is the one corner of FLOW_DIAGRAM nothing else claims.
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 5,
        background: colors['bg-raised'],
        border: `1px solid ${colors.border}`,
        borderRadius: 8,
        padding: 12,
        maxWidth: 280,
        color: colors.text,
        fontFamily: emberDepthsThemeStatics.typography.font,
        fontSize: 12,
      }}
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: 11,
          color: colors['text-dim'],
          marginBottom: 6,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        SEEDS FROM
      </div>
      {recipes.map((recipe) => (
        <FlowRecipeRowLayerWidget key={String(recipe.id)} recipe={recipe} />
      ))}
    </div>
  );
};
