/**
 * PURPOSE: Displays execution progress status bar with operations-ledger completion count
 *
 * USAGE:
 * <ExecutionStatusBarLayerWidget completedCount={completedCount} totalCount={totalCount} />
 * // Renders "EXECUTION — 3/8 OPERATIONS", or "EXECUTION — AWAITING PLAN" when totalCount is 0
 */

import { Group, Text } from '@mantine/core';

import type { CompletedCount } from '../../contracts/completed-count/completed-count-contract';
import type { TotalCount } from '../../contracts/total-count/total-count-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

export interface ExecutionStatusBarLayerWidgetProps {
  completedCount: CompletedCount;
  totalCount: TotalCount;
}

export const ExecutionStatusBarLayerWidget = ({
  completedCount,
  totalCount,
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
        {totalCount > 0 ? `${completedCount}/${totalCount} OPERATIONS` : 'AWAITING PLAN'}
      </Text>
    </Group>
  );
};
