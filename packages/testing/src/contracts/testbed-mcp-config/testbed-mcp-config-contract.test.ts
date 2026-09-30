import { testbedMcpConfigContract } from './testbed-mcp-config-contract';
import { TestbedMcpConfigStub } from './testbed-mcp-config.stub';

describe('testbedMcpConfigContract', () => {
  describe('valid inputs', () => {
    it('EMPTY: {} => parses with no keys', () => {
      expect(TestbedMcpConfigStub()).toStrictEqual({});
    });

    it('VALID: {mcpServers, extra key} => keeps every key', () => {
      const config = testbedMcpConfigContract.parse({
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
      const result = testbedMcpConfigContract.safeParse({ mcpServers: 'x' });

      expect(result.success).toBe(false);
    });
  });
});
