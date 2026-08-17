import { QuestBlightLedgerEntryStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { QuestGetPlanningNotesResponderProxy } from './quest-get-planning-notes-responder.proxy';

describe('QuestGetPlanningNotesResponder', () => {
  describe('planningNotes', () => {
    it('VALID: {questId, fresh quest} => returns success with default empty shape', async () => {
      const proxy = QuestGetPlanningNotesResponderProxy();
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId: 'add-auth' });

      expect(result).toStrictEqual({
        success: true,
        data: {
          blightLedger: [],
          questNotes: [],
          operationPlans: [],
        },
      });
    });

    it('VALID: {questId, populated planningNotes} => returns success with every field', async () => {
      const proxy = QuestGetPlanningNotesResponderProxy();
      const entry = QuestBlightLedgerEntryStub({
        itemId: 'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:craft',
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        planningNotes: { blightLedger: [entry] },
      });
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId: 'add-auth' });

      expect(result).toStrictEqual({
        success: true,
        data: {
          blightLedger: [entry],
          questNotes: [],
          operationPlans: [],
        },
      });
    });
  });

  describe('error handling', () => {
    it('ERROR: {questId not found} => returns success: false with error message', async () => {
      const proxy = QuestGetPlanningNotesResponderProxy();
      proxy.setupQuestNotFound();

      const result = await proxy.callResponder({ questId: 'nonexistent' });

      expect(result).toStrictEqual({
        success: false,
        error: 'Quest with id "nonexistent" not found in any guild',
      });
    });

    it('ERROR: {invalid questId empty string} => returns success: false with validation error', async () => {
      const proxy = QuestGetPlanningNotesResponderProxy();
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId: '' });

      expect(result.success).toBe(false);
    });
  });
});
