import { QuestChatResultStub } from './quest-chat-result.stub';
import { questChatResultContract } from './quest-chat-result-contract';

describe('questChatResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = QuestChatResultStub();

      expect(questChatResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {chatProcessId: wrong type} => throws', () => {
      expect(() =>
        questChatResultContract.parse({ ...QuestChatResultStub(), chatProcessId: 123 }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
