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
              command: 'node',
              args: ['node_modules/@dungeonmaster/mcp/dist/src/index.js'],
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
              command: 'node',
              args: ['node_modules/@dungeonmaster/mcp/dist/src/index.js'],
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

    it('VALID: keeps server entries of another shape and unknown top-level keys', () => {
      const result = mcpConfigContract.parse({
        theme: 'dark',
        mcpServers: {
          remote: { type: 'http', url: 'https://example.test/mcp' },
        },
      });

      expect(result).toStrictEqual({
        theme: 'dark',
        mcpServers: {
          remote: { type: 'http', url: 'https://example.test/mcp' },
        },
      });
    });

    it('INVALID: rejects a server entry whose args is not an array', () => {
      expect(() => {
        return mcpConfigContract.parse({
          mcpServers: {
            dungeonmaster: {
              type: 'stdio',
              command: 'node',
              args: 'index.js',
            },
          },
        });
      }).toThrow('expected array');
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
            command: 'node',
            args: ['node_modules/@dungeonmaster/mcp/dist/src/index.js'],
          },
        },
      },
    });

    const result = McpConfigStub({ value });

    expect(result).toStrictEqual(value);
  });
});
