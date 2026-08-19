/**
 * PURPOSE: The unit of a scannable transcript. Collapsed, a call occupies exactly ONE line —
 * label, summary, token estimate, and status all share the header — so a reader skimming a long
 * run counts calls by counting lines. Anything that would add a second line belongs behind the
 * disclosure instead, where the untruncated, unelided values live for the reader who stops.
 * The disclosure follows the stream rather than latching, so a settled transcript is one line
 * per call whether the reader watched it arrive or opened it after the fact.
 *
 * There is exactly ONE disclosure, and it is this row's own chevron. An open row shows its result
 * WHOLE — no second collapse, no capped inner scroller — because a reader who opened a row has
 * already asked for the thing a "show full result" link would ask about again, and because the
 * sticky header exists so that a long open row scrolls past in the panel with its name pinned.
 * An inner scroller is what takes that away: it gives the header nothing to travel against.
 *
 * USAGE:
 * <ToolRowWidget toolUse={toolUseEntry} toolResult={resultEntry} isLoading={false} />
 * // Renders collapsed single-line tool row, expandable on click to show full input and result
 */

import { Box, Text, UnstyledButton } from '@mantine/core';
import { useState } from 'react';

import type { ChatEntry, CssPixels } from '@dungeonmaster/shared/contracts';
import { cssPixelsContract } from '@dungeonmaster/shared/contracts';
import { useDisclosureAnchorBinding } from '../../bindings/use-disclosure-anchor/use-disclosure-anchor-binding';
import type { FormattedTokenLabel } from '../../contracts/formatted-token-label/formatted-token-label-contract';
import { toolResultDisplayContentContract } from '../../contracts/tool-result-display-content/tool-result-display-content-contract';
import { contentTruncationConfigStatics } from '../../statics/content-truncation-config/content-truncation-config-statics';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { stickyHeaderStatics } from '../../statics/sticky-header/sticky-header-statics';
import { formatToolInputTransformer } from '../../transformers/format-tool-input/format-tool-input-transformer';
import { stickyHeaderZIndexTransformer } from '../../transformers/sticky-header-z-index/sticky-header-z-index-transformer';
import { toolDisplayLabelTransformer } from '../../transformers/tool-display-label/tool-display-label-transformer';
import { toolRowSummaryTransformer } from '../../transformers/tool-row-summary/tool-row-summary-transformer';
import { ToolResultContentWidget } from '../tool-result-content/tool-result-content-widget';

type ToolUseEntry = Extract<ChatEntry, { type: 'tool_use' }>;
type ToolResultEntry = Extract<ChatEntry, { type: 'tool_result' }>;

export interface ToolRowWidgetProps {
  toolUse: ToolUseEntry;
  toolResult?: ToolResultEntry | null;
  isLoading?: boolean;
  // Per-tool context number = chars/4 estimate of tool_result content (~X.Xk est).
  // We do NOT show a per-tool delta from `usage` because when multiple tools fire in
  // one assistant turn the delta is shared and can't be split per-tool. The result
  // estimate is per-tool and accurate enough for relative comparison.
  // See packages/web/CLAUDE.md - "Per-tool context numbers".
  resultTokenBadgeLabel?: FormattedTokenLabel;
  // Holds the row open for as long as it is true, not merely on the first render: the caller
  // raises it while this is the call in flight and drops it when the result lands.
  defaultExpanded?: boolean;
  // Where this row's header pins once it is open — the combined height of every expandable header
  // it is nested inside. Rows rendered straight into a scroll panel take the default and pin flush
  // to its top.
  stickyTop?: CssPixels;
}

const STICKY_TOP_ROOT = cssPixelsContract.parse(0);

const CHEVRON_EXPANDED = '\u25BE';
const CHEVRON_COLLAPSED = '\u25B8';
const STATUS_CHECK = '\u2713';
const STATUS_CROSS = '\u2717';
const STATUS_SKIP = '\u2298';
const TOOL_NAME_FONT_SIZE = 11;
const PARAM_FONT_SIZE = 10;
const DETAIL_FONT_SIZE = 10;
const RESULT_FONT_SIZE = cssPixelsContract.parse(DETAIL_FONT_SIZE);

export const ToolRowWidget = ({
  toolUse,
  toolResult,
  isLoading,
  resultTokenBadgeLabel,
  defaultExpanded,
  stickyTop = STICKY_TOP_ROOT,
}: ToolRowWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  // The stream owns the disclosure until the reader takes it: `defaultExpanded` holds only
  // while this is the call in flight, so the detail closes itself the moment the result lands
  // and a screen of finished calls stays one line each. Storing the auto-expand in state
  // instead would latch every call open for the rest of the session — the reader would have
  // to close each one by hand to get the scannable list back.
  const [readerExpanded, setReaderExpanded] = useState<boolean | null>(null);
  const expanded = readerExpanded ?? defaultExpanded === true;
  const [expandedFields, setExpandedFields] = useState<Record<PropertyKey, boolean>>({});
  const { anchorRef, holdAnchor } = useDisclosureAnchorBinding();

  const { toolName, toolInput } = toolUse;
  const isSkill = toolName === 'Skill';
  const isSubagentSource = toolUse.source === 'subagent';

  const accentColor = isSkill
    ? colors['loot-gold']
    : isSubagentSource
      ? `${colors['loot-rare']}80`
      : colors['text-dim'];

  const formatted = formatToolInputTransformer({ toolName, toolInput });

  const displayName = toolDisplayLabelTransformer({ toolName, toolInput });
  const inlineSummary = String(toolRowSummaryTransformer({ toolName, toolInput }));

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
        ref={anchorRef}
        data-testid="TOOL_ROW_HEADER"
        onClick={() => {
          holdAnchor();
          setReaderExpanded(!expanded);
        }}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 8px',
          cursor: 'pointer',
          // Declared unconditionally rather than only while open, because on a CLOSED row it is
          // already inert: sticky travel is bounded by the containing block, and a closed row's
          // box IS this header, so there is nowhere for it to travel to. The other two values are
          // what the row already rendered — the fill repeats the parent's own `bg-raised` (it is
          // what showed through the transparent header before) and the height is what the single
          // line lays out to. So a closed row is unchanged, and an open one pins with an exact
          // height for the headers nested under it to offset against. The fill is load-bearing
          // once open: without it the detail scrolling underneath reads through the pinned bar.
          position: 'sticky',
          top: Number(stickyTop),
          zIndex: Number(stickyHeaderZIndexTransformer({ stickyTop })),
          height: stickyHeaderStatics.heights.toolRow,
          boxSizing: 'border-box',
          backgroundColor: colors['bg-raised'],
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

        {resultTokenBadgeLabel === undefined ? null : (
          <Text
            ff="monospace"
            data-testid="RESULT_TOKEN_BADGE"
            style={{
              color: colors['text-dim'],
              fontSize: DETAIL_FONT_SIZE,
              flexShrink: 0,
            }}
          >
            {resultTokenBadgeLabel}
          </Text>
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
                            // Anchors this row's HEADER, not the link: several fields can carry a
                            // toggle, and the header is the one element in the row there is exactly
                            // one of. It is also already pinned to the top of the scrollport while
                            // the row is open, so holding it is what the reader sees as "nothing
                            // moved".
                            holdAnchor();
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
              {isSkippedResult ? (
                <Text ff="monospace" style={{ fontSize: DETAIL_FONT_SIZE, color: colors.warning }}>
                  This tool call was skipped because another tool call in the same batch failed.
                </Text>
              ) : (
                <ToolResultContentWidget
                  content={toolResultDisplayContentContract.parse(toolResult.content)}
                  color={resultColor}
                  fontSize={RESULT_FONT_SIZE}
                />
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
