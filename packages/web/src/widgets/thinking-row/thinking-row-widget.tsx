/**
 * PURPOSE: Renders a thinking block row with label and full content, styled consistently with tool rows
 *
 * USAGE:
 * <ThinkingRowWidget entry={thinkingEntry} />
 * // Renders THINKING label with full thinking content beneath
 */

import { Box, Text } from '@mantine/core';

import type { ChatEntry } from '../../contracts/chat-entry/chat-entry-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

type ThinkingEntry = Extract<ChatEntry, { type: 'thinking' }>;

export interface ThinkingRowWidgetProps {
  entry: ThinkingEntry;
}

const LABEL_FONT_SIZE = 11;
const DETAIL_FONT_SIZE = 10;
const MODEL_FONT_SIZE = 10;

export const ThinkingRowWidget = ({ entry }: ThinkingRowWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  const modelLabel = entry.model;

  return (
    <Box
      data-testid="THINKING_ROW"
      style={{
        backgroundColor: colors['bg-raised'],
        borderLeft: `3px solid ${colors['text-dim']}`,
        borderRadius: 2,
        marginBottom: 2,
        padding: '4px 8px',
      }}
    >
      <Text
        ff="monospace"
        fw={600}
        data-testid="THINKING_ROW_LABEL"
        style={{
          fontSize: LABEL_FONT_SIZE,
          color: colors['text-dim'],
          marginBottom: 2,
        }}
      >
        THINKING
        {modelLabel === undefined ? null : (
          <Text
            component="span"
            ff="monospace"
            style={{ fontSize: MODEL_FONT_SIZE, color: colors['text-dim'], fontWeight: 400 }}
          >
            {' '}
            {modelLabel}
          </Text>
        )}
      </Text>
      <Text
        ff="monospace"
        data-testid="THINKING_ROW_CONTENT"
        style={{
          fontSize: DETAIL_FONT_SIZE,
          color: colors['text-dim'],
          whiteSpace: 'pre-wrap',
        }}
      >
        {entry.content}
      </Text>
    </Box>
  );
};
