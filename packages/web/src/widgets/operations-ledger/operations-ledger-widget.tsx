/**
 * PURPOSE: Renders the quest operations ledger — the ordered plan/status record driving dispatch —
 * as a pixel-art monospace checklist shared by the execution panel and the quest spec panel
 *
 * USAGE:
 * <OperationsLedgerWidget operations={quest.operations} flows={quest.flows} />
 * // Renders one [x]/[>]/[ ] row per operation item — the flows it lands on first, its text
 * // underneath; renders nothing when operations is empty
 */

import { Box } from '@mantine/core';

import type { Flow, OperationItem } from '@dungeonmaster/shared/contracts';

import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { OperationRowLayerWidget } from './operation-row-layer-widget';

export interface OperationsLedgerWidgetProps {
  operations: readonly OperationItem[];
  flows: readonly Flow[];
}

const LEDGER_PADDING = 8;

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
        <OperationRowLayerWidget key={op.id} operation={op} flows={flows} />
      ))}
    </Box>
  );
};
