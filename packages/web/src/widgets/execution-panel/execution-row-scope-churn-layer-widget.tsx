/**
 * PURPOSE: Renders the churn view (27c) — for every unit two or more of a scope's work items marked,
 * the sequence of marks in the order those work items ran, e.g. "unmet (work) → met (review)". Its
 * natural home is a scope HEADER row's expanded detail: a bare row's scope holds only one visible
 * work item, so it has no sequence to show. A layer file so the transformer call and the arrow-join
 * sit outside ExecutionRowLayerWidget's own function body, which is already at the repo's
 * `complexity: max 50` ceiling.
 *
 * USAGE:
 * <ExecutionRowScopeChurnLayerWidget scopeWorkItems={scopeWorkItems} />
 * // Renders "<unitId>: unmet (work) → met (review)" per churned unit, or nothing when no unit in the
 * // scope was marked by two or more work items
 */

import { Box, Text } from '@mantine/core';

import type { WorkItem } from '@dungeonmaster/shared/contracts';

import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { scopeUnitChurnTransformer } from '../../transformers/scope-unit-churn/scope-unit-churn-transformer';

const FONT_SIZE = 10;
const MARGIN_BOTTOM = 4;
const ARROW = '→';

export interface ExecutionRowScopeChurnLayerWidgetProps {
  // A REQUIRED prop typed `| undefined`, not `?:` — the caller (ExecutionRowLayerWidget) is at the
  // repo's `complexity: max 50` ceiling, and `exactOptionalPropertyTypes` would otherwise force it
  // to wrap this in a spread to satisfy an optional prop. Undefined for every row but a scope header.
  scopeWorkItems: WorkItem[] | undefined;
}

export const ExecutionRowScopeChurnLayerWidget = ({
  scopeWorkItems,
}: ExecutionRowScopeChurnLayerWidgetProps): React.JSX.Element | null => {
  const { colors } = emberDepthsThemeStatics;
  const churns = scopeUnitChurnTransformer({ workItems: scopeWorkItems ?? [] });
  if (churns.length === 0) {
    return null;
  }
  return (
    <Box data-testid="execution-row-scope-churn" style={{ marginBottom: MARGIN_BOTTOM }}>
      {churns.map((churn) => (
        <Text
          key={churn.unitId}
          ff="monospace"
          data-testid="execution-row-scope-churn-entry"
          style={{ fontSize: FONT_SIZE, color: colors['text-dim'] }}
        >
          {`${churn.unitId}: ${churn.marks
            .map((step) => `${step.mark} (${step.workItemLabel})`)
            .join(` ${ARROW} `)}`}
        </Text>
      ))}
    </Box>
  );
};
