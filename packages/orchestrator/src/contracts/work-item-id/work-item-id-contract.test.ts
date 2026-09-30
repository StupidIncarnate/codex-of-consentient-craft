import { workItemIdContract } from './work-item-id-contract';
import { WorkItemIdStub } from './work-item-id.stub';

describe('workItemIdContract', () => {
  describe('valid work item ids', () => {
    it('VALID: {value: "f47ac10b-58cc-4372-a567-0e02b2c3d479"} => parses successfully', () => {
      const result = WorkItemIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      expect(workItemIdContract.parse(result)).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });

    it('VALID: {value: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"} => parses successfully', () => {
      const result = WorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });

      expect(workItemIdContract.parse(result)).toBe('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d');
    });
  });

  describe('invalid work item ids', () => {
    it('INVALID: {value: ""} => throws validation error', () => {
      expect(() => workItemIdContract.parse('')).toThrow(/too_small/u);
    });

    it('INVALID: {value: 123} => throws validation error', () => {
      expect(() => workItemIdContract.parse(123)).toThrow(/expected string/u);
    });
  });
});
