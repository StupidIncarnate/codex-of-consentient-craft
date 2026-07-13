/**
 * PURPOSE: Renders the quest operations ledger — the ordered plan/status record driving dispatch —
 * as a pixel-art monospace checklist shared by the execution panel and the quest spec panel
 *
 * USAGE:
 * <OperationsLedgerWidget operations={quest.operations} />
 * // Renders one [x]/[>]/[ ] row per operation item; renders nothing when operations is empty
 */

import { Box, Text } from '@mantine/core';

import type { OperationItem } from '@dungeonmaster/shared/contracts';

import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

export interface OperationsLedgerWidgetProps {
  operations: readonly OperationItem[];
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
          <Text
            ff="monospace"
            data-testid="OPERATIONS_LEDGER_ROW_TEXT"
            style={{ fontSize: ROW_FONT_SIZE, color: colors.text, flex: 1 }}
          >
            {op.text}
          </Text>
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
