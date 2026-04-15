import { orchestratorGetPlanningNotesAdapter } from './orchestrator-get-planning-notes-adapter';
import { orchestratorGetPlanningNotesAdapterProxy } from './orchestrator-get-planning-notes-adapter.proxy';

describe('orchestratorGetPlanningNotesAdapter', () => {
  describe('default (no section)', () => {
    it('VALID: {questId} => returns wrapped planning-notes shape', async () => {
      const proxy = orchestratorGetPlanningNotesAdapterProxy();
      proxy.returns({
        result: {
          success: true,
          data: { surfaceReports: [] },
        },
      });

      const result = await orchestratorGetPlanningNotesAdapter({ questId: 'add-auth' });

      expect(result).toStrictEqual({
        success: true,
        data: { surfaceReports: [] },
      });
    });

    it('VALID: {questId, section} => forwards section to orchestrator', async () => {
      const proxy = orchestratorGetPlanningNotesAdapterProxy();
      proxy.returns({ result: { success: true, data: [] } });

      const result = await orchestratorGetPlanningNotesAdapter({
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
      const proxy = orchestratorGetPlanningNotesAdapterProxy();

      await orchestratorGetPlanningNotesAdapter({ questId: 'add-auth' });

      expect(proxy.getLastCalledInput()).toStrictEqual({ questId: 'add-auth' });
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => rejects with error', async () => {
      const proxy = orchestratorGetPlanningNotesAdapterProxy();

      proxy.throws({ error: new Error('Quest not found') });

      await expect(
        orchestratorGetPlanningNotesAdapter({ questId: 'non-existent' }),
      ).rejects.toThrow(/Quest not found/u);
    });
  });
});
