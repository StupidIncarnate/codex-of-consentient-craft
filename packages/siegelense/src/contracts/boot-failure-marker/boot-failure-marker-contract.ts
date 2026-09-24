/**
 * PURPOSE: The on-disk shape a driver process writes beside its instance's evidence the moment its
 * own boot throws — before the process exits — so a caller polling the driver's socket has a second
 * place to learn WHY a connection refusal is really a dead driver and not a slow one. `message` is
 * the failing error's own `.message`, verbatim: the caller re-surfaces it rather than inventing a
 * second description of the same failure. `atMs` exists so a reader inspecting the file directly can
 * tell a stale marker left over from an EARLIER boot attempt apart from the one this poll is waiting
 * on, the same reason `instanceHeartbeatContract` carries its own `beatAtMs`.
 *
 * USAGE:
 * bootFailureMarkerContract.parse({
 *   message: 'the api process exited before opening its port',
 *   atMs: 1700000000000,
 * });
 * // Returns a validated BootFailureMarker
 */

import { z } from 'zod';

import { contentTextContract } from '@dungeonmaster/shared/contracts';

import { epochMsContract } from '../epoch-ms/epoch-ms-contract';

export const bootFailureMarkerContract = z.object({
  message: contentTextContract,
  atMs: epochMsContract,
});

export type BootFailureMarker = z.infer<typeof bootFailureMarkerContract>;
