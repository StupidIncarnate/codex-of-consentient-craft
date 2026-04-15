import { getPlanningNotesInputContract } from './get-planning-notes-input-contract';
import { GetPlanningNotesInputStub } from './get-planning-notes-input.stub';

describe('getPlanningNotesInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {questId: "add-auth"} => parses successfully', () => {
      const input = GetPlanningNotesInputStub({ questId: 'add-auth' });

      const result = getPlanningNotesInputContract.parse(input);

      expect(result).toStrictEqual({ questId: 'add-auth' });
    });

    it('VALID: {questId: "add-auth"} => parses with default stub value', () => {
      const input = GetPlanningNotesInputStub();

      const result = getPlanningNotesInputContract.parse(input);

      expect(result).toStrictEqual({ questId: 'add-auth' });
    });

    it('VALID: {questId, section: "scope"} => parses successfully', () => {
      const input = GetPlanningNotesInputStub({ questId: 'add-auth', section: 'scope' });

      const result = getPlanningNotesInputContract.parse(input);

      expect(result).toStrictEqual({ questId: 'add-auth', section: 'scope' });
    });

    it('VALID: {questId, section: "surface"} => parses successfully', () => {
      const input = GetPlanningNotesInputStub({ questId: 'add-auth', section: 'surface' });

      const result = getPlanningNotesInputContract.parse(input);

      expect(result).toStrictEqual({ questId: 'add-auth', section: 'surface' });
    });

    it('VALID: {questId, section: "synthesis"} => parses successfully', () => {
      const input = GetPlanningNotesInputStub({ questId: 'add-auth', section: 'synthesis' });

      const result = getPlanningNotesInputContract.parse(input);

      expect(result).toStrictEqual({ questId: 'add-auth', section: 'synthesis' });
    });

    it('VALID: {questId, section: "walk"} => parses successfully', () => {
      const input = GetPlanningNotesInputStub({ questId: 'add-auth', section: 'walk' });

      const result = getPlanningNotesInputContract.parse(input);

      expect(result).toStrictEqual({ questId: 'add-auth', section: 'walk' });
    });

    it('VALID: {questId, section: "review"} => parses successfully', () => {
      const input = GetPlanningNotesInputStub({ questId: 'add-auth', section: 'review' });

      const result = getPlanningNotesInputContract.parse(input);

      expect(result).toStrictEqual({ questId: 'add-auth', section: 'review' });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {questId: ""} => throws validation error', () => {
      expect(() => {
        return getPlanningNotesInputContract.parse({ questId: '' });
      }).toThrow(/too_small/u);
    });

    it('INVALID: {missing questId} => throws validation error', () => {
      expect(() => {
        return getPlanningNotesInputContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID: {section: "unknown"} => throws validation error', () => {
      expect(() => {
        return getPlanningNotesInputContract.parse({ questId: 'add-auth', section: 'unknown' });
      }).toThrow(/invalid_enum_value/u);
    });
  });
});
