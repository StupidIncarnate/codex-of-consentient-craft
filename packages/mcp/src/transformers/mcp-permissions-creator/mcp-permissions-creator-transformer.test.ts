import { mcpPermissionsCreatorTransformer } from './mcp-permissions-creator-transformer';

describe('mcpPermissionsCreatorTransformer', () => {
  describe('permission generation', () => {
    it('VALID: {} => returns all 9 MCP permission strings with correct format', () => {
      const result = mcpPermissionsCreatorTransformer();

      expect(result).toStrictEqual([
        'mcp__dungeonmaster__discover',
        'mcp__dungeonmaster__get-architecture',
        'mcp__dungeonmaster__get-folder-detail',
        'mcp__dungeonmaster__get-syntax-rules',
        'mcp__dungeonmaster__get-testing-patterns',
        'mcp__dungeonmaster__add-quest',
        'mcp__dungeonmaster__get-quest',
        'mcp__dungeonmaster__modify-quest',
        'mcp__dungeonmaster__signal-cli-return',
      ]);
    });
  });
});
