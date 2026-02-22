import { dungeonmasterConfigCreatorTransformer } from './dungeonmaster-config-creator-transformer';

describe('dungeonmasterConfigCreatorTransformer', () => {
  it('VALID: creates dungeonmaster MCP server config', () => {
    const result = dungeonmasterConfigCreatorTransformer();

    expect('dungeonmaster' in result).toBe(true);

    const dungeonmasterConfig = Reflect.get(result, 'dungeonmaster');

    expect(dungeonmasterConfig).toStrictEqual({
      type: 'stdio',
      command: 'npx',
      args: ['tsx', 'node_modules/@dungeonmaster/mcp/src/index.ts'],
    });
  });

  it('VALID: returns config with correct structure', () => {
    const result = dungeonmasterConfigCreatorTransformer();

    const dungeonmasterConfig = Reflect.get(result, 'dungeonmaster');

    expect(dungeonmasterConfig.type).toBe('stdio');
    expect(dungeonmasterConfig.command).toBe('npx');
    expect(dungeonmasterConfig.args).toHaveLength(2);
    expect(dungeonmasterConfig.args[0]).toBe('tsx');
    expect(dungeonmasterConfig.args[1]).toBe('node_modules/@dungeonmaster/mcp/src/index.ts');
  });
});
