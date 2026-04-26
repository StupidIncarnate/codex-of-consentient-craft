import { dungeonmasterConfigCreatorTransformer } from './dungeonmaster-config-creator-transformer';

describe('dungeonmasterConfigCreatorTransformer', () => {
  it('VALID: creates dungeonmaster MCP server config', () => {
    const result = dungeonmasterConfigCreatorTransformer();

    expect('dungeonmaster' in result).toBe(true);

    const [dungeonmasterConfig] = Object.values(result);

    expect(dungeonmasterConfig).toStrictEqual({
      type: 'stdio',
      command: 'node',
      args: ['node_modules/@dungeonmaster/mcp/dist/src/index.js'],
    });
  });

  it('VALID: returns config with correct structure', () => {
    const result = dungeonmasterConfigCreatorTransformer();

    const [dungeonmasterConfig] = Object.values(result);

    expect(dungeonmasterConfig).toStrictEqual({
      type: 'stdio',
      command: 'node',
      args: ['node_modules/@dungeonmaster/mcp/dist/src/index.js'],
    });
  });
});
