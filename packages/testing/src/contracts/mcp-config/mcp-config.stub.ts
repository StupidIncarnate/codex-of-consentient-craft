import type { StubArgument } from '@dungeonmaster/shared/@types';
import { mcpConfigContract } from './mcp-config-contract';
import type { McpConfig } from './mcp-config-contract';

export const McpConfigStub = ({ ...props }: StubArgument<McpConfig> = {}): McpConfig =>
  mcpConfigContract.parse({ ...props });
