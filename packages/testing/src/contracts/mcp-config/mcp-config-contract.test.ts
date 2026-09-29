import { mcpConfigContract } from './mcp-config-contract';
import { McpConfigStub } from './mcp-config.stub';

describe('mcpConfigContract', () => {
  describe('valid inputs', () => {
    it('EMPTY: {} => parses with no keys', () => {
      expect(McpConfigStub()).toStrictEqual({});
    });

    it('VALID: {mcpServers, extra key} => keeps every key', () => {
      const config = mcpConfigContract.parse({
        mcpServers: { dungeonmaster: { command: 'node' } },
        extra: true,
      });

      expect(config).toStrictEqual({
        mcpServers: { dungeonmaster: { command: 'node' } },
        extra: true,
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {mcpServers: string} => safeParse fails', () => {
      const result = mcpConfigContract.safeParse({ mcpServers: 'x' });

      expect(result.success).toBe(false);
    });
  });
});
