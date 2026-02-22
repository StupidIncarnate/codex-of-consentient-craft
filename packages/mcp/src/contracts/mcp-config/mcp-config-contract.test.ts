import { mcpConfigContract } from './mcp-config-contract';
import { McpConfigStub } from './mcp-config.stub';

describe('mcpConfigContract', () => {
  describe('parse()', () => {
    it('VALID: parses valid MCP config with dungeonmaster server', () => {
      const input = McpConfigStub({
        value: {
          mcpServers: {
            dungeonmaster: {
              type: 'stdio',
              command: 'npx',
              args: ['tsx', 'node_modules/@dungeonmaster/mcp/src/index.ts'],
            },
          },
        },
      });

      const result = mcpConfigContract.parse(input);

      expect(result).toStrictEqual(input);
    });

    it('VALID: parses config with multiple servers', () => {
      const input = McpConfigStub({
        value: {
          mcpServers: {
            dungeonmaster: {
              type: 'stdio',
              command: 'npx',
              args: ['tsx', 'node_modules/@dungeonmaster/mcp/src/index.ts'],
            },
            other: {
              type: 'http',
              command: 'node',
              args: ['server.js'],
            },
          },
        },
      });

      const result = mcpConfigContract.parse(input);

      expect(result).toStrictEqual(input);
    });

    it('VALID: parses config without mcpServers', () => {
      const input = McpConfigStub({ value: {} });

      const result = mcpConfigContract.parse(input);

      expect(result).toStrictEqual(input);
    });

    it('INVALID: rejects config with invalid server structure', () => {
      expect(() => {
        return mcpConfigContract.parse({
          mcpServers: {
            dungeonmaster: {
              type: 'stdio',
              // missing command and args
            },
          },
        });
      }).toThrow('Required');
    });
  });
});

describe('McpConfigStub', () => {
  it('VALID: creates stub from value', () => {
    const value = McpConfigStub({
      value: {
        mcpServers: {
          dungeonmaster: {
            type: 'stdio',
            command: 'npx',
            args: ['tsx', 'node_modules/@dungeonmaster/mcp/src/index.ts'],
          },
        },
      },
    });

    const result = McpConfigStub({ value });

    expect(result).toStrictEqual(value);
  });
});
