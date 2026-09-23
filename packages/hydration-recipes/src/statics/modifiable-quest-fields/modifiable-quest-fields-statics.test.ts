import { modifiableQuestFieldsStatics } from './modifiable-quest-fields-statics';

describe('modifiableQuestFieldsStatics', () => {
  describe('names', () => {
    it('VALID: {} => is the complete, exact list of modify-quest-writable QuestFields keys', () => {
      expect(modifiableQuestFieldsStatics.names).toStrictEqual([
        'designDecisions',
        'toolingRequirements',
        'contracts',
        'packagesAffected',
        'flows',
        'comments',
        'status',
        'pausedAtStatus',
        'title',
        'workItems',
        'wardResults',
        'planningNotes',
      ]);
    });
  });
});
