import { planningBlightReportContract } from './planning-blight-report-contract';
import { PlanningBlightReportStub } from './planning-blight-report.stub';

describe('planningBlightReportContract', () => {
  describe('valid reports', () => {
    it('VALID: {default stub} => parses successfully', () => {
      const result = PlanningBlightReportStub();

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
        minion: 'security',
        status: 'active',
        findings: [],
        createdAt: '2024-01-15T10:00:00.000Z',
        reviewedOn: [],
      });
    });

    it('VALID: {minion: synthesizer, status: resolved} => parses successfully', () => {
      const result = PlanningBlightReportStub({
        minion: 'synthesizer',
        status: 'resolved',
      });

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
        minion: 'synthesizer',
        status: 'resolved',
        findings: [],
        createdAt: '2024-01-15T10:00:00.000Z',
        reviewedOn: [],
      });
    });

    it('VALID: {minion: dedup} => parses successfully', () => {
      const result = PlanningBlightReportStub({
        minion: 'dedup',
      });

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
        minion: 'dedup',
        status: 'active',
        findings: [],
        createdAt: '2024-01-15T10:00:00.000Z',
        reviewedOn: [],
      });
    });

    it('VALID: {minion: perf} => parses successfully', () => {
      const result = PlanningBlightReportStub({
        minion: 'perf',
      });

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
        minion: 'perf',
        status: 'active',
        findings: [],
        createdAt: '2024-01-15T10:00:00.000Z',
        reviewedOn: [],
      });
    });

    it('VALID: {minion: integrity} => parses successfully', () => {
      const result = PlanningBlightReportStub({
        minion: 'integrity',
      });

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
        minion: 'integrity',
        status: 'active',
        findings: [],
        createdAt: '2024-01-15T10:00:00.000Z',
        reviewedOn: [],
      });
    });

    it('VALID: {minion: dead-code} => parses successfully', () => {
      const result = PlanningBlightReportStub({
        minion: 'dead-code',
      });

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
        minion: 'dead-code',
        status: 'active',
        findings: [],
        createdAt: '2024-01-15T10:00:00.000Z',
        reviewedOn: [],
      });
    });

    it('VALID: {findings populated + reviewedOn populated} => parses successfully', () => {
      const result = PlanningBlightReportStub({
        findings: [
          {
            file: '/repo/src/foo.ts',
            line: 12,
            category: 'dead-export',
            evidence: 'unused export `bar` at line 12',
            fixHint: 'delete export',
          },
        ],
        reviewedOn: ['aabbccdd-3e38-48c9-bdec-22b61883b473'],
        status: 'blocking-carry',
      });

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
        minion: 'security',
        status: 'blocking-carry',
        findings: [
          {
            file: '/repo/src/foo.ts',
            line: 12,
            category: 'dead-export',
            evidence: 'unused export `bar` at line 12',
            fixHint: 'delete export',
          },
        ],
        createdAt: '2024-01-15T10:00:00.000Z',
        reviewedOn: ['aabbccdd-3e38-48c9-bdec-22b61883b473'],
      });
    });
  });

  describe('invalid reports', () => {
    it('INVALID: {id: "not-a-uuid"} => throws validation error', () => {
      expect(() => {
        return planningBlightReportContract.parse({
          id: 'not-a-uuid',
          workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
          minion: 'security',
          status: 'active',
          createdAt: '2024-01-15T10:00:00.000Z',
        });
      }).toThrow(/Invalid uuid/u);
    });

    it('INVALID: {workItemId: "not-a-uuid"} => throws validation error', () => {
      expect(() => {
        return planningBlightReportContract.parse({
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          workItemId: 'not-a-uuid',
          minion: 'security',
          status: 'active',
          createdAt: '2024-01-15T10:00:00.000Z',
        });
      }).toThrow(/Invalid uuid/u);
    });

    it('INVALID: {minion: "unknown"} => throws validation error', () => {
      expect(() => {
        return planningBlightReportContract.parse({
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
          minion: 'unknown',
          status: 'active',
          createdAt: '2024-01-15T10:00:00.000Z',
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {status: "unknown"} => throws validation error', () => {
      expect(() => {
        return planningBlightReportContract.parse({
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
          minion: 'security',
          status: 'unknown',
          createdAt: '2024-01-15T10:00:00.000Z',
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {createdAt: "not-a-date"} => throws validation error', () => {
      expect(() => {
        return planningBlightReportContract.parse({
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
          minion: 'security',
          status: 'active',
          createdAt: 'not-a-date',
        });
      }).toThrow(/Invalid datetime/u);
    });

    it('INVALID: {findings[0].category: ""} => throws validation error', () => {
      expect(() => {
        return planningBlightReportContract.parse({
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
          minion: 'security',
          status: 'active',
          findings: [
            {
              file: '/repo/src/foo.ts',
              line: 12,
              category: '',
              evidence: 'ev',
              fixHint: 'hint',
            },
          ],
          createdAt: '2024-01-15T10:00:00.000Z',
        });
      }).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID: {findings[0].line: 0} => throws validation error', () => {
      expect(() => {
        return planningBlightReportContract.parse({
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
          minion: 'security',
          status: 'active',
          findings: [
            {
              file: '/repo/src/foo.ts',
              line: 0,
              category: 'cat',
              evidence: 'ev',
              fixHint: 'hint',
            },
          ],
          createdAt: '2024-01-15T10:00:00.000Z',
        });
      }).toThrow(/Number must be greater than 0/u);
    });
  });
});
