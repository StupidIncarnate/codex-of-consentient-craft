import { claudePermissionContract, type ClaudePermission } from './claude-permission-contract';

export const ClaudePermissionStub = (
  {
    value,
  }: {
    value: string;
  } = {
    value: 'mcp__dungeonmaster__get-architecture',
  },
): ClaudePermission => claudePermissionContract.parse(value);
