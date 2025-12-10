import { getCurrentPhaseTransformer } from './get-current-phase-transformer';
import { QuestPhasesStub } from '../../contracts/quest-phases/quest-phases.stub';

describe('getCurrentPhaseTransformer', () => {
  describe('in_progress phases', () => {
    it('VALID: {discovery in_progress} => returns "discovery"', () => {
      const phases = QuestPhasesStub({
        discovery: { status: 'in_progress' },
      });

      const result = getCurrentPhaseTransformer({ phases });

      expect(result).toBe('discovery');
    });

    it('VALID: {implementation in_progress} => returns "implementation"', () => {
      const phases = QuestPhasesStub({
        discovery: { status: 'complete' },
        implementation: { status: 'in_progress' },
      });

      const result = getCurrentPhaseTransformer({ phases });

      expect(result).toBe('implementation');
    });
  });

  describe('blocked phases', () => {
    it('VALID: {implementation blocked} => returns "implementation"', () => {
      const phases = QuestPhasesStub({
        discovery: { status: 'complete' },
        implementation: { status: 'blocked' },
      });

      const result = getCurrentPhaseTransformer({ phases });

      expect(result).toBe('implementation');
    });
  });

  describe('pending phases', () => {
    it('VALID: {all pending} => returns "discovery"', () => {
      const phases = QuestPhasesStub();

      const result = getCurrentPhaseTransformer({ phases });

      expect(result).toBe('discovery');
    });

    it('VALID: {first two complete, rest pending} => returns "testing"', () => {
      const phases = QuestPhasesStub({
        discovery: { status: 'complete' },
        implementation: { status: 'complete' },
      });

      const result = getCurrentPhaseTransformer({ phases });

      expect(result).toBe('testing');
    });
  });

  describe('skipped phases', () => {
    it('VALID: {testing skipped, review pending} => returns "review"', () => {
      const phases = QuestPhasesStub({
        discovery: { status: 'complete' },
        implementation: { status: 'complete' },
        testing: { status: 'skipped' },
      });

      const result = getCurrentPhaseTransformer({ phases });

      expect(result).toBe('review');
    });
  });

  describe('all complete', () => {
    it('VALID: {all complete} => returns undefined', () => {
      const phases = QuestPhasesStub({
        discovery: { status: 'complete' },
        implementation: { status: 'complete' },
        testing: { status: 'complete' },
        review: { status: 'complete' },
      });

      const result = getCurrentPhaseTransformer({ phases });

      expect(result).toBeUndefined();
    });

    it('VALID: {all complete or skipped} => returns undefined', () => {
      const phases = QuestPhasesStub({
        discovery: { status: 'complete' },
        implementation: { status: 'complete' },
        testing: { status: 'skipped' },
        review: { status: 'complete' },
      });

      const result = getCurrentPhaseTransformer({ phases });

      expect(result).toBeUndefined();
    });
  });
});
