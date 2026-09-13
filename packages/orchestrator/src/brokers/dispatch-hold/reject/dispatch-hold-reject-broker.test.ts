import { DispatchHoldStub } from '@dungeonmaster/shared/contracts';

import { dispatchHoldRejectBroker } from './dispatch-hold-reject-broker';
import { dispatchHoldRejectBrokerProxy } from './dispatch-hold-reject-broker.proxy';

const NOW_MS = Date.parse('2026-09-13T04:49:29.242Z');
// The refusal that actually killed a siegemaster session mid-quest.
const WEEKLY_REFUSAL = "You've hit your weekly limit · resets Sep 12, 11pm (America/Los_Angeles)";
// The write broker's proxy pins Date.prototype.toISOString, so every timestamp this broker produces
// reads back as the same instant and the 30-minute gap between heldAt and resumeAt is invisible
// here. That offset is measured against a real clock in
// rate-limit-rejection-to-hold-transformer.test.ts; what THIS suite grades is which hold gets
// written and which one survives.
const PINNED = '2024-01-15T10:00:00.000Z';

describe('dispatchHoldRejectBroker', () => {
  describe('nothing held yet', () => {
    it('VALID: {a weekly refusal} => records a seven-day hold resuming after the fixed wait', async () => {
      const proxy = dispatchHoldRejectBrokerProxy();
      proxy.setupNoHeldState();

      const result = await dispatchHoldRejectBroker({ line: WEEKLY_REFUSAL, nowMs: NOW_MS });

      expect(result).toStrictEqual({
        reason: 'rejected',
        window: 'seven-day',
        detail: 'the API refused a request on the 7d window — dispatch holds, then retries',
        heldAt: PINNED,
        resumeAt: PINNED,
      });
    });

    it('VALID: {a refusal while the dispatcher is playing} => the write preserves node-playing', async () => {
      const proxy = dispatchHoldRejectBrokerProxy();
      proxy.setupPlayingNoHeldState();

      await dispatchHoldRejectBroker({ line: WEEKLY_REFUSAL, nowMs: NOW_MS });

      expect(JSON.parse(String(proxy.getWrittenContent()))).toStrictEqual({
        mode: 'node-playing',
        hold: {
          reason: 'rejected',
          window: 'seven-day',
          detail: 'the API refused a request on the 7d window — dispatch holds, then retries',
          heldAt: PINNED,
          resumeAt: PINNED,
        },
        updatedAt: PINNED,
      });
    });
  });

  describe('learning the ceiling', () => {
    it('VALID: {a weekly refusal} => calibrates the seven-day window at that instant', async () => {
      const proxy = dispatchHoldRejectBrokerProxy();
      proxy.setupNoHeldState();

      await dispatchHoldRejectBroker({ line: WEEKLY_REFUSAL, nowMs: NOW_MS });

      // A refusal is the ONE measurement that reveals a window's real ceiling, and it has to be
      // taken now — by the next scan the window has started draining and the number reads low.
      expect(proxy.getCalibrateCalls()).toStrictEqual([{ window: 'seven-day', nowMs: NOW_MS }]);
    });

    it('VALID: {a five-hour refusal} => calibrates that window instead', async () => {
      const proxy = dispatchHoldRejectBrokerProxy();
      proxy.setupNoHeldState();

      await dispatchHoldRejectBroker({
        line: "You've hit your 5-hour limit · resets 3pm",
        nowMs: NOW_MS,
      });

      expect(proxy.getCalibrateCalls()).toStrictEqual([{ window: 'five-hour', nowMs: NOW_MS }]);
    });

    it('VALID: {a hold already stands} => calibrates nothing, because the window already drained', async () => {
      const proxy = dispatchHoldRejectBrokerProxy();
      proxy.setupHeldState({
        hold: DispatchHoldStub({ reason: 'rejected', resumeAt: '2026-09-13T05:19:29.242Z' }),
      });

      await dispatchHoldRejectBroker({ line: WEEKLY_REFUSAL, nowMs: NOW_MS });

      expect(proxy.getCalibrateCalls()).toStrictEqual([]);
    });
  });

  describe('a hold already stands', () => {
    it('VALID: {a second child dies on the same refusal} => keeps the first hold and writes nothing', async () => {
      const proxy = dispatchHoldRejectBrokerProxy();
      const hold = DispatchHoldStub({
        reason: 'rejected',
        resumeAt: '2026-09-13T05:19:29.242Z',
      });
      proxy.setupHeldState({ hold });

      const result = await dispatchHoldRejectBroker({ line: WEEKLY_REFUSAL, nowMs: NOW_MS });

      expect(result).toStrictEqual({
        reason: 'rejected',
        window: 'seven-day',
        detail: '7d window at 93%',
        heldAt: '2026-09-13T04:49:29.242Z',
        resumeAt: '2026-09-13T05:19:29.242Z',
      });
      expect(proxy.getWrittenContent()).toBe(undefined);
    });

    it('VALID: {the standing hold has expired} => records a fresh one', async () => {
      const proxy = dispatchHoldRejectBrokerProxy();
      proxy.setupHeldState({
        hold: DispatchHoldStub({ resumeAt: '2026-09-13T04:00:00.000Z' }),
      });

      const result = await dispatchHoldRejectBroker({ line: WEEKLY_REFUSAL, nowMs: NOW_MS });

      expect(result).toStrictEqual({
        reason: 'rejected',
        window: 'seven-day',
        detail: 'the API refused a request on the 7d window — dispatch holds, then retries',
        heldAt: PINNED,
        resumeAt: PINNED,
      });
    });
  });
});
