import { isBeforeSpecApprovedQuestStatusGuard } from './is-before-spec-approved-quest-status-guard';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

const STATUSES = Object.keys(
  questStatusMetadataStatics.statuses,
) as readonly (keyof typeof questStatusMetadataStatics.statuses)[];

describe('isBeforeSpecApprovedQuestStatusGuard', () => {
  describe('state matrix', () => {
    it.each(STATUSES)('VALID: {status: %s} => returns expected flag', (status) => {
      const expected = questStatusMetadataStatics.statuses[status].isBeforeSpecApproved;

      const result = isBeforeSpecApprovedQuestStatusGuard({ status });

      expect(result).toBe(expected);
    });
  });

  describe('undefined input', () => {
    it('EMPTY: {status: undefined} => returns false', () => {
      const result = isBeforeSpecApprovedQuestStatusGuard({});

      expect(result).toBe(false);
    });
  });
});
