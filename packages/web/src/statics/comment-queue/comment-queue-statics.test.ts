import { commentQueueStatics } from './comment-queue-statics';

describe('commentQueueStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(commentQueueStatics).toStrictEqual({
      storage: {
        keyPrefix: 'dungeonmaster-quest-comments-',
      },
      expiry: {
        days: 7,
        msPerDay: 86_400_000,
      },
      editor: {
        rows: 2,
        lineHeightPx: 18,
        verticalChromePx: 18,
      },
    });
  });
});
