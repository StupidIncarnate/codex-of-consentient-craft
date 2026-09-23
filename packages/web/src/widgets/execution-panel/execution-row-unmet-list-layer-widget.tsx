/**
 * PURPOSE: Renders a work item's `unmet`-marked observations (27f) — unit id and evidence, one line
 * each — near the row's own expanded detail. A layer file so the `workItem?.observations` read, the
 * filter, and the empty-list null check all sit outside ExecutionRowLayerWidget's own function
 * body, which is already at the repo's `complexity: max 50` ceiling.
 *
 * USAGE:
 * <ExecutionRowUnmetListLayerWidget workItem={workItem} />
 * // Renders one "[unmet] <unitId>: <evidence>" line per unmet mark, or nothing when there are none
 * // (a finished row with no unmet marks renders nothing extra)
 */

import { Box, Text } from '@mantine/core';

import type { WorkItem } from '@dungeonmaster/shared/contracts';

import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

const FONT_SIZE = 10;
const MARGIN_BOTTOM = 4;

export interface ExecutionRowUnmetListLayerWidgetProps {
  // A REQUIRED prop typed `| undefined`, not `?:` — the caller (ExecutionRowLayerWidget) is at the
  // repo's `complexity: max 50` ceiling, and `exactOptionalPropertyTypes` would otherwise force it
  // to wrap this in a spread to satisfy an optional prop. Passing `undefined` straight through to a
  // required prop costs nothing. Takes the whole work item, not `observations` alone, so the
  // `workItem?.` read happens here rather than adding a branch to the caller.
  workItem: WorkItem | undefined;
}

export const ExecutionRowUnmetListLayerWidget = ({
  workItem,
}: ExecutionRowUnmetListLayerWidgetProps): React.JSX.Element | null => {
  const { colors } = emberDepthsThemeStatics;
  const unmetObservations = (workItem?.observations ?? []).filter(
    (observation) => observation.mark === 'unmet',
  );
  if (unmetObservations.length === 0) {
    return null;
  }
  return (
    <Box data-testid="execution-row-unmet-list" style={{ marginBottom: MARGIN_BOTTOM }}>
      {unmetObservations.map((observation) => (
        <Text
          key={observation.unitId}
          ff="monospace"
          data-testid="execution-row-unmet-observation"
          style={{ fontSize: FONT_SIZE, color: colors.warning }}
        >
          [unmet] {observation.unitId}: {observation.evidence}
        </Text>
      ))}
    </Box>
  );
};
