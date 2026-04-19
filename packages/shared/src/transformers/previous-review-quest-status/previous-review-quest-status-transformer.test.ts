import { previousReviewQuestStatusTransformer } from './previous-review-quest-status-transformer';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

const STATUSES = Object.keys(
  questStatusMetadataStatics.statuses,
) as readonly (keyof typeof questStatusMetadataStatics.statuses)[];

describe('previousReviewQuestStatusTransformer', () => {
  describe('specific gate-approved statuses', () => {
    it('VALID: {status: flows_approved} => returns review_flows', () => {
      const result = previousReviewQuestStatusTransformer({ status: 'flows_approved' });

      expect(result).toBe('review_flows');
    });

    it('VALID: {status: approved} => returns review_observables', () => {
      const result = previousReviewQuestStatusTransformer({ status: 'approved' });

      expect(result).toBe('review_observables');
    });

    it('VALID: {status: design_approved} => returns review_design', () => {
      const result = previousReviewQuestStatusTransformer({ status: 'design_approved' });

      expect(result).toBe('review_design');
    });
  });

  describe('state matrix — delegates to metadata', () => {
    it.each(STATUSES)('VALID: {status: %s} => matches metadata.previousReviewStatus', (status) => {
      const expected = questStatusMetadataStatics.statuses[status].previousReviewStatus;

      const result = previousReviewQuestStatusTransformer({ status });

      expect(result).toBe(expected);
    });
  });
});
