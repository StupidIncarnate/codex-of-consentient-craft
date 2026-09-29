/**
 * PURPOSE: Pass-through for the global `Response`. Code outside the
 * gateway builds a response through here instead of the raw global, so a future guard lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { Response } from '#gateway/node/Response';
 * const response = new Response('ok', { status: 200 });
 */

export const { Response } = globalThis;
