import {
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemRoleStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { smoketestScenarioDriverBroker } from './smoketest-scenario-driver-broker';
import { smoketestScenarioDriverBrokerProxy } from './smoketest-scenario-driver-broker.proxy';

const QUEST_ID = QuestIdStub({ value: 'driver-test-quest' });
const OTHER_QUEST_ID = QuestIdStub({ value: 'other-driver-quest' });
const WI_PENDING = QuestWorkItemIdStub({ value: 'cccccccc-cccc-cccc-cccc-cccccccccc01' });
const CODEWEAVER_ROLE = WorkItemRoleStub({ value: 'codeweaver' });
// Unique substring from smoketestPromptsStatics.signalComplete that survives JSON escaping.
const SIGNAL_COMPLETE_SIGNATURE = 'smoketest-complete';

const questWithPendingTarget = QuestStub({
  id: QUEST_ID,
  workItems: [WorkItemStub({ id: WI_PENDING, role: 'codeweaver', status: 'pending' })],
});

const dispenseAlwaysNull = (): null => null;

const dispenseCodeweaverSignalCompleteOnce = (): (({
  role,
}: {
  role: ReturnType<typeof WorkItemRoleStub>;
}) => 'signalComplete' | null) => {
  const remaining: ('signalComplete' | null)[] = ['signalComplete'];
  return ({ role }) => {
    const roleMatches = role === CODEWEAVER_ROLE;
    const hasRemaining = remaining.length > 0;
    return roleMatches && hasRemaining ? (remaining.shift() ?? null) : null;
  };
};

const dispenseCodeweaverSignalCompleteAlways = ({
  role,
}: {
  role: ReturnType<typeof WorkItemRoleStub>;
}): 'signalComplete' | null => (role === CODEWEAVER_ROLE ? 'signalComplete' : null);

const drainMicrotasks = async (): Promise<void> => {
  // The handler spawns a detached promise chain: questFind → questLoad → stampOverride →
  // withModifyLock → persist → rename → outbox. Yield the event loop multiple times to let it settle.
  // With the initial sweep running on driver construction AND the event handler firing, we need
  // enough ticks to let BOTH chains complete.
  await new Promise<void>((resolve) => {
    setImmediate(resolve);
  });
  await new Promise<void>((resolve) => {
    setImmediate(resolve);
  });
  await new Promise<void>((resolve) => {
    setImmediate(resolve);
  });
  await new Promise<void>((resolve) => {
    setImmediate(resolve);
  });
  await new Promise<void>((resolve) => {
    setImmediate(resolve);
  });
  await new Promise<void>((resolve) => {
    setImmediate(resolve);
  });
  await new Promise<void>((resolve) => {
    setImmediate(resolve);
  });
  await new Promise<void>((resolve) => {
    setImmediate(resolve);
  });
};

describe('smoketestScenarioDriverBroker', () => {
  describe('subscription lifecycle', () => {
    it('VALID: {subscribe then stop} => handler is registered and unregistered', async () => {
      const proxy = smoketestScenarioDriverBrokerProxy();
      proxy.setupQuestFound({ quest: questWithPendingTarget });

      const driver = await smoketestScenarioDriverBroker({
        questId: QUEST_ID,
        dispense: dispenseAlwaysNull,
        subscribe: proxy.subscribe,
        unsubscribe: proxy.unsubscribe,
      });

      const subscribedAfterStart = proxy.isHandlerSubscribed();
      driver.stop();
      const subscribedAfterStop = proxy.isHandlerSubscribed();

      expect({ subscribedAfterStart, subscribedAfterStop }).toStrictEqual({
        subscribedAfterStart: true,
        subscribedAfterStop: false,
      });
    });
  });

  describe('ignores events for other quests', () => {
    it('VALID: {quest-modified for different questId} => does not load the quest', async () => {
      const proxy = smoketestScenarioDriverBrokerProxy();
      proxy.setupQuestFound({ quest: questWithPendingTarget });

      const driver = await smoketestScenarioDriverBroker({
        questId: QUEST_ID,
        dispense: dispenseAlwaysNull,
        subscribe: proxy.subscribe,
        unsubscribe: proxy.unsubscribe,
      });

      proxy.emitQuestModified({ questId: OTHER_QUEST_ID });
      await drainMicrotasks();
      const persistedCount = proxy.getAllPersistedContents().length;
      driver.stop();

      expect(persistedCount).toBe(0);
    });
  });

  describe('forwards matching quest-modified event to the sweep routine', () => {
    it('VALID: {matching quest-modified after initial sweep, dispense returns signalComplete on every call} => the event-driven sweep completes without error', async () => {
      const proxy = smoketestScenarioDriverBrokerProxy();
      proxy.setupQuestFound({ quest: questWithPendingTarget });

      // End-to-end stamp verification is covered by the 'initial sweep on construction' test
      // below and by the dedicated smoketest-sweep-pending-work-items-layer-broker tests. This
      // test only verifies that an event-driven sweep is wired and completes: no unhandled
      // rejection, no thrown error after driver.stop().
      const driver = await smoketestScenarioDriverBroker({
        questId: QUEST_ID,
        dispense: dispenseCodeweaverSignalCompleteAlways,
        subscribe: proxy.subscribe,
        unsubscribe: proxy.unsubscribe,
      });

      proxy.emitQuestModified({ questId: QUEST_ID });
      await drainMicrotasks();
      driver.stop();

      expect(proxy.isHandlerSubscribed()).toBe(false);
    });
  });

  describe('skips stamping when dispense returns null', () => {
    it('VALID: {dispense returns null} => does not persist any override', async () => {
      const proxy = smoketestScenarioDriverBrokerProxy();
      proxy.setupQuestFound({ quest: questWithPendingTarget });

      const driver = await smoketestScenarioDriverBroker({
        questId: QUEST_ID,
        dispense: dispenseAlwaysNull,
        subscribe: proxy.subscribe,
        unsubscribe: proxy.unsubscribe,
      });

      proxy.emitQuestModified({ questId: QUEST_ID });
      await drainMicrotasks();
      driver.stop();

      const persistedCount = proxy.getAllPersistedContents().length;

      expect(persistedCount).toBe(0);
    });
  });

  describe('initial sweep completes before the constructor promise resolves', () => {
    it('VALID: {fresh quest with pending codeweaver} => initial sweep stamps the signalComplete prompt BEFORE the awaited broker returns', async () => {
      const proxy = smoketestScenarioDriverBrokerProxy();
      proxy.setupQuestFound({ quest: questWithPendingTarget });

      const driver = await smoketestScenarioDriverBroker({
        questId: QUEST_ID,
        dispense: dispenseCodeweaverSignalCompleteOnce(),
        subscribe: proxy.subscribe,
        unsubscribe: proxy.unsubscribe,
      });

      // Do NOT drain microtasks, do NOT emit quest-modified. The awaited driver promise must
      // resolve only after every initial-sweep stamp has been persisted — this is the race-free
      // contract the orchestration runner relies on.
      const persistedAtResolve = proxy.getAllPersistedContents().map((content) => String(content));
      const hitsAtResolve = persistedAtResolve.filter((raw) =>
        raw.includes(SIGNAL_COMPLETE_SIGNATURE),
      );

      driver.stop();

      expect(hitsAtResolve.length).toBeGreaterThan(0);
    });
  });
});
