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

  describe('walked', () => {
    it('VALID: {walked} => the questNotes kind a walked path is recorded under', () => {
      expect(citationStatics.walked).toStrictEqual({ noteKind: 'walked' });
    });
  });
});
