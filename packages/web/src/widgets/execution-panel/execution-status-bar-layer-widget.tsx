/**
 * PURPOSE: Displays the execution progress status bar. `source` says which count is on screen: the
 * quest PROJECTION's own step walk (`'projection'`), or the raw operations ledger (`'ledger'`) —
 * the caller's fallback for while the projection is loading or after it failed to fetch. The unit
 * word carries that distinction (STEPS vs. OPERATIONS) so a reader never mistakes one count for the
 * other; see `execution-panel-widget.tsx` for which one it picks and why.
 *
 * USAGE:
 * <ExecutionStatusBarLayerWidget completedCount={completedCount} totalCount={totalCount} source="projection" />
 * // Renders "EXECUTION — 3/8 STEPS" (source: 'projection'), "EXECUTION — 3/8 OPERATIONS"
 * // (source: 'ledger'), or "EXECUTION — AWAITING PLAN" when totalCount is 0
 */

import { Group, Text } from '@mantine/core';

import type { CompletedCount } from '@dungeonmaster/shared/contracts';
import type { TotalCount } from '@dungeonmaster/shared/contracts';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

export interface ExecutionStatusBarLayerWidgetProps {
  completedCount: CompletedCount;
  totalCount: TotalCount;
  source: 'projection' | 'ledger';
}

const PROGRESS_UNIT_LABEL = {
  projection: 'STEPS',
  ledger: 'OPERATIONS',
} as const;

export const ExecutionStatusBarLayerWidget = ({
  completedCount,
  totalCount,
  source,
}: ExecutionStatusBarLayerWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;

  return (
    <Group
      data-testid="execution-status-bar-layer-widget"
      justify="space-between"
      px={12}
      py={6}
      style={{ borderBottom: `1px solid ${colors.border}` }}
    >
      <Text ff="monospace" size="xs" fw={600} style={{ color: colors.primary }}>
        EXECUTION
      </Text>
      <Text ff="monospace" size="xs" fw={600} style={{ color: colors['text-dim'] }}>
        {totalCount > 0
          ? `${completedCount}/${totalCount} ${PROGRESS_UNIT_LABEL[source]}`
          : 'AWAITING PLAN'}
      </Text>
    </Group>
  );
};
