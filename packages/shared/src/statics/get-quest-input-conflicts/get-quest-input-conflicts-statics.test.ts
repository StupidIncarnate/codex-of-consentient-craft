import { getQuestInputConflictsStatics } from './get-quest-input-conflicts-statics';

describe('getQuestInputConflictsStatics', () => {
  describe('exported value', () => {
    it('VALID: {statics} => carries one message per conflicting argument pair', () => {
      expect(getQuestInputConflictsStatics).toStrictEqual({
        flowIdWithStage:
          'flowId cannot be combined with stage — stage selects which SECTIONS of the quest come back, flowId selects WITHIN the flows section, and a stage that excludes flows returns an empty answer that reads as the flow being empty. Pass flowId alone, optionally with packageName.',
        packageNameWithStage:
          'packageName cannot be combined with stage — stage selects which SECTIONS of the quest come back, packageName narrows the flow slice to one package, and a stage that excludes flows or contracts returns an empty answer that reads as the package owning nothing. Pass packageName alone, or with flowId.',
      });
    });
  });

  // A zod issue message is delivered JSON-escaped inside the ZodError's text, so a double quote in
  // the source string reaches the reader as `\"` and no longer matches what it was written as.
  it('VALID: {every message} => survives JSON escaping unchanged', () => {
    expect(
      Object.values(getQuestInputConflictsStatics).map(
        (message) => JSON.stringify(message) === `"${message}"`,
      ),
    ).toStrictEqual([true, true]);
  });
});
