import type { StubArgument } from '@dungeonmaster/shared/@types';

import { mcpServerStatusInitLineContract } from './mcp-server-status-init-line-contract';
import type { McpServerStatusInitLine } from './mcp-server-status-init-line-contract';

// The server list the CLI reported in a worktree whose MCP entry crashed at load: the project
// server `failed`, the user-level servers `connected`.
export const McpServerStatusInitLineStub = ({
  ...props
}: StubArgument<McpServerStatusInitLine> = {}): McpServerStatusInitLine =>
  mcpServerStatusInitLineContract.parse({
    type: 'system',
    subtype: 'init',
    mcp_servers: [
      { name: 'webstorm', status: 'connected' },
      { name: 'dungeonmaster', status: 'failed' },
    ],
    ...props,
  });
