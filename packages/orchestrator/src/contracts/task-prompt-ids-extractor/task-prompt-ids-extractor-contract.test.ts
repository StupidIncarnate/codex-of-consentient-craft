import { TaskPromptIdsExtractorStub } from './task-prompt-ids-extractor.stub';
import { taskPromptIdsExtractorContract } from './task-prompt-ids-extractor-contract';

describe('taskPromptIdsExtractorContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = TaskPromptIdsExtractorStub();

      expect(taskPromptIdsExtractorContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {questId: wrong type} => throws', () => {
      expect(() =>
        taskPromptIdsExtractorContract.parse({ ...TaskPromptIdsExtractorStub(), questId: 123 }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
