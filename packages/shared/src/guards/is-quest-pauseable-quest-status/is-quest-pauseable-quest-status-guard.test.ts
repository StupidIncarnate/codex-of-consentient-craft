import { isQuestPauseableQuestStatusGuard } from './is-quest-pauseable-quest-status-guard';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

const STATUSES = Object.keys(
  questStatusMetadataStatics.statuses,
) as readonly (keyof typeof questStatusMetadataStatics.statuses)[];

const PAUSEABLE_STATUSES: ReadonlySet<keyof typeof questStatusMetadataStatics.statuses> = new Set([
  'seek_scope',
  'seek_synth',
  'seek_walk',
  'seek_plan',
  'in_progress',
]);

describe('isQuestPauseableQuestStatusGuard', () => {
  describe('state matrix', () => {
    it.each(STATUSES)('VALID: {status: %s} => returns expected flag', (status) => {
      const expected = PAUSEABLE_STATUSES.has(status);

      const result = isQuestPauseableQuestStatusGuard({ status });

      expect(result).toBe(expected);
    });
  });

  describe('undefined input', () => {
    it('EMPTY: {status: undefined} => returns false', () => {
      const result = isQuestPauseableQuestStatusGuard({});

      expect(result).toBe(false);
    });
  });
});
