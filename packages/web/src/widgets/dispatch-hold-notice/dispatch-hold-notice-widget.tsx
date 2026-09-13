/**
 * PURPOSE: Says why the queue stopped dispatching when the rate-limit guardrail is holding it, and
 *   when it will start again. Reach for this rather than leaving the play/pause control to carry
 *   the news: a held queue with a lit PLAY button and nothing moving reads as a broken dispatcher,
 *   and the next thing the reader does is press play again.
 *
 * USAGE:
 * <DispatchHoldNoticeWidget hold={hold} />
 * // Renders one line: what tripped the guardrail, and the wait
 */

import { Text } from '@mantine/core';

import type { DispatchHold } from '@dungeonmaster/shared/contracts';

import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { formatResetDurationTransformer } from '../../transformers/format-reset-duration/format-reset-duration-transformer';

export interface DispatchHoldNoticeWidgetProps {
  hold: DispatchHold;
}

const MS_PER_SECOND = 1000;

export const DispatchHoldNoticeWidget = ({
  hold,
}: DispatchHoldNoticeWidgetProps): React.JSX.Element => {
  const secondsRemaining = Math.ceil((Date.parse(hold.resumeAt) - Date.now()) / MS_PER_SECOND);

  return (
    <Text
      data-testid="DISPATCH_HOLD_NOTICE"
      size="xs"
      style={{ color: emberDepthsThemeStatics.colors.warning }}
    >
      {`HELD — ${hold.detail} · resumes in ${formatResetDurationTransformer({ seconds: secondsRemaining })}`}
    </Text>
  );
};
