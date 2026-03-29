import { AppQuestChatResponderProxy } from './app-quest-chat-responder.proxy';
import { AppQuestChatResponder } from './app-quest-chat-responder';

describe('AppQuestChatResponder', () => {
  describe('export', () => {
    it('VALID: => is a function', () => {
      AppQuestChatResponderProxy();

      expect(AppQuestChatResponder).toStrictEqual(expect.any(Function));
    });
  });
});
