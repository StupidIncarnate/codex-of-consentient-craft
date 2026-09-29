import { startQuestInputContract } from './start-quest-input-contract';
import { StartQuestInputStub } from './start-quest-input.stub';

describe('startQuestInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {questId: string} => parses successfully', () => {
      const input = StartQuestInputStub({ questId: 'add-auth' });

      const result = startQuestInputContract.parse(input);

      expect(result).toStrictEqual({
        questId: 'add-auth',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {questId: empty string} => throws validation error', () => {
      expect(() => {
        startQuestInputContract.parse({ questId: '' });
      }).toThrow(/expected string to have >=1 characters/u);
    });

    it('INVALID: {questId: missing} => throws validation error', () => {
      expect(() => {
        startQuestInputContract.parse({});
      }).toThrow(/received undefined/u);
    });

    it('INVALID: {unknown key} => throws Unrecognized key error', () => {
      expect(() => {
        startQuestInputContract.parse({ questId: 'add-auth', guild: 'test' });
      }).toThrow(/Unrecognized key/u);
    });
  });
});
