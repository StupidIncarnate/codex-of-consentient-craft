import {
  AssistantToolUseStreamLineStub,
  AssistantTextStreamLineStub,
  SuccessfulToolResultStreamLineStub,
} from '@dungeonmaster/shared/contracts';

import { AgentIdStub } from '../../contracts/agent-id/agent-id.stub';
import { ChatLineSourceStub } from '../../contracts/chat-line-source/chat-line-source.stub';
import { StreamJsonLineStub } from '../../contracts/stream-json-line/stream-json-line.stub';
import { ToolUseIdStub } from '../../contracts/tool-use-id/tool-use-id.stub';
import { chatLineProcessTransformer } from './chat-line-process-transformer';

describe('chatLineProcessTransformer', () => {
  describe('basic line processing', () => {
    it('VALID: {assistant text line, source: session} => emits entry with source tag', () => {
      const processor = chatLineProcessTransformer();
      const line = StreamJsonLineStub({
        value: JSON.stringify(AssistantTextStreamLineStub()),
      });
      const source = ChatLineSourceStub({ value: 'session' });

      const result = processor.processLine({ line, source });

      expect(result).toStrictEqual([
        {
          type: 'entry',
          entry: {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [{ type: 'text', text: 'Hello, I can help with that.' }],
            },
            source: 'session',
          },
        },
      ]);
    });

    it('VALID: {user tool_result line, source: subagent} => emits entry with source tag', () => {
      const processor = chatLineProcessTransformer();
      const line = StreamJsonLineStub({
        value: JSON.stringify(SuccessfulToolResultStreamLineStub()),
      });
      const source = ChatLineSourceStub({ value: 'subagent' });

      const result = processor.processLine({ line, source });

      expect(result).toStrictEqual([
        {
          type: 'entry',
          entry: {
            type: 'user',
            message: {
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ',
                  content: 'File contents retrieved successfully',
                },
              ],
            },
            source: 'subagent',
          },
        },
      ]);
    });
  });

  describe('agent ID correlation', () => {
    it('VALID: {user tool_result with agentId followed by assistant Task tool_use} => attaches agentId to assistant entry', () => {
      const processor = chatLineProcessTransformer();
      const toolUseId = ToolUseIdStub({ value: 'toolu_task_01' });
      const agentId = AgentIdStub({ value: 'agent-abc' });
      const source = ChatLineSourceStub({ value: 'session' });

      const userLine = StreamJsonLineStub({
        value: JSON.stringify({
          ...SuccessfulToolResultStreamLineStub({
            message: {
              role: 'user',
              content: [{ type: 'tool_result', tool_use_id: toolUseId, content: 'done' }],
            },
          } as Parameters<typeof SuccessfulToolResultStreamLineStub>[0]),
          toolUseResult: { agentId },
        }),
      });

      const assistantLine = StreamJsonLineStub({
        value: JSON.stringify(
          AssistantToolUseStreamLineStub({
            message: {
              role: 'assistant',
              content: [{ type: 'tool_use', id: toolUseId, name: 'Task', input: {} }],
            },
          } as Parameters<typeof AssistantToolUseStreamLineStub>[0]),
        ),
      });

      processor.processLine({ line: userLine, source });
      const assistantResult = processor.processLine({ line: assistantLine, source });

      expect(assistantResult).toStrictEqual([
        {
          type: 'entry',
          entry: {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [{ type: 'tool_use', id: toolUseId, name: 'Task', input: {} }],
            },
            source: 'session',
            agentId: 'agent-abc',
          },
        },
      ]);
    });

    it('VALID: {assistant Task tool_use emitted first, then user tool_result with agentId} => emits patch', () => {
      const processor = chatLineProcessTransformer();
      const toolUseId = ToolUseIdStub({ value: 'toolu_task_02' });
      const agentId = AgentIdStub({ value: 'agent-xyz' });
      const source = ChatLineSourceStub({ value: 'session' });

      const assistantLine = StreamJsonLineStub({
        value: JSON.stringify(
          AssistantToolUseStreamLineStub({
            message: {
              role: 'assistant',
              content: [{ type: 'tool_use', id: toolUseId, name: 'Task', input: {} }],
            },
          } as Parameters<typeof AssistantToolUseStreamLineStub>[0]),
        ),
      });

      const userLine = StreamJsonLineStub({
        value: JSON.stringify({
          ...SuccessfulToolResultStreamLineStub({
            message: {
              role: 'user',
              content: [{ type: 'tool_result', tool_use_id: toolUseId, content: 'done' }],
            },
          } as Parameters<typeof SuccessfulToolResultStreamLineStub>[0]),
          toolUseResult: { agentId },
        }),
      });

      processor.processLine({ line: assistantLine, source });
      const userResult = processor.processLine({ line: userLine, source });

      expect(userResult).toStrictEqual([
        {
          type: 'patch',
          toolUseId: 'toolu_task_02',
          agentId: 'agent-xyz',
        },
        {
          type: 'entry',
          entry: {
            type: 'user',
            message: {
              role: 'user',
              content: [{ type: 'tool_result', tool_use_id: toolUseId, content: 'done' }],
            },
            toolUseResult: { agentId },
            source: 'session',
            agentId: 'agent-xyz',
          },
        },
      ]);
    });

    it('VALID: {user tool_result with agentId} => attaches agentId to user entry', () => {
      const processor = chatLineProcessTransformer();
      const toolUseId = ToolUseIdStub({ value: 'toolu_task_03' });
      const agentId = AgentIdStub({ value: 'agent-123' });
      const source = ChatLineSourceStub({ value: 'session' });

      const userLine = StreamJsonLineStub({
        value: JSON.stringify({
          ...SuccessfulToolResultStreamLineStub({
            message: {
              role: 'user',
              content: [{ type: 'tool_result', tool_use_id: toolUseId, content: 'done' }],
            },
          } as Parameters<typeof SuccessfulToolResultStreamLineStub>[0]),
          toolUseResult: { agentId },
        }),
      });

      const result = processor.processLine({ line: userLine, source });

      expect(result).toStrictEqual([
        {
          type: 'entry',
          entry: {
            type: 'user',
            message: {
              role: 'user',
              content: [{ type: 'tool_result', tool_use_id: toolUseId, content: 'done' }],
            },
            toolUseResult: { agentId },
            source: 'session',
            agentId: 'agent-123',
          },
        },
      ]);
    });
  });

  describe('explicit agentId parameter', () => {
    it('VALID: {assistant line with agentId param} => attaches agentId to assistant entry', () => {
      const processor = chatLineProcessTransformer();
      const agentId = AgentIdStub({ value: 'agent-explicit' });
      const source = ChatLineSourceStub({ value: 'subagent' });
      const line = StreamJsonLineStub({
        value: JSON.stringify(AssistantTextStreamLineStub()),
      });

      const result = processor.processLine({ line, source, agentId });

      expect(result).toStrictEqual([
        {
          type: 'entry',
          entry: {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [{ type: 'text', text: 'Hello, I can help with that.' }],
            },
            source: 'subagent',
            agentId: 'agent-explicit',
          },
        },
      ]);
    });
  });

  describe('filtered entry types', () => {
    it('EMPTY: {system message line} => returns empty array', () => {
      const processor = chatLineProcessTransformer();
      const source = ChatLineSourceStub({ value: 'session' });
      const line = StreamJsonLineStub({
        value: JSON.stringify({ type: 'system', message: 'init' }),
      });

      const result = processor.processLine({ line, source });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {result type line} => returns empty array', () => {
      const processor = chatLineProcessTransformer();
      const source = ChatLineSourceStub({ value: 'session' });
      const line = StreamJsonLineStub({
        value: JSON.stringify({ type: 'result', result: 'done' }),
      });

      const result = processor.processLine({ line, source });

      expect(result).toStrictEqual([]);
    });
  });

  describe('invalid JSON handling', () => {
    it('ERROR: {invalid JSON line} => returns empty array', () => {
      const processor = chatLineProcessTransformer();
      const source = ChatLineSourceStub({ value: 'session' });
      const line = StreamJsonLineStub({ value: 'not valid json' });

      const result = processor.processLine({ line, source });

      expect(result).toStrictEqual([]);
    });

    it('ERROR: {JSON null value} => returns empty array', () => {
      const processor = chatLineProcessTransformer();
      const source = ChatLineSourceStub({ value: 'session' });
      const line = StreamJsonLineStub({ value: 'null' });

      const result = processor.processLine({ line, source });

      expect(result).toStrictEqual([]);
    });

    it('ERROR: {JSON primitive number} => returns empty array', () => {
      const processor = chatLineProcessTransformer();
      const source = ChatLineSourceStub({ value: 'session' });
      const line = StreamJsonLineStub({ value: '42' });

      const result = processor.processLine({ line, source });

      expect(result).toStrictEqual([]);
    });
  });

  describe('user tool_result with toolUseResult but non-string agentId', () => {
    it('VALID: {toolUseResult with numeric agentId} => emits entry without agentId', () => {
      const processor = chatLineProcessTransformer();
      const source = ChatLineSourceStub({ value: 'session' });
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          ...SuccessfulToolResultStreamLineStub(),
          toolUseResult: { agentId: 123 },
        }),
      });

      const result = processor.processLine({ line, source });

      expect(result).toStrictEqual([
        {
          type: 'entry',
          entry: {
            type: 'user',
            message: {
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ',
                  content: 'File contents retrieved successfully',
                },
              ],
            },
            toolUseResult: { agentId: 123 },
            source: 'session',
          },
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

      const userLine = StreamJsonLineStub({
        value: JSON.stringify({
          ...SuccessfulToolResultStreamLineStub({
            message: {
              role: 'user',
              content: [{ type: 'tool_result', tool_use_id: toolUseId, content: 'done' }],
            },
          } as Parameters<typeof SuccessfulToolResultStreamLineStub>[0]),
          toolUseResult: { agentId: mapAgentId },
        }),
      });

      processor.processLine({ line: userLine, source });

      const assistantLine = StreamJsonLineStub({
        value: JSON.stringify(
          AssistantToolUseStreamLineStub({
            message: {
              role: 'assistant',
              content: [{ type: 'tool_use', id: toolUseId, name: 'Task', input: {} }],
            },
          } as Parameters<typeof AssistantToolUseStreamLineStub>[0]),
        ),
      });

      const result = processor.processLine({
        line: assistantLine,
        source,
        agentId: explicitAgentId,
      });

      expect(result).toStrictEqual([
        {
          type: 'entry',
          entry: {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [{ type: 'tool_use', id: toolUseId, name: 'Task', input: {} }],
            },
            source: 'subagent',
            agentId: 'agent-from-map',
          },
        },
      ]);
    });
  });

  describe('user tool_result without agentId', () => {
    it('EMPTY: {user tool_result without toolUseResult} => emits entry without agentId', () => {
      const processor = chatLineProcessTransformer();
      const source = ChatLineSourceStub({ value: 'session' });
      const line = StreamJsonLineStub({
        value: JSON.stringify(SuccessfulToolResultStreamLineStub()),
      });

      const result = processor.processLine({ line, source });

      expect(result).toStrictEqual([
        {
          type: 'entry',
          entry: {
            type: 'user',
            message: {
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ',
                  content: 'File contents retrieved successfully',
                },
              ],
            },
            source: 'session',
          },
        },
      ]);
    });
  });
});
