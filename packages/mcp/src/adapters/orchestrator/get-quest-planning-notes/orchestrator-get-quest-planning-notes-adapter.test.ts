import { orchestratorGetQuestPlanningNotesAdapter } from './orchestrator-get-quest-planning-notes-adapter';
import { orchestratorGetQuestPlanningNotesAdapterProxy } from './orchestrator-get-quest-planning-notes-adapter.proxy';

describe('orchestratorGetQuestPlanningNotesAdapter', () => {
  describe('planning notes', () => {
    it('VALID: {questId} => returns wrapped planning-notes shape', async () => {
      const proxy = orchestratorGetQuestPlanningNotesAdapterProxy();
      proxy.returns({
        questId: 'add-auth',
        result: {
          success: true,
          data: {
            blightLedger: [],
            questNotes: [],
            operationPlans: [],
          },
        },
      });

      const result = await orchestratorGetQuestPlanningNotesAdapter({ questId: 'add-auth' });

      expect(result).toStrictEqual({
        success: true,
        data: {
          blightLedger: [],
          questNotes: [],
          operationPlans: [],
        },
      });
    });

    it('VALID: {questId} => calls the orchestrator with the questId alone', async () => {
      const proxy = orchestratorGetQuestPlanningNotesAdapterProxy();
      proxy.returns({
        questId: 'add-auth',
        result: {
          success: true,
          data: {
            blightLedger: [],
            questNotes: [],
            operationPlans: [],
          },
        },
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
