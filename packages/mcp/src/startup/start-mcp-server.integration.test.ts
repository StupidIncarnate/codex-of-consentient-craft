import { ToolListResultStub } from '../contracts/tool-list-result/tool-list-result.stub';

import { mcpServerHarness } from '../../test/harnesses/mcp-server/mcp-server.harness';

describe('StartMcpServer', () => {
  const mcp = mcpServerHarness();

  describe('wiring', () => {
    it('VALID: startup delegates to flows and returns all expected tools', async () => {
      const client = await mcp.createClient();

      const initRequest = mcp.buildInitRequest();

      await client.sendRequest(initRequest);

      const listRequest = mcp.buildToolListRequest();

      const response = await client.sendRequest(listRequest);

      await client.close();

      expect(response.error).toBe(undefined);

      const result = ToolListResultStub(response.result as never);

      expect(result.tools.length).toBeGreaterThanOrEqual(14);
    });
  });
});
