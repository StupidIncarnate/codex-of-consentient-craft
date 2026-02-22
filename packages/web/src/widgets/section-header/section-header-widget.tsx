/**
 * PURPOSE: Renders a section heading with primary color, optional count badge in monospace style
 *
 * USAGE:
 * <SectionHeaderWidget label={label} count={count} />
 * // Renders "OBJECTIVES (3)" in primary color with monospace xs fw600
 */

import { Group, Text } from '@mantine/core';

import type { SectionCount } from '../../contracts/section-count/section-count-contract';
import type { SectionLabel } from '../../contracts/section-label/section-label-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

export interface SectionHeaderWidgetProps {
  label: SectionLabel;
  count?: SectionCount;
}

export const SectionHeaderWidget = ({
  label,
  count,
}: SectionHeaderWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;

  return (
    <Group gap={6} mb={4} data-testid="SECTION_HEADER">
      <Text ff="monospace" size="xs" fw={600} style={{ color: colors.primary }}>
        {label}
      </Text>
      {count !== undefined && (
        <Text
          ff="monospace"
          size="xs"
          data-testid="SECTION_HEADER_COUNT"
          style={{ color: colors['text-dim'] }}
        >
          ({count})
        </Text>
      )}
    </Group>
  );
};
