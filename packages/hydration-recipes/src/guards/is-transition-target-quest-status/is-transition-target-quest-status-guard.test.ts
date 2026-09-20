import { isTransitionTargetQuestStatusGuard } from './is-transition-target-quest-status-guard';
import { questStatusMetadataStatics } from '@dungeonmaster/shared/statics';
import { questTransitionTargetStatusesStatics } from '../../statics/quest-transition-target-statuses/quest-transition-target-statuses-statics';

type StatusKey = keyof typeof questStatusMetadataStatics.statuses;

const ALL_STATUSES = Object.keys(questStatusMetadataStatics.statuses) as readonly StatusKey[];
const UNASKABLE_STATUSES = new Set([
  'created',
  'pending',
  'paused',
  'blocked',
  'merging',
  'merged',
]);

describe('isTransitionTargetQuestStatusGuard', () => {
  describe('every real quest status', () => {
    it.each(ALL_STATUSES)(
      'VALID: {status: %s} => returns whether a caller may ask a transition for it',
      (status) => {
        const result = isTransitionTargetQuestStatusGuard({ status });

        expect(result).toBe(!UNASKABLE_STATUSES.has(status));
      },
    );
  });

  describe('no status supplied', () => {
    it('EMPTY: {status: undefined} => returns false', () => {
      const result = isTransitionTargetQuestStatusGuard({});

      expect(result).toBe(false);
    });
  });

  describe('agreement with the pinned transition-target statics', () => {
    it('VALID: every real status filtered by this guard => matches questTransitionTargetStatusesStatics.value exactly', () => {
      const reachable = ALL_STATUSES.filter((status) =>
        isTransitionTargetQuestStatusGuard({ status }),
      );

      expect(reachable).toStrictEqual([...questTransitionTargetStatusesStatics.value]);
    });
  });
});
