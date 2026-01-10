import { mcpToolsStatics } from './mcp-tools-statics';

describe('mcpToolsStatics', () => {
  describe('server', () => {
    it('VALID: {server.name} => returns dungeonmaster', () => {
      expect(mcpToolsStatics.server.name).toBe('dungeonmaster');
    });
  });

  describe('tools', () => {
    it('VALID: {tools.names} => returns all 9 MCP tool names in order', () => {
      expect(mcpToolsStatics.tools.names).toStrictEqual([
        'discover',
        'get-architecture',
        'get-folder-detail',
        'get-syntax-rules',
        'get-testing-patterns',
        'add-quest',
        'get-quest',
        'modify-quest',
        'signal-cli-return',
      ]);
    });
  });
});
