import type { StubArgument } from '@dungeonmaster/shared/@types';

import { mcpToolInputContract } from './mcp-tool-input-contract';
import type { McpToolInput } from './mcp-tool-input-contract';

export const McpToolInputStub = ({ ...props }: StubArgument<McpToolInput> = {}): McpToolInput =>
  mcpToolInputContract.parse({
    glob: 'packages/*/src/**',
    ...props,
  });
