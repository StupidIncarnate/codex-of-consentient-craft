import { TaskPromptsFromContentStub } from './task-prompts-from-content.stub';
import { taskPromptsFromContentContract } from './task-prompts-from-content-contract';

describe('taskPromptsFromContentContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = TaskPromptsFromContentStub();

      expect(taskPromptsFromContentContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: wrong type} => throws', () => {
      expect(() => taskPromptsFromContentContract.parse(123)).toThrow(/expected|invalid/iu);
    });
  });
});
