import { QuestStatusStub } from '@dungeonmaster/shared/contracts';

import { questHasValidStatusTransitionGuard } from './quest-has-valid-status-transition-guard';

describe('questHasValidStatusTransitionGuard', () => {
  describe('valid transitions', () => {
    it('VALID: {created -> flows_approved} => returns true', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: QuestStatusStub({ value: 'created' }),
        nextStatus: QuestStatusStub({ value: 'flows_approved' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {flows_approved -> requirements_approved} => returns true', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: QuestStatusStub({ value: 'flows_approved' }),
        nextStatus: QuestStatusStub({ value: 'requirements_approved' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {requirements_approved -> approved} => returns true', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: QuestStatusStub({ value: 'requirements_approved' }),
        nextStatus: QuestStatusStub({ value: 'approved' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {approved -> in_progress} => returns true', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: QuestStatusStub({ value: 'approved' }),
        nextStatus: QuestStatusStub({ value: 'in_progress' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {in_progress -> complete} => returns true', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: QuestStatusStub({ value: 'in_progress' }),
        nextStatus: QuestStatusStub({ value: 'complete' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {in_progress -> blocked} => returns true', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: QuestStatusStub({ value: 'in_progress' }),
        nextStatus: QuestStatusStub({ value: 'blocked' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {in_progress -> abandoned} => returns true', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: QuestStatusStub({ value: 'in_progress' }),
        nextStatus: QuestStatusStub({ value: 'abandoned' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {blocked -> in_progress} => returns true', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: QuestStatusStub({ value: 'blocked' }),
        nextStatus: QuestStatusStub({ value: 'in_progress' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {blocked -> abandoned} => returns true', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: QuestStatusStub({ value: 'blocked' }),
        nextStatus: QuestStatusStub({ value: 'abandoned' }),
      });

      expect(result).toBe(true);
    });
  });

  describe('invalid transitions', () => {
    it('INVALID: {created -> requirements_approved} => returns false (skips flows_approved)', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: QuestStatusStub({ value: 'created' }),
        nextStatus: QuestStatusStub({ value: 'requirements_approved' }),
      });

      expect(result).toBe(false);
    });

    it('INVALID: {created -> approved} => returns false (skips two steps)', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: QuestStatusStub({ value: 'created' }),
        nextStatus: QuestStatusStub({ value: 'approved' }),
      });

      expect(result).toBe(false);
    });

    it('INVALID: {complete -> in_progress} => returns false (terminal state)', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: QuestStatusStub({ value: 'complete' }),
        nextStatus: QuestStatusStub({ value: 'in_progress' }),
      });

      expect(result).toBe(false);
    });

    it('INVALID: {abandoned -> created} => returns false (terminal state)', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: QuestStatusStub({ value: 'abandoned' }),
        nextStatus: QuestStatusStub({ value: 'created' }),
      });

      expect(result).toBe(false);
    });

    it('INVALID: {flows_approved -> approved} => returns false (skips requirements_approved)', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: QuestStatusStub({ value: 'flows_approved' }),
        nextStatus: QuestStatusStub({ value: 'approved' }),
      });

      expect(result).toBe(false);
    });
  });

  describe('missing inputs', () => {
    it('INVALID: {currentStatus undefined} => returns false', () => {
      const result = questHasValidStatusTransitionGuard({
        nextStatus: QuestStatusStub({ value: 'flows_approved' }),
      });

      expect(result).toBe(false);
    });

    it('INVALID: {nextStatus undefined} => returns false', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: QuestStatusStub({ value: 'created' }),
      });

      expect(result).toBe(false);
    });

    it('INVALID: {both undefined} => returns false', () => {
      const result = questHasValidStatusTransitionGuard({});

      expect(result).toBe(false);
    });
  });
});
