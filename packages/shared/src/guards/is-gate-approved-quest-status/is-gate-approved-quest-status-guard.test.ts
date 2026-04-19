import { isGateApprovedQuestStatusGuard } from './is-gate-approved-quest-status-guard';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

const STATUSES = Object.keys(
  questStatusMetadataStatics.statuses,
) as readonly (keyof typeof questStatusMetadataStatics.statuses)[];

const GATE_APPROVED_STATUSES: ReadonlySet<keyof typeof questStatusMetadataStatics.statuses> =
  new Set(['flows_approved', 'approved', 'design_approved']);

describe('isGateApprovedQuestStatusGuard', () => {
  describe('state matrix', () => {
    it.each(STATUSES)('VALID: {status: %s} => returns expected flag', (status) => {
      const expected = GATE_APPROVED_STATUSES.has(status);

      const result = isGateApprovedQuestStatusGuard({ status });

      expect(result).toBe(expected);
    });
  });

  describe('undefined input', () => {
    it('EMPTY: {status: undefined} => returns false', () => {
      const result = isGateApprovedQuestStatusGuard({});

      expect(result).toBe(false);
    });
  });
});
