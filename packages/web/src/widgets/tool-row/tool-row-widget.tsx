/**
 * PURPOSE: Renders a compact, collapsible tool call row with inline params summary and expandable input/result detail
 *
 * USAGE:
 * <ToolRowWidget toolUse={toolUseEntry} toolResult={resultEntry} isLoading={false} />
 * // Renders collapsed single-line tool row, expandable on click to show full input and result
 */

import { Box, Text, UnstyledButton } from '@mantine/core';
import { useState } from 'react';

import type { ChatEntry } from '@dungeonmaster/shared/contracts';
import type { FormattedTokenLabel } from '../../contracts/formatted-token-label/formatted-token-label-contract';
import { shouldTruncateContentGuard } from '../../guards/should-truncate-content/should-truncate-content-guard';
import { contentTruncationConfigStatics } from '../../statics/content-truncation-config/content-truncation-config-statics';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { formatToolInputTransformer } from '../../transformers/format-tool-input/format-tool-input-transformer';
import { truncateContentTransformer } from '../../transformers/truncate-content/truncate-content-transformer';

type ToolUseEntry = Extract<ChatEntry, { type: 'tool_use' }>;
type ToolResultEntry = Extract<ChatEntry, { type: 'tool_result' }>;

export interface ToolRowWidgetProps {
  toolUse: ToolUseEntry;
  toolResult?: ToolResultEntry | null;
  isLoading?: boolean;
  tokenBadgeLabel?: FormattedTokenLabel;
  resultTokenBadgeLabel?: FormattedTokenLabel;
  defaultExpanded?: boolean;
}

const CHEVRON_EXPANDED = '\u25BE';
const CHEVRON_COLLAPSED = '\u25B8';
const STATUS_CHECK = '\u2713';
const STATUS_CROSS = '\u2717';
const STATUS_SKIP = '\u2298';
const TOOL_NAME_FONT_SIZE = 11;
const PARAM_FONT_SIZE = 10;
const DETAIL_FONT_SIZE = 10;
const INLINE_SUMMARY_LIMIT = 200;

const SINGLE_VALUE_TOOLS = new Set(['Bash', 'Read', 'Write', 'Edit', 'Glob']);

export const ToolRowWidget = ({
  toolUse,
  toolResult,
  isLoading,
  tokenBadgeLabel,
  resultTokenBadgeLabel,
  defaultExpanded,
}: ToolRowWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  const [expanded, setExpanded] = useState(defaultExpanded === true);
  const [resultExpanded, setResultExpanded] = useState(false);
  const [expandedFields, setExpandedFields] = useState<Record<PropertyKey, boolean>>({});

  const { toolName, toolInput } = toolUse;
  const isSkill = toolName === 'Skill';
  const isSubagentSource = toolUse.source === 'subagent';

  const accentColor = isSkill
    ? colors['loot-gold']
    : isSubagentSource
      ? `${colors['loot-rare']}80`
      : colors['text-dim'];

  const formatted = formatToolInputTransformer({ toolName, toolInput });

  const displayName = isSkill
    ? (() => {
        const skillField = formatted?.fields.find((f) => f.key === 'skill');
        return `Skill: ${skillField ? String(skillField.value) : 'unknown'}`;
      })()
    : toolName;

  const inlineSummary = (() => {
    if (formatted === null || formatted.fields.length === 0) {
      if (toolInput === '{}' || toolInput === '') return '';
      const raw = String(toolInput);
      return raw.length > INLINE_SUMMARY_LIMIT ? `${raw.slice(0, INLINE_SUMMARY_LIMIT)}...` : raw;
    }

    let { fields } = formatted;
    if (isSkill) {
      fields = fields.filter((f) => f.key !== 'skill');
    }

    const [firstField] = fields;
    if (!isSkill && SINGLE_VALUE_TOOLS.has(toolName) && firstField !== undefined) {
      const val = String(firstField.value);
      return val.length > INLINE_SUMMARY_LIMIT ? `${val.slice(0, INLINE_SUMMARY_LIMIT)}...` : val;
    }

    const joined = fields.map((f) => `${f.key}: ${f.value}`).join(', ');
    return joined.length > INLINE_SUMMARY_LIMIT
      ? `${joined.slice(0, INLINE_SUMMARY_LIMIT)}...`
      : joined;
  })();

  const detailFields = isSkill
    ? (formatted?.fields.filter((f) => f.key !== 'skill') ?? [])
    : (formatted?.fields ?? []);

  // Result status detection (inline to satisfy single-export rule)
  const hasResult = toolResult !== undefined && toolResult !== null;
  const isLoadingNoResult = isLoading === true && !hasResult;
  const isSkippedResult = hasResult && toolResult.content.includes('Sibling tool call errored');
  const isHookBlocked =
    hasResult &&
    toolResult.isError === true &&
    (toolResult.content.startsWith('PreToolUse:') || toolResult.content.startsWith('PostToolUse:'));
  const isErrorResult = hasResult && toolResult.isError === true && !isHookBlocked;
  const isSuccessResult = hasResult && !isSkippedResult && !isHookBlocked && !isErrorResult;

  const statusIcon = isLoadingNoResult
    ? { text: '\u00B7\u00B7\u00B7', color: colors.primary, animate: true }
    : isSuccessResult
      ? { text: STATUS_CHECK, color: colors.success, animate: false }
      : isErrorResult || isHookBlocked
        ? { text: STATUS_CROSS, color: colors.danger, animate: false }
        : isSkippedResult
          ? { text: STATUS_SKIP, color: colors.warning, animate: false }
          : null;

  const resultLabel = isHookBlocked
    ? 'HOOK BLOCKED'
    : isErrorResult
      ? 'TOOL ERROR'
      : isSkippedResult
        ? 'SKIPPED'
        : 'RESULT';
  const resultColor =
    isErrorResult || isHookBlocked
      ? colors.danger
      : isSkippedResult
        ? colors.warning
        : colors['text-dim'];
  const needsResultTruncation = hasResult
    ? shouldTruncateContentGuard({ content: toolResult.content })
    : false;

  return (
    <Box
      data-testid="TOOL_ROW"
      style={{
        backgroundColor: colors['bg-raised'],
        borderLeft: `3px solid ${accentColor}`,
        borderRadius: 2,
        marginBottom: 2,
      }}
    >
      <UnstyledButton
        data-testid="TOOL_ROW_HEADER"
        onClick={() => {
          setExpanded(!expanded);
        }}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 8px',
          cursor: 'pointer',
        }}
      >
        <Text
          ff="monospace"
          style={{
            fontSize: PARAM_FONT_SIZE,
            color: accentColor,
            flexShrink: 0,
          }}
        >
          {expanded ? CHEVRON_EXPANDED : CHEVRON_COLLAPSED}
        </Text>

        <Text
          ff="monospace"
          fw={600}
          data-testid="TOOL_ROW_NAME"
          style={{
            fontSize: TOOL_NAME_FONT_SIZE,
            color: isSkill ? colors['loot-gold'] : colors.text,
            flexShrink: 0,
          }}
        >
          {displayName}
        </Text>

        {inlineSummary.length > 0 ? (
          <Text
            ff="monospace"
            data-testid="TOOL_ROW_SUMMARY"
            style={{
              fontSize: PARAM_FONT_SIZE,
              color: colors['text-dim'],
              fontStyle: 'italic',
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {inlineSummary}
          </Text>
        ) : (
          <Box style={{ flex: 1 }} />
        )}

        {statusIcon === null ? null : (
          <Text
            ff="monospace"
            fw={600}
            data-testid="TOOL_ROW_STATUS"
            style={{
              fontSize: TOOL_NAME_FONT_SIZE,
              color: statusIcon.color,
              flexShrink: 0,
              ...(statusIcon.animate ? { animation: 'pulse 1.5s infinite' } : {}),
            }}
          >
            {statusIcon.text}
          </Text>
        )}
      </UnstyledButton>

      {expanded ? (
        <Box
          data-testid="TOOL_ROW_DETAIL"
          style={{
            padding: '0 8px 6px 17px',
            borderTop: `1px solid ${colors.border}`,
          }}
        >
          {detailFields.length > 0 ? (
            <Box mt={4}>
              {detailFields.map((field, index) => {
                const isBashCommand = toolName === 'Bash' && field.key === 'command';
                const isFieldExpanded = expandedFields[index] === true;

                if (isBashCommand) {
                  return (
                    <Box key={field.key}>
                      <Box
                        style={{
                          backgroundColor: colors['bg-deep'],
                          padding: '3px 6px',
                          borderRadius: 2,
                          marginBottom: 2,
                        }}
                      >
                        <Text
                          ff="monospace"
                          style={{
                            fontSize: DETAIL_FONT_SIZE,
                            color: colors['text-dim'],
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {field.isLong && !isFieldExpanded
                            ? `${field.value.slice(0, contentTruncationConfigStatics.longFieldLimit)}...`
                            : field.value}
                        </Text>
                      </Box>
                      {field.isLong ? (
                        <Text
                          ff="monospace"
                          style={{
                            fontSize: DETAIL_FONT_SIZE,
                            color: colors.primary,
                            cursor: 'pointer',
                          }}
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
                    style={{
                      fontSize: DETAIL_FONT_SIZE,
                      color: colors['text-dim'],
                      fontStyle: 'italic',
                    }}
                  >
                    {field.key}:{' '}
                    {field.isLong && !isFieldExpanded
                      ? `${field.value.slice(0, contentTruncationConfigStatics.longFieldLimit)}...`
                      : field.value}
                    {field.isLong ? (
                      <Text
                        component="span"
                        ff="monospace"
                        style={{
                          fontSize: DETAIL_FONT_SIZE,
                          color: colors.primary,
                          cursor: 'pointer',
                          marginLeft: 4,
                        }}
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
          ) : toolInput !== '{}' && toolInput !== '' ? (
            <Text
              ff="monospace"
              mt={4}
              style={{
                fontSize: DETAIL_FONT_SIZE,
                color: colors['text-dim'],
                fontStyle: 'italic',
                whiteSpace: 'pre-wrap',
              }}
            >
              {toolInput}
            </Text>
          ) : null}

          {tokenBadgeLabel === undefined ? null : (
            <Text
              ff="monospace"
              data-testid="TOKEN_BADGE"
              style={{ color: colors['text-dim'], fontSize: DETAIL_FONT_SIZE }}
            >
              {tokenBadgeLabel}
            </Text>
          )}

          {hasResult ? (
            <Box
              data-testid="TOOL_ROW_RESULT"
              mt={4}
              style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 4 }}
            >
              <Text
                ff="monospace"
                fw={600}
                style={{ fontSize: DETAIL_FONT_SIZE, color: resultColor, marginBottom: 2 }}
              >
                {resultLabel}
              </Text>
              {resultTokenBadgeLabel === undefined ? null : (
                <Text
                  ff="monospace"
                  data-testid="RESULT_TOKEN_BADGE"
                  style={{ color: colors['text-dim'], fontSize: DETAIL_FONT_SIZE }}
                >
                  {resultTokenBadgeLabel}
                </Text>
              )}
              {isSkippedResult ? (
                <Text ff="monospace" style={{ fontSize: DETAIL_FONT_SIZE, color: colors.warning }}>
                  This tool call was skipped because another tool call in the same batch failed.
                </Text>
              ) : needsResultTruncation && !resultExpanded ? (
                <Box>
                  <Text
                    ff="monospace"
                    style={{
                      fontSize: DETAIL_FONT_SIZE,
                      color: resultColor,
                      whiteSpace: 'pre-wrap',
                      maskImage: `linear-gradient(to bottom, ${resultColor} calc(100% - 30px), transparent)`,
                      WebkitMaskImage: `linear-gradient(to bottom, ${resultColor} calc(100% - 30px), transparent)`,
                    }}
                  >
                    {truncateContentTransformer({ content: toolResult.content })}
                  </Text>
                  <Text
                    data-testid="TOOL_ROW_TRUNCATION_TOGGLE"
                    ff="monospace"
                    style={{
                      fontSize: DETAIL_FONT_SIZE,
                      color: colors.primary,
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      setResultExpanded(true);
                    }}
                  >
                    Show full result
                  </Text>
                </Box>
              ) : needsResultTruncation && resultExpanded ? (
                <Box>
                  <Text
                    ff="monospace"
                    style={{
                      fontSize: DETAIL_FONT_SIZE,
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
                    style={{
                      fontSize: DETAIL_FONT_SIZE,
                      color: colors.primary,
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      setResultExpanded(false);
                    }}
                  >
                    Collapse
                  </Text>
                </Box>
              ) : (
                <Text
                  ff="monospace"
                  style={{
                    fontSize: DETAIL_FONT_SIZE,
                    color: resultColor,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {toolResult.content}
                </Text>
              )}
            </Box>
          ) : null}

          {isLoadingNoResult ? (
            <Text
              ff="monospace"
              data-testid="TOOL_LOADING"
              style={{
                fontSize: DETAIL_FONT_SIZE,
                color: colors.primary,
                animation: 'pulse 1.5s infinite',
                marginTop: 4,
              }}
            >
              Running...
            </Text>
          ) : null}
        </Box>
      ) : null}
    </Box>
  );
};
