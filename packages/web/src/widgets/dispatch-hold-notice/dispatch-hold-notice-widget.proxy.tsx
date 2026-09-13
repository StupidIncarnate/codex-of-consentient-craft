import { screen } from '@testing-library/react';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

export const DispatchHoldNoticeWidgetProxy = (): {
  noticeText: () => unknown;
} => {
  // The notice reports a duration measured from now, so the clock is pinned to make that string an
  // exact value a test can assert.
  registerSpyOn({ object: Date, method: 'now' })
    .calledWith([])
    .returns(Date.parse('2026-09-13T04:49:29.242Z'));

  return {
    noticeText: (): unknown => screen.queryByTestId('DISPATCH_HOLD_NOTICE')?.textContent ?? null,
  };
};
