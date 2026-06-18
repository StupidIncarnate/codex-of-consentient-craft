import { DependencyStepStub } from '@dungeonmaster/shared/contracts';

import { isLawbringerReviewableStepGuard } from './is-lawbringer-reviewable-step-guard';

describe('isLawbringerReviewableStepGuard', () => {
  describe('reviewable source files', () => {
    it('VALID: {focusFile contracts/ path} => returns true', () => {
      const step = DependencyStepStub({
        focusFile: {
          path: 'packages/web/src/contracts/observable-count/observable-count-contract.ts',
        },
      });

      expect(isLawbringerReviewableStepGuard({ step })).toBe(true);
    });

    it('VALID: {focusFile widgets/ .tsx path} => returns true', () => {
      const step = DependencyStepStub({
        focusFile: {
          path: 'packages/web/src/widgets/react-flow-diagram/react-flow-diagram-widget.tsx',
        },
      });

      expect(isLawbringerReviewableStepGuard({ step })).toBe(true);
    });

    it('VALID: {focusFile flows/ path} => returns true (flowrider exclusion is the chunker, not this guard)', () => {
      const step = DependencyStepStub({
        focusFile: { path: 'packages/web/src/flows/quest-chat/quest-spec-panel-diagram.e2e.ts' },
      });

      expect(isLawbringerReviewableStepGuard({ step })).toBe(true);
    });
  });

  describe('operational instruction steps', () => {
    it('INVALID: {focusFile [command] with embedded src/ path} => returns false', () => {
      const step = DependencyStepStub({
        focusFile: {
          path: '[command] Delete directories: packages/shared/src/transformers/flow-to-mermaid/',
        },
      });

      expect(isLawbringerReviewableStepGuard({ step })).toBe(false);
    });

    it('INVALID: {focusFile [sweep-check] with embedded src/ path} => returns false', () => {
      const step = DependencyStepStub({
        focusFile: {
          path: '[sweep-check] Delete packages/web/src/adapters/panzoom/ and all files',
        },
      });

      expect(isLawbringerReviewableStepGuard({ step })).toBe(false);
    });

    it('INVALID: {focusFile [verification] grep instruction} => returns false', () => {
      const step = DependencyStepStub({
        focusFile: { path: '[verification] Run: grep -rn mermaid packages/web/src' },
      });

      expect(isLawbringerReviewableStepGuard({ step })).toBe(false);
    });
  });

  describe('non-source files', () => {
    it('INVALID: {focusFile package.json} => returns false', () => {
      const step = DependencyStepStub({
        focusFile: { path: 'packages/web/package.json' },
      });

      expect(isLawbringerReviewableStepGuard({ step })).toBe(false);
    });

    it('INVALID: {focusFile package-root barrel} => returns false', () => {
      const step = DependencyStepStub({
        focusFile: { path: 'packages/shared/transformers.ts' },
      });

      expect(isLawbringerReviewableStepGuard({ step })).toBe(false);
    });
  });

  describe('no focusFile', () => {
    it('EMPTY: {step: undefined} => returns false', () => {
      expect(isLawbringerReviewableStepGuard({})).toBe(false);
    });
  });
});
