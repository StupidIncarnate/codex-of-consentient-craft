import {
  DispatchHoldStub,
  RateLimitWindowStub,
  RateLimitsSnapshotStub,
} from '@dungeonmaster/shared/contracts';

import { dispatchHoldEvaluateBroker } from './dispatch-hold-evaluate-broker';
import { dispatchHoldEvaluateBrokerProxy } from './dispatch-hold-evaluate-broker.proxy';

const NOW_MS = Date.parse('2026-09-13T04:49:29.242Z');
const RESET_AT = '2026-09-13T06:00:00.000Z';
const BREACHING_SNAPSHOT = RateLimitsSnapshotStub({
  sevenDay: RateLimitWindowStub({ usedPercentage: 93, resetsAt: RESET_AT }),
});

describe('dispatchHoldEvaluateBroker', () => {
  describe('nothing held', () => {
    it('VALID: {no hold, both windows under} => returns null and writes nothing', async () => {
      const proxy = dispatchHoldEvaluateBrokerProxy();
      proxy.setupNoHeldState();

      const result = await dispatchHoldEvaluateBroker({
        snapshot: RateLimitsSnapshotStub(),
        nowMs: NOW_MS,
      });

      expect(result).toBe(null);
      expect(proxy.getWrittenContent()).toBe(undefined);
    });

    it('VALID: {no hold, sevenDay at 93%} => raises a hold resuming at that window reset', async () => {
      const proxy = dispatchHoldEvaluateBrokerProxy();
      proxy.setupNoHeldState();

      const result = await dispatchHoldEvaluateBroker({
        snapshot: BREACHING_SNAPSHOT,
        nowMs: NOW_MS,
      });

      expect(result).toStrictEqual({
        reason: 'approaching-limit',
        window: 'seven-day',
        detail: '7d window at 93% — dispatch holds until it resets',
        heldAt: '2024-01-15T10:00:00.000Z',
        resumeAt: RESET_AT,
      });
    });

    it('EMPTY: {no hold, snapshot null} => returns null and writes nothing', async () => {
      const proxy = dispatchHoldEvaluateBrokerProxy();
      proxy.setupNoHeldState();

      const result = await dispatchHoldEvaluateBroker({ snapshot: null, nowMs: NOW_MS });

      expect(result).toBe(null);
      expect(proxy.getWrittenContent()).toBe(undefined);
    });
  });

  describe('a hold is live', () => {
    it('VALID: {hold not yet expired} => returns it unchanged and writes nothing', async () => {
      const proxy = dispatchHoldEvaluateBrokerProxy();
      const hold = DispatchHoldStub({ resumeAt: RESET_AT });
      proxy.setupHeldState({ hold });

      const result = await dispatchHoldEvaluateBroker({
        snapshot: RateLimitsSnapshotStub(),
        nowMs: NOW_MS,
      });

      expect(result).toStrictEqual({
        reason: 'approaching-limit',
        window: 'seven-day',
        detail: '7d window at 93%',
        heldAt: '2026-09-13T04:49:29.242Z',
        resumeAt: RESET_AT,
      });
      expect(proxy.getWrittenContent()).toBe(undefined);
    });

    it('VALID: {hold live, snapshot has since dipped under the threshold} => keeps holding', async () => {
      const proxy = dispatchHoldEvaluateBrokerProxy();
      proxy.setupHeldState({ hold: DispatchHoldStub({ resumeAt: RESET_AT }) });

      // A reading under the line does NOT prove the window reset — only resumeAt does.
      const result = await dispatchHoldEvaluateBroker({
        snapshot: RateLimitsSnapshotStub({
          sevenDay: RateLimitWindowStub({ usedPercentage: 12 }),
        }),
        nowMs: NOW_MS,
      });

      expect(result).toStrictEqual({
        reason: 'approaching-limit',
        window: 'seven-day',
        detail: '7d window at 93%',
        heldAt: '2026-09-13T04:49:29.242Z',
        resumeAt: RESET_AT,
      });
      expect(proxy.getWrittenContent()).toBe(undefined);
    });
  });

  describe('a hold expires', () => {
    it('VALID: {expired hold, windows now clear} => clears the hold and returns null', async () => {
      const proxy = dispatchHoldEvaluateBrokerProxy();
      proxy.setupHeldState({ hold: DispatchHoldStub({ resumeAt: RESET_AT }) });

      const result = await dispatchHoldEvaluateBroker({
        snapshot: RateLimitsSnapshotStub(),
        nowMs: Date.parse(RESET_AT),
      });

      expect(result).toBe(null);
      expect(JSON.parse(String(proxy.getWrittenContent()))).toStrictEqual({
        mode: 'paused',
        hold: null,
        updatedAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: {expired 429 hold, window still spent} => re-holds on the fresh reading', async () => {
      const proxy = dispatchHoldEvaluateBrokerProxy();
      proxy.setupHeldState({
        hold: DispatchHoldStub({ reason: 'rejected', resumeAt: RESET_AT }),
      });

      const result = await dispatchHoldEvaluateBroker({
        snapshot: BREACHING_SNAPSHOT,
        nowMs: Date.parse(RESET_AT),
      });

      expect(result).toStrictEqual({
        reason: 'approaching-limit',
        window: 'seven-day',
        detail: '7d window at 93% — dispatch holds until it resets',
        heldAt: '2024-01-15T10:00:00.000Z',
        resumeAt: RESET_AT,
      });
    });

    it('VALID: {expired hold while the user has play pressed} => the lift keeps mode node-playing', async () => {
      const proxy = dispatchHoldEvaluateBrokerProxy();
      proxy.setupPlayingHeldState({ hold: DispatchHoldStub({ resumeAt: RESET_AT }) });

      await dispatchHoldEvaluateBroker({
        snapshot: RateLimitsSnapshotStub(),
        nowMs: Date.parse(RESET_AT),
      });

      expect(JSON.parse(String(proxy.getWrittenContent()))).toStrictEqual({
        mode: 'node-playing',
        hold: null,
        updatedAt: '2024-01-15T10:00:00.000Z',
      });
    });
  });
});
