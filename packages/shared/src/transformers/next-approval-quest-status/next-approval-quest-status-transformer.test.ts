import { nextApprovalQuestStatusTransformer } from './next-approval-quest-status-transformer';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

const STATUSES = Object.keys(
  questStatusMetadataStatics.statuses,
) as readonly (keyof typeof questStatusMetadataStatics.statuses)[];

describe('nextApprovalQuestStatusTransformer', () => {
  describe('specific approval-gate statuses', () => {
    it('VALID: {status: review_flows} => returns flows_approved', () => {
      const result = nextApprovalQuestStatusTransformer({ status: 'review_flows' });

      expect(result).toBe('flows_approved');
    });

    it('VALID: {status: review_observables} => returns approved', () => {
      const result = nextApprovalQuestStatusTransformer({ status: 'review_observables' });

      expect(result).toBe('approved');
    });

    it('VALID: {status: review_design} => returns design_approved', () => {
      const result = nextApprovalQuestStatusTransformer({ status: 'review_design' });

      expect(result).toBe('design_approved');
    });
  });

  describe('state matrix — delegates to metadata', () => {
    it.each(STATUSES)('VALID: {status: %s} => matches metadata.nextApprovalStatus', (status) => {
      const expected = questStatusMetadataStatics.statuses[status].nextApprovalStatus;

      const result = nextApprovalQuestStatusTransformer({ status });

      expect(result).toBe(expected);
    });
  });
});
