import { McpServerStub } from './mcp-server.stub';

describe('McpServerStub', () => {
  it('VALID: {} => a real McpServer wrapping a real underlying Server, unconnected', () => {
    const mcpServer = McpServerStub();

    expect(mcpServer.server.getClientVersion()).toBe(undefined);
  });
});
