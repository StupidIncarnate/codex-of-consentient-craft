/**
 * PURPOSE: Renders a generic plan section container with title, item list, and optional edit controls
 *
 * USAGE:
 * <PlanSectionWidget title={title} items={steps} renderItem={(item) => <div>{item.text}</div>} />
 * // Renders section header with count, item list, optional add/remove buttons in edit mode
 */

import { Box, Group, Stack } from '@mantine/core';

import type { ButtonLabel } from '../../contracts/button-label/button-label-contract';
import type { ButtonVariant } from '../../contracts/button-variant/button-variant-contract';
import type { SectionCount } from '../../contracts/section-count/section-count-contract';
import type { SectionLabel } from '../../contracts/section-label/section-label-contract';
import { PixelBtnWidget } from '../pixel-btn/pixel-btn-widget';
import { SectionHeaderWidget } from '../section-header/section-header-widget';

const ADD_LABEL = '+' as ButtonLabel;
const REMOVE_LABEL = 'x' as ButtonLabel;
const GHOST_VARIANT = 'ghost' as ButtonVariant;
const DANGER_VARIANT = 'danger' as ButtonVariant;

export interface PlanSectionWidgetProps<T> {
  title: SectionLabel;
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  editing?: boolean;
  onAdd?: () => void;
  onRemove?: (index: number) => void;
}

export const PlanSectionWidget = <T,>({
  title,
  items,
  renderItem,
  editing,
  onAdd,
  onRemove,
}: PlanSectionWidgetProps<T>): React.JSX.Element => (
  <Box mb="sm" data-testid="PLAN_SECTION">
    <Group justify="space-between" mb={4}>
      <SectionHeaderWidget label={title} count={items.length as SectionCount} />
      {editing && onAdd && (
        <PixelBtnWidget label={ADD_LABEL} onClick={onAdd} variant={GHOST_VARIANT} icon />
      )}
    </Group>
    <Stack gap={4}>
      {items.map((item, index) => (
        <Group key={String(index)} gap={4} wrap="nowrap" align="flex-start">
          {editing && onRemove && (
            <PixelBtnWidget
              label={REMOVE_LABEL}
              onClick={() => {
                onRemove(index);
              }}
              variant={DANGER_VARIANT}
              icon
            />
          )}
          <Box style={{ flex: 1 }}>{renderItem(item, index)}</Box>
        </Group>
      ))}
    </Stack>
  </Box>
);
