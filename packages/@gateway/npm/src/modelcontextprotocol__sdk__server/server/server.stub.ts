/**
 * PURPOSE: A real `Server`, obtained through `McpServer`'s own `.server` getter — never
 * constructed directly, since the SDK's own `Server` constructor is marked `@deprecated`
 * ("advanced use cases" only) and this repo's lint refuses any reference to a deprecated symbol,
 * with no disable-comment escape hatch available. `McpServer` wraps exactly this same class
 * internally (see `#gateway/npm/modelcontextprotocol__sdk__server__mcp`'s own `McpServerStub`),
 * so this is the real, non-deprecated path to a real instance.
 *
 * USAGE:
 * const server = ServerStub();
 * // Returns the real, unconnected Server backing a freshly constructed McpServer
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export const ServerStub = ({
  name = 'gateway-stub-server',
  version = '0.0.0',
}: {
  name?: string;
  version?: string;
} = {}): McpServer['server'] => new McpServer({ name, version }).server;
