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
  });
});
