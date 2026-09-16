/**
 * PURPOSE: The whole frame the driver sends back over the socket — `ok` says whether the request it
 * answered succeeded, `payload` stays an opaque `ContentText` for the same reason `driverRequestContract`'s
 * does (each `kind` owns its own decode on the way out too — `runResultContract` for `run`, empty for
 * `ping`/`kill`), and `error` is the driver's OWN report of a failure it hit WHILE IT WAS ALIVE TO
 * REPORT ONE — a `payload` that failed `runRequestContract.safeParse`, a step that threw before
 * producing a `RunResult`. It never carries "the driver is gone": a socket that refuses to connect, or
 * one that never answers inside `driverStatics.socket.requestTimeoutMs`, throws
 * `DriverUnreachableError` before a `DriverResponse` is ever parsed, and `kill` catches that to take
 * the orphan-reap path instead of reading this shape at all — the crash/kill/never-existed question is
 * answered one layer up, by whether a `DriverResponse` arrives here at all, not by a field inside it.
 *
 * USAGE:
 * driverResponseContract.parse({
 *   ok: true,
 *   payload: '{"instanceId":"inst_7f3a9c21","runId":"run_1",...}',
 *   error: null,
 * });
 * // Returns a validated DriverResponse
 */

import { z } from 'zod';

import { contentTextContract } from '@dungeonmaster/shared/contracts';

export const driverResponseContract = z.object({
  ok: z.boolean(),
  payload: contentTextContract,
  error: contentTextContract.nullable(),
});

export type DriverResponse = z.infer<typeof driverResponseContract>;
