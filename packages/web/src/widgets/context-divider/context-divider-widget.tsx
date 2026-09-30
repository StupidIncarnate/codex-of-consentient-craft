/**
 * PURPOSE: Renders a horizontal divider showing context token count with optional delta and cumulative sub-agent total indicators
 *
 * USAGE:
 * <ContextDividerWidget contextTokens={25500} delta={2100} source="session" subagentTotalTokens={12000} />
 * // Renders "--- 25.5k context (+2.1k) · SubAgents - 12.0k ---" styled divider
 */

import { Box, Text } from '#gateway/npm/mantine__core';

import type { ContextTokenDelta } from '../../contracts/context-token-delta/context-token-delta-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { formatContextTokensTransformer } from '../../transformers/format-context-tokens/format-context-tokens-transformer';

export interface ContextDividerWidgetProps {
  contextTokens: number;
  delta: ContextTokenDelta | null;
  source: 'session' | 'subagent';
  subagentTotalTokens?: number;
}

export const ContextDividerWidget = ({
  contextTokens,
  delta,
  source,
  subagentTotalTokens,
}: ContextDividerWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  const isSubagent = source === 'subagent';

  const lineColor = isSubagent ? `${colors['loot-rare']}80` : colors.border;
  const textColor = isSubagent ? `${colors['loot-rare']}80` : colors['text-dim'];

  const formattedTokens = formatContextTokensTransformer({
    count: contextTokens,
  });

  const label = isSubagent ? `${formattedTokens} sub-agent context` : `${formattedTokens} context`;

  const deltaText =
    delta === null
      ? null
      : formatContextTokensTransformer({
          count: Math.abs(Number(delta)),
        });

  const deltaColor =
    delta === null ? colors.warning : Number(delta) >= 0 ? colors.success : colors.warning;

  const deltaLabel =
    delta === null ? '' : Number(delta) >= 0 ? ` (+${deltaText ?? ''})` : ` (-${deltaText ?? ''})`;

  const formattedSubagentTotal =
    subagentTotalTokens === undefined
      ? null
      : formatContextTokensTransformer({
          count: subagentTotalTokens,
        });

  return (
    <Box
      data-testid="CONTEXT_DIVIDER"
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        margin: '4px 0',
      }}
    >
      <Box style={{ flex: 1, height: 1, backgroundColor: lineColor }} />
      <Text
        ff="monospace"
        style={{
          color: textColor,
          fontSize: 10,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
        {delta === null ? null : (
          <Text component="span" ff="monospace" style={{ color: deltaColor, fontSize: 10 }}>
            {deltaLabel}
          </Text>
        )}
        {formattedSubagentTotal === null ? null : (
          <Text
            component="span"
            ff="monospace"
            data-testid="CONTEXT_DIVIDER_SUBAGENT_TOTAL"
            style={{ color: colors['loot-rare'], fontSize: 10 }}
          >
            {' '}
            · SubAgents - {formattedSubagentTotal}
          </Text>
        )}
      </Text>
      <Box style={{ flex: 1, height: 1, backgroundColor: lineColor }} />
    </Box>
  );
};
