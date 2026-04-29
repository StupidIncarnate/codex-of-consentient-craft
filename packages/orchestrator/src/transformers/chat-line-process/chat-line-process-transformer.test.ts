import { snakeKeysToCamelKeysTransformer } from '@dungeonmaster/shared/transformers';
import {
  AssistantNullStopReasonStreamLineStub,
  AssistantTextStreamLineStub,
  AssistantToolUseStreamLineStub,
  MixedArrayToolResultStreamLineStub,
  ResultStreamLineStub,
  SuccessfulToolResultStreamLineStub,
  SystemInitStreamLineStub,
  ToolReferenceArrayToolResultStreamLineStub,
} from '@dungeonmaster/shared/contracts';

import { AgentIdStub } from '../../contracts/agent-id/agent-id.stub';
import { ChatLineSourceStub } from '../../contracts/chat-line-source/chat-line-source.stub';
import { ToolUseIdStub } from '../../contracts/tool-use-id/tool-use-id.stub';
import { chatLineProcessTransformer } from './chat-line-process-transformer';

const normalize = (value: unknown): unknown => snakeKeysToCamelKeysTransformer({ value });

describe('chatLineProcessTransformer', () => {
  describe('regression: Claude CLI null stop_reason on streamed deltas', () => {
    it('VALID: {assistant tool_use with stop_reason: null} => emits the tool_use entry (does not silently drop)', () => {
      const processor = chatLineProcessTransformer();
      const parsed = normalize(AssistantNullStopReasonStreamLineStub());
      const source = ChatLineSourceStub({ value: 'session' });

      const result = processor.processLine({ parsed, source });

      expect(result).toStrictEqual([
        {
          type: 'entries',
          entries: [
            {
              role: 'assistant',
              type: 'tool_use',
              toolUseId: 'toolu_01F4wgY95Em86z1oALfMC8KK',
              toolName: 'mcp__dungeonmaster__discover',
              toolInput: '{"glob":"packages/web/src/widgets/quest-chat/**"}',
              source: 'session',
            },
          ],
        },
      ]);
    });
  });

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

    it('VALID: {tool_reference array content tool_result} => emits tool_result entry projecting each tool_reference as its toolName', () => {
      // Real Claude CLI emits MCP ToolSearch results as a tool_result whose `content` is an
      // array of `{ type: 'tool_reference', tool_name: '…' }` blocks. Per the SDK's
      // ToolResultBlockParam.content union, every variant must surface in the rendered text;
      // tool_reference items project to their `toolName`, joined with newlines.
      const processor = chatLineProcessTransformer();
      const parsed = normalize(ToolReferenceArrayToolResultStreamLineStub());
      const source = ChatLineSourceStub({ value: 'session' });

      const result = processor.processLine({ parsed, source });

      expect(result).toStrictEqual([
        {
          type: 'entries',
          entries: [
            {
              role: 'assistant',
              type: 'tool_result',
              toolName: 'toolu_01ToolSearch1234abcd',
              content: 'mcp__dungeonmaster__get-quest\nmcp__dungeonmaster__list-quests',
              source: 'session',
            },
          ],
        },
      ]);
    });

    it('VALID: {mixed text+tool_reference array content tool_result} => emits tool_result entry joining text + tool_reference variants', () => {
      const processor = chatLineProcessTransformer();
      const parsed = normalize(MixedArrayToolResultStreamLineStub());
      const source = ChatLineSourceStub({ value: 'session' });

      const result = processor.processLine({ parsed, source });

      expect(result).toStrictEqual([
        {
          type: 'entries',
          entries: [
            {
              role: 'assistant',
              type: 'tool_result',
              toolName: 'toolu_01MixedArray7890qrst',
              content: 'Found the following tools:\nmcp__dungeonmaster__discover',
              source: 'session',
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
              // Wire-level agentId is the Task's own toolUseId (eager stamping). The "real"
              // internal agentId from tool_use_result is NOT used as the web-side chain key
              // any more — it surfaces via the `agent-detected` output for internal routing.
              agentId: 'toolu_task_01',
            },
          ],
        },
      ]);
    });

    it('VALID: {assistant Task tool_use emitted first, then user tool_result with agentId} => emits agent-detected then entries', () => {
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
          type: 'agent-detected',
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

      // Processing a user tool_result with tool_use_result.agentId emits BOTH an
      // agent-detected signal (so chat-spawn-broker can bootstrap the sub-agent tail) AND
      // the tool_result ChatEntry. The tool_result carries no agentId; collect-subagent-chains
      // pins it to the chain via `toolName` (= the tool_use_id).
      expect(result).toStrictEqual([
        {
          type: 'agent-detected',
          toolUseId: 'toolu_task_03',
          agentId: 'agent-123',
        },
        {
          type: 'entries',
          entries: [
            {
              role: 'assistant',
              type: 'tool_result',
              toolName: 'toolu_task_03',
              content: 'done',
              source: 'session',
            },
          ],
        },
      ]);
    });
  });

  describe('agent ID correlation with Agent tool name', () => {
    it('VALID: {assistant Agent tool_use emitted first, then user tool_result with agentId} => emits agent-detected then entries', () => {
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
          type: 'agent-detected',
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
              // Eager stamp: agentId = toolUseId. The real internal agentId from the prior
              // tool_use_result surfaces via the agent-detected output, not on the entry.
              agentId: 'toolu_agent_05',
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

  describe('file-path sub-agent translation via the reverse agentId map', () => {
    it('VALID: {sub-agent line arrives with real agentId param after user tool_result registered that agentId} => translates to parent_tool_use_id shape and sets source=subagent', () => {
      // This is the file-replay path: the sub-agent JSONL line is tagged with the real
      // internal agentId from its filename. The processor should translate that to the
      // Task's toolUseId so the emitted entry has the SAME agentId as streaming-sourced
      // entries — making chain grouping on the web identical regardless of source.
      const processor = chatLineProcessTransformer();
      const toolUseId = ToolUseIdStub({ value: 'toolu_task_map_wins' });
      const realAgentId = AgentIdStub({ value: 'agent-from-map' });
      const source = ChatLineSourceStub({ value: 'subagent' });

      const userParsed = normalize({
        ...SuccessfulToolResultStreamLineStub({
          message: {
            role: 'user',
            content: [{ type: 'tool_result', tool_use_id: toolUseId, content: 'done' }],
          },
        } as Parameters<typeof SuccessfulToolResultStreamLineStub>[0]),
        toolUseResult: { agentId: realAgentId },
      });

      processor.processLine({
        parsed: userParsed,
        source: ChatLineSourceStub({ value: 'session' }),
      });

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
        agentId: realAgentId,
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
              // The realAgentId was translated via the reverse map to toolUseId, so the
              // wire-level agentId is the same as the streaming-sourced variant.
              agentId: 'toolu_task_map_wins',
            },
          ],
        },
      ]);
    });

    it('VALID: {sub-agent file line with agentId param and EMPTY reverse map} => falls back to agentId param unchanged (orphan sub-agent file)', () => {
      // When the reverse map has NO translation seeded for this realAgentId (e.g. the
      // sub-agent JSONL file survived but its parent session's tool_use_result was never
      // processed — orphan case), the processor must not stamp a bogus parent_tool_use_id.
      // Instead, the explicit agentId param falls through unchanged so the entry still
      // ships, just without being grouped under a parent Task.
      const processor = chatLineProcessTransformer();
      const orphanAgentId = AgentIdStub({ value: 'agent-orphan-subagent' });
      const source = ChatLineSourceStub({ value: 'subagent' });

      const assistantParsed = normalize(
        AssistantTextStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: 'orphan line' }],
          },
        } as Parameters<typeof AssistantTextStreamLineStub>[0]),
      );

      const result = processor.processLine({
        parsed: assistantParsed,
        source,
        agentId: orphanAgentId,
      });

      expect(result).toStrictEqual([
        {
          type: 'entries',
          entries: [
            {
              role: 'assistant',
              type: 'text',
              content: 'orphan line',
              source: 'subagent',
              // Reverse-map lookup missed, so parent_tool_use_id was NOT synthesized.
              // The agentId param falls through as the raw real internal id.
              agentId: 'agent-orphan-subagent',
            },
          ],
        },
      ]);
    });
  });

  describe('streaming sub-agent line with parent_tool_use_id (step 2 of convergence)', () => {
    it('VALID: {streaming assistant text line with parent_tool_use_id, source: session} => forces source=subagent and stamps agentId=parentToolUseId', () => {
      // The streaming path: a sub-agent line arrives on parent stdout carrying
      // `parent_tool_use_id` (snake_case from Claude CLI). Even though the caller passes
      // source='session', the processor MUST override to 'subagent' and stamp the Task's
      // toolUseId as agentId — that's the wire-level correlation key the web uses to
      // group the chain.
      const processor = chatLineProcessTransformer();
      const source = ChatLineSourceStub({ value: 'session' });

      const parsed = normalize({
        type: 'assistant',
        parent_tool_use_id: 'toolu_stream_parent_01',
        message: {
          role: 'assistant',
          content: [{ type: 'text', text: 'I am the sub-agent speaking.' }],
        },
      });

      const result = processor.processLine({ parsed, source });

      expect(result).toStrictEqual([
        {
          type: 'entries',
          entries: [
            {
              role: 'assistant',
              type: 'text',
              content: 'I am the sub-agent speaking.',
              // parent_tool_use_id forces source to 'subagent' regardless of caller's value.
              source: 'subagent',
              // Eager stamp: agentId is the parent Task's toolUseId, not the real
              // internal agentId.
              agentId: 'toolu_stream_parent_01',
            },
          ],
        },
      ]);
    });

    it('VALID: {streaming user tool_result line with parent_tool_use_id} => forces source=subagent and stamps agentId=parentToolUseId', () => {
      // Streaming sub-agent lines can also be user tool_result lines (the sub-agent
      // reports its own tool results on parent stdout with parent_tool_use_id).
      const processor = chatLineProcessTransformer();
      const source = ChatLineSourceStub({ value: 'session' });

      const parsed = normalize({
        type: 'user',
        parent_tool_use_id: 'toolu_stream_parent_02',
        message: {
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: 'toolu_subagent_inner_call',
              content: 'inner sub-agent result',
            },
          ],
        },
      });

      const result = processor.processLine({ parsed, source });

      expect(result).toStrictEqual([
        {
          type: 'entries',
          entries: [
            {
              role: 'assistant',
              type: 'tool_result',
              toolName: 'toolu_subagent_inner_call',
              content: 'inner sub-agent result',
              source: 'subagent',
              agentId: 'toolu_stream_parent_02',
            },
          ],
        },
      ]);
    });
  });

  describe('registerAgentTranslation pre-seeding (replay pre-scan path)', () => {
    it('VALID: {pre-seed translation, then feed sub-agent file line with matching real agentId} => emits entry with pre-seeded toolUseId as agentId', () => {
      // The replay broker pre-scans the main JSONL and calls registerAgentTranslation
      // for every realAgentId↔toolUseId mapping BEFORE it iterates lines in timestamp
      // order. This is required because sub-agent file lines sort earlier than their own
      // completion tool_result; without the pre-seeding, they'd fail reverse-map lookup.
      const processor = chatLineProcessTransformer();
      const preSeededToolUseId = ToolUseIdStub({ value: 'toolu_preseed_01' });
      const realAgentId = AgentIdStub({ value: 'agent-preseeded' });
      const source = ChatLineSourceStub({ value: 'subagent' });

      processor.registerAgentTranslation({
        agentId: realAgentId,
        toolUseId: preSeededToolUseId,
      });

      const parsed = normalize(
        AssistantTextStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: 'hello from replay' }],
          },
        } as Parameters<typeof AssistantTextStreamLineStub>[0]),
      );

      const result = processor.processLine({ parsed, source, agentId: realAgentId });

      expect(result).toStrictEqual([
        {
          type: 'entries',
          entries: [
            {
              role: 'assistant',
              type: 'text',
              content: 'hello from replay',
              // The pre-seeded translation resolved realAgentId → toolUseId, so the
              // emitted entry's agentId is the parent Task's toolUseId.
              source: 'subagent',
              agentId: 'toolu_preseed_01',
            },
          ],
        },
      ]);
    });
  });

  describe('resolveToolUseIdForAgent lookup API', () => {
    it('VALID: {registerAgentTranslation then resolveToolUseIdForAgent with same agentId} => returns the registered toolUseId', () => {
      const processor = chatLineProcessTransformer();
      const toolUseId = ToolUseIdStub({ value: 'toolu_resolve_01' });
      const realAgentId = AgentIdStub({ value: 'agent-resolve' });

      processor.registerAgentTranslation({ agentId: realAgentId, toolUseId });

      const resolved = processor.resolveToolUseIdForAgent({ agentId: realAgentId });

      expect(resolved).toBe('toolu_resolve_01');
    });

    it('VALID: {resolveToolUseIdForAgent on empty map} => returns undefined', () => {
      const processor = chatLineProcessTransformer();
      const unknownAgentId = AgentIdStub({ value: 'agent-never-seen' });

      const resolved = processor.resolveToolUseIdForAgent({ agentId: unknownAgentId });

      expect(resolved).toBe(undefined);
    });

    it('VALID: {user tool_result with toolUseResult.agentId populates the map, then resolveToolUseIdForAgent} => returns the live-populated toolUseId', () => {
      // Live population path: as tool_use_result lines flow through processLine, the
      // reverse map is populated. resolveToolUseIdForAgent must reflect that state.
      const processor = chatLineProcessTransformer();
      const toolUseId = ToolUseIdStub({ value: 'toolu_live_populated' });
      const realAgentId = AgentIdStub({ value: 'agent-live' });
      const source = ChatLineSourceStub({ value: 'session' });

      const userParsed = normalize({
        ...SuccessfulToolResultStreamLineStub({
          message: {
            role: 'user',
            content: [{ type: 'tool_result', tool_use_id: toolUseId, content: 'done' }],
          },
        } as Parameters<typeof SuccessfulToolResultStreamLineStub>[0]),
        toolUseResult: { agentId: realAgentId },
      });

      processor.processLine({ parsed: userParsed, source });

      const resolved = processor.resolveToolUseIdForAgent({ agentId: realAgentId });

      expect(resolved).toBe('toolu_live_populated');
    });
  });

  describe('streaming vs file source shape parity', () => {
    it('VALID: {same assistant text payload via streaming parent_tool_use_id vs file source with pre-seeded map} => emits identical ChatEntry shape', () => {
      // The whole point of the convergence: both source paths must produce the SAME
      // ChatEntry on the wire so collect-subagent-chains on the web can key on agentId
      // without caring which source the line came from. If this invariant ever breaks,
      // chain grouping silently shows (0 entries) for one of the two paths.
      const toolUseId = ToolUseIdStub({ value: 'toolu_parity_01' });
      const realAgentId = AgentIdStub({ value: 'agent-parity' });

      // Path A: streaming — line already has parent_tool_use_id
      const streamingProcessor = chatLineProcessTransformer();
      const streamingParsed = normalize({
        type: 'assistant',
        parent_tool_use_id: toolUseId,
        message: {
          role: 'assistant',
          content: [{ type: 'text', text: 'Hello, I can help with that.' }],
        },
      });
      const streamingResult = streamingProcessor.processLine({
        parsed: streamingParsed,
        source: ChatLineSourceStub({ value: 'session' }),
      });

      // Path B: file source with pre-seeded map — caller passes realAgentId param,
      // processor looks up toolUseId in the reverse map and synthesizes parent_tool_use_id.
      const fileProcessor = chatLineProcessTransformer();
      fileProcessor.registerAgentTranslation({ agentId: realAgentId, toolUseId });
      const fileParsed = normalize({
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [{ type: 'text', text: 'Hello, I can help with that.' }],
        },
      });
      const fileResult = fileProcessor.processLine({
        parsed: fileParsed,
        source: ChatLineSourceStub({ value: 'subagent' }),
        agentId: realAgentId,
      });

      // Both paths produce the SAME ChatEntry[] output. The agentId is the parent
      // Task's toolUseId (the wire-level correlation key), source is 'subagent', and
      // content/role/type all match.
      expect(streamingResult).toStrictEqual(fileResult);
      expect(streamingResult).toStrictEqual([
        {
          type: 'entries',
          entries: [
            {
              role: 'assistant',
              type: 'text',
              content: 'Hello, I can help with that.',
              source: 'subagent',
              agentId: 'toolu_parity_01',
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
              source: 'session',
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
