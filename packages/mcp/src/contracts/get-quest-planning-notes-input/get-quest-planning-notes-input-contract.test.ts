import { getQuestPlanningNotesInputContract } from './get-quest-planning-notes-input-contract';
import { GetQuestPlanningNotesInputStub } from './get-quest-planning-notes-input.stub';

describe('getQuestPlanningNotesInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {questId: "add-auth"} => parses successfully', () => {
      const input = GetQuestPlanningNotesInputStub({ questId: 'add-auth' });

      const result = getQuestPlanningNotesInputContract.parse(input);

      expect(result).toStrictEqual({ questId: 'add-auth' });
    });

    it('VALID: {questId: "add-auth"} => parses with default stub value', () => {
      const input = GetQuestPlanningNotesInputStub();

      const result = getQuestPlanningNotesInputContract.parse(input);

      expect(result).toStrictEqual({ questId: 'add-auth' });
    });

    it('VALID: {questId, section: "scope"} => parses successfully', () => {
      const input = GetQuestPlanningNotesInputStub({ questId: 'add-auth', section: 'scope' });

      const result = getQuestPlanningNotesInputContract.parse(input);

      expect(result).toStrictEqual({ questId: 'add-auth', section: 'scope' });
    });

    it('VALID: {questId, section: "surface"} => parses successfully', () => {
      const input = GetQuestPlanningNotesInputStub({ questId: 'add-auth', section: 'surface' });

      const result = getQuestPlanningNotesInputContract.parse(input);

      expect(result).toStrictEqual({ questId: 'add-auth', section: 'surface' });
    });

    it('VALID: {questId, section: "synthesis"} => parses successfully', () => {
      const input = GetQuestPlanningNotesInputStub({ questId: 'add-auth', section: 'synthesis' });

      const result = getQuestPlanningNotesInputContract.parse(input);

      expect(result).toStrictEqual({ questId: 'add-auth', section: 'synthesis' });
    });

    it('VALID: {questId, section: "walk"} => parses successfully', () => {
      const input = GetQuestPlanningNotesInputStub({ questId: 'add-auth', section: 'walk' });

      const result = getQuestPlanningNotesInputContract.parse(input);

      expect(result).toStrictEqual({ questId: 'add-auth', section: 'walk' });
    });

    it('VALID: {questId, section: "blight"} => parses successfully', () => {
      const input = GetQuestPlanningNotesInputStub({ questId: 'add-auth', section: 'blight' });

      const result = getQuestPlanningNotesInputContract.parse(input);

      expect(result).toStrictEqual({ questId: 'add-auth', section: 'blight' });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {questId: ""} => throws validation error', () => {
      expect(() => {
        return getQuestPlanningNotesInputContract.parse({ questId: '' });
      }).toThrow(/too_small/u);
    });

    it('INVALID: {missing questId} => throws validation error', () => {
      expect(() => {
        return getQuestPlanningNotesInputContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID: {section: "unknown"} => throws validation error', () => {
      expect(() => {
        return getQuestPlanningNotesInputContract.parse({
          questId: 'add-auth',
          section: 'unknown',
        });
      }).toThrow(/invalid_enum_value/u);
    });

    it('INVALID: {unknown key} => throws Unrecognized key error', () => {
      expect(() => {
        return getQuestPlanningNotesInputContract.parse({
          questId: 'add-auth',
          stage: 'planning',
        } as never);
      }).toThrow(/Unrecognized key/u);
    });
  });
});
