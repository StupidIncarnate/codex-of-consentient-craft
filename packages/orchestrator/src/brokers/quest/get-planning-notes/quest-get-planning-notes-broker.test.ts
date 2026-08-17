import {
  QuestBlightLedgerEntryStub,
  QuestIdStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { questGetPlanningNotesBroker } from './quest-get-planning-notes-broker';
import { questGetPlanningNotesBrokerProxy } from './quest-get-planning-notes-broker.proxy';

describe('questGetPlanningNotesBroker', () => {
  describe('planningNotes', () => {
    it('VALID: {questId, fresh quest} => returns default empty planningNotes', async () => {
      const proxy = questGetPlanningNotesBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });
      proxy.setupQuestFound({ quest });

      const result = await questGetPlanningNotesBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
      });

      expect(result).toStrictEqual({
        blightLedger: [],
        questNotes: [],
        operationPlans: [],
      });
    });

    it('VALID: {questId, populated planningNotes} => returns every field, unfiltered', async () => {
      const proxy = questGetPlanningNotesBrokerProxy();
      const entry = QuestBlightLedgerEntryStub({
        itemId: 'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:craft',
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        planningNotes: { blightLedger: [entry] },
      });
      proxy.setupQuestFound({ quest });

      const result = await questGetPlanningNotesBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
      });

      expect(result).toStrictEqual({
        blightLedger: [entry],
        questNotes: [],
        operationPlans: [],
      });
    });
  });

  describe('quest not found', () => {
    it('ERROR: {questId not exists} => throws not found error', async () => {
      const proxy = questGetPlanningNotesBrokerProxy();
      proxy.setupQuestNotFound();

      await expect(
        questGetPlanningNotesBroker({ questId: QuestIdStub({ value: 'nonexistent' }) }),
      ).rejects.toThrow(/Quest with id "nonexistent" not found/u);
    });
  });
});
