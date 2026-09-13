import {
  TaskNotificationChatEntryStub,
  TaskToolUseChatEntryStub,
} from '@dungeonmaster/shared/contracts';

import {
  SingleGroupStub,
  SubagentChainGroupStub,
} from '../../contracts/chat-entry-group/chat-entry-group.stub';
import { IsoTimestampStub } from '../../contracts/iso-timestamp/iso-timestamp.stub';
import { subagentElapsedInputTransformer } from './subagent-elapsed-input-transformer';

describe('subagentElapsedInputTransformer', () => {
  describe('group kind branch', () => {
    it('EMPTY: {group: SingleGroupStub()} => returns null', () => {
      const result = subagentElapsedInputTransformer({ group: SingleGroupStub() });

      expect(result).toBe(null);
    });
  });

  describe('taskToolUse branch', () => {
    it('EMPTY: {taskToolUse: null} => returns null', () => {
      const result = subagentElapsedInputTransformer({
        group: SubagentChainGroupStub({ taskToolUse: null }),
      });

      expect(result).toBe(null);
    });

    it('VALID: {taskToolUse present, taskNotification: null, now omitted} => returns only startedAt', () => {
      const group = SubagentChainGroupStub({
        taskToolUse: TaskToolUseChatEntryStub({ timestamp: '2026-09-10T10:00:00.000Z' }),
        taskNotification: null,
      });

      const result = subagentElapsedInputTransformer({ group });

      expect(result).toStrictEqual({ startedAt: '2026-09-10T10:00:00.000Z' });
    });
  });

  describe('taskNotification branch', () => {
    it('VALID: {taskNotification present, no durationMs} => returns startedAt and endedAt', () => {
      const group = SubagentChainGroupStub({
        taskToolUse: TaskToolUseChatEntryStub({ timestamp: '2026-09-10T10:00:00.000Z' }),
        taskNotification: TaskNotificationChatEntryStub({ timestamp: '2026-09-10T10:05:00.000Z' }),
      });

      const result = subagentElapsedInputTransformer({ group });

      expect(result).toStrictEqual({
        startedAt: '2026-09-10T10:00:00.000Z',
        endedAt: '2026-09-10T10:05:00.000Z',
      });
    });

    it('VALID: {taskNotification present, durationMs: 9033} => returns startedAt, endedAt and reportedDurationMs', () => {
      const group = SubagentChainGroupStub({
        taskToolUse: TaskToolUseChatEntryStub({ timestamp: '2026-09-10T10:00:00.000Z' }),
        taskNotification: TaskNotificationChatEntryStub({
          timestamp: '2026-09-10T10:05:00.000Z',
          durationMs: 9033,
        }),
      });

      const result = subagentElapsedInputTransformer({ group });

      expect(result).toStrictEqual({
        startedAt: '2026-09-10T10:00:00.000Z',
        endedAt: '2026-09-10T10:05:00.000Z',
        reportedDurationMs: 9033,
      });
    });
  });

  describe('now branch', () => {
    it('VALID: {now: "2026-09-10T10:02:00.000Z"} => returns clockReading alongside startedAt', () => {
      const group = SubagentChainGroupStub({
        taskToolUse: TaskToolUseChatEntryStub({ timestamp: '2026-09-10T10:00:00.000Z' }),
        taskNotification: null,
      });

      const result = subagentElapsedInputTransformer({
        group,
        now: IsoTimestampStub({ value: '2026-09-10T10:02:00.000Z' }),
      });

      expect(result).toStrictEqual({
        startedAt: '2026-09-10T10:00:00.000Z',
        clockReading: '2026-09-10T10:02:00.000Z',
      });
    });
  });
});
