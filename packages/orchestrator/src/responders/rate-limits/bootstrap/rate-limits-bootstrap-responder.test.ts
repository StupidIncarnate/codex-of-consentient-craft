import { RateLimitsSnapshotStub } from '@dungeonmaster/shared/contracts';

import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';
import { rateLimitsState } from '../../../state/rate-limits/rate-limits-state';
import { RateLimitsBootstrapResponder } from './rate-limits-bootstrap-responder';
import { RateLimitsBootstrapResponderProxy } from './rate-limits-bootstrap-responder.proxy';

describe('RateLimitsBootstrapResponder', () => {
  it('VALID: {tick produces snapshot} => updates state and emits rate-limits-updated event', async () => {
    const proxy = RateLimitsBootstrapResponderProxy();
    proxy.reset();
    const json = JSON.stringify(RateLimitsSnapshotStub());
    proxy.setupReadSucceeds({ contents: json });

    const handler = jest.fn();
    orchestrationEventsState.on({ type: 'rate-limits-updated', handler });

    RateLimitsBootstrapResponder();
    proxy.triggerTick();
    await new Promise((resolve) => {
      setImmediate(resolve);
    });

    orchestrationEventsState.removeAllListeners();

    expect(rateLimitsState.get()).toStrictEqual(RateLimitsSnapshotStub());
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('VALID: {idempotent calls} => second call returns success without re-bootstrapping', () => {
    const proxy = RateLimitsBootstrapResponderProxy();
    proxy.reset();

    const first = RateLimitsBootstrapResponder();
    const second = RateLimitsBootstrapResponder();

    expect(first).toStrictEqual({ success: true });
    expect(second).toStrictEqual({ success: true });
  });
});
