/**
 * PURPOSE: Renders assistant thinking block with collapsible content and model label
 *
 * USAGE:
 * <ThinkingLayerWidget content={thinkingContent} model={model} />
 * // Renders THINKING label with collapsed content and expand toggle
 */

import { Box, Text } from '@mantine/core';
import { useState } from 'react';

import type { ChatEntry } from '../../contracts/chat-entry/chat-entry-contract';

type ThinkingEntry = Extract<ChatEntry, { type: 'thinking' }>;
import { shouldTruncateContentGuard } from '../../guards/should-truncate-content/should-truncate-content-guard';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { truncateContentTransformer } from '../../transformers/truncate-content/truncate-content-transformer';

const BORDER_WIDTH = '2px solid';
const LABEL_FONT_WEIGHT = 600;

export interface ThinkingLayerWidgetProps {
  entry: ThinkingEntry;
}

export const ThinkingLayerWidget = ({ entry }: ThinkingLayerWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  const [expanded, setExpanded] = useState(false);
  const thinkingContent = entry.content;
  const needsTruncation = shouldTruncateContentGuard({ content: thinkingContent });

  return (
    <Box
      data-testid="CHAT_MESSAGE"
      style={{
        padding: '6px 10px',
        borderRadius: 2,
        backgroundColor: 'transparent',
        borderLeft: `${BORDER_WIDTH} ${colors['text-dim']}`,
        borderRight: `${BORDER_WIDTH} ${colors['text-dim']}`,
        textAlign: 'left',
        paddingLeft: '15%',
      }}
    >
      <Text
        ff="monospace"
        size="xs"
        fw={LABEL_FONT_WEIGHT}
        mb={2}
        style={{ color: colors['text-dim'] }}
      >
        THINKING
        {'model' in entry && entry.model ? (
          <Text component="span" style={{ color: colors['text-dim'] }}>
            {' '}
            {entry.model}
          </Text>
        ) : null}
      </Text>
      <Text
        ff="monospace"
        size="xs"
        style={{
          color: colors['text-dim'],
          whiteSpace: 'pre-wrap',
          ...(needsTruncation && !expanded
            ? {
                maskImage: `linear-gradient(to bottom, black calc(100% - 30px), transparent)`,
                WebkitMaskImage: `linear-gradient(to bottom, black calc(100% - 30px), transparent)`,
              }
            : {}),
          ...(expanded ? { maxHeight: 300, overflowY: 'auto' as const } : {}),
        }}
      >
        {needsTruncation && !expanded
          ? truncateContentTransformer({ content: thinkingContent })
          : thinkingContent}
      </Text>
      {needsTruncation ? (
        <Text
          ff="monospace"
          size="xs"
          data-testid="THINKING_TOGGLE"
          style={{ color: colors.primary, cursor: 'pointer' }}
          onClick={() => {
            setExpanded(!expanded);
          }}
        >
          {expanded ? 'Collapse' : 'Show full thinking'}
        </Text>
      ) : null}
    </Box>
  );
};
