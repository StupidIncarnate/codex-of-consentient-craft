import {
  FlowStub,
  RequirementStub,
  RequirementIdStub,
} from '@dungeonmaster/shared/contracts';

import { questHasFlowCoverageGuard } from './quest-has-flow-coverage-guard';

describe('questHasFlowCoverageGuard', () => {
  describe('valid coverage', () => {
    it('VALID: {all approved requirements covered by flows} => returns true', () => {
      const reqId1 = RequirementIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const reqId2 = RequirementIdStub({ value: 'a47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const requirements = [
        RequirementStub({ id: reqId1, status: 'approved' }),
        RequirementStub({ id: reqId2, name: 'Other', status: 'approved' }),
      ];
      const flows = [FlowStub({ requirementIds: [reqId1, reqId2] })];

      const result = questHasFlowCoverageGuard({ flows, requirements });

      expect(result).toBe(true);
    });

    it('VALID: {approved requirements covered across multiple flows} => returns true', () => {
      const reqId1 = RequirementIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const reqId2 = RequirementIdStub({ value: 'a47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const requirements = [
        RequirementStub({ id: reqId1, status: 'approved' }),
        RequirementStub({ id: reqId2, name: 'Other', status: 'approved' }),
      ];
      const flows = [
        FlowStub({ id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', requirementIds: [reqId1] }),
        FlowStub({ id: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', requirementIds: [reqId2] }),
      ];

      const result = questHasFlowCoverageGuard({ flows, requirements });

      expect(result).toBe(true);
    });

    it('VALID: {no approved requirements} => returns true', () => {
      const requirements = [
        RequirementStub({ status: 'proposed' }),
        RequirementStub({ id: 'a47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'Other', status: 'deferred' }),
      ];
      const flows: ReturnType<typeof FlowStub>[] = [];

      const result = questHasFlowCoverageGuard({ flows, requirements });

      expect(result).toBe(true);
    });

    it('VALID: {requirements without status are not checked} => returns true', () => {
      const requirements = [RequirementStub()];
      const flows: ReturnType<typeof FlowStub>[] = [];

      const result = questHasFlowCoverageGuard({ flows, requirements });

      expect(result).toBe(true);
    });

    it('VALID: {empty requirements array} => returns true', () => {
      const flows = [FlowStub()];

      const result = questHasFlowCoverageGuard({ flows, requirements: [] });

      expect(result).toBe(true);
    });

    it('VALID: {only deferred requirements not covered} => returns true', () => {
      const reqId = RequirementIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const requirements = [RequirementStub({ id: reqId, status: 'deferred' })];
      const flows: ReturnType<typeof FlowStub>[] = [];

      const result = questHasFlowCoverageGuard({ flows, requirements });

      expect(result).toBe(true);
    });
  });

  describe('invalid coverage', () => {
    it('INVALID_COVERAGE: {approved requirement not in any flow} => returns false', () => {
      const reqId = RequirementIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const requirements = [RequirementStub({ id: reqId, status: 'approved' })];
      const flows = [FlowStub({ requirementIds: [] })];

      const result = questHasFlowCoverageGuard({ flows, requirements });

      expect(result).toBe(false);
    });

    it('INVALID_COVERAGE: {one approved requirement uncovered among multiple} => returns false', () => {
      const reqId1 = RequirementIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const reqId2 = RequirementIdStub({ value: 'a47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const requirements = [
        RequirementStub({ id: reqId1, status: 'approved' }),
        RequirementStub({ id: reqId2, name: 'Other', status: 'approved' }),
      ];
      const flows = [FlowStub({ requirementIds: [reqId1] })];

      const result = questHasFlowCoverageGuard({ flows, requirements });

      expect(result).toBe(false);
    });

    it('INVALID_COVERAGE: {no flows with approved requirements} => returns false', () => {
      const reqId = RequirementIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const requirements = [RequirementStub({ id: reqId, status: 'approved' })];
      const flows: ReturnType<typeof FlowStub>[] = [];

      const result = questHasFlowCoverageGuard({ flows, requirements });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {flows: undefined} => returns false', () => {
      const result = questHasFlowCoverageGuard({ requirements: [] });

      expect(result).toBe(false);
    });

    it('EMPTY: {requirements: undefined} => returns false', () => {
      const result = questHasFlowCoverageGuard({ flows: [] });

      expect(result).toBe(false);
    });

    it('EMPTY: {both undefined} => returns false', () => {
      const result = questHasFlowCoverageGuard({});

      expect(result).toBe(false);
    });
  });
});
