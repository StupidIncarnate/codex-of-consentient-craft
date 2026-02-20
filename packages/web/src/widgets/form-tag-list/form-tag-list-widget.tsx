/**
 * PURPOSE: Renders a read-only list of tags with label prefix and Ember Depths theme styling
 *
 * USAGE:
 * <FormTagListWidget label={label} items={items} />
 * // Renders labeled tag chips in loot-rare color, or "none" when empty
 */

import { Group, Text } from '@mantine/core';

import type { SectionLabel } from '../../contracts/section-label/section-label-contract';
import type { TagItem } from '../../contracts/tag-item/tag-item-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

const TAG_FONT_SIZE = 10;
const BORDER_RADIUS = 2;
const TAG_PADDING = '0 4px';

export interface FormTagListWidgetProps {
  label: SectionLabel;
  items: TagItem[];
}

export const FormTagListWidget = ({ label, items }: FormTagListWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;

  return (
    <Group gap={4} mt={2} data-testid="FORM_TAG_LIST">
      <Text ff="monospace" style={{ fontSize: TAG_FONT_SIZE, color: colors['text-dim'] }}>
        {label}:
      </Text>
      {items.map((item, index) => (
        <Text
          key={`${item}-${String(index)}`}
          ff="monospace"
          data-testid="FORM_TAG_ITEM"
          style={{
            fontSize: TAG_FONT_SIZE,
            color: colors['loot-rare'],
            backgroundColor: colors['bg-deep'],
            border: `1px solid ${colors.border}`,
            borderRadius: BORDER_RADIUS,
            padding: TAG_PADDING,
          }}
        >
          {item}
        </Text>
      ))}
      {items.length === 0 && (
        <Text
          ff="monospace"
          data-testid="FORM_TAG_EMPTY"
          style={{ fontSize: TAG_FONT_SIZE, color: colors['text-dim'] }}
        >
          none
        </Text>
      )}
    </Group>
  );
};
