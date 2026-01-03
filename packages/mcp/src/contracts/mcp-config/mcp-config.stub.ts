import type { StubArgument } from '@dungeonmaster/shared/@types';
import type { McpConfig } from './mcp-config-contract';
import { mcpConfigContract } from './mcp-config-contract';

export const McpConfigStub = ({ value }: { value: StubArgument<McpConfig> }): McpConfig =>
  mcpConfigContract.parse(value);
