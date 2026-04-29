import type { StubArgument } from '@dungeonmaster/shared/@types';

import { toolResultBlockParamContract } from './tool-result-block-param-contract';
import type { ToolResultBlockParam } from './tool-result-block-param-contract';

/**
 * Successful tool result with string content — the most common case when a tool
 * executes and returns plain text output.
 */
export const ToolResultBlockParamStub = ({
  ...props
}: StubArgument<ToolResultBlockParam> = {}): ToolResultBlockParam =>
  toolResultBlockParamContract.parse({
    type: 'tool_result',
    tool_use_id: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ',
    content: 'File contents retrieved successfully.',
    ...props,
  });

/**
 * Error tool result — emitted when a tool call fails (e.g., permission denied,
 * command not found, or MCP tool rejected).
 */
export const ErrorToolResultBlockParamStub = ({
  ...props
}: StubArgument<ToolResultBlockParam> = {}): ToolResultBlockParam =>
  toolResultBlockParamContract.parse({
    type: 'tool_result',
    tool_use_id: 'toolu_016sbUuxidMBZVMKM9jpHsqK',
    content: "Claude requested permissions to use the tool, but you haven't granted it yet.",
    is_error: true,
    ...props,
  });

/**
 * Tool result with no content — emitted when a tool completes with no output
 * (e.g., a write-only tool that doesn't return data).
 */
export const EmptyToolResultBlockParamStub = ({
  ...props
}: StubArgument<ToolResultBlockParam> = {}): ToolResultBlockParam =>
  toolResultBlockParamContract.parse({
    type: 'tool_result',
    tool_use_id: 'toolu_01TaskDispatch7890abcd',
    ...props,
  });
