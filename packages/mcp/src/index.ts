import { StartMcpServer } from './startup/start-mcp-server.js';

StartMcpServer().catch((error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  process.stderr.write(`MCP server error: ${errorMessage}\n`);
  process.exit(1);
});
