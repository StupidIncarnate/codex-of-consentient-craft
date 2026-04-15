import { QuestGetPlanningNotesResponderProxy } from './quest-get-planning-notes-responder.proxy';

describe('QuestGetPlanningNotesResponder', () => {
  describe('scaffold stub', () => {
    it('VALID: {questId} => delegates to broker and returns empty planning-notes shape', async () => {
      const proxy = QuestGetPlanningNotesResponderProxy();

      const result = await proxy.callResponder({ questId: 'add-auth' });

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
