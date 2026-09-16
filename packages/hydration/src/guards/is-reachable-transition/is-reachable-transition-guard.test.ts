import { isReachableTransitionGuard } from './is-reachable-transition-guard';
import { TransitionSpecStub } from '../../contracts/transition-spec/transition-spec.stub';

describe('isReachableTransitionGuard', () => {
  describe('a value on the list', () => {
    it('VALID: {to: "in_progress", spec.to: ["created", "in_progress"]} => returns true', () => {
      const spec = TransitionSpecStub({ field: 'status', to: ['created', 'in_progress'] });

      expect(isReachableTransitionGuard({ to: 'in_progress', spec })).toBe(true);
    });
  });

  describe('a value off the list', () => {
    it('INVALID: {to: "blocked", spec.to: ["created", "in_progress"]} => returns false', () => {
      const spec = TransitionSpecStub({ field: 'status', to: ['created', 'in_progress'] });

      expect(isReachableTransitionGuard({ to: 'blocked', spec })).toBe(false);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {} => returns false', () => {
      expect(isReachableTransitionGuard({})).toBe(false);
    });
  });
});
