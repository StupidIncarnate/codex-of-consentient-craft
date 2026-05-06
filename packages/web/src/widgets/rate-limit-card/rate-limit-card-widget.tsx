/**
 * PURPOSE: Renders a single rate-limit window card matching the bash statusline visual: [ 5h ▰▰▱▱▱▱▱▱ 3% (2h5m) ]
 *
 * USAGE:
 * <RateLimitCardWidget label="5h" window={fiveHourWindow} />
 * // Renders one bracketed monospace line; bar/percent are colored by the danger/warning/default threshold.
 */

import { Box, Text } from '@mantine/core';

import type { RateLimitWindow } from '@dungeonmaster/shared/contracts';

import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { formatResetDurationTransformer } from '../../transformers/format-reset-duration/format-reset-duration-transformer';
import { rateLimitBarTransformer } from '../../transformers/rate-limit-bar/rate-limit-bar-transformer';
import { rateLimitColorTransformer } from '../../transformers/rate-limit-color/rate-limit-color-transformer';

const MS_PER_SECOND = 1000;

const TESTID_BY_LABEL = {
  '5h': 'RATE_LIMIT_CARD_5H',
  '7d': 'RATE_LIMIT_CARD_7D',
} as const;

export interface RateLimitCardWidgetProps {
  label: '5h' | '7d';
  window: RateLimitWindow;
}

export const RateLimitCardWidget = ({
  label,
  window: rateWindow,
}: RateLimitCardWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  const usedPercentage = Number(rateWindow.usedPercentage);
  const secondsUntilReset = Math.floor(
    (new Date(rateWindow.resetsAt).getTime() - Date.now()) / MS_PER_SECOND,
  );
  const duration = formatResetDurationTransformer({ seconds: secondsUntilReset });
  const bar = rateLimitBarTransformer({ usedPercentage });
  const color = rateLimitColorTransformer({ usedPercentage });
  const roundedPct = Math.round(usedPercentage);

  return (
    <Box data-testid={TESTID_BY_LABEL[label]}>
      <Text ff="monospace" size="xs" style={{ color: colors['text-dim'], whiteSpace: 'nowrap' }}>
        [ {label}{' '}
        <Text component="span" ff="monospace" size="xs" style={{ color }}>
          {bar} {String(roundedPct)}%
        </Text>{' '}
        ({duration}) ]
      </Text>
    </Box>
  );
};
