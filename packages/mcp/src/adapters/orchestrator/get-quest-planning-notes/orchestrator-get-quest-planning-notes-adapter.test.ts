import { orchestratorGetQuestPlanningNotesAdapter } from './orchestrator-get-quest-planning-notes-adapter';
import { orchestratorGetQuestPlanningNotesAdapterProxy } from './orchestrator-get-quest-planning-notes-adapter.proxy';

describe('orchestratorGetQuestPlanningNotesAdapter', () => {
  describe('default (no section)', () => {
    it('VALID: {questId} => returns wrapped planning-notes shape', async () => {
      const proxy = orchestratorGetQuestPlanningNotesAdapterProxy();
      proxy.returns({
        result: {
          success: true,
          data: { surfaceReports: [], blightReports: [] },
        },
      });

      const result = await orchestratorGetQuestPlanningNotesAdapter({ questId: 'add-auth' });

      expect(result).toStrictEqual({
        success: true,
        data: { surfaceReports: [], blightReports: [] },
      });
    });

    it('VALID: {questId, section} => forwards section to orchestrator', async () => {
      const proxy = orchestratorGetQuestPlanningNotesAdapterProxy();
      proxy.returns({ result: { success: true, data: [] } });

      const result = await orchestratorGetQuestPlanningNotesAdapter({
        questId: 'add-auth',
        section: 'surface',
      });

      expect(result).toStrictEqual({ success: true, data: [] });
      expect(proxy.getLastCalledInput()).toStrictEqual({
        questId: 'add-auth',
        section: 'surface',
      });
    });

    it('VALID: {questId, no section} => omits section in call', async () => {
      const proxy = orchestratorGetQuestPlanningNotesAdapterProxy();

      await orchestratorGetQuestPlanningNotesAdapter({ questId: 'add-auth' });

      expect(proxy.getLastCalledInput()).toStrictEqual({ questId: 'add-auth' });
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => rejects with error', async () => {
      const proxy = orchestratorGetQuestPlanningNotesAdapterProxy();

      proxy.throws({ error: new Error('Quest not found') });

      await expect(
        orchestratorGetQuestPlanningNotesAdapter({ questId: 'non-existent' }),
      ).rejects.toThrow(/Quest not found/u);
    });
  });
});
