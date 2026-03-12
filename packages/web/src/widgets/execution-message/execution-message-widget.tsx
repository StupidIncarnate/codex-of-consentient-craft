/**
 * PURPOSE: Renders a single ChatEntry as a styled execution message with role label and content
 *
 * USAGE:
 * <ExecutionMessageWidget entry={chatEntry} roleName="pathseeker" roleColor="primary" />
 * // Renders styled message with role label or TOOL CALL label
 */

import { Box, Text } from '@mantine/core';

import type { ChatEntry } from '../../contracts/chat-entry/chat-entry-contract';
import type { ExecutionRole } from '../../contracts/execution-role/execution-role-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

export interface ExecutionMessageWidgetProps {
  entry: ChatEntry;
  roleName: ExecutionRole;
  roleColor: keyof typeof emberDepthsThemeStatics.colors;
}

const LABEL_FONT_SIZE = 10;
const CONTENT_FONT_SIZE = 11;
const BORDER_WIDTH = 2;
const PADDING_VERTICAL = 4;
const PADDING_HORIZONTAL = 8;
const MARGIN_BOTTOM = 4;
const LABEL_MARGIN_BOTTOM = 1;

export const ExecutionMessageWidget = ({
  entry,
  roleName,
  roleColor,
}: ExecutionMessageWidgetProps): React.JSX.Element | null => {
  const { colors } = emberDepthsThemeStatics;

  if (entry.role === 'user' || entry.role === 'system') {
    return null;
  }

  if ('type' in entry && entry.type === 'thinking') {
    return null;
  }

  if ('type' in entry && entry.type === 'tool_result') {
    return null;
  }

  const isTool = 'type' in entry && entry.type === 'tool_use';
  const borderColor = isTool ? colors['text-dim'] : colors[roleColor];
  const labelColor = borderColor;
  const contentColor = isTool ? colors['text-dim'] : colors.text;

  const label = isTool ? 'TOOL CALL' : roleName.toUpperCase();
  const text =
    isTool && 'toolName' in entry
      ? `${String(entry.toolName)}: ${String(entry.toolInput)}`
      : 'content' in entry
        ? String(entry.content)
        : '';

  return (
    <Box
      data-testid="execution-message-widget"
      style={{
        padding: `${PADDING_VERTICAL}px ${PADDING_HORIZONTAL}px`,
        borderLeft: `${BORDER_WIDTH}px solid ${borderColor}`,
        marginBottom: MARGIN_BOTTOM,
      }}
    >
      <Text
        ff="monospace"
        style={{
          fontSize: LABEL_FONT_SIZE,
          fontWeight: 600,
          color: labelColor,
          marginBottom: LABEL_MARGIN_BOTTOM,
        }}
      >
        {label}
      </Text>
      <Text
        ff="monospace"
        data-testid="execution-message-content"
        style={{
          fontSize: CONTENT_FONT_SIZE,
          color: contentColor,
          fontStyle: isTool ? 'italic' : 'normal',
        }}
      >
        {text}
      </Text>
    </Box>
  );
};
