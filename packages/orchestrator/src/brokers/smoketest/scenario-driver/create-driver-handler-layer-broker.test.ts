import {
  ProcessIdStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemRoleStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { PromptTextStub } from '../../../contracts/prompt-text/prompt-text.stub';
import { createDriverHandlerLayerBroker } from './create-driver-handler-layer-broker';
import { createDriverHandlerLayerBrokerProxy } from './create-driver-handler-layer-broker.proxy';

const QUEST_ID = QuestIdStub({ value: 'layer-handler-quest' });
const OTHER_QUEST_ID = QuestIdStub({ value: 'other-layer-quest' });
const WI_PENDING = QuestWorkItemIdStub({ value: 'dddddddd-dddd-dddd-dddd-dddddddddd01' });
const CODEWEAVER_ROLE = WorkItemRoleStub({ value: 'codeweaver' });
const EMITTED_PROCESS_ID = ProcessIdStub({ value: 'layer-handler-proc' });
// Unique substring from smoketestPromptsStatics.signalComplete that survives JSON escaping.
const SIGNAL_COMPLETE_SIGNATURE = 'smoketest-complete';

const questWithPendingCodeweaver = QuestStub({
  id: QUEST_ID,
  workItems: [WorkItemStub({ id: WI_PENDING, role: 'codeweaver', status: 'pending' })],
});

const questWithStampedCodeweaver = QuestStub({
  id: QUEST_ID,
  workItems: [
    WorkItemStub({
      id: WI_PENDING,
      role: 'codeweaver',
      status: 'pending',
      smoketestPromptOverride: PromptTextStub({ value: 'pre-existing stamp' }),
    }),
  ],
});

const dispenseAlwaysNull = (): null => null;
const dispenseSignalComplete = ({
  role,
}: {
  role: ReturnType<typeof WorkItemRoleStub>;
}): 'signalComplete' | null => (role === CODEWEAVER_ROLE ? 'signalComplete' : null);

const drainMicrotasks = async (): Promise<void> => {
  // The handler returns synchronously but spawns a detached promise chain (questFind → questLoad →
  // stampOverride → withModifyLock → persist → rename → outbox). setImmediate + multiple ticks
  // yields the event loop repeatedly to let the full chain settle before assertions run.
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

describe('createDriverHandlerLayerBroker', () => {
  describe('early return when abort signal already aborted', () => {
    it('VALID: {abortSignal aborted before event} => does not load the quest', async () => {
      const proxy = createDriverHandlerLayerBrokerProxy();
      proxy.setupQuestFound({ quest: questWithPendingCodeweaver });
      const controller = new AbortController();
      controller.abort();

      const handler = createDriverHandlerLayerBroker({
        questId: QUEST_ID,
        abortSignal: controller.signal,
        dispense: dispenseSignalComplete,
      });

      handler({ processId: EMITTED_PROCESS_ID, payload: { questId: QUEST_ID } });
      await drainMicrotasks();

      expect(proxy.getAllPersistedContents()).toStrictEqual([]);
    });
  });

  describe('ignores events for other quests', () => {
    it('VALID: {payload questId mismatches} => does not load the quest', async () => {
      const proxy = createDriverHandlerLayerBrokerProxy();
      proxy.setupQuestFound({ quest: questWithPendingCodeweaver });
      const controller = new AbortController();

      const handler = createDriverHandlerLayerBroker({
        questId: QUEST_ID,
        abortSignal: controller.signal,
        dispense: dispenseSignalComplete,
      });

      handler({ processId: EMITTED_PROCESS_ID, payload: { questId: OTHER_QUEST_ID } });
      await drainMicrotasks();

      expect(proxy.getAllPersistedContents()).toStrictEqual([]);
    });
  });

  describe('stamps pending work items with no override', () => {
    it('VALID: {pending codeweaver, dispense returns signalComplete} => stamp persisted with signalComplete prompt', async () => {
      const proxy = createDriverHandlerLayerBrokerProxy();
      proxy.setupQuestFound({ quest: questWithPendingCodeweaver });
      const controller = new AbortController();

      const handler = createDriverHandlerLayerBroker({
        questId: QUEST_ID,
        abortSignal: controller.signal,
        dispense: dispenseSignalComplete,
      });

      handler({ processId: EMITTED_PROCESS_ID, payload: { questId: QUEST_ID } });
      await drainMicrotasks();

      const persistedStrings = proxy.getAllPersistedContents().map((content) => String(content));
      const hits = persistedStrings.filter((raw) => raw.includes(SIGNAL_COMPLETE_SIGNATURE));

      expect(hits.length).toBeGreaterThan(0);
    });
  });

  describe('skips already-stamped work items', () => {
    it('VALID: {pending codeweaver with override} => does not persist a new stamp', async () => {
      const proxy = createDriverHandlerLayerBrokerProxy();
      proxy.setupQuestFound({ quest: questWithStampedCodeweaver });
      const controller = new AbortController();

      const handler = createDriverHandlerLayerBroker({
        questId: QUEST_ID,
        abortSignal: controller.signal,
        dispense: dispenseSignalComplete,
      });

      handler({ processId: EMITTED_PROCESS_ID, payload: { questId: QUEST_ID } });
      await drainMicrotasks();

      expect(proxy.getAllPersistedContents()).toStrictEqual([]);
    });
  });

  describe('dispense returns null skips stamping', () => {
    it('VALID: {dispense always null} => no persist calls', async () => {
      const proxy = createDriverHandlerLayerBrokerProxy();
      proxy.setupQuestFound({ quest: questWithPendingCodeweaver });
      const controller = new AbortController();

      const handler = createDriverHandlerLayerBroker({
        questId: QUEST_ID,
        abortSignal: controller.signal,
        dispense: dispenseAlwaysNull,
      });

      handler({ processId: EMITTED_PROCESS_ID, payload: { questId: QUEST_ID } });
      await drainMicrotasks();

      expect(proxy.getAllPersistedContents()).toStrictEqual([]);
    });
  });
});
