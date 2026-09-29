import { RateLimitsSnapshotStub, RateLimitWindowStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderMiddleware } from '@dungeonmaster/testing/middleware/mantine-render';
import { act, waitFor } from '#gateway/npm/testing-library__react';
import { RateLimitsStackWidget } from './rate-limits-stack-widget';
import { RateLimitsStackWidgetProxy } from './rate-limits-stack-widget.proxy';

describe('RateLimitsStackWidget', () => {
  it('VALID: {snapshot with both windows} => renders both cards inside stack', async () => {
    const proxy = RateLimitsStackWidgetProxy();
    const futureIso = new Date(Date.now() + 3600_000).toISOString();
    proxy.setupSnapshot({
      snapshot: RateLimitsSnapshotStub({
        fiveHour: RateLimitWindowStub({ usedPercentage: 42, resetsAt: futureIso }),
        sevenDay: RateLimitWindowStub({ usedPercentage: 20, resetsAt: futureIso }),
      }),
    });

    const { getByTestId } = mantineRenderMiddleware({
      ui: <RateLimitsStackWidget />,
    });

    await waitFor(() => {
      expect(getByTestId('RATE_LIMITS_STACK').getAttribute('data-testid')).toBe(
        'RATE_LIMITS_STACK',
      );
    });

    expect(getByTestId('RATE_LIMIT_CARD_5H').textContent).toMatch(/^\[ 5h.*42%.*\]$/u);
    expect(getByTestId('RATE_LIMIT_CARD_7D').textContent).toMatch(/^\[ 7d.*20%.*\]$/u);
  });

  it('EMPTY: {snapshot null} => renders no stack element', () => {
    const proxy = RateLimitsStackWidgetProxy();
    proxy.setupSnapshot({ snapshot: null });

    const { queryByTestId } = mantineRenderMiddleware({
      ui: <RateLimitsStackWidget />,
    });

    expect(queryByTestId('RATE_LIMITS_STACK')).toBe(null);
  });

  it('EMPTY: {both windows null} => renders no stack element', async () => {
    const proxy = RateLimitsStackWidgetProxy();
    proxy.setupSnapshot({
      snapshot: RateLimitsSnapshotStub({ fiveHour: null, sevenDay: null }),
    });

    const { queryByTestId } = mantineRenderMiddleware({
      ui: <RateLimitsStackWidget />,
    });

    await Promise.resolve();

    expect(queryByTestId('RATE_LIMITS_STACK')).toBe(null);
  });

  it('VALID: {rate-limits-updated WS} => widget re-renders with updated percentage', async () => {
    const proxy = RateLimitsStackWidgetProxy();
    proxy.setupConnectedChannel();
    const futureIso = new Date(Date.now() + 3600_000).toISOString();
    proxy.setupSnapshot({
      snapshot: RateLimitsSnapshotStub({
        fiveHour: RateLimitWindowStub({ usedPercentage: 42, resetsAt: futureIso }),
        sevenDay: RateLimitWindowStub({ usedPercentage: 20, resetsAt: futureIso }),
      }),
    });

    const { getByTestId } = mantineRenderMiddleware({
      ui: <RateLimitsStackWidget />,
    });

    await waitFor(() => {
      expect(getByTestId('RATE_LIMIT_CARD_5H').textContent).toMatch(/^\[ 5h.*42%.*\]$/u);
    });

    proxy.setupSnapshot({
      snapshot: RateLimitsSnapshotStub({
        fiveHour: RateLimitWindowStub({ usedPercentage: 81, resetsAt: futureIso }),
        sevenDay: RateLimitWindowStub({ usedPercentage: 50, resetsAt: futureIso }),
      }),
    });

    act(() => {
      proxy.deliverWsMessage({
        data: JSON.stringify({
          type: 'rate-limits-updated',
          payload: {},
          timestamp: '2026-05-05T13:00:00.000Z',
        }),
      });
    });

    await waitFor(() => {
      expect(getByTestId('RATE_LIMIT_CARD_5H').textContent).toMatch(/^\[ 5h.*81%.*\]$/u);
    });

    expect(getByTestId('RATE_LIMIT_CARD_5H').textContent).toMatch(/^\[ 5h.*81%.*\]$/u);
    expect(getByTestId('RATE_LIMIT_CARD_7D').textContent).toMatch(/^\[ 7d.*50%.*\]$/u);
  });
});
