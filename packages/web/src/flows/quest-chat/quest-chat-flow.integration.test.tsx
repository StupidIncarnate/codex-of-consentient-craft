import { QuestChatFlow } from './quest-chat-flow';

describe('QuestChatFlow', () => {
  describe('export', () => {
    it('VALID: {} => exports QuestChatFlow function', () => {
      expect(QuestChatFlow).toStrictEqual(expect.any(Function));
    });
  });
});
