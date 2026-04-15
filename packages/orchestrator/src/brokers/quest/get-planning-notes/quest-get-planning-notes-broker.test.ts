import { questGetPlanningNotesBroker } from './quest-get-planning-notes-broker';
import { questGetPlanningNotesBrokerProxy } from './quest-get-planning-notes-broker.proxy';

describe('questGetPlanningNotesBroker', () => {
  describe('scaffold stub', () => {
    it('VALID: {questId} => returns empty planning-notes shape', async () => {
      questGetPlanningNotesBrokerProxy();

      const result = await questGetPlanningNotesBroker({ questId: 'add-auth' });

      expect(result).toStrictEqual({
        scopeClassification: undefined,
        surfaceReports: [],
        synthesis: undefined,
        walkFindings: undefined,
        reviewReport: undefined,
      });
    });
  });
});
