/**
 * PURPOSE: Renders an animated streaming indicator with pulsing block characters
 *
 * USAGE:
 * <StreamingBarLayerWidget />
 * // Renders "░░░░░░░░░░░░░░░░░░░░ streaming..." with pulse animation
 */

import { Box, Text } from '@mantine/core';

import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

const BLOCK_COUNT = 20;
const PULSE_ANIMATION = 'pulse 1.5s ease-in-out infinite';

export const StreamingBarLayerWidget = (): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;

  return (
    <Box
      data-testid="streaming-bar-layer-widget"
      style={{
        padding: '4px 8px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <Text
        ff="monospace"
        style={{
          fontSize: 10,
          color: colors['text-dim'],
          animation: PULSE_ANIMATION,
        }}
      >
        {'\u2591'.repeat(BLOCK_COUNT)} streaming...
      </Text>
    </Box>
  );
};
