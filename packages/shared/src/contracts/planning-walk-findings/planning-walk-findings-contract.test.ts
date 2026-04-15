import { planningWalkFindingsContract } from './planning-walk-findings-contract';
import { PlanningWalkFindingsStub } from './planning-walk-findings.stub';

describe('planningWalkFindingsContract', () => {
  describe('valid walk findings', () => {
    it('VALID: {default stub} => parses successfully', () => {
      const result = PlanningWalkFindingsStub();

      expect(result).toStrictEqual({
        filesRead: [],
        structuralIssuesFound: [],
        planPatches: [],
        verifiedAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: {populated arrays} => parses successfully', () => {
      const result = PlanningWalkFindingsStub({
        filesRead: ['/home/user/src/foo.ts'],
        structuralIssuesFound: ['Missing barrel export in shared/contracts.ts'],
        planPatches: ['Step 3 now references existing adapter, not a new one'],
      });

      expect(result).toStrictEqual({
        filesRead: ['/home/user/src/foo.ts'],
        structuralIssuesFound: ['Missing barrel export in shared/contracts.ts'],
        planPatches: ['Step 3 now references existing adapter, not a new one'],
        verifiedAt: '2024-01-15T10:00:00.000Z',
      });
    });
  });

  describe('invalid walk findings', () => {
    it('INVALID: {verifiedAt: "not-a-date"} => throws validation error', () => {
      expect(() => {
        return planningWalkFindingsContract.parse({
          verifiedAt: 'not-a-date',
        });
      }).toThrow(/Invalid datetime/u);
    });

    it('INVALID: {structuralIssuesFound: [""]} => throws validation error', () => {
      expect(() => {
        return planningWalkFindingsContract.parse({
          structuralIssuesFound: [''],
          verifiedAt: '2024-01-15T10:00:00.000Z',
        });
      }).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID: {planPatches: [""]} => throws validation error', () => {
      expect(() => {
        return planningWalkFindingsContract.parse({
          planPatches: [''],
          verifiedAt: '2024-01-15T10:00:00.000Z',
        });
      }).toThrow(/String must contain at least 1 character/u);
    });
  });
});
