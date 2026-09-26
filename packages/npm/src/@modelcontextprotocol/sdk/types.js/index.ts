/**
 * PURPOSE: Pass-through for the npm package '@modelcontextprotocol/sdk/types.js'. Code outside the gateway imports @modelcontextprotocol/sdk/types.js
 * through here instead of the raw package, so a future guard or override on @modelcontextprotocol/sdk/types.js lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '@dungeonmaster/npm/@modelcontextprotocol/sdk/types.js';
 */

export * from '@modelcontextprotocol/sdk/types.js';
