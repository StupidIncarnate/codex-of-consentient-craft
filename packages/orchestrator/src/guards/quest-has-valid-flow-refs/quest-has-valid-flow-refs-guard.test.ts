import {
  FlowStub,
  RequirementStub,
  RequirementIdStub,
} from '@dungeonmaster/shared/contracts';

import { questHasValidFlowRefsGuard } from './quest-has-valid-flow-refs-guard';

describe('questHasValidFlowRefsGuard', () => {
  describe('valid references', () => {
    it('VALID: {flow references existing requirement} => returns true', () => {
      const reqId = RequirementIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const requirements = [RequirementStub({ id: reqId })];
      const flows = [FlowStub({ requirementIds: [reqId] })];

      const result = questHasValidFlowRefsGuard({ flows, requirements });

      expect(result).toBe(true);
    });

    it('VALID: {multiple flows all reference valid requirements} => returns true', () => {
      const reqId1 = RequirementIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const reqId2 = RequirementIdStub({ value: 'a47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const requirements = [RequirementStub({ id: reqId1 }), RequirementStub({ id: reqId2, name: 'Other' })];
      const flows = [
        FlowStub({ id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', requirementIds: [reqId1] }),
        FlowStub({ id: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', requirementIds: [reqId2] }),
      ];

      const result = questHasValidFlowRefsGuard({ flows, requirements });

      expect(result).toBe(true);
    });

    it('VALID: {flow with multiple requirementIds all valid} => returns true', () => {
      const reqId1 = RequirementIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const reqId2 = RequirementIdStub({ value: 'a47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const requirements = [RequirementStub({ id: reqId1 }), RequirementStub({ id: reqId2, name: 'Other' })];
      const flows = [FlowStub({ requirementIds: [reqId1, reqId2] })];

      const result = questHasValidFlowRefsGuard({ flows, requirements });

      expect(result).toBe(true);
    });

    it('VALID: {empty flows array} => returns true', () => {
      const requirements = [RequirementStub()];

      const result = questHasValidFlowRefsGuard({ flows: [], requirements });

      expect(result).toBe(true);
    });

    it('VALID: {flow with empty requirementIds} => returns true', () => {
      const requirements = [RequirementStub()];
      const flows = [FlowStub({ requirementIds: [] })];

      const result = questHasValidFlowRefsGuard({ flows, requirements });

      expect(result).toBe(true);
    });
  });

  describe('invalid references', () => {
    it('INVALID_FLOW_REF: {flow references non-existent requirement} => returns false', () => {
      const reqId = RequirementIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const otherReqId = RequirementIdStub({ value: 'aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee' });
      const requirements = [RequirementStub({ id: reqId })];
      const flows = [FlowStub({ requirementIds: [otherReqId] })];

      const result = questHasValidFlowRefsGuard({ flows, requirements });

      expect(result).toBe(false);
    });

    it('INVALID_FLOW_REF: {one of multiple requirementIds is invalid} => returns false', () => {
      const reqId = RequirementIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const invalidReqId = RequirementIdStub({ value: 'aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee' });
      const requirements = [RequirementStub({ id: reqId })];
      const flows = [FlowStub({ requirementIds: [reqId, invalidReqId] })];

      const result = questHasValidFlowRefsGuard({ flows, requirements });

      expect(result).toBe(false);
    });

    it('INVALID_FLOW_REF: {empty requirements array with flows referencing ids} => returns false', () => {
      const reqId = RequirementIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const flows = [FlowStub({ requirementIds: [reqId] })];

      const result = questHasValidFlowRefsGuard({ flows, requirements: [] });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {flows: undefined} => returns false', () => {
      const result = questHasValidFlowRefsGuard({ requirements: [] });

      expect(result).toBe(false);
    });

    it('EMPTY: {requirements: undefined} => returns false', () => {
      const result = questHasValidFlowRefsGuard({ flows: [] });

      expect(result).toBe(false);
    });

    it('EMPTY: {both undefined} => returns false', () => {
      const result = questHasValidFlowRefsGuard({});

      expect(result).toBe(false);
    });
  });
});
