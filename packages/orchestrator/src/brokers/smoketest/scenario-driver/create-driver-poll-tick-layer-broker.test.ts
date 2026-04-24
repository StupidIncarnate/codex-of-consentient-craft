import {
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemRoleStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { createDriverPollTickLayerBroker } from './create-driver-poll-tick-layer-broker';
import { createDriverPollTickLayerBrokerProxy } from './create-driver-poll-tick-layer-broker.proxy';

const QUEST_ID = QuestIdStub({ value: 'poll-tick-quest' });
const WI_PENDING = QuestWorkItemIdStub({ value: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01' });
const CODEWEAVER_ROLE = WorkItemRoleStub({ value: 'codeweaver' });

const questWithPendingCodeweaver = QuestStub({
  id: QUEST_ID,
  workItems: [WorkItemStub({ id: WI_PENDING, role: 'codeweaver', status: 'pending' })],
});

const dispenseAlwaysNull = (): null => null;
const dispenseSignalComplete = ({
  role,
}: {
  role: ReturnType<typeof WorkItemRoleStub>;
}): 'signalComplete' | null => (role === CODEWEAVER_ROLE ? 'signalComplete' : null);

const drainMicrotasks = async (): Promise<void> => {
  // The sweep spawns a detached promise chain (questFind → questLoad → stampOverride → withModifyLock
  // → persist → rename → outbox). Yield repeatedly so the full chain settles before assertions run.
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

describe('createDriverPollTickLayerBroker', () => {
  describe('early return when abort signal already aborted', () => {
    it('VALID: {abortSignal pre-aborted} => tick does not invoke sweep', async () => {
      const proxy = createDriverPollTickLayerBrokerProxy();
      proxy.setupQuestFound({ quest: questWithPendingCodeweaver });
      const controller = new AbortController();
      controller.abort();
      let stopNowCalls = 0;
      let goneCalls = 0;

      const tick = createDriverPollTickLayerBroker({
        questId: QUEST_ID,
        abortSignal: controller.signal,
        dispense: dispenseSignalComplete,
        stopNow: (): void => {
          stopNowCalls += 1;
        },
        onQuestGone: (): void => {
          goneCalls += 1;
        },
      });
      tick();
      await drainMicrotasks();

      expect({
        persistedCount: proxy.getAllPersistedContents().length,
        stopNowCalls,
        goneCalls,
      }).toStrictEqual({ persistedCount: 0, stopNowCalls: 0, goneCalls: 0 });
    });
  });

  describe('quest-gone triggers stopNow + onQuestGone', () => {
    it('VALID: {sweep fails with "not found in any guild"} => stopNow fires and onQuestGone fires once with questId', async () => {
      const proxy = createDriverPollTickLayerBrokerProxy();
      proxy.setupQuestNotFound();
      const controller = new AbortController();
      let stopNowCalls = 0;
      const goneQuestIds: ReturnType<typeof QuestIdStub>[] = [];

      const tick = createDriverPollTickLayerBroker({
        questId: QUEST_ID,
        abortSignal: controller.signal,
        dispense: dispenseAlwaysNull,
        stopNow: (): void => {
          stopNowCalls += 1;
        },
        onQuestGone: ({ questId }): void => {
          goneQuestIds.push(questId);
        },
      });
      tick();
      await drainMicrotasks();

      expect({ stopNowCalls, goneQuestIds }).toStrictEqual({
        stopNowCalls: 1,
        goneQuestIds: [QUEST_ID],
      });
    });
  });

  describe('quest-gone without onQuestGone callback is safe', () => {
    it('VALID: {sweep fails quest-not-found, no onQuestGone supplied} => stopNow still fires, no throw', async () => {
      const proxy = createDriverPollTickLayerBrokerProxy();
      proxy.setupQuestNotFound();
      const controller = new AbortController();
      let stopNowCalls = 0;

      const tick = createDriverPollTickLayerBroker({
        questId: QUEST_ID,
        abortSignal: controller.signal,
        dispense: dispenseAlwaysNull,
        stopNow: (): void => {
          stopNowCalls += 1;
        },
      });
      tick();
      await drainMicrotasks();

      expect(stopNowCalls).toBe(1);
    });
  });

  describe('successful sweep does not stop the driver', () => {
    it('VALID: {sweep succeeds} => stopNow never fires, onQuestGone never fires', async () => {
      const proxy = createDriverPollTickLayerBrokerProxy();
      proxy.setupQuestFound({ quest: questWithPendingCodeweaver });
      const controller = new AbortController();
      let stopNowCalls = 0;
      let goneCalls = 0;

      const tick = createDriverPollTickLayerBroker({
        questId: QUEST_ID,
        abortSignal: controller.signal,
        dispense: dispenseSignalComplete,
        stopNow: (): void => {
          stopNowCalls += 1;
        },
        onQuestGone: (): void => {
          goneCalls += 1;
        },
      });
      tick();
      await drainMicrotasks();

      expect({ stopNowCalls, goneCalls }).toStrictEqual({ stopNowCalls: 0, goneCalls: 0 });
    });
  });
});
