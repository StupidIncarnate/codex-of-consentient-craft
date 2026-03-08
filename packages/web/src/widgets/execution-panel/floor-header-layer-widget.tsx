/**
 * PURPOSE: Renders a floor section header with dash separators and optional concurrent count
 *
 * USAGE:
 * <FloorHeaderLayerWidget floorNumber={floorNumber} name={name} concurrent={{active: activeCount, max: maxCount}} />
 * // Renders "── FLOOR 1: CARTOGRAPHY ──────" with "Concurrent: 2/3"
 */

import { Group, Text } from '@mantine/core';

import type { FloorName } from '../../contracts/floor-name/floor-name-contract';
import type { FloorNumber } from '../../contracts/floor-number/floor-number-contract';
import type { SlotCount } from '../../contracts/slot-count/slot-count-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

export interface FloorHeaderLayerWidgetProps {
  floorNumber: FloorNumber;
  name: FloorName;
  concurrent?: {
    active: SlotCount;
    max: SlotCount;
  };
}

const DASH_FONT_SIZE = 10;
const LABEL_FONT_WEIGHT = 600;

export const FloorHeaderLayerWidget = ({
  floorNumber,
  name,
  concurrent,
}: FloorHeaderLayerWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;

  return (
    <Group
      data-testid="floor-header-layer-widget"
      gap={4}
      align="center"
      mt="sm"
      mb={6}
      style={{ overflow: 'hidden' }}
    >
      <Text
        ff="monospace"
        style={{ fontSize: DASH_FONT_SIZE, color: colors['text-dim'], flexShrink: 0 }}
      >
        ──
      </Text>
      <Text
        ff="monospace"
        style={{
          fontSize: DASH_FONT_SIZE,
          color: colors.primary,
          flexShrink: 0,
          fontWeight: LABEL_FONT_WEIGHT,
        }}
      >
        FLOOR {floorNumber}: {name}
      </Text>
      <Text
        ff="monospace"
        style={{
          fontSize: DASH_FONT_SIZE,
          color: colors['text-dim'],
          flex: 1,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}
      >
        ──────────────────────────────────────────
      </Text>
      {concurrent ? (
        <Text
          ff="monospace"
          data-testid="floor-header-concurrent"
          style={{ fontSize: DASH_FONT_SIZE, color: colors['text-dim'], flexShrink: 0 }}
        >
          Concurrent: {concurrent.active}/{concurrent.max}
        </Text>
      ) : null}
    </Group>
  );
};
