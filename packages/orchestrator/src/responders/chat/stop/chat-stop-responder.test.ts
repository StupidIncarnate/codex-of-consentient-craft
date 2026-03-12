import { ProcessIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

import { ChatStopResponderProxy } from './chat-stop-responder.proxy';

describe('ChatStopResponder', () => {
  describe('process found', () => {
    it('VALID: {chatProcessId: existing} => returns true and kills process', () => {
      const proxy = ChatStopResponderProxy();
      const chatProcessId = ProcessIdStub({ value: 'chat-abc-123' });
      const questId = QuestIdStub({ value: 'quest-stop-1' });
      const kill = jest.fn();
      proxy.setupWithProcess({ processId: chatProcessId, questId, kill });

      const result = proxy.callResponder({ chatProcessId });

      expect(result).toBe(true);
      expect(kill).toHaveBeenCalledTimes(1);
    });
  });

  describe('process not found', () => {
    it('EMPTY: {chatProcessId: unknown} => returns false', () => {
      const proxy = ChatStopResponderProxy();
      proxy.setupEmpty();
      const chatProcessId = ProcessIdStub({ value: 'chat-nonexistent' });

      const result = proxy.callResponder({ chatProcessId });

      expect(result).toBe(false);
    });
  });
});
