/**
 * PURPOSE: Renders one row of the operations ledger — status marker, role badge, the flows it
 * lands on (if any) with its description underneath, and an optional ward-mode suffix. Extracted
 * from the ledger's `.map` so that callback names a widget instead of building the row inline.
 *
 * USAGE:
 * <OperationRowLayerWidget operation={operation} flows={flows} />
 * // Renders one [x]/[>]/[ ] row for the given operation
 */

import { Box, Text } from '@mantine/core';

import type { Flow, OperationItem } from '@dungeonmaster/shared/contracts';

import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { operationFlowLabelsTransformer } from '../../transformers/operation-flow-labels/operation-flow-labels-transformer';

const ROW_FONT_SIZE = 10;
const ROW_GAP = 6;
const ROW_PADDING_VERTICAL = 2;
const MARKER_WIDTH = 24;

const STATUS_MARKERS = {
  complete: '[x]',
  in_progress: '[>]',
  pending: '[ ]',
} as const;

const STATUS_COLOR_KEYS = {
  complete: 'success',
  in_progress: 'primary',
  pending: 'text-dim',
} as const;

export interface OperationRowLayerWidgetProps {
  operation: OperationItem;
  flows: readonly Flow[];
}

export const OperationRowLayerWidget = ({
  operation,
  flows,
}: OperationRowLayerWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;

  return (
    <Box
      data-testid="OPERATIONS_LEDGER_ROW"
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: ROW_GAP,
        padding: `${ROW_PADDING_VERTICAL}px 0`,
      }}
    >
      <Text
        ff="monospace"
        data-testid="OPERATIONS_LEDGER_ROW_MARKER"
        style={{
          fontSize: ROW_FONT_SIZE,
          color: colors[STATUS_COLOR_KEYS[operation.status]],
          width: MARKER_WIDTH,
          flexShrink: 0,
        }}
      >
        {STATUS_MARKERS[operation.status]}
      </Text>
      <Text
        ff="monospace"
        data-testid="OPERATIONS_LEDGER_ROW_ROLE"
        style={{
          fontSize: ROW_FONT_SIZE,
          color: colors.primary,
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        [{operation.role.toUpperCase()}]
      </Text>
      {/* Flow first, description underneath — the flow is what the row is FOR, and the text
          is the scope within it. */}
      <Box style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        {operation.flowIds.length > 0 ? (
          <Text
            ff="monospace"
            data-testid="OPERATIONS_LEDGER_ROW_FLOWS"
            style={{ fontSize: ROW_FONT_SIZE, color: colors['loot-rare'], fontWeight: 600 }}
          >
            [
            {operationFlowLabelsTransformer({ flowIds: operation.flowIds, flows })
              .map((label) => String(label))
              .join(', ')}
            ]
          </Text>
        ) : null}
        <Text
          ff="monospace"
          data-testid="OPERATIONS_LEDGER_ROW_TEXT"
          style={{ fontSize: ROW_FONT_SIZE, color: colors.text }}
        >
          {operation.text}
        </Text>
      </Box>
    </Box>
  );
};
