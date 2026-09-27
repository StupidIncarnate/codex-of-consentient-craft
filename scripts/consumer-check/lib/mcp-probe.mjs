/**
 * Boots the consumer's own installed `@dungeonmaster/mcp` server over stdio and speaks the real
 * MCP JSON-RPC handshake (`initialize` -> `notifications/initialized` -> `tools/list`) against it —
 * the same protocol Claude Code's own MCP client speaks, so a green result here means a real
 * session's `.mcp.json` entry would actually connect, not just that the file resolves.
 */

import { spawnLongLived } from './proc.mjs';

const PROTOCOL_VERSION = '2024-11-05';

export const probeMcpToolList = async ({ command, args, cwd, env }) => {
  const child = spawnLongLived({ command, args, cwd, env });
  try {
    const initResponse = await child.sendRequest({
      request: {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: {},
          clientInfo: { name: 'consumer-check', version: '0.0.0' },
        },
      },
    });

    child.sendNotification({
      notification: { jsonrpc: '2.0', method: 'notifications/initialized' },
    });

    const toolsResponse = await child.sendRequest({
      request: { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
    });

    return { initResponse, toolsResponse, stderr: child.readStderr() };
  } finally {
    child.close();
  }
};
