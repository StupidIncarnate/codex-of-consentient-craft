import {
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemRoleStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { PromptTextStub } from '../../../contracts/prompt-text/prompt-text.stub';
import { smoketestSweepPendingWorkItemsLayerBroker } from './smoketest-sweep-pending-work-items-layer-broker';
import { smoketestSweepPendingWorkItemsLayerBrokerProxy } from './smoketest-sweep-pending-work-items-layer-broker.proxy';

const QUEST_ID = QuestIdStub({ value: 'sweep-layer-quest' });
const WI_PENDING = QuestWorkItemIdStub({ value: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01' });
const WI_PENDING_TWO = QuestWorkItemIdStub({ value: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee02' });
const CODEWEAVER_ROLE = WorkItemRoleStub({ value: 'codeweaver' });
const SIEGEMASTER_ROLE = WorkItemRoleStub({ value: 'siegemaster' });
// Unique substring from smoketestPromptsStatics.signalComplete that survives JSON escaping.
const SIGNAL_COMPLETE_SIGNATURE = 'smoketest-complete';

const questWithTwoPendingRoles = QuestStub({
  id: QUEST_ID,
  workItems: [
    WorkItemStub({ id: WI_PENDING, role: 'codeweaver', status: 'pending' }),
    WorkItemStub({ id: WI_PENDING_TWO, role: 'siegemaster', status: 'pending' }),
  ],
});

const questWithStampedCodeweaver = QuestStub({
  id: QUEST_ID,
  workItems: [
    WorkItemStub({
      id: WI_PENDING,
      role: 'codeweaver',
      status: 'pending',
      smoketestPromptOverride: PromptTextStub({ value: 'already stamped' }),
    }),
  ],
});

const dispenseAlwaysNull = (): null => null;
const dispenseSignalCompleteForCodeweaver = ({
  role,
}: {
  role: ReturnType<typeof WorkItemRoleStub>;
}): 'signalComplete' | null => (role === CODEWEAVER_ROLE ? 'signalComplete' : null);
const dispenseSignalCompleteForBoth = ({
  role,
}: {
  role: ReturnType<typeof WorkItemRoleStub>;
}): 'signalComplete' | null =>
  role === CODEWEAVER_ROLE || role === SIEGEMASTER_ROLE ? 'signalComplete' : null;

describe('smoketestSweepPendingWorkItemsLayerBroker', () => {
  describe('aborted signal', () => {
    it('VALID: {abortSignal pre-aborted} => does not persist any stamp', async () => {
      const proxy = smoketestSweepPendingWorkItemsLayerBrokerProxy();
      proxy.setupQuestFound({ quest: questWithTwoPendingRoles });
      const controller = new AbortController();
      controller.abort();

      const result = await smoketestSweepPendingWorkItemsLayerBroker({
        questId: QUEST_ID,
        abortSignal: controller.signal,
        dispense: dispenseSignalCompleteForBoth,
      });

      expect({
        result,
        persistedContents: proxy.getAllPersistedContents(),
      }).toStrictEqual({
        result: { success: true },
        persistedContents: [],
      });
    });
  });

  describe('dispense returns null', () => {
    it('VALID: {dispense always null} => does not persist any stamp', async () => {
      const proxy = smoketestSweepPendingWorkItemsLayerBrokerProxy();
      proxy.setupQuestFound({ quest: questWithTwoPendingRoles });
      const controller = new AbortController();

      const result = await smoketestSweepPendingWorkItemsLayerBroker({
        questId: QUEST_ID,
        abortSignal: controller.signal,
        dispense: dispenseAlwaysNull,
      });

      expect({
        result,
        persistedContents: proxy.getAllPersistedContents(),
      }).toStrictEqual({
        result: { success: true },
        persistedContents: [],
      });
    });
  });

  describe('skips already-stamped items', () => {
    it('VALID: {pending codeweaver with existing override} => does not persist', async () => {
      const proxy = smoketestSweepPendingWorkItemsLayerBrokerProxy();
      proxy.setupQuestFound({ quest: questWithStampedCodeweaver });
      const controller = new AbortController();

      const result = await smoketestSweepPendingWorkItemsLayerBroker({
        questId: QUEST_ID,
        abortSignal: controller.signal,
        dispense: dispenseSignalCompleteForCodeweaver,
      });

      expect({
        result,
        persistedContents: proxy.getAllPersistedContents(),
      }).toStrictEqual({
        result: { success: true },
        persistedContents: [],
      });
    });
  });

  describe('stamps pending items with no override', () => {
    it('VALID: {pending codeweaver, dispense returns signalComplete} => persists quest.json with the dispensed prompt', async () => {
      const proxy = smoketestSweepPendingWorkItemsLayerBrokerProxy();
      proxy.setupQuestFound({ quest: questWithTwoPendingRoles });
      const controller = new AbortController();

      const result = await smoketestSweepPendingWorkItemsLayerBroker({
        questId: QUEST_ID,
        abortSignal: controller.signal,
        dispense: dispenseSignalCompleteForCodeweaver,
      });

      const persistedStrings = proxy.getAllPersistedContents().map((content) => String(content));
      const hits = persistedStrings.filter((raw) => raw.includes(SIGNAL_COMPLETE_SIGNATURE));

      expect({
        result,
        atLeastOneHit: hits.length > 0,
      }).toStrictEqual({
        result: { success: true },
        atLeastOneHit: true,
      });
    });
  });
});
