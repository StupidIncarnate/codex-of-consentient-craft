import { citationStatics } from './citation-statics';

describe('citationStatics', () => {
  describe('questPlans', () => {
    it('VALID: {questPlans} => the plan directory, the prelude extension, the VERIFIED marker and the scan depth', () => {
      expect(citationStatics.questPlans).toStrictEqual({
        dirName: '.quest-plans',
        preludeExtension: '.md',
        verifiedMarker: 'VERIFIED',
        scanDepth: 1,
      });
    });
  });

  describe('openIssue', () => {
    it('VALID: {openIssue} => the unchecked kind and the sentence every answer carries for it', () => {
      expect(citationStatics.openIssue).toStrictEqual({
        kind: 'open-issue',
        uncheckedWhy:
          'not checked: no issue record exists to check. Nothing in this repo stores an issue carrying ' +
          "a typed instanceId/runId — a workItem's own observation carries neither field and " +
          'questNoteKindContract has no issue member — so a walker records a defect as a failing test ' +
          'or as prose in a note, neither of which a resolver can match an instance against.',
      });
    });
  });

  describe('walked', () => {
    it('VALID: {walked} => the questNotes kind a walked path is recorded under', () => {
      expect(citationStatics.walked).toStrictEqual({ noteKind: 'walked' });
    });
  });
});
