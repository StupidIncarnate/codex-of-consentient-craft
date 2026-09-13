import { RateLimitsSnapshotStub } from '@dungeonmaster/shared/contracts';

import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';
import { rateLimitsState } from '../../../state/rate-limits/rate-limits-state';
import { RateLimitsBootstrapResponder } from './rate-limits-bootstrap-responder';
import { RateLimitsBootstrapResponderProxy } from './rate-limits-bootstrap-responder.proxy';

describe('RateLimitsBootstrapResponder', () => {
  it('VALID: {the dead statusline file has a snapshot in it} => its CONTENT is ignored entirely', async () => {
    const proxy = RateLimitsBootstrapResponderProxy();
    proxy.reset();
    proxy.setupReadSucceeds({ contents: JSON.stringify(RateLimitsSnapshotStub()) });

    const handler = jest.fn();
    orchestrationEventsState.on({ type: 'rate-limits-updated', handler });

    RateLimitsBootstrapResponder();
    proxy.triggerTick();
    await new Promise((resolve) => {
      setImmediate(resolve);
    });

    orchestrationEventsState.removeAllListeners();

    // Neither published nor stored. EvaluateHoldLayerResponder is the single publisher of a
    // reading; a second one here overwrote it on every tick and whichever fired last won, so no
    // reading could be trusted to say where it came from.
    expect([rateLimitsState.get(), handler.mock.calls]).toStrictEqual([null, []]);
  });

  it('VALID: {idempotent calls} => second call returns success without re-bootstrapping', () => {
    const proxy = RateLimitsBootstrapResponderProxy();
    proxy.reset();

    const first = RateLimitsBootstrapResponder();
    const second = RateLimitsBootstrapResponder();

    expect(first).toStrictEqual({ success: true });
    expect(second).toStrictEqual({ success: true });
  });

  describe('rate-limit guardrail', () => {
    it('VALID: {bootstrap} => evaluates once at boot, so a hold persisted before a restart is restored', () => {
      const proxy = RateLimitsBootstrapResponderProxy();
      proxy.reset();

      RateLimitsBootstrapResponder();

      expect(proxy.evaluationCalls()).toStrictEqual([[]]);
    });

    it('VALID: {a changed snapshot arrives} => the tick still drives exactly one pass', async () => {
      const proxy = RateLimitsBootstrapResponderProxy();
      proxy.reset();
      proxy.setupReadSucceeds({ contents: JSON.stringify(RateLimitsSnapshotStub()) });

      RateLimitsBootstrapResponder();
      proxy.triggerTick();
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      // Boot, then the tick. Only TWO: onSnapshot is inert, so a changed file no longer adds a
      // third pass — the tick alone drives the measurement.
      expect(proxy.evaluationCalls()).toStrictEqual([[], []]);
    });

    it('VALID: {a tick with no snapshot change at all} => still evaluates, which is the clock that lifts a hold', async () => {
      const proxy = RateLimitsBootstrapResponderProxy();
      proxy.reset();
      proxy.setupReadEnoent();

      RateLimitsBootstrapResponder();
      proxy.triggerTick();
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      // Boot, then the tick. An ENOENT with nothing previously seen fires no onSnapshot, so this
      // second pass comes from onTick alone. Without it a hold raised at 93% would never lift: the
      // statusline stops rewriting the snapshot once the user leaves their session, so no further
      // change would ever arrive to expire on.
      expect(proxy.evaluationCalls()).toStrictEqual([[], []]);
    });

    it('VALID: {several ticks with no snapshot change} => evaluates on each, so a hold written by another process is read back', async () => {
      const proxy = RateLimitsBootstrapResponderProxy();
      proxy.reset();
      proxy.setupReadEnoent();

      RateLimitsBootstrapResponder();
      proxy.triggerTick();
      proxy.triggerTick();
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      // The spawn layer records a 429 hold straight to dispatch-state.json from wherever it is
      // running; this poll is the only thing that reads it back into this process's memory.
      expect(proxy.evaluationCalls()).toStrictEqual([[], [], []]);
    });
  });
});
