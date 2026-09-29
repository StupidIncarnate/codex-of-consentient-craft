#!/usr/bin/env node
/**
 * PURPOSE: Entry point that starts the MCP server and handles initialization errors
 *
 * USAGE:
 * node dist/index.js
 * // Starts the MCP server process
 */
import { exit, on, stderr } from '#gateway/node/process';

import { StartMcpServer } from './startup/start-mcp-server.js';

on('SIGTERM', () => {
  exit(0);
});

on('SIGINT', () => {
  exit(0);
});

StartMcpServer().catch((error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  stderr.write(`MCP server error: ${errorMessage}\n`);
  exit(1);
});
