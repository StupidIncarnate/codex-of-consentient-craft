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
