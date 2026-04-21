import { classifyStatusLiteralTransformer } from './classify-status-literal-transformer';

describe('classifyStatusLiteralTransformer', () => {
  describe('quest-only literals', () => {
    it.each([
      'created',
      'explore_flows',
      'review_flows',
      'flows_approved',
      'explore_observables',
      'review_observables',
      'approved',
      'explore_design',
      'review_design',
      'design_approved',
      'seek_scope',
      'seek_synth',
      'seek_walk',
      'seek_plan',
      'paused',
      'blocked',
      'abandoned',
    ] as const)('VALID: {literal: %s} => returns "quest"', (literal) => {
      expect(classifyStatusLiteralTransformer({ literal })).toBe('quest');
    });
  });

  describe('work-item-only literals', () => {
    it.each(['failed', 'skipped'] as const)(
      'VALID: {literal: %s} => returns "workItem"',
      (literal) => {
        expect(classifyStatusLiteralTransformer({ literal })).toBe('workItem');
      },
    );
  });

  describe('ambiguous literals (both enums)', () => {
    it.each(['in_progress', 'complete', 'pending'] as const)(
      'VALID: {literal: %s} => returns "ambiguous"',
      (literal) => {
        expect(classifyStatusLiteralTransformer({ literal })).toBe('ambiguous');
      },
    );
  });

  describe('non-status literals', () => {
    it.each(['', 'not_a_status', 'running', 'done', 'IN_PROGRESS'] as const)(
      'EMPTY: {literal: %s} => returns null',
      (literal) => {
        expect(classifyStatusLiteralTransformer({ literal })).toBe(null);
      },
    );
  });
});
