/**
 * PURPOSE: Renders a decorative map-style frame with unicode corner characters
 *
 * USAGE:
 * <MapFrameWidget>{children}</MapFrameWidget>
 * // Renders a bordered box with corner decorations containing children
 */

import { Box, Text } from '@mantine/core';

import type { CssPixels } from '@dungeonmaster/shared/contracts';

import { cssPixelsContract } from '@dungeonmaster/shared/contracts';

import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { mapFrameStatics } from '../../statics/map-frame/map-frame-statics';

const defaultMinHeight = cssPixelsContract.parse(mapFrameStatics.defaultMinHeight);
const defaultMaxWidth = cssPixelsContract.parse(mapFrameStatics.defaultMaxWidth);
const defaultPadding = cssPixelsContract.parse(mapFrameStatics.defaultPadding);

export interface MapFrameWidgetProps {
  children: React.ReactNode;
  minHeight?: CssPixels;
  maxWidth?: CssPixels;
  padding?: CssPixels;
}

export const MapFrameWidget = ({
  children,
  minHeight = defaultMinHeight,
  maxWidth = defaultMaxWidth,
  padding = defaultPadding,
}: MapFrameWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  const { border } = colors;
  const dim = colors['text-dim'];

  return (
    <Box
      data-testid="MAP_FRAME"
      style={{
        border: `2px solid ${border}`,
        borderRadius: 2,
        padding,
        position: 'relative',
        minHeight,
        width: '100%',
        maxWidth,
        display: 'flex',
        flexDirection: 'column' as const,
        flex: 1,
      }}
    >
      <Text
        ff="monospace"
        size="xs"
        data-testid="CORNER_TOP_LEFT"
        style={{ color: dim, position: 'absolute', top: -1, left: 8 }}
      >
        {'\u250C\u2500\u2500'}
      </Text>
      <Text
        ff="monospace"
        size="xs"
        data-testid="CORNER_TOP_RIGHT"
        style={{ color: dim, position: 'absolute', top: -1, right: 8 }}
      >
        {'\u2500\u2500\u2510'}
      </Text>
      <Text
        ff="monospace"
        size="xs"
        data-testid="CORNER_BOTTOM_LEFT"
        style={{ color: dim, position: 'absolute', bottom: -1, left: 8 }}
      >
        {'\u2514\u2500\u2500'}
      </Text>
      <Text
        ff="monospace"
        size="xs"
        data-testid="CORNER_BOTTOM_RIGHT"
        style={{ color: dim, position: 'absolute', bottom: -1, right: 8 }}
      >
        {'\u2500\u2500\u2518'}
      </Text>
      {children}
    </Box>
  );
};
