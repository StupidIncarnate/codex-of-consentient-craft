import { ProcessIdStub } from '@dungeonmaster/shared/contracts';

import { chatProcessState } from '../../../state/chat-process/chat-process-state';
import { ChatStopAllResponderProxy } from './chat-stop-all-responder.proxy';

describe('ChatStopAllResponder', () => {
  describe('with active processes', () => {
    it('VALID: {two active processes} => kills all and clears state', () => {
      const proxy = ChatStopAllResponderProxy();
      const kill1 = jest.fn();
      const kill2 = jest.fn();
      const processId1 = ProcessIdStub({ value: 'chat-1' });
      const processId2 = ProcessIdStub({ value: 'chat-2' });
      proxy.setupWithProcess({ processId: processId1, kill: kill1 });
      chatProcessState.register({ processId: processId2, kill: kill2 });

      proxy.callResponder();

      expect(kill1).toHaveBeenCalledTimes(1);
      expect(kill2).toHaveBeenCalledTimes(1);
      expect(chatProcessState.has({ processId: processId1 })).toBe(false);
      expect(chatProcessState.has({ processId: processId2 })).toBe(false);
    });
  });

  describe('with no active processes', () => {
    it('EMPTY: {no processes} => completes without error', () => {
      const proxy = ChatStopAllResponderProxy();
      proxy.setupEmpty();

      expect(() => {
        proxy.callResponder();
      }).not.toThrow();
    });
  });
});
