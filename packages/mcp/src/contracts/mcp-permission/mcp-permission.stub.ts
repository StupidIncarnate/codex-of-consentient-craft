import { mcpPermissionContract, type McpPermission } from './mcp-permission-contract';

export const McpPermissionStub = (
  {
    value,
  }: {
    value: string;
  } = {
    value: 'mcp__dungeonmaster__get-architecture',
  },
): McpPermission => mcpPermissionContract.parse(value);
