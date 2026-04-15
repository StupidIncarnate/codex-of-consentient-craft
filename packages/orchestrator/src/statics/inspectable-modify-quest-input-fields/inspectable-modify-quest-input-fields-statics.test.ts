import { inspectableModifyQuestInputFieldsStatics } from './inspectable-modify-quest-input-fields-statics';

describe('inspectableModifyQuestInputFieldsStatics', () => {
  it('VALID: exported value => matches expected list of inspectable input fields (questId intentionally omitted)', () => {
    expect(inspectableModifyQuestInputFieldsStatics).toStrictEqual([
      'designDecisions',
      'steps',
      'toolingRequirements',
      'contracts',
      'flows',
      'status',
      'title',
      'planningNotes',
    ]);
  });
});
