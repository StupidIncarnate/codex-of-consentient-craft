import { pathseekerQuestReviewMinionStatics } from './pathseeker-quest-review-minion-statics';

describe('pathseekerQuestReviewMinionStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(pathseekerQuestReviewMinionStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });
});
