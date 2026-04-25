import { isCompletedSuccessfullyQuestStatusGuard } from './is-completed-successfully-quest-status-guard';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

const STATUSES = Object.keys(
  questStatusMetadataStatics.statuses,
) as readonly (keyof typeof questStatusMetadataStatics.statuses)[];

describe('isCompletedSuccessfullyQuestStatusGuard', () => {
  it('VALID: {status: complete} => returns true', () => {
    const result = isCompletedSuccessfullyQuestStatusGuard({ status: 'complete' });

    expect(result).toBe(true);
  });

  it('VALID: {status: abandoned} => returns false', () => {
    const result = isCompletedSuccessfullyQuestStatusGuard({ status: 'abandoned' });

    expect(result).toBe(false);
  });

  it('VALID: {status: blocked} => returns false', () => {
    const result = isCompletedSuccessfullyQuestStatusGuard({ status: 'blocked' });

    expect(result).toBe(false);
  });

  it('VALID: {status: in_progress} => returns false', () => {
    const result = isCompletedSuccessfullyQuestStatusGuard({ status: 'in_progress' });

    expect(result).toBe(false);
  });

  it('EMPTY: {status: undefined} => returns false', () => {
    const result = isCompletedSuccessfullyQuestStatusGuard({});

    expect(result).toBe(false);
  });

  it.each(STATUSES)('VALID: {status: %s} => mirrors metadata.isCompletedSuccessfully', (status) => {
    const expected = questStatusMetadataStatics.statuses[status].isCompletedSuccessfully;

    const result = isCompletedSuccessfullyQuestStatusGuard({ status });

    expect(result).toBe(expected);
  });
});
