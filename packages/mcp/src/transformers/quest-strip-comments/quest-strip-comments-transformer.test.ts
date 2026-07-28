import { GetQuestResultStub, QuestCommentStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { questStripCommentsTransformer } from './quest-strip-comments-transformer';

describe('questStripCommentsTransformer', () => {
  describe('valid results', () => {
    it('VALID: {result with 3 comments} => returns quest with comments key entirely stripped', () => {
      const quest = QuestStub({
        comments: [
          QuestCommentStub({ id: 'a1a2a3a4-58cc-4372-a567-0e02b2c3d479', text: 'First comment' }),
          QuestCommentStub({
            id: 'b1b2b3b4-58cc-4372-a567-0e02b2c3d479',
            text: 'Second comment',
          }),
          QuestCommentStub({ id: 'c1c2c3c4-58cc-4372-a567-0e02b2c3d479', text: 'Third comment' }),
        ],
      });
      const result = GetQuestResultStub({ quest });
      // Mutate quest only AFTER it fed the stub above — GetQuestResultStub's own parse already
      // produced an independent `result.quest`, so deleting `comments` here just shapes what we
      // expect the transformer to return.
      Reflect.deleteProperty(quest, 'comments');

      const payload = questStripCommentsTransformer({ result });

      expect(payload).toStrictEqual({ success: true, quest });
    });

    it('VALID: {result with no comments} => returns quest with comments key still absent', () => {
      const quest = QuestStub({ comments: [] });
      const result = GetQuestResultStub({ quest });
      Reflect.deleteProperty(quest, 'comments');

      const payload = questStripCommentsTransformer({ result });

      expect(payload).toStrictEqual({ success: true, quest });
    });

    it('VALID: {result: success false with quest attached} => propagates success false and still strips comments', () => {
      const quest = QuestStub({ comments: [QuestCommentStub()] });
      const result = GetQuestResultStub({ success: false, quest });
      Reflect.deleteProperty(quest, 'comments');

      const payload = questStripCommentsTransformer({ result });

      expect(payload).toStrictEqual({ success: false, quest });
    });
  });

  describe('results carrying no quest', () => {
    it('EMPTY: {result: success false with an error and no quest} => propagates success and error, omits quest', () => {
      const result = GetQuestResultStub({ success: false, error: 'Quest not found' as never });
      // GetQuestResultStub always defaults a quest in; drop it so this models the real
      // adapter shape for a quest that could not be loaded at all.
      Reflect.deleteProperty(result, 'quest');

      const payload = questStripCommentsTransformer({ result });

      expect(payload).toStrictEqual({ success: false, error: 'Quest not found' });
    });
  });
});
