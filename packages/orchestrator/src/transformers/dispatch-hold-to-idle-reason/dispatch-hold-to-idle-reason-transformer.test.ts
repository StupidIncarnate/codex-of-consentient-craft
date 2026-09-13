import { DispatchHoldStub } from '@dungeonmaster/shared/contracts';

import { dispatchHoldToIdleReasonTransformer } from './dispatch-hold-to-idle-reason-transformer';

describe('dispatchHoldToIdleReasonTransformer', () => {
  it('VALID: {a percentage hold} => names the window, the reading and the reset', () => {
    const result = dispatchHoldToIdleReasonTransformer({
      hold: DispatchHoldStub({
        detail: '7d window at 93% — dispatch holds until it resets',
        resumeAt: '2026-09-20T06:00:00.000Z',
      }),
    });

    expect(result).toBe(
      'rate-limit guardrail: 7d window at 93% — dispatch holds until it resets. Dispatch resumes at 2026-09-20T06:00:00.000Z.',
    );
  });

  it('VALID: {a 429 hold} => names the refusal and the retry time', () => {
    const result = dispatchHoldToIdleReasonTransformer({
      hold: DispatchHoldStub({
        reason: 'rejected',
        detail: 'the API refused a request on the 7d window — dispatch holds, then retries',
        resumeAt: '2026-09-13T05:19:29.242Z',
      }),
    });

    expect(result).toBe(
      'rate-limit guardrail: the API refused a request on the 7d window — dispatch holds, then retries. Dispatch resumes at 2026-09-13T05:19:29.242Z.',
    );
  });
});
