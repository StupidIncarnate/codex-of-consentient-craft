/**
 * PURPOSE: Pass-through for the npm package '@modelcontextprotocol/sdk/server'. Code outside the gateway imports @modelcontextprotocol/sdk/server
 * through here instead of the raw package, so a future guard or override on @modelcontextprotocol/sdk/server lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '@dungeonmaster/npm/@modelcontextprotocol/sdk/server';
 */

export * from '@modelcontextprotocol/sdk/server';
