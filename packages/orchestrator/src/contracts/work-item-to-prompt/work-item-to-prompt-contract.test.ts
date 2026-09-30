import { WorkItemToPromptStub } from './work-item-to-prompt.stub';
import { workItemToPromptContract } from './work-item-to-prompt-contract';

describe('workItemToPromptContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = WorkItemToPromptStub();

      expect(workItemToPromptContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {prompt: wrong type} => throws', () => {
      expect(() =>
        workItemToPromptContract.parse({ ...WorkItemToPromptStub(), prompt: 123 }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
