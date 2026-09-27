/**
 * PURPOSE: Pass-through for the npm package '@modelcontextprotocol/sdk/server/mcp.js'. Code outside the gateway imports @modelcontextprotocol/sdk/server/mcp.js
 * through here instead of the raw package, so a future guard or override on @modelcontextprotocol/sdk/server/mcp.js lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '#gateway/npm/modelcontextprotocol__sdk__server__mcp';
 */

export * from '@modelcontextprotocol/sdk/server/mcp.js';
