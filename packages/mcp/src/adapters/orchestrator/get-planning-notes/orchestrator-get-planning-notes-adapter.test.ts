import { orchestratorGetPlanningNotesAdapter } from './orchestrator-get-planning-notes-adapter';
import { orchestratorGetPlanningNotesAdapterProxy } from './orchestrator-get-planning-notes-adapter.proxy';

describe('orchestratorGetPlanningNotesAdapter', () => {
  describe('scaffold stub', () => {
    it('VALID: {questId} => returns empty planning-notes shape', async () => {
      const proxy = orchestratorGetPlanningNotesAdapterProxy();
      proxy.returns({
        result: {
          scopeClassification: undefined,
          surfaceReports: [],
          synthesis: undefined,
          walkFindings: undefined,
          reviewReport: undefined,
        },
      });

      const result = await orchestratorGetPlanningNotesAdapter({ questId: 'add-auth' });

      expect(result).toStrictEqual({
        scopeClassification: undefined,
        surfaceReports: [],
        synthesis: undefined,
        walkFindings: undefined,
        reviewReport: undefined,
      });
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
