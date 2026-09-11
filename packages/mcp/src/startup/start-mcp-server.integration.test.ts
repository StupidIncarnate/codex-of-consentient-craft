import { ToolListResultStub } from '../contracts/tool-list-result/tool-list-result.stub';

import { mcpServerHarness } from '../../test/harnesses/mcp-server/mcp-server.harness';

describe('StartMcpServer', () => {
  const mcp = mcpServerHarness();

  // Booting the server is the SUITE's cost, not this test's: `createClient` spawns `npx tsx` over
  // the source entry and then probes stdio until it answers. Measured with the spawn inside the
  // test, the one test here read 4901ms — almost all of it the child reaching readiness, which
  // ward's slow-test gate then reported as a slow TEST. jest runs beforeAll outside the window it
  // charges to a test, so the boot belongs here, which is also what the sibling
  // flows/mcp-server/mcp-server-flow.integration.test.ts already does.
  let client: Awaited<ReturnType<typeof mcp.createClient>>;

  beforeAll(async () => {
    client = await mcp.createClient();
    await client.sendRequest(mcp.buildInitRequest());
  });

  afterAll(async () => {
    await client.close();
  });

  describe('wiring', () => {
    it('VALID: startup delegates to flows and returns all expected tools', async () => {
      const listRequest = mcp.buildToolListRequest();

      const response = await client.sendRequest(listRequest);

      expect(response.error).toBe(undefined);

      const result = ToolListResultStub(response.result as never);

      expect(result.tools.length).toBeGreaterThanOrEqual(14);
    });
  });
});
