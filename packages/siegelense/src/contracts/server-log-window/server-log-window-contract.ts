/**
 * PURPOSE: The byte range of the booted lane's `api-server.log` a single step's dispatch fell inside,
 * read before and after the verb ran. Reach for this over copying server-log lines into a fourth
 * per-instance jsonl file: the server log is already an append-only file on disk, so duplicating it
 * would be the same disk growth siegelense-tooling.md line 218 names — `results { kind: 'server' }`
 * slices the real log by this range instead, and `where: { steps: '6-8' }` unions the windows of
 * several steps.
 *
 * USAGE:
 * serverLogWindowContract.parse({ fromByte: 1024, toByte: 2048 });
 * // Returns a validated ServerLogWindow
 */

import { z } from 'zod';

import { serverLogByteCountContract } from '../server-log-byte-count/server-log-byte-count-contract';

export const serverLogWindowContract = z.object({
  fromByte: serverLogByteCountContract,
  toByte: serverLogByteCountContract,
});

export type ServerLogWindow = z.infer<typeof serverLogWindowContract>;
