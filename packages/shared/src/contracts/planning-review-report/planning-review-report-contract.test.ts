import { planningReviewReportContract } from './planning-review-report-contract';
import { PlanningReviewReportStub } from './planning-review-report.stub';

describe('planningReviewReportContract', () => {
  describe('valid review reports', () => {
    it('VALID: {default stub} => parses successfully', () => {
      const result = PlanningReviewReportStub();

      expect(result).toStrictEqual({
        signal: 'clean',
        criticalItems: [],
        warnings: [],
        info: [],
        rawReport: '# Review Report\n\nNo blocking issues.',
        reviewedAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: {signal: "warnings", warnings populated} => parses successfully', () => {
      const result = PlanningReviewReportStub({
        signal: 'warnings',
        warnings: ['Consider splitting broker X'],
      });

      expect(result).toStrictEqual({
        signal: 'warnings',
        criticalItems: [],
        warnings: ['Consider splitting broker X'],
        info: [],
        rawReport: '# Review Report\n\nNo blocking issues.',
        reviewedAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: {signal: "critical", criticalItems populated} => parses successfully', () => {
      const result = PlanningReviewReportStub({
        signal: 'critical',
        criticalItems: ['Plan violates layer import rules'],
      });

      expect(result).toStrictEqual({
        signal: 'critical',
        criticalItems: ['Plan violates layer import rules'],
        warnings: [],
        info: [],
        rawReport: '# Review Report\n\nNo blocking issues.',
        reviewedAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: {reviewedBy populated} => parses successfully', () => {
      const result = PlanningReviewReportStub({
        reviewedBy: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
      });

      expect(result).toStrictEqual({
        signal: 'clean',
        criticalItems: [],
        warnings: [],
        info: [],
        rawReport: '# Review Report\n\nNo blocking issues.',
        reviewedBy: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
        reviewedAt: '2024-01-15T10:00:00.000Z',
      });
    });
  });

  describe('invalid review reports', () => {
    it('INVALID: {signal: "bad"} => throws validation error', () => {
      expect(() => {
        return planningReviewReportContract.parse({
          signal: 'bad',
          rawReport: 'body',
          reviewedAt: '2024-01-15T10:00:00.000Z',
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {rawReport: ""} => throws validation error', () => {
      expect(() => {
        return planningReviewReportContract.parse({
          signal: 'clean',
          rawReport: '',
          reviewedAt: '2024-01-15T10:00:00.000Z',
        });
      }).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID: {reviewedAt: "not-a-date"} => throws validation error', () => {
      expect(() => {
        return planningReviewReportContract.parse({
          signal: 'clean',
          rawReport: 'body',
          reviewedAt: 'not-a-date',
        });
      }).toThrow(/Invalid datetime/u);
    });

    it('INVALID: {criticalItems: [""]} => throws validation error', () => {
      expect(() => {
        return planningReviewReportContract.parse({
          signal: 'clean',
          criticalItems: [''],
          rawReport: 'body',
          reviewedAt: '2024-01-15T10:00:00.000Z',
        });
      }).toThrow(/String must contain at least 1 character/u);
    });
  });
});
