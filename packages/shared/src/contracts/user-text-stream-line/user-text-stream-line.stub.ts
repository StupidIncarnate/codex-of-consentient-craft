import type { StubArgument } from '@dungeonmaster/shared/@types';

import { userTextStreamLineContract } from './user-text-stream-line-contract';
import type { UserTextStreamLine } from './user-text-stream-line-contract';

/**
 * User message with string content form.
 */
export const UserTextStringStreamLineStub = ({
  ...props
}: StubArgument<UserTextStreamLine> = {}): UserTextStreamLine =>
  userTextStreamLineContract.parse({
    type: 'user',
    message: {
      role: 'user',
      content: 'Hello',
    },
    ...props,
  });

/**
 * User message with array content form.
 */
export const UserTextArrayStreamLineStub = ({
  ...props
}: StubArgument<UserTextStreamLine> = {}): UserTextStreamLine =>
  userTextStreamLineContract.parse({
    type: 'user',
    message: {
      role: 'user',
      content: [{ type: 'text', text: 'Hello' }],
    },
    ...props,
  });

/**
 * Task-notification user-text message — Claude CLI appends these to the main session JSONL
 * when a background (async) agent dispatch completes. The XML body carries task-id, status,
 * and optional summary/result/usage fields. The outer envelope is still `type: 'user'` with
 * `content` as a string.
 */
export const TaskNotificationUserTextStreamLineStub = ({
  ...props
}: StubArgument<UserTextStreamLine> = {}): UserTextStreamLine =>
  userTextStreamLineContract.parse({
    type: 'user',
    message: {
      role: 'user',
      content: [
        '<task-notification>',
        '<task-id>acfc7f06a8ac21baf</task-id>',
        '<tool-use-id>toolu_01R7DU7d8xnhW2pSnw3T9bbx</tool-use-id>',
        '<status>completed</status>',
        '<summary>Agent "MCP calls test - background sub-agent" completed</summary>',
        '<result>Background agent B: made both MCP calls successfully.</result>',
        '<usage><total_tokens>28054</total_tokens><tool_uses>3</tool_uses><duration_ms>9033</duration_ms></usage>',
        '</task-notification>',
      ].join('\n'),
    },
    ...props,
  });
