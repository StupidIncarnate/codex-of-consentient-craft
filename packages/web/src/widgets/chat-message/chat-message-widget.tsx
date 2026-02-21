/**
 * PURPOSE: Renders a single chat entry with role-based styling for user, assistant, tool use, and tool result messages
 *
 * USAGE:
 * <ChatMessageWidget entry={chatEntry} />
 * // Renders styled chat bubble with role label and content
 */

import { Box, Text } from '@mantine/core';
import { useState } from 'react';

import type { ChatEntry } from '../../contracts/chat-entry/chat-entry-contract';
import { contextTokenCountContract } from '../../contracts/context-token-count/context-token-count-contract';
import { shouldTruncateContentGuard } from '../../guards/should-truncate-content/should-truncate-content-guard';
import { contentTruncationConfigStatics } from '../../statics/content-truncation-config/content-truncation-config-statics';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { formatContextTokensTransformer } from '../../transformers/format-context-tokens/format-context-tokens-transformer';
import { formatToolInputTransformer } from '../../transformers/format-tool-input/format-tool-input-transformer';
import { truncateContentTransformer } from '../../transformers/truncate-content/truncate-content-transformer';

export interface ChatMessageWidgetProps {
  entry: ChatEntry;
  isLoading?: boolean;
  isStreaming?: boolean;
}

const BORDER_WIDTH = '2px solid';
const LABEL_FONT_WEIGHT = 600;

export const ChatMessageWidget = ({
  entry,
  isLoading,
  isStreaming,
}: ChatMessageWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  const isSubagent = 'source' in entry && entry.source === 'subagent';
  const [expanded, setExpanded] = useState(false);
  const [expandedFields, setExpandedFields] = useState<Record<PropertyKey, boolean>>({});

  // Task notification - MUST come BEFORE system error check
  if (entry.role === 'system' && entry.type === 'task_notification') {
    const formattedTokens =
      entry.totalTokens === undefined
        ? null
        : formatContextTokensTransformer({
            count: contextTokenCountContract.parse(Number(entry.totalTokens)),
          });

    const needsTruncation = entry.result
      ? shouldTruncateContentGuard({ content: entry.result })
      : false;

    return (
      <Box
        data-testid="CHAT_MESSAGE"
        style={{
          padding: '6px 10px',
          borderRadius: 2,
          backgroundColor: 'transparent',
          borderLeft: `${BORDER_WIDTH} ${colors['loot-rare']}`,
          borderRight: `${BORDER_WIDTH} ${colors['loot-rare']}`,
          textAlign: 'left',
        }}
      >
        <Text
          ff="monospace"
          size="xs"
          fw={LABEL_FONT_WEIGHT}
          mb={2}
          style={{ color: colors['loot-rare'] }}
        >
          TASK REPORT
        </Text>
        <Text ff="monospace" size="xs" style={{ color: colors.text }}>
          {entry.status}: {entry.summary ?? entry.taskId}
        </Text>
        {(() => {
          const stats = [
            ...(entry.toolUses === undefined ? [] : [`${entry.toolUses} tool calls`]),
            ...(formattedTokens ? [`${formattedTokens} tokens`] : []),
            ...(entry.durationMs === undefined
              ? []
              : [
                  `${(Number(entry.durationMs) / contentTruncationConfigStatics.msDivisor).toFixed(1)}s`,
                ]),
          ];

          return stats.length > 0 ? (
            <Text ff="monospace" size="xs" style={{ color: colors['text-dim'] }}>
              {stats.join(' | ')}
            </Text>
          ) : null;
        })()}
        {entry.result ? (
          <Box mt={4}>
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
                ? truncateContentTransformer({ content: entry.result })
                : entry.result}
            </Text>
            {needsTruncation ? (
              <Text
                ff="monospace"
                size="xs"
                style={{ color: colors.primary, cursor: 'pointer' }}
                onClick={() => {
                  setExpanded(!expanded);
                }}
              >
                {expanded ? 'Collapse' : 'Show full result'}
              </Text>
            ) : null}
          </Box>
        ) : null}
      </Box>
    );
  }

  if (entry.role === 'system') {
    return (
      <Box
        data-testid="CHAT_MESSAGE"
        style={{
          padding: '6px 10px',
          borderRadius: 2,
          backgroundColor: 'transparent',
          borderLeft: `${BORDER_WIDTH} ${colors.danger}`,
          borderRight: `${BORDER_WIDTH} ${colors.danger}`,
          textAlign: 'center',
        }}
      >
        <Text
          ff="monospace"
          size="xs"
          fw={LABEL_FONT_WEIGHT}
          mb={2}
          style={{ color: colors.danger }}
        >
          ERROR
        </Text>
        <Text ff="monospace" size="xs" style={{ color: colors.danger }}>
          {entry.content}
        </Text>
      </Box>
    );
  }

  if (entry.role === 'user') {
    return (
      <Box
        data-testid="CHAT_MESSAGE"
        style={{
          padding: '6px 10px',
          borderRadius: 2,
          backgroundColor: colors['bg-raised'],
          borderLeft: `${BORDER_WIDTH} ${colors['loot-gold']}`,
          borderRight: `${BORDER_WIDTH} ${colors['loot-gold']}`,
          textAlign: 'left',
        }}
      >
        <Text
          ff="monospace"
          size="xs"
          fw={LABEL_FONT_WEIGHT}
          mb={2}
          style={{ color: colors['loot-gold'] }}
        >
          YOU
        </Text>
        <Text ff="monospace" size="xs" style={{ color: colors.text, whiteSpace: 'pre-wrap' }}>
          {entry.content}
        </Text>
      </Box>
    );
  }

  if (entry.type === 'text') {
    const textBorderColor = isSubagent ? colors['loot-rare'] : colors.primary;
    const textLabel = isSubagent ? 'SUB-AGENT' : 'CHAOSWHISPERER';

    return (
      <Box
        data-testid="CHAT_MESSAGE"
        style={{
          padding: '6px 10px',
          borderRadius: 2,
          backgroundColor: 'transparent',
          borderLeft: `${BORDER_WIDTH} ${textBorderColor}`,
          borderRight: `${BORDER_WIDTH} ${textBorderColor}`,
          textAlign: 'right',
        }}
      >
        <Text
          ff="monospace"
          size="xs"
          fw={LABEL_FONT_WEIGHT}
          mb={2}
          style={{ color: textBorderColor }}
        >
          {textLabel}
        </Text>
        <Text ff="monospace" size="xs" style={{ color: colors.text }}>
          {entry.content}
        </Text>
        {entry.usage && !isStreaming ? (
          <Text
            ff="monospace"
            data-testid="TOKEN_BADGE"
            style={{ color: colors['text-dim'], fontSize: 10 }}
          >
            {formatContextTokensTransformer({
              count: contextTokenCountContract.parse(
                Number(entry.usage.inputTokens) +
                  Number(entry.usage.cacheCreationInputTokens) +
                  Number(entry.usage.cacheReadInputTokens),
              ),
            })}{' '}
            context ({entry.usage.outputTokens} out)
          </Text>
        ) : null}
      </Box>
    );
  }

  if (entry.type === 'tool_use') {
    // Skill invocation (Improvement 8)
    if (entry.toolName === 'Skill') {
      const skillFormatted = formatToolInputTransformer({
        toolName: 'Skill',
        toolInput: entry.toolInput,
      });

      const skillField = skillFormatted?.fields.find((f) => f.key === 'skill');
      const skillName = skillField ? skillField.value : 'unknown';
      const remainingFields = skillFormatted
        ? skillFormatted.fields.filter((f) => f.key !== 'skill')
        : [];

      return (
        <Box
          data-testid="CHAT_MESSAGE"
          style={{
            padding: '6px 10px',
            borderRadius: 2,
            backgroundColor: 'transparent',
            borderLeft: `${BORDER_WIDTH} ${colors['loot-gold']}`,
            borderRight: `${BORDER_WIDTH} ${colors['loot-gold']}`,
            textAlign: 'right',
          }}
        >
          <Text
            ff="monospace"
            size="xs"
            fw={LABEL_FONT_WEIGHT}
            mb={2}
            style={{ color: colors['loot-gold'] }}
          >
            SKILL
          </Text>
          <Text ff="monospace" size="xs" style={{ color: colors['loot-gold'] }}>
            {skillName}
          </Text>
          {remainingFields.length > 0
            ? remainingFields.map((field) => (
                <Text
                  key={field.key}
                  ff="monospace"
                  size="xs"
                  style={{ color: colors['text-dim'] }}
                >
                  {field.key}: {field.value}
                </Text>
              ))
            : null}
          {isLoading ? (
            <Text
              ff="monospace"
              size="xs"
              mt={4}
              data-testid="TOOL_LOADING"
              style={{ color: colors.primary, animation: 'pulse 1.5s infinite' }}
            >
              Running...
            </Text>
          ) : null}
        </Box>
      );
    }

    // Regular tool use with formatted input (Improvement 5)
    const toolUseBorderColor = isSubagent ? `${colors['loot-rare']}80` : colors['text-dim'];
    const toolUseLabel = isSubagent ? 'SUB-AGENT TOOL' : 'TOOL CALL';
    const toolUseLabelColor = isSubagent ? `${colors['loot-rare']}80` : colors['text-dim'];

    const formatted = formatToolInputTransformer({
      toolName: entry.toolName,
      toolInput: entry.toolInput,
    });

    const isBash = entry.toolName === 'Bash';

    return (
      <Box
        data-testid="CHAT_MESSAGE"
        style={{
          padding: '6px 10px',
          borderRadius: 2,
          backgroundColor: 'transparent',
          borderLeft: `${BORDER_WIDTH} ${toolUseBorderColor}`,
          borderRight: `${BORDER_WIDTH} ${toolUseBorderColor}`,
          textAlign: 'right',
        }}
      >
        <Text
          ff="monospace"
          size="xs"
          fw={LABEL_FONT_WEIGHT}
          mb={2}
          style={{ color: toolUseLabelColor }}
        >
          {toolUseLabel}
        </Text>
        {formatted ? (
          <Box>
            {formatted.fields.map((field, index) => {
              const isFieldExpanded = expandedFields[index] === true;

              if (isBash && field.key === 'command') {
                return (
                  <Box key={field.key}>
                    <Box
                      style={{
                        backgroundColor: colors['bg-deep'],
                        padding: '4px 8px',
                        borderRadius: 2,
                        display: 'inline-block',
                      }}
                    >
                      <Text
                        ff="monospace"
                        size="xs"
                        style={{ color: colors['text-dim'], whiteSpace: 'pre-wrap' }}
                      >
                        {field.isLong && !isFieldExpanded
                          ? `${field.value.slice(0, contentTruncationConfigStatics.longFieldLimit)}...`
                          : field.value}
                      </Text>
                    </Box>
                    {field.isLong ? (
                      <Text
                        ff="monospace"
                        size="xs"
                        style={{ color: colors.primary, cursor: 'pointer' }}
                        onClick={() => {
                          setExpandedFields({ ...expandedFields, [index]: !isFieldExpanded });
                        }}
                      >
                        {isFieldExpanded ? 'show less' : 'show more'}
                      </Text>
                    ) : null}
                  </Box>
                );
              }

              return (
                <Text
                  key={field.key}
                  ff="monospace"
                  size="xs"
                  style={{ color: colors['text-dim'], fontStyle: 'italic' }}
                >
                  {field.key}:{' '}
                  {field.isLong && !isFieldExpanded
                    ? `${field.value.slice(0, contentTruncationConfigStatics.longFieldLimit)}...`
                    : field.value}
                  {field.isLong ? (
                    <Text
                      component="span"
                      ff="monospace"
                      size="xs"
                      style={{ color: colors.primary, cursor: 'pointer', marginLeft: 4 }}
                      onClick={() => {
                        setExpandedFields({ ...expandedFields, [index]: !isFieldExpanded });
                      }}
                    >
                      {isFieldExpanded ? 'show less' : 'show more'}
                    </Text>
                  ) : null}
                </Text>
              );
            })}
          </Box>
        ) : (
          <Text ff="monospace" size="xs" style={{ color: colors['text-dim'], fontStyle: 'italic' }}>
            {entry.toolName}: {entry.toolInput}
          </Text>
        )}
        {isLoading ? (
          <Text
            ff="monospace"
            size="xs"
            mt={4}
            data-testid="TOOL_LOADING"
            style={{ color: colors.primary, animation: 'pulse 1.5s infinite' }}
          >
            Running...
          </Text>
        ) : null}
      </Box>
    );
  }

  // tool_result branch - detection priority order
  const isSkipped = entry.content.includes('Sibling tool call errored');
  const isHookBlocked =
    entry.isError === true &&
    (entry.content.startsWith('PreToolUse:') || entry.content.startsWith('PostToolUse:'));
  const isToolError = entry.isError === true;

  // Sibling tool call errored - full visual rendering (Improvement 9)
  if (isSkipped) {
    return (
      <Box
        data-testid="CHAT_MESSAGE"
        style={{
          padding: '6px 10px',
          borderRadius: 2,
          backgroundColor: 'transparent',
          borderLeft: `${BORDER_WIDTH} ${colors.warning}`,
          borderRight: `${BORDER_WIDTH} ${colors.warning}`,
          textAlign: 'right',
        }}
      >
        <Text
          ff="monospace"
          size="xs"
          fw={LABEL_FONT_WEIGHT}
          mb={2}
          style={{ color: colors.warning }}
        >
          SKIPPED
        </Text>
        <Text ff="monospace" size="xs" style={{ color: colors.warning }}>
          This tool call was skipped because another tool call in the same batch failed.
        </Text>
      </Box>
    );
  }

  const toolResultLabel = isHookBlocked
    ? 'HOOK BLOCKED'
    : isToolError
      ? 'TOOL ERROR'
      : 'TOOL RESULT';
  const toolResultColor = isHookBlocked || isToolError ? colors.danger : colors['text-dim'];

  // Tool result truncation (Improvement 6)
  const contentString = `${entry.toolName}: ${entry.content}`;
  const needsToolResultTruncation = shouldTruncateContentGuard({ content: contentString });

  return (
    <Box
      data-testid="CHAT_MESSAGE"
      style={{
        padding: '6px 10px',
        borderRadius: 2,
        backgroundColor: 'transparent',
        borderLeft: `${BORDER_WIDTH} ${toolResultColor}`,
        borderRight: `${BORDER_WIDTH} ${toolResultColor}`,
        textAlign: 'right',
      }}
    >
      <Text
        ff="monospace"
        size="xs"
        fw={LABEL_FONT_WEIGHT}
        mb={2}
        style={{ color: toolResultColor }}
      >
        {toolResultLabel}
      </Text>
      {needsToolResultTruncation && !expanded ? (
        <Box>
          <Text
            ff="monospace"
            size="xs"
            style={{
              color: toolResultColor,
              whiteSpace: 'pre-wrap',
              maskImage: `linear-gradient(to bottom, ${toolResultColor} calc(100% - 30px), transparent)`,
              WebkitMaskImage: `linear-gradient(to bottom, ${toolResultColor} calc(100% - 30px), transparent)`,
            }}
          >
            {truncateContentTransformer({ content: contentString })}
          </Text>
          <Text
            ff="monospace"
            size="xs"
            style={{ color: colors.primary, cursor: 'pointer' }}
            onClick={() => {
              setExpanded(true);
            }}
          >
            Show full result
          </Text>
        </Box>
      ) : needsToolResultTruncation && expanded ? (
        <Box>
          <Text
            ff="monospace"
            size="xs"
            style={{
              color: toolResultColor,
              whiteSpace: 'pre-wrap',
              maxHeight: 300,
              overflowY: 'auto',
            }}
          >
            {contentString}
          </Text>
          <Text
            ff="monospace"
            size="xs"
            style={{ color: colors.primary, cursor: 'pointer' }}
            onClick={() => {
              setExpanded(false);
            }}
          >
            Collapse
          </Text>
        </Box>
      ) : (
        <Text ff="monospace" size="xs" style={{ color: toolResultColor, whiteSpace: 'pre-wrap' }}>
          {entry.toolName}: {entry.content}
        </Text>
      )}
    </Box>
  );
};
