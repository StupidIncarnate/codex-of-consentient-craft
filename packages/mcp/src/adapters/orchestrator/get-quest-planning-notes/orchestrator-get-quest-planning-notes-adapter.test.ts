import { orchestratorGetQuestPlanningNotesAdapter } from './orchestrator-get-quest-planning-notes-adapter';
import { orchestratorGetQuestPlanningNotesAdapterProxy } from './orchestrator-get-quest-planning-notes-adapter.proxy';

describe('orchestratorGetQuestPlanningNotesAdapter', () => {
  describe('default (no section)', () => {
    it('VALID: {questId} => returns wrapped planning-notes shape', async () => {
      const proxy = orchestratorGetQuestPlanningNotesAdapterProxy();
      proxy.returns({
        questId: 'add-auth',
        result: {
          success: true,
          data: { blightReports: [] },
        },
      });

      const result = await orchestratorGetQuestPlanningNotesAdapter({ questId: 'add-auth' });

      expect(result).toStrictEqual({
        success: true,
        data: { blightReports: [] },
      });
    });

    it('VALID: {questId, section} => forwards section to orchestrator', async () => {
      const proxy = orchestratorGetQuestPlanningNotesAdapterProxy();
      proxy.returns({ questId: 'add-auth', result: { success: true, data: [] } });

      const result = await orchestratorGetQuestPlanningNotesAdapter({
        questId: 'add-auth',
        section: 'blight',
      });

      expect(result).toStrictEqual({ success: true, data: [] });
      expect(proxy.getLastCalledInputFor({ questId: 'add-auth' })).toStrictEqual({
        questId: 'add-auth',
        section: 'blight',
      });
    });

    it('VALID: {questId, no section} => omits section in call', async () => {
      const proxy = orchestratorGetQuestPlanningNotesAdapterProxy();
      proxy.returns({
        questId: 'add-auth',
        result: { success: true, data: { blightReports: [] } },
      });

      await orchestratorGetQuestPlanningNotesAdapter({ questId: 'add-auth' });

      expect(proxy.getLastCalledInputFor({ questId: 'add-auth' })).toStrictEqual({
        questId: 'add-auth',
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => rejects with error', async () => {
      const proxy = orchestratorGetQuestPlanningNotesAdapterProxy();

      proxy.throws({ questId: 'non-existent', error: new Error('Quest not found') });

      await expect(
        orchestratorGetQuestPlanningNotesAdapter({ questId: 'non-existent' }),
      ).rejects.toThrow(/Quest not found/u);
    });
  });
});
