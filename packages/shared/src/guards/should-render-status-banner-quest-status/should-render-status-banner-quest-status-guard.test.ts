import { shouldRenderStatusBannerQuestStatusGuard } from './should-render-status-banner-quest-status-guard';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

const STATUSES = Object.keys(
  questStatusMetadataStatics.statuses,
) as readonly (keyof typeof questStatusMetadataStatics.statuses)[];

// Both the case list and the expected subset come from the same static the guard reads, so a
// status added to `statuses` joins this matrix automatically rather than being silently skipped.
const STATUS_BANNER_STATUSES: ReadonlySet<keyof typeof questStatusMetadataStatics.statuses> =
  new Set(
    STATUSES.filter(
      (status) => questStatusMetadataStatics.statuses[status].shouldRenderStatusBanner,
    ),
  );

describe('shouldRenderStatusBannerQuestStatusGuard', () => {
  describe('state matrix', () => {
    it.each(STATUSES)('VALID: {status: %s} => returns expected flag', (status) => {
      const expected = STATUS_BANNER_STATUSES.has(status);

      const result = shouldRenderStatusBannerQuestStatusGuard({ status });

      expect(result).toBe(expected);
    });
  });

  describe('undefined input', () => {
    it('EMPTY: {status: undefined} => returns false', () => {
      const result = shouldRenderStatusBannerQuestStatusGuard({});

      expect(result).toBe(false);
    });
  });
});
