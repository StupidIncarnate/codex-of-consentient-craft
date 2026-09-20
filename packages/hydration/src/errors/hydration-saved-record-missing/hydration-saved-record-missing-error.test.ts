import { HydrationSavedRecordMissingError } from './hydration-saved-record-missing-error';

describe('HydrationSavedRecordMissingError', () => {
  describe('constructor()', () => {
    it('VALID: {savedRecordName: "origin", availableSavedRecordNames: [guild, quest]} => names the missing save and the ones that exist', () => {
      const error = new HydrationSavedRecordMissingError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'session',
        savedRecordName: 'origin',
        availableSavedRecordNames: ['guild', 'quest'],
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'HydrationSavedRecordMissingError',
        message:
          'recipe "guild-mid-execution": ingredient "session" calls fromSaved("origin"), but no op in this plan saves that name. Names saved by this plan: guild, quest',
      });
    });

    it('EMPTY: {availableSavedRecordNames: []} => names the plan as saving nothing at all', () => {
      const error = new HydrationSavedRecordMissingError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'session',
        savedRecordName: 'origin',
        availableSavedRecordNames: [],
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'HydrationSavedRecordMissingError',
        message:
          'recipe "guild-mid-execution": ingredient "session" calls fromSaved("origin"), but no op in this plan saves that name. Names saved by this plan: (none)',
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof HydrationSavedRecordMissingError => returns true', () => {
      const error = new HydrationSavedRecordMissingError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'session',
        savedRecordName: 'origin',
        availableSavedRecordNames: [],
      });

      expect(error instanceof HydrationSavedRecordMissingError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new HydrationSavedRecordMissingError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'session',
        savedRecordName: 'origin',
        availableSavedRecordNames: [],
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
