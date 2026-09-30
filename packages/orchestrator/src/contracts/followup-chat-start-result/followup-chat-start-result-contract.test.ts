import { FollowupChatStartResultStub } from './followup-chat-start-result.stub';
import { followupChatStartResultContract } from './followup-chat-start-result-contract';

describe('followupChatStartResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = FollowupChatStartResultStub();

      expect(followupChatStartResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {chatProcessId: wrong type} => throws', () => {
      expect(() =>
        followupChatStartResultContract.parse({
          ...FollowupChatStartResultStub(),
          chatProcessId: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
