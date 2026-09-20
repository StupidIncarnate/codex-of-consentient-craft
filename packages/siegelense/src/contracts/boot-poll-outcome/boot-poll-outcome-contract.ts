/**
 * PURPOSE: What one pass of `instanceStartBootPollLayerBroker` learned — `ready` once the driver's
 * socket answers `ping` ok, `timeout` once `deadlineMs` passes with no marker and no answer, or
 * `failed` the moment a `BootFailureMarker` shows up beside the instance's evidence, carrying the
 * driver's own `.message` straight through. A `z.discriminatedUnion('status', …)` rather than one
 * object with an optional `message` — `instanceStartBroker` branches on which of the three happened,
 * and a `failed` outcome with no `message` (or a `ready` one WITH one) is a shape this contract
 * refuses rather than a case a caller has to remember to check for.
 *
 * USAGE:
 * bootPollOutcomeContract.parse({ status: 'ready' });
 * // Returns the 'ready' member of the BootPollOutcome union
 *
 * bootPollOutcomeContract.parse({ status: 'failed', message: 'CLAUDE_CLI_PATH is required' });
 * // Returns the 'failed' member, carrying the driver's own message
 */

import { z } from 'zod';

import { contentTextContract } from '@dungeonmaster/shared/contracts';

export const bootPollOutcomeContract = z.discriminatedUnion('status', [
  z.object({ status: z.literal('ready') }).strict(),
  z.object({ status: z.literal('timeout') }).strict(),
  z.object({ status: z.literal('failed'), message: contentTextContract }).strict(),
]);

export type BootPollOutcome = z.infer<typeof bootPollOutcomeContract>;
