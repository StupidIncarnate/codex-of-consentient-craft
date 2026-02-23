import type { StubArgument } from '@dungeonmaster/shared/@types';

import { userToolResultStreamLineContract } from './user-tool-result-stream-line-contract';
import type { UserToolResultStreamLine } from './user-tool-result-stream-line-contract';

/**
 * MCP tool permission denied - agent calls a tool the user hasn't approved yet.
 * Claude CLI returns this as a user message with is_error: true.
 */
export const PermissionDeniedStreamLineStub = ({
  ...props
}: StubArgument<UserToolResultStreamLine> = {}): UserToolResultStreamLine =>
  userToolResultStreamLineContract.parse({
    type: 'user',
    message: {
      role: 'user',
      content: [
        {
          type: 'tool_result',
          tool_use_id: 'toolu_016sbUuxidMBZVMKM9jpHsqK',
          content:
            "Claude requested permissions to use mcp__dungeonmaster__list-guilds, but you haven't granted it yet.",
          is_error: true,
        },
      ],
    },
    ...props,
  });

/**
 * Successful tool result - tool executed and returned output.
 * Standard tool completion path with content from the tool.
 */
export const SuccessfulToolResultStreamLineStub = ({
  ...props
}: StubArgument<UserToolResultStreamLine> = {}): UserToolResultStreamLine =>
  userToolResultStreamLineContract.parse({
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
    ...props,
  });

/**
 * Mixed user message - text prompt alongside a tool result.
 * Occurs when Claude CLI bundles user text with a pending tool result in the same message.
 */
export const MixedTextAndToolResultStreamLineStub = ({
  ...props
}: StubArgument<UserToolResultStreamLine> = {}): UserToolResultStreamLine =>
  userToolResultStreamLineContract.parse({
    type: 'user',
    message: {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'User follow-up message',
        },
        {
          type: 'tool_result',
          tool_use_id: 'toolu_015sb5Rz8yPMN4sbwdNaz8kk',
          content: 'Read 42 lines from file',
        },
      ],
    },
    ...props,
  });

/**
 * User message with only text content - no tool results.
 * Represents a plain user prompt with no tool result items to extract.
 */
export const TextOnlyUserStreamLineStub = ({
  ...props
}: StubArgument<UserToolResultStreamLine> = {}): UserToolResultStreamLine =>
  userToolResultStreamLineContract.parse({
    type: 'user',
    message: {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Just a user message',
        },
      ],
    },
    ...props,
  });
