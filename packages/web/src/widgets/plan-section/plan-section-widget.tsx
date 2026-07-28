/**
 * PURPOSE: Renders a generic plan section container with a title and a read-only item list
 *
 * USAGE:
 * <PlanSectionWidget title={title} items={steps} renderItem={(item) => <div>{item.text}</div>} />
 * // Renders section header with count and the item list
 */

import { Box, Stack } from '@mantine/core';

import type { SectionCount } from '../../contracts/section-count/section-count-contract';
import type { SectionLabel } from '../../contracts/section-label/section-label-contract';
import { SectionHeaderWidget } from '../section-header/section-header-widget';

export interface PlanSectionWidgetProps<T> {
  title: SectionLabel;
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
}

export const PlanSectionWidget = <T,>({
  title,
  items,
  renderItem,
}: PlanSectionWidgetProps<T>): React.JSX.Element => (
  <Box mb="sm" data-testid="PLAN_SECTION">
    <Box mb={4}>
      <SectionHeaderWidget label={title} count={items.length as SectionCount} />
    </Box>
    <Stack gap={4}>
      {items.map((item, index) => (
        <Box key={String(index)} style={{ minWidth: 0 }}>
          {renderItem(item, index)}
        </Box>
      ))}
    </Stack>
  </Box>
);
