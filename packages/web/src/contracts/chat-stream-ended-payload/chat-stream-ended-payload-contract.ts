/**
 * PURPOSE: Unified payload for chatStreamEnded$ — the channel surface that merges chat-complete and chat-history-complete wire events into a single typed observable. Carries the superset of both wire payloads' fields so consumers (chat binding, session-replay binding) read whichever ones their wire frame supplied, plus a `reason` naming which wire event produced it.
 *
 * USAGE:
 * chatStreamEndedPayloadContract.parse({reason: 'turn-ended', chatProcessId: 'proc-1' as ProcessId});
 * // Returns ChatStreamEndedPayload — `reason` always present; every other field optional, carrying whatever the source wire frame populated.
 *
 * `reason` exists because the two merged events mean opposite things to a consumer tracking whether
 * an agent turn is running. `turn-ended` (chat-complete) IS the turn finishing. `history-replayed`
 * (chat-history-complete) is the subscribe-quest replay draining — it fires ~250ms after a browser
 * binds a quest and says nothing about whether a turn is in flight. A consumer that treats the two
 * alike reports a just-sent message as idle.
 *
 * `retained` is a SECOND axis on top of `reason`, not a third reason: a retained frame is a real
 * `turn-ended`, re-sent by the server at the end of a `subscribe-quest` for a turn that finished
 * before this browser was listening. It stays distinguishable because the permissive arms of
 * `isTrackedChatProcessGuard` — which let a LIVE completion clear a turn whose POST has not
 * resolved yet — would let a re-delivery clear a turn it has nothing to do with.
 */

import { z } from 'zod';

import {
  processIdContract,
  questIdContract,
  sessionIdContract,
} from '@dungeonmaster/shared/contracts';

export const chatStreamEndedPayloadContract = z.object({
  reason: z.enum(['turn-ended', 'history-replayed']),
  chatProcessId: processIdContract.optional(),
  sessionId: sessionIdContract.optional(),
  questId: questIdContract.optional(),
  retained: z.boolean().optional(),
});

export type ChatStreamEndedPayload = z.infer<typeof chatStreamEndedPayloadContract>;
