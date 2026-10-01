import { mcpServerStatusInitLineContract } from './mcp-server-status-init-line-contract';
import { McpServerStatusInitLineStub } from './mcp-server-status-init-line.stub';

describe('mcpServerStatusInitLineContract', () => {
  describe('valid init lines', () => {
    it('VALID: {default stub} => parses the server list', () => {
      const line = McpServerStatusInitLineStub();

      expect(mcpServerStatusInitLineContract.parse(line)).toStrictEqual({
        type: 'system',
        subtype: 'init',
        mcp_servers: [
          { name: 'webstorm', status: 'connected' },
          { name: 'dungeonmaster', status: 'failed' },
        ],
      });
    });

    it('VALID: {init line carrying other keys} => strips them and keeps the server list', () => {
      expect(
        mcpServerStatusInitLineContract.parse({
          type: 'system',
          subtype: 'init',
          session_id: 'abc',
          tools: ['Bash'],
          mcp_servers: [],
        }),
      ).toStrictEqual({ type: 'system', subtype: 'init', mcp_servers: [] });
    });
  });

  describe('invalid lines', () => {
    it('INVALID: {subtype: "hook_started"} => throws', () => {
      expect(() =>
        mcpServerStatusInitLineContract.parse({
          type: 'system',
          subtype: 'hook_started',
          mcp_servers: [],
        }),
      ).toThrow(/Invalid input: expected \\"init\\"/u);
    });

    it('INVALID: {init line with no mcp_servers} => throws', () => {
      expect(() =>
        mcpServerStatusInitLineContract.parse({ type: 'system', subtype: 'init' }),
      ).toThrow(/received undefined/u);
    });
  });
});
