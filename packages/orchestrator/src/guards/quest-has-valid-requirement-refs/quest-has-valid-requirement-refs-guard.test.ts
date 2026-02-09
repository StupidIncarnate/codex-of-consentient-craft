import {
  ObservableStub,
  RequirementStub,
  RequirementIdStub,
} from '@dungeonmaster/shared/contracts';

import { questHasValidRequirementRefsGuard } from './quest-has-valid-requirement-refs-guard';

describe('questHasValidRequirementRefsGuard', () => {
  describe('valid references', () => {
    it('VALID: {observable references existing requirement} => returns true', () => {
      const reqId = RequirementIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const requirements = [RequirementStub({ id: reqId })];
      const observables = [ObservableStub({ requirementId: reqId })];

      const result = questHasValidRequirementRefsGuard({ observables, requirements });

      expect(result).toBe(true);
    });

    it('VALID: {observable without requirementId} => returns true', () => {
      const requirements = [RequirementStub()];
      const observables = [ObservableStub()];

      const result = questHasValidRequirementRefsGuard({ observables, requirements });

      expect(result).toBe(true);
    });

    it('VALID: {mix of with and without requirementId} => returns true', () => {
      const reqId = RequirementIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const requirements = [RequirementStub({ id: reqId })];
      const observables = [
        ObservableStub({ id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', requirementId: reqId }),
        ObservableStub({ id: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e' }),
      ];

      const result = questHasValidRequirementRefsGuard({ observables, requirements });

      expect(result).toBe(true);
    });

    it('VALID: {empty observables} => returns true', () => {
      const requirements = [RequirementStub()];

      const result = questHasValidRequirementRefsGuard({ observables: [], requirements });

      expect(result).toBe(true);
    });
  });

  describe('invalid references', () => {
    it('INVALID_REQUIREMENT: {observable references non-existent requirement} => returns false', () => {
      const reqId = RequirementIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const otherReqId = RequirementIdStub({ value: 'aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee' });
      const requirements = [RequirementStub({ id: reqId })];
      const observables = [ObservableStub({ requirementId: otherReqId })];

      const result = questHasValidRequirementRefsGuard({ observables, requirements });

      expect(result).toBe(false);
    });

    it('INVALID_REQUIREMENT: {empty requirements, observable has requirementId} => returns false', () => {
      const reqId = RequirementIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const observables = [ObservableStub({ requirementId: reqId })];

      const result = questHasValidRequirementRefsGuard({ observables, requirements: [] });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {observables: undefined} => returns false', () => {
      const result = questHasValidRequirementRefsGuard({ requirements: [] });

      expect(result).toBe(false);
    });

    it('EMPTY: {requirements: undefined} => returns false', () => {
      const result = questHasValidRequirementRefsGuard({ observables: [] });

      expect(result).toBe(false);
    });

    it('EMPTY: {both undefined} => returns false', () => {
      const result = questHasValidRequirementRefsGuard({});

      expect(result).toBe(false);
    });
  });
});
