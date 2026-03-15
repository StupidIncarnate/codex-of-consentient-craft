import { workItemIdContract } from './work-item-id-contract';
import { WorkItemIdStub } from './work-item-id.stub';

describe('workItemIdContract', () => {
  describe('valid work item ids', () => {
    it('VALID: {value: "work-item-0"} => parses successfully', () => {
      const result = WorkItemIdStub({ value: 'work-item-0' });

      expect(workItemIdContract.parse(result)).toBe('work-item-0');
    });

    it('VALID: {value: "step-abc-123"} => parses successfully', () => {
      const result = WorkItemIdStub({ value: 'step-abc-123' });

      expect(workItemIdContract.parse(result)).toBe('step-abc-123');
    });
  });

  describe('invalid work item ids', () => {
    it('INVALID_VALUE: {value: ""} => throws validation error', () => {
      expect(() => workItemIdContract.parse('')).toThrow(/too_small/u);
    });

    it('INVALID_VALUE: {value: 123} => throws validation error', () => {
      expect(() => workItemIdContract.parse(123 as never)).toThrow(/Expected string/u);
    });
  });
});
