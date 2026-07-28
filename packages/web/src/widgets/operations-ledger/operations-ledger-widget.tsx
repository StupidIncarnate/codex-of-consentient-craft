/**
 * PURPOSE: Renders the quest operations ledger — the ordered plan/status record driving dispatch —
 * as a pixel-art monospace checklist shared by the execution panel and the quest spec panel
 *
 * USAGE:
 * <OperationsLedgerWidget operations={quest.operations} flows={quest.flows} />
 * // Renders one [x]/[>]/[ ] row per operation item — the flows it lands on first, its text
 * // underneath; renders nothing when operations is empty
 */

import { Box, Text } from '@mantine/core';

import type { Flow, OperationItem } from '@dungeonmaster/shared/contracts';

import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { operationFlowLabelsTransformer } from '../../transformers/operation-flow-labels/operation-flow-labels-transformer';

export interface OperationsLedgerWidgetProps {
  operations: readonly OperationItem[];
  flows: readonly Flow[];
}

const ROW_FONT_SIZE = 10;
const ROW_GAP = 6;
const ROW_PADDING_VERTICAL = 2;
const LEDGER_PADDING = 8;
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

export const OperationsLedgerWidget = ({
  operations,
  flows,
}: OperationsLedgerWidgetProps): React.JSX.Element | null => {
  const { colors } = emberDepthsThemeStatics;

  if (operations.length === 0) {
    return null;
  }

  return (
    <Box
      data-testid="OPERATIONS_LEDGER"
      style={{
        fontFamily: 'monospace',
        border: `1px solid ${colors.border}`,
        backgroundColor: colors['bg-surface'],
        padding: LEDGER_PADDING,
        marginBottom: LEDGER_PADDING,
      }}
    >
      {operations.map((op) => (
        <Box
          key={op.id}
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
              color: colors[STATUS_COLOR_KEYS[op.status]],
              width: MARKER_WIDTH,
              flexShrink: 0,
            }}
          >
            {STATUS_MARKERS[op.status]}
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
            [{op.role.toUpperCase()}]
          </Text>
          {/* Flow first, description underneath — the flow is what the row is FOR, and the text
              is the scope within it. */}
          <Box style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
            {op.flowIds.length > 0 ? (
              <Text
                ff="monospace"
                data-testid="OPERATIONS_LEDGER_ROW_FLOWS"
                style={{ fontSize: ROW_FONT_SIZE, color: colors['loot-rare'], fontWeight: 600 }}
              >
                [
                {operationFlowLabelsTransformer({ flowIds: op.flowIds, flows })
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
              {op.text}
            </Text>
          </Box>
          {op.wardMode ? (
            <Text
              ff="monospace"
              data-testid="OPERATIONS_LEDGER_ROW_WARD_MODE"
              style={{ fontSize: ROW_FONT_SIZE, color: colors.warning, flexShrink: 0 }}
            >
              ({op.wardMode})
            </Text>
          ) : null}
        </Box>
      ))}
    </Box>
  );
};
