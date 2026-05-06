import { RateLimitWindowStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { RateLimitCardWidget } from './rate-limit-card-widget';
import { RateLimitCardWidgetProxy } from './rate-limit-card-widget.proxy';

describe('RateLimitCardWidget', () => {
  it('VALID: {label: "5h", pct: 42, futureReset} => renders 5h card with bar', () => {
    RateLimitCardWidgetProxy();
    const futureIso = new Date(Date.now() + 2 * 3600 * 1000 + 5 * 60 * 1000).toISOString();
    const window = RateLimitWindowStub({ usedPercentage: 42, resetsAt: futureIso });

    const { getByTestId } = mantineRenderAdapter({
      ui: <RateLimitCardWidget label="5h" window={window} />,
    });

    const card = getByTestId('RATE_LIMIT_CARD_5H');

    expect(card.textContent).toBe('[ 5h ▰▰▰▱▱▱▱▱ 42% (2h4m) ]');
  });

  it('VALID: {label: "7d", pct: 20, futureReset} => renders 7d card', () => {
    RateLimitCardWidgetProxy();
    const futureIso = new Date(Date.now() + 4 * 86_400 * 1000 + 11 * 3600 * 1000).toISOString();
    const window = RateLimitWindowStub({ usedPercentage: 20, resetsAt: futureIso });

    const { getByTestId } = mantineRenderAdapter({
      ui: <RateLimitCardWidget label="7d" window={window} />,
    });

    const card = getByTestId('RATE_LIMIT_CARD_7D');

    expect(card.textContent).toBe('[ 7d ▰▰▱▱▱▱▱▱ 20% (4d10h) ]');
  });
});
