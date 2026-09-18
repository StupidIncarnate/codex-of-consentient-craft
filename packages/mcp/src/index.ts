#!/usr/bin/env node
/**
 * PURPOSE: Entry point that starts the MCP server and handles initialization errors
 *
 * USAGE:
 * node dist/index.js
 * // Starts the MCP server process
 */
import { StartMcpServer } from './startup/start-mcp-server.js';

process.on('SIGTERM', () => {
  process.exit(0);
});

process.on('SIGINT', () => {
  process.exit(0);
});

StartMcpServer().catch((error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  process.stderr.write(`MCP server error: ${errorMessage}\n`);
  process.exit(1);
});
