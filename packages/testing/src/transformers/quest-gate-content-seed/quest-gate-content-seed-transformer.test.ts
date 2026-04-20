import {
  PlanningReviewReportStub,
  PlanningScopeClassificationStub,
  PlanningSynthesisStub,
  PlanningWalkFindingsStub,
} from '@dungeonmaster/shared/contracts';

import { questGateContentSeedTransformer } from './quest-gate-content-seed-transformer';

describe('questGateContentSeedTransformer', () => {
  describe('seek_synth status', () => {
    it('VALID: {status: seek_synth, no override} => adds scopeClassification stub and empty report arrays', () => {
      const result = questGateContentSeedTransformer({ status: 'seek_synth' });

      expect(result).toStrictEqual({
        scopeClassification: PlanningScopeClassificationStub(),
        surfaceReports: [],
        blightReports: [],
      });
    });
  });

  describe('seek_walk status', () => {
    it('VALID: {status: seek_walk, no override} => adds scopeClassification + synthesis stubs and empty report arrays', () => {
      const result = questGateContentSeedTransformer({ status: 'seek_walk' });

      expect(result).toStrictEqual({
        scopeClassification: PlanningScopeClassificationStub(),
        synthesis: PlanningSynthesisStub(),
        surfaceReports: [],
        blightReports: [],
      });
    });
  });

  describe('seek_plan status', () => {
    it('VALID: {status: seek_plan, no override} => adds scopeClassification + synthesis + walkFindings stubs and empty report arrays', () => {
      const result = questGateContentSeedTransformer({ status: 'seek_plan' });

      expect(result).toStrictEqual({
        scopeClassification: PlanningScopeClassificationStub(),
        synthesis: PlanningSynthesisStub(),
        walkFindings: PlanningWalkFindingsStub(),
        surfaceReports: [],
        blightReports: [],
      });
    });
  });

  describe('in_progress status', () => {
    it('VALID: {status: in_progress, no override} => adds all four stubs and empty report arrays', () => {
      const result = questGateContentSeedTransformer({ status: 'in_progress' });

      expect(result).toStrictEqual({
        scopeClassification: PlanningScopeClassificationStub(),
        synthesis: PlanningSynthesisStub(),
        walkFindings: PlanningWalkFindingsStub(),
        reviewReport: PlanningReviewReportStub(),
        surfaceReports: [],
        blightReports: [],
      });
    });
  });

  describe('non-gated status', () => {
    it('VALID: {status: created, no override} => returns only empty report arrays (no gate fields)', () => {
      const result = questGateContentSeedTransformer({ status: 'created' });

      expect(result).toStrictEqual({
        surfaceReports: [],
        blightReports: [],
      });
    });
  });

  describe('caller override', () => {
    it('VALID: {status: seek_synth, override.scopeClassification: custom} => preserves override and does NOT overwrite with stub', () => {
      const customScope = PlanningScopeClassificationStub({
        size: 'large',
        slicing: 'Custom slicing from caller' as never,
        rationale: 'Caller-provided rationale' as never,
      });

      const result = questGateContentSeedTransformer({
        status: 'seek_synth',
        override: { scopeClassification: customScope },
      });

      expect(result).toStrictEqual({
        scopeClassification: customScope,
        surfaceReports: [],
        blightReports: [],
      });
    });

    it('VALID: {status: seek_walk, override.synthesis only} => preserves synthesis override AND auto-adds scopeClassification stub', () => {
      const customSynthesis = PlanningSynthesisStub({
        orderOfOperations: 'Custom caller ordering' as never,
      });

      const result = questGateContentSeedTransformer({
        status: 'seek_walk',
        override: { synthesis: customSynthesis },
      });

      expect(result).toStrictEqual({
        scopeClassification: PlanningScopeClassificationStub(),
        synthesis: customSynthesis,
        surfaceReports: [],
        blightReports: [],
      });
    });
  });
});
