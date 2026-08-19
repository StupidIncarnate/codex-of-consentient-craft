/**
 * PURPOSE: Renders a single chat entry with role-based styling for user, assistant, tool use, and tool result messages
 *
 * USAGE:
 * <ChatMessageWidget entry={chatEntry} />
 * // Renders styled chat bubble with role label and content
 */

import { Box, Text } from '@mantine/core';
import { useState } from 'react';

import type { ChatEntry } from '@dungeonmaster/shared/contracts';
import { useDisclosureAnchorBinding } from '../../bindings/use-disclosure-anchor/use-disclosure-anchor-binding';
import { contextTokenCountContract } from '../../contracts/context-token-count/context-token-count-contract';
import type { ExecutionRole } from '../../contracts/execution-role/execution-role-contract';
import type { FormattedTokenLabel } from '../../contracts/formatted-token-label/formatted-token-label-contract';
import { markdownSourceContract } from '../../contracts/markdown-source/markdown-source-contract';
import { toolResultDisplayContentContract } from '../../contracts/tool-result-display-content/tool-result-display-content-contract';
import { shouldTruncateContentGuard } from '../../guards/should-truncate-content/should-truncate-content-guard';
import { contentTruncationConfigStatics } from '../../statics/content-truncation-config/content-truncation-config-statics';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { formatContextTokensTransformer } from '../../transformers/format-context-tokens/format-context-tokens-transformer';
import { truncateContentTransformer } from '../../transformers/truncate-content/truncate-content-transformer';
import { MarkdownTextWidget } from '../markdown-text/markdown-text-widget';
import { ThinkingRowWidget } from '../thinking-row/thinking-row-widget';
import { ToolResultContentWidget } from '../tool-result-content/tool-result-content-widget';
import { ToolRowWidget } from '../tool-row/tool-row-widget';
import { InjectedPromptLayerWidget } from './injected-prompt-layer-widget';

type ToolResultEntry = Extract<ChatEntry, { type: 'tool_result' }>;

export interface ChatMessageWidgetProps {
  entry: ChatEntry;
  toolResult?: ToolResultEntry | null;
  isLoading?: boolean;
  tokenBadgeLabel?: FormattedTokenLabel;
  resultTokenBadgeLabel?: FormattedTokenLabel;
  roleLabel?: ExecutionRole;
  // Raw program output from a COMMAND work item, which is not agent-authored markdown and must not
  // be parsed as any. npm's `> pkg build` script echo renders as a BLOCKQUOTE otherwise, and a
  // build log is full of backticks, asterisks and hashes that mean nothing but themselves.
  isCommandOutput?: boolean;
}

const BORDER_WIDTH = '2px solid';
const LABEL_FONT_WEIGHT = 600;
const RESULT_EXPANDED_MAX_HEIGHT = 300;

export const ChatMessageWidget = ({
  entry,
  toolResult,
  isLoading,
  tokenBadgeLabel,
  resultTokenBadgeLabel,
  roleLabel,
  isCommandOutput = false,
}: ChatMessageWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  const isSubagent = 'source' in entry && entry.source === 'subagent';
  const [expanded, setExpanded] = useState(false);
  // Serves whichever of the two truncation toggles below this entry renders — a task report's or an
  // unpaired tool result's. Only one branch ever mounts, so one callback ref covers both.
  const { anchorRef, holdAnchor } = useDisclosureAnchorBinding();

  const tokenBadgeElement =
    tokenBadgeLabel === undefined ? null : (
      <Text
        ff="monospace"
        data-testid="TOKEN_BADGE"
        style={{ color: colors['text-dim'], fontSize: 10 }}
      >
        {tokenBadgeLabel}
      </Text>
    );

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
                ref={anchorRef}
                data-testid="CHAT_MESSAGE_TRUNCATION_TOGGLE"
                ff="monospace"
                size="xs"
                style={{ color: colors.primary, cursor: 'pointer' }}
                onClick={() => {
                  holdAnchor();
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
    const userBorderColor = isSubagent ? colors['loot-rare'] : colors['loot-gold'];
    const userLabel = isSubagent ? 'SUB-AGENT PROMPT' : 'YOU';
    const isInjected = 'isInjectedPrompt' in entry && entry.isInjectedPrompt === true;

    if (isInjected) {
      return (
        <InjectedPromptLayerWidget entry={entry} borderColor={userBorderColor} label={userLabel} />
      );
    }

    return (
      <Box
        data-testid="CHAT_MESSAGE"
        style={{
          padding: '6px 10px',
          borderRadius: 2,
          backgroundColor: colors['bg-raised'],
          borderLeft: `${BORDER_WIDTH} ${userBorderColor}`,
          borderRight: `${BORDER_WIDTH} ${userBorderColor}`,
          textAlign: 'left',
        }}
      >
        <Text
          ff="monospace"
          size="xs"
          fw={LABEL_FONT_WEIGHT}
          mb={2}
          style={{ color: userBorderColor }}
        >
          {userLabel}
        </Text>
        <Text ff="monospace" size="xs" style={{ color: colors.text, whiteSpace: 'pre-wrap' }}>
          {entry.content}
        </Text>
      </Box>
    );
  }

  if (entry.type === 'thinking') {
    return <ThinkingRowWidget entry={entry} />;
  }

  if (entry.type === 'text') {
    const textBorderColor = isSubagent ? colors['loot-rare'] : colors.primary;
    const textLabel = isSubagent ? 'SUB-AGENT' : (roleLabel ?? 'chaoswhisperer').toUpperCase();

    return (
      <Box
        data-testid="CHAT_MESSAGE"
        style={{
          padding: '6px 10px',
          borderRadius: 2,
          backgroundColor: 'transparent',
          borderLeft: `${BORDER_WIDTH} ${textBorderColor}`,
          borderRight: `${BORDER_WIDTH} ${textBorderColor}`,
          textAlign: 'left',
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
          {'model' in entry && entry.model ? (
            <Text component="span" style={{ color: colors['text-dim'] }}>
              {' '}
              {entry.model}
            </Text>
          ) : null}
        </Text>
        {isCommandOutput ? (
          <Text
            ff="monospace"
            size="xs"
            style={{ color: colors.text, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          >
            {entry.content}
          </Text>
        ) : (
          <MarkdownTextWidget content={markdownSourceContract.parse(entry.content)} />
        )}
        {tokenBadgeElement}
      </Box>
    );
  }

  if (entry.type === 'tool_use') {
    return (
      <ToolRowWidget
        toolUse={entry}
        {...(toolResult !== undefined && toolResult !== null ? { toolResult } : {})}
        {...(isLoading === undefined ? {} : { isLoading })}
        {...(tokenBadgeLabel === undefined ? {} : { tokenBadgeLabel })}
        {...(resultTokenBadgeLabel === undefined ? {} : { resultTokenBadgeLabel })}
      />
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
          textAlign: 'left',
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

  // The tool name rides on the label line rather than in front of the content, so the content
  // reaches the renderer as the reply the tool actually sent — a JSON answer with a prefix glued to
  // its front no longer parses, and would render as the escaped blob this exists to avoid.
  const needsToolResultTruncation = shouldTruncateContentGuard({ content: entry.content });

  return (
    <Box
      data-testid="CHAT_MESSAGE"
      style={{
        padding: '6px 10px',
        borderRadius: 2,
        backgroundColor: 'transparent',
        borderLeft: `${BORDER_WIDTH} ${toolResultColor}`,
        borderRight: `${BORDER_WIDTH} ${toolResultColor}`,
        textAlign: 'left',
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
        <Text component="span" style={{ color: colors['text-dim'] }}>
          {' '}
          {entry.toolName}
        </Text>
      </Text>
      {tokenBadgeElement}
      {needsToolResultTruncation && !expanded ? (
        <Box>
          <Box
            style={{
              maskImage: `linear-gradient(to bottom, ${toolResultColor} calc(100% - 30px), transparent)`,
              WebkitMaskImage: `linear-gradient(to bottom, ${toolResultColor} calc(100% - 30px), transparent)`,
            }}
          >
            <ToolResultContentWidget
              content={toolResultDisplayContentContract.parse(
                truncateContentTransformer({ content: entry.content }),
              )}
              color={toolResultColor}
            />
          </Box>
          <Text
            ref={anchorRef}
            data-testid="CHAT_MESSAGE_TRUNCATION_TOGGLE"
            ff="monospace"
            size="xs"
            style={{ color: colors.primary, cursor: 'pointer' }}
            onClick={() => {
              holdAnchor();
              setExpanded(true);
            }}
          >
            Show full result
          </Text>
        </Box>
      ) : needsToolResultTruncation && expanded ? (
        <Box>
          <Box style={{ maxHeight: RESULT_EXPANDED_MAX_HEIGHT, overflowY: 'auto' }}>
            <ToolResultContentWidget
              content={toolResultDisplayContentContract.parse(entry.content)}
              color={toolResultColor}
            />
          </Box>
          <Text
            ref={anchorRef}
            ff="monospace"
            size="xs"
            style={{ color: colors.primary, cursor: 'pointer' }}
            onClick={() => {
              holdAnchor();
              setExpanded(false);
            }}
          >
            Collapse
          </Text>
        </Box>
      ) : (
        <ToolResultContentWidget
          content={toolResultDisplayContentContract.parse(entry.content)}
          color={toolResultColor}
        />
      )}
    </Box>
  );
};
