import { ChatStopAllFlow } from './chat-stop-all-flow';

describe('ChatStopAllFlow', () => {
  describe('delegation to responder', () => {
    it('EMPTY: {no active processes} => exports a function that completes', () => {
      ChatStopAllFlow();

      expect(ChatStopAllFlow).toStrictEqual(expect.any(Function));
    });
  });
});
