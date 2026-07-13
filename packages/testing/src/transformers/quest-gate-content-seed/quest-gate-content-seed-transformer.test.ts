import { PlanningBlightReportStub } from '@dungeonmaster/shared/contracts';

import { questGateContentSeedTransformer } from './quest-gate-content-seed-transformer';

describe('questGateContentSeedTransformer', () => {
  describe('no override', () => {
    it('VALID: {status: in_progress, no override} => returns empty blightReports', () => {
      const result = questGateContentSeedTransformer({ status: 'in_progress' });

      expect(result).toStrictEqual({
        blightReports: [],
      });
    });

    it('VALID: {status: created, no override} => returns empty blightReports regardless of status value', () => {
      const result = questGateContentSeedTransformer({ status: 'created' });

      expect(result).toStrictEqual({
        blightReports: [],
      });
    });
  });

  describe('caller override', () => {
    it('VALID: {status: in_progress, override.blightReports: custom} => preserves override and does NOT overwrite with empty array', () => {
      const customReport = PlanningBlightReportStub();

      const result = questGateContentSeedTransformer({
        status: 'in_progress',
        override: { blightReports: [customReport] },
      });

      expect(result).toStrictEqual({
        blightReports: [customReport],
      });
    });

    it('VALID: {status: in_progress, override without blightReports} => preserves override fields AND adds empty blightReports', () => {
      const result = questGateContentSeedTransformer({
        status: 'in_progress',
        override: { extraField: 'caller-provided' },
      });

      expect(result).toStrictEqual({
        extraField: 'caller-provided',
        blightReports: [],
      });
    });

    it('EDGE: {status: in_progress, override: {}} => returns empty blightReports same as no override', () => {
      const result = questGateContentSeedTransformer({
        status: 'in_progress',
        override: {},
      });

      expect(result).toStrictEqual({
        blightReports: [],
      });
    });
  });
});
