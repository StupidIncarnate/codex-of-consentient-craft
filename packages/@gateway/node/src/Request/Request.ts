/**
 * PURPOSE: Pass-through for the global `Request`. Code outside the gateway
 * builds a fetch request through here instead of the raw global, so a future guard lands in this
 * one file and reaches every caller.
 *
 * USAGE:
 * import { Request } from '#gateway/node/Request';
 * const request = new Request('http://localhost/api/guilds', { method: 'POST' });
 */

export const { Request } = globalThis;
