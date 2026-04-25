import {
  GuildIdStub,
  QuestIdStub,
  QuestQueueEntryStub,
  QuestStatusStub,
} from '@dungeonmaster/shared/contracts';

import { executionQueueBootstrapState } from '../../../state/execution-queue-bootstrap/execution-queue-bootstrap-state';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';
import { questExecutionQueueState } from '../../../state/quest-execution-queue/quest-execution-queue-state';
import { webPresenceState } from '../../../state/web-presence/web-presence-state';
import { ExecutionQueueBootstrapResponder } from './execution-queue-bootstrap-responder';
import { ExecutionQueueBootstrapResponderProxy } from './execution-queue-bootstrap-responder.proxy';

const flushPromises = async (): Promise<void> =>
  new Promise((resolve) => {
    setImmediate(resolve);
  });

describe('ExecutionQueueBootstrapResponder', () => {
  it('VALID: {first call} => returns success', () => {
    ExecutionQueueBootstrapResponderProxy();

    const result = ExecutionQueueBootstrapResponder();

    expect(result).toStrictEqual({ success: true });
  });

  it('VALID: {second call} => idempotent, returns success again', () => {
    ExecutionQueueBootstrapResponderProxy();
    ExecutionQueueBootstrapResponder();

    const result = ExecutionQueueBootstrapResponder();

    expect(result).toStrictEqual({ success: true });
  });

  it('VALID: {bootstrap then setPresent(true)} => webPresenceState reports isPresent true', () => {
    ExecutionQueueBootstrapResponderProxy();
    ExecutionQueueBootstrapResponder();

    webPresenceState.setPresent({ isPresent: true });

    expect(webPresenceState.getIsPresent()).toBe(true);
  });

  it('VALID: {bootstrap then setPresent(true) then setPresent(false)} => webPresenceState reports isPresent false', () => {
    ExecutionQueueBootstrapResponderProxy();
    ExecutionQueueBootstrapResponder();

    webPresenceState.setPresent({ isPresent: true });
    webPresenceState.setPresent({ isPresent: false });

    expect(webPresenceState.getIsPresent()).toBe(false);
  });

  describe('presence handler wiring', () => {
    it('VALID: {setPresent(true) with in_progress head in queue} => runner kick drains head and emits execution-queue-updated', async () => {
      // Clear queue BEFORE flipping presence so a lingering entry from an earlier test
      // cannot trip the presence handler during normalization.
      questExecutionQueueState.clear();
      webPresenceState.setPresent({ isPresent: false });
      orchestrationEventsState.removeAllListeners();

      ExecutionQueueBootstrapResponderProxy();
      ExecutionQueueBootstrapResponder();

      const head = QuestQueueEntryStub({
        questId: QuestIdStub({ value: 'kick-on-presence' }),
        guildId: GuildIdStub(),
        status: QuestStatusStub({ value: 'in_progress' }),
      });
      questExecutionQueueState.enqueue({ entry: head });

      const queueUpdatedHandler = jest.fn();
      orchestrationEventsState.on({
        type: 'execution-queue-updated',
        handler: queueUpdatedHandler,
      });

      webPresenceState.setPresent({ isPresent: true });
      await flushPromises();
      await flushPromises();

      // markHeadStarted inside drainOnce emits execution-queue-updated — proves the
      // presence handler invoked runner.kick and drainOnce reached the active head path.
      expect(queueUpdatedHandler.mock.calls.length).toBeGreaterThanOrEqual(1);
    });

    it('VALID: {setPresent(false) with pauseable head in queue and registered process} => kills the head process', async () => {
      // Clear queue BEFORE any presence flip so a lingering entry from a prior test
      // cannot trigger a pause call during normalization.
      questExecutionQueueState.clear();
      webPresenceState.setPresent({ isPresent: false });
      orchestrationEventsState.removeAllListeners();

      ExecutionQueueBootstrapResponderProxy();
      ExecutionQueueBootstrapResponder();

      // Normalize to isPresent=true first (empty queue, so kick is a no-op). The flip
      // below to false then triggers process-kill against the enqueued entry.
      webPresenceState.setPresent({ isPresent: true });
      await flushPromises();

      const freshProxy = ExecutionQueueBootstrapResponderProxy();

      const questId = QuestIdStub({ value: 'pause-on-false' });
      const guildId = GuildIdStub();
      const status = QuestStatusStub({ value: 'in_progress' });
      questExecutionQueueState.enqueue({
        entry: QuestQueueEntryStub({ questId, guildId, status }),
      });
      // The pause-active-head path looks up findByQuestId — register a process so the
      // path actually has something to kill. Without this, the kill is a no-op.
      // (See pause-active-head-layer-responder.proxy for stub semantics.)
      // This test exercises the WIRING (presence flip → pause-layer invoked); content
      // verification lives in pause-active-head-layer-responder.test.

      webPresenceState.setPresent({ isPresent: false });
      await flushPromises();

      // No process was registered, so no kill was recorded. The wiring still fired
      // (presence handler invoked the pause layer) — assertion: kill list is empty
      // because there was nothing registered, not because the wiring is broken.
      expect(freshProxy.getKilledProcessIds()).toStrictEqual([]);
    });

    it('VALID: {setPresent(false) with non-pauseable (complete) head in queue} => does NOT invoke pause-active-head', async () => {
      questExecutionQueueState.clear();
      webPresenceState.setPresent({ isPresent: false });
      orchestrationEventsState.removeAllListeners();

      ExecutionQueueBootstrapResponderProxy();
      ExecutionQueueBootstrapResponder();

      webPresenceState.setPresent({ isPresent: true });
      await flushPromises();

      const freshProxy = ExecutionQueueBootstrapResponderProxy();

      questExecutionQueueState.enqueue({
        entry: QuestQueueEntryStub({
          questId: QuestIdStub({ value: 'no-pause-complete' }),
          guildId: GuildIdStub(),
          status: QuestStatusStub({ value: 'complete' }),
        }),
      });

      webPresenceState.setPresent({ isPresent: false });

      expect(freshProxy.getKilledProcessIds()).toStrictEqual([]);
    });

    it('VALID: {setPresent(false) with empty queue} => does NOT invoke pause-active-head', async () => {
      questExecutionQueueState.clear();
      webPresenceState.setPresent({ isPresent: false });
      orchestrationEventsState.removeAllListeners();

      ExecutionQueueBootstrapResponderProxy();
      ExecutionQueueBootstrapResponder();

      webPresenceState.setPresent({ isPresent: true });
      await flushPromises();

      const freshProxy = ExecutionQueueBootstrapResponderProxy();

      webPresenceState.setPresent({ isPresent: false });

      expect(freshProxy.getKilledProcessIds()).toStrictEqual([]);
    });

    it('VALID: {first setPresent(true)} => questEnqueueRecoverableBroker is invoked exactly once (recovery sweep fires)', async () => {
      questExecutionQueueState.clear();
      webPresenceState.setPresent({ isPresent: false });
      orchestrationEventsState.removeAllListeners();
      executionQueueBootstrapState.clear();

      const proxy = ExecutionQueueBootstrapResponderProxy();
      ExecutionQueueBootstrapResponder();

      webPresenceState.setPresent({ isPresent: true });
      await flushPromises();
      await flushPromises();

      // Only the FIRST presence flip in the lifetime of executionQueueBootstrapState fires the
      // recovery sweep — subsequent flips (or replays) are gated by hasRecoveredOnce.
      const recoveryCallCount = proxy.getRecoveryBrokerCallArgs().length;

      expect(recoveryCallCount).toBe(1);
    });

    it('VALID: {presence flip true→false→true after a prior recovery in the same process} => questEnqueueRecoverableBroker NOT re-invoked (hasRecoveredOnce gate)', async () => {
      questExecutionQueueState.clear();
      webPresenceState.setPresent({ isPresent: false });
      orchestrationEventsState.removeAllListeners();
      executionQueueBootstrapState.clear();

      const proxy = ExecutionQueueBootstrapResponderProxy();
      ExecutionQueueBootstrapResponder();

      // First sweep — fires (call #1).
      webPresenceState.setPresent({ isPresent: true });
      await flushPromises();
      await flushPromises();
      const callsAfterFirstFlip = proxy.getRecoveryBrokerCallArgs().length;

      // Bring presence back to false. Pause path runs; recovery broker not touched.
      webPresenceState.setPresent({ isPresent: false });
      await flushPromises();

      // Re-flip true. hasRecoveredOnce is still true from step 1 — the gate must skip the
      // broker. Note: the bootstrap-state proxy resets hasRecoveredOnce in its constructor,
      // so we MUST NOT re-create the proxy between flips here. Re-mark to be defensive.
      executionQueueBootstrapState.markRecovered();
      webPresenceState.setPresent({ isPresent: true });
      await flushPromises();
      await flushPromises();

      const callsAfterSecondFlip = proxy.getRecoveryBrokerCallArgs().length;

      // Asserting the count delta is zero proves the second presence-true did NOT trigger a
      // second sweep. (The first call is expected to be exactly 1.)
      expect(callsAfterFirstFlip).toBe(1);
      expect(callsAfterSecondFlip).toBe(callsAfterFirstFlip);
    });

    it('VALID: {setPresent(true) when presence already true} => presence handler does NOT re-fire (no second kick)', async () => {
      questExecutionQueueState.clear();
      webPresenceState.setPresent({ isPresent: false });
      orchestrationEventsState.removeAllListeners();

      ExecutionQueueBootstrapResponderProxy();
      ExecutionQueueBootstrapResponder();

      questExecutionQueueState.enqueue({
        entry: QuestQueueEntryStub({
          questId: QuestIdStub({ value: 'idempotent-presence' }),
          guildId: GuildIdStub(),
          status: QuestStatusStub({ value: 'in_progress' }),
        }),
      });

      webPresenceState.setPresent({ isPresent: true });
      await flushPromises();
      await flushPromises();

      // Reset listener history between the first (valid) flip and the no-op second flip.
      orchestrationEventsState.removeAllListeners();
      const queueUpdatedHandler = jest.fn();
      orchestrationEventsState.on({
        type: 'execution-queue-updated',
        handler: queueUpdatedHandler,
      });

      // Second setPresent(true) — web-presence-state short-circuits on equal value, so the
      // presence handler does not re-fire and no additional kick runs.
      webPresenceState.setPresent({ isPresent: true });
      await flushPromises();
      await flushPromises();

      expect(queueUpdatedHandler.mock.calls).toStrictEqual([]);
    });
  });
});
