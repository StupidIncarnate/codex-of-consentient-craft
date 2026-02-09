import { listQuestsInputContract } from './list-quests-input-contract';
import { ListQuestsInputStub } from './list-quests-input.stub';

describe('listQuestsInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {startPath: string} => parses successfully', () => {
      const input = ListQuestsInputStub({ startPath: '/my/project' });

      const result = listQuestsInputContract.parse(input);

      expect(result).toStrictEqual({
        startPath: '/my/project',
      });
    });

    it('VALID: {startPath: omitted} => parses successfully with undefined', () => {
      const result = listQuestsInputContract.parse({});

      expect(result).toStrictEqual({});
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_START_PATH: {startPath: empty string} => throws validation error', () => {
      expect(() => {
        listQuestsInputContract.parse({ startPath: '' });
      }).toThrow(/String must contain at least 1 character/u);
    });
  });
});
