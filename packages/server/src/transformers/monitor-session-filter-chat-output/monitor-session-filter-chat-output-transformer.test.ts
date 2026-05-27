import {
  AssistantTextChatEntryStub,
  ProcessIdStub,
  TaskToolUseChatEntryStub,
} from '@dungeonmaster/shared/contracts';

import type { ToolNameStub } from '../../contracts/tool-name/tool-name.stub';
import { monitorSessionFilterChatOutputTransformer } from './monitor-session-filter-chat-output-transformer';
import { monitorSessionFilterChatOutputTransformerProxy } from './monitor-session-filter-chat-output-transformer.proxy';

type ToolName = ReturnType<typeof ToolNameStub>;

const makePayload = (entries: unknown): Record<PropertyKey, unknown> => {
  if (entries === undefined) {
    return {};
  }
  return { entries };
};

describe('monitorSessionFilterChatOutputTransformer', () => {
  describe('non-monitor-session chatProcessIds', () => {
    it('VALID: {chatProcessId: undefined} => returns payload unchanged (filter skipped)', () => {
      monitorSessionFilterChatOutputTransformerProxy();
      const entry = AssistantTextChatEntryStub({
        source: 'session',
        content: 'user-visible text',
      });
      const payload = makePayload([entry]);

      const result = monitorSessionFilterChatOutputTransformer({
        payload,
        payloadChatProcessId: undefined,
        monitorTaskToolUseIds: new Set<ToolName>(),
      });

      expect(result).toStrictEqual({ payload });
    });

    it('VALID: {chatProcessId: chat-<uuid>} => returns payload unchanged (legacy chat-spawn-broker)', () => {
      monitorSessionFilterChatOutputTransformerProxy();
      const entry = AssistantTextChatEntryStub({
        source: 'session',
        content: 'chaoswhisperer text',
      });
      const payload = makePayload([entry]);

      const result = monitorSessionFilterChatOutputTransformer({
        payload,
        payloadChatProcessId: ProcessIdStub({ value: 'chat-abc-123' }),
        monitorTaskToolUseIds: new Set<ToolName>(),
      });

      expect(result).toStrictEqual({ payload });
    });

    it('VALID: {chatProcessId: replay-<sessionId>} => returns payload unchanged (orphan-session readonly viewer)', () => {
      monitorSessionFilterChatOutputTransformerProxy();
      const entry = AssistantTextChatEntryStub({
        source: 'session',
        content: 'historic chat text',
      });
      const payload = makePayload([entry]);

      const result = monitorSessionFilterChatOutputTransformer({
        payload,
        payloadChatProcessId: ProcessIdStub({ value: 'replay-session-1' }),
        monitorTaskToolUseIds: new Set<ToolName>(),
      });

      expect(result).toStrictEqual({ payload });
    });

    it('VALID: {chatProcessId: quest-replay-<...>} => returns payload unchanged (quest internal replay)', () => {
      monitorSessionFilterChatOutputTransformerProxy();
      const entry = AssistantTextChatEntryStub({
        source: 'session',
        content: 'work-item replay text',
      });
      const payload = makePayload([entry]);

      const result = monitorSessionFilterChatOutputTransformer({
        payload,
        payloadChatProcessId: ProcessIdStub({ value: 'quest-replay-q1-wi1-s1' }),
        monitorTaskToolUseIds: new Set<ToolName>(),
      });

      expect(result).toStrictEqual({ payload });
    });
  });

  describe('monitor-session chatProcessIds (proc-monitor- prefix)', () => {
    it('VALID: {dispatcher text on monitor session} => returns null (entire batch filtered)', () => {
      monitorSessionFilterChatOutputTransformerProxy();
      const entry = AssistantTextChatEntryStub({
        source: 'session',
        content: 'dispatcher narration',
      });
      const payload = makePayload([entry]);

      const result = monitorSessionFilterChatOutputTransformer({
        payload,
        payloadChatProcessId: ProcessIdStub({ value: 'proc-monitor-session-1' }),
        monitorTaskToolUseIds: new Set<ToolName>(),
      });

      expect(result).toBe(null);
    });

    it('VALID: {Task tool_use on monitor session} => returns payload unchanged (filter passes Task tool_use through)', () => {
      monitorSessionFilterChatOutputTransformerProxy();
      const taskId = 'toolu_01TaskDispatch';
      const entry = TaskToolUseChatEntryStub({ source: 'session', toolUseId: taskId });
      const payload = makePayload([entry]);

      const result = monitorSessionFilterChatOutputTransformer({
        payload,
        payloadChatProcessId: ProcessIdStub({ value: 'proc-monitor-session-2' }),
        monitorTaskToolUseIds: new Set<ToolName>(),
      });

      expect(result).toStrictEqual({ payload });
    });

    it('VALID: {mixed batch on monitor session} => returns payload with surviving entries only', () => {
      monitorSessionFilterChatOutputTransformerProxy();
      const taskId = 'toolu_01MixedTask';
      const dispatcherText = AssistantTextChatEntryStub({
        source: 'session',
        content: 'dispatcher narration',
      });
      const taskUse = TaskToolUseChatEntryStub({ source: 'session', toolUseId: taskId });
      const payload = makePayload([dispatcherText, taskUse]);

      const result = monitorSessionFilterChatOutputTransformer({
        payload,
        payloadChatProcessId: ProcessIdStub({ value: 'proc-monitor-session-3' }),
        monitorTaskToolUseIds: new Set<ToolName>(),
      });

      expect(result).toStrictEqual({ payload: makePayload([taskUse]) });
    });

    it('EMPTY: {payload with no entries} => returns payload unchanged', () => {
      monitorSessionFilterChatOutputTransformerProxy();
      const payload = makePayload(undefined);

      const result = monitorSessionFilterChatOutputTransformer({
        payload,
        payloadChatProcessId: ProcessIdStub({ value: 'proc-monitor-session-4' }),
        monitorTaskToolUseIds: new Set<ToolName>(),
      });

      expect(result).toStrictEqual({ payload });
    });
  });
});
