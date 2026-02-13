import { listQuestsInputContract } from './list-quests-input-contract';
import { ListQuestsInputStub } from './list-quests-input.stub';

describe('listQuestsInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {projectId: uuid} => parses successfully', () => {
      const input = ListQuestsInputStub({
        projectId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      });

      const result = listQuestsInputContract.parse(input);

      expect(result).toStrictEqual({
        projectId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      });
    });

    it('VALID: default stub values => parses successfully', () => {
      const result = ListQuestsInputStub();

      expect(result).toStrictEqual({
        projectId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_PROJECT_ID: {projectId: "not-a-uuid"} => throws validation error', () => {
      expect(() => {
        listQuestsInputContract.parse({ projectId: 'not-a-uuid' });
      }).toThrow(/Invalid uuid/u);
    });

    it('INVALID_PROJECT_ID: {projectId: missing} => throws validation error', () => {
      expect(() => {
        listQuestsInputContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
