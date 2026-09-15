/**
 * PURPOSE: The byte length of a booted lane's server log file, as `LaneSession.serverLogLength()`
 * reports it and `readServerLogSince({ fromByte })` slices against. A standalone contract rather than
 * a brand declared inline in `lane-session-contract.ts`: the value is constructed inside
 * `server-log-reader-layer-broker.ts`, a `brokers/` file, and a broker may not import `zod` directly
 * to brand a number itself — it has to reach for an already-exported contract the way it reaches for
 * any other.
 *
 * USAGE:
 * serverLogByteCountContract.parse(1024);
 * // Returns a branded ServerLogByteCount
 */

import { z } from 'zod';

export const serverLogByteCountContract = z
  .number()
  .int()
  .nonnegative()
  .brand<'ServerLogByteCount'>();

export type ServerLogByteCount = z.infer<typeof serverLogByteCountContract>;
