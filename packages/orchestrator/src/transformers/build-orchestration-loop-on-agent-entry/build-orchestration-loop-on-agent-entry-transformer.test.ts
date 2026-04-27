import { ChatEntryStub, ProcessIdStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

import { SlotIndexStub } from '../../contracts/slot-index/slot-index.stub';
import { buildOrchestrationLoopOnAgentEntryTransformer } from './build-orchestration-loop-on-agent-entry-transformer';

type SlotIndex = ReturnType<typeof SlotIndexStub>;
type SessionId = ReturnType<typeof SessionIdStub>;

describe('buildOrchestrationLoopOnAgentEntryTransformer', () => {
  describe('first emit before sessionId is known', () => {
    it('VALID: {sessionId undefined, empty memo} => returns payload WITHOUT sessionId or chatProcessId', () => {
      const processId = ProcessIdStub({
        value: 'proc-queue-aaaaaaaa-1111-4222-9333-444444444444',
      });
      const slotIndex = SlotIndexStub({ value: 0 });
      const entries = [ChatEntryStub({ role: 'assistant', type: 'text', content: 'first-line' })];
      const slotIndexToSessionId = new Map<SlotIndex, SessionId>();

      const payload = buildOrchestrationLoopOnAgentEntryTransformer({
        processId,
        slotIndexToSessionId,
        slotIndex,
        entries,
      });

      expect(payload).toStrictEqual({ processId, slotIndex, entries });
    });
  });

  describe('emit with sessionId — populates memo and stamps payload', () => {
    it('VALID: {sessionId provided} => returns payload WITH sessionId AND chatProcessId === sessionId AND populates memo', () => {
      const processId = ProcessIdStub({
        value: 'proc-queue-aaaaaaaa-1111-4222-9333-444444444444',
      });
      const slotIndex = SlotIndexStub({ value: 0 });
      const entries = [
        ChatEntryStub({ role: 'assistant', type: 'text', content: 'second-line-with-session' }),
      ];
      const sessionId = SessionIdStub({ value: 'b4a5c2d1-918c-4408-aeb1-f8f4ce8400cb' });
      const slotIndexToSessionId = new Map<SlotIndex, SessionId>();

      const payload = buildOrchestrationLoopOnAgentEntryTransformer({
        processId,
        slotIndexToSessionId,
        slotIndex,
        entries,
        sessionId,
      });

      expect(payload).toStrictEqual({
        processId,
        slotIndex,
        entries,
        sessionId,
        chatProcessId: sessionId,
      });
      expect(slotIndexToSessionId.get(slotIndex)).toBe(sessionId);
    });
  });

  describe('subsequent emit without sessionId param — pulls from memo', () => {
    it('VALID: {memo populated, sessionId undefined in params} => returns payload WITH memoized sessionId AND chatProcessId === sessionId', () => {
      const processId = ProcessIdStub({
        value: 'proc-queue-aaaaaaaa-1111-4222-9333-444444444444',
      });
      const slotIndex = SlotIndexStub({ value: 0 });
      const entries = [
        ChatEntryStub({ role: 'assistant', type: 'text', content: 'third-line-defensive' }),
      ];
      const sessionId = SessionIdStub({ value: 'b4a5c2d1-918c-4408-aeb1-f8f4ce8400cb' });
      const slotIndexToSessionId = new Map<SlotIndex, SessionId>([[slotIndex, sessionId]]);

      const payload = buildOrchestrationLoopOnAgentEntryTransformer({
        processId,
        slotIndexToSessionId,
        slotIndex,
        entries,
      });

      expect(payload).toStrictEqual({
        processId,
        slotIndex,
        entries,
        sessionId,
        chatProcessId: sessionId,
      });
    });
  });

  describe('per-slot isolation', () => {
    it('VALID: {slot 0 has sessionId, slot 1 emits without one} => slot 1 payload omits sessionId+chatProcessId, slot 0 payload retains them', () => {
      const processId = ProcessIdStub({
        value: 'proc-queue-eeeeeeee-1111-4222-9333-444444444444',
      });
      const slot0 = SlotIndexStub({ value: 0 });
      const slot1 = SlotIndexStub({ value: 1 });
      const slot0SessionId = SessionIdStub({ value: '11111111-918c-4408-aeb1-f8f4ce8400cb' });
      const entries0 = [
        ChatEntryStub({ role: 'assistant', type: 'text', content: 'slot0-second-line' }),
      ];
      const entries1 = [
        ChatEntryStub({ role: 'assistant', type: 'text', content: 'slot1-first-line' }),
      ];
      const slotIndexToSessionId = new Map<SlotIndex, SessionId>([[slot0, slot0SessionId]]);

      const slot0Payload = buildOrchestrationLoopOnAgentEntryTransformer({
        processId,
        slotIndexToSessionId,
        slotIndex: slot0,
        entries: entries0,
      });
      const slot1Payload = buildOrchestrationLoopOnAgentEntryTransformer({
        processId,
        slotIndexToSessionId,
        slotIndex: slot1,
        entries: entries1,
      });

      expect(slot0Payload).toStrictEqual({
        processId,
        slotIndex: slot0,
        entries: entries0,
        sessionId: slot0SessionId,
        chatProcessId: slot0SessionId,
      });
      expect(slot1Payload).toStrictEqual({
        processId,
        slotIndex: slot1,
        entries: entries1,
      });
    });
  });
});
