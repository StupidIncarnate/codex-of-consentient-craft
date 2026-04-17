import { QuestStatusStub } from '@dungeonmaster/shared/contracts';

import { isExecutionPhaseGuard } from './is-execution-phase-guard';

type QuestStatus = ReturnType<typeof QuestStatusStub>;

describe('isExecutionPhaseGuard', () => {
  describe('execution phase statuses', () => {
    it('VALID: {status: seek_scope} => returns true', () => {
      const status: QuestStatus = QuestStatusStub({ value: 'seek_scope' });

      const result = isExecutionPhaseGuard({ status });

      expect(result).toBe(true);
    });

    it('VALID: {status: seek_synth} => returns true', () => {
      const status: QuestStatus = QuestStatusStub({ value: 'seek_synth' });

      const result = isExecutionPhaseGuard({ status });

      expect(result).toBe(true);
    });

    it('VALID: {status: seek_walk} => returns true', () => {
      const status: QuestStatus = QuestStatusStub({ value: 'seek_walk' });

      const result = isExecutionPhaseGuard({ status });

      expect(result).toBe(true);
    });

    it('VALID: {status: seek_plan} => returns true', () => {
      const status: QuestStatus = QuestStatusStub({ value: 'seek_plan' });

      const result = isExecutionPhaseGuard({ status });

      expect(result).toBe(true);
    });

    it('VALID: {status: in_progress} => returns true', () => {
      const status: QuestStatus = QuestStatusStub({ value: 'in_progress' });

      const result = isExecutionPhaseGuard({ status });

      expect(result).toBe(true);
    });

    it('VALID: {status: paused} => returns true', () => {
      const status: QuestStatus = QuestStatusStub({ value: 'paused' });

      const result = isExecutionPhaseGuard({ status });

      expect(result).toBe(true);
    });

    it('VALID: {status: blocked} => returns true', () => {
      const status: QuestStatus = QuestStatusStub({ value: 'blocked' });

      const result = isExecutionPhaseGuard({ status });

      expect(result).toBe(true);
    });

    it('VALID: {status: complete} => returns true', () => {
      const status: QuestStatus = QuestStatusStub({ value: 'complete' });

      const result = isExecutionPhaseGuard({ status });

      expect(result).toBe(true);
    });

    it('VALID: {status: abandoned} => returns true', () => {
      const status: QuestStatus = QuestStatusStub({ value: 'abandoned' });

      const result = isExecutionPhaseGuard({ status });

      expect(result).toBe(true);
    });
  });

  describe('non-execution phase statuses', () => {
    it('INVALID: {status: created} => returns false', () => {
      const status: QuestStatus = QuestStatusStub({ value: 'created' });

      const result = isExecutionPhaseGuard({ status });

      expect(result).toBe(false);
    });

    it('INVALID: {status: pending} => returns false', () => {
      const status: QuestStatus = QuestStatusStub({ value: 'pending' });

      const result = isExecutionPhaseGuard({ status });

      expect(result).toBe(false);
    });

    it('INVALID: {status: approved} => returns false', () => {
      const status: QuestStatus = QuestStatusStub({ value: 'approved' });

      const result = isExecutionPhaseGuard({ status });

      expect(result).toBe(false);
    });

    it('INVALID: {status: explore_flows} => returns false', () => {
      const status: QuestStatus = QuestStatusStub({ value: 'explore_flows' });

      const result = isExecutionPhaseGuard({ status });

      expect(result).toBe(false);
    });

    it('INVALID: {status: review_flows} => returns false', () => {
      const status: QuestStatus = QuestStatusStub({ value: 'review_flows' });

      const result = isExecutionPhaseGuard({ status });

      expect(result).toBe(false);
    });

    it('INVALID: {status: flows_approved} => returns false', () => {
      const status: QuestStatus = QuestStatusStub({ value: 'flows_approved' });

      const result = isExecutionPhaseGuard({ status });

      expect(result).toBe(false);
    });

    it('INVALID: {status: explore_observables} => returns false', () => {
      const status: QuestStatus = QuestStatusStub({ value: 'explore_observables' });

      const result = isExecutionPhaseGuard({ status });

      expect(result).toBe(false);
    });

    it('INVALID: {status: review_observables} => returns false', () => {
      const status: QuestStatus = QuestStatusStub({ value: 'review_observables' });

      const result = isExecutionPhaseGuard({ status });

      expect(result).toBe(false);
    });

    it('INVALID: {status: explore_design} => returns false', () => {
      const status: QuestStatus = QuestStatusStub({ value: 'explore_design' });

      const result = isExecutionPhaseGuard({ status });

      expect(result).toBe(false);
    });

    it('INVALID: {status: review_design} => returns false', () => {
      const status: QuestStatus = QuestStatusStub({ value: 'review_design' });

      const result = isExecutionPhaseGuard({ status });

      expect(result).toBe(false);
    });

    it('INVALID: {status: design_approved} => returns false', () => {
      const status: QuestStatus = QuestStatusStub({ value: 'design_approved' });

      const result = isExecutionPhaseGuard({ status });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {status undefined} => returns false', () => {
      const result = isExecutionPhaseGuard({});

      expect(result).toBe(false);
    });
  });
});
