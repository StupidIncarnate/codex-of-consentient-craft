import { AppQueueResponderProxy } from './app-queue-responder.proxy';
import { AppQueueResponder } from './app-queue-responder';

describe('AppQueueResponder', () => {
  describe('export', () => {
    it('VALID: => is a function', () => {
      AppQueueResponderProxy();

      expect(AppQueueResponder).toStrictEqual(expect.any(Function));
    });
  });
});
