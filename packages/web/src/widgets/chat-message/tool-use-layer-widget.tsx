/**
 * PURPOSE: Renders tool use entries including skill invocations and regular tool calls with formatted input
 *
 * USAGE:
 * <ToolUseLayerWidget entry={toolUseEntry} isLoading={false} tokenBadgeElement={badge} />
 * // Renders TOOL CALL or SKILL label with formatted tool input fields
 */

import { Box, Text } from '@mantine/core';
import { useState } from 'react';

import type { ChatEntry } from '../../contracts/chat-entry/chat-entry-contract';

type ToolUseEntry = Extract<ChatEntry, { type: 'tool_use' }>;
import { contentTruncationConfigStatics } from '../../statics/content-truncation-config/content-truncation-config-statics';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { formatToolInputTransformer } from '../../transformers/format-tool-input/format-tool-input-transformer';

const BORDER_WIDTH = '2px solid';
const LABEL_FONT_WEIGHT = 600;

export interface ToolUseLayerWidgetProps {
  entry: ToolUseEntry;
  isLoading?: boolean;
  tokenBadgeElement: React.JSX.Element | null;
  isSubagent: boolean;
}

export const ToolUseLayerWidget = ({
  entry,
  isLoading,
  tokenBadgeElement,
  isSubagent,
}: ToolUseLayerWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  const [expandedFields, setExpandedFields] = useState<Record<PropertyKey, boolean>>({});
  const toolBadge = tokenBadgeElement;

  const { toolName } = entry;
  const { toolInput } = entry;

  if (toolName === 'Skill') {
    const skillFormatted = formatToolInputTransformer({
      toolName: 'Skill',
      toolInput,
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
          textAlign: 'left',
          paddingLeft: '15%',
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
              <Text key={field.key} ff="monospace" size="xs" style={{ color: colors['text-dim'] }}>
                {field.key}: {field.value}
              </Text>
            ))
          : null}
        {toolBadge}
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

  const toolUseBorderColor = isSubagent ? `${colors['loot-rare']}80` : colors['text-dim'];
  const toolUseLabel = isSubagent ? 'SUB-AGENT TOOL' : 'TOOL CALL';
  const toolUseLabelColor = isSubagent ? `${colors['loot-rare']}80` : colors['text-dim'];

  const formatted = formatToolInputTransformer({
    toolName,
    toolInput,
  });

  const isBash = toolName === 'Bash';

  return (
    <Box
      data-testid="CHAT_MESSAGE"
      style={{
        padding: '6px 10px',
        borderRadius: 2,
        backgroundColor: 'transparent',
        borderLeft: `${BORDER_WIDTH} ${toolUseBorderColor}`,
        borderRight: `${BORDER_WIDTH} ${toolUseBorderColor}`,
        textAlign: 'left',
        paddingLeft: '15%',
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
      {formatted && formatted.fields.length > 0 ? (
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
          {toolInput === '{}' || toolInput === '' ? toolName : `${toolName}: ${toolInput}`}
        </Text>
      )}
      {toolBadge}
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
};
