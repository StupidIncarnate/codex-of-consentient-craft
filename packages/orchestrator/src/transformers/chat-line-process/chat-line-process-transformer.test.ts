import { snakeKeysToCamelKeysTransformer } from '@dungeonmaster/shared/transformers';
import {
  AssistantTextStreamLineStub,
  AssistantToolUseStreamLineStub,
  ResultStreamLineStub,
  SuccessfulToolResultStreamLineStub,
  SystemInitStreamLineStub,
} from '@dungeonmaster/shared/contracts';

import { AgentIdStub } from '../../contracts/agent-id/agent-id.stub';
import { ChatLineSourceStub } from '../../contracts/chat-line-source/chat-line-source.stub';
import { ToolUseIdStub } from '../../contracts/tool-use-id/tool-use-id.stub';
import { chatLineProcessTransformer } from './chat-line-process-transformer';

const normalize = (value: unknown): unknown => snakeKeysToCamelKeysTransformer({ value });

describe('chatLineProcessTransformer', () => {
  describe('basic line processing', () => {
    it('VALID: {assistant text line, source: session} => emits entries with source tag', () => {
      const processor = chatLineProcessTransformer();
      const parsed = normalize(AssistantTextStreamLineStub());
      const source = ChatLineSourceStub({ value: 'session' });

      const result = processor.processLine({ parsed, source });

      expect(result).toStrictEqual([
        {
          type: 'entries',
          entries: [
            {
              role: 'assistant',
              type: 'text',
              content: 'Hello, I can help with that.',
              source: 'session',
            },
          ],
        },
      ]);
    });

    it('VALID: {user tool_result line, source: subagent} => emits entries with source tag', () => {
      const processor = chatLineProcessTransformer();
      const parsed = normalize(SuccessfulToolResultStreamLineStub());
      const source = ChatLineSourceStub({ value: 'subagent' });

      const result = processor.processLine({ parsed, source });

      expect(result).toStrictEqual([
        {
          type: 'entries',
          entries: [
            {
              role: 'assistant',
              type: 'tool_result',
              toolName: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ',
              content: 'File contents retrieved successfully',
              source: 'subagent',
            },
          ],
        },
      ]);
    });
  });

  describe('agent ID correlation', () => {
    it('VALID: {user tool_result with agentId followed by assistant Task tool_use} => attaches agentId to assistant entries', () => {
      const processor = chatLineProcessTransformer();
      const toolUseId = ToolUseIdStub({ value: 'toolu_task_01' });
      const agentId = AgentIdStub({ value: 'agent-abc' });
      const source = ChatLineSourceStub({ value: 'session' });

      const userParsed = normalize({
        ...SuccessfulToolResultStreamLineStub({
          message: {
            role: 'user',
            content: [{ type: 'tool_result', tool_use_id: toolUseId, content: 'done' }],
          },
        } as Parameters<typeof SuccessfulToolResultStreamLineStub>[0]),
        toolUseResult: { agentId },
      });

      const assistantParsed = normalize(
        AssistantToolUseStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'tool_use', id: toolUseId, name: 'Task', input: {} }],
          },
        } as Parameters<typeof AssistantToolUseStreamLineStub>[0]),
      );

      processor.processLine({ parsed: userParsed, source });
      const assistantResult = processor.processLine({ parsed: assistantParsed, source });

      expect(assistantResult).toStrictEqual([
        {
          type: 'entries',
          entries: [
            {
              role: 'assistant',
              type: 'tool_use',
              toolUseId: 'toolu_task_01',
              toolName: 'Task',
              toolInput: '{}',
              source: 'session',
              agentId: 'agent-abc',
            },
          ],
        },
      ]);
    });

    it('VALID: {assistant Task tool_use emitted first, then user tool_result with agentId} => emits patch then entries', () => {
      const processor = chatLineProcessTransformer();
      const toolUseId = ToolUseIdStub({ value: 'toolu_task_02' });
      const agentId = AgentIdStub({ value: 'agent-xyz' });
      const source = ChatLineSourceStub({ value: 'session' });

      const assistantParsed = normalize(
        AssistantToolUseStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'tool_use', id: toolUseId, name: 'Task', input: {} }],
          },
        } as Parameters<typeof AssistantToolUseStreamLineStub>[0]),
      );

      const userParsed = normalize({
        ...SuccessfulToolResultStreamLineStub({
          message: {
            role: 'user',
            content: [{ type: 'tool_result', tool_use_id: toolUseId, content: 'done' }],
          },
        } as Parameters<typeof SuccessfulToolResultStreamLineStub>[0]),
        toolUseResult: { agentId },
      });

      processor.processLine({ parsed: assistantParsed, source });
      const userResult = processor.processLine({ parsed: userParsed, source });

      expect(userResult).toStrictEqual([
        {
          type: 'patch',
          toolUseId: 'toolu_task_02',
          agentId: 'agent-xyz',
        },
        {
          type: 'entries',
          entries: [
            {
              role: 'assistant',
              type: 'tool_result',
              toolName: 'toolu_task_02',
              content: 'done',
              source: 'session',
              agentId: 'agent-xyz',
            },
          ],
        },
      ]);
    });

    it('VALID: {user tool_result with agentId} => attaches agentId to entries', () => {
      const processor = chatLineProcessTransformer();
      const toolUseId = ToolUseIdStub({ value: 'toolu_task_03' });
      const agentId = AgentIdStub({ value: 'agent-123' });
      const source = ChatLineSourceStub({ value: 'session' });

      const userParsed = normalize({
        ...SuccessfulToolResultStreamLineStub({
          message: {
            role: 'user',
            content: [{ type: 'tool_result', tool_use_id: toolUseId, content: 'done' }],
          },
        } as Parameters<typeof SuccessfulToolResultStreamLineStub>[0]),
        toolUseResult: { agentId },
      });

      const result = processor.processLine({ parsed: userParsed, source });

      expect(result).toStrictEqual([
        {
          type: 'entries',
          entries: [
            {
              role: 'assistant',
              type: 'tool_result',
              toolName: 'toolu_task_03',
              content: 'done',
              source: 'session',
              agentId: 'agent-123',
            },
          ],
        },
      ]);
    });
  });

  describe('agent ID correlation with Agent tool name', () => {
    it('VALID: {assistant Agent tool_use emitted first, then user tool_result with agentId} => emits patch then entries', () => {
      const processor = chatLineProcessTransformer();
      const toolUseId = ToolUseIdStub({ value: 'toolu_agent_04' });
      const agentId = AgentIdStub({ value: 'agent-new-cli' });
      const source = ChatLineSourceStub({ value: 'session' });

      const assistantParsed = normalize(
        AssistantToolUseStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'tool_use', id: toolUseId, name: 'Agent', input: {} }],
          },
        } as Parameters<typeof AssistantToolUseStreamLineStub>[0]),
      );

      const userParsed = normalize({
        ...SuccessfulToolResultStreamLineStub({
          message: {
            role: 'user',
            content: [{ type: 'tool_result', tool_use_id: toolUseId, content: 'done' }],
          },
        } as Parameters<typeof SuccessfulToolResultStreamLineStub>[0]),
        toolUseResult: { agentId },
      });

      processor.processLine({ parsed: assistantParsed, source });
      const userResult = processor.processLine({ parsed: userParsed, source });

      expect(userResult).toStrictEqual([
        {
          type: 'patch',
          toolUseId: 'toolu_agent_04',
          agentId: 'agent-new-cli',
        },
        {
          type: 'entries',
          entries: [
            {
              role: 'assistant',
              type: 'tool_result',
              toolName: 'toolu_agent_04',
              content: 'done',
              source: 'session',
              agentId: 'agent-new-cli',
            },
          ],
        },
      ]);
    });

    it('VALID: {user tool_result with agentId followed by assistant Agent tool_use} => attaches agentId to entries', () => {
      const processor = chatLineProcessTransformer();
      const toolUseId = ToolUseIdStub({ value: 'toolu_agent_05' });
      const agentId = AgentIdStub({ value: 'agent-forward' });
      const source = ChatLineSourceStub({ value: 'session' });

      const userParsed = normalize({
        ...SuccessfulToolResultStreamLineStub({
          message: {
            role: 'user',
            content: [{ type: 'tool_result', tool_use_id: toolUseId, content: 'done' }],
          },
        } as Parameters<typeof SuccessfulToolResultStreamLineStub>[0]),
        toolUseResult: { agentId },
      });

      const assistantParsed = normalize(
        AssistantToolUseStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'tool_use', id: toolUseId, name: 'Agent', input: {} }],
          },
        } as Parameters<typeof AssistantToolUseStreamLineStub>[0]),
      );

      processor.processLine({ parsed: userParsed, source });
      const assistantResult = processor.processLine({ parsed: assistantParsed, source });

      expect(assistantResult).toStrictEqual([
        {
          type: 'entries',
          entries: [
            {
              role: 'assistant',
              type: 'tool_use',
              toolUseId: 'toolu_agent_05',
              toolName: 'Agent',
              toolInput: '{}',
              source: 'session',
              agentId: 'agent-forward',
            },
          ],
        },
      ]);
    });
  });

  describe('explicit agentId parameter', () => {
    it('VALID: {assistant line with agentId param} => attaches agentId to assistant entries', () => {
      const processor = chatLineProcessTransformer();
      const agentId = AgentIdStub({ value: 'agent-explicit' });
      const source = ChatLineSourceStub({ value: 'subagent' });
      const parsed = normalize(AssistantTextStreamLineStub());

      const result = processor.processLine({ parsed, source, agentId });

      expect(result).toStrictEqual([
        {
          type: 'entries',
          entries: [
            {
              role: 'assistant',
              type: 'text',
              content: 'Hello, I can help with that.',
              source: 'subagent',
              agentId: 'agent-explicit',
            },
          ],
        },
      ]);
    });

    it('VALID: {user tool_result line with agentId param, no toolUseResult} => attaches agentId to entries', () => {
      const processor = chatLineProcessTransformer();
      const agentId = AgentIdStub({ value: 'agent-subagent-internal' });
      const source = ChatLineSourceStub({ value: 'subagent' });
      const parsed = normalize(SuccessfulToolResultStreamLineStub());

      const result = processor.processLine({ parsed, source, agentId });

      expect(result).toStrictEqual([
        {
          type: 'entries',
          entries: [
            {
              role: 'assistant',
              type: 'tool_result',
              toolName: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ',
              content: 'File contents retrieved successfully',
              source: 'subagent',
              agentId: 'agent-subagent-internal',
            },
          ],
        },
      ]);
    });
  });

  describe('filtered entry types', () => {
    it('EMPTY: {system init line} => returns empty array', () => {
      const processor = chatLineProcessTransformer();
      const source = ChatLineSourceStub({ value: 'session' });
      const parsed = normalize(SystemInitStreamLineStub());

      const result = processor.processLine({ parsed, source });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {result type line} => returns empty array', () => {
      const processor = chatLineProcessTransformer();
      const source = ChatLineSourceStub({ value: 'session' });
      const parsed = normalize(ResultStreamLineStub());

      const result = processor.processLine({ parsed, source });

      expect(result).toStrictEqual([]);
    });
  });

  describe('non-object parsed input', () => {
    it('ERROR: {parsed: null} => returns empty array', () => {
      const processor = chatLineProcessTransformer();
      const source = ChatLineSourceStub({ value: 'session' });

      const result = processor.processLine({ parsed: null, source });

      expect(result).toStrictEqual([]);
    });

    it('ERROR: {parsed: 42} => returns empty array', () => {
      const processor = chatLineProcessTransformer();
      const source = ChatLineSourceStub({ value: 'session' });

      const result = processor.processLine({ parsed: 42, source });

      expect(result).toStrictEqual([]);
    });
  });

  describe('user tool_result with toolUseResult but non-string agentId', () => {
    it('VALID: {toolUseResult with numeric agentId} => emits entries without agentId', () => {
      const processor = chatLineProcessTransformer();
      const source = ChatLineSourceStub({ value: 'session' });
      const parsed = normalize({
        ...SuccessfulToolResultStreamLineStub(),
        toolUseResult: { agentId: 123 },
      });

      const result = processor.processLine({ parsed, source });

      expect(result).toStrictEqual([
        {
          type: 'entries',
          entries: [
            {
              role: 'assistant',
              type: 'tool_result',
              toolName: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ',
              content: 'File contents retrieved successfully',
              source: 'session',
            },
          ],
        },
      ]);
    });
  });

  describe('explicit agentId param skipped when map has agentId', () => {
    it('VALID: {assistant entry already has agentId from map, explicit agentId param given} => uses map agentId', () => {
      const processor = chatLineProcessTransformer();
      const toolUseId = ToolUseIdStub({ value: 'toolu_task_map_wins' });
      const mapAgentId = AgentIdStub({ value: 'agent-from-map' });
      const explicitAgentId = AgentIdStub({ value: 'agent-explicit-param' });
      const source = ChatLineSourceStub({ value: 'subagent' });

      const userParsed = normalize({
        ...SuccessfulToolResultStreamLineStub({
          message: {
            role: 'user',
            content: [{ type: 'tool_result', tool_use_id: toolUseId, content: 'done' }],
          },
        } as Parameters<typeof SuccessfulToolResultStreamLineStub>[0]),
        toolUseResult: { agentId: mapAgentId },
      });

      processor.processLine({ parsed: userParsed, source });

      const assistantParsed = normalize(
        AssistantToolUseStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'tool_use', id: toolUseId, name: 'Task', input: {} }],
          },
        } as Parameters<typeof AssistantToolUseStreamLineStub>[0]),
      );

      const result = processor.processLine({
        parsed: assistantParsed,
        source,
        agentId: explicitAgentId,
      });

      expect(result).toStrictEqual([
        {
          type: 'entries',
          entries: [
            {
              role: 'assistant',
              type: 'tool_use',
              toolUseId: 'toolu_task_map_wins',
              toolName: 'Task',
              toolInput: '{}',
              source: 'subagent',
              agentId: 'agent-from-map',
            },
          ],
        },
      ]);
    });
  });

  describe('user tool_result without agentId', () => {
    it('EMPTY: {user tool_result without toolUseResult} => emits entries without agentId', () => {
      const processor = chatLineProcessTransformer();
      const source = ChatLineSourceStub({ value: 'session' });
      const parsed = normalize(SuccessfulToolResultStreamLineStub());

      const result = processor.processLine({ parsed, source });

      expect(result).toStrictEqual([
        {
          type: 'entries',
          entries: [
            {
              role: 'assistant',
              type: 'tool_result',
              toolName: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ',
              content: 'File contents retrieved successfully',
              source: 'session',
            },
          ],
        },
      ]);
    });
  });

  describe('task-notification XML lifting (post-inflate shape)', () => {
    it('VALID: {user with content.taskNotification object} => lifts to top-level and coerces numeric fields', () => {
      const processor = chatLineProcessTransformer();
      const source = ChatLineSourceStub({ value: 'session' });

      const result = processor.processLine({
        parsed: {
          type: 'user',
          message: {
            role: 'user',
            content: {
              taskNotification: {
                taskId: 'acfc7f06a8ac21baf',
                status: 'completed',
                summary: 'Agent completed',
                result: 'Made both MCP calls successfully.',
                totalTokens: '28054',
                toolUses: '3',
                durationMs: '9033',
              },
            },
          },
        },
        source,
      });

      expect(result).toStrictEqual([
        {
          type: 'entries',
          entries: [
            {
              role: 'system',
              type: 'task_notification',
              taskId: 'acfc7f06a8ac21baf',
              status: 'completed',
              summary: 'Agent completed',
              result: 'Made both MCP calls successfully.',
              totalTokens: 28054,
              toolUses: 3,
              durationMs: 9033,
            },
          ],
        },
      ]);
    });

    it('VALID: {user text without taskNotification} => emits user entry', () => {
      const processor = chatLineProcessTransformer();
      const source = ChatLineSourceStub({ value: 'session' });

      const result = processor.processLine({
        parsed: {
          type: 'user',
          message: { role: 'user', content: 'regular user message' },
        },
        source,
      });

      expect(result).toStrictEqual([
        {
          type: 'entries',
          entries: [
            {
              role: 'user',
              content: 'regular user message',
              source: 'session',
            },
          ],
        },
      ]);
    });
  });

  describe('empty thinking sanitization', () => {
    it('VALID: {assistant with empty thinking item + text} => strips empty thinking, keeps text', () => {
      const processor = chatLineProcessTransformer();
      const source = ChatLineSourceStub({ value: 'session' });

      const result = processor.processLine({
        parsed: {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [
              { type: 'thinking', thinking: '', signature: 'EtQCencryptedblob' },
              { type: 'text', text: 'Hello.' },
            ],
          },
        },
        source,
      });

      expect(result).toStrictEqual([
        {
          type: 'entries',
          entries: [
            {
              role: 'assistant',
              type: 'text',
              content: 'Hello.',
              source: 'session',
            },
          ],
        },
      ]);
    });

    it('VALID: {assistant with non-empty thinking} => preserves thinking content', () => {
      const processor = chatLineProcessTransformer();
      const source = ChatLineSourceStub({ value: 'session' });

      const result = processor.processLine({
        parsed: {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [{ type: 'thinking', thinking: 'Let me consider this.', signature: 'sig' }],
          },
        },
        source,
      });

      expect(result).toStrictEqual([
        {
          type: 'entries',
          entries: [
            {
              role: 'assistant',
              type: 'thinking',
              content: 'Let me consider this.',
              source: 'session',
            },
          ],
        },
      ]);
    });

    it('VALID: {assistant with ONLY empty thinking} => emits entries with empty array', () => {
      const processor = chatLineProcessTransformer();
      const source = ChatLineSourceStub({ value: 'session' });

      const result = processor.processLine({
        parsed: {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [{ type: 'thinking', thinking: '', signature: 'sig' }],
          },
        },
        source,
      });

      expect(result).toStrictEqual([
        {
          type: 'entries',
          entries: [],
        },
      ]);
    });
  });
});
