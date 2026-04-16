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
