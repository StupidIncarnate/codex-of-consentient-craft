import type { StubArgument } from '@dungeonmaster/shared/@types';

import { mcpPreToolUseHookDataContract } from './mcp-pre-tool-use-hook-data-contract';
import type { McpPreToolUseHookData } from './mcp-pre-tool-use-hook-data-contract';

export const McpPreToolUseHookDataStub = ({
  ...props
}: StubArgument<McpPreToolUseHookData> = {}): McpPreToolUseHookData =>
  mcpPreToolUseHookDataContract.parse({
    session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    cwd: '/home/user/repo',
    hook_event_name: 'PreToolUse',
    tool_name: 'mcp__dungeonmaster__discover',
    tool_input: { glob: 'packages/*/src/**' },
    ...props,
  });
