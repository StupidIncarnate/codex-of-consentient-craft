import { PlanningBlightReportStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { QuestGetPlanningNotesResponderProxy } from './quest-get-planning-notes-responder.proxy';

describe('QuestGetPlanningNotesResponder', () => {
  describe('full planningNotes (no section)', () => {
    it('VALID: {questId, fresh quest} => returns success with default empty shape', async () => {
      const proxy = QuestGetPlanningNotesResponderProxy();
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId: 'add-auth' });

      expect(result).toStrictEqual({
        success: true,
        data: { blightReports: [] },
      });
    });

    it('VALID: {questId, populated planningNotes} => returns success with full object', async () => {
      const proxy = QuestGetPlanningNotesResponderProxy();
      const blight = PlanningBlightReportStub();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        planningNotes: { blightReports: [blight] },
      });
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId: 'add-auth' });

      expect(result).toStrictEqual({
        success: true,
        data: { blightReports: [blight] },
      });
    });
  });

  describe('section filters', () => {
    it('VALID: {section: "blight"} => returns success with blightReports array', async () => {
      const proxy = QuestGetPlanningNotesResponderProxy();
      const blight = PlanningBlightReportStub();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        planningNotes: { blightReports: [blight] },
      });
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId: 'add-auth', section: 'blight' });

      expect(result).toStrictEqual({ success: true, data: [blight] });
    });

    it('VALID: {section: "blight", fresh quest} => returns success with empty array', async () => {
      const proxy = QuestGetPlanningNotesResponderProxy();
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId: 'add-auth', section: 'blight' });

      expect(result).toStrictEqual({ success: true, data: [] });
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
