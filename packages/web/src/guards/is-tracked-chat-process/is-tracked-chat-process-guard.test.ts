import { ProcessIdStub } from '@dungeonmaster/shared/contracts';

import { isTrackedChatProcessGuard } from './is-tracked-chat-process-guard';

describe('isTrackedChatProcessGuard', () => {
  describe('a tracked turn', () => {
    it('VALID: {chatProcessId matches trackedChatProcessId} => returns true', () => {
      const chatProcessId = ProcessIdStub({ value: 'proc-mine' });

      const result = isTrackedChatProcessGuard({
        chatProcessId,
        trackedChatProcessId: chatProcessId,
      });

      expect(result).toBe(true);
    });

    // The arm that stops a sibling work item's completion from reporting this composer's
    // in-flight turn as idle.
    it('VALID: {chatProcessId names a different process} => returns false', () => {
      const result = isTrackedChatProcessGuard({
        chatProcessId: ProcessIdStub({ value: 'proc-somebody-else' }),
        trackedChatProcessId: ProcessIdStub({ value: 'proc-mine' }),
      });

      expect(result).toBe(false);
    });

    it('VALID: {payload carries no chatProcessId} => returns true', () => {
      const result = isTrackedChatProcessGuard({
        trackedChatProcessId: ProcessIdStub({ value: 'proc-mine' }),
      });

      expect(result).toBe(true);
    });
  });

  describe('an untracked turn', () => {
    it('VALID: {trackedChatProcessId null, payload names a process} => returns true', () => {
      const result = isTrackedChatProcessGuard({
        chatProcessId: ProcessIdStub({ value: 'proc-anything' }),
        trackedChatProcessId: null,
      });

      expect(result).toBe(true);
    });

    it('EMPTY: {trackedChatProcessId omitted, payload names a process} => returns true', () => {
      const result = isTrackedChatProcessGuard({
        chatProcessId: ProcessIdStub({ value: 'proc-anything' }),
      });

      expect(result).toBe(true);
    });

    it('EMPTY: {neither id supplied} => returns true', () => {
      const result = isTrackedChatProcessGuard({});

      expect(result).toBe(true);
    });
  });
});
