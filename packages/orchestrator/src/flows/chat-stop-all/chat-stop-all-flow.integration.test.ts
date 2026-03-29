import { ChatStopAllFlow } from './chat-stop-all-flow';

describe('ChatStopAllFlow', () => {
  describe('delegation to responder', () => {
    it('EMPTY: {no active processes} => completes without throwing', () => {
      ChatStopAllFlow();

      expect(true).toBe(true);
    });
  });
});
