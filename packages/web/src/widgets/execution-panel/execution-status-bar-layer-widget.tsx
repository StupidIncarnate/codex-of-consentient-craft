/**
 * PURPOSE: Displays execution progress status bar with phase and completion count
 *
 * USAGE:
 * <ExecutionStatusBarLayerWidget completedCount={completedCount} totalCount={totalCount} isPlanning={false} />
 * // Renders "EXECUTION — 3/8 COMPLETE"
 */

import { Group, Text } from '@mantine/core';

import type { CompletedCount } from '../../contracts/completed-count/completed-count-contract';
import type { TotalCount } from '../../contracts/total-count/total-count-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

export interface ExecutionStatusBarLayerWidgetProps {
  completedCount: CompletedCount;
  totalCount: TotalCount;
  isPlanning: boolean;
}

export const ExecutionStatusBarLayerWidget = ({
  completedCount,
  totalCount,
  isPlanning,
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
        {isPlanning ? 'PLANNING' : `${completedCount}/${totalCount} COMPLETE`}
      </Text>
    </Group>
  );
};
