import { isDesignPhaseQuestStatusGuard } from './is-design-phase-quest-status-guard';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

const STATUSES = Object.keys(
  questStatusMetadataStatics.statuses,
) as readonly (keyof typeof questStatusMetadataStatics.statuses)[];

const DESIGN_PHASE_STATUSES: ReadonlySet<keyof typeof questStatusMetadataStatics.statuses> =
  new Set(['explore_design', 'review_design', 'design_approved']);

describe('isDesignPhaseQuestStatusGuard', () => {
  describe('state matrix', () => {
    it.each(STATUSES)('VALID: {status: %s} => returns expected flag', (status) => {
      const expected = DESIGN_PHASE_STATUSES.has(status);

      const result = isDesignPhaseQuestStatusGuard({ status });

      expect(result).toBe(expected);
    });
  });

  describe('undefined input', () => {
    it('EMPTY: {status: undefined} => returns false', () => {
      const result = isDesignPhaseQuestStatusGuard({});

      expect(result).toBe(false);
    });
  });
});
