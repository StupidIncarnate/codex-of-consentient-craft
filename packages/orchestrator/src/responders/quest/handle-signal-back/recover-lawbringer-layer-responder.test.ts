import {
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { spiritmenderContextStatics } from '../../../statics/spiritmender-context/spiritmender-context-statics';
import { RecoverLawbringerLayerResponder } from './recover-lawbringer-layer-responder';
import { RecoverLawbringerLayerResponderProxy } from './recover-lawbringer-layer-responder.proxy';

const LAWBRINGER_ID = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
const BLIGHTWARDEN_ID = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-8e1f-2a3b4c5d6e7f' });

describe('RecoverLawbringerLayerResponder', () => {
  describe('sidecar write', () => {
    it('VALID: {lawbringer failed with summary} => writes batch sidecar with empty filePaths/errors, ward verification command, summary + lawbringer instructions', async () => {
      const proxy = RecoverLawbringerLayerResponderProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const lawbringerItem = WorkItemStub({
        id: LAWBRINGER_ID,
        role: 'lawbringer',
        status: 'failed',
        summary: 'unfixable nesting in user-broker',
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [lawbringerItem],
      });
      proxy.setupQuestFound({ quest });

      await RecoverLawbringerLayerResponder({ questId, failedItem: lawbringerItem });

      const written = proxy.getWrittenSidecar();
      const parsedContent: unknown = JSON.parse(String(written?.content));

      expect(parsedContent).toStrictEqual({
        filePaths: [],
        errors: [],
        verificationCommand: 'npm run ward',
        contextInstructions: `unfixable nesting in user-broker\n\n${spiritmenderContextStatics.lawbringerFailure.instructions}`,
      });
    });

    it('EMPTY: {lawbringer failed without summary or errorMessage} => sidecar contextInstructions is just the lawbringer instructions (empty summary preamble)', async () => {
      const proxy = RecoverLawbringerLayerResponderProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const lawbringerItem = WorkItemStub({
        id: LAWBRINGER_ID,
        role: 'lawbringer',
        status: 'failed',
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [lawbringerItem],
      });
      proxy.setupQuestFound({ quest });

      await RecoverLawbringerLayerResponder({ questId, failedItem: lawbringerItem });

      const written = proxy.getWrittenSidecar();
      const parsedContent: unknown = JSON.parse(String(written?.content));

      expect(parsedContent).toStrictEqual({
        filePaths: [],
        errors: [],
        verificationCommand: 'npm run ward',
        contextInstructions: `\n\n${spiritmenderContextStatics.lawbringerFailure.instructions}`,
      });
    });
  });

  describe('splice + downstream rewire', () => {
    it('VALID: {lawbringer failed, blightwarden depends on it} => splices spiritmender + lawbringer-retry, rewires blightwarden onto the retry', async () => {
      const proxy = RecoverLawbringerLayerResponderProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const lawbringerItem = WorkItemStub({
        id: LAWBRINGER_ID,
        role: 'lawbringer',
        status: 'failed',
        attempt: 0,
        maxAttempts: 3,
        summary: 'unfixable nesting in user-broker',
      });
      const blightwardenItem = WorkItemStub({
        id: BLIGHTWARDEN_ID,
        role: 'blightwarden',
        status: 'pending',
        dependsOn: [LAWBRINGER_ID],
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [lawbringerItem, blightwardenItem],
      });
      proxy.setupQuestFound({ quest });

      await RecoverLawbringerLayerResponder({ questId, failedItem: lawbringerItem });

      const persisted = proxy.getLastPersistedQuest();
      const { workItems } = persisted;

      const spiritmender = workItems.find((wi) => wi.role === 'spiritmender');
      // The retry is the spliced lawbringer item — the one stamped insertedBy the failed lawbringer.
      const lawbringerItems = workItems.filter((wi) => wi.role === 'lawbringer');
      const retry = lawbringerItems.find((wi) => wi.insertedBy === LAWBRINGER_ID);
      const blightwarden = workItems.find((wi) => wi.id === BLIGHTWARDEN_ID);

      // Spiritmender: depends on the failed lawbringer, stamped insertedBy that lawbringer.
      expect({
        dependsOn: spiritmender?.dependsOn,
        insertedBy: spiritmender?.insertedBy,
      }).toStrictEqual({
        dependsOn: [LAWBRINGER_ID],
        insertedBy: LAWBRINGER_ID,
      });

      // Lawbringer-retry: attempt+1, depends on the spiritmender, insertedBy the failed lawbringer.
      expect({
        attempt: retry?.attempt,
        insertedBy: retry?.insertedBy,
        dependsOn: retry?.dependsOn,
      }).toStrictEqual({ attempt: 1, insertedBy: LAWBRINGER_ID, dependsOn: [spiritmender?.id] });

      // Downstream blightwarden rewired off the failed lawbringer onto the retry id.
      expect(blightwarden?.dependsOn).toStrictEqual([retry?.id]);
    });
  });
});
