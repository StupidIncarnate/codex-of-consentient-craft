/**
 * PURPOSE: Renders a tool result inline within a tool call block, showing result content with truncation and error states
 *
 * USAGE:
 * <ToolResultInlineLayerWidget toolResult={resultEntry} />
 * // Renders result label and content inline beneath the tool call input
 */

import { Box, Text } from '@mantine/core';
import { useState } from 'react';

import type { ChatEntry } from '@dungeonmaster/shared/contracts';
import { shouldTruncateContentGuard } from '../../guards/should-truncate-content/should-truncate-content-guard';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { truncateContentTransformer } from '../../transformers/truncate-content/truncate-content-transformer';

type ToolResultEntry = Extract<ChatEntry, { type: 'tool_result' }>;

const LABEL_FONT_WEIGHT = 600;

export interface ToolResultInlineLayerWidgetProps {
  toolResult: ToolResultEntry;
  resultTokenBadgeElement?: React.JSX.Element | null;
}

export const ToolResultInlineLayerWidget = ({
  toolResult,
  resultTokenBadgeElement,
}: ToolResultInlineLayerWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  const [resultExpanded, setResultExpanded] = useState(false);

  const isSkipped = toolResult.content.includes('Sibling tool call errored');
  const isHookBlocked =
    toolResult.isError === true &&
    (toolResult.content.startsWith('PreToolUse:') || toolResult.content.startsWith('PostToolUse:'));
  const isToolError = toolResult.isError === true;

  if (isSkipped) {
    return (
      <Box
        data-testid="TOOL_RESULT_INLINE"
        mt={4}
        style={{ borderTop: `1px solid ${colors['bg-raised']}`, paddingTop: 4 }}
      >
        <Text ff="monospace" size="xs" fw={LABEL_FONT_WEIGHT} style={{ color: colors.warning }}>
          SKIPPED
        </Text>
        <Text ff="monospace" size="xs" style={{ color: colors.warning }}>
          This tool call was skipped because another tool call in the same batch failed.
        </Text>
      </Box>
    );
  }

  const resultLabel = isHookBlocked ? 'HOOK BLOCKED' : isToolError ? 'TOOL ERROR' : 'RESULT';
  const resultColor = isHookBlocked || isToolError ? colors.danger : colors['text-dim'];
  const needsTruncation = shouldTruncateContentGuard({ content: toolResult.content });

  return (
    <Box
      data-testid="TOOL_RESULT_INLINE"
      mt={4}
      style={{ borderTop: `1px solid ${colors['bg-raised']}`, paddingTop: 4 }}
    >
      <Text ff="monospace" size="xs" fw={LABEL_FONT_WEIGHT} mb={2} style={{ color: resultColor }}>
        {resultLabel}
      </Text>
      {resultTokenBadgeElement !== undefined && resultTokenBadgeElement !== null
        ? resultTokenBadgeElement
        : null}
      {needsTruncation && !resultExpanded ? (
        <Box>
          <Text
            ff="monospace"
            size="xs"
            style={{
              color: resultColor,
              whiteSpace: 'pre-wrap',
              maskImage: `linear-gradient(to bottom, ${resultColor} calc(100% - 30px), transparent)`,
              WebkitMaskImage: `linear-gradient(to bottom, ${resultColor} calc(100% - 30px), transparent)`,
            }}
          >
            {truncateContentTransformer({ content: toolResult.content })}
          </Text>
          <Text
            data-testid="TOOL_RESULT_TRUNCATION_TOGGLE"
            ff="monospace"
            size="xs"
            style={{ color: colors.primary, cursor: 'pointer' }}
            onClick={() => {
              setResultExpanded(true);
            }}
          >
            Show full result
          </Text>
        </Box>
      ) : needsTruncation && resultExpanded ? (
        <Box>
          <Text
            ff="monospace"
            size="xs"
            style={{
              color: resultColor,
              whiteSpace: 'pre-wrap',
              maxHeight: 300,
              overflowY: 'auto',
            }}
          >
            {toolResult.content}
          </Text>
          <Text
            ff="monospace"
            size="xs"
            style={{ color: colors.primary, cursor: 'pointer' }}
            onClick={() => {
              setResultExpanded(false);
            }}
          >
            Collapse
          </Text>
        </Box>
      ) : (
        <Text ff="monospace" size="xs" style={{ color: resultColor, whiteSpace: 'pre-wrap' }}>
          {toolResult.content}
        </Text>
      )}
    </Box>
  );
};
