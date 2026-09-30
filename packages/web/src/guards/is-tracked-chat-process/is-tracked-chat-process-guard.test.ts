
import { isTrackedChatProcessGuard } from './is-tracked-chat-process-guard';

describe('isTrackedChatProcessGuard', () => {
  describe('a tracked turn', () => {
    it('VALID: {chatProcessId matches trackedChatProcessId} => returns true', () => {
      const chatProcessId = 'proc-mine';

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
        chatProcessId: 'proc-somebody-else',
        trackedChatProcessId: 'proc-mine',
      });

      expect(result).toBe(false);
    });

    it('VALID: {payload carries no chatProcessId} => returns true', () => {
      const result = isTrackedChatProcessGuard({
        trackedChatProcessId: 'proc-mine',
      });

      expect(result).toBe(true);
    });
  });

  describe('an untracked turn', () => {
    it('VALID: {trackedChatProcessId null, payload names a process} => returns true', () => {
      const result = isTrackedChatProcessGuard({
        chatProcessId: 'proc-anything',
        trackedChatProcessId: null,
      });

      expect(result).toBe(true);
    });

    it('EMPTY: {trackedChatProcessId omitted, payload names a process} => returns true', () => {
      const result = isTrackedChatProcessGuard({
        chatProcessId: 'proc-anything',
      });

      expect(result).toBe(true);
    });

    it('EMPTY: {neither id supplied} => returns true', () => {
      const result = isTrackedChatProcessGuard({});

      expect(result).toBe(true);
    });
  });

  describe('a retained completion', () => {
    it('VALID: {retained, chatProcessId matches trackedChatProcessId} => returns true', () => {
      const chatProcessId = 'chat-first-message';

      const result = isTrackedChatProcessGuard({
        chatProcessId,
        trackedChatProcessId: chatProcessId,
        retained: true,
      });

      expect(result).toBe(true);
    });

    // The whole reason `retained` exists. A turn committed a moment ago has no handle until its
    // POST resolves, and a re-delivered completion for some earlier turn would otherwise clear it.
    it('VALID: {retained, trackedChatProcessId null} => returns false', () => {
      const result = isTrackedChatProcessGuard({
        chatProcessId: 'chat-an-earlier-turn',
        trackedChatProcessId: null,
        retained: true,
      });

      expect(result).toBe(false);
    });

    it('VALID: {retained, chatProcessId names a different process} => returns false', () => {
      const result = isTrackedChatProcessGuard({
        chatProcessId: 'chat-an-earlier-turn',
        trackedChatProcessId: 'chat-mine',
        retained: true,
      });

      expect(result).toBe(false);
    });

    it('EMPTY: {retained, payload carries no chatProcessId} => returns false', () => {
      const result = isTrackedChatProcessGuard({
        trackedChatProcessId: 'chat-mine',
        retained: true,
      });

      expect(result).toBe(false);
    });

    it('VALID: {retained false, trackedChatProcessId null} => returns true, same as an unflagged frame', () => {
      const result = isTrackedChatProcessGuard({
        chatProcessId: 'chat-anything',
        trackedChatProcessId: null,
        retained: false,
      });

      expect(result).toBe(true);
    });
  });
});
