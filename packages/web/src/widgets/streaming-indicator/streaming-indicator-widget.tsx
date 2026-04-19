/**
 * PURPOSE: Animated dumpster-raid planning indicator shown at the end of the chat message list while an agent is streaming. Orange for the main chaos agent, purple when a sub-agent is active.
 *
 * USAGE:
 * <StreamingIndicatorWidget isSubagent={false} />
 * // Renders animated row with cycling sparkle glyph, planning verb, and dot ellipsis
 */

import { Box, Text } from '@mantine/core';
import { useEffect, useState } from 'react';

import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { streamingIndicatorConfigStatics } from '../../statics/streaming-indicator-config/streaming-indicator-config-statics';

const LABEL_FONT_SIZE = 12;
const FALLBACK_GLYPH = '\u2726';
const FALLBACK_VERB = 'Casing the alley';

export interface StreamingIndicatorWidgetProps {
  isSubagent: boolean;
}

export const StreamingIndicatorWidget = ({
  isSubagent,
}: StreamingIndicatorWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  const { tickMs, verbMinMs, verbMaxMs, sparkleGlyphs, dotStates, verbs } =
    streamingIndicatorConfigStatics;
  const [tick, setTick] = useState(0);
  const [verbIndex, setVerbIndex] = useState(() => Math.floor(Math.random() * verbs.length));

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((prev) => prev + 1);
    }, tickMs);
    return () => {
      clearInterval(timer);
    };
  }, [tickMs]);

  useEffect(() => {
    const delay = verbMinMs + Math.random() * (verbMaxMs - verbMinMs);
    const timer = setTimeout(() => {
      setVerbIndex((prev) => (prev + 1) % verbs.length);
    }, delay);
    return () => {
      clearTimeout(timer);
    };
  }, [verbIndex, verbMinMs, verbMaxMs, verbs.length]);

  const glyph = sparkleGlyphs[tick % sparkleGlyphs.length] ?? FALLBACK_GLYPH;
  const dots = dotStates[tick % dotStates.length] ?? '';
  const verb = verbs[verbIndex % verbs.length] ?? FALLBACK_VERB;

  const accentColor = isSubagent ? colors['loot-rare'] : colors.primary;

  return (
    <Box
      data-testid="STREAMING_INDICATOR"
      style={{
        backgroundColor: colors['bg-raised'],
        borderLeft: `3px solid ${accentColor}`,
        borderRadius: 2,
        marginBottom: 2,
        padding: '6px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <Text
        ff="monospace"
        fw={700}
        data-testid="STREAMING_INDICATOR_TEXT"
        style={{
          fontSize: LABEL_FONT_SIZE,
          color: accentColor,
          letterSpacing: 2,
        }}
      >
        {`${glyph}  ${verb}${dots}  ${glyph}`}
      </Text>
    </Box>
  );
};
