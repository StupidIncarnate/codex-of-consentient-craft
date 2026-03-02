import { QuestChatFlow } from './quest-chat-flow';

describe('QuestChatFlow', () => {
  describe('export', () => {
    it('VALID: {} => exports QuestChatFlow function', () => {
      expect(typeof QuestChatFlow).toBe('function');
    });
  });
});
