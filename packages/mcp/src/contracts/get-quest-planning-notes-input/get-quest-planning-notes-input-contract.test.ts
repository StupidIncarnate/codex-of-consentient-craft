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

    it('INVALID: {section} => throws Unrecognized key error, because the tool takes no section filter', () => {
      expect(() => {
        return getQuestPlanningNotesInputContract.parse({
          questId: 'add-auth',
          section: 'blight',
        } as never);
      }).toThrow(/Unrecognized key/u);
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
