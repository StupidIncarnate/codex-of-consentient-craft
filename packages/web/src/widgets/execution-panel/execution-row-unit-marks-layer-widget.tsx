/**
 * PURPOSE: Renders the ASSIGNED-vs-MARKED readout for one work item's units (27c) — a summary count
 * plus one line per assigned unit not already marked `unmet`, since `ExecutionRowUnmetListLayerWidget`
 * owns that mark's own detail (evidence and `toSettle`) elsewhere in the same expanded row. A layer
 * file so the transformer call and the unmet exclusion sit outside ExecutionRowLayerWidget's own
 * function body, which is already at the repo's `complexity: max 50` ceiling.
 *
 * USAGE:
 * <ExecutionRowUnitMarksLayerWidget workItem={workItem} />
 * // Renders "Units: 2/3 marked" plus "[met] <unitId>" / "[cant-meet] <unitId>" /
 * // "[unmarked] <unitId>" lines, or nothing when the work item was assigned no units
 */

import { Box, Text } from '@mantine/core';

import type { WorkItem } from '@dungeonmaster/shared/contracts';

import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { workItemUnitMarksTransformer } from '../../transformers/work-item-unit-marks/work-item-unit-marks-transformer';

const FONT_SIZE = 10;
const MARGIN_BOTTOM = 4;

export interface ExecutionRowUnitMarksLayerWidgetProps {
  // A REQUIRED prop typed `| undefined`, not `?:` — the caller (ExecutionRowLayerWidget) is at the
  // repo's `complexity: max 50` ceiling, and `exactOptionalPropertyTypes` would otherwise force it
  // to wrap this in a spread to satisfy an optional prop. Takes the whole work item, not
  // `assignedUnitIds`/`observations` alone, so the `workItem?.` reads happen inside the transformer.
  workItem: WorkItem | undefined;
}

export const ExecutionRowUnitMarksLayerWidget = ({
  workItem,
}: ExecutionRowUnitMarksLayerWidgetProps): React.JSX.Element | null => {
  const { colors } = emberDepthsThemeStatics;
  const assignedCount = workItem?.assignedUnitIds.length ?? 0;
  if (assignedCount === 0) {
    return null;
  }
  const markedCount = workItem?.observations.length ?? 0;
  // `unmet` is ExecutionRowUnmetListLayerWidget's own detail — excluded here so the two widgets
  // together cover every mark exactly once instead of both listing the same unit.
  const remainder = workItemUnitMarksTransformer({ workItem }).filter(
    (readout) => readout.mark !== 'unmet',
  );

  return (
    <Box data-testid="execution-row-unit-marks" style={{ marginBottom: MARGIN_BOTTOM }}>
      <Text
        ff="monospace"
        data-testid="execution-row-unit-marks-summary"
        style={{ fontSize: FONT_SIZE, color: colors['text-dim'] }}
      >
        Units: {markedCount}/{assignedCount} marked
      </Text>
      {remainder.map((readout) => (
        <Text
          key={readout.unitId}
          ff="monospace"
          data-testid="execution-row-unit-mark"
          style={{ fontSize: FONT_SIZE, color: colors['text-dim'] }}
        >
          [{readout.mark}] {readout.unitId}
        </Text>
      ))}
    </Box>
  );
};
