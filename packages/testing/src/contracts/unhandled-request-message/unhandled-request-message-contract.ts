/**
 * PURPOSE: Brands one human-readable line describing an HTTP request or WebSocket connection MSW
 * caught with nothing staged for it. Reach for this over `networkLogEntryContract` when the only
 * job is a message `assertNoUnhandledRequests` can throw verbatim — that contract's structured
 * fields (method, url, timestamp, bodies) exist to reconstruct a request for stderr diagnostics,
 * which this never does.
 *
 * USAGE:
 * unhandledRequestMessageContract.parse('GET http://localhost/api/missing');
 * // Returns a branded UnhandledRequestMessage
 */

import { z } from 'zod';

export const unhandledRequestMessageContract = z.string().brand<'UnhandledRequestMessage'>();

export type UnhandledRequestMessage = z.infer<typeof unhandledRequestMessageContract>;
