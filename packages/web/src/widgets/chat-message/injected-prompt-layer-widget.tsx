/**
 * PURPOSE: Renders a user message with injected prompt, splitting agent prompt from user request
 *
 * USAGE:
 * <InjectedPromptLayerWidget entry={userEntry} borderColor={color} label="YOU" />
 * // Renders collapsed AGENT PROMPT section above the user's actual request
 */

import { Box, Text } from '@mantine/core';
import { useState } from 'react';

import type { ChatEntry } from '../../contracts/chat-entry/chat-entry-contract';

type UserEntry = Extract<ChatEntry, { role: 'user' }>;
import { shouldTruncateContentGuard } from '../../guards/should-truncate-content/should-truncate-content-guard';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { truncateContentTransformer } from '../../transformers/truncate-content/truncate-content-transformer';

const BORDER_WIDTH = '2px solid';
const LABEL_FONT_WEIGHT = 600;

export interface InjectedPromptLayerWidgetProps {
  entry: UserEntry;
  borderColor: (typeof emberDepthsThemeStatics.colors)[keyof typeof emberDepthsThemeStatics.colors];
  label: 'YOU' | 'SUB-AGENT PROMPT';
}

export const InjectedPromptLayerWidget = ({
  entry,
  borderColor,
  label,
}: InjectedPromptLayerWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  const [expanded, setExpanded] = useState(false);

  const parts = entry.content.split('## User Request');
  const agentPromptContent = parts[0] ? parts[0].trim() : '';
  const userRequestContent = parts[1] ? parts[1].trim() : entry.content;

  const needsAgentTruncation = shouldTruncateContentGuard({ content: agentPromptContent });

  return (
    <Box
      data-testid="CHAT_MESSAGE"
      style={{
        padding: '6px 10px',
        borderRadius: 2,
        backgroundColor: colors['bg-raised'],
        borderLeft: `${BORDER_WIDTH} ${borderColor}`,
        borderRight: `${BORDER_WIDTH} ${borderColor}`,
        textAlign: 'left',
      }}
    >
      <Box
        data-testid="AGENT_PROMPT_SECTION"
        mb={8}
        style={{
          borderLeft: `${BORDER_WIDTH} ${colors['text-dim']}`,
          paddingLeft: 8,
        }}
      >
        <Text
          ff="monospace"
          size="xs"
          fw={LABEL_FONT_WEIGHT}
          mb={2}
          style={{ color: colors['text-dim'] }}
        >
          AGENT PROMPT
        </Text>
        <Text
          ff="monospace"
          size="xs"
          style={{
            color: colors['text-dim'],
            whiteSpace: 'pre-wrap',
            ...(needsAgentTruncation && !expanded
              ? {
                  maskImage: `linear-gradient(to bottom, black calc(100% - 30px), transparent)`,
                  WebkitMaskImage: `linear-gradient(to bottom, black calc(100% - 30px), transparent)`,
                }
              : {}),
            ...(expanded ? { maxHeight: 300, overflowY: 'auto' as const } : {}),
          }}
        >
          {needsAgentTruncation && !expanded
            ? truncateContentTransformer({ content: agentPromptContent })
            : agentPromptContent}
        </Text>
        {needsAgentTruncation ? (
          <Text
            ff="monospace"
            size="xs"
            data-testid="AGENT_PROMPT_TOGGLE"
            style={{ color: colors.primary, cursor: 'pointer' }}
            onClick={() => {
              setExpanded(!expanded);
            }}
          >
            {expanded ? 'Collapse' : 'Show full prompt'}
          </Text>
        ) : null}
      </Box>
      <Text ff="monospace" size="xs" fw={LABEL_FONT_WEIGHT} mb={2} style={{ color: borderColor }}>
        {label}
      </Text>
      <Text ff="monospace" size="xs" style={{ color: colors.text, whiteSpace: 'pre-wrap' }}>
        {userRequestContent}
      </Text>
    </Box>
  );
};
