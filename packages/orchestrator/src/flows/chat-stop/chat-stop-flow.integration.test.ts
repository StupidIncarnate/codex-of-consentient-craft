import { ProcessIdStub } from '@dungeonmaster/shared/contracts';

import { ChatStopFlow } from './chat-stop-flow';

describe('ChatStopFlow', () => {
  describe('export', () => {
    it('VALID: ChatStopFlow => exports a function', () => {
      expect(ChatStopFlow).toStrictEqual(expect.any(Function));
    });
  });

  describe('process not found', () => {
    it('EMPTY: {chatProcessId: unregistered} => returns false', () => {
      const chatProcessId = ProcessIdStub({ value: 'chat-nonexistent' });

      const result = ChatStopFlow({ chatProcessId });

      expect(result).toBe(false);
    });
  });
});
