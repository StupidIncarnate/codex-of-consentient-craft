/**
 * PURPOSE: Renders a horizontal divider showing context token count with optional delta indicator
 *
 * USAGE:
 * <ContextDividerWidget contextTokens={25500} delta={2100} source="session" />
 * // Renders "--- 25.5k context (+2.1k) ---" styled divider
 */

import { Box, Text } from '@mantine/core';

import type { ContextTokenDelta } from '../../contracts/context-token-delta/context-token-delta-contract';
import type { ContextTokenCount } from '../../contracts/context-token-count/context-token-count-contract';
import { contextTokenCountContract } from '../../contracts/context-token-count/context-token-count-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { formatContextTokensTransformer } from '../../transformers/format-context-tokens/format-context-tokens-transformer';

export interface ContextDividerWidgetProps {
  contextTokens: ContextTokenCount;
  delta: ContextTokenDelta | null;
  source: 'session' | 'subagent';
}

export const ContextDividerWidget = ({
  contextTokens,
  delta,
  source,
}: ContextDividerWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  const isSubagent = source === 'subagent';

  const lineColor = isSubagent ? `${colors['loot-rare']}80` : colors.border;
  const textColor = isSubagent ? `${colors['loot-rare']}80` : colors['text-dim'];

  const formattedTokens = formatContextTokensTransformer({
    count: contextTokenCountContract.parse(contextTokens),
  });

  const label = isSubagent ? `${formattedTokens} sub-agent context` : `${formattedTokens} context`;

  const deltaText =
    delta === null
      ? null
      : formatContextTokensTransformer({
          count: contextTokenCountContract.parse(Math.abs(Number(delta))),
        });

  const deltaColor =
    delta === null ? colors.warning : Number(delta) >= 0 ? colors.success : colors.warning;

  const deltaLabel =
    delta === null ? '' : Number(delta) >= 0 ? ` (+${deltaText ?? ''})` : ` (-${deltaText ?? ''})`;

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
      </Text>
      <Box style={{ flex: 1, height: 1, backgroundColor: lineColor }} />
    </Box>
  );
};
