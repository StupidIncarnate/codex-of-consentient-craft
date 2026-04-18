import { workItemStatusMetadataContract } from './work-item-status-metadata-contract';
import { WorkItemStatusMetadataStub } from './work-item-status-metadata.stub';

describe('workItemStatusMetadataContract', () => {
  describe('valid metadata', () => {
    it('VALID: {fully populated metadata} => parses successfully', () => {
      const result = workItemStatusMetadataContract.parse({
        isTerminal: true,
        satisfiesDependency: true,
        isActive: false,
        isPending: false,
        isComplete: true,
        isSkipped: false,
        isFailure: false,
      });

      expect(result).toStrictEqual({
        isTerminal: true,
        satisfiesDependency: true,
        isActive: false,
        isPending: false,
        isComplete: true,
        isSkipped: false,
        isFailure: false,
      });
    });
  });

  describe('invalid metadata', () => {
    it('ERROR: {missing isTerminal field} => throws validation error', () => {
      expect(() =>
        workItemStatusMetadataContract.parse({
          satisfiesDependency: false,
          isActive: false,
          isPending: false,
          isComplete: false,
          isSkipped: false,
          isFailure: false,
        }),
      ).toThrow('Required');
    });

    it('ERROR: {non-boolean flag} => throws validation error', () => {
      expect(() =>
        workItemStatusMetadataContract.parse({
          isTerminal: 'yes',
          satisfiesDependency: false,
          isActive: false,
          isPending: false,
          isComplete: false,
          isSkipped: false,
          isFailure: false,
        }),
      ).toThrow('Expected boolean, received string');
    });
  });

  describe('stub', () => {
    it('VALID: WorkItemStatusMetadataStub() => returns default all-false metadata', () => {
      const result = WorkItemStatusMetadataStub();

      expect(result).toStrictEqual({
        isTerminal: false,
        satisfiesDependency: false,
        isActive: false,
        isPending: false,
        isComplete: false,
        isSkipped: false,
        isFailure: false,
      });
    });

    it('VALID: WorkItemStatusMetadataStub({isPending: true}) => overrides given field', () => {
      const result = WorkItemStatusMetadataStub({ isPending: true });

      expect(result.isPending).toBe(true);
    });
  });
});
