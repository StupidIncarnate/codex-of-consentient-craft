/**
 * PURPOSE: Builds a valid McpDiscoverResult for tests
 *
 * USAGE:
 * McpDiscoverResultStub();
 * // Returns a valid McpDiscoverResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { mcpDiscoverResultContract } from './mcp-discover-result-contract';
import type { McpDiscoverResult } from './mcp-discover-result-contract';

export const McpDiscoverResultStub = ({
  ...props
}: StubArgument<McpDiscoverResult> = {}): McpDiscoverResult =>
  mcpDiscoverResultContract.parse({ results: [], count: 0, ...props });
