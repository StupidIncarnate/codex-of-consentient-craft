import { QuestStatusStub } from '@dungeonmaster/shared/contracts/quest-status/quest-status.stub';
import { questStatusMetadataStatics } from '@dungeonmaster/shared/statics';

import { questHasValidStatusTransitionGuard } from './quest-has-valid-status-transition-guard';

type StatusKey = keyof typeof questStatusMetadataStatics.statuses;

const NON_TERMINAL_STATUSES = (
  Object.keys(questStatusMetadataStatics.statuses) as readonly StatusKey[]
).filter((status) => !questStatusMetadataStatics.statuses[status].isTerminal);

describe('questHasValidStatusTransitionGuard', () => {
  describe('valid transitions', () => {
    it('VALID: {created -> explore_flows} => returns true', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: 'created',
        nextStatus: 'explore_flows',
      });

      expect(result).toBe(true);
    });

    it('VALID: {explore_flows -> review_flows} => returns true', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: 'explore_flows',
        nextStatus: 'review_flows',
      });

      expect(result).toBe(true);
    });

    it('VALID: {review_flows -> flows_approved} => returns true', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: 'review_flows',
        nextStatus: 'flows_approved',
      });

      expect(result).toBe(true);
    });

    it('VALID: {review_flows -> explore_flows} => returns true (back-to-explore)', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: 'review_flows',
        nextStatus: 'explore_flows',
      });

      expect(result).toBe(true);
    });

    it('VALID: {flows_approved -> explore_observables} => returns true', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: 'flows_approved',
        nextStatus: 'explore_observables',
      });

      expect(result).toBe(true);
    });

    it('VALID: {explore_observables -> review_observables} => returns true', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: 'explore_observables',
        nextStatus: 'review_observables',
      });

      expect(result).toBe(true);
    });

    it('VALID: {review_observables -> approved} => returns true', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: 'review_observables',
        nextStatus: 'approved',
      });

      expect(result).toBe(true);
    });

    it('VALID: {review_observables -> explore_observables} => returns true (back-to-explore)', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: 'review_observables',
        nextStatus: 'explore_observables',
      });

      expect(result).toBe(true);
    });

    it('VALID: {approved -> in_progress} => returns true', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: 'approved',
        nextStatus: 'in_progress',
      });

      expect(result).toBe(true);
    });

    it('VALID: {in_progress -> complete} => returns true', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: 'in_progress',
        nextStatus: 'complete',
      });

      expect(result).toBe(true);
    });

    it('VALID: {in_progress -> blocked} => returns true', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: 'in_progress',
        nextStatus: 'blocked',
      });

      expect(result).toBe(true);
    });

    it('VALID: {in_progress -> abandoned} => returns true', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: 'in_progress',
        nextStatus: 'abandoned',
      });

      expect(result).toBe(true);
    });

    it('VALID: {blocked -> in_progress} => returns true', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: 'blocked',
        nextStatus: 'in_progress',
      });

      expect(result).toBe(true);
    });

    it('VALID: {blocked -> abandoned} => returns true', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: 'blocked',
        nextStatus: 'abandoned',
      });

      expect(result).toBe(true);
    });

    it.each(NON_TERMINAL_STATUSES)(
      'VALID: {%s -> abandoned} => returns true (meta-derived)',
      (status) => {
        const result = questHasValidStatusTransitionGuard({
          currentStatus: QuestStatusStub({ value: status }),
          nextStatus: 'abandoned',
        });

        expect(result).toBe(true);
      },
    );
  });

  describe('invalid transitions', () => {
    it('INVALID: {created -> flows_approved} => returns false (skips explore/review)', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: 'created',
        nextStatus: 'flows_approved',
      });

      expect(result).toBe(false);
    });

    it('INVALID: {flows_approved -> approved} => returns false (skips explore/review observables)', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: 'flows_approved',
        nextStatus: 'approved',
      });

      expect(result).toBe(false);
    });

    it('INVALID: {created -> approved} => returns false (skips multiple steps)', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: 'created',
        nextStatus: 'approved',
      });

      expect(result).toBe(false);
    });

    it('INVALID: {created -> in_progress} => returns false (skips multiple steps)', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: 'created',
        nextStatus: 'in_progress',
      });

      expect(result).toBe(false);
    });

    it('INVALID: {complete -> in_progress} => returns false (terminal state)', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: 'complete',
        nextStatus: 'in_progress',
      });

      expect(result).toBe(false);
    });

    it('INVALID: {abandoned -> created} => returns false (terminal state)', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: 'abandoned',
        nextStatus: 'created',
      });

      expect(result).toBe(false);
    });

    it('INVALID: {complete -> abandoned} => returns false (terminal state)', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: 'complete',
        nextStatus: 'abandoned',
      });

      expect(result).toBe(false);
    });

    it('INVALID: {abandoned -> abandoned} => returns false (terminal state)', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: 'abandoned',
        nextStatus: 'abandoned',
      });

      expect(result).toBe(false);
    });
  });

  describe('missing inputs', () => {
    it('INVALID: {currentStatus undefined} => returns false', () => {
      const result = questHasValidStatusTransitionGuard({
        nextStatus: 'flows_approved',
      });

      expect(result).toBe(false);
    });

    it('INVALID: {nextStatus undefined} => returns false', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: 'created',
      });

      expect(result).toBe(false);
    });

    it('INVALID: {both undefined} => returns false', () => {
      const result = questHasValidStatusTransitionGuard({});

      expect(result).toBe(false);
    });
  });
});
