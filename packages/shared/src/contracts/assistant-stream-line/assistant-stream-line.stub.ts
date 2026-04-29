import type { StubArgument } from '@dungeonmaster/shared/@types';

import { assistantStreamLineContract } from './assistant-stream-line-contract';
import type { AssistantStreamLine } from './assistant-stream-line-contract';

/**
 * Assistant responding with plain text - the most common response type.
 * Occurs when Claude answers a question or provides information without invoking tools.
 */
export const AssistantTextStreamLineStub = ({
  ...props
}: StubArgument<AssistantStreamLine> = {}): AssistantStreamLine =>
  assistantStreamLineContract.parse({
    type: 'assistant',
    message: {
      role: 'assistant',
      content: [{ type: 'text', text: 'Hello, I can help with that.' }],
    },
    ...props,
  });

/**
 * Assistant requesting a tool execution - tool_use content item.
 * Occurs when Claude decides to call a tool (Bash, Read, Write, etc.) during a session.
 */
export const AssistantToolUseStreamLineStub = ({
  ...props
}: StubArgument<AssistantStreamLine> = {}): AssistantStreamLine =>
  assistantStreamLineContract.parse({
    type: 'assistant',
    message: {
      role: 'assistant',
      content: [
        {
          type: 'tool_use',
          id: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ',
          name: 'Bash',
          input: { command: 'ls -la' },
        },
      ],
    },
    ...props,
  });

/**
 * Assistant message carrying a tool result - tool_result content item.
 * Occurs when a tool execution result is relayed back through the assistant message stream.
 */
export const AssistantToolResultStreamLineStub = ({
  ...props
}: StubArgument<AssistantStreamLine> = {}): AssistantStreamLine =>
  assistantStreamLineContract.parse({
    type: 'assistant',
    message: {
      role: 'assistant',
      content: [
        {
          type: 'tool_result',
          tool_use_id: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ',
          content: 'file1.ts\nfile2.ts',
        },
      ],
    },
    ...props,
  });

/**
 * Assistant message with mixed content - text explanation followed by a tool call, plus usage stats.
 * Occurs when Claude explains what it will do and immediately invokes a tool in the same turn.
 */
export const AssistantMixedContentStreamLineStub = ({
  ...props
}: StubArgument<AssistantStreamLine> = {}): AssistantStreamLine =>
  assistantStreamLineContract.parse({
    type: 'assistant',
    message: {
      role: 'assistant',
      content: [
        { type: 'text', text: 'Let me check that file.' },
        {
          type: 'tool_use',
          id: 'toolu_01XYZ',
          name: 'Read',
          input: { file_path: '/src/index.ts' },
        },
      ],
      usage: { input_tokens: 100, output_tokens: 50 },
    },
    ...props,
  });

/**
 * Assistant message with thinking content - extended thinking block.
 * Occurs when Claude uses extended thinking to reason through a problem before responding.
 */
export const AssistantThinkingStreamLineStub = ({
  ...props
}: StubArgument<AssistantStreamLine> = {}): AssistantStreamLine =>
  assistantStreamLineContract.parse({
    type: 'assistant',
    message: {
      role: 'assistant',
      content: [{ type: 'thinking', thinking: 'I need to consider the user request carefully.' }],
    },
    ...props,
  });

/**
 * Assistant message with a redacted_thinking content item — Claude CLI emits this distinct type
 * when extended thinking output has been encrypted server-side. The `data` field carries the
 * cryptographic blob. Renderers should skip this item; there is no displayable content.
 */
export const AssistantRedactedThinkingStreamLineStub = ({
  ...props
}: StubArgument<AssistantStreamLine> = {}): AssistantStreamLine =>
  assistantStreamLineContract.parse({
    type: 'assistant',
    message: {
      role: 'assistant',
      content: [
        {
          type: 'redacted_thinking',
          data: 'EtQCClkIDBgCKkDr4oLptwx6b6TDFpBewoaZg35pJ2vjLn2mMCK4mi+redactedblob',
        },
      ],
    },
    ...props,
  });

/**
 * Assistant dispatching a sub-agent via the Task tool.
 * Occurs when the main session spawns an Explore/sub-agent. The id must appear in
 * the paired TaskToolResultStreamLineStub so the chat-line processor can correlate
 * toolUseResult.agentId back to this entry and render a sub-agent chain.
 */
export const AssistantTaskToolUseStreamLineStub = ({
  ...props
}: StubArgument<AssistantStreamLine> = {}): AssistantStreamLine =>
  assistantStreamLineContract.parse({
    type: 'assistant',
    message: {
      role: 'assistant',
      content: [
        {
          type: 'tool_use',
          id: 'toolu_01TaskDispatch7890abcd',
          name: 'Task',
          input: {
            description: 'Explore the auth flow',
            prompt: 'Research the auth system and report back with file paths and purposes.',
            subagent_type: 'Explore',
          },
        },
      ],
    },
    ...props,
  });

/**
 * Assistant invoking mcp__dungeonmaster__ask-user-question with a typed question set.
 * Occurs when ChaosWhisperer pauses mid-clarification and surfaces a dropdown modal in the UI.
 * The AskUserQuestionToolResultStreamLineStub follows immediately; the user's actual answer arrives
 * as the NEXT user text message (e.g., "Database Selection: PostgreSQL").
 */
export const AssistantAskUserQuestionStreamLineStub = ({
  ...props
}: StubArgument<AssistantStreamLine> = {}): AssistantStreamLine =>
  assistantStreamLineContract.parse({
    type: 'assistant',
    message: {
      role: 'assistant',
      content: [
        {
          type: 'tool_use',
          id: 'toolu_01AskUserQuestion7890',
          name: 'mcp__dungeonmaster__ask-user-question',
          input: {
            questions: [
              {
                question: 'Which database do you want to use?',
                header: 'Database Selection',
                options: [
                  { label: 'PostgreSQL', description: 'Relational database with JSONB support' },
                  { label: 'SQLite', description: 'Lightweight file-based database' },
                ],
                multiSelect: false,
              },
            ],
          },
        },
      ],
    },
    ...props,
  });

/**
 * Assistant message as emitted by Claude CLI mid-turn — `stop_reason` and `model` arrive as
 * explicit `null` before the turn settles. The pre-fix `.optional()` schema rejected this shape
 * and silently dropped EVERY streamed assistant line, so the web saw only user/tool_result
 * entries. Use this stub in tests that exercise streaming line parsing to lock in the fix.
 */
export const AssistantNullStopReasonStreamLineStub = ({
  ...props
}: StubArgument<AssistantStreamLine> = {}): AssistantStreamLine =>
  assistantStreamLineContract.parse({
    type: 'assistant',
    message: {
      role: 'assistant',
      stop_reason: null,
      stop_sequence: null,
      content: [
        {
          type: 'tool_use',
          id: 'toolu_01F4wgY95Em86z1oALfMC8KK',
          name: 'mcp__dungeonmaster__discover',
          input: { glob: 'packages/web/src/widgets/quest-chat/**' },
        },
      ],
    },
    ...props,
  });

/**
 * Assistant invoking Read on a file path.
 * Occurs when a sub-agent inspects a file during exploration. Inside a sub-agent's JSONL,
 * the paired user tool_result carries the file contents; tests replaying sub-agent chains
 * use this plus SuccessfulToolResultStreamLineStub to reproduce the inner tool_use/tool_result pair.
 */
export const AssistantReadToolUseStreamLineStub = ({
  ...props
}: StubArgument<AssistantStreamLine> = {}): AssistantStreamLine =>
  assistantStreamLineContract.parse({
    type: 'assistant',
    message: {
      role: 'assistant',
      content: [
        {
          type: 'tool_use',
          id: 'toolu_01ReadFile7890abcd',
          name: 'Read',
          input: { file_path: '/src/index.ts' },
        },
      ],
    },
    ...props,
  });

/**
 * Assistant message where tool_result carries an array of mixed content blocks instead of a plain string.
 * Rare but legal per SDK — occurs when a tool returns structured content (e.g. text + image) rather
 * than a flat string. The content array uses the same discriminated union as assistant message content.
 */
export const AssistantToolResultArrayContentStreamLineStub = ({
  ...props
}: StubArgument<AssistantStreamLine> = {}): AssistantStreamLine =>
  assistantStreamLineContract.parse({
    type: 'assistant',
    message: {
      role: 'assistant',
      content: [
        {
          type: 'tool_result',
          tool_use_id: 'toolu_01ArrayResult7890abcd',
          content: [{ type: 'text', text: 'line one\nline two' }],
        },
      ],
    },
    ...props,
  });

/**
 * Assistant thinking block carrying a non-empty cryptographic signature.
 * Occurs when extended thinking is used on a model that supports cache continuity — the Claude
 * CLI includes the signature so the server can resume the thinking cache across turns.
 * Renderers display the thinking text and may use the signature for cache diagnostics.
 */
export const AssistantThinkingWithSignatureStreamLineStub = ({
  ...props
}: StubArgument<AssistantStreamLine> = {}): AssistantStreamLine =>
  assistantStreamLineContract.parse({
    type: 'assistant',
    message: {
      role: 'assistant',
      content: [
        {
          type: 'thinking',
          thinking: 'I need to reason through the architecture carefully before proceeding.',
          signature: 'EtQCClkIDBgCKkDr4oLptwx6b6TDFpBewoaZg35pJ2vjLn2mMCK4mi+sigblob',
        },
      ],
    },
    ...props,
  });

/**
 * Assistant message with both text and thinking blocks in the same content array.
 * Occurs when extended thinking produces visible reasoning followed by a prose response
 * in a single assistant turn. The thinking block always precedes the text block.
 */
export const AssistantMixedTextThinkingStreamLineStub = ({
  ...props
}: StubArgument<AssistantStreamLine> = {}): AssistantStreamLine =>
  assistantStreamLineContract.parse({
    type: 'assistant',
    message: {
      role: 'assistant',
      content: [
        { type: 'thinking', thinking: 'Let me think about the best approach here.' },
        {
          type: 'text',
          text: 'Based on my analysis, the best approach is to refactor the broker.',
        },
      ],
    },
    ...props,
  });

/**
 * Assistant message carrying both tool_use and tool_result in the same content array.
 * Rare CLI shape — occurs in multi-turn tool loops where the model echoes a prior result
 * alongside a new tool invocation in the same streamed assistant message.
 */
export const AssistantMixedToolUseToolResultStreamLineStub = ({
  ...props
}: StubArgument<AssistantStreamLine> = {}): AssistantStreamLine =>
  assistantStreamLineContract.parse({
    type: 'assistant',
    message: {
      role: 'assistant',
      content: [
        {
          type: 'tool_use',
          id: 'toolu_01MixedUse7890abcd',
          name: 'Bash',
          input: { command: 'cat /tmp/output.txt' },
        },
        {
          type: 'tool_result',
          tool_use_id: 'toolu_01MixedUse7890abcd',
          content: 'output line one\noutput line two',
        },
      ],
    },
    ...props,
  });
