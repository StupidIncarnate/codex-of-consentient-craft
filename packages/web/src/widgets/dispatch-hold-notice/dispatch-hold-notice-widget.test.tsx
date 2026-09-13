import { DispatchHoldStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { DispatchHoldNoticeWidget } from './dispatch-hold-notice-widget';
import { DispatchHoldNoticeWidgetProxy } from './dispatch-hold-notice-widget.proxy';

describe('DispatchHoldNoticeWidget', () => {
  it('VALID: {a seven-day hold resetting in a week} => names the reading and the wait in days', () => {
    const proxy = DispatchHoldNoticeWidgetProxy();
    const hold = DispatchHoldStub({
      detail: '7d window at 93% — dispatch holds until it resets',
      resumeAt: '2026-09-20T06:00:00.000Z',
    });

    mantineRenderAdapter({ ui: <DispatchHoldNoticeWidget hold={hold} /> });

    expect(proxy.noticeText()).toBe(
      'HELD — 7d window at 93% — dispatch holds until it resets · resumes in 7d1h',
    );
  });

  it('VALID: {a 429 hold half an hour out} => names the refusal and the wait in minutes', () => {
    const proxy = DispatchHoldNoticeWidgetProxy();
    const hold = DispatchHoldStub({
      reason: 'rejected',
      detail: 'the API refused a request on the 7d window — dispatch holds, then retries',
      resumeAt: '2026-09-13T05:19:29.242Z',
    });

    mantineRenderAdapter({ ui: <DispatchHoldNoticeWidget hold={hold} /> });

    expect(proxy.noticeText()).toBe(
      'HELD — the API refused a request on the 7d window — dispatch holds, then retries · resumes in 30m',
    );
  });

  it('EDGE: {a hold whose resumeAt has already passed} => reads 0m rather than a negative wait', () => {
    const proxy = DispatchHoldNoticeWidgetProxy();
    const hold = DispatchHoldStub({
      detail: '7d window at 93%',
      resumeAt: '2026-09-13T04:00:00.000Z',
    });

    mantineRenderAdapter({ ui: <DispatchHoldNoticeWidget hold={hold} /> });

    expect(proxy.noticeText()).toBe('HELD — 7d window at 93% · resumes in 0m');
  });
});
