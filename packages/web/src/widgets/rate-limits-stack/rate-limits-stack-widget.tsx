/**
 * PURPOSE: Stacks the 5h and 7d rate-limit cards vertically. Renders empty fragment when both windows are null.
 *
 * USAGE:
 * <RateLimitsStackWidget />
 * // Subscribes to useRateLimitsBinding; mounts in AppWidget top row, vertically centered with the logo.
 */

import { Stack } from '@mantine/core';

import { useRateLimitsBinding } from '../../bindings/use-rate-limits/use-rate-limits-binding';
import { RateLimitCardWidget } from '../rate-limit-card/rate-limit-card-widget';

const STACK_GAP = 2;

export const RateLimitsStackWidget = (): React.JSX.Element | null => {
  const { snapshot } = useRateLimitsBinding();

  if (snapshot === null) {
    return null;
  }
  if (snapshot.fiveHour === null && snapshot.sevenDay === null) {
    return null;
  }

  return (
    <Stack gap={STACK_GAP} data-testid="RATE_LIMITS_STACK">
      {snapshot.fiveHour === null ? null : (
        <RateLimitCardWidget label="5h" window={snapshot.fiveHour} />
      )}
      {snapshot.sevenDay === null ? null : (
        <RateLimitCardWidget label="7d" window={snapshot.sevenDay} />
      )}
    </Stack>
  );
};
