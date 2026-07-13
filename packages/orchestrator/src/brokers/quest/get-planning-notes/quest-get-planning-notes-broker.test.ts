import { PlanningBlightReportStub, QuestIdStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { questGetPlanningNotesBroker } from './quest-get-planning-notes-broker';
import { questGetPlanningNotesBrokerProxy } from './quest-get-planning-notes-broker.proxy';

describe('questGetPlanningNotesBroker', () => {
  describe('full planningNotes (no section)', () => {
    it('VALID: {questId, fresh quest} => returns default empty planningNotes', async () => {
      const proxy = questGetPlanningNotesBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });
      proxy.setupQuestFound({ quest });

      const result = await questGetPlanningNotesBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
      });

      expect(result).toStrictEqual({ blightReports: [] });
    });

    it('VALID: {questId, fully populated planningNotes} => returns full object', async () => {
      const proxy = questGetPlanningNotesBrokerProxy();
      const blight = PlanningBlightReportStub();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        planningNotes: { blightReports: [blight] },
      });
      proxy.setupQuestFound({ quest });

      const result = await questGetPlanningNotesBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
      });

      expect(result).toStrictEqual({ blightReports: [blight] });
    });
  });

  describe('section: blight', () => {
    it('VALID: {section: "blight", reports present} => returns blightReports array', async () => {
      const proxy = questGetPlanningNotesBrokerProxy();
      const blight = PlanningBlightReportStub();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        planningNotes: { blightReports: [blight] },
      });
      proxy.setupQuestFound({ quest });

      const result = await questGetPlanningNotesBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        section: 'blight',
      });

      expect(result).toStrictEqual([blight]);
    });

    it('VALID: {section: "blight", fresh quest} => returns empty array', async () => {
      const proxy = questGetPlanningNotesBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });
      proxy.setupQuestFound({ quest });

      const result = await questGetPlanningNotesBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        section: 'blight',
      });

      expect(result).toStrictEqual([]);
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
